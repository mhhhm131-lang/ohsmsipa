from django.shortcuts import render
from ohsms.services.system_content_service import SystemContentService


def home_view(request):
    homepage_content = SystemContentService.get_homepage_content()

    context = {
        "homepage": homepage_content
    }

    return render(request, "ohsms/index.html", context)
