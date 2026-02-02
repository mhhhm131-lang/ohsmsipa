from ohsms.models import Risk
from ohsms.services.permissions import PermissionService
from ohsms.core.errors import PermissionDenied


class RiskEventPolicy:
    """
    Policy layer للتحقق من صلاحيات أحداث المخاطر
    """

    @staticmethod
    def can_transition(*, risk: Risk, actor, to_status: str):
        """
        يحدد هل يحق للمستخدم تنفيذ الانتقال أم لا
        """

        # سوبر يوزر: مسموح دائمًا
        if actor.is_superuser:
            return

        # المستخدم يجب أن يكون داخل نطاق الخطر
        if not PermissionService.can_access_risk(actor, risk):
            raise PermissionDenied(
                message="لا تملك صلاحية الوصول إلى هذا الخطر"
            )

        # قواعد حسب الحالة المستهدفة
        if to_status in {"submitted"}:
            if not PermissionService.has_role(actor, "safety_coordinator"):
                raise PermissionDenied(
                    message="فقط منسق السلامة يمكنه تقديم الخطر"
                )

        if to_status in {"approved", "rejected"}:
            if not PermissionService.has_role(actor, "safety_committee"):
                raise PermissionDenied(
                    message="فقط لجنة السلامة يمكنها اعتماد أو رفض الخطر"
                )

        if to_status in {"in_progress", "closed"}:
            if not PermissionService.has_role(actor, "department_manager"):
                raise PermissionDenied(
                    message="فقط مدير الإدارة يمكنه معالجة أو إغلاق الخطر"
                )
