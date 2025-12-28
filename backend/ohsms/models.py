from django.db import models


class Branch(models.Model):
    name = models.CharField(max_length=200, verbose_name="اسم الفرع")

    def __str__(self):
        return self.name


class Department(models.Model):
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name='departments',
        verbose_name="الفرع"
    )
    name = models.CharField(max_length=200, verbose_name="اسم الإدارة")

    def __str__(self):
        return f"{self.branch} - {self.name}"


class Section(models.Model):
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='sections',
        verbose_name="الإدارة"
    )
    name = models.CharField(max_length=200, verbose_name="اسم القسم")

    def __str__(self):
        return f"{self.department} - {self.name}"

class Incident(models.Model):
    INCIDENT_TYPES = [

        ('normal', 'بلاغ عادي'),
        ('urgent', 'بلاغ عاجل'),
        ('secret', 'بلاغ سري'),
    ]

    STATUS_CHOICES = [
        ('open', 'مفتوح'),
        ('in_progress', 'قيد المعالجة'),
        ('closed', 'مغلق'),
    ]

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, verbose_name="الفرع")
    department = models.ForeignKey(Department, on_delete=models.CASCADE, verbose_name="الإدارة")
    section = models.ForeignKey(Section, on_delete=models.CASCADE, verbose_name="القسم")

    title = models.CharField(max_length=200, verbose_name="عنوان البلاغ")
    description = models.TextField(verbose_name="وصف البلاغ")
    incident_type = models.CharField(max_length=20, choices=INCIDENT_TYPES, verbose_name="نوع البلاغ")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open', verbose_name="الحالة")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
secret_key = models.CharField(
    max_length=64,
    unique=True,
    null=True,
    blank=True,
    verbose_name="مفتاح متابعة البلاغ السري"
)

handled_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="تاريخ بدء المعالجة"
)

actor = models.ForeignKey(
        "auth.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="تم بواسطة"
    )



def __str__(self):
        return self.title
class IncidentEvent(models.Model):
    ACTION_CHOICES = [
        ('create', 'إنشاء'),
        ('receive', 'استلام'),
        ('assign', 'إحالة'),
        ('forward', 'تحويل'),
        ('progress', 'قيد المعالجة'),
        ('close', 'إغلاق'),
        ('escalate', 'تصعيد'),
        ('note', 'ملاحظة'),
    ]

    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name='events',
        verbose_name="البلاغ"
    )

    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        verbose_name="الإجراء"
    )

    from_status = models.CharField(
        max_length=20,
        verbose_name="الحالة السابقة"
    )

    to_status = models.CharField(
        max_length=20,
        verbose_name="الحالة الحالية"
    )

    note = models.TextField(
        blank=True,
        verbose_name="ملاحظة"
    )

    actor = models.CharField(
        max_length=200,
        verbose_name="تم بواسطة"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="التاريخ"
    )

    def __str__(self):
        return f"{self.incident} | {self.action}"
# =========================
# Risk Management Models
# =========================

class RiskCategory(models.Model):
    name = models.CharField(max_length=200, verbose_name="فئة الخطر الرئيسية")
    description = models.TextField(blank=True, verbose_name="الوصف")

    def __str__(self):
        return self.name


class RiskSubCategory(models.Model):
    category = models.ForeignKey(
        RiskCategory,
        on_delete=models.CASCADE,
        related_name="sub_categories",
        verbose_name="الفئة الرئيسية"
    )
    name = models.CharField(max_length=200, verbose_name="فئة الخطر الفرعية")

    def __str__(self):
        return f"{self.category} - {self.name}"


class RiskCause(models.Model):
    sub_category = models.ForeignKey(
        RiskSubCategory,
        on_delete=models.CASCADE,
        related_name="causes",
        verbose_name="الفئة الفرعية"
    )
    name = models.CharField(max_length=200, verbose_name="سبب الخطر")

    def __str__(self):
        return self.name


class AffectedGroup(models.Model):
    name = models.CharField(max_length=200, verbose_name="الفئة المتأثرة")

    def __str__(self):
        return self.name
