import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchMyOutfits, setOutfitShared, photoUrl } from '../api/outfitApi';

export default function SharePicker({ token, onClose, onShared }) {
  const [outfits, setOutfits] = useState(undefined);
  const [sharingId, setSharingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyOutfits(token)
      .then((data) => setOutfits(data.filter((o) => o.isShared !== 1)))
      .catch(() => setOutfits([]));
  }, [token]);

  async function handleShare(outfit) {
    setSharingId(outfit.id);
    setError(null);
    try {
      await setOutfitShared(token, outfit.id, true);
      onShared();
      onClose();
    } catch (e) {
      setError(e.message);
      setSharingId(null);
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="icon-btn" onClick={onClose}>
            <span className="material-symbol">close</span>
          </button>
          <span className="modal-title">공유할 코디 선택</span>
          <span style={{ width: 36 }} />
        </div>

        <div className="modal-content">
          <p className="text-soft" style={{ margin: '0 0 4px', fontSize: 13 }}>
            캘린더에 기록해둔 코디 중에서 커뮤니티에 올릴 걸 골라주세요
          </p>

          {error && <p className="error-text">{error}</p>}

          {outfits === undefined && <div className="page-center">불러오는 중...</div>}

          {outfits && outfits.length === 0 && (
            <p className="text-soft" style={{ padding: '24px 0', textAlign: 'center' }}>
              공유할 수 있는 코디가 없어요. 캘린더에서 먼저 기록을 남겨주세요 🌱
            </p>
          )}

          {outfits && outfits.length > 0 && (
            <div className="outfit-list">
              {outfits.map((outfit) => (
                <button
                  key={outfit.id}
                  type="button"
                  className="outfit-list-item"
                  onClick={() => handleShare(outfit)}
                  disabled={sharingId === outfit.id}
                >
                  <img src={photoUrl(outfit.photoPath)} alt="코디 사진" className="outfit-list-thumb" />
                  <div className="outfit-list-info">
                    <span className="outfit-list-date">{outfit.recordDate}</span>
                    <span className="text-soft outfit-list-memo">{outfit.memo || '메모 없음'}</span>
                  </div>
                  {sharingId === outfit.id && <span className="text-soft">공유 중...</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
