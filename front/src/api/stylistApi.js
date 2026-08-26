import { BASE_URL } from './config';

async function handle(res, fallbackMessage) {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || fallbackMessage);
  }
  return res.json();
}

export async function fetchStyleProfile(token) {
  const res = await fetch(`${BASE_URL}/api/stylist/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  return handle(res, '스타일 프로필 조회에 실패했습니다');
}

export async function requestStyleRecommendation(token, { gender, heightCm, weightKg, preferredLooks }) {
  const res = await fetch(`${BASE_URL}/api/stylist/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ gender, heightCm, weightKg, preferredLooks }),
  });
  return handle(res, '추천을 받아오지 못했어요');
}
