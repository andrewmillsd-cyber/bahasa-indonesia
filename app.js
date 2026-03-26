// Bahasa Indonesia 30-Day — application logic

let S = { cur:1, done:[], streak:0, last:null, srs:{} };

function load(){
  try {
    S.done = JSON.parse(localStorage.getItem(SK.done)||'[]');
    S.streak = parseInt(localStorage.getItem(SK.streak)||'0');
    S.last = localStorage.getItem(SK.last)||null;
    S.srs = JSON.parse(localStorage.getItem(SK.srs)||'{}');
  } catch(e){}
}
function save(){
  try {
    localStorage.setItem(SK.done, JSON.stringify(S.done));
    localStorage.setItem(SK.streak, S.streak);
    localStorage.setItem(SK.last, S.last||'');
    localStorage.setItem(SK.srs, JSON.stringify(S.srs));
  } catch(e){}
}

function updateStreak(){
  const today = new Date().toDateString();
  const yest = new Date(Date.now()-86400000).toDateString();
  if(S.last===today) return;
  S.streak = (S.last===yest) ? S.streak+1 : 1;
  S.last = today;
  save();
}

// ════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════
function buildSidebar(){
  const done = S.done.length, pct = Math.round(done/30*100);
  document.getElementById('streak-num').textContent = S.streak;
  document.getElementById('streak-today').textContent = S.last===new Date().toDateString() ? '✓ Today' : '';
  document.getElementById('prog-label').textContent = `${done} / 30 days`;
  document.getElementById('prog-pct').textContent = `${pct}%`;
  document.getElementById('prog-fill').style.width = `${pct}%`;
  const words = S.done.reduce((acc,d)=>acc+(LESSONS[d]?LESSONS[d].vocab.length:0),0);
  document.getElementById('sb-words').textContent = `${words} vocabulary words introduced`;

  document.getElementById('nav-scroll').innerHTML = WEEKS.map(w=>`
    <div class="week-head">${w.label}</div>
    ${w.days.map(d=>{
      const L=LESSONS[d], isDone=S.done.includes(d), isAct=d===S.cur;
      return `<div class="day-item${isAct?' active':''}${isDone?' done':''}" onclick="goDay(${d})">
        <div class="day-num">${isDone?'✓':d}</div>
        <div class="day-title-nav">${L?L.t:('Day '+d)}</div>
      </div>`;
    }).join('')}
  `).join('');
}

function continueLearning(){ goDay(Math.min(30,S.done.length+1)); }

// ════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════
let timerIv=null, timerRun=false, timerLeft=0;

function goDay(d){
  // Clear any running timer before re-rendering
  if(timerIv){clearInterval(timerIv);timerIv=null;timerRun=false;timerLeft=0;}
  S.cur = d; updateStreak(); buildSidebar();
  const L = LESSONS[d];
  if(!L){ document.getElementById('main').innerHTML=`<div style="padding:60px 40px;font-size:16px;color:#999">Day ${d} — check your 30-day PDF plan!</div>`; return; }

  // init SRS for this day's vocab
  L.vocab.forEach((v,i)=>{
    const k=`${d}-${i}`;
    if(!S.srs[k]) S.srs[k]={word:v.id,meaning:v.en,pron:v.p||'',day:d,interval:1,ef:2.5,next:Date.now()};
  });
  save();

  const hasQ = !!QUIZZES[d];
  const dueCount = srsQueue().length;

  document.getElementById('main').innerHTML = `
    <div class="lesson-hero">
      <div class="hero-eyebrow">Day ${d} of 30 &nbsp;·&nbsp; ${L.w}</div>
      <div class="hero-title">${L.emoji} ${L.t}</div>
      <div class="hero-week">🇮🇩 Bahasa Indonesia Journey</div>
    </div>
    <div class="tab-bar" id="tab-bar-${d}">
      <button class="tab-btn active" onclick="swTab(this,'vp')">📚 Vocabulary</button>
      <button class="tab-btn" onclick="swTab(this,'gp')">📐 Grammar</button>
      <button class="tab-btn" onclick="swTab(this,'sp')">🎤 Speaking</button>
      <button class="tab-btn" onclick="swTab(this,'lp')">🎧 Listening</button>
      <button class="tab-btn" onclick="swTab(this,'wrp')">✍️ Writing</button>
      <button class="tab-btn" onclick="swTab(this,'dlgp')">🎭 Dialogue</button>
      <button class="tab-btn" onclick="swTab(this,'php')">💬 Phrases</button>
      <button class="tab-btn" onclick="swTab(this,'rdp')">📖 Reading</button>
      <button class="tab-btn" onclick="swTab(this,'exp')">✏️ Exercises</button>
      <button class="tab-btn" onclick="swTab(this,'tp')">🧩 Tests</button>
      <button class="tab-btn" onclick="swTab(this,'wtp')">📊 Weekly</button>
      ${hasQ?`<button class="tab-btn" onclick="swTab(this,'qp')">⚡ Quick Quiz</button>`:''}
      <button class="tab-btn" onclick="swTab(this,'rp')">🔁 Review${dueCount>0?`<span class="tab-pill">${dueCount}</span>`:''}</button>
    </div>
    ${vocabPanel(d,L)}
    ${grammarPanel(d,L)}
    ${speakPanel(d,L)}
    ${listenPanel(d,L)}
    ${writingPanel(d)}
    ${dialoguePanel(d)}
    ${phrasesPanel(d)}
    ${readingPanel(d)}
    ${exercisesPanel(d)}
    ${testsPanel(d)}
    ${weeklyTestPanel(d)}
    ${hasQ?quizPanel(d):''}
    ${reviewPanel(d)}
    <div class="done-bar">
      <button class="mark-done${S.done.includes(d)?' done':''}" id="done-btn" onclick="markDone(${d})">
        ${S.done.includes(d)?'✅ Day complete!':'✓ Mark Day '+d+' Complete'}
      </button>
      <span class="done-tip">${S.done.includes(d)?'Great work — keep going! 🔥':'Complete all tabs, then mark done'}</span>
    </div>
  `;
}

function swTab(btn,pid){
  const bar=btn.closest('.tab-bar')||document.getElementById('tab-bar');
  if(bar) bar.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  const p=document.getElementById(pid); if(p) p.classList.add('active');
}

