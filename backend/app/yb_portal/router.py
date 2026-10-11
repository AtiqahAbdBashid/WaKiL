"""YB-portal routes: session login plus staff admin.

Same /api/* paths, response shapes ({staff}, {user}), Bearer token
mechanics, and 401/403/404 semantics the frontend already calls.
"""

import base64
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status

from .domain import (
    ROLES,
    can_claim_group,
    can_manage_staff,
    can_reassign,
    can_view_staff,
    has_access,
    is_terminal_status,
)
from .store import YBPortalStore, get_store

router = APIRouter()


def encode_token(staff_id: str) -> str:
    return base64.b64encode(staff_id.encode("utf-8")).decode("ascii")


def decode_token(token: str) -> str | None:
    try:
        return base64.b64decode(token.encode("ascii")).decode("utf-8")
    except Exception:
        return None


def get_current_staff(
    authorization: Annotated[str | None, Header()] = None,
    store: YBPortalStore = Depends(get_store),
) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing token")
    staff = store.get_staff(decode_token(authorization[7:].strip()))
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


@router.post("/api/auth/google")
def google_login(payload: dict, store: YBPortalStore = Depends(get_store)):
    lookup = (payload or {}).get("email") or (payload or {}).get("idToken")
    if not lookup:
        raise HTTPException(status_code=400, detail="email or idToken required")
    staff = store.get_staff_by_email(lookup)
    if not has_access(staff):
        raise HTTPException(status_code=401, detail="no access")
    store.sweep_expired()
    return {"token": encode_token(staff["id"]), "user": staff}


@router.get("/api/me")
def me(staff: dict = Depends(get_current_staff)):
    return {"user": staff}


@router.get("/api/aduan")
def list_aduan(_: dict = Depends(get_current_staff), store: YBPortalStore = Depends(get_store)):
    return {"aduan": store.list_aduan()}


@router.get("/api/aduan/{aduan_id}")
def get_aduan(aduan_id: str, _: dict = Depends(get_current_staff), store: YBPortalStore = Depends(get_store)):
    item = store.get_aduan(aduan_id)
    if item is None:
        raise HTTPException(status_code=404, detail="not found")
    return {"aduan": item}


@router.get("/api/case-groups")
def list_case_groups(_: dict = Depends(get_current_staff), store: YBPortalStore = Depends(get_store)):
    return {"case_groups": store.list_case_groups()}


# Case groups own assignment: Representative opens groups unowned (never
# holds work); Aide/Intern create-and-claim en-bloc in one step.
@router.post("/api/case-groups", status_code=status.HTTP_201_CREATED)
def create_case_group(
    payload: dict,
    user: dict = Depends(get_current_staff),
    store: YBPortalStore = Depends(get_store),
):
    if not can_reassign(user["role"]) and not can_claim_group(user["role"]):
        raise HTTPException(status_code=403, detail="forbidden")
    title = (payload or {}).get("title")
    if not title:
        raise HTTPException(status_code=400, detail="title required")
    owner_staff_id = None if user["role"] == "Representative" else user["id"]
    return {
        "case_group": store.create_case_group(
            title=title, category=(payload or {}).get("category"), owner_staff_id=owner_staff_id
        )
    }


@router.post("/api/case-groups/{group_id}/confirm")
def confirm_case_group(
    group_id: str,
    payload: dict | None = None,
    user: dict = Depends(get_current_staff),
    store: YBPortalStore = Depends(get_store),
):
    if not can_reassign(user["role"]):
        raise HTTPException(status_code=403, detail="Representative/Aide only")
    group = store.get_case_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="not found")
    body = payload or {}
    ids = body.get("complaintIds", body.get("complaint_ids", group.get("memberIds", [])))
    confirmed = []
    for cid in ids:
        item = store.get_aduan(cid)
        if item is None or str(item.get("case_group_id")) != str(group["id"]):
            raise HTTPException(status_code=400, detail=f"complaint {cid} not in group")
        if is_terminal_status(item.get("status")):
            raise HTTPException(status_code=400, detail=f"complaint {cid} closed")

        def _confirm(a, audit, _u=user, _g=group):
            a["case_group_confirmed"] = True
            audit(a, _u["id"], "group-confirm", f"{_u['name']} confirmed in {_g['title']}")

        store.mutate_aduan(cid, _confirm)
        confirmed.append(cid)
    return {"case_group": store.get_case_group(group["id"]), "confirmed": confirmed}


