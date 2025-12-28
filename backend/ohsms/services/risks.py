from ohsms.models import Risk, RiskNote


class RiskService:
    """
    منطق إدارة دورة حياة الخطر والصلاحيات
    """

    @staticmethod
    def submit_risk(risk: Risk):
        if risk.status != 'draft':
            raise ValueError("لا يمكن تقديم خطر ليس في حالة مسودة")

        risk.status = 'submitted'
        risk.save()

    @staticmethod
    def approve_risk(risk: Risk, actor: str):
        if risk.status != 'submitted':
            raise ValueError("لا يمكن اعتماد خطر غير مقدم")

        risk.status = 'approved'
        risk.save()

        RiskNote.objects.create(
            risk=risk,
            note="تم اعتماد الخطر",
            created_by=actor
        )

    @staticmethod
    def reject_risk(risk: Risk, actor: str, reason: str):
        if risk.status != 'submitted':
            raise ValueError("لا يمكن رفض خطر غير مقدم")

        risk.status = 'rejected'
        risk.save()

        RiskNote.objects.create(
            risk=risk,
            note=f"تم رفض الخطر: {reason}",
            created_by=actor
        )

    @staticmethod
    def add_note(risk: Risk, note: str, actor: str):
        RiskNote.objects.create(
            risk=risk,
            note=note,
            created_by=actor
        )
