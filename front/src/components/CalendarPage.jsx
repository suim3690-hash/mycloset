import { useEffect, useMemo, useState } from 'react';
import MonthGrid from './MonthGrid';
import OutfitListView from './OutfitListView';
import CaptureModal from './CaptureModal';
import ShareSheet from './ShareSheet';
import MyClosetPage from './MyClosetPage';
import { fetchMyOutfits } from '../api/outfitApi';

function parseRecordDate(recordDate) {
  const [y, m, d] = recordDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function CalendarPage({ token }) {
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [viewMode, setViewMode] = useState('month');
  const [outfits, setOutfits] = useState([]);
  const [modalDate, setModalDate] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [closetOpen, setClosetOpen] = useState(false);

  useEffect(() => {
    loadOutfits();
  }, []);

  async function loadOutfits() {
    try {
      const data = await fetchMyOutfits(token);
      setOutfits(data);
    } catch (e) {
      console.error(e);
    }
  }

  const recordedDateKeys = useMemo(
    () => new Set(outfits.map((o) => o.recordDate)),
    [outfits],
  );

  function changeMonth(offset) {
    setDisplayedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  function handleSaved() {
    loadOutfits();
  }

  const monthLabel = displayedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (closetOpen) {
    return <MyClosetPage token={token} onBack={() => setClosetOpen(false)} />;
  }

  return (
    <div>
      <div className="top-bar">
        <button className="icon-btn" onClick={() => setModalDate(new Date())}>
          <span className="material-symbol">edit_note</span>
        </button>
        <span className="top-bar-title">나의 옷장</span>
        <button className="icon-btn" onClick={() => setShareOpen(true)}>
          <span className="material-symbol">share</span>
        </button>
      </div>

      <div className="page">
        <div className="month-header">
          {viewMode === 'month' ? (
            <button className="month-nav-btn" onClick={() => changeMonth(-1)}>
              <span className="material-symbol">chevron_left</span>
            </button>
          ) : (
            <span />
          )}
          <span className="month-label">{viewMode === 'month' ? monthLabel : '전체 기록'}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {viewMode === 'month' && (
              <button className="month-nav-btn" onClick={() => changeMonth(1)}>
                <span className="material-symbol">chevron_right</span>
              </button>
            )}
            <button
              className="view-toggle-btn"
              onClick={() => setViewMode(viewMode === 'month' ? 'list' : 'month')}
            >
              <span className="material-symbol">
                {viewMode === 'month' ? 'view_agenda' : 'calendar_month'}
              </span>
            </button>
          </div>
        </div>

        {viewMode === 'month' ? (
          <MonthGrid
            displayedMonth={displayedMonth}
            recordedOutfits={outfits}
            onDateClick={setModalDate}
          />
        ) : (
          <OutfitListView outfits={outfits} onItemClick={(recordDate) => setModalDate(parseRecordDate(recordDate))} />
        )}

        <button className="blob-card closet-trigger" onClick={() => setClosetOpen(true)}>
          <span className="closet-trigger-icon">
            <span className="material-symbol">checkroom</span>
          </span>
          <span className="closet-trigger-text">
            <span className="closet-trigger-title">나의 옷장 들어가기</span>
            <span className="closet-trigger-subtitle">기록한 코디에서 AI가 자동으로 정리해둔 아이템을 봐요</span>
          </span>
          <span className="material-symbol">chevron_right</span>
        </button>
      </div>

      <button className="fab" onClick={() => setModalDate(new Date())}>
        <span className="material-symbol">add</span>
      </button>

      {modalDate && (
        <CaptureModal date={modalDate} token={token} onClose={() => setModalDate(null)} onSaved={handleSaved} />
      )}

      {shareOpen && <ShareSheet onClose={() => setShareOpen(false)} />}
    </div>
  );
}
