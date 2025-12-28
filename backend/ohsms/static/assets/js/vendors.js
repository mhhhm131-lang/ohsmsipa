

const VENDORS_KEY = 'ohsms_vendors';

function loadVendors(){
  try{
    return JSON.parse(localStorage.getItem(VENDORS_KEY) || '[]');
  }catch(e){
    return [];
  }
}
function saveVendors(arr){
  localStorage.setItem(VENDORS_KEY, JSON.stringify(arr));
}
function generateVendorId(){
  const year = new Date().getFullYear();
  const all = loadVendors();
  const nums = all
    .filter(v => String(v.id||'').startsWith('VND-'+year))
    .map(v => parseInt(String(v.id).split('-').pop()||'0',10) || 0);
  const next = (nums.length?Math.max.apply(null,nums):0)+1;
  return 'VND-'+year+'-'+String(next).padStart(4,'0');
}

function ensureSeedVendors(){
  const current = loadVendors();
  if(current && current.length) return;
  const seed = [
    {
      id: generateVendorId(),
      name: 'شركة الأمان الأولى للمقاولات',
      type: 'مقاول رئيسي',
      cr: '1012345678',
      contactName: 'م. أحمد السبيعي',
      contactMobile: '0500000001',
      city: 'الرياض',
      phone: '011-0000000',
      email: 'info@aman1.com',
      rating: 4,
      notes: 'تنفيذ مشاريع رئيسية وصيانة معدات السلامة.',
      documents: [
        {type:'شهادة سلامة', number:'SAF-2024-001', issue:'2024-01-01', expiry:'2025-01-01'},
        {type:'تأمين مسؤولية', number:'INS-2024-010', issue:'2024-02-01', expiry:'2024-12-31'}
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: generateVendorId(),
      name: 'مؤسسة التوريد المتكامل',
      type: 'مورد',
      cr: '2056789123',
      contactName: 'سارة الدوسري',
      contactMobile: '0500000002',
      city: 'الدمام',
      phone: '013-0000000',
      email: 'sales@imsupplies.com',
      rating: 3,
      notes: 'توريد معدات السلامة الشخصية وطفايات الحريق.',
      documents: [
        {type:'سجل تجاري', number:'CR-2056-2023', issue:'2023-05-01', expiry:'2026-05-01'}
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: generateVendorId(),
      name: 'مكتب الخبرة للاستشارات الهندسية',
      type: 'استشاري',
      cr: '3001122334',
      contactName: 'د. خالد المطيري',
      contactMobile: '0500000003',
      city: 'جدة',
      phone: '012-0000000',
      email: 'consult@khubraeng.com',
      rating: 5,
      notes: 'استشارات سلامة مهنية ومراجعة خطط الإخلاء والطوارئ.',
      documents: [
        {type:'اعتماد استشاري', number:'CONS-2023-22', issue:'2023-09-01', expiry:'2025-09-01'}
      ],
      createdAt: new Date().toISOString()
    }
  ];
  saveVendors(seed);
}

function calcDocStatus(doc){
  if(!doc || !doc.expiry) return 'none';
  const today = new Date();
  const exp = new Date(doc.expiry);
  if(isNaN(exp.getTime())) return 'none';
  const diffDays = (exp - today)/(1000*60*60*24);
  if(diffDays < 0) return 'expired';
  if(diffDays <= 30) return 'warning';
  return 'valid';
}
function summarizeVendorDocs(vendor){
  if(!vendor.documents || !vendor.documents.length){
    return {status:'none', label:'لا توجد وثائق مسجلة'};
  }
  let hasExpired=false, hasWarning=false, hasValid=false;
  vendor.documents.forEach(d=>{
    const s = calcDocStatus(d);
    if(s==='expired') hasExpired=true;
    else if(s==='warning') hasWarning=true;
    else if(s==='valid') hasValid=true;
  });
  if(hasExpired){
    return {status:'expired', label:'وثائق منتهية أو غير محدثة'};
  }
  if(hasWarning){
    return {status:'warning', label:'وثائق تنتهي قريبًا (≤ 30 يوم)'};
  }
  if(hasValid){
    return {status:'valid', label:'وثائق سارية'};
  }
  return {status:'none', label:'لا توجد وثائق فعّالة'};
}

function renderVendorsKpi(){
  const container = document.getElementById('vendorsKpi');
  if(!container) return;
  const list = loadVendors();
  let expiredCount=0, warningCount=0, validCount=0, docsTotal=0;
  let ratingSum=0;
  list.forEach(v=>{
    const summary = summarizeVendorDocs(v);
    if(summary.status==='expired') expiredCount++;
    else if(summary.status==='warning') warningCount++;
    else if(summary.status==='valid') validCount++;
    ratingSum += (parseInt(v.rating||'0',10) || 0);
    docsTotal += (v.documents ? v.documents.length : 0);
  });
  const total = list.length;
  const avgRating = total ? (ratingSum/total).toFixed(1) : '0.0';
  container.innerHTML = '';

  function addCard(label,value,sub,light){
    const div = document.createElement('div');
    div.className = 'kpi-card' + (light ? ' light':''); 
    div.innerHTML = '<div class="kpi-label">'+label+'</div>'+
                    '<div class="kpi-value">'+value+'</div>'+
                    (sub?'<div class="kpi-sub">'+sub+'</div>':'');
    container.appendChild(div);
  }
  addCard('الشركات المسجلة', total, 'إجمالي الشركات المتعاقدة والمورّدين', false);
  addCard('وثائق سارية', validCount, 'شركات وثائقها سارية بالكامل أو جزئيًا', true);
  addCard('وثائق تنتهي قريبًا', warningCount, 'شركات تحتاج متابعة لتجديد الوثائق', true);
  addCard('وثائق منتهية', expiredCount, 'شركات تحتوي على وثائق منتهية', false);
  addCard('متوسط التقييم', avgRating, 'متوسط تقييم الأداء للشركات (من 5)', true);
  addCard('إجمالي عدد الوثائق', docsTotal, 'مجموع الوثائق المسجلة لكل الشركات', true);
}

function buildStars(rating){
  const r = Math.max(0, Math.min(5, parseInt(rating||'0',10) || 0));
  let s = '';
  for(let i=0;i<5;i++){
    s += i<r ? '★' : '☆';
  }
  return s;
}

let currentDocsVendorId = null;

function getFilters(){
  const s = document.getElementById('vendorSearch').value.trim().toLowerCase();
  const type = document.getElementById('vendorTypeFilter').value;
  const docStatus = document.getElementById('vendorDocStatusFilter').value;
  const rating = document.getElementById('vendorRatingFilter').value;
  return {s, type, docStatus, rating: rating ? parseInt(rating,10) : 0};
}

function passesFilters(v, filters){
  if(filters.s){
    const combo = (v.name+' '+(v.contactName||'')).toLowerCase();
    if(!combo.includes(filters.s)) return false;
  }
  if(filters.type && v.type !== filters.type) return false;
  if(filters.rating){
    const r = parseInt(v.rating||'0',10) || 0;
    if(r < filters.rating) return false;
  }
  if(filters.docStatus){
    const st = summarizeVendorDocs(v).status;
    if(st !== filters.docStatus) return false;
  }
  return true;
}

function renderVendorsGrid(){
  const grid = document.getElementById('vendorsGrid');
  const empty = document.getElementById('vendorsEmpty');
  if(!grid || !empty) return;
  const list = loadVendors();
  const filters = getFilters();
  const filtered = list.filter(v=>passesFilters(v, filters));

  grid.innerHTML = '';
  if(!filtered.length){
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filtered.forEach(v=>{
    const summary = summarizeVendorDocs(v);
    const card = document.createElement('article');
    card.className = 'vendor-card';

    const header = document.createElement('div');
    header.className = 'vendor-header';
    header.innerHTML = '<div><div class="vendor-name">'+v.name+'</div></div>';
    const typeBadge = document.createElement('div');
    typeBadge.className = 'vendor-type';
    typeBadge.textContent = v.type || 'غير محدد';
    header.appendChild(typeBadge);
    card.appendChild(header);

    const ratingEl = document.createElement('div');
    ratingEl.className = 'vendor-rating';
    ratingEl.textContent = buildStars(v.rating);
    card.appendChild(ratingEl);

    const body = document.createElement('div');
    body.className = 'vendor-body';
    body.innerHTML =
      (v.city ? ('📍 ' + v.city + '<br>') : '') +
      (v.contactName ? ('👤 ' + v.contactName + (v.contactMobile ? ' – '+v.contactMobile : '') + '<br>') : '') +
      (v.phone ? ('☎ ' + v.phone + '<br>') : '') +
      (v.email ? ('✉ ' + v.email) : '');
    card.appendChild(body);

    const status = document.createElement('div');
    status.className = 'vendor-doc-status';
    if(summary.status==='valid') status.classList.add('valid');
    else if(summary.status==='warning') status.classList.add('warning');
    else if(summary.status==='expired') status.classList.add('expired');
    status.textContent = summary.label;
    card.appendChild(status);

    const footer = document.createElement('div');
    footer.className = 'vendor-footer';
    const small = document.createElement('small');
    small.textContent = 'رقم السجل: ' + (v.cr || 'غير مسجل');
    footer.appendChild(small);

    const actions = document.createElement('div');
    actions.className = 'vendor-actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-small btn-ghost';
    editBtn.textContent = '✏ تعديل';
    editBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      openVendorModal(v.id);
    });
    const docsBtn = document.createElement('button');
    docsBtn.className = 'btn btn-small btn-secondary';
    docsBtn.textContent = '📄 وثائق';
    docsBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      openDocsModal(v.id);
    });
    actions.appendChild(editBtn);
    actions.appendChild(docsBtn);
    footer.appendChild(actions);

    card.appendChild(footer);
    grid.appendChild(card);
  });
}

