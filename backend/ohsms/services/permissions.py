from ohsms.models import UserRole, Branch, Department, Section, UserProfile


class PermissionService:
    """
    Scope + RBAC Engine
    مصدر الحقيقة للصلاحيات داخل النظام
    """

    # =========================
    # Role checks
    # =========================

    @staticmethod
    def has_role(user, role_code: str) -> bool:
        return UserRole.objects.filter(
            user=user,
            role__code=role_code
        ).exists()

    @staticmethod
    def is_global(user) -> bool:
        """
        دور عالمي (System Admin / System Staff)
        """
        return UserRole.objects.filter(
            user=user,
            role__is_global=True
        ).exists()

    @staticmethod
    def is_system_admin(user) -> bool:
        return PermissionService.has_role(user, "system_admin")

    # =========================
    # Scope resolution
    # =========================

    @staticmethod
    def get_user_scopes(user):
        """
        إرجاع كل نطاقات المستخدم
        """
        return UserRole.objects.filter(user=user)

    @staticmethod
    def has_scope(
    user,
    branch=None,
    department=None,
    section=None
) -> bool:

        """
        التحقق من أن المستخدم ضمن هذا النطاق
        """

        # صلاحية مطلقة
        if PermissionService.is_global(user):
            return True

        qs = UserRole.objects.filter(user=user)

        if section:
            qs = qs.filter(section=section)
        elif department:
            qs = qs.filter(department=department)
        elif branch:
            qs = qs.filter(branch=branch)

        return qs.exists()

    # =========================
    # Unified access check
    # =========================

    @staticmethod
    def can_access(
    user,
    *,
    role_code: str = None,
    branch=None,
    department=None,
    section=None
) -> bool:

        """
        التحقق النهائي:
        - Global role
        - Role + Scope
        """

        if PermissionService.is_global(user):
            return True

        qs = UserRole.objects.filter(user=user)

        if role_code:
            qs = qs.filter(role__code=role_code)

        if section:
            qs = qs.filter(section=section)
        elif department:
            qs = qs.filter(department=department)
        elif branch:
            qs = qs.filter(branch=branch)

        if qs.exists():
            return True

        # fallback مؤقت لـ UserProfile (للأنظمة القديمة)
        if hasattr(user, "profile"):
            profile = user.profile

            if section and profile.section_id == section.id:
                return True
            if department and profile.department_id == department.id:
                return True
            if branch and profile.branch_id == branch.id:
                return True

        return False
