import { BASE_URL } from './config';

export async function fetchMagazine(categories) {
  const query = categories && categories.length > 0 ? `?categories=${categories.join(',')}` : '';
  const res = await fetch(`${BASE_URL}/api/magazine${query}`);
  if (!res.ok) throw new Error('매거진을 불러오지 못했습니다');
  return res.json();
}
