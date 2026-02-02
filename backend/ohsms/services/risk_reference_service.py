from django.contrib.auth.models import User
from django.db import transaction

from ohsms.models import RiskReference
from ohsms.core.model_context import allow_model_mutation
from ohsms.core.errors import PermissionDenied, ValidationFailed


class RiskReferenceService:
    """
    Source of Truth لسجل المخاطر العام (Reference Registry)
    """

    @staticmethod
    def _ensure_actor(actor: User):
        if not actor or not getattr(actor, "is_authenticated", False):
            raise PermissionDenied(message="يجب تسجيل الدخول")

    @staticmethod
    @transaction.atomic
    def create_reference(
        *,
        actor: User,
        title: str,
        description: str,
        category,
        sub_category,
        cause,
        affected_group_ids=None,
        default_severity=None,
        default_likelihood=None,
        corrective_action="",
        preventive_action="",
        is_active=True,
    ) -> RiskReference:
        RiskReferenceService._ensure_actor(actor)

        if not title or not title.strip():
            raise ValidationFailed(message="عنوان الخطر المرجعي إلزامي")
        if not description or not description.strip():
            raise ValidationFailed(message="وصف الخطر المرجعي إلزامي")

        with allow_model_mutation("risk_reference_write"):
            ref = RiskReference.objects.create(
                title=title.strip(),
                description=description.strip(),
                category=category,
                sub_category=sub_category,
                cause=cause,
                default_severity=default_severity,
                default_likelihood=default_likelihood,
                corrective_action=corrective_action or "",
                preventive_action=preventive_action or "",
                is_active=is_active,
                created_by=actor.username,
            )

        if affected_group_ids:
            ref.affected_groups.set(affected_group_ids)

        return ref
