
function safeGetAllReports(){
  try{
    if(typeof getAllReports === 'function'){
      return getAllReports() || [];
    }
  }catch(e){}
  return [];
}
function safeLoadRisks(){
  try{
    if(typeof loadRisks === 'function'){
      return loadRisks() || [];
    }
  }catch(e){}
  return [];
}
function safeLoadFormResponses(){
  try{
    if(typeof loadResponses === 'function'){
      return loadResponses() || [];
    }
  }catch(e){}
  return [];
}

function applyRiskFilters(risks){
  const branch = document.getElementById('dashBranch').value || '';
  const dept = document.getElementById('dashDept').value || '';
  const section = document.getElementById('dashSection').value || '';
  return risks.filter(r=>{
    if(branch && (r.branch||'') !== branch) return false;
    if(dept && (r.department||'') !== dept) return false;
    if(section && (r.section||'') !== section) return false;
    return true;
  });
}

function setKpiCards(containerId, cards){
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  cards.forEach(card=>{
    const div = document.createElement('div');
    div.className = 'kpi-card' + (card.light ? ' light' : '');
    div.innerHTML = '<div class="kpi-label">'+card.label+'</div>'+
                    '<div class="kpi-value">'+card.value+'</div>'+
                    (card.sub?'<div class="kpi-sub">'+card.sub+'</div>':'');
    container.appendChild(div);
  });
}

function buildBarList(containerId, items){
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const total = items.reduce((s,i)=>s+i.count,0) || 0;
  items.forEach(i=>{
    const row = document.createElement('div');
    row.className = 'bar-row';
    const pct = total ? Math.round((i.count/total)*100) : 0;
    row.innerHTML = ''
      +'<div class="bar-label">'+i.label+'</div>'
      +'<div class="bar-track"><div class="bar-fill" style="width:'+(pct>0?pct:4)+'%;opacity:'+(i.count?1:.25)+';"></div></div>'
      +'<div class="bar-count">'+i.count+'</div>';
    container.appendChild(row);
  });
}

