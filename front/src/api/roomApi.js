import { BASE_URL } from './config';

async function handle(res, fallbackMessage) {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || fallbackMessage);
  }
  return res.json();
}

export async function fetchRoomCounts() {
  const res = await fetch(`${BASE_URL}/api/rooms`);
  if (!res.ok) throw new Error('방 목록 조회에 실패했습니다');
  return res.json();
}

export async function fetchRoom(lookCategory, token) {
  const res = await fetch(`${BASE_URL}/api/rooms/${encodeURIComponent(lookCategory)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle(res, '방 정보 조회에 실패했습니다');
}

export async function joinRoom(lookCategory, token) {
  const res = await fetch(`${BASE_URL}/api/rooms/${encodeURIComponent(lookCategory)}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle(res, '방 참가에 실패했습니다');
}

export async function leaveRoom(lookCategory, token) {
  const res = await fetch(`${BASE_URL}/api/rooms/${encodeURIComponent(lookCategory)}/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle(res, '방 나가기에 실패했습니다');
}

export async function fetchRoomMessages(lookCategory) {
  const res = await fetch(`${BASE_URL}/api/rooms/${encodeURIComponent(lookCategory)}/messages`);
  if (!res.ok) throw new Error('대화 내역 조회에 실패했습니다');
  return res.json();
}

export async function sendRoomMessage(lookCategory, token, content) {
  const res = await fetch(`${BASE_URL}/api/rooms/${encodeURIComponent(lookCategory)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
  return handle(res, '메시지 전송에 실패했습니다');
}
