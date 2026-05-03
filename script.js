/* ========== UEFA FOOTBALL QUIZ ARENA — COMPLETE JAVASCRIPT ========== */
/* Full-stack version: calls Flask backend API at localhost:5001       */

// API Base URL — change this if backend runs on a different port
const API_URL = 'http://127.0.0.1:5001/api';

// ── Navbar Toggle ──
(function(){
  const t=document.getElementById('nav-toggle'),l=document.getElementById('nav-links');
  if(t&&l) t.addEventListener('click',()=>l.classList.toggle('active'));
})();

// ── Login Tabs & Redirect ──
(function(){
  const ut=document.getElementById('user-tab'),at=document.getElementById('admin-tab');
  const uf=document.getElementById('user-login-form'),af=document.getElementById('admin-login-form');
  if(!ut) return;
  ut.addEventListener('click',()=>{ut.classList.add('active');at.classList.remove('active');uf.classList.add('active');af.classList.remove('active')});
  at.addEventListener('click',()=>{at.classList.add('active');ut.classList.remove('active');af.classList.add('active');uf.classList.remove('active')});

  const ub=document.getElementById('user-login-btn');
  if(ub) ub.addEventListener('click',()=>{
    const v=document.getElementById('user-email').value.trim();
    if(v){localStorage.setItem('quizUser',v);window.location.href='user-dashboard.html'}
    else alert('Please enter your email or username.')
  });

  const ab=document.getElementById('admin-login-btn');
  if(ab) ab.addEventListener('click',()=>{
    const v=document.getElementById('admin-email').value.trim();
    if(v){localStorage.setItem('adminUser',v);window.location.href='admin-dashboard.html'}
    else alert('Please enter your Admin ID.')
  });

  const rb=document.getElementById('register-btn');
  if(rb) rb.addEventListener('click',()=>alert('Registration available after backend integration.'));
})();

// ── Dashboard Username ──
(function(){
  const u=document.getElementById('dash-username'),p=document.getElementById('profile-name');
  const s=localStorage.getItem('quizUser')||'Player';
  if(u) u.textContent=s.split('@')[0];
  if(p) p.textContent=s;
})();

// ── Animated Counters ──
(function(){
  const els=document.querySelectorAll('[data-target]');
  if(!els.length) return;
  const anim=(el)=>{
    const target=parseInt(el.getAttribute('data-target')),dur=2000,start=performance.now();
    const tick=(now)=>{
      const p=Math.min((now-start)/dur,1),ease=1-Math.pow(1-p,3);
      el.textContent=Math.floor(target*ease).toLocaleString();
      if(p<1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){anim(e.target);obs.unobserve(e.target)}})
  },{threshold:.5});
  els.forEach(e=>obs.observe(e));
})();

