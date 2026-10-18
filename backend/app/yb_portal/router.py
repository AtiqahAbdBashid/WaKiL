"""YB-portal routes: signed-token login plus staff admin, on the shared database.

Same /api/* paths, response shapes ({staff}, {user}) and 401/403/404
semantics the frontend already calls.
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db

from . import service
from .domain import (
    ROLES,
    STATUSES,
    can_claim_group,
    can_manage_staff,
    can_reassign,
    can_resolve_owned,
    can_set_status,
    can_view_staff,
    has_access,
    is_terminal_status,
    is_valid_status,
)
from .kawasan import kod_feature, negeri_view

router = APIRouter()

TOKEN_TTL_SECONDS = 12 * 60 * 60
# Tokens are signed with STAFF_TOKEN_SECRET; without it a random per-process
# secret is used and every restart signs staff out.
_SECRET = (os.getenv("STAFF_TOKEN_SECRET") or secrets.token_hex(32)).encode()


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def encode_token(staff_id: str) -> str:
    payload = _b64(json.dumps({"sub": staff_id, "exp": int(time.time()) + TOKEN_TTL_SECONDS}).encode())
    signature = _b64(hmac.new(_SECRET, payload.encode(), hashlib.sha256).digest())
    return f"{payload}.{signature}"


def decode_token(token: str) -> str | None:
    try:
        payload, signature = token.split(".")
        expected = _b64(hmac.new(_SECRET, payload.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            return None
        claims = json.loads(_unb64(payload))
        return claims["sub"] if claims["exp"] > time.time() else None
    except Exception:
        return None


class LoginIn(BaseModel):
    email: str | None = None
    idToken: str | None = None


class AduanPatch(BaseModel):
    status: str | None = None
    case_group_id: str | None = None
    assigneeId: str | None = None
    needsRepresentativeAttention: bool | None = None


class ResolveIn(BaseModel):
    reason: str
    repeatInGroup: bool = False


class UpdateIn(BaseModel):
    detail: str
    attachmentName: str | None = None
    repeatInGroup: bool = False


class CaseGroupIn(BaseModel):
    title: str
    category: str | None = None
    complaintIds: list[str] | None = None
    ownerStaffId: str | None = None


class PullIn(BaseModel):
    dest_group_id: str


class ConfirmIn(BaseModel):
    complaintIds: list[str] | None = None
    complaint_ids: list[str] | None = None


class TransferIn(BaseModel):
    owner_staff_id: str


class StaffInviteIn(BaseModel):
    email: str
    role: str
    name: str | None = Field(default=None, max_length=100)


class StaffActiveIn(BaseModel):
    active: bool = True


def get_current_staff(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing token")
    user = service.get_staff(db, decode_token(authorization[7:].strip()))
    staff = service.staff_view(user) if user else None
    if not has_access(staff):
        raise HTTPException(status_code=401, detail="session expired")
    return staff


def require_viewer(staff: dict = Depends(get_current_staff)) -> dict:
    if not can_view_staff(staff["role"]):
        raise HTTPException(status_code=403, detail="forbidden")
    return staff


def require_manager(staff: dict = Depends(get_current_staff)) -> dict:
    if not can_manage_staff(staff["role"]):
        raise HTTPException(status_code=403, detail="forbidden")
    return staff


@router.get("/api/health")
def health():
    return {"ok": True}


# Stand-in login: looks the staff member up by email. Real OAuth/OpenID
# verification comes later (ADR-0003), so anyone who knows a staff email can sign in.
@router.post("/api/auth/google")
def google_login(payload: LoginIn, db: Session = Depends(get_db)):
    lookup = payload.email or payload.idToken
    if not lookup:
        raise HTTPException(status_code=400, detail="email or idToken required")
    user = service.get_staff_by_email(db, lookup)
    staff = service.staff_view(user) if user else None
    if not has_access(staff):
        raise HTTPException(status_code=401, detail="no access")
    return {"token": encode_token(staff["id"]), "user": staff}


@router.get("/api/me")
def me(staff: dict = Depends(get_current_staff)):
    return {"user": staff}


@router.get("/api/aduan")
def list_aduan(_: dict = Depends(get_current_staff), db: Session = Depends(get_db)):
    return {"aduan": service.list_complaints(db)}


@router.get("/api/aduan/{aduan_id}")
def get_aduan(aduan_id: str, _: dict = Depends(get_current_staff), db: Session = Depends(get_db)):
    complaint = service.get_complaint(db, aduan_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="not found")
    return {"aduan": service.complaint_view(db, complaint)}


# Triage: no per-complaint assignment (the group owner is the worker);
# PATCH handles status, the Representative-review flag and group membership.
@router.patch("/api/aduan/{aduan_id}")
def patch_aduan(
    aduan_id: str,
    payload: AduanPatch,
    user: dict = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    complaint = service.get_complaint(db, aduan_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="not found")
    has_group_key = "case_group_id" in payload.model_fields_set
    new_group = service.get_case_group(db, payload.case_group_id) if payload.case_group_id else None
    is_rep = user["role"] == "Representative"

    if payload.assigneeId is not None:
        raise HTTPException(status_code=400, detail="assignment via case group only")
    if has_group_key and payload.case_group_id and new_group is None:
        raise HTTPException(status_code=400, detail="case group not found")
    if new_group is not None:
        if service.group_view(db, new_group)["status"] != "Open":
            raise HTTPException(status_code=400, detail="case group is closed")
        if str(new_group.user_id or "") != user["id"] and not is_rep:
            raise HTTPException(status_code=403, detail="only the group owner or Representative can add to it")
        if is_terminal_status(complaint.status):
            raise HTTPException(status_code=400, detail="resolved is terminal")

    new_status = payload.status
    old_status = complaint.status
    if new_status is not None:
        if not is_valid_status(new_status):
            raise HTTPException(status_code=400, detail=f"status in {','.join(STATUSES)}")
        if is_terminal_status(old_status) and new_status != old_status:
            raise HTTPException(status_code=400, detail="resolved is terminal")
        if new_status == "Resolved" and new_status != old_status:
            group = new_group if has_group_key else service.get_case_group(db, complaint.case_group_id)
            if group is None:
                raise HTTPException(status_code=403, detail="pool must be grouped and claimed")
            owner = str(group.user_id) if group.user_id else None
            if not can_resolve_owned(owner, user["id"]):
                raise HTTPException(status_code=403, detail="only group owner resolves")
        elif new_status != old_status and not can_set_status(user["role"], new_status):
            raise HTTPException(status_code=403, detail="forbidden")

    flag = payload.needsRepresentativeAttention
    if flag is not None and flag != complaint.rep_attention:
        if is_terminal_status(complaint.status):
            raise HTTPException(status_code=400, detail="Only open complaints can be flagged.")
        group = service.get_case_group(db, complaint.case_group_id)
        is_owner = group is not None and str(group.user_id or "") == user["id"]
        if flag and (complaint.status != "In Progress" or not is_owner or is_rep):
            raise HTTPException(
                status_code=403,
                detail="Only the assigned Aide or Intern can flag a claimed In Progress complaint.",
            )
        if not flag and not is_owner and not is_rep:
            raise HTTPException(status_code=403, detail="Only the owner or Representative can clear the flag.")

    staff_id = service.parse_id(user["id"])
    if new_status is not None and new_status != old_status:
        complaint.status = new_status
        service.add_update(db, complaint.id, staff_id, "status", f"{old_status} → {new_status}")
    if flag is not None and flag != complaint.rep_attention:
        complaint.rep_attention = flag
        service.add_update(
            db, complaint.id, staff_id, "flag" if flag else "unflag",
            f"{user['name']} flagged for Representative review" if flag
            else f"{user['name']} cleared Representative flag",
        )
    if has_group_key:
        if new_group is not None:
            if complaint.case_group_id != new_group.id:
                service.join_group(
                    db, complaint, new_group, user, f"{user['name']} added {complaint.title} to {new_group.title}"
                )
        else:
            complaint.case_group_id = None
            service.add_update(db, complaint.id, staff_id, "group-remove", f"{user['name']} returned to pool")
    db.commit()
    return {"aduan": service.complaint_view(db, complaint)}


# The Representative ends the flow with a reason; repeatInGroup resolves every open member.
@router.post("/api/aduan/{aduan_id}/resolve")
def resolve_aduan(
    aduan_id: str,
    payload: ResolveIn,
    user: dict = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    if user["role"] != "Representative":
        raise HTTPException(status_code=403, detail="Only Representative can end the flow.")
    if not payload.reason.strip():
        raise HTTPException(status_code=400, detail="reason required")
    complaint = service.get_complaint(db, aduan_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="not found")
    if is_terminal_status(complaint.status):
        raise HTTPException(status_code=400, detail="Only open complaints can be released.")
    group = service.get_case_group(db, complaint.case_group_id)
    targets = service.open_members(db, group) if payload.repeatInGroup and group else [complaint]
    staff_id = service.parse_id(user["id"])
    for c in targets:
        c.status = "Resolved"
        c.rep_attention = False
        service.add_update(db, c.id, staff_id, "resolve", f"Flow ended: {payload.reason.strip()}")
    db.commit()
    return {"resolved": [str(c.id) for c in targets]}


@router.post("/api/aduan/{aduan_id}/updates", status_code=status.HTTP_201_CREATED)
def add_aduan_update(
    aduan_id: str,
    payload: UpdateIn,
    user: dict = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    complaint = service.get_complaint(db, aduan_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="not found")
    if not payload.detail.strip():
        raise HTTPException(status_code=400, detail="detail required")
    group = service.get_case_group(db, complaint.case_group_id)
    shared = payload.repeatInGroup and group is not None
    targets = service.open_members(db, group) if shared else [complaint]
    staff_id = service.parse_id(user["id"])
    detail = payload.detail.strip()
    for c in targets:
        text = f"{detail} (shared across case group)" if shared and len(targets) > 1 else detail
        if payload.attachmentName:
            text += f" [{payload.attachmentName}]"
        service.add_update(db, c.id, staff_id, "update", text)
    db.commit()
    return {"count": len(targets)}


@router.get("/api/case-groups")
def list_case_groups(_: dict = Depends(get_current_staff), db: Session = Depends(get_db)):
    return {"case_groups": service.list_case_groups(db)}


# Case groups own assignment: the Representative opens groups unowned or assigns
# them to an Aide/Intern; Aide/Intern create-and-claim in one step. With
# complaintIds the open pool complaints join the new group in the same request.
@router.post("/api/case-groups", status_code=status.HTTP_201_CREATED)
def create_case_group(
    payload: CaseGroupIn,
    user: dict = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    if not can_reassign(user["role"]) and not can_claim_group(user["role"]):
        raise HTTPException(status_code=403, detail="forbidden")
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="title required")
    is_rep = user["role"] == "Representative"
    owner_id = None if is_rep else service.parse_id(user["id"])

    members = []
    if payload.complaintIds:
        for cid in dict.fromkeys(payload.complaintIds):
            c = service.get_complaint(db, cid)
            if c is not None and c.case_group_id is None and not is_terminal_status(c.status):
                members.append(c)
        if not members:
            raise HTTPException(status_code=400, detail="Select at least one open pool complaint.")
        if is_rep:
            assignee = service.get_staff(db, payload.ownerStaffId)
            if assignee is None or not assignee.is_active or assignee.role not in ("Aide", "Intern"):
                raise HTTPException(status_code=400, detail="Pick an Aide or Intern to assign this group to.")
            owner_id = assignee.id

    group = service.create_case_group(db, payload.title, owner_id)
    for c in members:
        service.join_group(db, c, group, user, f"{user['name']} opened {group.title}")
    db.commit()
    return {"case_group": service.group_view(db, group), "claimed": len(members)}


# Pull model: every open member of the source group moves into a group the caller owns.
@router.post("/api/case-groups/{group_id}/pull")
def pull_case_group(
    group_id: str,
    payload: PullIn,
    user: dict = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    source = service.get_case_group(db, group_id)
    dest = service.get_case_group(db, payload.dest_group_id)
    if source is None or dest is None:
        raise HTTPException(status_code=404, detail="not found")
    if source.id == dest.id:
        raise HTTPException(status_code=400, detail="Source and destination are the same group.")
    if service.group_view(db, source)["status"] != "Open" or service.group_view(db, dest)["status"] != "Open":
        raise HTTPException(status_code=400, detail="Both case groups must be open.")
    if str(dest.user_id or "") != user["id"] and user["role"] != "Representative":
        raise HTTPException(status_code=403, detail="Only the group owner or Representative can add to it.")
    members = service.open_members(db, source)
    if not members:
        raise HTTPException(status_code=400, detail="No open members to pull.")
    for c in members:
        service.join_group(
            db, c, dest, user,
            f"{user['name']} pulled {c.title} from {source.title} to {dest.title} as part of group pull",
        )
    db.commit()
    return {"case_group": service.group_view(db, dest), "count": len(members)}


# Confirmation is recorded in each complaint's history; there is no stored flag.
@router.post("/api/case-groups/{group_id}/confirm")
def confirm_case_group(
    group_id: str,
    payload: ConfirmIn | None = None,
    user: dict = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    if not can_reassign(user["role"]):
        raise HTTPException(status_code=403, detail="Representative/Aide only")
    group = service.get_case_group(db, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="not found")
    view = service.group_view(db, group)
    ids = ((payload.complaintIds or payload.complaint_ids) if payload else None) or view["memberIds"]
    staff_id = service.parse_id(user["id"])
    confirmed = []
    for cid in ids:
        complaint = service.get_complaint(db, cid)
        if complaint is None or complaint.case_group_id != group.id:
            raise HTTPException(status_code=400, detail=f"complaint {cid} not in group")
        if is_terminal_status(complaint.status):
            raise HTTPException(status_code=400, detail=f"complaint {cid} closed")
        service.add_update(
            db, complaint.id, staff_id, "group-confirm", f"{user['name']} confirmed in {group.title}"
        )
        confirmed.append(str(complaint.id))
    db.commit()
    return {"case_group": service.group_view(db, group), "confirmed": confirmed}


def _open_members(db: Session, group) -> list:
    return [
        c
        for c in (service.get_complaint(db, m) for m in service.group_view(db, group)["memberIds"])
        if c is not None and not is_terminal_status(c.status)
    ]


# En-bloc claim: the claimant becomes owner of the whole group.
# Pool complaints are never claimed directly; group first, then claim.
@router.post("/api/case-groups/{group_id}/claim-all")
def claim_case_group(
    group_id: str,
    user: dict = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    if not can_claim_group(user["role"]):
        raise HTTPException(status_code=403, detail="Aide/Intern only")
    group = service.get_case_group(db, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="not found")
    if group.user_id and str(group.user_id) != user["id"] and not can_reassign(user["role"]):
        raise HTTPException(status_code=403, detail="Representative/Aide only")
    staff_id = service.parse_id(user["id"])
    group.user_id = staff_id
    claimed = []
    for complaint in _open_members(db, group):
        service.add_update(
            db, complaint.id, staff_id, "claim", f"{user['name']} claimed en-bloc via {group.title}"
        )
        claimed.append(str(complaint.id))
    db.commit()
    return {"case_group": service.group_view(db, group), "claimed": claimed}


# Whole-group transfer: the owner or a Representative/Aide moves the entire
# group to another Aide/Intern. There is no per-complaint move.
@router.patch("/api/case-groups/{group_id}")
def transfer_case_group(
    group_id: str,
    payload: TransferIn,
    user: dict = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    group = service.get_case_group(db, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="not found")
    target_user = service.get_staff(db, payload.owner_staff_id)
    target = service.staff_view(target_user) if target_user else None
    if not has_access(target):
        raise HTTPException(status_code=400, detail="assignee has no access")
    if target["role"] == "Representative":
        raise HTTPException(status_code=400, detail="Representative does not hold groups")
    if str(group.user_id or "") != user["id"] and not can_reassign(user["role"]):
        raise HTTPException(status_code=403, detail="Representative/Aide only")
    if group.user_id == target_user.id:
        return {"case_group": service.group_view(db, group)}
    group.user_id = target_user.id
    staff_id = service.parse_id(user["id"])
    for complaint in _open_members(db, group):
        service.add_update(
            db, complaint.id, staff_id, "reassign",
            f"{user['name']} transferred {group.title} to {target['name']}",
        )
    db.commit()
    return {"case_group": service.group_view(db, group)}


@router.get("/api/kawasan")
def get_kawasan(staff: dict = Depends(get_current_staff), db: Session = Depends(get_db)):
    return {"kawasan": service.get_kawasan(db, staff["service_center_id"])}


@router.get("/api/kawasan/pins")
def kawasan_pins(
    level: str = Query(default="parlimen"),
    state: str | None = Query(default=None),
    kod: str | None = Query(default=None),
    _user: dict = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    lvl = str(level or "parlimen").lower()
    if lvl not in ("parlimen", "dun"):
        raise HTTPException(status_code=400, detail="level is parlimen|dun")
    if not kod:
        raise HTTPException(status_code=400, detail="kod required")
    if lvl == "dun" and not state:
        raise HTTPException(status_code=400, detail="dun kod needs state")
    feature = kod_feature(lvl, kod, state)
    if feature is None:
        raise HTTPException(status_code=404, detail="kod not found")
    return {"pins": service.list_pins(db, feature)}


# Kawasan geo: public CC0 boundary data, no session needed.
# Parlimen kod is nationally unique; dun kod repeats per state, so
# dun + kod requires state to disambiguate.
@router.get("/api/kawasan/geojson")
def kawasan_geojson(
    level: str = Query(default="parlimen"),
    state: str | None = Query(default=None),
    kod: str | None = Query(default=None),
):
    lvl = str(level or "parlimen").lower()
    if lvl not in ("parlimen", "dun"):
        raise HTTPException(status_code=400, detail="level is parlimen|dun")
    if not state and not kod:
        raise HTTPException(status_code=400, detail="pass state and/or kod")
    if kod:
        if lvl == "dun" and not state:
            raise HTTPException(status_code=400, detail="dun kod needs state")
        feat = kod_feature(lvl, kod, state)
        if feat is None:
            raise HTTPException(status_code=404, detail="kod not found")
        return JSONResponse(content=feat, headers={"cache-control": "public, max-age=86400"})
    fc = negeri_view(lvl, state)
    if not fc or not fc["features"]:
        raise HTTPException(status_code=404, detail="state not found")
    return JSONResponse(content=fc, headers={"cache-control": "public, max-age=86400"})


@router.get("/api/categories")
def list_categories(_: dict = Depends(get_current_staff), db: Session = Depends(get_db)):
    return {"categories": service.list_categories(db)}


@router.get("/api/service-centers")
def list_service_centers(_: dict = Depends(get_current_staff), db: Session = Depends(get_db)):
    return {"service_centers": service.list_service_centers(db)}


@router.get("/api/staff")
def list_staff(_: dict = Depends(get_current_staff), db: Session = Depends(get_db)):
    return {"staff": service.list_staff(db)}


@router.post("/api/staff", status_code=status.HTTP_201_CREATED)
def invite_staff(
    payload: StaffInviteIn,
    manager: dict = Depends(require_manager),
    db: Session = Depends(get_db),
):
    if payload.role not in ROLES or payload.role == "Representative":
        raise HTTPException(status_code=400, detail="email + role Aide/Intern required")
    if service.get_staff_by_email(db, payload.email):
        raise HTTPException(status_code=409, detail="exists")
    created = service.add_staff(
        db,
        role=payload.role,
        email=payload.email.strip(),
        service_center_id=service.parse_id(manager["service_center_id"]),
        name=payload.name,
    )
    return {"staff": created}


@router.patch("/api/staff/{staff_id}")
def set_staff_active(
    staff_id: str,
    payload: StaffActiveIn,
    manager: dict = Depends(require_manager),
    db: Session = Depends(get_db),
):
    updated = service.set_staff_active(db, staff_id, payload.active, service.parse_id(manager["id"]))
    if updated is None:
        raise HTTPException(status_code=404, detail="not found")
    return {"staff": updated}
