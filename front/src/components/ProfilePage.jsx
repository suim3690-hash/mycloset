import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchMyOutfits, fetchSavedOutfits, photoUrl } from '../api/outfitApi';
import { fetchAllAnalysis } from '../api/analysisApi';
import { updateProfile, logout } from '../api/authApi';
import PreviewModal from './PreviewModal';
import CaptureModal from './CaptureModal';
import { CommunityCard } from './CommunityPage';

function parseRecordDate(recordDate) {
  const [y, m, d] = recordDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function parseBreakdown(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed.categories ?? [];
  } catch {
    return [];
  }
}

export default function ProfilePage({ user, token, onProfileUpdated, onLogout }) {
  const [outfits, setOutfits] = useState(undefined);
  const [analyses, setAnalyses] = useState(undefined);
  const [savedOutfits, setSavedOutfits] = useState(undefined);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(user.displayName);
  const [draftBio, setDraftBio] = useState(user.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isSavingCover, setIsSavingCover] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [gridTab, setGridTab] = useState('posts');
  const [modalDate, setModalDate] = useState(null);
  const [viewingSavedOutfit, setViewingSavedOutfit] = useState(null);

  function loadOutfits() {
    fetchMyOutfits(token).then(setOutfits).catch(() => setOutfits([]));
  }

  function loadSavedOutfits() {
    fetchSavedOutfits().then(setSavedOutfits).catch(() => setSavedOutfits([]));
  }

  useEffect(() => {
    loadOutfits();
    fetchAllAnalysis().then(setAnalyses).catch(() => setAnalyses([]));
    loadSavedOutfits();
  }, []);

  const myPosts = outfits ?? [];

  const stats = useMemo(() => {
    if (!outfits) return null;
    const totalLikes = myPosts.reduce((sum, o) => sum + (o.likeCount ?? 0), 0);
    return {
      posts: myPosts.length,
      likes: totalLikes,
      saved: savedOutfits?.length ?? 0,
    };
  }, [outfits, myPosts, savedOutfits]);

  const handle = useMemo(() => `@${(user.email || 'my_closet').split('@')[0]}`, [user.email]);
  const coverPhotoUrl = coverPreview || (user.coverPath ? photoUrl(user.coverPath) : null);

  const topLooks = useMemo(() => {
    if (!analyses) return [];
    const totals = new Map();
    for (const a of analyses) {
      for (const c of parseBreakdown(a.styleBreakdown)) {
        totals.set(c.name, (totals.get(c.name) || 0) + c.percent);
      }
    }
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
  }, [analyses]);

  function startEditing() {
    setDraftName(user.displayName);
    setDraftBio(user.bio || '');
    setError(null);
    setEditing(true);
  }

  async function saveProfile() {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateProfile(token, {
        displayName: draftName.trim() || user.displayName,
        bio: draftBio.trim(),
      });
      onProfileUpdated(updated);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setIsSavingAvatar(true);
    try {
      const updated = await updateProfile(token, { avatarFile: file });
      onProfileUpdated(updated);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setIsSavingAvatar(false);
      setAvatarPreview(null);
    }
  }

  async function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    setIsSavingCover(true);
    try {
      const updated = await updateProfile(token, { coverFile: file });
      onProfileUpdated(updated);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setIsSavingCover(false);
      setCoverPreview(null);
    }
  }

  async function handleLogoutClick() {
    await logout(token);
    onLogout();
  }

  return (
    <div>
      <div className="top-bar">
        <span style={{ width: 36 }} />
        <span className="top-bar-title">나의 옷장</span>
        <button className="icon-btn" onClick={handleLogoutClick}>
          <span className="material-symbol">logout</span>
        </button>
      </div>

      <div className="page">
        <div
          className={`profile-cover ${coverPhotoUrl ? '' : 'profile-cover-fallback'}`}
          style={coverPhotoUrl ? { backgroundImage: `url(${coverPhotoUrl})` } : undefined}
        >
          <label className="profile-cover-edit-btn" aria-label="배경 사진 변경">
            <span className="material-symbol">{isSavingCover ? 'hourglass_top' : 'photo_camera'}</span>
            <input type="file" accept="image/*" onChange={handleCoverChange} hidden disabled={isSavingCover} />
          </label>

          <label className="profile-avatar">
            {avatarPreview || user.avatarPath ? (
              <img
                src={avatarPreview || photoUrl(user.avatarPath)}
                alt="프로필 사진"
                className="profile-avatar-img"
              />
            ) : (
              <span className="material-symbol">checkroom</span>
            )}
            <span className="profile-avatar-edit-badge">
              <span className="material-symbol">{isSavingAvatar ? 'hourglass_top' : 'photo_camera'}</span>
            </span>
            <input type="file" accept="image/*" onChange={handleAvatarChange} hidden disabled={isSavingAvatar} />
          </label>
        </div>

        <div className="profile-identity">
          {!editing ? (
            <>
              <span className="profile-name">{user.displayName}</span>
              <span className="profile-handle">{handle}</span>
              {user.bio && <span className="profile-bio">{user.bio}</span>}
            </>
          ) : (
            <div className="profile-edit-form">
              <input
                className="memo-input"
                style={{ textAlign: 'center' }}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="닉네임"
                maxLength={20}
              />
              <input
                className="memo-input"
                style={{ textAlign: 'center' }}
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                placeholder="한 줄 소개"
                maxLength={40}
              />
              {error && <p className="error-text">{error}</p>}
            </div>
          )}
        </div>

        <div className="profile-stats-row">
          <div className="profile-stat-tile">
            <span className="profile-stat-number">{stats?.posts ?? '-'}</span>
            <span className="profile-stat-label">게시물</span>
          </div>
          <div className="profile-stat-tile">
            <span className="profile-stat-number">{stats?.likes ?? '-'}</span>
            <span className="profile-stat-label">좋아요</span>
          </div>
          <div className="profile-stat-tile">
            <span className="profile-stat-number">{stats?.saved ?? '-'}</span>
            <span className="profile-stat-label">저장</span>
          </div>
        </div>

        <div className="profile-actions-row">
          {!editing ? (
            <>
              <button className="report-btn-primary" onClick={startEditing}>
                프로필 편집
              </button>
              <button className="report-btn-secondary" onClick={() => setPreviewOpen(true)}>
                <span className="material-symbol">shopping_bag</span>
                구매 전 미리보기
              </button>
            </>
          ) : (
            <>
              <button className="report-btn-primary" onClick={saveProfile} disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장하기'}
              </button>
              <button className="report-btn-secondary" onClick={() => setEditing(false)} disabled={isSaving}>
                취소
              </button>
            </>
          )}
        </div>

        <div className="blob-card" style={{ marginTop: 20 }}>
          <span className="blob-card-heading">
            <span className="material-symbol">auto_awesome</span>
            내가 가장 많이 입은 룩
          </span>
          {topLooks.length > 0 ? (
            <div className="report-chip-row">
              {topLooks.map((look, i) => (
                <span key={look} className={`item-tag-chip ${i === 0 ? '' : 'muted'}`}>
                  {i === 0 && <span className="material-symbol">stars</span>}
                  {look}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-soft">아직 AI 분석 데이터가 부족해요. 분석 탭에서 코디를 분석해보세요!</p>
          )}
        </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab-btn ${gridTab === 'posts' ? 'active' : ''}`}
            onClick={() => setGridTab('posts')}
          >
            게시물
          </button>
          <button
            className={`profile-tab-btn ${gridTab === 'saved' ? 'active' : ''}`}
            onClick={() => setGridTab('saved')}
          >
            저장
          </button>
        </div>

        {gridTab === 'posts' &&
          (myPosts.length > 0 ? (
            <div className="profile-grid">
              {myPosts.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="profile-grid-item"
                  onClick={() => setModalDate(parseRecordDate(o.recordDate))}
                >
                  <img src={photoUrl(o.photoPath)} alt={o.recordDate} />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-soft" style={{ padding: '24px 0', textAlign: 'center' }}>
              아직 캘린더에 남긴 기록이 없어요
            </p>
          ))}

        {gridTab === 'saved' &&
          (savedOutfits && savedOutfits.length > 0 ? (
            <div className="profile-grid">
              {savedOutfits.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="profile-grid-item"
                  onClick={() => setViewingSavedOutfit(o)}
                >
                  <img src={photoUrl(o.photoPath)} alt={o.recordDate} />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-soft" style={{ padding: '24px 0', textAlign: 'center' }}>
              저장한 게시물이 없어요
            </p>
          ))}
      </div>

      {previewOpen && <PreviewModal onClose={() => setPreviewOpen(false)} />}

      {modalDate && (
        <CaptureModal
          date={modalDate}
          token={token}
          onClose={() => setModalDate(null)}
          onSaved={() => {
            loadOutfits();
            loadSavedOutfits();
          }}
        />
      )}

      {viewingSavedOutfit && createPortal(
        <div className="modal-backdrop" onClick={() => setViewingSavedOutfit(null)}>
          <div className="saved-outfit-preview" onClick={(e) => e.stopPropagation()}>
            <CommunityCard
              outfit={viewingSavedOutfit}
              user={user}
              token={token}
              onViewUser={() => {}}
              onChanged={loadSavedOutfits}
            />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
