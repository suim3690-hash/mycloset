import { toDateKey } from '../utils/date';
import { photoUrl } from '../api/outfitApi';

const WEEKDAY_LABELS_KO = ['월', '화', '수', '목', '금', '토', '일'];

function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=일 ... 6=토
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(date) {
  const start = startOfWeekMonday(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function DayView({
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  recordedDateKeys,
  dayOutfits,
  onCardClick,
  onAddClick,
}) {
  const weekDates = getWeekDates(selectedDate);
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(selectedDate);
  const dateLabel = selectedDate.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <div className="day-view">
      <div className="month-header">
        <button className="month-nav-btn" onClick={onPrevWeek}>
          <span className="material-symbol">chevron_left</span>
        </button>
        <span className="month-label day-view-label">{dateLabel}</span>
        <button className="month-nav-btn" onClick={onNextWeek}>
          <span className="material-symbol">chevron_right</span>
        </button>
      </div>

      <div className="week-strip">
        {weekDates.map((d, i) => {
          const key = toDateKey(d);
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          const hasRecord = recordedDateKeys.has(key);
          return (
            <button
              key={key}
              className="week-day-col"
              onClick={() => onSelectDate(d)}
            >
              <span className="week-day-name">{WEEKDAY_LABELS_KO[i]}</span>
              {isToday && <span className="week-day-today-tag">오늘</span>}
              <span
                className={[
                  'week-day-circle',
                  hasRecord ? 'recorded' : '',
                  isToday ? 'is-today' : '',
                  isSelected ? 'selected' : '',
                ].join(' ').trim()}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {dayOutfits.length === 0 ? (
        <button className="day-view-empty" onClick={onAddClick}>
          <span className="material-symbol">add_a_photo</span>
          <span>이 날의 코디를 기록해보세요</span>
        </button>
      ) : (
        <div className="day-view-grid">
          {dayOutfits.map((outfit) => (
            <button key={outfit.id} className="day-view-card" onClick={() => onCardClick(outfit)}>
              <div className="day-view-card-photo">
                <img src={photoUrl(outfit.photoPath)} alt="" />
                {outfit.isMain === 1 && <span className="day-view-card-badge">메인</span>}
              </div>
              <div className="day-view-card-info">
                <span className="day-view-card-category">{outfit.lookCategory || '스타일 미지정'}</span>
                {outfit.memo && <span className="day-view-card-memo">{outfit.memo}</span>}
              </div>
            </button>
          ))}
          <button className="day-view-card day-view-card-add" onClick={onAddClick}>
            <span className="material-symbol">add</span>
            <span>추가 기록</span>
          </button>
        </div>
      )}
    </div>
  );
}
