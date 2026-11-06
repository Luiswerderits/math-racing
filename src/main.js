import './styles/main.css';
import QRCode from 'qrcode';
import { getRoomFromUrl } from './systems/room-url.js';
import { firebaseReady, ensureAnonymousUser } from './firebase/client.js';
import { createRoom, joinRoom, listenRoom, startRoom } from './multiplayer/rooms.js';

const app = document.querySelector('#app');
let currentCode = getRoomFromUrl();
let unsubscribe = null;
let currentUser = null;
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
    const players = Object.values(room.players || {}); const isHost = room.hostUid === currentUser.uid;
    if (room.status !== 'lobby') { target.innerHTML = '<div class="room-code">CORRIDA INICIANDO</div><p>A sala está pronta. A pista de corrida será conectada na próxima etapa.</p>'; return; }
    let qr = ''; try { qr = await QRCode.toDataURL(`${location.origin}${location.pathname}?room=${code}`, { width: 190, margin: 1, color: { dark: '#090b12', light: '#ffffff' } }); } catch {}
    target.innerHTML = `<div class="room-code">CÓDIGO DA SALA <strong>${code}</strong></div><div class="room-grid"><div><h3>JOGADORES (${players.length}/${room.maxPlayers || 12})</h3><ul class="player-list">${players.map(p=>`<li><span class="car-dot ${escapeHtml(p.car)}"></span><b>${escapeHtml(p.nickname)}</b>${p.isHost?'<small>ANFITRIÃO</small>':''}</li>`).join('')}</ul></div><div class="qr-box">${qr?`<img src="${qr}" alt="QR Code para entrar na sala">`:'QR Code indisponível'}<small>ESCANEIE PARA ENTRAR</small></div></div><p class="muted">Compartilhe o código ou QR Code com a turma.</p>${isHost?'<button id="start">INICIAR CORRIDA</button>':'<p class="waiting">Aguardando o anfitrião iniciar...</p>'}`;
    if (isHost) document.querySelector('#start').onclick = async () => { try { await startRoom(code); } catch (e) { toast(e.message); } };
  }, (error) => toast('Erro na conexão: ' + error.message));
}
home();