// ──────────────────────────────────────────────
// Quiz Engine — fetches from backend API
// ──────────────────────────────────────────────
const Quiz=(function(){

  // Fallback questions (used if backend is down)
  const fallbackQuestions=[
    {q:"Which club has won the most UEFA Champions League titles?",o:["AC Milan","Real Madrid","Barcelona","Bayern Munich"],c:1,cat:"champions-league"},
    {q:"Who scored the winning goal in the 2017 Champions League final?",o:["Gareth Bale","Cristiano Ronaldo","Karim Benzema","Sergio Ramos"],c:1,cat:"champions-league"},
    {q:"Which team completed the famous 'Remontada' comeback against PSG in 2017?",o:["Real Madrid","Juventus","Barcelona","Bayern Munich"],c:2,cat:"champions-league"},
    {q:"In which year did Liverpool win the Champions League in Istanbul?",o:["2003","2005","2007","2009"],c:1,cat:"champions-league"},
    {q:"Which country won the 2022 FIFA World Cup in Qatar?",o:["France","Brazil","Argentina","Croatia"],c:2,cat:"world-cup"},
    {q:"Who holds the record for most FIFA World Cup goals?",o:["Ronaldo (Brazil)","Miroslav Klose","Pelé","Just Fontaine"],c:1,cat:"world-cup"},
    {q:"Which country has won the most FIFA World Cup titles?",o:["Germany","Italy","Argentina","Brazil"],c:3,cat:"world-cup"},
    {q:"In which World Cup did Maradona score the 'Hand of God' goal?",o:["1982 Spain","1986 Mexico","1990 Italy","1994 USA"],c:1,cat:"world-cup"},
    {q:"Which country won UEFA Euro 2020 (played in 2021)?",o:["England","Spain","Italy","France"],c:2,cat:"euro"},
    {q:"Who scored the winning penalty in the Euro 2020 final for Italy?",o:["Jorginho","Bonucci","Bernardeschi","England missed — Italy won"],c:3,cat:"euro"},
  ];

  let cur=[],idx=0,score=0,timer=null,timeLeft=30,totalTime=0,name='';

  function init(){
    const sb=document.getElementById('start-quiz-btn'),nb=document.getElementById('next-btn'),pb=document.getElementById('play-again-btn');
    if(!document.getElementById('quiz-setup')) return;
    if(sb) sb.addEventListener('click',()=>{
      name=document.getElementById('player-name').value.trim();
      if(!name){alert('Please enter your name!');return}
      start(document.getElementById('quiz-category').value);
    });
    if(nb) nb.addEventListener('click',next);
    if(pb) pb.addEventListener('click',reset);
  }

  // Fetch questions from backend API, then start quiz
  async function start(cat){
    let allQ = [];

    try {
      // Build API URL with optional category filter
      const url = cat === 'all'
        ? `${API_URL}/questions`
        : `${API_URL}/questions?category=${cat}`;

      const res = await fetch(url);
      const data = await res.json();

      if(data.success && data.questions.length > 0){
        // Convert API format {question, options, correct, category}
        // to quiz format {q, o, c, cat}
        allQ = data.questions.map(q => ({
          q: q.question, o: q.options, c: q.correct, cat: q.category
        }));
        console.log(`✅ Loaded ${allQ.length} questions from API`);
      }
    } catch(err) {
      console.warn('⚠️ Backend unavailable, using fallback questions:', err.message);
    }

    // Fallback if API failed or returned nothing
    if(allQ.length === 0){
      allQ = cat === 'all'
        ? [...fallbackQuestions]
        : fallbackQuestions.filter(q => q.cat === cat);
      if(allQ.length < 4) allQ = [...fallbackQuestions];
    }

    // Shuffle and pick up to 10
    cur = allQ.sort(() => Math.random() - 0.5).slice(0, 10);
    idx=0;score=0;totalTime=0;
    document.getElementById('quiz-setup').classList.add('hidden');
    document.getElementById('quiz-play').classList.remove('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
    document.getElementById('q-total').textContent=cur.length;
    load();
  }

  function load(){
    const q=cur[idx];
    document.getElementById('q-text').textContent=q.q;
    document.getElementById('q-current').textContent=idx+1;
    document.getElementById('q-score').textContent=score;
    document.getElementById('q-badge').textContent=q.cat.replace('-',' ').toUpperCase();
    document.getElementById('prog-fill').style.width=(idx/cur.length*100)+'%';
    document.querySelectorAll('.q-opt').forEach((b,i)=>{
      b.className='q-opt';
      b.querySelector('.opt-text').textContent=q.o[i];
      b.onclick=()=>answer(i);
    });
    document.getElementById('next-btn').classList.add('hidden');
    startTimer();
  }

  function startTimer(){
    timeLeft=30;updTimer();clearInterval(timer);
    timer=setInterval(()=>{timeLeft--;totalTime++;updTimer();if(timeLeft<=0){clearInterval(timer);reveal(-1)}},1000);
  }

  function updTimer(){
    const t=document.getElementById('timer-text'),c=document.getElementById('timer-circle');
    if(t) t.textContent=timeLeft;
    const off=125.66*(1-timeLeft/30);
    if(c){c.style.strokeDashoffset=off;c.style.stroke=timeLeft<=5?'#ff5252':timeLeft<=10?'#ffab40':'#00e5ff'}
    if(t) t.style.color=timeLeft<=5?'#ff5252':timeLeft<=10?'#ffab40':'#00e5ff';
  }

  function answer(i){clearInterval(timer);reveal(i)}

  function reveal(sel){
    const q=cur[idx];
    document.querySelectorAll('.q-opt').forEach((b,i)=>{
      b.onclick=null;
      if(i===q.c) b.classList.add('correct');
      if(i===sel&&sel!==q.c) b.classList.add('wrong');
      if(i!==q.c&&i!==sel) b.classList.add('disabled');
    });
    if(sel===q.c) score++;
    document.getElementById('q-score').textContent=score;
    document.getElementById('next-btn').classList.remove('hidden');
  }

  function next(){idx++;idx>=cur.length?result():load()}

  function result(){
    clearInterval(timer);
    document.getElementById('quiz-play').classList.add('hidden');
    document.getElementById('quiz-result').classList.remove('hidden');
    const t=cur.length;
    document.getElementById('result-score').textContent=score;
    document.getElementById('result-total').textContent=t;
    document.getElementById('result-correct').textContent=score;
    document.getElementById('result-wrong').textContent=t-score;
    document.getElementById('result-time').textContent=Math.round(totalTime/t)+'s';
    const p=score/t,ti=document.getElementById('result-title'),su=document.getElementById('result-sub');
    if(p>=.8){ti.textContent='🏆 Champion!';su.textContent='Outstanding performance!'}
    else if(p>=.6){ti.textContent='⭐ Great Job!';su.textContent='You know your football!'}
    else if(p>=.4){ti.textContent='👍 Not Bad!';su.textContent='Keep practicing!'}
    else{ti.textContent='📚 Keep Learning!';su.textContent='Try again to improve.'}
    saveLB(name,score,t);
    document.getElementById('prog-fill').style.width='100%';
    confetti();
  }

  function reset(){
    document.getElementById('quiz-setup').classList.remove('hidden');
    document.getElementById('quiz-play').classList.add('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
  }

  async function saveLB(n,s,t){
    const entry = {
      name: n,
      score: s * 100,
      total: t,
      category: document.getElementById('quiz-category')?.value || 'all',
      date: new Date().toLocaleDateString('en-GB')
    };

    try {
      const res = await fetch(`${API_URL}/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      const data = await res.json();
      if(data.success) console.log('✅ Score saved to Supabase:', data.entry);
    } catch(err) {
      // Fallback to localStorage if backend is down
      console.warn('⚠️ Backend unavailable, saving score to localStorage:', err.message);
      const e = JSON.parse(localStorage.getItem('quizLeaderboard') || '[]');
      e.push(entry);
      e.sort((a, b) => b.score - a.score);
      localStorage.setItem('quizLeaderboard', JSON.stringify(e.slice(0, 50)));
    }
  }

  return{init};
})();
Quiz.init();

// ── Confetti ──
function confetti(){
  const c=document.getElementById('confetti-canvas');if(!c)return;
  const ctx=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;
  const ps=[],cols=['#00e5ff','#2979ff','#7c4dff','#ffd700','#ff5252','#4caf50','#fff'];
  for(let i=0;i<150;i++) ps.push({x:Math.random()*c.width,y:Math.random()*c.height-c.height,w:Math.random()*10+5,h:Math.random()*6+3,color:cols[Math.floor(Math.random()*cols.length)],vx:(Math.random()-.5)*4,vy:Math.random()*3+2,r:Math.random()*360,rs:(Math.random()-.5)*10,op:1});
  let f=0;
  (function draw(){
    ctx.clearRect(0,0,c.width,c.height);f++;
    ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.r+=p.rs;if(f>120)p.op-=.01;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r*Math.PI/180);ctx.globalAlpha=Math.max(0,p.op);ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore()});
    if(f<240)requestAnimationFrame(draw);else ctx.clearRect(0,0,c.width,c.height);
  })();
}

// ── Leaderboard ──
(async function(){
  const tb=document.getElementById('lb-tbody');if(!tb)return;

  let all = [];

  try {
    const res = await fetch(`${API_URL}/leaderboard`);
    const data = await res.json();
    if(data.success && data.leaderboard.length > 0){
      all = data.leaderboard;
      console.log(`✅ Loaded ${all.length} leaderboard entries from API`);
    }
  } catch(err) {
    console.warn('⚠️ Backend unavailable, loading from localStorage:', err.message);
  }

  // Fallback: use localStorage + defaults if API returned nothing
  if(all.length === 0){
    const defaults=[
      {name:'Ronaldo Fan',score:950,category:'champions-league',date:'25/04/2026'},
      {name:'Messi GOAT',score:900,category:'world-cup',date:'24/04/2026'},
      {name:'Zidane Magic',score:880,category:'legends',date:'23/04/2026'},
      {name:'Haaland Beast',score:850,category:'champions-league',date:'22/04/2026'},
      {name:'Mbappé Speed',score:820,category:'world-cup',date:'21/04/2026'},
      {name:'Modric Maestro',score:800,category:'euro',date:'20/04/2026'},
      {name:'Pirlo Legend',score:780,category:'legends',date:'19/04/2026'},
      {name:'Salah King',score:750,category:'records',date:'18/04/2026'},
      {name:'Neymar Skills',score:720,category:'champions-league',date:'17/04/2026'},
      {name:'Buffon Wall',score:700,category:'legends',date:'16/04/2026'},
      {name:'De Bruyne Ace',score:680,category:'euro',date:'15/04/2026'},
      {name:'Benzema CF9',score:650,category:'champions-league',date:'14/04/2026'}
    ];
    const stored=JSON.parse(localStorage.getItem('quizLeaderboard')||'[]');
    all=[...stored,...defaults].sort((a,b)=>b.score-a.score);
    const seen=new Set();all=all.filter(e=>{if(seen.has(e.name))return false;seen.add(e.name);return true});
  }

  function render(data){
    for(let i=0;i<3;i++){const card=document.getElementById('top3-'+(i+1));if(card&&data[i]){card.querySelector('.top3-name').textContent=data[i].name;card.querySelector('.top3-pts').textContent=data[i].score+' pts'}}
    tb.innerHTML=data.map((e,i)=>`<tr><td class="lb-rank">#${i+1}</td><td>${e.name}</td><td style="color:var(--accent);font-weight:700">${e.score}</td><td>${(e.category||'all').replace('-',' ')}</td><td style="color:var(--text-muted)">${e.date}</td></tr>`).join('');
  }
  render(all);

  const si=document.getElementById('lb-search-input');
  if(si) si.addEventListener('input',()=>{render(all.filter(e=>e.name.toLowerCase().includes(si.value.toLowerCase())))});

  const ss=document.getElementById('lb-sort');
  if(ss) ss.addEventListener('change',()=>{
    let s=[...all];const v=ss.value;
    if(v==='score-desc')s.sort((a,b)=>b.score-a.score);
    else if(v==='score-asc')s.sort((a,b)=>a.score-b.score);
    else if(v==='name-asc')s.sort((a,b)=>a.name.localeCompare(b.name));
    else if(v==='name-desc')s.sort((a,b)=>b.name.localeCompare(a.name));
    render(s);
  });
})();

// ──────────────────────────────────────────────
// Admin Panel — uses backend API (fetch)
// ──────────────────────────────────────────────
(function(){
  const form=document.getElementById('add-question-form');if(!form)return;
  const modal=document.getElementById('success-modal'),mc=document.getElementById('modal-close-btn');
  const pc=document.getElementById('preview-content'),pe=document.getElementById('preview-empty');
  const formTitle=document.getElementById('admin-form-title');
  const submitBtn=document.getElementById('add-question-btn');
  const cancelBtn=document.getElementById('cancel-edit-btn');

  // Track edit mode
  let editingId = null;

  // Live preview (no API call needed, just updates DOM)
  ['aq-question','aq-opt-a','aq-opt-b','aq-opt-c','aq-opt-d','aq-category','aq-correct'].forEach(id=>{
    const el=document.getElementById(id);if(el) el.addEventListener('input',preview);
  });

  function preview(){
    const q=document.getElementById('aq-question').value,a=document.getElementById('aq-opt-a').value,b=document.getElementById('aq-opt-b').value,c=document.getElementById('aq-opt-c').value,d=document.getElementById('aq-opt-d').value,cat=document.getElementById('aq-category').value,cor=document.getElementById('aq-correct').value;
    if(q||a||b||c||d){
      if(pc)pc.classList.remove('hidden');if(pe)pe.style.display='none';
      document.getElementById('preview-q').textContent=q||'Question?';
      document.getElementById('preview-cat').textContent=cat?cat.replace('-',' ').toUpperCase():'CATEGORY';
      document.getElementById('prev-a-t').textContent=a||'—';document.getElementById('prev-b-t').textContent=b||'—';
      document.getElementById('prev-c-t').textContent=c||'—';document.getElementById('prev-d-t').textContent=d||'—';
      ['prev-a','prev-b','prev-c','prev-d'].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.className='preview-opt'+(i===parseInt(cor)?' correct-p':'')});
    }
  }

  // ── Switch to edit mode ──
  function enterEditMode(q) {
    editingId = q.id;
    document.getElementById('aq-question').value = q.question;
    document.getElementById('aq-opt-a').value = q.options[0];
    document.getElementById('aq-opt-b').value = q.options[1];
    document.getElementById('aq-opt-c').value = q.options[2];
    document.getElementById('aq-opt-d').value = q.options[3];
    document.getElementById('aq-correct').value = q.correct;
    document.getElementById('aq-category').value = q.category;
    if(formTitle) formTitle.textContent = `Edit Question #${q.id}`;
    if(submitBtn) submitBtn.textContent = '✏️ Update Question';
    if(cancelBtn) cancelBtn.classList.remove('hidden');
    preview();
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Cancel edit mode ──
  function cancelEdit() {
    editingId = null;
    form.reset();
    if(formTitle) formTitle.textContent = 'Add New Question';
    if(submitBtn) submitBtn.textContent = 'Save Question';
    if(cancelBtn) cancelBtn.classList.add('hidden');
    if(pc) pc.classList.add('hidden');
    if(pe) pe.style.display='flex';
  }

  if(cancelBtn) cancelBtn.addEventListener('click', cancelEdit);

  // ── Save / Update question ──
  if(submitBtn) submitBtn.addEventListener('click', async ()=>{
    const q=document.getElementById('aq-question').value.trim();
    const a=document.getElementById('aq-opt-a').value.trim();
    const b=document.getElementById('aq-opt-b').value.trim();
    const c=document.getElementById('aq-opt-c').value.trim();
    const d=document.getElementById('aq-opt-d').value.trim();
    const cat=document.getElementById('aq-category').value;
    const cor=document.getElementById('aq-correct').value;

    // Client-side validation first
    if(!q||!a||!b||!c||!d||!cat||cor===''){
      alert('Please fill in all fields.');
      return;
    }

    // Build JSON payload matching backend API format
    const payload = {
      question: q,
      options: [a, b, c, d],
      correct: parseInt(cor),
      category: cat
    };

    try {
      let res, data;

      if(editingId) {
        // PUT to update existing question
        res = await fetch(`${API_URL}/questions/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if(res.ok && data.success){
          document.getElementById('modal-msg').textContent = `Question #${editingId} updated successfully.`;
          if(modal) modal.classList.remove('hidden');
          console.log('✅ Question updated:', data.question);
        } else {
          const errors = data.details ? data.details.join('\n') : data.error;
          alert('Update failed:\n' + errors);
          return;
        }
      } else {
        // POST to create new question
        res = await fetch(`${API_URL}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if(res.ok && data.success){
          document.getElementById('modal-msg').textContent = 'The question has been added to the database.';
          if(modal) modal.classList.remove('hidden');
          console.log('✅ Question saved to backend:', data.question);
        } else {
          const errors = data.details ? data.details.join('\n') : data.error;
          alert('Backend validation failed:\n' + errors);
          return;
        }
      }
    } catch(err) {
      // Backend down — save to localStorage as fallback
      console.warn('⚠️ Backend unavailable, saving to localStorage:', err.message);
      const qs=JSON.parse(localStorage.getItem('adminQuestions')||'[]');
      qs.push(payload);
      localStorage.setItem('adminQuestions',JSON.stringify(qs));
      if(modal) modal.classList.remove('hidden');
    }

    // Reset form and refresh table
    cancelEdit();
    renderTable();
  });

  // Close modal
  if(mc) mc.addEventListener('click',()=>modal.classList.add('hidden'));

  // ── Load questions table from GET API ──
  async function renderTable(){
    const tb=document.getElementById('questions-tbody');
    const cnt=document.getElementById('q-count');
    if(!tb) return;

    let questions = [];

    try {
      // Fetch all questions from backend
      const res = await fetch(`${API_URL}/questions`);
      const data = await res.json();
      if(data.success){
        questions = data.questions;
        console.log(`✅ Loaded ${questions.length} questions from API`);
      }
    } catch(err) {
      // Fallback: load from localStorage
      console.warn('⚠️ Backend unavailable, loading from localStorage');
      const stored = JSON.parse(localStorage.getItem('adminQuestions')||'[]');
      questions = stored.map((q,i) => ({
        id: i+1,
        question: q.question || q.q,
        options: q.options || q.o,
        correct: q.correct !== undefined ? q.correct : q.c,
        category: q.category || q.cat
      }));
    }

    if(cnt) cnt.textContent = questions.length;

    tb.innerHTML = questions.map(q => `
      <tr>
        <td>${q.id}</td>
        <td>${q.question.substring(0,55)}${q.question.length>55?'...':''}</td>
        <td><span class="q-badge">${q.category.replace('-',' ')}</span></td>
        <td style="display:flex;gap:.4rem;flex-wrap:wrap">
          <button class="btn btn-sm btn-outline" onclick="editQ(${q.id})">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="delQ(${q.id})">🗑️ Delete</button>
        </td>
      </tr>
    `).join('');
  }

  // ── Edit question — fetch and populate form ──
  window.editQ = async function(id){
    try {
      const res = await fetch(`${API_URL}/questions/${id}`);
      const data = await res.json();
      if(data.success){
        enterEditMode(data.question);
      } else {
        alert(data.error || 'Failed to load question.');
      }
    } catch(err) {
      alert('Could not reach backend to load question.');
    }
  };

  // ── Delete question via DELETE API ──
  window.delQ = async function(id){
    if(!confirm('Delete this question?')) return;

    try {
      const res = await fetch(`${API_URL}/questions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if(data.success){
        console.log(`✅ Deleted question ${id} from backend`);
      } else {
        alert(data.error || 'Failed to delete.');
      }
    } catch(err) {
      // Fallback: delete from localStorage
      console.warn('⚠️ Backend unavailable, deleting from localStorage');
      const qs=JSON.parse(localStorage.getItem('adminQuestions')||'[]');
      qs.splice(id-1, 1);
      localStorage.setItem('adminQuestions',JSON.stringify(qs));
    }

    renderTable();
  };

  // Initial load
  renderTable();
})();

// ──────────────────────────────────────────────
// Admin Dashboard — Leaderboard Management
// ──────────────────────────────────────────────
(async function(){
  const tb=document.getElementById('admin-lb-tbody');if(!tb)return;

  async function renderAdminLB(){
    let entries = [];
    try {
      const res = await fetch(`${API_URL}/leaderboard`);
      const data = await res.json();
      if(data.success) entries = data.leaderboard;
    } catch(err) {
      console.warn('⚠️ Could not load leaderboard:', err.message);
    }

    const cnt=document.getElementById('admin-lb-count');
    if(cnt) cnt.textContent = entries.length;

    tb.innerHTML = entries.length === 0
      ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">No leaderboard entries yet. Play a quiz to add scores!</td></tr>'
      : entries.map(e => `
        <tr>
          <td>${e.id}</td>
          <td>${e.name}</td>
          <td style="color:var(--accent);font-weight:700">${e.score}</td>
          <td>${(e.category||'all').replace('-',' ')}</td>
          <td style="color:var(--text-muted)">${e.date}</td>
          <td><button class="btn btn-sm btn-danger" onclick="delLB(${e.id})">🗑️ Delete</button></td>
        </tr>
      `).join('');
  }

  window.delLB = async function(id){
    if(!confirm('Delete this leaderboard entry?')) return;
    try {
      const res = await fetch(`${API_URL}/leaderboard/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if(data.success) console.log(`✅ Deleted leaderboard entry ${id}`);
      else alert(data.error || 'Failed to delete.');
    } catch(err) {
      alert('Could not reach backend.');
    }
    renderAdminLB();
  };

  renderAdminLB();
})();

// ── Did You Know? — Rotating Football Facts ──
(function(){
  const el = document.getElementById('dyk-text');
  if(!el) return;

  const facts = [
    "Real Madrid has won the Champions League a record 15 times — more than any other club in history.",
    "The fastest goal in World Cup history was scored by Hakan Şükür of Turkey in just 11 seconds during the 2002 World Cup.",
    "Brazil is the only country to have played in every single FIFA World Cup since its inception in 1930.",
    "Lionel Messi holds the record for the most Ballon d'Or awards, with 8 titles to his name.",
    "The original FIFA World Cup trophy, the Jules Rimet Trophy, was stolen and never recovered in 1983.",
    "Pelé is the only player to have won three FIFA World Cup titles — in 1958, 1962, and 1970.",
    "The Champions League anthem, written by Tony Britten, is based on Handel's 'Zadok the Priest' from 1727.",
    "Cristiano Ronaldo is the all-time top scorer in the UEFA Champions League with over 140 goals.",
    "The 2022 FIFA World Cup in Qatar was the first ever held in the Middle East and during November–December.",
    "AC Milan legend Paolo Maldini played his entire 25-year career at a single club — from 1985 to 2009."
  ];

  let current = 0;
  el.textContent = facts[0];
  el.style.transition = 'opacity 0.5s ease';

  setInterval(() => {
    el.style.opacity = '0';
    setTimeout(() => {
      current = (current + 1) % facts.length;
      el.textContent = facts[current];
      el.style.opacity = '1';
    }, 500);
  }, 10000);
})();
