import { BASE_URL } from './config';

export async function createTimeCapsule(recordDate, message, revealDate) {
  const res = await fetch(`${BASE_URL}/api/timecapsules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordDate, message, revealDate }),
  });
  if (!res.ok) throw new Error('타임캡슐 저장에 실패했습니다');
  return res.json();
}

export async function fetchDueTimeCapsules() {
  const res = await fetch(`${BASE_URL}/api/timecapsules/due`);
  if (!res.ok) throw new Error('타임캡슐 조회에 실패했습니다');
  return res.json();
}

export async function markTimeCapsuleOpened(id) {
  const res = await fetch(`${BASE_URL}/api/timecapsules/${id}/open`, { method: 'POST' });
  if (!res.ok) throw new Error('타임캡슐 확인 처리에 실패했습니다');
}
