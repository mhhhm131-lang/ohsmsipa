import threading
from contextlib import contextmanager

from ohsms.core.errors import PermissionDenied

_state = threading.local()

# =====================================================
# Model Mutation Context
# =====================================================

def _get_allowed_scopes():
    """
    يحصل على مجموعة النطاقات المسموح بها للتعديل في هذا الـ thread
    """
    scopes = getattr(_state, "allowed_scopes", None)
    if scopes is None:
        scopes = set()
        _state.allowed_scopes = scopes
    return scopes


@contextmanager
def allow_model_mutation(scope: str = "*"):
    """
    يسمح مؤقتاً بتعديل الموديلات داخل Service Layer فقط.

    متوافق مع:
    - allow_model_mutation()
    - with allow_model_mutation("incident_status")

    scope أمثلة:
    - incident_status
    - incident_risks
    - risk_write
    - form_write
    """
    scopes = _get_allowed_scopes()
    before = set(scopes)
    scopes.add(scope)
    try:
        yield
    finally:
        _state.allowed_scopes = before


def forbid_model_mutation():
    """
    منع التعديل (للتوافق مع كود قديم – لم يعد استخدامه ضرورياً)
    """
    _state.allowed_scopes = set()


def is_model_mutation_allowed(scope: str = "*") -> bool:
    """
    التحقق هل التعديل مسموح في هذا النطاق أم لا
    """
    scopes = _get_allowed_scopes()
    return ("*" in scopes) or (scope in scopes)


# =====================================================
# Service Layer Guards
# =====================================================

def require_context(permission: str, *, user=None):
    """
    Guard موحد للاستخدام داخل Service Layer

    permission أمثلة:
    - incident:create:normal
    - incident:create:public
    - incident:receive
    - incident:start_progress
    - incident:assign
    - incident:add_note
    - incident:close
    - incident:escalate
    """

    # البلاغات العامة (عاجل / مجهول)
    if permission == "incident:create:public":
        return True

    # أي إجراء على البلاغات يتطلب تسجيل دخول
    if permission.startswith("incident:"):
        if not user or not getattr(user, "is_authenticated", False):
            raise PermissionDenied(message="يجب تسجيل الدخول لتنفيذ هذا الإجراء")
        return True

    # غير معروف
    raise PermissionDenied(message=f"صلاحية غير معروفة: {permission}")
