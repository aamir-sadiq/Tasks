
const STORAGE_KEY = "amir_task_manager_v1";
const SETTINGS_KEY = "amir_task_manager_settings_v1";

const state = {
  tasks: [],
  settings: {
    theme: "office",
    defaultArea: "All",
    confirmDelete: true
  },
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedDate: isoDate(new Date())
};

const $ = (id) => document.getElementById(id);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function isoDate(d){
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth()+1).padStart(2,"0");
  const day = String(x.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function parseISO(s){ const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function sameDay(a,b){ return isoDate(a)===isoDate(b); }
function todayISO(){ return isoDate(new Date()); }
function uid(){ return "T-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase(); }
function esc(s=""){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }

function seedData(){
  const t = todayISO();
  const tomorrow = isoDate(new Date(Date.now()+86400000));
  return [
    {id:uid(),date:t,time:"10:00",area:"Office",category:"Follow-up",name:"Check pending BOE / customs status",frequency:"One-Time",status:"In Progress",priority:"High",notes:"",createdAt:new Date().toISOString(),completedAt:null},
    {id:uid(),date:t,time:"19:00",area:"Personal",category:"Health",name:"Evening walk / exercise",frequency:"Daily",status:"Not Started",priority:"Medium",notes:"",createdAt:new Date().toISOString(),completedAt:null},
    {id:uid(),date:tomorrow,time:"11:00",area:"Office",category:"Documents",name:"Follow up supplier documents",frequency:"Weekly",status:"Not Started",priority:"High",notes:"",createdAt:new Date().toISOString(),completedAt:null}
  ];
}

function load(){
  try{
    state.tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || seedData();
    state.settings = {...state.settings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"))};
  }catch{
    state.tasks = seedData();
  }
}
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}
function applyTheme(){
  document.body.dataset.theme = state.settings.theme;
  $("themeSelect").value = state.settings.theme;
  $("defaultAreaSelect").value = state.settings.defaultArea;
  $("confirmDeleteCheck").checked = !!state.settings.confirmDelete;
}

function occursOn(task, dateISO){
  if(task.status==="Cancelled") return false;
  const start = parseISO(task.date), date = parseISO(dateISO);
  if(date < start) return false;
  if(task.frequency==="One-Time") return task.date===dateISO;
  if(task.frequency==="Daily") return true;
  if(task.frequency==="Weekly") return date.getDay()===start.getDay();
  if(task.frequency==="Monthly") return date.getDate()===start.getDate();
  return task.date===dateISO;
}
function tasksForDate(dateISO, area="All"){
  return state.tasks.filter(t => occursOn(t,dateISO) && (area==="All" || t.area===area));
}
function filteredArea(tasks, area){ return area==="All"?tasks:tasks.filter(t=>t.area===area); }

function renderDashboard(){
  const area = $("dashboardArea").value;
  const today = todayISO();
  const visible = filteredArea(state.tasks, area);
  const todayTasks = visible.filter(t=>occursOn(t,today) && t.status!=="Complete" && t.status!=="Cancelled");
  const overdue = visible.filter(t=>t.frequency==="One-Time" && t.date<today && t.status!=="Complete" && t.status!=="Cancelled");
  const complete = visible.filter(t=>t.status==="Complete");
  const progress = visible.filter(t=>t.status==="In Progress");
  const active = visible.filter(t=>t.status!=="Cancelled");
  const pct = active.length ? Math.round(complete.length/active.length*100) : 0;

  $("todayChip").textContent = new Date().toLocaleDateString(undefined,{weekday:"short",day:"2-digit",month:"short",year:"numeric"});
  $("kpiToday").textContent = todayTasks.length;
  $("kpiOverdue").textContent = overdue.length;
  $("kpiComplete").textContent = complete.length;
  $("kpiProgress").textContent = progress.length;
  $("progressPct").textContent = pct+"%";
  $("progressFill").style.width = pct+"%";
  $("heroSummary").textContent = `${todayTasks.length} task${todayTasks.length===1?"":"s"} scheduled for today`;

  $("freqDaily").textContent = visible.filter(t=>t.frequency==="Daily").length;
  $("freqWeekly").textContent = visible.filter(t=>t.frequency==="Weekly").length;
  $("freqMonthly").textContent = visible.filter(t=>t.frequency==="Monthly").length;
  $("freqOneTime").textContent = visible.filter(t=>t.frequency==="One-Time").length;

  renderTaskList($("todayList"), todayTasks.slice().sort(taskSort), true);
}

function mondayIndex(jsDay){ return (jsDay+6)%7; }
function renderCalendar(){
  $("monthSelect").value = state.currentMonth;
  $("yearSelect").value = state.currentYear;
  const area = $("calendarArea").value;
  const grid = $("calendarGrid");
  grid.innerHTML = "";

  const first = new Date(state.currentYear,state.currentMonth,1);
  const startOffset = mondayIndex(first.getDay());
  const start = new Date(state.currentYear,state.currentMonth,1-startOffset);

  for(let i=0;i<42;i++){
    const d = new Date(start);
    d.setDate(start.getDate()+i);
    const dISO = isoDate(d);
    const inMonth = d.getMonth()===state.currentMonth;
    const dayTasks = tasksForDate(dISO, area);
    const btn = document.createElement("button");
    btn.className = "day-cell"+(inMonth?"":" outside")+(dISO===todayISO()?" today":"")+(dISO===state.selectedDate?" selected":"");
    const dots = dayTasks.slice(0,3).map(t=>`<span class="task-dot ${t.area==="Personal"?"personal":""} ${t.priority==="Critical"?"critical":""}">${esc(t.name)}</span>`).join("");
    btn.innerHTML = `<span class="day-number">${d.getDate()}</span><div class="day-badges">${dots}${dayTasks.length>3?`<span class="more-dot">+${dayTasks.length-3} more</span>`:""}</div>`;
    btn.addEventListener("click",()=>{
      state.selectedDate = dISO;
      if(!inMonth){ state.currentMonth=d.getMonth(); state.currentYear=d.getFullYear(); }
      renderCalendar();
      renderSelectedDate();
    });
    grid.appendChild(btn);
  }
  renderSelectedDate();
}
function renderSelectedDate(){
  const d = parseISO(state.selectedDate);
  $("selectedDateTitle").textContent = d.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const tasks = tasksForDate(state.selectedDate,$("calendarArea").value).sort(taskSort);
  renderTaskList($("selectedDateTasks"),tasks,true);
}

function taskSort(a,b){
  const priorityRank={Critical:0,High:1,Medium:2,Low:3};
  if((priorityRank[a.priority]??9)!==(priorityRank[b.priority]??9)) return priorityRank[a.priority]-priorityRank[b.priority];
  return (a.time||"99:99").localeCompare(b.time||"99:99");
}

function renderTasks(){
  const q = $("taskSearch").value.trim().toLowerCase();
  const area = $("taskAreaFilter").value;
  const status = $("taskStatusFilter").value;
  const freq = $("taskFreqFilter").value;
  const priority = $("taskPriorityFilter").value;

  let list = state.tasks.filter(t=>{
    if(area!=="All" && t.area!==area) return false;
    if(status!=="All" && t.status!==status) return false;
    if(freq!=="All" && t.frequency!==freq) return false;
    if(priority!=="All" && t.priority!==priority) return false;
    if(q && !`${t.name} ${t.notes} ${t.category} ${t.area}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));

  $("taskCountLabel").textContent = `${list.length} task${list.length===1?"":"s"}`;
  renderTaskList($("allTasksList"), list, false);
}

function renderTaskList(container,list, compact){
  if(!list.length){
    container.innerHTML = `<div class="empty-state">No tasks here.</div>`;
    return;
  }
  container.innerHTML = list.map(t=>{
    const complete=t.status==="Complete";
    return `<article class="task-item ${complete?"complete":""}" data-id="${t.id}">
      <button class="status-toggle" data-action="toggle" title="Toggle complete">${complete?"✓":""}</button>
      <div>
        <div class="task-title">${esc(t.name)}</div>
        <div class="task-meta">
          <span class="pill">${esc(t.area)}</span>
          <span class="pill">${esc(t.frequency)}</span>
          <span class="pill priority-${esc(t.priority)}">${esc(t.priority)}</span>
          <span class="pill">${esc(t.status)}</span>
          ${t.time?`<span class="pill">${esc(t.time)}</span>`:""}
        </div>
      </div>
      <div class="task-actions">
        <button class="mini-btn" data-action="edit" title="Edit">✎</button>
      </div>
    </article>`;
  }).join("");

  container.querySelectorAll(".task-item").forEach(el=>{
    const id=el.dataset.id;
    el.querySelector('[data-action="edit"]').addEventListener("click",()=>openTaskModal(id));
    el.querySelector('[data-action="toggle"]').addEventListener("click",()=>{
      const t=state.tasks.find(x=>x.id===id);
      if(!t)return;
      t.status=t.status==="Complete"?"Not Started":"Complete";
      t.completedAt=t.status==="Complete"?new Date().toISOString():null;
      save(); renderAll(); toast(t.status==="Complete"?"Task completed":"Task reopened");
    });
  });
}

function renderReports(){
  $("reportOffice").textContent=state.tasks.filter(t=>t.area==="Office").length;
  $("reportPersonal").textContent=state.tasks.filter(t=>t.area==="Personal").length;
  $("reportHigh").textContent=state.tasks.filter(t=>["High","Critical"].includes(t.priority) && t.status!=="Complete" && t.status!=="Cancelled").length;
  const now=new Date();
  $("reportMonthDone").textContent=state.tasks.filter(t=>t.completedAt && new Date(t.completedAt).getMonth()===now.getMonth() && new Date(t.completedAt).getFullYear()===now.getFullYear()).length;
  $("offlineStatus").textContent = navigator.onLine ? "Online now. App data is still stored locally." : "Offline now. The app remains usable.";
}

function renderAll(){
  renderDashboard();
  renderCalendar();
  renderTasks();
  renderReports();
}

function openTaskModal(id=null,dateOverride=null){
  const modal=$("taskModalBackdrop");
  const t=id?state.tasks.find(x=>x.id===id):null;
  $("taskModalTitle").textContent=t?"Edit Task":"Add Task";
  $("taskId").value=t?.id||"";
  $("taskDate").value=t?.date||dateOverride||state.selectedDate||todayISO();
  $("taskTime").value=t?.time||"";
  $("taskName").value=t?.name||"";
  $("taskArea").value=t?.area|| (state.settings.defaultArea==="All"?"Office":state.settings.defaultArea);
  $("taskCategory").value=t?.category||"General";
  $("taskFrequency").value=t?.frequency||"One-Time";
  $("taskStatus").value=t?.status||"Not Started";
  $("taskPriority").value=t?.priority||"Medium";
  $("taskNotes").value=t?.notes||"";
  $("deleteTaskBtn").classList.toggle("hidden",!t);
  modal.classList.remove("hidden");
  setTimeout(()=>$("taskName").focus(),50);
}
function closeTaskModal(){ $("taskModalBackdrop").classList.add("hidden"); }

$("taskForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("taskId").value;
  const data={
    date:$("taskDate").value,
    time:$("taskTime").value,
    name:$("taskName").value.trim(),
    area:$("taskArea").value,
    category:$("taskCategory").value,
    frequency:$("taskFrequency").value,
    status:$("taskStatus").value,
    priority:$("taskPriority").value,
    notes:$("taskNotes").value.trim()
  };
  if(!data.name||!data.date)return;
  if(id){
    const t=state.tasks.find(x=>x.id===id);
    Object.assign(t,data);
    if(t.status==="Complete"&&!t.completedAt)t.completedAt=new Date().toISOString();
    if(t.status!=="Complete")t.completedAt=null;
  }else{
    state.tasks.push({id:uid(),...data,createdAt:new Date().toISOString(),completedAt:data.status==="Complete"?new Date().toISOString():null});
  }
  save(); closeTaskModal(); renderAll(); toast(id?"Task updated":"Task added");
});

$("deleteTaskBtn").addEventListener("click",()=>{
  const id=$("taskId").value;
  if(!id)return;
  if(state.settings.confirmDelete && !confirm("Delete this task?")) return;
  state.tasks=state.tasks.filter(t=>t.id!==id);
  save(); closeTaskModal(); renderAll(); toast("Task deleted");
});

function switchView(name){
  $$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  $$(".view").forEach(v=>v.classList.toggle("active",v.id===name+"View"));
  if(name==="calendar")renderCalendar();
  if(name==="tasks")renderTasks();
  window.scrollTo({top:0,behavior:"smooth"});
}
$$(".tab").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
$$("[data-jump]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.jump)));

function fillSelectors(){
  const months=Array.from({length:12},(_,i)=>new Date(2020,i,1).toLocaleString(undefined,{month:"long"}));
  $("monthSelect").innerHTML=months.map((m,i)=>`<option value="${i}">${m}</option>`).join("");
  const y=new Date().getFullYear();
  $("yearSelect").innerHTML=Array.from({length:15},(_,i)=>y-5+i).map(v=>`<option>${v}</option>`).join("");
}
$("monthSelect").addEventListener("change",()=>{state.currentMonth=+$("monthSelect").value;renderCalendar()});
$("yearSelect").addEventListener("change",()=>{state.currentYear=+$("yearSelect").value;renderCalendar()});
$("prevMonthBtn").addEventListener("click",()=>{state.currentMonth--;if(state.currentMonth<0){state.currentMonth=11;state.currentYear--}renderCalendar()});
$("nextMonthBtn").addEventListener("click",()=>{state.currentMonth++;if(state.currentMonth>11){state.currentMonth=0;state.currentYear++}renderCalendar()});
$("goTodayBtn").addEventListener("click",()=>{const d=new Date();state.currentMonth=d.getMonth();state.currentYear=d.getFullYear();state.selectedDate=todayISO();renderCalendar()});
$("calendarArea").addEventListener("change",renderCalendar);
$("dashboardArea").addEventListener("change",renderDashboard);

["taskSearch","taskAreaFilter","taskStatusFilter","taskFreqFilter","taskPriorityFilter"].forEach(id=>{
  $(id).addEventListener(id==="taskSearch"?"input":"change",renderTasks);
});
$("clearFiltersBtn").addEventListener("click",()=>{
  $("taskSearch").value="";
  $("taskAreaFilter").value="All";
  $("taskStatusFilter").value="All";
  $("taskFreqFilter").value="All";
  $("taskPriorityFilter").value="All";
  renderTasks();
});

["quickAddBtn","taskAddBtn","floatingAdd"].forEach(id=>$(id).addEventListener("click",()=>openTaskModal()));
$("addForDateBtn").addEventListener("click",()=>openTaskModal(null,state.selectedDate));
$("closeTaskModal").addEventListener("click",closeTaskModal);
$("cancelTaskBtn").addEventListener("click",closeTaskModal);
$("taskModalBackdrop").addEventListener("click",e=>{if(e.target===e.currentTarget)closeTaskModal()});

$("settingsBtn").addEventListener("click",()=>$("settingsBackdrop").classList.remove("hidden"));
$("closeSettings").addEventListener("click",()=>$("settingsBackdrop").classList.add("hidden"));
$("settingsBackdrop").addEventListener("click",e=>{if(e.target===e.currentTarget)e.currentTarget.classList.add("hidden")});
$("themeBtn").addEventListener("click",()=>{
  const themes=["office","personal","midnight","sand","violet","forest"];
  const i=(themes.indexOf(state.settings.theme)+1)%themes.length;
  state.settings.theme=themes[i]; save(); applyTheme(); toast("Theme changed");
});
$("themeSelect").addEventListener("change",e=>{state.settings.theme=e.target.value;save();applyTheme()});
$("defaultAreaSelect").addEventListener("change",e=>{state.settings.defaultArea=e.target.value;save()});
$("confirmDeleteCheck").addEventListener("change",e=>{state.settings.confirmDelete=e.target.checked;save()});
$("clearAllDataBtn").addEventListener("click",()=>{
  if(confirm("Erase ALL tasks stored in this app on this device?")){
    state.tasks=[];save();renderAll();toast("All tasks erased");
  }
});

function download(filename, content, type){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}
function exportBackup(){
  download(`amir-task-backup-${todayISO()}.json`,JSON.stringify({version:1,exportedAt:new Date().toISOString(),tasks:state.tasks,settings:state.settings},null,2),"application/json");
}
$("backupBtn").addEventListener("click",exportBackup);
$("exportJsonBtn").addEventListener("click",exportBackup);
$("exportCsvBtn").addEventListener("click",()=>{
  const fields=["id","date","time","area","category","name","frequency","status","priority","notes","createdAt","completedAt"];
  const csv=[fields.join(",")].concat(state.tasks.map(t=>fields.map(f=>`"${String(t[f]??"").replace(/"/g,'""')}"`).join(","))).join("\n");
  download(`amir-tasks-${todayISO()}.csv`,csv,"text/csv");
});
$("importJsonInput").addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const obj=JSON.parse(await file.text());
    if(!Array.isArray(obj.tasks)) throw new Error("Invalid backup");
    if(!confirm(`Import ${obj.tasks.length} tasks and replace current data?`))return;
    state.tasks=obj.tasks;state.settings={...state.settings,...(obj.settings||{})};save();applyTheme();renderAll();toast("Backup imported");
  }catch(err){alert("Could not import this backup file.");}
  e.target.value="";
});

$("installHelpBtn").addEventListener("click",()=>{
  alert("iPhone installation:\\n\\n1. Open this app in Safari.\\n2. Tap Share.\\n3. Choose Add to Home Screen.\\n4. Open it once while online so the offline files can be cached.\\n\\nFor fully local use without hosting, you can also open the files from a local/offline web server on your PC.");
});

function toast(msg){
  const t=$("toast");t.textContent=msg;t.classList.remove("hidden");
  clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.add("hidden"),1800);
}

window.addEventListener("online",renderReports);
window.addEventListener("offline",renderReports);

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}

load();
fillSelectors();
applyTheme();
$("dashboardArea").value=state.settings.defaultArea;
$("calendarArea").value=state.settings.defaultArea;
renderAll();
