(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- data ---------- */
const GRADS = [
  'linear-gradient(135deg,#FF5A1F,#FF3D81,#6A2CFF)',
  'linear-gradient(135deg,#FFD23F,#FF5A1F,#B5179E)',
  'linear-gradient(135deg,#00C2A8,#3A86FF,#6A2CFF)',
  'linear-gradient(135deg,#FF3D81,#FFD23F,#FF5A1F)',
  'linear-gradient(135deg,#3A86FF,#8338EC,#FF006E)',
  'linear-gradient(135deg,#06D6A0,#FFD23F,#EF476F)'
];
const AUTHORS = {
  petra:{name:'petra.cooks',emoji:'👩‍🍳',followers:'128 tis.'},
  jirka:{name:'jirka_gaming',emoji:'🎮',followers:'84 tis.'},
  tereza:{name:'tereza.trips',emoji:'🧳',followers:'51 tis.'},
  martin:{name:'martin_fit',emoji:'💪',followers:'203 tis.'},
  lucie:{name:'lucie.diy',emoji:'🔨',followers:'36 tis.'},
  tomas:{name:'tomas.science',emoji:'🔬',followers:'97 tis.'}
};
const VIDEOS = [
  {id:'v1',a:'petra',cat:'Jídlo',emo:'🍳',t:'Svíčková za 20 minut? Zkusila jsem to',dur:34,likes:12400,views:'412 tis.'},
  {id:'v2',a:'jirka',cat:'Hry',emo:'🕹️',t:'Nejhorší prohra v historii mého streamu',dur:47,likes:8900,views:'260 tis.'},
  {id:'v3',a:'tereza',cat:'Cestování',emo:'🏔️',t:'Tajný výhled v Tatrách, o kterém nikdo neví',dur:28,likes:15300,views:'530 tis.'},
  {id:'v4',a:'martin',cat:'Sport',emo:'🏋️',t:'5 cviků, které stačí doma na gauči',dur:41,likes:21000,views:'880 tis.'},
  {id:'v5',a:'lucie',cat:'Dělej si sám',emo:'🪚',t:'Police z jedné palety, hotovo za večer',dur:52,likes:6700,views:'190 tis.'},
  {id:'v6',a:'tomas',cat:'Věda',emo:'🧪',t:'Co se stane, když zamrazíš kolu?',dur:23,likes:30500,views:'1,2 mil.'},
  {id:'v7',a:'petra',cat:'Jídlo',emo:'🥞',t:'Palačinky, které se nepřilepí. Nikdy.',dur:19,likes:9800,views:'305 tis.'},
  {id:'v8',a:'jirka',cat:'Hry',emo:'👾',t:'Tenhle trik v minecraftu mě dostal',dur:38,likes:11200,views:'340 tis.'},
  {id:'v9',a:'tereza',cat:'Cestování',emo:'🌅',t:'Východ slunce nad Prahou z komína',dur:31,likes:18800,views:'610 tis.'},
  {id:'v10',a:'martin',cat:'Sport',emo:'🏃',t:'Běhat ráno, nebo večer? Konečně odpověď',dur:44,likes:7400,views:'220 tis.'}
].map((v, i) => ({...v, g: GRADS[i % GRADS.length], seedComments: seed(i)}));

function seed(i){
  const pool = [
    ['karel88','To je fakt dobrý 😂'],['anička','Hned to zkouším!'],['pavel_k','Sleduju od začátku, jen tak dál'],
    ['m.novak','Tohle jsem potřeboval vidět'],['sabina','Kaboom! 💥'],['dan','Kolikrát jste to točili?'],['ema','Sdílím kamarádce']
  ];
  return [pool[i % 7], pool[(i + 3) % 7]].map(([u, x]) => ({u, x}));
}

/* ---------- state ---------- */
const KEY = 'kaboom.v1';
const store = Object.assign({likes:{}, follows:{}, comments:{}, name:'ty'}, safeParse());
function safeParse(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
function save(){ try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} }
const uploads = []; // videos from the device (kept in memory only)
const all = () => [...uploads, ...VIDEOS];
let tab = 'home', cat = 'Vše', query = '', followingOnly = false, sheetId = null;

/* ---------- helpers ---------- */
const fmt = n => n >= 1e6 ? (n/1e6).toFixed(1).replace('.',',')+' mil.' : n >= 1000 ? (n/1000).toFixed(1).replace('.',',')+' tis.' : String(n);
const mmss = s => Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const author = v => v.mine ? {name:store.name, emoji:'🙂', followers:'0'} : AUTHORS[v.a];
const likeCount = v => v.likes + (store.likes[v.id] ? 1 : 0);
const commentsOf = v => [...(v.seedComments || []), ...(store.comments[v.id] || [])];
function toast(t){ const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1800); }
function visible(){
  return all().filter(v => {
    if (cat !== 'Vše' && v.cat !== cat) return false;
    if (followingOnly && !store.follows[v.a]) return false;
    if (query){ const q = query.toLowerCase(); if (!(v.t.toLowerCase().includes(q) || author(v).name.toLowerCase().includes(q))) return false; }
    return true;
  });
}

