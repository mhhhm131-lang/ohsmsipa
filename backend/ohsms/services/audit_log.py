class AuditLogService:
    """
    خدمة مركزية لتسجيل الأحداث (Audit Trail)
    """

    @staticmethod
    def log(
        *,
        user=None,
        action=None,
        model_name=None,
        object_id=None,
        description="",
        ip_address=None
    ):
        try:
            from ohsms.models import AuditLog

            AuditLog.objects.create(
                user=user,
                action=action,
                model_name=model_name,
                object_id=str(object_id) if object_id else None,
                description=description,
                ip_address=ip_address,
            )

        except Exception:
            # 🔒 لا نكسر النظام إذا لم تكن الموديلات جاهزة
            pass
