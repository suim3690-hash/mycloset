import { useEffect, useMemo, useState } from 'react';
import { fetchWardrobeItems } from '../api/wardrobeApi';
import { photoUrl } from '../api/outfitApi';
import { flattenWardrobeRecords } from '../utils/wardrobeUtils';
import OutfitMatchPage from './OutfitMatchPage';
import KlongChatPage from './KlongChatPage';

const CATEGORIES = ['상의', '아우터', '바지', '원피스', '스커트', '가방', '모자', '소품'];

export default function MyClosetPage({ token, onBack }) {
  const [records, setRecords] = useState(undefined);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [view, setView] = useState('main');

  useEffect(() => {
    fetchWardrobeItems(token)
      .then(setRecords)
      .catch(() => setRecords([]));
  }, [token]);

  const flatItems = useMemo(() => flattenWardrobeRecords(records), [records]);

  const itemsByCategory = useMemo(() => {
    const map = new Map(CATEGORIES.map((c) => [c, []]));
    flatItems.forEach((item) => {
      if (!map.has(item.category)) return;
      map.get(item.category).push(item);
    });
    return map;
  }, [flatItems]);

  const visibleItems = itemsByCategory.get(activeCategory) ?? [];

  if (view === 'match') {
    return <OutfitMatchPage items={flatItems} onBack={() => setView('main')} />;
  }

  if (view === 'klong') {
    return <KlongChatPage token={token} onBack={() => setView('main')} />;
  }

  return (
    <div>
      <div className="top-bar">
        <span style={{ width: 36 }} />
        <span className="top-bar-title">나의 옷장</span>
        <span style={{ width: 36 }} />
      </div>

      <div className="page">
        <div className="month-header">
          <button className="month-nav-btn" onClick={onBack}>
            <span className="material-symbol">arrow_back</span>
          </button>
          <span className="month-label">나의 옷장</span>
          <span style={{ width: 40 }} />
        </div>

        <div className="closet-action-row">
          <button className="closet-action-btn" onClick={() => setView('match')}>
            <span className="material-symbol">auto_awesome_mosaic</span>
            코디 매칭받기
          </button>
          <button className="closet-action-btn" onClick={() => setView('klong')}>
            <span className="material-symbol">forum</span>
            클롱과 대화하기
          </button>
        </div>

        <div className="closet-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`closet-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
              <span className="closet-tab-count">{itemsByCategory.get(cat)?.length ?? 0}</span>
            </button>
          ))}
        </div>

        {records === undefined && <div className="page-center">불러오는 중...</div>}

        {records !== undefined && visibleItems.length === 0 && (
          <div className="page-center">
            <p className="text-soft">
              아직 {activeCategory} 아이템이 없어요. 캘린더에 코디를 기록하면 자동으로 채워져요 🌱
            </p>
          </div>
        )}

        {visibleItems.length > 0 && (
          <div className="closet-grid">
            {visibleItems.map((item, i) => (
              <div key={i} className="closet-item">
                <div className="closet-item-photo">
                  <img src={photoUrl(item.photoPath)} alt={item.name} />
                </div>
                <span className="closet-item-name">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
