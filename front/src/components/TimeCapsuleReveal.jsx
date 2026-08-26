import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchDueTimeCapsules, markTimeCapsuleOpened } from '../api/timeCapsuleApi';
import { fetchOutfitByDate, photoUrl } from '../api/outfitApi';
import { toDateKey } from '../utils/date';

export default function TimeCapsuleReveal() {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [pastOutfit, setPastOutfit] = useState(null);
  const [todayOutfit, setTodayOutfit] = useState(null);

  useEffect(() => {
    fetchDueTimeCapsules()
      .then(setQueue)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (queue.length === 0) {
      setCurrent(null);
      return;
    }
    const next = queue[0];
    setCurrent(next);
    fetchOutfitByDate(next.recordDate).then(setPastOutfit).catch(() => setPastOutfit(null));
    fetchOutfitByDate(toDateKey(new Date())).then(setTodayOutfit).catch(() => setTodayOutfit(null));
  }, [queue]);

  if (!current) return null;

  async function handleClose() {
    await markTimeCapsuleOpened(current.id).catch(() => {});
    setQueue((prev) => prev.slice(1));
  }

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ width: 36 }} />
          <span className="modal-title">타임캡슐 도착!</span>
          <span style={{ width: 36 }} />
        </div>
        <div className="modal-content">
          <p className="text-soft" style={{ margin: 0, fontSize: 13 }}>
            {current.recordDate}의 내가 보낸 메시지
          </p>

          <div className="blob-card" style={{ width: '100%' }}>
            <p style={{ margin: 0, fontSize: 17 }}>"{current.message}"</p>
          </div>

          {(pastOutfit || todayOutfit) && (
            <div className="capsule-compare-row">
              {pastOutfit && (
                <div className="capsule-compare-item">
                  <img className="capsule-compare-photo" src={photoUrl(pastOutfit.photoPath)} alt="그때" />
                  <span className="capsule-compare-label">그때</span>
                </div>
              )}
              {todayOutfit && (
                <div className="capsule-compare-item">
                  <img className="capsule-compare-photo" src={photoUrl(todayOutfit.photoPath)} alt="지금" />
                  <span className="capsule-compare-label">지금</span>
                </div>
              )}
            </div>
          )}

          <button className="primary-button" onClick={handleClose}>
            확인했어요
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