/* ---------- home ---------- */
function renderChips(){
  const cats = ['Vše', ...new Set(VIDEOS.map(v => v.cat))];
  $('#chips').innerHTML = cats.map(c => `<button class="chip ${c===cat?'on':''}" data-c="${c}">${c}</button>`).join('');
}
function thumb(v){
  if (v.src) return `<div class="thumb" style="background:#000"><video src="${v.src}#t=0.5" muted preload="metadata" playsinline style="width:100%;height:100%;object-fit:cover"></video><span class="dur">▶</span></div>`;
  return `<div class="thumb" style="background:${v.g}"><span class="emo">${v.emo}</span><span class="dur">${mmss(v.dur)}</span></div>`;
}
function renderGrid(){
  const list = visible();
  const g = $('#grid');
  if (!list.length){
    g.innerHTML = followingOnly
      ? `<div class="empty"><b>Zatím nikoho nesleduješ</b>V záložce Kaboom klepni na Sledovat u tvůrce, kterého chceš vidět tady.</div>`
      : `<div class="empty"><b>Nic jsme nenašli</b>Zkus jiné slovo nebo jinou kategorii.</div>`;
    return;
  }
  g.innerHTML = list.map(v => {
    const a = author(v);
    return `<button class="card" data-id="${v.id}">${thumb(v)}
      <div class="meta"><div class="avatar">${a.emoji}</div><div><h3>${esc(v.t)}</h3>
      <p>${esc(a.name)} · ${v.views || '0'} zhlédnutí · ${fmt(likeCount(v))} 💥</p></div></div></button>`;
  }).join('');
}

