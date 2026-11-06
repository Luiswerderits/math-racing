import './styles/main.css';
import {getRoomFromUrl} from './systems/room-url.js';
const app=document.querySelector('#app');
const room=getRoomFromUrl();
function render(){app.innerHTML=`<header><b>MATH RACING</b><span>ARCADE MATEMÁTICO</span></header><main><section><small>PENSE RÁPIDO. ACELERE MAIS.</small><h1>A corrida começa <em>na sua mente.</em></h1><p>Resolva desafios matemáticos, conquiste velocidade e dispute a liderança em uma corrida multiplayer.</p><div class="actions"><button id="create">CRIAR PARTIDA</button><button class="secondary" id="join">ENTRAR COM CÓDIGO</button></div></section><aside><div class="track"><div class="car blue"></div><div class="car purple"></div><strong>NEON CIRCUIT</strong></div></aside></main><footer><span>01 — MULTIPLAYER</span><span>02 — DESAFIOS</span><span>03 — COMPETIÇÃO</span></footer>`;
document.querySelector('#create').onclick=()=>notice('A criação de salas será ativada na próxima etapa, com Firebase.');
document.querySelector('#join').onclick=()=>{const code=prompt('Digite o código da sala:');if(code)location.href='?room='+encodeURIComponent(code.trim().toUpperCase())};
if(room)notice('Código '+room+' identificado. A entrada online será conectada na etapa Multiplayer.');}
function notice(t){const n=document.createElement('p');n.className='notice';n.textContent=t;document.body.append(n);setTimeout(()=>n.remove(),4500)}
render();