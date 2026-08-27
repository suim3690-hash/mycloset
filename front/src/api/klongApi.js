import { BASE_URL } from './config';

export async function sendKlongMessage(history, message) {
  const res = await fetch(`${BASE_URL}/api/klong/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, message }),
  });
  if (!res.ok) throw new Error('클롱과의 대화에 실패했어요');
  return res.json();
}

export async function fetchKlongRecommendation(token) {
  const res = await fetch(`${BASE_URL}/api/klong/recommend`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('추천을 받아오지 못했어요');
  return res.json();
}
