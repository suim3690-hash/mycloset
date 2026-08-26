import { photoUrl } from '../api/outfitApi';

export default function OutfitListView({ outfits, onItemClick }) {
  if (outfits.length === 0) {
    return (
      <div className="page-center">
        <p className="text-soft">아직 기록이 없어요. 오른쪽 아래 + 버튼으로 첫 기록을 남겨보세요 🌱</p>
      </div>
    );
  }

  return (
    <div className="outfit-list">
      {outfits.map((outfit) => (
        <button
          key={outfit.id}
          type="button"
          className="outfit-list-item"
          onClick={() => onItemClick(outfit.recordDate)}
        >
          <img src={photoUrl(outfit.photoPath)} alt="코디 사진" className="outfit-list-thumb" />
          <div className="outfit-list-info">
            <span className="outfit-list-date">{outfit.recordDate}</span>
            <span className="text-soft outfit-list-memo">{outfit.memo || '메모 없음'}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