function openVendorModal(id){
  const modal = document.getElementById('vendorModal');
  const title = document.getElementById('vendorModalTitle');
  const delBtn = document.getElementById('vendorDeleteBtn');
  const form = document.getElementById('vendorForm');
  if(!modal || !title || !form) return;

  const list = loadVendors();
  const v = list.find(x=>x.id===id);
  if(v){
    title.textContent = 'تعديل بيانات الشركة';
    document.getElementById('vendorId').value = v.id;
    document.getElementById('vendorName').value = v.name || '';
    document.getElementById('vendorType').value = v.type || '';
    document.getElementById('vendorCR').value = v.cr || '';
    document.getElementById('vendorContactName').value = v.contactName || '';
    document.getElementById('vendorContactMobile').value = v.contactMobile || '';
    document.getElementById('vendorCity').value = v.city || '';
    document.getElementById('vendorPhone').value = v.phone || '';
    document.getElementById('vendorEmail').value = v.email || '';
    document.getElementById('vendorRating').value = v.rating || 3;
    document.getElementById('vendorNotes').value = v.notes || '';
    delBtn.style.display = 'inline-flex';
  }else{
    title.textContent = 'إضافة شركة متعاقدة';
    form.reset();
    document.getElementById('vendorId').value = '';
    document.getElementById('vendorRating').value = 3;
    delBtn.style.display = 'none';
  }

  modal.classList.remove('aw-hidden');
}

