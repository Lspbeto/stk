const $ = (s, root=document) => root.querySelector(s);
const state = { token: localStorage.getItem("stk_token"), user: null, courses: [], progress: null, mode: "register", view: "home", activeCourse: null, activeLesson: null, answer: null, result: null };
const api = async (url, options={}) => {
  const response = await fetch(url, { ...options, headers: { "Content-Type":"application/json", ...(state.token ? {Authorization:"Bearer "+state.token}:{}), ...(options.headers||{}) } });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) { if(response.status===401 && state.token){logout(false);} throw new Error(data.error || "Não foi possível concluir a operação."); }
  return data;
};
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const notify = (el, message, ok=false) => { el.textContent=message; el.className="message"+(ok?" ok":""); };
function setView(view){state.view=view; render();}
function logout(refresh=true){state.token=null;state.user=null;localStorage.removeItem("stk_token");state.progress=null;if(refresh) setView("home");else render();}
async function boot(){
  try {
    state.courses=await api("/api/courses");
    if(state.token){const me=await api("/api/me");state.user=me.user;state.progress=await api("/api/progress");state.view="dashboard";}
  } catch(e){ if(state.token){logout(false);} }
  render();
}
function nav(){
  const el=$("#nav"), account=$("#account");
  if(!state.user){el.innerHTML="";account.innerHTML='<span class="small">Aprenda no seu ritmo</span>';return;}
  el.innerHTML='<button data-view="dashboard" class="'+(state.view==="dashboard"?"active":"")+'">Início</button><button data-view="courses" class="'+(state.view==="courses"?"active":"")+'">Trilhas</button><button data-view="ranking" class="'+(state.view==="ranking"?"active":"")+'">Ranking</button>'+(state.user.role==="teacher"?'<button data-view="teacher" class="'+(state.view==="teacher"?"active":"")+'">Professor</button>':'');
  account.innerHTML='<span>Olá, '+esc(state.user.name.split(" ")[0])+'</span><button id="logout">Sair</button>';
  el.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  $("#logout").addEventListener("click",()=>logout());
}
function render(){
  nav();
  const home=$("#auth-panel"), workspace=$("#workspace"), hero=$(".hero"), features=$(".features");
  if(!state.user){home.hidden=false;workspace.hidden=true;hero.hidden=false;features.hidden=false;bindAuth();$("#start-btn").onclick=()=>home.scrollIntoView({behavior:"smooth"});return;}
  home.hidden=true;hero.hidden=true;features.hidden=true;workspace.hidden=false;
  if(state.view==="challenge") renderChallenge();
  else if(state.view==="courses") renderCourses();
  else if(state.view==="ranking") renderRanking();
  else if(state.view==="teacher") renderTeacher();
  else renderDashboard();
}
function bindAuth(){
  const form=$("#auth-form");
  if(form.dataset.bound)return;form.dataset.bound="1";
  form.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;form.querySelectorAll("[data-mode]").forEach(x=>x.classList.toggle("active",x===b));$("#name-wrap").hidden=state.mode==="login";$("#auth-form [name=name]").required=state.mode==="register";$("#auth-form [name=password]").autocomplete=state.mode==="login"?"current-password":"new-password";$("#auth-submit").textContent=state.mode==="login"?"Entrar":"Criar minha conta";notify($("#auth-message"),"");});
  form.onsubmit=async e=>{e.preventDefault();const fd=new FormData(form);const payload=Object.fromEntries(fd.entries());const msg=$("#auth-message");$("#auth-submit").disabled=true;try{const data=await api("/api/auth/"+(state.mode==="login"?"login":"register"),{method:"POST",body:JSON.stringify(payload)});state.token=data.token;localStorage.setItem("stk_token",data.token);state.user=data.user;state.progress=await api("/api/progress");state.view="dashboard";render();}catch(err){notify(msg,err.message);}finally{$("#auth-submit") && ($("#auth-submit").disabled=false);}};
}
function refreshProgress(){return api("/api/progress").then(p=>state.progress=p);}
function courseStats(course){const rows=state.progress?.lessons||[];const done=course.lessons.filter(l=>rows.some(r=>r.lesson_id===l.id&&r.completed)).length;return {done,total:course.lessons.length};}
function renderDashboard(){
  const p=state.progress||{completed:0,total:0,xp:state.user.xp,lessons:[]};
  const percent=p.total?Math.round(p.completed/p.total*100):0;
  $("#workspace").innerHTML='<div class="dashboard-head"><div><p class="eyebrow">PAINEL DO ALUNO</p><h1>Vamos evoluir, '+esc(state.user.name.split(" ")[0])+'!</h1><p class="muted">Cada desafio concluído é mais um passo na sua jornada.</p></div><span class="pill">NÍVEL '+(Math.floor(p.xp/500)+1)+'</span></div>'+
  '<div class="stats"><div class="stat"><small>Experiência</small><strong>⚡ '+p.xp+' XP</strong></div><div class="stat"><small>Desafios concluídos</small><strong>'+p.completed+'/'+p.total+'</strong></div><div class="stat"><small>Progresso geral</small><strong>'+percent+'%</strong></div><div class="stat"><small>Próximo nível</small><strong>'+((500-p.xp%500))+' XP</strong></div></div>'+
  '<div class="panel"><div class="section-title"><h2>Sua evolução</h2><span class="small">'+percent+'% concluído</span></div><div class="progress-track"><span style="width:'+percent+'%"></span></div><p class="muted">Continue praticando. Seu progresso fica salvo na sua conta.</p></div>'+
  '<div class="section-title"><h2>Escolha uma trilha</h2><button class="secondary" id="all-courses">Ver todas</button></div><div class="course-grid">'+state.courses.map(courseCard).join("")+'</div>'+
  '<div class="section-title"><h2>Conquista e certificado</h2></div><div class="panel"><p class="muted">Conclua todos os desafios da trilha para liberar seu certificado de conclusão.</p><button class="secondary" id="certificate">Ver certificado</button></div>';
  $("#all-courses").onclick=()=>setView("courses");$("#certificate").onclick=showCertificate;
  $("#workspace").querySelectorAll("[data-course]").forEach(b=>b.onclick=()=>openCourse(b.dataset.course));
}
function courseCard(c){
  const s=courseStats(c), pct=Math.round(s.done/s.total*100);
  return '<article class="course-card"><div class="course-icon">'+esc(c.icon)+'</div><div style="flex:1"><span class="small">'+esc(c.level)+'</span><h3>'+esc(c.title)+'</h3><p>'+esc(c.description)+'</p><div class="progress-track"><span style="width:'+pct+'%"></span></div><span class="small">'+s.done+' de '+s.total+' desafios · '+pct+'%</span><div style="margin-top:12px"><button class="secondary" data-course="'+esc(c.id)+'">Abrir trilha</button></div></div></article>';
}
function renderCourses(){
  $("#workspace").innerHTML='<div class="dashboard-head"><div><p class="eyebrow">CONTEÚDO</p><h1>Trilhas de aprendizagem</h1><p class="muted">Do primeiro HTML à integração com bancos de dados.</p></div></div><div class="course-grid">'+state.courses.map(courseCard).join("")+'</div>';
  $("#workspace").querySelectorAll("[data-course]").forEach(b=>b.onclick=()=>openCourse(b.dataset.course));
}
function openCourse(id){
  state.activeCourse=state.courses.find(c=>c.id===id);if(!state.activeCourse)return;
  const c=state.activeCourse, done=state.progress?.lessons||[];
  $("#workspace").innerHTML='<button class="secondary" id="back-courses">← Trilhas</button><div class="dashboard-head"><div><p class="eyebrow">'+esc(c.level)+'</p><h1>'+esc(c.icon)+' '+esc(c.title)+'</h1><p class="muted">'+esc(c.description)+'</p></div></div><div class="lesson-list">'+c.lessons.map((l,i)=>{const row=done.find(r=>r.lesson_id===l.id);return '<article class="lesson-card"><div><h4>'+(row?.completed?'✅ ':'')+(i+1)+'. '+esc(l.title)+'</h4><span class="small">'+esc(l.topic)+' · '+l.minutes+' min · '+l.xp+' XP</span></div><button data-lesson="'+esc(l.id)+'">'+(row?.completed?'Revisar':'Começar')+'</button></article>';}).join("")+'</div>';
  $("#back-courses").onclick=()=>setView("courses");
  $("#workspace").querySelectorAll("[data-lesson]").forEach(b=>b.onclick=()=>startLesson(b.dataset.lesson));
}
function startLesson(id){
  const lesson=state.courses.flatMap(c=>c.lessons).find(l=>l.id===id);if(!lesson)return;
  state.activeLesson=lesson;state.answer=null;state.result=null;setView("challenge");
}
function renderChallenge(){
  const l=state.activeLesson;if(!l){setView("courses");return;}
  let answerUI="";
  if(l.type==="choice") answerUI='<div class="options">'+l.options.map((o,i)=>'<label class="option"><input type="radio" name="answer" value="'+esc(o)+'"> <code>'+esc(o)+'</code></label>').join("")+'</div>';
  else answerUI='<label class="field">Sua resposta<input id="lesson-answer" class="answer-input" autocomplete="off" placeholder="Digite sua resposta"></label>';
  $("#workspace").innerHTML='<div class="challenge"><button class="secondary" id="exit-challenge">← Voltar à trilha</button><p class="eyebrow">'+esc(l.topic)+' · DESAFIO PRÁTICO</p><h1>'+esc(l.title)+'</h1><div class="explanation">'+esc(l.explanation)+'</div><p class="question">'+esc(l.question)+'</p>'+answerUI+'<button class="primary full" id="submit-answer">Verificar resposta</button><div id="feedback"></div><button class="secondary" id="next-lesson" hidden>Continuar</button></div>';
  $("#exit-challenge").onclick=()=>openCourse(state.activeCourse?.id||"web");
  $("#submit-answer").onclick=submitAnswer;
  $("#next-lesson").onclick=()=>openCourse(state.activeCourse?.id||"web");
}
async function submitAnswer(){
  const l=state.activeLesson;
  const answer=l.type==="choice"?$('input[name="answer"]:checked')?.value:$("#lesson-answer")?.value;
  if(!answer){$("#feedback").innerHTML='<p class="message">Escolha ou digite uma resposta antes de continuar.</p>';return;}
  const btn=$("#submit-answer");btn.disabled=true;
  try{
    const result=await api("/api/lessons/"+encodeURIComponent(l.id)+"/submit",{method:"POST",body:JSON.stringify({answer})});
    state.user=result.user;state.result=result;await refreshProgress();
    $("#feedback").innerHTML='<div class="feedback '+(result.correct?'':'wrong')+'"><strong>'+(result.correct?'🎉 Resposta correta!':'Ainda não. Continue tentando!')+'</strong><p>'+esc(result.feedback)+'</p>'+(result.correct?'<p>+'+result.xpEarned+' XP '+(result.firstCompletion?'adicionados à sua conta.':'(desafio já concluído anteriormente).')+'</p>':'')+'</div>';
    if(result.correct){btn.hidden=true;$("#next-lesson").hidden=false;}else btn.disabled=false;
  }catch(e){$("#feedback").innerHTML='<p class="message">'+esc(e.message)+'</p>';btn.disabled=false;}
}
async function renderRanking(){
  $("#workspace").innerHTML='<p class="eyebrow">COMUNIDADE</p><h1>🏆 Ranking de aprendizagem</h1><p class="muted">Acompanhe os pontos e desafios concluídos pelos alunos.</p><div class="panel table-wrap" id="ranking-table">Carregando ranking...</div>';
  try{const rows=await api("/api/leaderboard");$("#ranking-table").innerHTML=rows.length?'<table><thead><tr><th>#</th><th>Aluno</th><th>Desafios</th><th>XP</th></tr></thead><tbody>'+rows.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.name)+'</td><td>'+r.completed+'</td><td>⚡ '+r.xp+'</td></tr>').join("")+'</tbody></table>':'<div class="empty">O ranking aparecerá quando os alunos começarem a concluir desafios.</div>';}catch(e){$("#ranking-table").textContent=e.message;}
}
async function showCertificate(){
  try{const c=await api("/api/certificate");$("#workspace").innerHTML='<div class="certificate"><p class="eyebrow">STK ACADEMY</p><h2>Certificado de conclusão</h2><p>Certificamos que</p><h1>'+esc(c.name)+'</h1><p>concluiu a trilha</p><h3>'+esc(c.course)+'</h3><p class="small">Código de validação: '+esc(c.code)+'</p><p class="small">'+new Date(c.completedAt).toLocaleDateString("pt-BR")+'</p><button class="primary" id="print-certificate">Imprimir certificado</button></div>';}catch(e){alert(e.message);}
}
async function renderTeacher(){
  $("#workspace").innerHTML='<p class="eyebrow">ÁREA DO PROFESSOR</p><h1>Painel de acompanhamento</h1><p class="muted">Crie turmas, compartilhe códigos de acesso e acompanhe o desenvolvimento dos alunos.</p><div class="panel"><h3>Nova turma</h3><form id="class-form" class="inline-form"><input name="name" required minlength="2" maxlength="80" placeholder="Ex.: Programação - Turma A"><button class="primary">Criar turma</button></form><p id="class-message" class="message"></p></div><div id="teacher-data" class="panel" style="margin-top:16px">Carregando...</div>';
  $("#class-form").onsubmit=async e=>{e.preventDefault();try{const name=new FormData(e.currentTarget).get("name");const c=await api("/api/classrooms",{method:"POST",body:JSON.stringify({name})});notify($("#class-message"),"Turma criada. Código de acesso: "+c.joinCode,true);await loadTeacherData();}catch(err){notify($("#class-message"),err.message);}};
  loadTeacherData();
}
async function loadTeacherData(){
  try{const d=await api("/api/teacher/dashboard");$("#teacher-data").innerHTML='<div class="section-title"><h2>Suas turmas</h2><span class="pill">'+d.totals.students+' alunos</span></div>'+(d.classrooms.length?d.classrooms.map(c=>'<div class="class-card" style="margin:10px 0"><strong>'+esc(c.name)+'</strong><p class="muted">Código: <b>'+esc(c.joinCode)+'</b> · '+c.students+' aluno(s)</p></div>').join(""):'<div class="empty">Você ainda não criou turmas.</div>')+'<div class="section-title"><h2>Desempenho dos alunos</h2></div>'+(d.students.length?'<div class="table-wrap"><table><thead><tr><th>Aluno</th><th>XP</th><th>Desafios</th></tr></thead><tbody>'+d.students.map(s=>'<tr><td>'+esc(s.name)+'</td><td>'+s.xp+'</td><td>'+s.completed+'/'+state.progress?.total+'</td></tr>').join("")+'</tbody></table></div>':'<p class="muted">Quando alunos entrarem nas suas turmas, o desempenho aparecerá aqui.</p>');}catch(e){$("#teacher-data").textContent=e.message;}
}
boot();
