from django.apps import AppConfig
from django.contrib.auth import get_user_model
import os

class OhsmsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ohsms'

    def ready(self):
        User = get_user_model()

        username = "admin"
        password = "Admin@123"
        email = "admin@example.com"

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(
                username=username,
                password=password,
                email=email
            )
