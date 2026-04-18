from functools import wraps
from typing import List, Optional, Callable
from fastapi import HTTPException, status


ROLE_HIERARCHY = {
    "admin": 100,
    "government_authority": 90,
    "hospital": 70,
    "blood_bank": 70,
    "organ_donor": 30,
    "blood_donor": 30,
    "recipient": 30,
}

ROLE_PERMISSIONS = {
    "admin": [
        "manage_all", "verify_entities", "view_audit", "manage_users",
        "manage_roles", "manage_hospitals", "manage_blood_banks",
        "override_matches", "view_all_data", "generate_reports"
    ],
    "government_authority": [
        "verify_entities", "view_audit", "view_all_data",
        "generate_reports", "manage_compliance"
    ],
    "hospital": [
        "verify_donors", "verify_recipients", "create_emergency",
        "manage_matches", "view_hospital_data", "upload_documents",
        "update_transplant_outcomes"
    ],
    "blood_bank": [
        "manage_inventory", "create_blood_request", "view_blood_data",
        "update_donation_records", "manage_donors"
    ],
    "organ_donor": [
        "manage_own_profile", "update_consent", "view_own_matches",
        "update_availability", "view_hospitals"
    ],
    "blood_donor": [
        "manage_own_profile", "update_availability", "view_own_donations",
        "view_blood_banks", "respond_emergency"
    ],
    "recipient": [
        "manage_own_profile", "view_waitlist", "update_medical_info",
        "view_own_matches", "upload_documents"
    ],
}


def get_role_level(role_name: str) -> int:
    return ROLE_HIERARCHY.get(role_name, 0)


def get_role_permissions(role_name: str) -> List[str]:
    return ROLE_PERMISSIONS.get(role_name, [])


def has_permission(user_roles: List[str], required_permission: str) -> bool:
    for role in user_roles:
        if required_permission in get_role_permissions(role):
            return True
    return False


def has_any_permission(user_roles: List[str], required_permissions: List[str]) -> bool:
    for permission in required_permissions:
        if has_permission(user_roles, permission):
            return True
    return False


def has_all_permissions(user_roles: List[str], required_permissions: List[str]) -> bool:
    for permission in required_permissions:
        if not has_permission(user_roles, permission):
            return False
    return True


def has_role(user_roles: List[str], required_role: str) -> bool:
    return required_role in user_roles


def has_any_role(user_roles: List[str], required_roles: List[str]) -> bool:
    return any(role in user_roles for role in required_roles)


def has_minimum_role_level(user_roles: List[str], minimum_level: int) -> bool:
    return any(get_role_level(role) >= minimum_level for role in user_roles)


def can_access_resource(
    user_roles: List[str],
    resource_owner_id: Optional[str],
    current_user_id: str,
    required_permission: str
) -> bool:
    if has_permission(user_roles, "manage_all"):
        return True

    if resource_owner_id and resource_owner_id == current_user_id:
        return True

    return has_permission(user_roles, required_permission)


class RBACChecker:
    def __init__(
        self,
        required_roles: Optional[List[str]] = None,
        required_permissions: Optional[List[str]] = None,
        require_all_permissions: bool = False,
        minimum_role_level: Optional[int] = None
    ):
        self.required_roles = required_roles
        self.required_permissions = required_permissions
        self.require_all_permissions = require_all_permissions
        self.minimum_role_level = minimum_role_level

    def check(self, user_roles: List[str]) -> bool:
        if self.minimum_role_level is not None:
            if not has_minimum_role_level(user_roles, self.minimum_role_level):
                return False

        if self.required_roles:
            if not has_any_role(user_roles, self.required_roles):
                return False

        if self.required_permissions:
            if self.require_all_permissions:
                if not has_all_permissions(user_roles, self.required_permissions):
                    return False
            else:
                if not has_any_permission(user_roles, self.required_permissions):
                    return False

        return True

    def __call__(self, user_roles: List[str]) -> bool:
        if not self.check(user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return True


require_admin = RBACChecker(required_roles=["admin"])
require_hospital = RBACChecker(required_roles=["admin", "hospital"])
require_blood_bank = RBACChecker(required_roles=["admin", "blood_bank"])
require_donor = RBACChecker(
    required_roles=["admin", "organ_donor", "blood_donor"])
require_verified_entity = RBACChecker(minimum_role_level=70)
