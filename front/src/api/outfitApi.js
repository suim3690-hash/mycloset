import { BASE_URL } from './config';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchOutfits() {
  const res = await fetch(`${BASE_URL}/api/outfits`);
  if (!res.ok) throw new Error('목록 조회에 실패했습니다');
  return res.json();
}

export async function fetchMyOutfits(token) {
  const res = await fetch(`${BASE_URL}/api/outfits/mine`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('내 게시물 조회에 실패했습니다');
  return res.json();
}

export async function fetchOutfitsByUser(userId) {
  const res = await fetch(`${BASE_URL}/api/outfits/by-user/${userId}`);
  if (!res.ok) throw new Error('게시물 조회에 실패했습니다');
  return res.json();
}

export async function registerOutfit(token, { recordDate, filterType, memo, itemTags, lookCategory, location, photoFile }) {
  const formData = new FormData();
  formData.append('recordDate', recordDate);
  formData.append('filterType', filterType);
  if (memo) formData.append('memo', memo);
  if (itemTags) formData.append('itemTags', itemTags);
  if (lookCategory) formData.append('lookCategory', lookCategory);
  if (location) formData.append('location', location);
  formData.append('photo', photoFile);

  const res = await fetch(`${BASE_URL}/api/outfits`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw new Error('저장에 실패했습니다');
  return res.json();
}

export async function fetchOutfitByDate(token, recordDate) {
  const res = await fetch(`${BASE_URL}/api/outfits/${recordDate}`, { headers: authHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('기록 조회에 실패했습니다');
  return res.json();
}

export async function fetchOutfitsByDateAll(token, recordDate) {
  const res = await fetch(`${BASE_URL}/api/outfits/${recordDate}/all`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('목록 조회에 실패했습니다');
  return res.json();
}

export async function setMainOutfit(token, id, recordDate) {
  const res = await fetch(`${BASE_URL}/api/outfits/${id}/main?recordDate=${recordDate}`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('메인 사진 설정에 실패했습니다');
  return res.json();
}

export async function updateOutfitDetails(token, id, memo, itemTags, lookCategory, location) {
  const params = new URLSearchParams();
  params.append('memo', memo ?? '');
  params.append('itemTags', itemTags ?? '');
  params.append('lookCategory', lookCategory ?? '');
  params.append('location', location ?? '');

  const res = await fetch(`${BASE_URL}/api/outfits/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...authHeaders(token) },
    body: params,
  });
  if (!res.ok) throw new Error('수정에 실패했습니다');
  return res.json();
}

export async function setOutfitLiked(id, liked) {
  const res = await fetch(`${BASE_URL}/api/outfits/${id}/like?liked=${liked}`, { method: 'POST' });
  if (!res.ok) throw new Error('좋아요 처리에 실패했습니다');
  return res.json();
}

export async function setOutfitSaved(id, saved) {
  const res = await fetch(`${BASE_URL}/api/outfits/${id}/save?saved=${saved}`, { method: 'POST' });
  if (!res.ok) throw new Error('저장 처리에 실패했습니다');
  return res.json();
}

export async function setOutfitShared(token, id, shared) {
  const res = await fetch(`${BASE_URL}/api/outfits/${id}/share?shared=${shared}`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('공유 처리에 실패했습니다');
  return res.json();
}

export async function fetchSavedOutfits() {
  const res = await fetch(`${BASE_URL}/api/outfits/saved`);
  if (!res.ok) throw new Error('저장한 목록 조회에 실패했습니다');
  return res.json();
}

export async function deleteOutfit(token, id) {
  const res = await fetch(`${BASE_URL}/api/outfits/${id}`, { method: 'DELETE', headers: authHeaders(token) });
  if (!res.ok) throw new Error('삭제에 실패했습니다');
  return res.json();
}

export async function fetchComments(outfitId) {
  const res = await fetch(`${BASE_URL}/api/outfits/${outfitId}/comments`);
  if (!res.ok) throw new Error('댓글 조회에 실패했습니다');
  return res.json();
}

export async function addComment(outfitId, content) {
  const res = await fetch(`${BASE_URL}/api/outfits/${outfitId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('댓글 저장에 실패했습니다');
  return res.json();
}

export function photoUrl(photoPath) {
  return `${BASE_URL}/uploads/${photoPath}`;
}
