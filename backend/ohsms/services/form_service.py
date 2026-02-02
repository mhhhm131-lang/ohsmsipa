from django.contrib.auth.models import User
from ohsms.models import FormEvent

from ohsms.models import (
    FormTemplate,
    FormField,
    FormSubmission,
    FormAnswer,
)
from ohsms.services.audit_log import AuditLogService
from ohsms.core.model_context import allow_model_mutation
from ohsms.core.errors import PermissionDenied, ValidationFailed


class FormService:
    """
    Source of Truth لإدارة النماذج الرقمية
    """

    # =========================
    # Guards
    # =========================

    @staticmethod
    def _ensure_actor(actor):
        if not isinstance(actor, User):
            raise PermissionDenied(message="المنفذ يجب أن يكون مستخدمًا صالحًا")

    # =========================
    # Templates
    # =========================

    @staticmethod
    def create_template(
        *,
        title: str,
        description: str,
        visibility: str,
        actor: User,
        branch=None,
        department=None,
        section=None,
    ) -> FormTemplate:
        FormService._ensure_actor(actor)

        if not title:
            raise ValidationFailed(message="عنوان النموذج إلزامي")

        allow_model_mutation()

        template = FormTemplate.objects.create(
            title=title,
            description=description,
            visibility=visibility,
            branch=branch,
            department=department,
            section=section,
            is_active=True,
            created_by=actor.username,
        )
        FormEvent.objects.create(
    form=template,
    action="create_template",
    actor=actor,
    payload={
        "title": title,
        "visibility": visibility,
    },
)


        AuditLogService.log(
            user=actor,
            action="create",
            model_name="FormTemplate",
            object_id=template.id,
            description=f"إنشاء نموذج: {title}",
        )

        return template
    
    @staticmethod
    def attach_risk_references(
        *,
        form: FormTemplate,
        reference_ids: list[int],
        actor: User,
    ):
        """
        ربط نموذج رقمي بمخاطر مرجعية (Read-only consumption)
        """
        pass

     # =========================
    # Risk References
    # =========================

    @staticmethod
    def attach_risk_references(
        *,
        form: FormTemplate,
        reference_ids: list[int],
        actor: User,
    ) -> FormTemplate:
        """
        ربط نموذج رقمي بمخاطر مرجعية (Read-only consumption)
        """
        FormService._ensure_actor(actor)

        if not reference_ids:
            raise ValidationFailed(message="يجب تحديد مخاطر مرجعية للربط")

        from ohsms.models import RiskReference

        refs = list(
            RiskReference.objects.filter(
                id__in=reference_ids,
                is_active=True
            )
        )

        if not refs:
            raise ValidationFailed(message="لا توجد مخاطر مرجعية صالحة")

        allow_model_mutation()

        form.risk_references.set(refs)

        FormEvent.objects.create(
            form=form,
            action="attach_risk_references",
            actor=actor,
            payload={
                "reference_ids": reference_ids,
            },
        )

        AuditLogService.log(
            user=actor,
            action="attach",
            model_name="FormTemplate",
            object_id=form.id,
            description=f"ربط مخاطر مرجعية بالنموذج {form.title}",
        )

        return form

    # =========================
    # Fields
    # =========================

    @staticmethod
    def add_field(
        *,
        form: FormTemplate,
        label: str,
        field_type: str,
        order: int,
        actor: User,
        is_required: bool = False,
        options: str = "",
    ) -> FormField:
        FormService._ensure_actor(actor)

        if not label:
            raise ValidationFailed(message="عنوان الحقل إلزامي")

        allow_model_mutation()

        field = FormField.objects.create(
            form=form,
            label=label,
            field_type=field_type,
            is_required=is_required,
            order=order,
            options=options,
        )
        FormEvent.objects.create(
    form=form,
    action="add_field",
    actor=actor,
    payload={
        "label": label,
        "field_type": field_type,
        "order": order,
        "required": is_required,
    },
)


        AuditLogService.log(
            user=actor,
            action="create",
            model_name="FormField",
            object_id=field.id,
            description=f"إضافة حقل '{label}' إلى النموذج {form.title}",
        )

        return field

    # =========================
    # Submissions
    # =========================

    @staticmethod
    def submit_form(
        *,
        form: FormTemplate,
        answers: list[dict],
        actor: User | None = None,
        submitted_by: str = "",
    ) -> FormSubmission:
        if not form.is_active:
            raise ValidationFailed(message="النموذج غير مفعل")

        allow_model_mutation()

        submission = FormSubmission.objects.create(
            form=form,
            submitted_by=submitted_by or (actor.username if actor else ""),
        )

        for ans in answers:
            FormAnswer.objects.create(
                submission=submission,
                field=ans["field"],
                value=ans.get("value", ""),
            )

        AuditLogService.log(
            user=actor,
            action="submit",
            model_name="FormSubmission",
            object_id=submission.id,
            description=f"تقديم نموذج: {form.title}",
        )
        FormEvent.objects.create(
    form=form,
    submission=submission,
    action="submit",
    actor=actor,
    payload={
        "answers_count": len(answers),
        "submitted_by": submitted_by,
    },
)


        return submission