/* ---------- reels ---------- */
let io;
function renderReels(startId){
  const box = $('#view-reels');
  const list = visible();
  if (!list.length){ box.innerHTML = `<div class="empty" style="padding-top:30vh"><b>Tady zatím nic není</b>Změň filtr nebo nahraj vlastní video.</div>`; return; }
  box.innerHTML = list.map(v => {
    const a = author(v), liked = store.likes[v.id], fol = store.follows[v.a];
    const media = v.src
      ? `<video src="${v.src}" loop playsinline muted preload="auto"></video>`
      : `<div class="bg" style="background-image:${v.g}"></div><div class="big">${v.emo}</div>`;
    return `<article class="reel" data-id="${v.id}">${media}<div class="shade"></div>
      <div class="info"><div class="who"><span class="avatar">${a.emoji}</span>${esc(a.name)}
        ${v.mine ? '' : `<button class="follow ${fol?'on':''}" data-follow="${v.a}">${fol?'Sleduješ':'Sledovat'}</button>`}</div>
        <p>${esc(v.t)}</p></div>
      <div class="side">
        <button class="act ${liked?'liked':''}" data-like="${v.id}"><span class="ico">💥</span><span class="n">${fmt(likeCount(v))}</span></button>
        <button class="act" data-comment="${v.id}"><span class="ico">💬</span><span>${commentsOf(v).length}</span></button>
        <button class="act" data-share="${v.id}"><span class="ico">↗️</span><span>Sdílet</span></button>
      </div>
      <div class="progress ${v.src?'':'fake'}" style="--dur:${v.dur||15}s"></div></article>`;
  }).join('');
  if (io) io.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => {
    const r = e.target, vid = $('video', r);
    if (e.isIntersecting && e.intersectionRatio > .6){
      r.classList.add('live');
      if (vid){ vid.play().catch(()=>{}); }
    } else {
      r.classList.remove('live');
      if (vid) vid.pause();
    }
  }), {root: box, threshold: [0, .6]});
  $$('.reel', box).forEach(r => io.observe(r));
  if (startId){
    const t = $(`.reel[data-id="${startId}"]`, box);
    if (t) requestAnimationFrame(() => box.scrollTop = t.offsetTop);
  }
}
function refreshReel(id){
  const v = all().find(x => x.id === id), r = $(`.reel[data-id="${id}"]`);
  if (!v || !r) return;
  const b = $('[data-like]', r);
  b.classList.toggle('liked', !!store.likes[id]);
  $('.n', b).textContent = fmt(likeCount(v));
  $('[data-comment] span:last-child', r).textContent = commentsOf(v).length;
}
function doLike(id, force){
  if (force && store.likes[id]) return;
  if (store.likes[id]) delete store.likes[id]; else store.likes[id] = 1;
  save(); refreshReel(id);
}

/* ---------- comments ---------- */
function openSheet(id){
  sheetId = id;
  const v = all().find(x => x.id === id);
  $('#sheetTitle').textContent = 'Komentáře (' + commentsOf(v).length + ')';
  $('#comments').innerHTML = commentsOf(v).map(c =>
    `<div class="cm"><span class="avatar">🙂</span><div><b>${esc(c.u)}</b><p>${esc(c.x)}</p></div></div>`).join('')
    || `<div class="empty"><b>Zatím žádné komentáře</b>Napiš první.</div>`;
  $('#sheet').hidden = false;
}
function sendComment(){
  const inp = $('#cInput'), x = inp.value.trim();
  if (!x || !sheetId) return;
  (store.comments[sheetId] = store.comments[sheetId] || []).push({u:store.name, x});
  inp.value = ''; save(); openSheet(sheetId); refreshReel(sheetId);
  const c = $('#comments'); c.scrollTop = c.scrollHeight;
}

/* ---------- upload ---------- */
let pending = null;
$('#file').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  if (pending) URL.revokeObjectURL(pending.src);
  pending = {src: URL.createObjectURL(f)};
  const p = $('#preview'); p.src = pending.src; p.hidden = false;
  $('#dropText').textContent = f.name;
  if (!$('#title').value) $('#title').value = f.name.replace(/\.[^.]+$/, '');
});
$('#publish').addEventListener('click', () => {
  if (!pending) return toast('Nejdřív vyber video');
  const t = $('#title').value.trim();
  if (!t) return toast('Napiš název videa');
  const p = $('#preview');
  uploads.unshift({id:'u'+Date.now(), mine:true, a:'me', cat:'Moje', t, src:pending.src,
    dur:Math.round(p.duration) || 15, likes:0, views:'0', g:GRADS[0], emo:'💥'});
  pending = null; p.removeAttribute('src'); p.hidden = true; $('#file').value = '';
  $('#title').value = ''; $('#dropText').textContent = 'Vybrat video';
  toast('Publikováno'); go('reels');
});

/* ---------- profile ---------- */
function renderProfile(){
  const mine = uploads;
  const follows = Object.keys(store.follows).length;
  const likes = Object.keys(store.likes).length;
  $('#profile').innerHTML = `
    <div class="prof-head"><div class="avatar">🙂</div><div><h2>${esc(store.name)}</h2><p class="muted">@${esc(store.name)}</p></div></div>
    <div class="stats"><div><b>${mine.length}</b>videí</div><div><b>${follows}</b>sleduji</div><div><b>${likes}</b>označeno 💥</div></div>
    <button class="btn ghost" id="rename">Změnit jméno</button>
    ${mine.length ? `<div class="mini-grid">${mine.map(v => `<button class="mini" data-id="${v.id}" style="background:#000"><video src="${v.src}#t=0.5" muted preload="metadata" playsinline></video></button>`).join('')}</div>`
      : `<div class="empty"><b>Zatím jsi nic nenahrál</b>Klepni na ＋ dole a vyber video z telefonu.</div>`}`;
}

