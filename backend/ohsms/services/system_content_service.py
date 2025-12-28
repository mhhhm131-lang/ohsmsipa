from ohsms.models import SystemContent


class SystemContentService:
    @staticmethod
    def get_homepage_content():
        """
        جلب محتوى الصفحة الرئيسية من SystemContent
        """
        try:
            return SystemContent.objects.get(
                content_type='homepage',
                is_active=True
            )
        except SystemContent.DoesNotExist:
            return None