class Risk(models.Model):

    SCOPE_CHOICES = [
        ('general', 'عام'),
        ('branch', 'فرع'),
        ('department', 'إدارة'),
        ('section', 'قسم'),
    ]

    STATUS_CHOICES = [
        ('draft', 'مسودة'),
        ('submitted', 'مقدم'),
        ('approved', 'معتمد'),
        ('in_progress', 'تحت المعالجة'),
        ('closed', 'مغلق'),
        ('rejected', 'مرفوض'),
    ]

    title = models.CharField(max_length=200, verbose_name="عنوان الخطر")
    description = models.TextField(verbose_name="وصف الخطر")

    category = models.ForeignKey(
        RiskCategory,
        on_delete=models.PROTECT,
        verbose_name="فئة الخطر الرئيسية"
    )
    sub_category = models.ForeignKey(
        RiskSubCategory,
        on_delete=models.PROTECT,
        verbose_name="فئة الخطر الفرعية"
    )
    cause = models.ForeignKey(
        RiskCause,
        on_delete=models.PROTECT,
        verbose_name="سبب الخطر"
    )

    affected_groups = models.ManyToManyField(
        AffectedGroup,
        verbose_name="الفئات المتأثرة"
    )

    severity = models.PositiveSmallIntegerField(verbose_name="الشدة")
    likelihood = models.PositiveSmallIntegerField(verbose_name="الاحتمالية")
    risk_score = models.PositiveSmallIntegerField(
        verbose_name="تقييم الخطر",
        editable=False
    )

    corrective_action = models.TextField(verbose_name="الإجراء التصحيحي")
    preventive_action = models.TextField(verbose_name="الإجراء الوقائي")

    owner_department = models.CharField(
        max_length=200,
        verbose_name="الإدارة المسؤولة"
    )
    owner_person = models.CharField(
        max_length=200,
        verbose_name="الشخص المفوض"
    )
    contact_channel = models.CharField(
        max_length=200,
        verbose_name="قناة التواصل"
    )

    scope_type = models.CharField(
        max_length=20,
        choices=SCOPE_CHOICES,
        verbose_name="نطاق الخطر"
    )

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="الفرع"
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="الإدارة"
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="القسم"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name="حالة الخطر"
    )

    created_by = models.CharField(
        max_length=200,
        verbose_name="أُدخل بواسطة"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاريخ الإدخال"
    )

    def save(self, *args, **kwargs):
        # حساب تقييم الخطر تلقائيًا
        self.risk_score = self.severity * self.likelihood
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
class RiskNote(models.Model):
    risk = models.ForeignKey(
        Risk,
        on_delete=models.CASCADE,
        related_name="notes",
        verbose_name="الخطر"
    )

    note = models.TextField(verbose_name="الملاحظة")

    created_by = models.CharField(
        max_length=200,
        verbose_name="أُضيفت بواسطة"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاريخ الإضافة"
    )

    def __str__(self):
        return f"ملاحظة على: {self.risk}"
# =========================
# Digital Forms Models
# =========================

class FormTemplate(models.Model):

    VISIBILITY_CHOICES = [
        ('public', 'عام'),
        ('restricted', 'محدد'),
    ]

    title = models.CharField(
        max_length=200,
        verbose_name="اسم النموذج"
    )

    description = models.TextField(
        blank=True,
        verbose_name="وصف النموذج"
    )

    visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default='restricted',
        verbose_name="نطاق النشر"
    )

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="الفرع"
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="الإدارة"
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="القسم"
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="مفعل"
    )

    created_by = models.CharField(
        max_length=200,
        verbose_name="أنشئ بواسطة"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاريخ الإنشاء"
    )

    def __str__(self):
        return self.title
