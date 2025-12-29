from django.apps import AppConfig
from django.contrib.auth import get_user_model
import os

class OhsmsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ohsms'

    def ready(self):
        User = get_user_model()

        username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "Admin@123")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@example.com")

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(
                username=username,
                password=password,
                email=email
            )
