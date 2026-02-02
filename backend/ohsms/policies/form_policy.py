from ohsms.services.permissions import PermissionService
from ohsms.core.errors import PermissionDenied


class FormPolicy:
    """
    Policy Layer للنماذج الرقمية
    """

    @staticmethod
    def can_manage_templates(user):
        if user.is_superuser:
            return True

        return PermissionService.has_any_role(
            user,
            [
                "system_admin",
                "system_staff",
                "safety_committee",
            ],
        )

    @staticmethod
    def can_edit_fields(user):
        if user.is_superuser:
            return True

        return PermissionService.has_any_role(
            user,
            [
                "system_admin",
                "system_staff",
            ],
        )

    @staticmethod
    def can_submit_form(user):
        return user and user.is_authenticated