function closeVendorModal(){
  const modal = document.getElementById('vendorModal');
  if(modal) modal.classList.add('aw-hidden');
}

function openDocsModal(vendorId){
  currentDocsVendorId = vendorId;
  const modal = document.getElementById('docsModal');
  const title = document.getElementById('docsModalTitle');
  if(!modal || !title) return;
  const list = loadVendors();
  const v = list.find(x=>x.id===vendorId);
  title.textContent = 'وثائق الشركة – ' + (v ? v.name : '');
  renderDocsTable();
  resetDocForm();
  modal.classList.remove('aw-hidden');
}

function closeDocsModal(){
  const modal = document.getElementById('docsModal');
  if(modal) modal.classList.add('aw-hidden');
  currentDocsVendorId = null;
}

function renderDocsTable(){
  const body = document.getElementById('docsTableBody');
  const empty = document.getElementById('docsEmpty');
  if(!body || !empty) return;
  body.innerHTML = '';

  const list = loadVendors();
  const v = list.find(x=>x.id===currentDocsVendorId);
  const docs = v && v.documents ? v.documents : [];

  if(!docs.length){
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  docs.forEach((d,idx)=>{
    const tr = document.createElement('tr');
    const st = calcDocStatus(d);
    let label = '';
    if(st==='expired') label = 'منتهية';
    else if(st==='warning') label = 'تنتهي قريبًا';
    else if(st==='valid') label = 'سارية';
    tr.innerHTML = `
      <td>${d.type||''}</td>
      <td>${d.number||''}</td>
      <td>${d.issue||''}</td>
      <td>${d.expiry||''}</td>
      <td>${label}</td>
      <td>
        <button type="button" class="btn btn-small btn-ghost" data-idx="${idx}" data-act="edit">تعديل</button>
        <button type="button" class="btn btn-small btn-outline" data-idx="${idx}" data-act="delete">حذف</button>
      </td>
    `;
    body.appendChild(tr);
  });

  body.addEventListener('click', function handler(e){
    const btn = e.target.closest('button[data-idx]');
    if(!btn) return;
    const idx = parseInt(btn.getAttribute('data-idx'),10);
    const act = btn.getAttribute('data-act');
    if(isNaN(idx)) return;
    if(act === 'edit'){
      fillDocForm(idx);
    }else if(act === 'delete'){
      deleteDoc(idx);
    }
  }, {once:true});
}

function resetDocForm(){
  document.getElementById('docIndex').value = '';
  document.getElementById('docType').value = '';
  document.getElementById('docNumber').value = '';
  document.getElementById('docIssue').value = '';
  document.getElementById('docExpiry').value = '';
}

function fillDocForm(idx){
  const list = loadVendors();
  const v = list.find(x=>x.id===currentDocsVendorId);
  if(!v || !v.documents || !v.documents[idx]) return;
  const d = v.documents[idx];
  document.getElementById('docIndex').value = idx;
  document.getElementById('docType').value = d.type || '';
  document.getElementById('docNumber').value = d.number || '';
  document.getElementById('docIssue').value = d.issue || '';
  document.getElementById('docExpiry').value = d.expiry || '';
}

function deleteDoc(idx){
  const list = loadVendors();
  const v = list.find(x=>x.id===currentDocsVendorId);
  if(!v || !v.documents || !v.documents[idx]) return;
  v.documents.splice(idx,1);
  saveVendors(list);
  renderDocsTable();
  renderVendorsKpi();
  renderVendorsGrid();
}

document.addEventListener('DOMContentLoaded', ()=>{
  ensureSeedVendors();
  renderVendorsKpi();
  renderVendorsGrid();

  // filters
  ['vendorSearch','vendorTypeFilter','vendorDocStatusFilter','vendorRatingFilter'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', ()=>{
      renderVendorsGrid();
    });
    el.addEventListener('change', ()=>{
      renderVendorsGrid();
    });
  });

  const addBtn = document.getElementById('vendorAddBtn');
  if(addBtn){
    addBtn.addEventListener('click', ()=> openVendorModal(null));
  }
  const closeVendorBtn = document.getElementById('vendorModalClose');
  if(closeVendorBtn){
    closeVendorBtn.addEventListener('click', closeVendorModal);
  }
  const vendorModal = document.getElementById('vendorModal');
  if(vendorModal){
    vendorModal.addEventListener('click', (e)=>{
      if(e.target === vendorModal) closeVendorModal();
    });
  }

  const vendorForm = document.getElementById('vendorForm');
  if(vendorForm){
    vendorForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const list = loadVendors();
      const id = document.getElementById('vendorId').value;
      let v = list.find(x=>x.id===id);
      const data = {
        name: document.getElementById('vendorName').value.trim(),
        type: document.getElementById('vendorType').value,
        cr: document.getElementById('vendorCR').value.trim(),
        contactName: document.getElementById('vendorContactName').value.trim(),
        contactMobile: document.getElementById('vendorContactMobile').value.trim(),
        city: document.getElementById('vendorCity').value.trim(),
        phone: document.getElementById('vendorPhone').value.trim(),
        email: document.getElementById('vendorEmail').value.trim(),
        rating: parseInt(document.getElementById('vendorRating').value||'0',10) || 0,
        notes: document.getElementById('vendorNotes').value.trim()
      };
      if(v){
        Object.assign(v, data);
      }else{
        v = Object.assign({}, data, {
          id: generateVendorId(),
          documents: [],
          createdAt: new Date().toISOString()
        });
        list.push(v);
      }
      saveVendors(list);
      renderVendorsKpi();
      renderVendorsGrid();
      closeVendorModal();
    });
  }

  const delBtn = document.getElementById('vendorDeleteBtn');
  if(delBtn){
    delBtn.addEventListener('click', ()=>{
      const id = document.getElementById('vendorId').value;
      if(!id) return;
      const list = loadVendors().filter(v=>v.id!==id);
      saveVendors(list);
      renderVendorsKpi();
      renderVendorsGrid();
      closeVendorModal();
    });
  }

  const docsClose = document.getElementById('docsModalClose');
  if(docsClose){
    docsClose.addEventListener('click', closeDocsModal);
  }
  const docsModal = document.getElementById('docsModal');
  if(docsModal){
    docsModal.addEventListener('click', (e)=>{
      if(e.target === docsModal) closeDocsModal();
    });
  }
  const docForm = document.getElementById('docForm');
  if(docForm){
    docForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      if(!currentDocsVendorId) return;
      const list = loadVendors();
      const v = list.find(x=>x.id===currentDocsVendorId);
      if(!v) return;
      if(!v.documents) v.documents = [];
      const idxVal = document.getElementById('docIndex').value;
      const d = {
        type: document.getElementById('docType').value.trim(),
        number: document.getElementById('docNumber').value.trim(),
        issue: document.getElementById('docIssue').value,
        expiry: document.getElementById('docExpiry').value
      };
      const idx = idxVal === '' ? -1 : parseInt(idxVal,10);
      if(idx >= 0 && v.documents[idx]){
        v.documents[idx] = d;
      }else{
        v.documents.push(d);
      }
      saveVendors(list);
      resetDocForm();
      renderDocsTable();
      renderVendorsKpi();
      renderVendorsGrid();
    });
  }
  const docResetBtn = document.getElementById('docResetBtn');
  if(docResetBtn){
    docResetBtn.addEventListener('click', resetDocForm);
  }
});
