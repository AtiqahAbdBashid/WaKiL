"""YB-portal routes: session login plus staff admin.

Same /api/* paths, response shapes ({staff}, {user}), Bearer token
mechanics, and 401/403/404 semantics the frontend already calls.
"""

import base64
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import JSONResponse

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
from .kawasan import feature_contains, kod_feature, negeri_view
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


# Triage: per-complaint assignment is gone (owner equals worker via
# Case_Group.owner_staff_id). PATCH handles status + group membership only;
# claiming/transfer happens en-bloc at the case-group endpoints below.
@router.patch("/api/aduan/{aduan_id}")
def patch_aduan(
    aduan_id: str,
    payload: dict | None = None,
    user: dict = Depends(get_current_staff),
    store: YBPortalStore = Depends(get_store),
):
    item = store.get_aduan(aduan_id)
    if item is None:
        raise HTTPException(status_code=404, detail="not found")
    body = payload or {}
    assignee_id = body.get("assigneeId")
    status_value = body.get("status")
    has_group_key = "case_group_id" in body
    case_group_id = body.get("case_group_id")

    if assignee_id is not None:
        raise HTTPException(status_code=400, detail="assignment via case group only")
    if status_value is not None:
        if not is_valid_status(status_value):
            raise HTTPException(status_code=400, detail=f"status in {','.join(STATUSES)}")
        if is_terminal_status(item.get("status")) and status_value != item.get("status"):
            raise HTTPException(status_code=400, detail="resolved is terminal")
        if status_value == "Resolved" and status_value != item.get("status"):
            effective_group_id = case_group_id if has_group_key else item.get("case_group_id")
            if not effective_group_id:
                raise HTTPException(status_code=403, detail="pool must be grouped and claimed")
            group = store.get_case_group(effective_group_id)
            owner = (group or {}).get("owner_staff_id")
            if not can_resolve_owned(owner, user["id"]):
                raise HTTPException(status_code=403, detail="only group owner resolves")
        elif status_value != item.get("status") and not can_set_status(user["role"], status_value):
            raise HTTPException(status_code=403, detail="forbidden")
    if has_group_key and case_group_id is not None and store.get_case_group(case_group_id) is None:
        raise HTTPException(status_code=400, detail="case group not found")

    old_status = item.get("status")

    def _triage(a, audit, _u=user, _s=status_value, _g=case_group_id, _hg=has_group_key, _from=old_status):
        if _s is not None and _s != _from:
            a["status"] = _s
            audit(a, _u["id"], "status", f"{_from} → {_s}")
        if _hg:
            a["case_group_id"] = _g or None
            a["case_group_confirmed"] = False
            if _g:
                audit(a, _u["id"], "group-assign", f"{_u['name']} tentatively added to {_g}")
            else:
                audit(a, _u["id"], "group-remove", f"{_u['name']} returned to pool")

    updated = store.mutate_aduan(aduan_id, _triage)
    return {"aduan": updated}


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


@router.get("/api/kawasan")
def get_kawasan(_: dict = Depends(get_current_staff), store: YBPortalStore = Depends(get_store)):
    return {"kawasan": store.get_kawasan()}


# Aduan pins: authed, titles staff-only. inside = point in kod boundary.
# Dun kod repeats per state, so dun + kod requires state.
@router.get("/api/kawasan/pins")
def kawasan_pins(
    level: str = Query(default="parlimen"),
    state: str | None = Query(default=None),
    kod: str | None = Query(default=None),
    _user: dict = Depends(get_current_staff),
    store: YBPortalStore = Depends(get_store),
):
    lvl = str(level or "parlimen").lower()
    if lvl not in ("parlimen", "dun"):
        raise HTTPException(status_code=400, detail="level is parlimen|dun")
    if not kod:
        raise HTTPException(status_code=400, detail="kod required")
    if lvl == "dun" and not state:
        raise HTTPException(status_code=400, detail="dun kod needs state")
    boundary = kod_feature(lvl, kod, state)
    if boundary is None:
        raise HTTPException(status_code=404, detail="kod not found")
    pins = []
    for a in store.list_aduan():
        geo = a.get("lokasi_geojson") or {}
        if geo.get("type") != "Point":
            continue
        lng, lat = geo.get("coordinates", [None, None])
        pins.append(
            {
                "id": a.get("id"),
                "title": a.get("title"),
                "status": a.get("status"),
                "lng": lng,
                "lat": lat,
                "inside": feature_contains(boundary, lng, lat),
            }
        )
    return {"pins": pins}


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
