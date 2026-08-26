import { toDateKey } from '../utils/date';
import { photoUrl } from '../api/outfitApi';

const WEEKDAYS = [
  { label: 'SUN', cls: 'sun' },
  { label: 'MON', cls: '' },
  { label: 'TUE', cls: '' },
  { label: 'WED', cls: '' },
  { label: 'THU', cls: '' },
  { label: 'FRI', cls: '' },
  { label: 'SAT', cls: 'sat' },
];

export default function MonthGrid({ displayedMonth, recordedOutfits, onDateClick }) {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyCells = firstDay.getDay();
  const todayKey = toDateKey(new Date());

  const outfitByDate = new Map(recordedOutfits.map((o) => [o.recordDate, o]));

  const cells = [];
  for (let i = 0; i < leadingEmptyCells; i++) {
    cells.push(<div key={`empty-${i}`} className="day-cell empty" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = toDateKey(date);
    const outfit = outfitByDate.get(key);
    const isToday = key === todayKey;

    if (outfit) {
      cells.push(
        <button key={key} className="day-cell" onClick={() => onDateClick(date)}>
          <div className="day-thumb">
            <img src={photoUrl(outfit.photoPath)} alt="" />
            <span className="day-thumb-badge">{day}</span>
          </div>
        </button>,
      );
    } else {
      cells.push(
        <button
          key={key}
          className={`day-cell ${isToday ? 'today' : ''}`}
          onClick={() => onDateClick(date)}
        >
          {day}
        </button>,
      );
    }
  }

  return (
    <div className="calendar-card">
      <div className="weekday-row">
        {WEEKDAYS.map((w) => (
          <div key={w.label} className={`weekday ${w.cls}`}>{w.label}</div>
        ))}
      </div>
      <div className="day-grid">{cells}</div>
    </div>
  );
}
