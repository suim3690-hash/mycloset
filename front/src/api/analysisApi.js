import { BASE_URL } from './config';

export async function fetchAllAnalysis() {
  const res = await fetch(`${BASE_URL}/api/analysis`);
  if (!res.ok) throw new Error('분석 목록 조회에 실패했습니다');
  return res.json();
}

export async function fetchAnalysis(recordDate) {
  const res = await fetch(`${BASE_URL}/api/analysis/${recordDate}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('분석 결과 조회에 실패했습니다');
  return res.json();
}

export async function requestAnalysis(recordDate, force = false) {
  const res = await fetch(
    `${BASE_URL}/api/analysis?recordDate=${recordDate}&force=${force}`,
    { method: 'POST' },
  );
  if (!res.ok) throw new Error('AI 분석에 실패했습니다');
  return res.json();
}

export async function requestFactBomb(recordDate, force = false) {
  const res = await fetch(
    `${BASE_URL}/api/analysis/${recordDate}/fact-bomb?force=${force}`,
    { method: 'POST' },
  );
  if (!res.ok) throw new Error('팩트폭력 생성에 실패했습니다');
  return res.json();
}

export async function saveAnalysisTags(recordDate, moodTags, reasonTags) {
  const res = await fetch(`${BASE_URL}/api/analysis/${recordDate}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moodTags, reasonTags }),
  });
  if (!res.ok) throw new Error('태그 저장에 실패했습니다');
  return res.json();
}

export async function fetchFactBombChat(recordDate) {
  const res = await fetch(`${BASE_URL}/api/analysis/${recordDate}/chat`);
  if (!res.ok) throw new Error('상담 내역 조회에 실패했습니다');
  return res.json();
}

export async function sendFactBombChatMessage(recordDate, message) {
  const res = await fetch(`${BASE_URL}/api/analysis/${recordDate}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || '상담사와의 대화에 실패했습니다');
  }
  return res.json();
}
