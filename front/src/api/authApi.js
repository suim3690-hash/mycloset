import { BASE_URL } from './config';

async function handle(res, fallbackMessage) {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || fallbackMessage);
  }
  return res.status === 204 ? null : res.json();
}

export async function signup(email, password, displayName) {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  return handle(res, '회원가입에 실패했습니다');
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handle(res, '로그인에 실패했습니다');
}

export async function fetchMe(token) {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle(res, '로그인이 필요합니다');
}

export async function fetchPublicUser(userId) {
  const res = await fetch(`${BASE_URL}/api/auth/users/${userId}`);
  return handle(res, '사용자를 찾을 수 없습니다');
}

export async function updateProfile(token, { displayName, bio, avatarFile, coverFile }) {
  const formData = new FormData();
  if (displayName !== undefined) formData.append('displayName', displayName);
  if (bio !== undefined) formData.append('bio', bio);
  if (avatarFile) formData.append('avatar', avatarFile);
  if (coverFile) formData.append('cover', coverFile);

  const res = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return handle(res, '프로필 수정에 실패했습니다');
}

export async function logout(token) {
  await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}
