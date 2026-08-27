import { useEffect, useState } from 'react';
import { matchWardrobeItems } from '../api/wardrobeApi';
import { photoUrl } from '../api/outfitApi';

const MATCHABLE_CATEGORIES = new Set(['상의', '바지', '스커트', '원피스']);

export default function OutfitMatchPage({ items, onBack }) {
  const matchableItems = items.filter((item) => MATCHABLE_CATEGORIES.has(item.category));

  const [matches, setMatches] = useState(undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (matchableItems.length < 2) {
      setMatches([]);
      return;
    }
    matchWardrobeItems(matchableItems)
      .then((res) => {
        const parsed = JSON.parse(res.result);
        setMatches(parsed.matches ?? []);
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <span className="month-label">코디 매칭받기</span>
          <span style={{ width: 40 }} />
        </div>

        {matchableItems.length < 2 && (
          <div className="page-center">
            <p className="text-soft">
              매칭하려면 상의/원피스와 바지/스커트가 최소 2개 이상 있어야 해요. 코디를 더 기록해보세요 🌱
            </p>
          </div>
        )}

        {matchableItems.length >= 2 && matches === undefined && !error && (
          <div className="page-center">
            <p className="text-soft">클롱이 옷장을 살펴보는 중이에요...</p>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        {matches && matches.length === 0 && matchableItems.length >= 2 && (
          <div className="page-center">
            <p className="text-soft">매칭할 조합을 찾지 못했어요</p>
          </div>
        )}

        {matches && matches.length > 0 && (
          <div className="match-list">
            {matches.map((match, i) => {
              const top = matchableItems[match.topIndex];
              const bottom = match.bottomIndex != null ? matchableItems[match.bottomIndex] : null;
              if (!top) return null;
              return (
                <div key={i} className="blob-card match-card">
                  <div className="match-photos">
                    <div className="match-photo">
                      <img src={photoUrl(top.photoPath)} alt={top.name} />
                      <span className="match-photo-label">{top.name}</span>
                    </div>
                    {bottom && (
                      <div className="match-photo">
                        <img src={photoUrl(bottom.photoPath)} alt={bottom.name} />
                        <span className="match-photo-label">{bottom.name}</span>
                      </div>
                    )}
                  </div>
                  <span className="item-tag-chip">{match.look}</span>
                  <p className="fact-bomb-text">{match.reason}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
