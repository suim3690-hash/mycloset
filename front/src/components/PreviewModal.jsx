import { useState } from 'react';
import { createPortal } from 'react-dom';
import { simulatePreview } from '../api/previewApi';
import { photoUrl } from '../api/outfitApi';

export default function PreviewModal({ onClose }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }

  async function handleSimulate() {
    if (!photoFile) {
      setError('사진을 먼저 선택해주세요');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await simulatePreview(photoFile);
      const parsed = JSON.parse(res.resultJson);
      const matchPhotoPath = res.referencePhotoPaths[parsed.matchIndex] ?? null;
      setResult({ ...parsed, matchPhotoPath });
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="icon-btn" onClick={onClose}>
            <span className="material-symbol">close</span>
          </button>
          <span className="modal-title">구매 전 미리보기</span>
          <span style={{ width: 36 }} />
        </div>

        <div className="modal-content">
          <label className="photo-drop" style={{ borderRadius: 16 }}>
            {previewUrl ? (
              <img src={previewUrl} alt="새 아이템" />
            ) : (
              <div className="photo-drop-placeholder">
                <span className="material-symbol">add_a_photo</span>
                <span className="text-soft">사려는 아이템 사진을 올려주세요</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
          </label>

          {!result && (
            <button className="report-btn-primary" onClick={handleSimulate} disabled={isLoading}>
              {isLoading ? 'AI가 옷장이랑 맞춰보는 중...' : '미리보기 받기'}
            </button>
          )}

          {error && <p className="error-text">{error}</p>}

          {result && (
            <div className="preview-result">
              <p className="text-soft" style={{ margin: 0, fontSize: 13 }}>
                {result.itemDescription}
              </p>

              {result.matchPhotoPath && (
                <div className="style-twin-row" style={{ marginTop: 12 }}>
                  <img
                    src={photoUrl(result.matchPhotoPath)}
                    alt="가장 잘 어울리는 코디"
                    className="style-twin-thumb"
                  />
                  <div className="style-twin-info">
                    <span className="style-twin-date">이 코디랑 제일 잘 어울려요</span>
                    <span className="style-twin-score">{result.matchReason}</span>
                  </div>
                </div>
              )}

              {result.stylingTips?.length > 0 && (
                <div className="report-chip-row" style={{ marginTop: 12 }}>
                  {result.stylingTips.map((tip, i) => (
                    <span key={i} className="item-tag-chip muted">
                      {tip}
                    </span>
                  ))}
                </div>
              )}

              <button className="report-btn-secondary" style={{ marginTop: 12 }} onClick={() => setResult(null)}>
                <span className="material-symbol">refresh</span>
                다시 확인하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
