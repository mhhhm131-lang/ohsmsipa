from datetime import timedelta

from django.db.models import Count, Avg, DurationField, ExpressionWrapper, F, Q
from django.db.models.functions import TruncDate
from django.utils.timezone import now
from django.core.exceptions import FieldDoesNotExist

from ohsms.models import Incident, Risk

# إذا كان عندك IncidentEvent في models.py (وهذا غالبًا صحيح عندك)
try:
    from ohsms.models import IncidentEvent
except Exception:
    IncidentEvent = None


class DashboardService:
    """
    مؤشرات وإحصاءات النظام (Backend) - جاهزة للاستهلاك من أي واجهة لاحقًا
    """

    # ======================
    # Helpers
    # ======================

    @staticmethod
    def _has_field(model, field_name: str) -> bool:
        try:
            model._meta.get_field(field_name)
            return True
        except FieldDoesNotExist:
            return False

    @staticmethod
    def _date_range(days: int = 30):
        end = now()
        start = end - timedelta(days=days)
        return start, end

    # ======================
    # Incidents (بلاغات)
    # ======================

    @staticmethod
    def incidents_kpis(days: int = 30):
        start, end = DashboardService._date_range(days)

        base = Incident.objects.all()
        recent = base.filter(created_at__gte=start, created_at__lte=end)

        return {
            "total": base.count(),
            "last_days_total": recent.count(),
            "by_status": list(base.values("status").annotate(count=Count("id")).order_by("-count")),
            "by_type": list(base.values("incident_type").annotate(count=Count("id")).order_by("-count")),
        }

    @staticmethod
    def incidents_top_types(limit: int = 5, days: int = 90):
        start, end = DashboardService._date_range(days)
        qs = Incident.objects.filter(created_at__gte=start, created_at__lte=end)
        return list(
            qs.values("incident_type")
              .annotate(count=Count("id"))
              .order_by("-count")[:limit]
        )

    @staticmethod
    def incidents_by_scope(days: int = 90):
        """
        البلاغات حسب الفرع/الإدارة/القسم (Top)
        """
        start, end = DashboardService._date_range(days)
        qs = Incident.objects.filter(created_at__gte=start, created_at__lte=end)

        by_branch = list(qs.values("branch__name").annotate(count=Count("id")).order_by("-count")[:10])
        by_department = list(qs.values("department__name").annotate(count=Count("id")).order_by("-count")[:10])
        by_section = list(qs.values("section__name").annotate(count=Count("id")).order_by("-count")[:10])

        return {
            "by_branch_top": by_branch,
            "by_department_top": by_department,
            "by_section_top": by_section,
        }

    @staticmethod
    def incidents_trend(days: int = 30):
        """
        اتجاه البلاغات يوميًا (آخر N يوم)
        """
        start, end = DashboardService._date_range(days)
        qs = Incident.objects.filter(created_at__gte=start, created_at__lte=end)

        return list(
            qs.annotate(day=TruncDate("created_at"))
              .values("day")
              .annotate(count=Count("id"))
              .order_by("day")
        )

    @staticmethod
    def incident_avg_response_time():
        """
        متوسط سرعة الاستجابة:
        - إذا كان يوجد handled_at في Incident: نستخدمه
        - وإلا: نحاول حساب أول "حدث" على IncidentEvent
        """
        # 1) handled_at (إن وجد)
        if DashboardService._has_field(Incident, "handled_at"):
            qs = Incident.objects.exclude(handled_at__isnull=True).annotate(
                response_time=ExpressionWrapper(
                    F("handled_at") - F("created_at"),
                    output_field=DurationField()
                )
            )
            return qs.aggregate(avg_response=Avg("response_time"))

        # 2) IncidentEvent fallback
        if IncidentEvent is None:
            return {"avg_response": None, "note": "لا يوجد handled_at ولا IncidentEvent متاح"}

        # نحسب أول event لكل incident (أول تفاعل) كوقت استجابة
        # ملاحظة: هذا يعتمد أن IncidentEvent فيه created_at أو timestamp مشابه
        time_field = "created_at" if DashboardService._has_field(IncidentEvent, "created_at") else None
        if time_field is None:
            return {"avg_response": None, "note": "IncidentEvent لا يحتوي created_at"}

        # أحداث بعد الإنشاء مباشرة تعتبر استجابة (أي event)
        # (لاحقًا يمكن تقييدها بـ action معين مثل receive/in_progress)
        # نحسب الفرق عبر تجميع متوسط الفرق بطريقة مبسطة:
        # سنستخدم آخر حل عملي: متوسط (min_event_time - created_at) عبر Python لاحقًا إن احتجنا.
        # هنا نُرجع KPI أولي: نسبة البلاغات التي لديها أي Event.
        with_event = Incident.objects.filter(events__isnull=False).distinct().count() if hasattr(Incident, "events") else None
        return {"avg_response": None, "note": "فعّل handled_at أو حدّد علاقة events لاحتساب المتوسط بدقة", "incidents_with_any_event": with_event}

    @staticmethod
    def incident_sla_compliance(hours: int = 24):
        """
        نسبة الالتزام بـ SLA (مثلاً الرد خلال 24 ساعة)
        يعتمد على handled_at إذا كان موجود.
        """
        if not DashboardService._has_field(Incident, "handled_at"):
            return {"sla_hours": hours, "compliance_pct": None, "note": "أضف handled_at لحساب SLA بدقة"}

        total = Incident.objects.count()
        if total == 0:
            return {"sla_hours": hours, "compliance_pct": 0}

        within = Incident.objects.exclude(handled_at__isnull=True).filter(
            handled_at__lte=F("created_at") + timedelta(hours=hours)
        ).count()

        return {
            "sla_hours": hours,
            "compliance_pct": round((within / total) * 100, 2),
            "within_sla": within,
            "total": total,
        }

    # ======================
    # Risks (مخاطر)
    # ======================

    @staticmethod
    def risks_kpis(days: int = 90):
        start, end = DashboardService._date_range(days)

        base = Risk.objects.all()
        recent = base.filter(created_at__gte=start, created_at__lte=end)

        return {
            "total": base.count(),
            "last_days_total": recent.count(),
            "by_status": list(base.values("status").annotate(count=Count("id")).order_by("-count")),
            "high_risks_count": base.filter(risk_score__gte=15).count(),
        }

    @staticmethod
    def risks_by_category(limit: int = 10, days: int = 180):
        start, end = DashboardService._date_range(days)
        qs = Risk.objects.filter(created_at__gte=start, created_at__lte=end)

        return list(
            qs.values("category__name")
              .annotate(count=Count("id"))
              .order_by("-count")[:limit]
        )

    @staticmethod
    def risks_distribution():
        """
        توزيع المخاطر حسب التقييم (Low/Medium/High) - قابل للتعديل حسب مصفوفة الجهة
        """
        qs = Risk.objects.all()
        low = qs.filter(risk_score__lte=6).count()
        medium = qs.filter(risk_score__gte=7, risk_score__lte=14).count()
        high = qs.filter(risk_score__gte=15).count()

        return {"low": low, "medium": medium, "high": high}

    @staticmethod
    def risks_trend(days: int = 30):
        start, end = DashboardService._date_range(days)
        qs = Risk.objects.filter(created_at__gte=start, created_at__lte=end)

        return list(
            qs.annotate(day=TruncDate("created_at"))
              .values("day")
              .annotate(count=Count("id"))
              .order_by("day")
        )

    @staticmethod
    def dashboard_snapshot():
        """
        لقطة شاملة واحدة للداشبورد (أرقام + قوائم) تُستخدم في API واحدة لاحقًا
        """
        return {
            "incidents": {
                "kpis": DashboardService.incidents_kpis(days=30),
                "top_types": DashboardService.incidents_top_types(limit=5, days=90),
                "by_scope": DashboardService.incidents_by_scope(days=90),
                "trend_30d": DashboardService.incidents_trend(days=30),
                "avg_response": DashboardService.incident_avg_response_time(),
                "sla_24h": DashboardService.incident_sla_compliance(hours=24),
            },
            "risks": {
                "kpis": DashboardService.risks_kpis(days=90),
                "by_category": DashboardService.risks_by_category(limit=10, days=180),
                "distribution": DashboardService.risks_distribution(),
                "trend_30d": DashboardService.risks_trend(days=30),
            }
        }
