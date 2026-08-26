import { useMemo, useState } from 'react';
import { photoUrl, deleteOutfit } from '../api/outfitApi';
import CaptureModal from './CaptureModal';

export default function AnalysisGallery({ outfits, token, onSelect, onOpenInsight, onOpenStylist, onOutfitsChanged }) {
  const [captureOpen, setCaptureOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function handleDelete(e, outfit) {
    e.stopPropagation();
    if (!window.confirm('이 기록을 삭제할까요? 사진도 함께 삭제되고 되돌릴 수 없어요.')) return;
    setDeletingId(outfit.id);
    try {
      await deleteOutfit(token, outfit.id);
      onOutfitsChanged();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const recentOutfits = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const cutoff = oneMonthAgo.toISOString().slice(0, 10);

    return outfits
      .filter((o) => o.recordDate >= cutoff)
      .slice()
      .sort((a, b) => (a.recordDate < b.recordDate ? 1 : -1));
  }, [outfits]);

  return (
    <div>
      <div className="top-bar">
        <button className="icon-btn" onClick={() => setCaptureOpen(true)}>
          <span className="material-symbol">edit_note</span>
        </button>
        <span className="top-bar-title">나의 옷장</span>
        <button className="icon-btn" onClick={onOpenInsight}>
          <span className="material-symbol">insights</span>
        </button>
      </div>

      <div className="page">
        <div className="analysis-gallery-heading-block">
          <h2 className="analysis-gallery-heading">
            <span className="heading-highlight">최근 한 달</span>
          </h2>
          <p className="analysis-gallery-subtitle">최근 30일 동안의 스타일 기록이에요</p>
        </div>

        <button className="blob-card stylist-trigger" onClick={onOpenStylist}>
          <span className="stylist-trigger-icon">
            <span className="material-symbol">auto_awesome</span>
          </span>
          <span className="stylist-trigger-text">
            <span className="stylist-trigger-title">나만의 스타일리스트</span>
            <span className="stylist-trigger-subtitle">체형과 취향을 알려주면 코디를 추천해드려요</span>
          </span>
          <span className="material-symbol">chevron_right</span>
        </button>

        {recentOutfits.length === 0 && (
          <div className="page-center">
            <p className="text-soft">최근 한 달간 기록이 없어요. 캘린더에서 먼저 기록을 남겨주세요 🌱</p>
          </div>
        )}

        {recentOutfits.length > 0 && (
          <div className="analysis-masonry">
            {recentOutfits.map((o) => (
              <div key={o.recordDate} className="analysis-masonry-item">
                <button className="analysis-masonry-open-btn" onClick={() => onSelect(o.recordDate)}>
                  <img src={photoUrl(o.photoPath)} alt={o.recordDate} />
                </button>
                <span className="analysis-masonry-date">{o.recordDate.slice(5)}</span>
                <button
                  className="analysis-masonry-delete-btn"
                  onClick={(e) => handleDelete(e, o)}
                  disabled={deletingId === o.id}
                  aria-label="삭제"
                >
                  <span className="material-symbol">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {captureOpen && (
        <CaptureModal
          date={new Date()}
          token={token}
          onClose={() => setCaptureOpen(false)}
          onSaved={onOutfitsChanged}
        />
      )}
    </div>
  );
}
