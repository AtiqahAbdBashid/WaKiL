"""YB-portal routes: session login plus staff admin.

Same /api/* paths, response shapes ({staff}, {user}), Bearer token
mechanics, and 401/403/404 semantics the frontend already calls.
"""

import base64
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status

from .domain import ROLES, can_manage_staff, can_view_staff, has_access
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
