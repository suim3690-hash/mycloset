import { BASE_URL } from './config';

export async function reverseGeocode(lat, lon) {
  const res = await fetch(`${BASE_URL}/api/geo/reverse?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error('위치 조회에 실패했습니다');
  const data = await res.json();
  return data.location ?? null;
}

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 정보를 지원하지 않아요'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => reject(new Error('위치 정보를 가져오지 못했어요')),
      { timeout: 10000 },
    );
  });
}
