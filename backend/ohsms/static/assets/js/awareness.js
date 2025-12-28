
const AWARENESS_VIEWS_KEY = 'ohsms_awareness_views';

const awarenessItems = [
  {
    id: 1,
    title: 'إجراءات الإخلاء في حالات الطوارئ',
    category: 'الطوارئ والإخلاء',
    type: 'تعليمات',
    audience: 'الموظفين',
    level: 'متوسط',
    year: 2025,
    description: 'خطوات الإخلاء المنظمة عند حدوث حريق أو حادث طارئ داخل المبنى، مع تقسيم الأدوار وطرق التواصل ونقاط التجمع.',
    tags: ['إخلاء', 'طوارئ', 'سلامة المنشآت'],
    mediaKind: 'pdf',
    mediaHint: 'دليل PDF داخلي يمكن تنزيله أو مشاركته عبر النظام.'
  },
  {
    id: 2,
    title: 'فيديو توعوي: استخدام طفايات الحريق بطريقة صحيحة',
    category: 'مكافحة الحريق',
    type: 'فيديو',
    audience: 'الموظفين',
    level: 'أساسي',
    year: 2024,
    description: 'شرح مبسط لطريقة استخدام طفايات الحريق وفق قاعدة PASS (اسحب، وجّه، اضغط، امسح) مع أمثلة عملية.',
    tags: ['حريق', 'طفايات', 'تدريب'],
    mediaKind: 'video',
    mediaHint: 'مقطع فيديو يمكن ربطه بمنصة تعليم إلكتروني أو سيرفر داخلي.'
  },
  {
    id: 3,
    title: 'نشرة الوقاية من الانزلاق والسقوط في بيئة العمل',
    category: 'السلامة المهنية',
    type: 'منشور',
    audience: 'الموظفين',
    level: 'أساسي',
    year: 2025,
    description: 'نقاط سريعة للوقاية من حوادث الانزلاق والسقوط في الممرات والمكاتب ومناطق التخزين، مع أمثلة على العلامات الأرضية.',
    tags: ['انزلاق', 'سقوط', 'السلامة المهنية'],
    mediaKind: 'image',
    mediaHint: 'بوستر توعوي يمكن عرضه على الشاشات الداخلية أو طباعته.'
  },
  {
    id: 4,
    title: 'دليل الإسعافات الأولية للحروق البسيطة والمتوسطة',
    category: 'الإسعافات الأولية',
    type: 'مقال',
    audience: 'الموظفين',
    level: 'متوسط',
    year: 2024,
    description: 'خطوات عملية للتعامل مع الحروق البسيطة والمتوسطة إلى حين وصول الفريق الطبي، مع توضيح ما يجب تجنّبه.',
    tags: ['الإسعافات الأولية', 'حروق'],
    mediaKind: 'text',
    mediaHint: 'نص إرشادي يمكن تحويله إلى بروشور أو ملف PDF توعوي.'
  },
  {
    id: 5,
    title: 'أساسيات الأمن السيبراني لمستخدمي البريد الإلكتروني',
    category: 'الأمن السيبراني',
    type: 'تعليمات',
    audience: 'الموظفين',
    level: 'أساسي',
    year: 2023,
    description: 'إرشادات مهمة لتفادي روابط خبيثة ورسائل التصيّد الاحتيالي، وكيفية إنشاء كلمات مرور قوية وإدارة الحسابات.',
    tags: ['أمن المعلومات', 'البريد الإلكتروني'],
    mediaKind: 'pdf',
    mediaHint: 'ملف توعوي يمكن تحديثه بشكل سنوي وفق السياسات المعتمدة.'
  },
  {
    id: 6,
    title: 'برنامج التوعية بالضغوط النفسية في بيئة العمل',
    category: 'الصحة النفسية',
    type: 'مقال',
    audience: 'الإدارة',
    level: 'متقدم',
    year: 2025,
    description: 'مبادئ رصد الضغوط النفسية المتراكمة لدى الموظفين وكيفية دعمهم وتحسين بيئة العمل وتقليل الاحتراق الوظيفي.',
    tags: ['الصحة النفسية', 'بيئة العمل'],
    mediaKind: 'text',
    mediaHint: 'مادة موجهة للإدارة يمكن استخدامها في برامج التدريب القيادي.'
  },
  {
    id: 7,
    title: 'نشرة التميز والجودة في تقديم الخدمة للعميل',
    category: 'الجودة والتميز',
    type: 'منشور',
    audience: 'المشرفين',
    level: 'متوسط',
    year: 2024,
    description: 'محاور سريعة تساعد المشرفين على تعزيز ثقافة الجودة والتميّز في فرق العمل، مع أمثلة على مؤشرات الأداء.',
    tags: ['الجودة', 'التميز', 'قيادة الفرق'],
    mediaKind: 'image',
    mediaHint: 'نشرة تصميمية يمكن مشاركتها إلكترونيًا وعرضها داخل الإدارات.'
  },
  {
    id: 8,
    title: 'البيئة والاستدامة: تقليل الهدر في استهلاك الطاقة',
    category: 'البيئة والاستدامة',
    type: 'مقال',
    audience: 'الموظفين',
    level: 'أساسي',
    year: 2023,
    description: 'ممارسات عملية لتقليل استهلاك الطاقة في المكاتب والمنشآت وربطها بأهداف الاستدامة والمسؤولية المجتمعية.',
    tags: ['استدامة', 'بيئة', 'طاقة'],
    mediaKind: 'text',
    mediaHint: 'مادة توعوية يمكن إدراجها ضمن حملات الترشيد في المنشأة.'
  }
];