function refreshDashboard(){
  const reports = safeGetAllReports();
  const risksAll = safeLoadRisks();
  const risks = applyRiskFilters(risksAll);
  const forms = safeLoadFormResponses();

  // ===== KPIs: Reports =====
  const totalReports = reports.length;
  const steps = (typeof WF_STEPS !== 'undefined' && WF_STEPS.length)? WF_STEPS.length : 0;
  const closedReports = steps ? reports.filter(r=>(r.statusIndex||0) >= (steps-1)).length : 0;
  const openReports = totalReports - closedReports;

  const secretReports = reports.filter(r=>r.level==='secret').length;
  const urgentReports = reports.filter(r=>r.level==='urgent').length;
  const normalReports = totalReports - secretReports - urgentReports;

  setKpiCards('kpiReports',[
    {label:'إجمالي البلاغات', value: totalReports, sub:'مجموع كل البلاغات في النظام'},
    {label:'البلاغات المفتوحة', value: openReports, sub:'لم تصل بعد إلى مرحلة الإغلاق', light:true},
    {label:'البلاغات المغلقة', value: closedReports, sub:'تم تنفيذ الإجراءات وإغلاق البلاغ', light:true},
    {label:'بلاغات سرية', value: secretReports, sub:'موسومة كـ "سري" في نظام البلاغات'},
    {label:'بلاغات عاجلة', value: urgentReports, sub:'موسومة كـ "عاجل" أو عالية الأولوية'},
    {label:'بلاغات عادية', value: normalReports, sub:'لا تحمل وسم سري أو عاجل'}
  ]);

  // ===== KPIs: Risks =====
  const totalRisks = risksAll.length;
  const filteredRisks = risks.length;
  const privateRisks = risks.filter(r=>r.isPrivate).length;
  const publicRisks = filteredRisks - privateRisks;
  const criticalRisks = risks.filter(r=>{
    const v = parseInt(r.rating||'0',10);
    return v >= 9;
  }).length;

  setKpiCards('kpiRisks',[
    {label:'إجمالي المخاطر', value: totalRisks, sub:'كل المخاطر المسجلة (عام + خاص)'},
    {label:'المخاطر ضمن نطاق التصفية', value: filteredRisks, sub:'حسب الفرع / الإدارة / القسم المختار', light:true},
    {label:'مخاطر في السجل الخاص', value: privateRisks, sub:'تظهر فقط للمستخدمين المخوّلين', light:true},
    {label:'مخاطر في السجل العام', value: publicRisks, sub:'تستخدم للتوعية والاطلاع العام'},
    {label:'مخاطر حرجة (تقييم ≥ 9)', value: criticalRisks, sub:'بحاجة متابعة وتركيز أعلى'}
  ]);

  // ===== KPIs: Forms =====
  const totalForms = forms.length;
  const formsLast7 = forms.filter(r=>{
    const d = new Date(r.createdAt||'');
    if(!d || isNaN(d.getTime())) return false;
    const diff = (Date.now() - d.getTime())/(1000*60*60*24);
    return diff <= 7;
  }).length;

  setKpiCards('kpiForms',[
    {label:'النماذج المرسلة / المستلمة', value: totalForms, sub:'عدد مرات تعبئة نموذج التقييم العام'},
    {label:'نماذج خلال آخر 7 أيام', value: formsLast7, sub:'نشاط حديث في النماذج الرقمية', light:true}
  ]);

  // ===== Charts: Reports level =====
  buildBarList('chartReportsLevel',[
    {label:'سرية', count: secretReports},
    {label:'عاجلة', count: urgentReports},
    {label:'عادية', count: normalReports}
  ]);

  // ===== Charts: Reports status =====
  const statusItems = [];
  if(steps && typeof WF_STEPS !== 'undefined'){
    for(let i=0;i<WF_STEPS.length;i++){
      const c = reports.filter(r=>(r.statusIndex||0)===i).length;
      statusItems.push({label:WF_STEPS[i], count:c});
    }
  }
  buildBarList('chartReportsStatus', statusItems);

  // ===== Charts: Risks rating buckets =====
  let low=0, mid=0, high=0;
  risks.forEach(r=>{
    const v = parseInt(r.rating||'0',10);
    if(!v) return;
    if(v <= 4) low++;
    else if(v <= 8) mid++;
    else high++;
  });
  buildBarList('chartRisksRating',[
    {label:'منخفضة', count: low},
    {label:'متوسطة', count: mid},
    {label:'مرتفعة', count: high}
  ]);

  // ===== Activity list =====
  const activity = [];

  // from reports history if متاحة
  reports.forEach(r=>{
    if(Array.isArray(r.history)){
      r.history.slice(-3).forEach(h=>{
        activity.push({
          type:'بلاغ',
          id:r.id,
          at:h.at || r.createdAt,
          text:h.action+(h.note ? ' – '+h.note : '')
        });
      });
    }else{
      activity.push({
        type:'بلاغ',
        id:r.id,
        at:r.createdAt,
        text:r.title || r.type || 'تحديث على البلاغ'
      });
    }
  });

  // from risks
  risksAll.forEach(r=>{
    activity.push({
      type:'خطر',
      id:r.id,
      at:r.createdAt,
      text:(r.mainCategory||'خطر')+' – '+(r.subCategory||'')
    });
  });

  // from forms
  forms.forEach(f=>{
    activity.push({
      type:'نموذج',
      id:f.id,
      at:f.createdAt,
      text:'نموذج تعبئة من '+(f.filler||'مستخدم غير محدد')
    });
  });

  activity.sort((a,b)=>{
    const da = new Date(a.at||'').getTime() || 0;
    const db = new Date(b.at||'').getTime() || 0;
    return db-da;
  });

  const limited = activity.slice(0,20);
  const listEl = document.getElementById('activityList');
  listEl.innerHTML = '';
  if(!limited.length){
    listEl.innerHTML = '<div class="empty">لا توجد أنشطة مسجلة حتى الآن.</div>';
  }else{
    limited.forEach(item=>{
      const div = document.createElement('div');
      div.className = 'activity-item';
      div.innerHTML = ''
        +'<div class="activity-header">'
        +  '<div class="activity-type">'+item.type+' – '+(item.id||'')+'</div>'
        +  '<div class="activity-meta">'+(item.at||'')+'</div>'
        +'</div>'
        +'<div class="activity-body">'+(item.text||'')+'</div>';
      listEl.appendChild(div);
    });
  }
}

document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('dashRefresh').addEventListener('click', refreshDashboard);
  refreshDashboard();
});