# En-bloc claim: claimant becomes group owner; every open member shares
# that owner as single assignee. Ungrouped pool complaints are never
# claimed directly (group first, then claim the group).
@router.post("/api/case-groups/{group_id}/claim-all")
def claim_case_group(
    group_id: str,
    user: dict = Depends(get_current_staff),
    store: YBPortalStore = Depends(get_store),
):
    if not can_claim_group(user["role"]):
        raise HTTPException(status_code=403, detail="Aide/Intern only")
    group = store.get_case_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="not found")
    if (
        group.get("owner_staff_id")
        and group["owner_staff_id"] != user["id"]
        and not can_reassign(user["role"])
    ):
        raise HTTPException(status_code=403, detail="Representative/Aide only")
    store.set_case_group_owner(group["id"], user["id"])
    claimed = []
    for cid in group.get("memberIds", []):
        item = store.get_aduan(cid)
        if item is None or is_terminal_status(item.get("status")):
            continue

        def _claim(a, audit, _u=user, _g=group):
            audit(a, _u["id"], "claim", f"{_u['name']} claimed en-bloc via {_g['title']}")

        store.mutate_aduan(cid, _claim)
        claimed.append(cid)
    return {"case_group": store.get_case_group(group["id"]), "claimed": claimed}


# Whole-group transfer (release semantics): owner or Representative/Aide
# moves the entire group to another Aide/Intern. No per-complaint move.
@router.patch("/api/case-groups/{group_id}")
def transfer_case_group(
    group_id: str,
    payload: dict,
    user: dict = Depends(get_current_staff),
    store: YBPortalStore = Depends(get_store),
):
    group = store.get_case_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="not found")
    nxt = (payload or {}).get("owner_staff_id")
    if not nxt:
        raise HTTPException(status_code=400, detail="owner_staff_id required")
    target = store.get_staff(nxt)
    if not has_access(target):
        raise HTTPException(status_code=400, detail="assignee has no access")
    if target.get("role") == "Representative":
        raise HTTPException(status_code=400, detail="Representative does not hold groups")
    if group.get("owner_staff_id") != user["id"] and not can_reassign(user["role"]):
        raise HTTPException(status_code=403, detail="Representative/Aide only")
    if group.get("owner_staff_id") == nxt:
        return {"case_group": store.get_case_group(group["id"])}
    store.set_case_group_owner(group["id"], nxt)
    for cid in group.get("memberIds", []):
        item = store.get_aduan(cid)
        if item is None or is_terminal_status(item.get("status")):
            continue

        def _transfer(a, audit, _u=user, _g=group, _t=target):
            audit(
                a,
                _u["id"],
                "reassign",
                f"{_u['name']} transferred {_g['title']} to {_t['name']}",
            )

        store.mutate_aduan(cid, _transfer)
    return {"case_group": store.get_case_group(group["id"])}


@router.get("/api/service-centers")
def list_service_centers(_: dict = Depends(get_current_staff), store: YBPortalStore = Depends(get_store)):
    return {"service_centers": store.list_service_centers()}


@router.get("/api/staff")
def list_staff(_: dict = Depends(require_viewer), store: YBPortalStore = Depends(get_store)):
    return {"staff": store.list_staff()}


@router.post("/api/staff", status_code=status.HTTP_201_CREATED)
def invite_staff(
    payload: dict,
    _: dict = Depends(require_manager),
    store: YBPortalStore = Depends(get_store),
):
    body = payload or {}
    email = body.get("email")
    role = body.get("role")
    if not email or role not in ROLES or role == "Representative":
        raise HTTPException(status_code=400, detail="email + role Aide/Intern required")
    if store.get_staff_by_email(email):
        raise HTTPException(status_code=409, detail="exists")
    created = store.add_staff(role=role, email=email, expires_at=body.get("expiresAt"))
    return {"staff": created}


@router.patch("/api/staff/{staff_id}")
def set_staff_active(
    staff_id: str,
    payload: dict,
    me: dict = Depends(require_manager),
    store: YBPortalStore = Depends(get_store),
):
    active = (payload or {}).get("active") is not False
    updated = store.set_staff_active(staff_id, active, me["id"])
    if updated is None:
        raise HTTPException(status_code=404, detail="not found")
    return {"staff": updated}