function loadAwarenessViews(){
  try{
    return JSON.parse(localStorage.getItem(AWARENESS_VIEWS_KEY) || '{}');
  }catch(e){
    return {};
  }
}
function saveAwarenessViews(v){
  localStorage.setItem(AWARENESS_VIEWS_KEY, JSON.stringify(v));
}

function getAwarenessFilters(){
  const getVal = id => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };
  return {
    search: getVal('aw-search'),
    cat: getVal('aw-category'),
    type: getVal('aw-type'),
    audience: getVal('aw-audience'),
    level: getVal('aw-level'),
    year: getVal('aw-year')
  };
}

function awarenessPassesFilters(item, f){
  if(f.cat && item.category !== f.cat) return false;
  if(f.type && item.type !== f.type) return false;
  if(f.audience && item.audience !== f.audience) return false;
  if(f.level && item.level !== f.level) return false;
  if(f.year && String(item.year) !== String(f.year)) return false;

  if(f.search){
    const s = f.search.toLowerCase();
    const combo = (item.title + ' ' + item.description + ' ' + (item.tags||[]).join(' ')).toLowerCase();
    if(!combo.includes(s)) return false;
  }
  return true;
}

function renderAwarenessGrid(){
  const grid = document.getElementById('aw-grid');
  const empty = document.getElementById('aw-empty');
  if(!grid || !empty) return;

  const filters = getAwarenessFilters();
  const views = loadAwarenessViews();

  let items = awarenessItems.filter(it => awarenessPassesFilters(it, filters));
  items = items.slice().sort((a,b)=> b.year - a.year);

  grid.innerHTML = '';
  if(!items.length){
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  items.forEach(it=>{
    const v = views[it.id] || 0;
    const card = document.createElement('article');
    card.className = 'aw-card';
    card.innerHTML = `
      <div class="aw-card-tag">${it.type}</div>
      <h3 class="aw-card-title">${it.title}</h3>
      <p class="aw-card-desc">${it.description}</p>
      <div class="aw-card-meta">
        <span>${it.category}</span>
        <span>${it.year}</span>
      </div>
      <div class="aw-card-footer">
        <span class="aw-card-audience">${it.audience} – ${it.level}</span>
        <span class="aw-card-views">${v} مشاهدة</span>
      </div>
    `;
    card.addEventListener('click', ()=> openAwarenessModal(it));
    grid.appendChild(card);
  });
}

function openAwarenessModal(item){
  const modal = document.getElementById('aw-modal');
  if(!modal) return;

  const views = loadAwarenessViews();
  views[item.id] = (views[item.id] || 0) + 1;
  saveAwarenessViews(views);

  const titleEl = document.getElementById('aw-modal-title');
  const metaEl = document.getElementById('aw-modal-meta');
  const mediaEl = document.getElementById('aw-modal-media');
  const descEl = document.getElementById('aw-modal-desc');
  const tagsEl = document.getElementById('aw-modal-tags');
  const viewsEl = document.getElementById('aw-modal-views');

  if(titleEl) titleEl.textContent = item.title;
  if(metaEl) metaEl.textContent = item.category + ' – ' + item.type + ' – ' + item.year;
  if(descEl) descEl.textContent = item.description;
  if(tagsEl) tagsEl.textContent = 'الكلمات المفتاحية: ' + (item.tags && item.tags.length ? item.tags.join('، ') : 'لا يوجد');
  if(viewsEl) viewsEl.textContent = (views[item.id] || 0) + ' مشاهدة حتى الآن.';
  if(mediaEl) mediaEl.textContent = item.mediaHint || '';

  modal.classList.remove('aw-hidden');
  renderAwarenessGrid();
}

document.addEventListener('DOMContentLoaded', ()=>{
  ['aw-search','aw-category','aw-type','aw-audience','aw-level','aw-year']
    .forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('input', renderAwarenessGrid);
      el.addEventListener('change', renderAwarenessGrid);
    });

  const closeBtn = document.getElementById('aw-modal-close');
  const modal = document.getElementById('aw-modal');
  if(closeBtn && modal){
    closeBtn.addEventListener('click', ()=> modal.classList.add('aw-hidden'));
    modal.addEventListener('click', (e)=>{
      if(e.target === modal){
        modal.classList.add('aw-hidden');
      }
    });
  }

  renderAwarenessGrid();
});