class FormField(models.Model):

    FIELD_TYPE_CHOICES = [
        ('text', 'نص'),
        ('number', 'رقم'),
        ('textarea', 'نص طويل'),
        ('select', 'اختيار'),
        ('radio', 'اختيار فردي'),
        ('checkbox', 'نعم / لا'),
        ('date', 'تاريخ'),
    ]

    form = models.ForeignKey(
        FormTemplate,
        on_delete=models.CASCADE,
        related_name="fields",
        verbose_name="النموذج"
    )

    label = models.CharField(
        max_length=200,
        verbose_name="عنوان الحقل"
    )

    field_type = models.CharField(
        max_length=20,
        choices=FIELD_TYPE_CHOICES,
        verbose_name="نوع الحقل"
    )

    is_required = models.BooleanField(
        default=False,
        verbose_name="إلزامي"
    )

    order = models.PositiveSmallIntegerField(
        verbose_name="الترتيب"
    )

    options = models.TextField(
        blank=True,
        verbose_name="الخيارات (مفصولة بفواصل)"
    )

    def __str__(self):
        return f"{self.form} - {self.label}"
class FormSubmission(models.Model):

    form = models.ForeignKey(
        FormTemplate,
        on_delete=models.CASCADE,
        related_name="submissions",
        verbose_name="النموذج"
    )

    submitted_by = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="مُعبئ النموذج"
    )

    submitted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاريخ الإرسال"
    )

    def __str__(self):
        return f"تقديم: {self.form} - {self.submitted_at}"
class FormAnswer(models.Model):

    submission = models.ForeignKey(
        FormSubmission,
        on_delete=models.CASCADE,
        related_name="answers",
        verbose_name="التقديم"
    )

    field = models.ForeignKey(
        FormField,
        on_delete=models.CASCADE,
        verbose_name="الحقل"
    )

    value = models.TextField(
        verbose_name="الإجابة"
    )

    def __str__(self):
        return f"{self.field.label}"
# =========================
# RBAC - Roles & Scopes
# =========================

class Role(models.Model):
    """
    تعريف الدور (Role)
    """

    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="كود الدور"
    )

    name = models.CharField(
        max_length=200,
        verbose_name="اسم الدور"
    )

    is_global = models.BooleanField(
        default=False,
        verbose_name="صلاحية شاملة (بدون نطاق)"
    )

    description = models.TextField(
        blank=True,
        verbose_name="وصف الدور"
    )

    def __str__(self):
        return self.name
from django.contrib.auth.models import User


class UserRole(models.Model):
    """
    ربط المستخدم بالدور + النطاق
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="roles",
        verbose_name="المستخدم"
    )

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        verbose_name="الدور"
    )

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="الفرع"
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="الإدارة"
    )

    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="القسم"
    )

    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاريخ الإسناد"
    )

    def __str__(self):
        return f"{self.user} - {self.role}"
from django.contrib.auth.models import User


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('system_admin', 'مدير النظام'),
        ('system_staff', 'موظف النظام'),
        ('top_management', 'الإدارة العليا'),
        ('safety_committee', 'لجنة السلامة'),
        ('branch_manager', 'مدير فرع'),
        ('department_manager', 'مدير إدارة'),
        ('section_manager', 'مدير قسم'),
        ('safety_coordinator', 'منسق سلامة'),
        ('employee', 'موظف'),
        ('external', 'عميل / مورد / مقدم خدمة'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name="المستخدم"
    )

    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        verbose_name="الدور"
    )

    branch = models.ForeignKey(
        Branch,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="الفرع"
    )

    department = models.ForeignKey(
        Department,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="الإدارة"
    )

    section = models.ForeignKey(
        Section,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="القسم"
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="نشط"
    )

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"
class SystemContent(models.Model):
    CONTENT_TYPES = [
        ('policy', 'سياسة السلامة'),
        ('objectives', 'الأهداف'),
        ('scope', 'نطاق النظام'),
        ('awareness', 'التوعية'),
        ('homepage', 'الصفحة الرئيسية'),
        ('incident_instructions', 'تعليمات البلاغات'),
    ]

    content_type = models.CharField(
        max_length=50,
        choices=CONTENT_TYPES,
        unique=True,
        verbose_name="نوع المحتوى"
    )

    title = models.CharField(
        max_length=200,
        verbose_name="العنوان"
    )

    body = models.TextField(
        verbose_name="المحتوى"
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="نشط"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="آخر تحديث"
    )

    def __str__(self):
        return self.get_content_type_display()
