import './styles/main.css';
import QRCode from 'qrcode';
import { getRoomFromUrl } from './systems/room-url.js';
import { firebaseReady, ensureAnonymousUser } from './firebase/client.js';
import { createRoom, joinRoom, listenRoom, startRoom, updatePlayerProgress } from './multiplayer/rooms.js';

const app = document.querySelector('#app');
let currentCode = getRoomFromUrl();
let unsubscribe = null;
let currentUser = null;
let raceQuestion = null;
let localProgress = 0;
const RACE_LENGTH = 15;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(message) { const el = document.createElement('div'); el.className = 'notice'; el.textContent = message; document.body.append(el); setTimeout(() => el.remove(), 4500); }
function shell(content) { app.innerHTML = `<header><b>MATH RACING</b><span>ARCADE MATEMÁTICO</span></header>${content}<footer><span>01 — MULTIPLAYER</span><span>02 — DESAFIOS</span><span>03 — COMPETIÇÃO</span></footer>`; }
function configWarning() { return firebaseReady ? '' : '<div class="config-warning"><b>Firebase ainda não configurado</b><br>Adicione as variáveis VITE_FIREBASE_* no ambiente de publicação para ativar as salas online.</div>'; }
function home() {
  shell(`<main><section><small>PENSE RÁPIDO. ACELERE MAIS.</small><h1>A corrida começa <em>na sua mente.</em></h1><p>Resolva desafios matemáticos, conquiste velocidade e dispute a liderança em uma corrida multiplayer.</p>${configWarning()}<label>SEU APELIDO<input id="nickname" maxlength="16" placeholder="Ex.: Dark" autocomplete="nickname"></label><div class="actions"><button id="create" ${firebaseReady?'':'disabled'}>CRIAR PARTIDA</button><button class="secondary" id="join" ${firebaseReady?'':'disabled'}>ENTRAR COM CÓDIGO</button></div></section><aside><div class="track"><div class="car blue"></div><div class="car purple"></div><strong>NEON CIRCUIT</strong></div></aside></main>`);
  if (currentCode) toast('Você recebeu o convite da sala ' + currentCode + '. Digite seu apelido e clique em Entrar com código.');
  document.querySelector('#create').onclick = async () => { try { const name = document.querySelector('#nickname').value; await ensureAnonymousUser(); currentCode = await createRoom(name); history.replaceState({}, '', `?room=${currentCode}`); openLobby(currentCode); } catch (e) { toast(e.message); } };
  document.querySelector('#join').onclick = async () => { const code = currentCode || prompt('Digite o código de 6 caracteres da sala:'); if (!code) return; try { const name = document.querySelector('#nickname').value; await joinRoom(code, name); currentCode = code.trim().toUpperCase(); history.replaceState({}, '', `?room=${currentCode}`); openLobby(currentCode); } catch (e) { toast(e.message); } };
}
async function openLobby(code) {
  if (unsubscribe) unsubscribe();
  try { currentUser = await ensureAnonymousUser(); } catch (e) { toast(e.message); home(); return; }
  shell('<main class="lobby"><section><small>SALA DE ESPERA</small><h1>Preparando <em>a corrida.</em></h1><div id="room-content" class="room-panel">Conectando à sala...</div></section><aside class="lobby-side"><div class="track"><div class="car blue"></div><div class="car purple"></div><strong>NEON CIRCUIT</strong></div></aside></main>');
  unsubscribe = listenRoom(code, async (room) => {
    const target = document.querySelector('#room-content'); if (!target) return;
    if (!room) { target.innerHTML = '<p>Sala encerrada ou não encontrada.</p><button id="back">VOLTAR</button>'; document.querySelector('#back').onclick = home; return; }
    if (room.status === 'racing' || room.status === 'finished') { renderRace(room, code); return; }
    const players = Object.values(room.players || {}); const isHost = room.hostUid === currentUser.uid;
    let qr = ''; try { qr = await QRCode.toDataURL(`${location.origin}${location.pathname}?room=${code}`, { width: 190, margin: 1, color: { dark: '#090b12', light: '#ffffff' } }); } catch {}
    target.innerHTML = `<div class="room-code">CÓDIGO DA SALA <strong>${code}</strong></div><div class="room-grid"><div><h3>JOGADORES (${players.length}/${room.maxPlayers || 12})</h3><ul class="player-list">${players.map(p=>`<li><span class="car-dot ${escapeHtml(p.car)}"></span><b>${escapeHtml(p.nickname)}</b>${p.isHost?'<small>ANFITRIÃO</small>':''}</li>`).join('')}</ul></div><div class="qr-box">${qr?`<img src="${qr}" alt="QR Code para entrar na sala">`:'QR Code indisponível'}<small>ESCANEIE PARA ENTRAR</small></div></div><p class="muted">Compartilhe o código ou QR Code com a turma.</p>${isHost?'<button id="start">INICIAR CORRIDA</button>':'<p class="waiting">Aguardando o anfitrião iniciar...</p>'}`;
    if (isHost) document.querySelector('#start').onclick = async () => { try { await startRoom(code); } catch (e) { toast(e.message); } };
  }, (error) => toast('Erro na conexão: ' + error.message));
}
function makeQuestion() {
  const a = Math.floor(Math.random()*12)+2, b = Math.floor(Math.random()*12)+2;
  const type = Math.floor(Math.random()*3);
  if (type === 0) return { text: `${a} + ${b}`, answer: a+b };
  if (type === 1) return { text: `${a+b} − ${b}`, answer: a };
  return { text: `${a} × ${b}`, answer: a*b };
}
function renderRace(room, code) {
  const target = document.querySelector('#room-content'); if (!target) return;
  if (target.dataset.mode !== 'race') {
    target.dataset.mode = 'race';
    localProgress = Number(room.players?.[currentUser.uid]?.progress || 0);
    raceQuestion = makeQuestion();
    target.innerHTML = `<div class="race-top"><div><small>NEON CIRCUIT</small><h2>CORRIDA EM ANDAMENTO</h2></div><div class="race-counter"><b id="race-count">${localProgress}</b><span>/ ${RACE_LENGTH} AVANÇOS</span></div></div><div class="race-arena"><div class="arena-heading"><span>🏁 CIRCUITO NEON // GP MATEMÁTICA</span><b>15 ETAPAS • 1 CAMPEÃO</b></div><div class="race-track"><div class="track-glow"></div><div class="start-line"><span>LARGADA</span></div><div class="finish-line"><span>CHEGADA</span></div><div id="race-cars"></div></div><div class="arena-footer"><span>⚡ RESOLVA • ACELERE • VENÇA</span><span>AO VIVO <i></i></span></div></div><div class="challenge"><small>DESAFIO MATEMÁTICO</small><div id="question" class="question"></div><form id="answer-form"><input id="answer" type="number" inputmode="numeric" autocomplete="off" placeholder="Sua resposta" required><button type="submit">ACELERAR</button></form><p id="feedback" class="feedback">Acerte para avançar seu carro!</p></div><div id="race-ranking" class="race-ranking"></div>`;
    document.querySelector('#answer-form').onsubmit = async (event) => {
      event.preventDefault();
      const field = document.querySelector('#answer'); const feedback = document.querySelector('#feedback');
      if (Number(field.value) !== raceQuestion.answer) { feedback.textContent = 'Não foi dessa vez! Tente novamente.'; feedback.className = 'feedback wrong'; field.select(); return; }
      localProgress = Math.min(RACE_LENGTH, localProgress + 1);
      try { await updatePlayerProgress(code, localProgress, localProgress >= RACE_LENGTH); feedback.textContent = localProgress >= RACE_LENGTH ? '🏁 Você cruzou a linha de chegada!' : '⚡ Resposta certa! Seu carro avançou.'; feedback.className = 'feedback correct'; }
      catch (e) { localProgress--; toast('Não foi possível salvar seu avanço: ' + e.message); }
      document.querySelector('#race-count').textContent = localProgress;
      raceQuestion = makeQuestion(); document.querySelector('#question').textContent = raceQuestion.text; field.value = ''; field.focus();
    };
  }
  document.querySelector('#question').textContent = raceQuestion.text;
  document.querySelector('#race-count').textContent = localProgress;
  const players = Object.values(room.players || {}).sort((a,b)=>(b.progress||0)-(a.progress||0));
  const cars = document.querySelector('#race-cars');
  if (cars) cars.innerHTML = players.map((p,i)=>`<div class="race-lane"><span class="lane-name">${escapeHtml(p.nickname)}</span><div class="lane-road"><div class="race-car ${escapeHtml(p.car||'blue')}" style="left:${Math.min(92,(Number(p.progress||0)/RACE_LENGTH)*92)}%"></div></div><b>${Number(p.progress||0)}/${RACE_LENGTH}</b></div>`).join('');
  const ranking = document.querySelector('#race-ranking');
  if (ranking) ranking.innerHTML = `<h3>CLASSIFICAÇÃO</h3>${players.map((p,i)=>`<div class="rank-row"><span>${i+1}º</span><b>${escapeHtml(p.nickname)}</b><span>${Number(p.progress||0)} pontos ${p.finished?'🏁':''}</span></div>`).join('')}`;
  if (players.length && players.every(p=>p.finished)) { const feedback=document.querySelector('#feedback'); if(feedback) feedback.textContent='🏆 Corrida encerrada! Todos chegaram.'; }
}
home();