/* ---------- navigation ---------- */
function go(t){
  const prev = tab;
  followingOnly = t === 'following';
  tab = t;
  const view = t === 'following' ? 'home' : t;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  $('#top').style.display = view === 'reels' ? 'none' : '';
  if (view !== 'reels') $$('#view-reels video').forEach(v => v.pause());
  if (view === 'home'){ renderChips(); renderGrid(); }
  if (view === 'reels') renderReels(go.start);
  if (view === 'profile') renderProfile();
  go.start = null;
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(b.dataset.tab); });
$('#logo').addEventListener('click', () => { cat = 'Vše'; query = ''; $('#q').value = ''; go('home'); });
$('#btnSearch').addEventListener('click', () => {
  const s = $('#searchbar'); s.hidden = !s.hidden; if (!s.hidden) $('#q').focus();
});
$('#q').addEventListener('input', e => { query = e.target.value.trim(); if (tab === 'home' || tab === 'following') renderGrid(); });
$('#chips').addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c) return; cat = c.dataset.c; renderChips(); renderGrid(); });

document.addEventListener('click', e => {
  const t = e.target;
  const card = t.closest('.card, .mini');
  if (card){ go.start = card.dataset.id; cat = 'Vše'; query = ''; followingOnly = false; go('reels'); return; }
  const like = t.closest('[data-like]'); if (like) return doLike(like.dataset.like);
  const cm = t.closest('[data-comment]'); if (cm) return openSheet(cm.dataset.comment);
  const sh = t.closest('[data-share]'); if (sh){
    const v = all().find(x => x.id === sh.dataset.share);
    if (navigator.share) navigator.share({title:'Kaboom', text:v.t}).catch(()=>{});
    else toast('Sdílení tu zatím není k dispozici');
    return;
  }
  const f = t.closest('[data-follow]'); if (f){
    const k = f.dataset.follow;
    if (store.follows[k]) delete store.follows[k]; else store.follows[k] = 1;
    save();
    $$(`[data-follow="${k}"]`).forEach(b => { const on = !!store.follows[k]; b.classList.toggle('on', on); b.textContent = on ? 'Sleduješ' : 'Sledovat'; });
    toast(store.follows[k] ? 'Sleduješ ' + AUTHORS[k].name : 'Sledování zrušeno');
    return;
  }
  if (t.id === 'rename'){
    const n = prompt('Tvoje jméno', store.name);
    if (n && n.trim()){ store.name = n.trim().slice(0, 20).replace(/\s+/g, '_'); save(); renderProfile(); }
  }
});
// double tap = like
let lastTap = 0;
$('#view-reels').addEventListener('click', e => {
  if (e.target.closest('button')) return;
  const r = e.target.closest('.reel'); if (!r) return;
  const now = Date.now();
  if (now - lastTap < 300){
    doLike(r.dataset.id, true);
    const b = document.createElement('div'); b.className = 'burst'; b.textContent = '💥';
    b.style.left = (e.clientX - 48) + 'px'; b.style.top = (e.clientY - 120) + 'px';
    r.appendChild(b); setTimeout(() => b.remove(), 800);
  } else {
    const vid = $('video', r);
    if (vid){ vid.muted = false; vid.paused ? vid.play() : vid.pause(); }
  }
  lastTap = now;
});
$('#sheetClose').addEventListener('click', () => $('#sheet').hidden = true);
$('#sheetBg').addEventListener('click', () => $('#sheet').hidden = true);
$('#cSend').addEventListener('click', sendComment);
$('#cInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendComment(); });

go('home');
})();
