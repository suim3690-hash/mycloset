import { useEffect, useState } from 'react';
import { fetchStyleProfile, requestStyleRecommendation } from '../api/stylistApi';
import { LOOK_CATEGORIES } from '../constants/lookCategories';

const GENDERS = ['여성', '남성', '선택 안 함'];

function parseRecommendation(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function StylistPage({ token, onBack }) {
  const [profile, setProfile] = useState(undefined);
  const [editing, setEditing] = useState(false);
  const [gender, setGender] = useState('여성');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [selectedLooks, setSelectedLooks] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStyleProfile(token)
      .then((p) => {
        setProfile(p);
        if (p) {
          setGender(p.gender || '여성');
          setHeightCm(String(p.heightCm ?? ''));
          setWeightKg(String(p.weightKg ?? ''));
          setSelectedLooks(new Set(p.preferredLooks ? p.preferredLooks.split(',').filter(Boolean) : []));
        } else {
          setEditing(true);
        }
      })
      .catch(() => setProfile(null));
  }, [token]);

  function toggleLook(cat) {
    setSelectedLooks((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  async function handleSubmit() {
    if (selectedLooks.size === 0) {
      setError('좋아하는 스타일을 하나 이상 선택해주세요');
      return;
    }
    if (!heightCm || !weightKg) {
      setError('키와 몸무게를 입력해주세요');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await requestStyleRecommendation(token, {
        gender,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        preferredLooks: Array.from(selectedLooks),
      });
      setProfile(result);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const recommendation = profile?.recommendation ? parseRecommendation(profile.recommendation) : null;

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
          <span className="month-label">나만의 스타일리스트</span>
          <span style={{ width: 40 }} />
        </div>

        {profile === undefined && <div className="page-center">불러오는 중...</div>}

        {profile !== undefined && editing && (
          <div className="blob-card">
            <span className="blob-card-heading">
              <span className="material-symbol">person</span>
              나에 대해 알려주세요
            </span>

            <div className="memo-section">
              <label className="memo-label">성별</label>
              <div className="tag-row">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    className={`tag-chip reason ${gender === g ? 'selected' : ''}`}
                    onClick={() => setGender(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <div className="memo-section" style={{ flex: 1 }}>
                <label className="memo-label">키 (cm)</label>
                <input
                  className="memo-input"
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="예) 165"
                />
              </div>
              <div className="memo-section" style={{ flex: 1 }}>
                <label className="memo-label">몸무게 (kg)</label>
                <input
                  className="memo-input"
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="예) 55"
                />
              </div>
            </div>

            <div className="memo-section">
              <label className="memo-label">좋아하는 스타일 (복수 선택 가능)</label>
              <div className="tag-row">
                {LOOK_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`tag-chip reason ${selectedLooks.has(cat) ? 'selected' : ''}`}
                    onClick={() => toggleLook(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button className="report-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '스타일리스트가 분석 중...' : profile ? '다시 추천받기' : '추천받기'}
            </button>
          </div>
        )}

        {profile !== undefined && profile && !editing && (
          <>
            <div className="blob-card">
              <span className="blob-card-heading">
                <span className="material-symbol">auto_awesome</span>
                추천 스타일
              </span>
              <div className="report-chip-row">
                {(recommendation?.recommendedLooks ?? profile.preferredLooks.split(',')).map((look) => (
                  <span key={look} className="item-tag-chip">
                    {look}
                  </span>
                ))}
              </div>
              {recommendation?.summary && <p className="fact-bomb-text">{recommendation.summary}</p>}
            </div>

            {recommendation?.items?.length > 0 && (
              <div className="blob-card" style={{ marginTop: 20 }}>
                <span className="blob-card-heading">
                  <span className="material-symbol">checkroom</span>
                  추천 코디
                </span>
                <div className="style-bar-list">
                  {recommendation.items.map((item, i) => (
                    <div key={i} className="style-bar-row">
                      <span className="style-bar-label" style={{ flex: '0 0 auto' }}>{item.category}</span>
                      <p className="style-bar-reason" style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--ink)' }}>{item.item}</strong> — {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendation?.tip && (
              <div className="blob-card" style={{ marginTop: 20 }}>
                <span className="blob-card-heading">
                  <span className="material-symbol">lightbulb</span>
                  스타일링 팁
                </span>
                <p className="fact-bomb-text">{recommendation.tip}</p>
              </div>
            )}

            <button className="report-btn-secondary" style={{ marginTop: 20 }} onClick={() => setEditing(true)}>
              <span className="material-symbol">edit</span>
              정보 다시 입력하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
