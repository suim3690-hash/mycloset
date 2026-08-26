import { useState } from 'react';
import { createPortal } from 'react-dom';
import { photoUrl } from '../api/outfitApi';

const SHARE_URL = typeof window !== 'undefined' ? window.location.origin : '';

function buildShareText(outfit) {
  const look = outfit.lookCategory?.split(',').filter(Boolean)[0];
  const parts = [`${outfit.recordDate} 코디예요!`];
  if (look) parts.push(`#${look}`);
  if (outfit.memo) parts.push(outfit.memo);
  return parts.join(' ');
}

export default function ShareSheet({ onClose, outfit }) {
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  async function handleShare() {
    const shareData = {
      title: '나의 옷장',
      text: outfit ? buildShareText(outfit) : '오늘의 스타일을 친구에게 공유해보세요!',
      url: SHARE_URL,
    };

    if (outfit && navigator.canShare) {
      try {
        const res = await fetch(photoUrl(outfit.photoPath));
        const blob = await res.blob();
        const file = new File([blob], 'outfit.jpg', { type: blob.type || 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ ...shareData, files: [file] });
          return;
        }
      } catch {
        // 이미지 공유 실패 시 텍스트/링크 공유로 대체
      }
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // 사용자가 공유 취소
      }
    } else {
      handleCopyLink();
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ width: 36 }} />
          <span className="modal-title">공유하기</span>
          <button className="icon-btn" onClick={onClose}>
            <span className="material-symbol">close</span>
          </button>
        </div>
        <div className="modal-content">
          <button className="share-option-btn" onClick={handleShare}>
            <span className="material-symbol">chat_bubble</span>
            <span>카카오톡으로 보내기</span>
          </button>
          <button className="share-option-btn" onClick={handleCopyLink}>
            <span className="material-symbol">link</span>
            <span>{copied ? '링크가 복사되었어요!' : '링크 복사'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
