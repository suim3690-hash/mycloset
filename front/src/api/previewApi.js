import { BASE_URL } from './config';

export async function simulatePreview(photoFile) {
  const formData = new FormData();
  formData.append('photo', photoFile);

  const res = await fetch(`${BASE_URL}/api/preview`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || '미리보기 생성에 실패했습니다');
  }
  return res.json();
}
