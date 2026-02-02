from django.db.models import Q

from ohsms.models import Incident
from ohsms.services.permissions import PermissionService


class IncidentVisibilityService:
    """
    مسؤول عن تحديد البلاغات المرئية لكل مستخدم
    """

    @staticmethod
    def visible_queryset(user):
        """
        إرجاع QuerySet للبلاغات التي يحق للمستخدم رؤيتها
        """

        # غير مسجل دخول → لا يرى شيئًا
        if not user or not user.is_authenticated:
            return Incident.objects.none()

        # دور عالمي → يرى الجميع
        if PermissionService.is_global(user):
            return Incident.objects.all()

        # =========================
        # رؤية مباشرة
        # =========================
        qs = Incident.objects.filter(
            Q(created_by=user) |
            Q(assigned_to=user)
        )

        # =========================
        # رؤية حسب النطاق (Branch / Department / Section)
        # =========================
        scope_q = Q()

        for role in PermissionService.get_user_scopes(user):
            if role.section_id:
                scope_q |= Q(section_id=role.section_id)
            elif role.department_id:
                scope_q |= Q(department_id=role.department_id)
            elif role.branch_id:
                scope_q |= Q(branch_id=role.branch_id)

        if scope_q:
            qs = qs | Incident.objects.filter(scope_q)

        return qs.distinct()

    @staticmethod
    def can_view(user, incident: Incident) -> bool:
        """
        تحقق مباشر: هل المستخدم يرى هذا البلاغ؟
        """
        return IncidentVisibilityService.visible_queryset(user).filter(
            id=incident.id
        ).exists()