// ════════════════════════════════════════════════
// VOCAB PANEL
// ════════════════════════════════════════════════
function vocabPanel(d,L){
  const cards = L.vocab.map((v,i)=>`
    <div class="vcard" id="vc-${i}" onclick="flipCard(${i})">
      <div class="vc-word">${v.id}</div>
      ${v.p?`<div class="vc-pron">${v.p}</div>`:''}
      <div class="vc-meaning">${v.en}</div>
      <button class="vc-audio" onclick="event.stopPropagation();say(this.dataset.speak)" data-speak="${v.id}">🔊</button>
    </div>`).join('');
  return `<div class="panel active" id="vp">
    <div class="section-title">Today's Vocabulary</div>
    <div class="section-sub">Tap a card to reveal the meaning · Tap 🔊 to hear pronunciation · ${L.vocab.length} words today</div>
    <div class="vocab-grid">${cards}</div>
    <div class="vc-flip-hint">Flip all cards, then try the Quiz tab to test yourself!</div>
  </div>`;
}
function flipCard(i){ document.getElementById('vc-'+i).classList.toggle('flipped'); }
function say(t){
  if(!window.speechSynthesis)return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(t);
  u.lang='id-ID'; u.rate=0.82;
  const vs=speechSynthesis.getVoices();
  const v=vs.find(x=>x.lang==='id-ID'||x.lang.startsWith('id'));
  if(v)u.voice=v;
  speechSynthesis.speak(u);
}
function esc(s){ return s.replace(/'/g,"\\'"); }

// ════════════════════════════════════════════════
// GRAMMAR PANEL
// ════════════════════════════════════════════════
function grammarPanel(d,L){
  const exs = L.gr.ex.map(e=>`
    <div class="grammar-ex">
      <div><div class="grammar-ex-id">${e.id}</div><div class="grammar-ex-en">${e.en}</div></div>
      <button class="ex-speak-btn" data-speak="\${e.id}" onclick="say(this.getAttribute('data-speak'))"">🔊</button>
    </div>`).join('');

  let builder='';
  if(L.build){
    const B=L.build, shuf=[...B.w].sort(()=>Math.random()-.5);
    builder=`<div class="builder-card">
      <div class="builder-title">🏗️ Sentence Builder</div>
      <div class="builder-english">🇬🇧 ${B.e}</div>
      <div class="drop-zone" id="dz-${d}"><span class="drop-zone-hint">Tap tiles below to build the sentence</span></div>
      <div class="tile-pool" id="tp-${d}">${shuf.map(w=>`<span class="tile" data-w="${w}" onclick="tileTap(this,${d})">${w}</span>`).join('')}</div>
      <div class="builder-actions">
        <button class="btn-check" onclick="checkBuild(${d},'${esc(B.s)}')">Check ✓</button>
        <button class="btn-clear" onclick="clearBuild(${d})">Clear</button>
      </div>
      <div class="builder-feedback" id="bf-${d}"></div>
    </div>`;
  }

  return `<div class="panel" id="gp">
    <div class="grammar-hero">
      <div class="grammar-rule-label">Today's Grammar Rule</div>
      <div class="grammar-rule-title">${L.gr.rule}</div>
      <div class="grammar-explain">${L.gr.explain}</div>
    </div>
    <div class="section-title" style="margin-bottom:12px">Example Sentences</div>
    <div class="grammar-examples">${exs}</div>
    ${builder}
  </div>`;
}

function tileTap(el,d){
  if(el.classList.contains('used'))return;
  const dz=document.getElementById('dz-'+d);
  const placed=document.createElement('span');
  placed.className='tile placed'; placed.textContent=el.textContent; placed.dataset.w=el.dataset.w;
  placed.onclick=function(){
    dz.removeChild(placed); el.classList.remove('used');
    document.getElementById('bf-'+d).className='builder-feedback';
    dz.classList.remove('correct','wrong');
    const hint=dz.querySelector('.drop-zone-hint');
    if(hint)hint.style.display='';
  };
  const hint=dz.querySelector('.drop-zone-hint');
  if(hint)hint.style.display='none';
  dz.appendChild(placed); el.classList.add('used');
  document.getElementById('bf-'+d).className='builder-feedback';
  dz.classList.remove('correct','wrong');
}

function checkBuild(d,correct){
  const dz=document.getElementById('dz-'+d);
  const ans=Array.from(dz.querySelectorAll('.placed')).map(t=>t.dataset.w).join(' ');
  const fb=document.getElementById('bf-'+d);
  fb.className='builder-feedback show';
  if(ans.trim()===correct.trim()){
    dz.classList.add('correct'); fb.className='builder-feedback show ok';
    fb.innerHTML='✅ Perfect! '+correct; say(correct);
  } else {
    dz.classList.add('wrong'); fb.className='builder-feedback show err';
    fb.innerHTML='❌ Not quite. Correct order: <strong>'+correct+'</strong>';
  }
}

function clearBuild(d){
  const dz=document.getElementById('dz-'+d), tp=document.getElementById('tp-'+d);
  Array.from(dz.querySelectorAll('.placed')).forEach(p=>{
    const orig=tp.querySelector(`.tile[data-w="${p.dataset.w}"].used`);
    if(orig)orig.classList.remove('used');
    dz.removeChild(p);
  });
  const hint=dz.querySelector('.drop-zone-hint');
  if(hint)hint.style.display='';
  dz.classList.remove('correct','wrong');
  document.getElementById('bf-'+d).className='builder-feedback';
}

// ════════════════════════════════════════════════
// SPEAKING PANEL
// ════════════════════════════════════════════════
function speakPanel(d,L){
  const sp=L.speak;
  const samples=sp.samples.map((s,i)=>`
    <div class="sample-card">
      <div class="sample-num">${i+1}</div>
      <div class="sample-text">
        <div class="sample-id">${s.id}</div>
        <div class="sample-en">${s.en}</div>
      </div>
      <button class="sample-play" data-speak="\${s.id}" onclick="say(this.getAttribute('data-speak'))"">▶</button>
    </div>`).join('');

  const R=53, C=2*Math.PI*R;
  return `<div class="panel" id="sp">
    <div class="speak-task-banner">
      <div class="task-eyebrow">🎯 Your Speaking Task</div>
      <div class="task-text">${sp.task}</div>
    </div>
    <div class="section-title" style="margin-bottom:12px">Example Sentences — Tap ▶ to hear</div>
    <div class="samples-grid">${samples}</div>
    <div class="timer-widget">
      <div class="timer-label">Speaking Practice Timer</div>
      <div class="timer-ring-wrap">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="${R}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
          <circle id="t-arc" cx="65" cy="65" r="${R}" fill="none" stroke="url(#tg)" stroke-width="8"
            stroke-dasharray="${C}" stroke-dashoffset="0" stroke-linecap="round" style="transition:stroke-dashoffset .5s ease"/>
          <defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#FF6B4A"/><stop offset="100%" stop-color="#FFAB2E"/></linearGradient></defs>
        </svg>
        <div class="timer-num" id="t-num">${sp.dur}</div>
      </div>
      <button class="timer-start" id="t-btn" onclick="toggleTimer(${sp.dur})">▶ Start Timer</button>
      <div class="timer-hint">Speak freely in Indonesian for ${sp.dur} seconds without stopping!</div>
      <div class="speak-rate" id="speak-rate-${d}">
        <div class="sr-label">How did that go?</div>
        <div class="sr-row">
          <button class="sr-btn sr-hard" onclick="rateSpeaking(${d},'hard')">😰 Struggled</button>
          <button class="sr-btn sr-ok" onclick="rateSpeaking(${d},'ok')">🙂 Got through it</button>
          <button class="sr-btn sr-easy" onclick="rateSpeaking(${d},'easy')">😄 Nailed it!</button>
        </div>
        <div class="sr-result" id="sr-result-${d}"></div>
      </div>
    </div>
  </div>`;
}

function toggleTimer(total){
  const btn=document.getElementById('t-btn'), num=document.getElementById('t-num'), arc=document.getElementById('t-arc');
  const C=2*Math.PI*53;
  if(timerRun){
    clearInterval(timerIv); timerRun=false; timerLeft=0;
    btn.className='timer-start'; btn.textContent='▶ Start Timer';
    num.textContent=total; arc.style.strokeDashoffset='0';
    arc.style.stroke='url(#tg)';
  } else {
    timerRun=true; timerLeft=total;
    btn.className='timer-start running'; btn.textContent='⏹ Stop';
    timerIv=setInterval(()=>{
      timerLeft--;
      if(num)num.textContent=Math.max(0,timerLeft);
      if(arc){ const o=C*(1-timerLeft/total); arc.style.strokeDashoffset=o; }
      if(timerLeft<=0){
        clearInterval(timerIv); timerIv=null; timerRun=false;
        if(btn){btn.className='timer-start';btn.textContent='▶ Again!';}
        if(arc){arc.style.stroke='#2DC78A';}
        document.querySelectorAll('.speak-rate').forEach(el=>el.classList.add('show'));
      }
    },1000);
  }
}

// ════════════════════════════════════════════════
// LISTENING PANEL
// ════════════════════════════════════════════════
function listenPanel(d,L){
  const ex=L.gr.ex.map(e=>`
    <div class="audio-ex-row">
      <button class="audio-mini-btn" data-speak="\${e.id}" onclick="say(this.getAttribute('data-speak'))"">▶</button>
      <div><div class="audio-ex-id">${e.id}</div><div class="audio-ex-en">${e.en}</div></div>
    </div>`).join('');
  return `<div class="panel" id="lp">
    <div class="coach-box">
      <div class="coach-head">💡 Coach Tip</div>
      <div class="coach-text">${L.tip}</div>
    </div>
    <a class="listen-hero" href="${L.listen.u}" target="_blank">
      <div class="listen-play-btn">▶</div>
      <div class="listen-info">
        <div class="listen-title">${L.listen.t}</div>
        <div class="listen-desc">${L.listen.d}</div>
        <div class="listen-cta">Open on YouTube →</div>
      </div>
    </a>
    <div class="audio-examples">
      <div class="audio-ex-title">Listen to today's example sentences</div>
      ${ex}
    </div>
  </div>`;
}

// ════════════════════════════════════════════════
// QUIZ PANEL
// ════════════════════════════════════════════════
let qScore=0, qIdx=0;
function quizPanel(d){
  qScore=0; qIdx=0;
  return `<div class="panel" id="qp">
    <div class="section-title" style="margin-bottom:4px">Knowledge Quiz</div>
    <div class="section-sub">Test what you've learned today</div>
    <div id="quiz-body">${renderQ(d,0)}</div>
  </div>`;
}
function renderQ(d,i){
  const qs=QUIZZES[d];
  if(!qs||i>=qs.length){
    const t=qs?qs.length:0, pct=Math.round(qScore/t*100);
    return `<div class="score-card">
      <div class="score-emoji">${pct>=80?'🎉':pct>=60?'👍':'📚'}</div>
      <div class="score-num">${qScore}/${t}</div>
      <div class="score-label">${pct>=80?'Excellent! Ready for the next day!':pct>=60?'Good job! Review what you missed.':'Keep studying — you\'ve got this!'}</div>
      <button class="score-retry" onclick="retakeQ(${d})">↺ Retake Quiz</button>
    </div>`;
  }
  const q=qs[i], prog=Math.round(i/qs.length*100);
  if(q.type==='fill') return `
    <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${prog}%"></div></div>
    <div class="fill-card">
      <div class="fill-q-label">Fill in the Blank — Question ${i+1} of ${qs.length}</div>
      <div class="fill-prompt">${q.prompt}</div>
      <div class="fill-hint">💡 Hint: ${q.hint}</div>
      <input class="fill-input" id="fill-in" placeholder="Type your answer..." onkeydown="if(event.key==='Enter')checkFill(${d},${i})">
      <br><button class="fill-check" onclick="checkFill(${d},${i})">Check Answer</button>
      <div id="fill-fb"></div>
    </div>`;
  const letters=['A','B','C','D'];
  return `
    <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${prog}%"></div></div>
    <div class="quiz-q-card">
      <div class="quiz-q-label">Multiple Choice — Question ${i+1} of ${qs.length}</div>
      <div class="quiz-q-text">${q.q}</div>
    </div>
    <div class="quiz-options" id="quiz-opts">
      ${q.opts.map((o,oi)=>`<button class="quiz-opt" data-letter="${letters[oi]}" onclick="answerMC(${d},${i},${oi},${q.a})">${o}</button>`).join('')}
    </div>
    <div id="quiz-fb"></div>`;
}
function answerMC(d,i,chosen,correct){
  document.querySelectorAll('.quiz-opt').forEach((b,bi)=>{
    b.disabled=true;
    if(bi===correct)b.classList.add('correct');
    else if(bi===chosen)b.classList.add('wrong');
  });
  const ok=chosen===correct; if(ok)qScore++;
  const fb=document.getElementById('quiz-fb'); if(!fb)return;
  fb.innerHTML=`<div class="quiz-feedback-bar ${ok?'ok':'err'}">
    ${ok?'✅ Correct! Great job!':'❌ Not quite — see the correct answer highlighted above.'}
    <button class="btn-next" onclick="nextQ(${d},${i+1})">Next →</button>
  </div>`;
}
function checkFill(d,i){
  const inp=document.getElementById('fill-in'); if(!inp)return;
  const q=QUIZZES[d][i], ok=inp.value.trim().toLowerCase()===q.ans.toLowerCase();
  if(ok)qScore++;
  const fb=document.getElementById('fill-fb'); if(!fb)return;
  fb.className='fill-fb '+(ok?'ok':'err');
  fb.textContent=ok?'✅ Correct! '+q.ans:'❌ The answer is: '+q.ans;
  inp.disabled=true;
  setTimeout(()=>nextQ(d,i+1),1300);
}
function nextQ(d,i){ const b=document.getElementById('quiz-body'); if(b)b.innerHTML=renderQ(d,i); }
function retakeQ(d){ qScore=0; const b=document.getElementById('quiz-body'); if(b)b.innerHTML=renderQ(d,0); }

// ════════════════════════════════════════════════
// SRS PANEL
// ════════════════════════════════════════════════
function srsQueue(){ return Object.entries(S.srs).filter(([k,v])=>v.next<=Date.now()).map(([k,v])=>({k,...v})); }

function reviewPanel(d){
  const q=srsQueue();
  if(!q.length) return `<div class="panel" id="rp">
    <div class="srs-empty">
      <div class="srs-empty-icon">✨</div>
      <div class="srs-empty-title">All caught up!</div>
      <div class="srs-empty-sub">No cards due for review right now.<br>Complete more lessons to grow your review queue.</div>
    </div>
  </div>`;
  return `<div class="panel" id="rp">
    <div class="section-title" style="margin-bottom:4px">Spaced Repetition Review</div>
    <div class="section-sub">${q.length} cards due · SM-2 algorithm schedules the perfect review timing</div>
    <div id="srs-body">${renderSRS(q,0)}</div>
  </div>`;
}

function renderSRS(q,i){
  if(i>=q.length) return `<div class="srs-empty"><div class="srs-empty-icon">🎉</div><div class="srs-empty-title">Session complete!</div><div class="srs-empty-sub">All ${q.length} cards reviewed.</div></div>`;
  const c=q[i];
  return `<div class="srs-card-wrap">
    <div class="srs-count">${i+1} of ${q.length} cards</div>
    <div class="srs-word">${c.word}</div>
    ${c.pron?`<div class="srs-pron">${c.pron}</div>`:''}
    <button class="srs-reveal" onclick="revealSRS('srs-ans')">Reveal meaning</button>
    <div class="srs-audio-row">
      <button class="srs-play" data-speak="\${c.word}" onclick="say(this.getAttribute('data-speak'))"">🔊</button>
    </div>
    <div class="srs-answer-area" id="srs-ans">
      <div class="srs-meaning">${c.meaning}</div>
      <div class="srs-rate-label">How well did you know this?</div>
      <div class="srs-btns">
        <button class="srs-btn srs-hard" onclick="rateSRS('${c.k}',0)">😰 Hard</button>
        <button class="srs-btn srs-ok" onclick="rateSRS('${c.k}',3)">🙂 Got it</button>
        <button class="srs-btn srs-easy" onclick="rateSRS('${c.k}',5)">😄 Easy</button>
      </div>
    </div>
    <div class="srs-prog">Card ${i+1} / ${q.length}</div>
  </div>`;
}

function revealSRS(id){ const el=document.getElementById(id); if(el)el.classList.add('shown'); }

function rateSRS(k,quality){
  const c=S.srs[k]; if(!c)return;
  if(quality<3){ c.interval=1; }
  else {
    c.interval = c.interval===1 ? 6 : Math.round(c.interval*c.ef);
    c.ef = Math.max(1.3, c.ef+0.1-(5-quality)*(0.08+(5-quality)*0.02));
  }
  c.next = Date.now()+(c.interval*86400000);
  save();
  const q=srsQueue();
  const idx = q.findIndex(x=>x.k===k);
  const body=document.getElementById('srs-body');
  if(body) body.innerHTML=renderSRS(q, idx>=0?idx+1:q.length);
}

// ════════════════════════════════════════════════
// MARK DONE
// ════════════════════════════════════════════════
function markDone(d){
  if(!S.done.includes(d))S.done.push(d);
  save(); buildSidebar();
  const btn=document.getElementById('done-btn');
  if(btn){btn.className='mark-done done';btn.textContent='✅ Day complete!';}
  const tip=btn&&btn.nextElementSibling;
  if(tip)tip.textContent='Great work — keep going! 🔥';
}




// ════════════════════════════════════════════════════════════════════
// WRITING PANEL
// ════════════════════════════════════════════════════════════════════
function writingPanel(d) {
  const data = WRITING[d];
  if (!data) return '<div class="panel" id="wrp"></div>';
  const cards = data.prompts.map((p, i) => `
    <div class="write-prompt-card">
      <div class="write-prompt-num">Prompt ${i+1} of ${data.prompts.length}</div>
      <div class="write-prompt-text">${p.en}</div>
      <div class="write-starter">✏️ Starter: ${p.starter}</div>
      <textarea class="write-area" id="wa-${d}-${i}"
        placeholder="Start writing in Indonesian..."
        oninput="updateWC('${d}','${i}')"></textarea>
      <div class="write-actions">
        <button class="write-check-btn" onclick="checkWriting('${d}',${i})">Check ✓</button>
        <button class="write-clear-btn" onclick="clearWriting('${d}',${i})">Clear</button>
        <span class="write-wc" id="wc-${d}-${i}">0 words</span>
      </div>
      <div class="write-fb" id="wfb-${d}-${i}"></div>
    </div>`).join('');

  return `<div class="panel" id="wrp">
    <div class="write-intro">
      <div class="write-intro-title">✍️ Sentence Writing Practice</div>
      <div class="write-intro-sub">Write in Indonesian — there's no single right answer! Aim for complete sentences. Use your vocabulary list, grammar rules, and the starter as your guide.</div>
    </div>
    ${cards}
  </div>`;
}

function updateWC(d, i) {
  const ta = document.getElementById('wa-'+d+'-'+i);
  const wc = document.getElementById('wc-'+d+'-'+i);
  if (!ta || !wc) return;
  const words = ta.value.trim().split(/\s+/).filter(w => w.length > 0).length;
  wc.textContent = words + (words === 1 ? ' word' : ' words');
}

function checkWriting(d, i) {
  const ta = document.getElementById('wa-'+d+'-'+i);
  const fb = document.getElementById('wfb-'+d+'-'+i);
  if (!ta || !fb) return;
  const text = ta.value.trim();
  const words = text.split(/\s+/).filter(w => w.length > 0).length;

  fb.className = 'write-fb show';
  if (words === 0) {
    fb.className = 'write-fb show empty';
    fb.textContent = '✏️ Write at least one sentence to check!';
    return;
  }

  // Basic Indonesian checks
  const issues = [];
  const lc = text.toLowerCase();

  // Check for common English words that shouldn't be there
  const engWords = ['the', 'is', 'are', 'was', 'were', 'have', 'has', 'a ', ' a ', 'an ', 'my ', ' my '];
  const foundEng = engWords.filter(w => lc.includes(w));
  if (foundEng.length > 0) issues.push('Looks like some English words crept in — try replacing them with Indonesian!');

  // Check sentence length
  if (words < 3) issues.push('Try writing longer sentences — aim for at least 5 words per sentence.');

  // Check for capital start
  if (text[0] !== text[0].toUpperCase()) issues.push('Start each sentence with a capital letter.');

  // Encouragement based on length
  let praise = '';
  if (words >= 30) praise = '🔥 Excellent effort — 30+ words! That\'s real paragraph-level writing.';
  else if (words >= 15) praise = '👍 Great job — solid sentences! Try to push for more detail.';
  else if (words >= 5) praise = '✅ Good start! Can you expand with more detail?';
  else praise = '✅ Written! Try adding more to the sentence.';

  if (issues.length === 0) {
    fb.className = 'write-fb show ok';
    fb.innerHTML = praise + '<br><br>💡 <strong>Self-check:</strong> Read it aloud — does it make sense? Could you add a time word (kemarin, setiap hari) or adjective?';
  } else {
    fb.className = 'write-fb show partial';
    fb.innerHTML = praise + '<br><br>⚠️ <strong>Tips:</strong><br>• ' + issues.join('<br>• ');
  }
}

function clearWriting(d, i) {
  const ta = document.getElementById('wa-'+d+'-'+i);
  const fb = document.getElementById('wfb-'+d+'-'+i);
  const wc = document.getElementById('wc-'+d+'-'+i);
  if (ta) { ta.value = ''; ta.style.borderColor = ''; }
  if (fb) { fb.className = 'write-fb'; fb.textContent = ''; }
  if (wc) wc.textContent = '0 words';
}


// ════════════════════════════════════════════════════════════════════
// DIALOGUE PANEL
// ════════════════════════════════════════════════════════════════════
function dialoguePanel(d) {
  const data = EXTRA[d];
  if (!data) return '<div class="panel" id="dlgp"></div>';
  const lines = data.dialogue.map((l,i) => `
    <div class="dlg-line speaker-${l.sp}" data-word="${l.id}" onclick="say(this.dataset.word)">
      <div class="dlg-avatar">${l.sp}</div>
      <div class="dlg-bubble">
        <div class="dlg-id">${l.id}</div>
        <div class="dlg-en">${l.en}</div>
      </div>
    </div>`).join('');
  return `<div class="panel" id="dlgp">
    <div class="sec-title">Dialogue Practice</div>
    <div class="sec-sub">Tap any bubble to hear it spoken · Play full dialogue for listening practice</div>
    <div class="dialogue-wrap">${lines}</div>
    <button class="dlg-play-all" onclick="playDialogue(${d}, 0)">▶ Play Full Dialogue</button>
  </div>`;
}

let dlgTimeout = null;
function playDialogue(d, i) {
  if (dlgTimeout) { clearTimeout(dlgTimeout); dlgTimeout = null; }
  const data = EXTRA[d];
  if (!data || i >= data.dialogue.length) return;
  const line = data.dialogue[i];
  say(line.id);
  const dur = Math.max(2000, line.id.length * 95);
  dlgTimeout = setTimeout(() => playDialogue(d, i + 1), dur);
}

// ════════════════════════════════════════════════════════════════════
// PHRASES PANEL
// ════════════════════════════════════════════════════════════════════
function phrasesPanel(d) {
  const data = EXTRA[d];
  if (!data) return '<div class="panel" id="php"></div>';
  const cards = data.phrases.map((p,i) => `
    <div class="phrase-card">
      <div class="phrase-body">
        <div class="phrase-id">${p.id}</div>
        <div class="phrase-en">${p.en}</div>
        <div class="phrase-ctx">📍 ${p.ctx}</div>
      </div>
      <button class="phrase-spk" data-word="${p.id}" onclick="say(this.dataset.word)">🔊</button>
    </div>`).join('');
  return `<div class="panel" id="php">
    <div class="sec-title">Real-World Phrases</div>
    <div class="sec-sub">8 practical phrases with context for when to use them · Tap 🔊 to hear</div>
    <div class="phrase-grid">${cards}</div>
  </div>`;
}

// ════════════════════════════════════════════════════════════════════
// READING PANEL
// ════════════════════════════════════════════════════════════════════
function readingPanel(d) {
  const data = EXTRA[d];
  if (!data) return '<div class="panel" id="rdp"></div>';
  const rd = data.reading;
  const qs = rd.questions.map((q,i) => `
    <div class="reading-q">
      <div class="rq-text">${i+1}. ${q.q}</div>
      <input class="rq-input" id="rq-${d}-${i}" placeholder="Jawab dalam Bahasa Indonesia..."
        onkeydown="if(event.key==='Enter')checkRQ(${d},${i})">
      <div class="rq-hint">💡 ${q.hint}</div>
      <button class="rq-check" onclick="checkRQ(${d},${i})">Check ✓</button>
      <div class="rq-fb" id="rq-fb-${d}-${i}"></div>
    </div>`).join('');
  return `<div class="panel" id="rdp">
    <div class="sec-title">Reading Comprehension</div>
    <div class="sec-sub">Read the passage, then answer the questions in Indonesian</div>
    <div class="reading-card">
      <div class="reading-label">
        <span>📄 Today's Reading</span>
        <button class="btn-play-reading" data-word="${rd.text}" onclick="say(this.dataset.word)">🔊 Hear it</button>
      </div>
      <div class="reading-text">${rd.text}</div>
      <div class="reading-actions">
        <button class="btn-reveal-tr" onclick="this.nextElementSibling.classList.toggle('show');this.textContent=this.textContent.includes('Show')?'Hide translation':'Show translation'">Show translation</button>
      </div>
      <div class="reading-translation">${rd.translation}</div>
    </div>
    <div class="reading-q-title">Comprehension Questions</div>
    <div class="reading-qs">${qs}</div>
  </div>`;
}

function checkRQ(d, i) {
  const inp = document.getElementById('rq-'+d+'-'+i);
  if (!inp || inp.disabled) return;
  const q = EXTRA[d].reading.questions[i];
  const norm = s => s.toLowerCase().replace(/[!?,.\-]/g,'').trim();
  // Flexible check — any key word from answer
  const keyWords = q.a.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const userNorm = norm(inp.value);
  const ok = keyWords.some(w => userNorm.includes(w)) || norm(inp.value) === norm(q.a);
  const fb = document.getElementById('rq-fb-'+d+'-'+i);
  if (fb) {
    fb.className = 'rq-fb ' + (ok ? 'ok' : 'err');
    fb.textContent = ok ? '✅ Good answer! Model: "'+q.a+'"' : '❌ Model answer: "'+q.a+'"';
  }
  if (ok) inp.style.borderColor = 'var(--jade)';
  else inp.style.borderColor = 'var(--coral)';
}

// ════════════════════════════════════════════════════════════════════
// GRAMMAR EXERCISES PANEL
// ════════════════════════════════════════════════════════════════════
function exercisesPanel(d) {
  const data = EXTRA[d];
  if (!data) return '<div class="panel" id="exp"></div>';
  const cards = data.exercises.map((ex, i) => {
    if (ex.type === 'fill') {
      return `<div class="ex-card" id="exc-${d}-${i}">
        <div class="ex-label">Fill in the Blank</div>
        <div class="ex-prompt">${ex.prompt}</div>
        <input class="ex-input" id="exi-${d}-${i}" placeholder="Type your answer..."
          onkeydown="if(event.key==='Enter')checkEx(${d},${i})">
        <div class="ex-hint">💡 ${ex.hint}</div>
        <button class="ex-btn" onclick="checkEx(${d},${i})">Check ✓</button>
        <div class="ex-fb" id="exf-${d}-${i}"></div>
      </div>`;
    } else if (ex.type === 'order') {
      const shuf = [...ex.words].sort(() => Math.random() - 0.5);
      const tiles = shuf.map(w => `<span class="ex-tile" data-w="${w}" onclick="exTileTap(this,'exdz-${d}-${i}','extp-${d}-${i}','exf-${d}-${i}')">${w}</span>`).join('');
      return `<div class="ex-card" id="exc-${d}-${i}">
        <div class="ex-label">Word Order — arrange: "${ex.en}"</div>
        <div class="ex-order-dz" id="exdz-${d}-${i}"><span style="font-size:11px;color:#ccc">Tap words below to build the sentence</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px" id="extp-${d}-${i}">${tiles}</div>
        <button class="ex-btn" onclick="checkExOrder('exdz-${d}-${i}','${ex.ans.replace(/'/g,"\\'")}','exf-${d}-${i}','exc-${d}-${i}')">Check ✓</button>
        <button style="margin-top:10px;margin-left:8px;padding:9px 16px;background:transparent;border:2px solid var(--sand);border-radius:var(--r-sm);font-size:12px;color:#999;cursor:pointer" onclick="clearExOrder('exdz-${d}-${i}','extp-${d}-${i}','exf-${d}-${i}','exc-${d}-${i}')">Clear</button>
        <div class="ex-fb" id="exf-${d}-${i}"></div>
      </div>`;
    }
    return '';
  }).join('');
  return `<div class="panel" id="exp">
    <div class="sec-title">Grammar Exercises</div>
    <div class="sec-sub">4 targeted exercises to reinforce today's grammar patterns</div>
    <div class="ex-grid">${cards}</div>
  </div>`;
}

function checkEx(d, i) {
  const inp = document.getElementById('exi-'+d+'-'+i);
  const card = document.getElementById('exc-'+d+'-'+i);
  const fb = document.getElementById('exf-'+d+'-'+i);
  if (!inp || inp.disabled) return;
  const ex = EXTRA[d].exercises[i];
  const ok = inp.value.trim().toLowerCase() === ex.ans.toLowerCase();
  if (fb) { fb.className = 'ex-fb show ' + (ok?'ok':'err'); fb.textContent = ok ? '✅ Correct! "'+ex.ans+'"' : '❌ Answer: "'+ex.ans+'"'; }
  if (card) card.classList.add(ok?'correct':'wrong');
  inp.disabled = true;
}

function exTileTap(tile, dzId, tpId, fbId) {
  if (tile.classList.contains('used')) return;
  const dz = document.getElementById(dzId); if (!dz) return;
  const hint = dz.querySelector('span[style]'); if (hint) hint.style.display = 'none';
  const placed = document.createElement('span');
  placed.className = 'ex-tile placed'; placed.textContent = tile.textContent; placed.dataset.w = tile.dataset.w;
  placed.onclick = function() { dz.removeChild(placed); tile.classList.remove('used'); const h=dz.querySelector('span[style]'); if(h&&dz.querySelectorAll('.placed').length===0)h.style.display=''; };
  dz.appendChild(placed); tile.classList.add('used');
}

function checkExOrder(dzId, correct, fbId, cardId) {
  const dz = document.getElementById(dzId); const fb = document.getElementById(fbId); const card = document.getElementById(cardId);
  if (!dz || !fb) return;
  const ans = Array.from(dz.querySelectorAll('.placed')).map(t=>t.dataset.w).join(' ').trim();
  const ok = ans === correct.trim();
  fb.className = 'ex-fb show ' + (ok?'ok':'err');
  fb.textContent = ok ? '✅ Correct! "'+correct+'"' : '❌ Correct order: "'+correct+'"';
  if (card) card.classList.add(ok?'correct':'wrong');
  dz.classList.add(ok?'ok':'err');
}

function clearExOrder(dzId, tpId, fbId, cardId) {
  const dz = document.getElementById(dzId); const tp = document.getElementById(tpId);
  const fb = document.getElementById(fbId); const card = document.getElementById(cardId);
  if (!dz || !tp) return;
  Array.from(dz.querySelectorAll('.placed')).forEach(p => {
    const orig = tp.querySelector(`.ex-tile[data-w="${p.dataset.w}"].used`);
    if (orig) orig.classList.remove('used');
    dz.removeChild(p);
  });
  const hint = dz.querySelector('span[style]');
  if (hint) hint.style.display = '';
  dz.classList.remove('ok','err');
  if (fb) { fb.className = 'ex-fb'; fb.textContent = ''; }
  if (card) card.classList.remove('correct','wrong');
}


// ════════════════════════════════════════════════════════════════════
// SPEAKING SELF-RATING
// ════════════════════════════════════════════════════════════════════
function rateSpeaking(d, rating) {
  const el = document.getElementById('sr-result-'+d);
  if(!el) return;
  const msgs = {
    hard: '💪 Struggling is the fastest way to improve. Try again tomorrow!',
    ok:   '👍 Great effort! Consistency beats perfection every time.',
    easy: '🔥 You nailed it! Mark the day complete and keep the streak going!'
  };
  el.textContent = msgs[rating] || '';
  el.style.display = 'block';
  el.style.color = 'rgba(255,255,255,0.55)';
}

// ════════════════════════════════════════════════════════════════════
// TESTS PANEL  (4 types: mc, tr, li, di)
// ════════════════════════════════════════════════════════════════════
let activeTestDay = 0, activeTestType = '', testItems = [], testScore = 0, testIdx = 0;

function testsPanel(d) {
  const has = TESTS[d] && TESTS[d].length > 0;
  if (!has) return `<div class="panel" id="tp">
    <div style="padding:40px;text-align:center;color:#aaa;font-size:14px">No tests for this day yet. Check back after updating!</div>
  </div>`;

  return `<div class="panel" id="tp">
    <div class="sec-title">Test Your Knowledge</div>
    <div class="sec-sub">4 test types — active recall is the fastest path to mastery</div>
    <div class="test-type-grid">
      <div class="tt-btn" id="ttb-mc-${d}" onclick="startTest(${d},'mc')">
        <div class="tt-icon">🔤</div>
        <div class="tt-name">Multiple Choice</div>
        <div class="tt-desc">Recognise the correct answer</div>
      </div>
      <div class="tt-btn" id="ttb-tr-${d}" onclick="startTest(${d},'tr')">
        <div class="tt-icon">✍️</div>
        <div class="tt-name">Translation</div>
        <div class="tt-desc">English → Indonesian (strongest for memory)</div>
      </div>
      <div class="tt-btn" id="ttb-li-${d}" onclick="startTest(${d},'li')">
        <div class="tt-icon">👂</div>
        <div class="tt-name">Listening</div>
        <div class="tt-desc">Hear it — identify the meaning</div>
      </div>
      <div class="tt-btn" id="ttb-di-${d}" onclick="startTest(${d},'di')">
        <div class="tt-icon">📝</div>
        <div class="tt-name">Dictation</div>
        <div class="tt-desc">Hear it — type exactly what you heard</div>
      </div>
    </div>
    <div id="test-body-${d}"></div>
  </div>`;
}

function startTest(d, type) {
  activeTestDay = d; activeTestType = type; testIdx = 0; testScore = 0;
  testItems = (TESTS[d]||[]).filter(t => t.type === type);
  // Highlight selected button
  ['mc','tr','li','di'].forEach(t => {
    const btn = document.getElementById('ttb-'+t+'-'+d);
    if (btn) { btn.className = 'tt-btn' + (t===type?' sel-'+type:''); }
  });
  if (!testItems.length) {
    const body = document.getElementById('test-body-'+d);
    if (body) body.innerHTML = '<div style="padding:20px;text-align:center;color:#aaa">No '+type+' tests for this day — try another type!</div>';
    return;
  }
  renderTest(d, 0);
}

function renderTest(d, i) {
  const body = document.getElementById('test-body-'+d); if (!body) return;
  if (i >= testItems.length) {
    const pct = Math.round(testScore/testItems.length*100);
    body.innerHTML = `<div class="score-card">
      <div class="score-emoji">${pct>=80?'🎉':pct>=60?'👍':'📚'}</div>
      <div class="score-num">${testScore}/${testItems.length}</div>
      <div class="score-label">${pct>=80?'Excellent! Mastered this type today!':pct>=60?'Good! Review once more for full mastery.':'Keep studying — you\'ll get there!'}</div>
      <button class="score-retry" onclick="startTest(${d},'${activeTestType}')">↺ Try Again</button>
    </div>`;
    return;
  }
  const q = testItems[i], prog = Math.round(i/testItems.length*100);
  const letters = ['A','B','C','D'];
  let html = `<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${prog}%"></div></div>`;

  if (q.type === 'mc') {
    html += `<div class="quiz-q-card">
        <div class="quiz-q-label" style="color:var(--coral)">Multiple Choice · ${i+1}/${testItems.length}</div>
        <div class="quiz-q-text">${q.q}</div>
      </div>
      <div class="quiz-options" id="t-opts-${d}-${i}">
        ${q.opts.map((o,oi)=>`<button class="quiz-opt" data-letter="${letters[oi]}" onclick="tAnswerMC(${d},${i},${oi},${q.a})">${o}</button>`).join('')}
      </div>
      <div id="t-fb-${d}-${i}"></div>`;

  } else if (q.type === 'tr') {
    html += `<div class="quiz-q-card">
        <div class="quiz-q-label" style="color:var(--ocean)">Translation EN→ID · ${i+1}/${testItems.length}</div>
        <div class="quiz-q-text">Translate to Indonesian:</div>
        <div class="tr-q-box">${q.q}</div>
      </div>
      <input class="fill-input" id="t-in-${d}-${i}" placeholder="Type in Indonesian..." onkeydown="if(event.key==='Enter')tCheckTr(${d},${i})">
      <div style="font-size:11px;color:#bbb;margin-bottom:10px">💡 Hint: ${q.hint}</div>
      <button class="fill-check" onclick="tCheckTr(${d},${i})">Check ✓</button>
      <div class="fill-fb" id="t-fb-${d}-${i}"></div>`;

  } else if (q.type === 'li') {
    html += `<div class="quiz-q-card">
        <div class="quiz-q-label" style="color:var(--plum)">Listening · ${i+1}/${testItems.length}</div>
        <div class="quiz-q-text">${q.q}</div>
      </div>
      <div style="text-align:center;margin-bottom:14px">
        <button class="listen-play-big" data-word="${q.word}" onclick="say(this.dataset.word)">🔊</button>
        <div class="di-hint">Tap to hear · tap again to replay</div>
      </div>
      <div class="quiz-options" id="t-opts-${d}-${i}">
        ${q.opts.map((o,oi)=>`<button class="quiz-opt" data-letter="${letters[oi]}" onclick="tAnswerMC(${d},${i},${oi},${q.a})">${o}</button>`).join('')}
      </div>
      <div id="t-fb-${d}-${i}"></div>`;

  } else if (q.type === 'di') {
    html += `<div class="quiz-q-card">
        <div class="quiz-q-label" style="color:var(--jade)">Dictation · ${i+1}/${testItems.length}</div>
        <div class="quiz-q-text">${q.q}</div>
      </div>
      <div style="text-align:center;margin-bottom:10px">
        <button class="listen-play-big" data-word="${q.word}" onclick="say(this.dataset.word)">🔊</button>
        <div class="di-hint">Tap to hear · tap again to replay · then type</div>
      </div>
      <div style="font-size:11px;color:#bbb;margin-bottom:10px">💡 Hint: ${q.hint}</div>
      <input class="fill-input" id="t-in-${d}-${i}" placeholder="Type what you heard..." onkeydown="if(event.key==='Enter')tCheckDi(${d},${i})">
      <button class="fill-check" onclick="tCheckDi(${d},${i})">Check ✓</button>
      <div class="fill-fb" id="t-fb-${d}-${i}"></div>`;
  }
  body.innerHTML = html;
}

function tAnswerMC(d, i, chosen, correct) {
  document.querySelectorAll(`#t-opts-${d}-${i} .quiz-opt`).forEach((b,bi)=>{
    b.disabled=true;
    if(bi===correct) b.classList.add('correct'); else if(bi===chosen) b.classList.add('wrong');
  });
  const ok = chosen===correct; if(ok) testScore++;
  const fb = document.getElementById('t-fb-'+d+'-'+i); if(!fb) return;
  fb.innerHTML = `<div class="quiz-feedback-bar ${ok?'ok':'err'}">${ok?'✅ Correct!':'❌ See correct answer highlighted.'}<button class="btn-next" onclick="renderTest(${d},${i+1})">Next →</button></div>`;
}

function tCheckTr(d, i) {
  const inp = document.getElementById('t-in-'+d+'-'+i); if(!inp||inp.disabled) return;
  const q = testItems[i];
  const ok = inp.value.trim().toLowerCase() === q.ans.toLowerCase();
  if(ok) testScore++;
  inp.disabled = true;
  const fb = document.getElementById('t-fb-'+d+'-'+i);
  if(fb){fb.className='fill-fb '+(ok?'ok':'err'); fb.textContent = ok?'✅ Correct! "'+q.ans+'"':'❌ Answer: "'+q.ans+'"';}
  setTimeout(()=>renderTest(d,i+1), 1400);
}

function tCheckDi(d, i) {
  const inp = document.getElementById('t-in-'+d+'-'+i); if(!inp||inp.disabled) return;
  const q = testItems[i];
  const norm = s => s.toLowerCase().replace(/[!?,.\-]/g,'').trim();
  const ok = norm(inp.value) === norm(q.word);
  if(ok) testScore++;
  inp.disabled = true;
  const fb = document.getElementById('t-fb-'+d+'-'+i);
  if(fb){fb.className='fill-fb '+(ok?'ok':'err'); fb.textContent = ok?'✅ Correct! "'+q.word+'"':'❌ The answer was: "'+q.word+'"';}
  setTimeout(()=>renderTest(d,i+1), 1400);
}

// ════════════════════════════════════════════════════════════════════
// WEEKLY MILESTONE TEST (unlocks when all 7 days of a week are done)
// ════════════════════════════════════════════════════════════════════
let weeklyItems = [], weeklyScore = 0, weeklyIdx = 0, weeklyNum = 0;

function weeklyTestPanel(d) {
  const wkIdx = WEEKS.findIndex(w => w.days.includes(d));
  const wk = WEEKS[wkIdx];
  if (!wk) return '<div class="panel" id="wtp"></div>';
  const allDone = wk.days.every(x => S.done.includes(x));
  const left = wk.days.filter(x => !S.done.includes(x)).length;
  if (!allDone) {
    return `<div class="panel" id="wtp">
      <div class="wk-locked">
        <div class="wkl-icon">🔒</div>
        <div class="wkl-title">Week ${wk.n} Mastery Test</div>
        <div class="wkl-sub">Complete all 7 days of ${wk.label.replace('Week '+wk.n+' — ','Week '+wk.n+': ')} to unlock.<br>This comprehensive test mixes ALL question types from the entire week — the ultimate retention check!</div>
        <div class="wkl-bar">📅 ${left} day${left!==1?'s':''} remaining to unlock this week's mastery test</div>
      </div>
    </div>`;
  }
  return `<div class="panel" id="wtp">
    <div class="wk-avail">
      <div class="wka-icon">🏆</div>
      <div class="wka-title">Week ${wk.n} Mastery Test</div>
      <div class="wka-sub">20 questions · All 4 types · All vocab from ${wk.label} · Shuffled</div>
      <button class="wka-btn" onclick="startWeeklyTest(${wk.n})">Start Mastery Test →</button>
    </div>
    <div id="wt-body-${wk.n}"></div>
  </div>`;
}

function startWeeklyTest(wkN) {
  weeklyNum = wkN; weeklyIdx = 0; weeklyScore = 0;
  const wk = WEEKS.find(w => w.n === wkN); if(!wk) return;
  let pool = [];
  wk.days.forEach(d => { if(TESTS[d]) pool.push(...TESTS[d].map(t=>({...t,_d:d}))); });
  // Shuffle and cap at 20
  pool = pool.sort(()=>Math.random()-.5).slice(0, Math.min(20, pool.length));
  weeklyItems = pool;
  renderWeeklyTest(wkN, 0);
}

function renderWeeklyTest(wkN, i) {
  const body = document.getElementById('wt-body-'+wkN); if(!body) return;
  if (i >= weeklyItems.length) {
    const pct = Math.round(weeklyScore/weeklyItems.length*100);
    body.innerHTML = `<div class="score-card">
      <div class="score-emoji">${pct>=80?'🎉':pct>=60?'👍':'📚'}</div>
      <div class="score-num">${weeklyScore}/${weeklyItems.length}</div>
      <div class="score-label">Week ${wkN} Mastery: ${pct}%<br>${pct>=80?'🏆 Week '+wkN+' mastered! Excellent retention!':pct>=60?'Good foundation — review and retry for full mastery.':'More review needed — revisit the week before retesting.'}</div>
      <button class="score-retry" onclick="startWeeklyTest(${wkN})">↺ Retry Weekly Test</button>
    </div>`;
    return;
  }
  const q = weeklyItems[i], prog = Math.round(i/weeklyItems.length*100);
  const letters = ['A','B','C','D'];
  let html = `<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${prog}%"></div></div>`;

  if (q.type === 'mc') {
    html += `<div class="quiz-q-card">
        <div class="quiz-q-label" style="color:var(--coral)">Week ${wkN} Test · Q${i+1}/${weeklyItems.length}</div>
        <div class="quiz-q-text">${q.q}</div>
      </div>
      <div class="quiz-options" id="wt-opts-${i}">
        ${q.opts.map((o,oi)=>`<button class="quiz-opt" data-letter="${letters[oi]}" onclick="wtAnswerMC(${wkN},${i},${oi},${q.a})">${o}</button>`).join('')}
      </div><div id="wt-fb-${i}"></div>`;
  } else if (q.type === 'tr') {
    html += `<div class="quiz-q-card">
        <div class="quiz-q-label" style="color:var(--ocean)">Week ${wkN} Test · Q${i+1}/${weeklyItems.length} — Translate</div>
        <div class="tr-q-box">${q.q}</div>
      </div>
      <input class="fill-input" id="wt-in-${i}" placeholder="Type in Indonesian..." onkeydown="if(event.key==='Enter')wtCheckTr(${wkN},${i})">
      <div style="font-size:11px;color:#bbb;margin-bottom:10px">💡 ${q.hint}</div>
      <button class="fill-check" onclick="wtCheckTr(${wkN},${i})">Check ✓</button>
      <div class="fill-fb" id="wt-fb-${i}"></div>`;
  } else if (q.type === 'li') {
    html += `<div class="quiz-q-card">
        <div class="quiz-q-label" style="color:var(--plum)">Week ${wkN} Test · Q${i+1}/${weeklyItems.length} — Listening</div>
        <div class="quiz-q-text">${q.q}</div>
      </div>
      <div style="text-align:center;margin-bottom:14px">
        <button class="listen-play-big" data-word="${q.word}" onclick="say(this.dataset.word)">🔊</button>
        <div class="di-hint">Tap to hear the word</div>
      </div>
      <div class="quiz-options" id="wt-opts-${i}">
        ${q.opts.map((o,oi)=>`<button class="quiz-opt" data-letter="${letters[oi]}" onclick="wtAnswerMC(${wkN},${i},${oi},${q.a})">${o}</button>`).join('')}
      </div><div id="wt-fb-${i}"></div>`;
  } else if (q.type === 'di') {
    html += `<div class="quiz-q-card">
        <div class="quiz-q-label" style="color:var(--jade)">Week ${wkN} Test · Q${i+1}/${weeklyItems.length} — Dictation</div>
        <div class="quiz-q-text">${q.q}</div>
      </div>
      <div style="text-align:center;margin-bottom:10px">
        <button class="listen-play-big" data-word="${q.word}" onclick="say(this.dataset.word)">🔊</button>
        <div class="di-hint">Tap to hear · type what you heard</div>
      </div>
      <div style="font-size:11px;color:#bbb;margin-bottom:10px">💡 ${q.hint}</div>
      <input class="fill-input" id="wt-in-${i}" placeholder="Type what you heard..." onkeydown="if(event.key==='Enter')wtCheckDi(${wkN},${i})">
      <button class="fill-check" onclick="wtCheckDi(${wkN},${i})">Check ✓</button>
      <div class="fill-fb" id="wt-fb-${i}"></div>`;
  }
  body.innerHTML = html;
}

function wtAnswerMC(wkN, i, chosen, correct) {
  document.querySelectorAll(`#wt-opts-${i} .quiz-opt`).forEach((b,bi)=>{
    b.disabled=true;
    if(bi===correct) b.classList.add('correct'); else if(bi===chosen) b.classList.add('wrong');
  });
  const ok=chosen===correct; if(ok) weeklyScore++;
  const fb=document.getElementById('wt-fb-'+i); if(!fb) return;
  fb.innerHTML=`<div class="quiz-feedback-bar ${ok?'ok':'err'}">${ok?'✅ Correct!':'❌ See correct answer.'}<button class="btn-next" onclick="renderWeeklyTest(${wkN},${i+1})">Next →</button></div>`;
}

function wtCheckTr(wkN, i) {
  const inp=document.getElementById('wt-in-'+i); if(!inp||inp.disabled) return;
  const q=weeklyItems[i];
  const ok=inp.value.trim().toLowerCase()===q.ans.toLowerCase();
  if(ok) weeklyScore++;
  inp.disabled=true;
  const fb=document.getElementById('wt-fb-'+i);
  if(fb){fb.className='fill-fb '+(ok?'ok':'err'); fb.textContent=ok?'✅ "'+q.ans+'"':'❌ Answer: "'+q.ans+'"';}
  setTimeout(()=>renderWeeklyTest(wkN,i+1),1400);
}

function wtCheckDi(wkN, i) {
  const inp=document.getElementById('wt-in-'+i); if(!inp||inp.disabled) return;
  const q=weeklyItems[i];
  const norm=s=>s.toLowerCase().replace(/[!?,.\-]/g,'').trim();
  const ok=norm(inp.value)===norm(q.word);
  if(ok) weeklyScore++;
  inp.disabled=true;
  const fb=document.getElementById('wt-fb-'+i);
  if(fb){fb.className='fill-fb '+(ok?'ok':'err'); fb.textContent=ok?'✅ "'+q.word+'"':'❌ "'+q.word+'"';}
  setTimeout(()=>renderWeeklyTest(wkN,i+1),1400);
}

// ════════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════════
load();
if(window.speechSynthesis) speechSynthesis.getVoices();
buildSidebar();
goDay(S.done.length>0?Math.min(30,S.done.length+1):1);
