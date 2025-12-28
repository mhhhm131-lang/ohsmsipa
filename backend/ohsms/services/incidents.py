from ohsms.models import Incident, IncidentEvent
from django.utils import timezone
import secrets


class IncidentService:
    """
    منطق مركزي لإدارة انتقالات حالة البلاغ
    """

    ALLOWED_TRANSITIONS = {
        'open': ['in_progress', 'closed'],
        'in_progress': ['closed'],
        'closed': [],
    }

    @staticmethod
    def change_status(
        incident: Incident,
        new_status: str,
        actor: str,
        note: str = ''
    ):
        current_status = incident.status

        if new_status not in IncidentService.ALLOWED_TRANSITIONS.get(current_status, []):
            raise ValueError(
                f"لا يمكن الانتقال من الحالة {current_status} إلى {new_status}"
            )

        # تحديث الحالة
        incident.status = new_status

        # تسجيل وقت بدء المعالجة لأول مرة
        if new_status == 'in_progress' and incident.handled_at is None:
            incident.handled_at = timezone.now()

        # حفظ البلاغ
        incident.save()

        # تسجيل الحدث في السجل الزمني
        IncidentEvent.objects.create(
            incident=incident,
            action=(
                'progress' if new_status == 'in_progress'
                else 'close' if new_status == 'closed'
                else 'note'
            ),
            from_status=current_status,
            to_status=new_status,
            actor=actor,
            note=note
        )
    @staticmethod
    def _generate_incident_number():
        year = timezone.now().strftime("%Y")
        last = Incident.objects.filter(number__startswith=year).order_by("-number").first()
        if not last:
            return f"{year}-0001"
        seq = int(last.number.split("-")[-1]) + 1
        return f"{year}-{seq:04d}"

    @staticmethod
    def create_normal_incident(user, title, description, branch, department, section):
        incident = Incident.objects.create(
            number=IncidentService._generate_incident_number(),
            created_by=user,
            title=title,
            description=description,
            incident_type='normal',
            branch=branch,
            department=department,
            section=section,
        )

        IncidentEvent.objects.create(
            incident=incident,
            action='create',
            from_status='',
            to_status='open',
            actor=user,
            note='تم إنشاء البلاغ العادي'
        )

        return incident

    @staticmethod
    def create_urgent_incident():
        incident = Incident.objects.create(
            number=IncidentService._generate_incident_number(),
            incident_type='urgent',
            status='open'
        )

        IncidentEvent.objects.create(
            incident=incident,
            action='create',
            from_status='',
            to_status='open',
            actor=None,
            note='بلاغ عاجل عبر مكالمة أو واتساب'
        )

        return incident

    @staticmethod
    def create_secret_incident(title, description, secrecy_reason):
        secret_key = secrets.token_urlsafe(16)

        incident = Incident.objects.create(
            number=IncidentService._generate_incident_number(),
            incident_type='secret',
            title=title,
            description=description,
            secrecy_reason=secrecy_reason,
            secret_key=secret_key,
            status='open'
        )

        IncidentEvent.objects.create(
            incident=incident,
            action='create',
            from_status='',
            to_status='open',
            actor=None,
            note='بلاغ سري بدون تسجيل دخول'
        )

        return incident, secret_key
