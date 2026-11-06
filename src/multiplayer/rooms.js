import { ref, get, set, update, onValue, runTransaction, serverTimestamp } from 'firebase/database';
import { db, ensureAnonymousUser } from '../firebase/client.js';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function makeRoomCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}
function cleanName(name) {
  const value = String(name || '').trim().replace(/\\s+/g, ' ').slice(0, 16);
  if (value.length < 2) throw new Error('Use um apelido com pelo menos 2 caracteres.');
  return value;
}
export async function createRoom(name) {
  const user = await ensureAnonymousUser();
  const nickname = cleanName(name);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeRoomCode();
    const roomRef = ref(db, `rooms/${code}`);
    const result = await runTransaction(roomRef, (current) => current === null ? {
      code, hostUid: user.uid, status: 'lobby', createdAt: Date.now(), maxPlayers: 12,
      players: { [user.uid]: { uid: user.uid, nickname, car: 'blue', joinedAt: Date.now(), isHost: true } }
    } : undefined, { applyLocally: false });
    if (result.committed) return code;
  }
  throw new Error('Não foi possível gerar uma sala. Tente novamente.');
}
export async function joinRoom(codeInput, name, car = 'blue') {
  const user = await ensureAnonymousUser();
  const code = String(codeInput || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error('O código deve ter 6 caracteres.');
  const roomRef = ref(db, `rooms/${code}`);
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) throw new Error('Sala não encontrada. Confira o código.');
  const room = snapshot.val();
  if (room.status !== 'lobby') throw new Error('Essa corrida já começou.');
  const players = Object.keys(room.players || {});
  if (!room.players?.[user.uid] && players.length >= (room.maxPlayers || 12)) throw new Error('A sala está cheia.');
  await set(ref(db, `rooms/${code}/players/${user.uid}`), {
    uid: user.uid, nickname: cleanName(name), car, joinedAt: Date.now(), isHost: user.uid === room.hostUid
  });
  return code;
}
export function listenRoom(code, callback, onError) {
  return onValue(ref(db, `rooms/${code}`), (snapshot) => callback(snapshot.exists() ? snapshot.val() : null), onError);
}
export async function startRoom(code) {
  const user = await ensureAnonymousUser();
  const roomRef = ref(db, `rooms/${code}`);
  const snapshot = await get(roomRef);
  if (!snapshot.exists() || snapshot.val().hostUid !== user.uid) throw new Error('Somente o anfitrião pode iniciar.');
  await update(roomRef, { status: 'countdown', startedAt: Date.now() });
}
export async function leaveRoom(code) {
  const user = await ensureAnonymousUser();
  await set(ref(db, `rooms/${code}/players/${user.uid}`), null);
}
