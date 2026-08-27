import { BASE_URL } from './config';

export async function fetchWardrobeItems(token) {
  const res = await fetch(`${BASE_URL}/api/wardrobe`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('옷장 정보를 불러오지 못했어요');
  return res.json();
}

export async function matchWardrobeItems(items) {
  const res = await fetch(`${BASE_URL}/api/wardrobe/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error('코디 매칭에 실패했어요');
  return res.json();
}
