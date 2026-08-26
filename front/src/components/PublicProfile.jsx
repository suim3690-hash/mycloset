import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchOutfitsByUser, photoUrl } from '../api/outfitApi';
import { fetchPublicUser } from '../api/authApi';
import { CommunityCard } from './CommunityPage';

export default function PublicProfile({ userId, currentUser, token, onClose }) {
  const [profileUser, setProfileUser] = useState(undefined);
  const [outfits, setOutfits] = useState(undefined);
  const [viewingOutfit, setViewingOutfit] = useState(null);

  useEffect(() => {
    fetchPublicUser(userId).then(setProfileUser).catch(() => setProfileUser(null));
    loadOutfits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function loadOutfits() {
    fetchOutfitsByUser(userId).then(setOutfits).catch(() => setOutfits([]));
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" style={{ height: '92vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="icon-btn" onClick={onClose}>
            <span className="material-symbol">arrow_back</span>
          </button>
          <span className="modal-title">{profileUser?.displayName ?? '프로필'}</span>
          <span style={{ width: 36 }} />
        </div>

        <div className="modal-content">
          {profileUser === undefined && <div className="page-center">불러오는 중...</div>}
          {profileUser === null && <div className="page-center">사용자를 찾을 수 없어요</div>}

          {profileUser && (
            <>
              <div className="profile-cover profile-cover-fallback" style={{ marginBottom: 44 }}>
                <div className="profile-avatar">
                  {profileUser.avatarPath ? (
                    <img src={photoUrl(profileUser.avatarPath)} alt={profileUser.displayName} className="profile-avatar-img" />
                  ) : (
                    <span className="material-symbol">checkroom</span>
                  )}
                </div>
              </div>

              <div className="profile-identity">
                <span className="profile-name">{profileUser.displayName}</span>
                {profileUser.bio && <span className="profile-bio">{profileUser.bio}</span>}
              </div>

              <div className="profile-tabs">
                <span className="profile-tab-btn active">게시물 {outfits?.length ?? ''}</span>
              </div>

              {outfits && outfits.length > 0 ? (
                <div className="profile-grid">
                  {outfits.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="profile-grid-item"
                      onClick={() => setViewingOutfit(o)}
                    >
                      <img src={photoUrl(o.photoPath)} alt={o.recordDate} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-soft" style={{ padding: '24px 0', textAlign: 'center' }}>
                  아직 올린 게시물이 없어요
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {viewingOutfit && createPortal(
        <div className="modal-backdrop" onClick={() => setViewingOutfit(null)}>
          <div className="saved-outfit-preview" onClick={(e) => e.stopPropagation()}>
            <CommunityCard
              outfit={viewingOutfit}
              user={currentUser}
              token={token}
              onViewUser={() => {}}
              onChanged={loadOutfits}
            />
          </div>
        </div>,
        document.body,
      )}
    </div>,
    document.body,
  );
}
