from ohsms.models import UserRole


class PermissionService:

    @staticmethod
    def has_role(user, role_code: str) -> bool:
        """
        هل لدى المستخدم هذا الدور؟
        """
        return UserRole.objects.filter(
            user=user,
            role__code=role_code
        ).exists()

    @staticmethod
    def is_global(user) -> bool:
        """
        هل لدى المستخدم دور عالمي؟
        """
        return UserRole.objects.filter(
            user=user,
            role__is_global=True
        ).exists()

    @staticmethod
    def has_scope(user, branch=None, department=None, section=None) -> bool:
        """
        هل لدى المستخدم صلاحية ضمن هذا النطاق؟
        """
        qs = UserRole.objects.filter(user=user)

        if section:
            qs = qs.filter(section=section)
        elif department:
            qs = qs.filter(department=department)
        elif branch:
            qs = qs.filter(branch=branch)

        return qs.exists()

    @staticmethod
    def can_access(user, role_code=None, branch=None, department=None, section=None) -> bool:
        """
        التحقق النهائي:
        - Global role
        - أو Role + Scope
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

        return qs.exists()
    from ohsms.models import UserProfile, Branch, Department, Section


class PermissionService:
    """
    منطق مركزي للتحقق من الصلاحيات داخل النظام
    """

    @staticmethod
    def is_system_admin(user) -> bool:
        """
        مدير النظام = صلاحيات مطلقة
        """
        if not hasattr(user, 'profile'):
            return False
        return user.profile.role == 'system_admin'

    @staticmethod
    def can_manage_system(user) -> bool:
        """
        من يحق له إدارة النظام (مدير النظام + موظفي النظام)
        """
        if not hasattr(user, 'profile'):
            return False

        return user.profile.role in [
            'system_admin',
            'system_staff',
        ]

    @staticmethod
    def has_scope_access(
        user,
        branch: Branch = None,
        department: Department = None,
        section: Section = None
    ) -> bool:
        """
        التحقق من النطاق (فرع / إدارة / قسم)
        """

        # مدير النظام يرى كل شيء
        if PermissionService.is_system_admin(user):
            return True

        if not hasattr(user, 'profile'):
            return False

        profile = user.profile

        # التحقق حسب أضيق نطاق متوفر
        if section and profile.section:
            return profile.section_id == section.id

        if department and profile.department:
            return profile.department_id == department.id

        if branch and profile.branch:
            return profile.branch_id == branch.id

        return False

