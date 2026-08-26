import { useEffect, useState } from 'react';
import { fetchOutfitByDate, photoUrl } from '../api/outfitApi';
import {
  fetchAllAnalysis,
  fetchAnalysis,
  fetchFactBombChat,
  requestAnalysis,
  requestFactBomb,
  saveAnalysisTags,
  sendFactBombChatMessage,
} from '../api/analysisApi';
import { MOOD_TAGS, REASON_TAGS } from '../constants/emotionTags';
import { oneYearBefore, addMonths } from '../utils/date';
import { findStyleTwin } from '../utils/styleMatchUtils';
import { createTimeCapsule } from '../api/timeCapsuleApi';

const MAX_CHAT_TURNS = 3;

const CAPSULE_DURATIONS = [
  { label: '3개월 후', months: 3 },
  { label: '6개월 후', months: 6 },
  { label: '1년 후', months: 12 },
];

function parseBreakdown(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed.categories ?? [];
  } catch {
    return [];
  }
}

export default function AnalysisDetail({ dateKey, token, onBack }) {
  const [outfit, setOutfit] = useState(undefined);
  const [analysis, setAnalysis] = useState(null);
  const [moodTag, setMoodTag] = useState(null);
  const [reasonTags, setReasonTags] = useState([]);
  const [tagsSaved, setTagsSaved] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const [pastOutfit, setPastOutfit] = useState(undefined);
  const [showPastOutfit, setShowPastOutfit] = useState(false);

  const [factBomb, setFactBomb] = useState(null);
  const [showFactBomb, setShowFactBomb] = useState(false);
  const [isFactBombing, setIsFactBombing] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatError, setChatError] = useState(null);

  const [styleTwin, setStyleTwin] = useState(null);
  const [twinOutfit, setTwinOutfit] = useState(null);

  const [capsuleWriting, setCapsuleWriting] = useState(false);
  const [capsuleMessage, setCapsuleMessage] = useState('');
  const [capsuleSaved, setCapsuleSaved] = useState(false);
  const [isSavingCapsule, setIsSavingCapsule] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setOutfit(undefined);
    setAnalysis(null);
    setError(null);
    setShowPastOutfit(false);
    setFactBomb(null);
    setShowFactBomb(false);
    setChatOpen(false);
    setChatMessages([]);
    setChatInput('');
    setChatError(null);
    setCapsuleWriting(false);
    setCapsuleMessage('');
    setCapsuleSaved(false);

    (async () => {
      const found = await fetchOutfitByDate(token, dateKey);
      if (cancelled) return;
      setOutfit(found);

      if (found) {
        const existing = await fetchAnalysis(dateKey);
        if (cancelled) return;
        setAnalysis(existing);
        setMoodTag(existing?.selectedTags ? existing.selectedTags.split(',')[0] : null);
        setReasonTags(existing?.reasonTags ? existing.reasonTags.split(',').filter(Boolean) : []);
        setTagsSaved(Boolean(existing?.selectedTags || existing?.reasonTags));
        setEditingTags(false);
        setFactBomb(existing?.factBomb ?? null);
      }

      const past = await fetchOutfitByDate(token, oneYearBefore(dateKey));
      if (!cancelled) setPastOutfit(past);
    })();

    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  useEffect(() => {
    let cancelled = false;
    setStyleTwin(null);
    setTwinOutfit(null);

    if (!analysis?.styleBreakdown) return;

    (async () => {
      const all = await fetchAllAnalysis();
      if (cancelled) return;
      const twin = findStyleTwin(dateKey, all);
      if (!twin) return;
      setStyleTwin(twin);
      const outfit = await fetchOutfitByDate(token, twin.recordDate);
      if (!cancelled) setTwinOutfit(outfit);
    })();

    return () => {
      cancelled = true;
    };
  }, [dateKey, analysis?.styleBreakdown]);

  async function handleAnalyze(force = false) {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await requestAnalysis(dateKey, force);
      setAnalysis(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleFactBomb(force = false) {
    if (factBomb && !force) {
      setShowFactBomb(true);
      return;
    }
    setIsFactBombing(true);
    setError(null);
    try {
      const result = await requestFactBomb(dateKey, force);
      setFactBomb(result.factBomb);
      setShowFactBomb(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsFactBombing(false);
    }
  }

  async function handleOpenChat() {
    setChatOpen(true);
    setChatError(null);
    try {
      const history = await fetchFactBombChat(dateKey);
      setChatMessages(history);
    } catch (e) {
      setChatError(e.message);
    }
  }

  async function handleSendChat() {
    const message = chatInput.trim();
    if (!message || isChatSending) return;
    setIsChatSending(true);
    setChatError(null);
    try {
      const updated = await sendFactBombChatMessage(dateKey, message);
      setChatMessages(updated);
      setChatInput('');
    } catch (e) {
      setChatError(e.message);
    } finally {
      setIsChatSending(false);
    }
  }

  async function handleSaveCapsule(months) {
    if (!capsuleMessage.trim()) return;
    setIsSavingCapsule(true);
    setError(null);
    try {
      await createTimeCapsule(dateKey, capsuleMessage.trim(), addMonths(dateKey, months));
      setCapsuleSaved(true);
      setCapsuleWriting(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSavingCapsule(false);
    }
  }

  function toggleReasonTag(tag) {
    setReasonTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSaveTags() {
    try {
      const result = await saveAnalysisTags(dateKey, moodTag ? [moodTag] : [], reasonTags);
      setAnalysis(result);
      setTagsSaved(true);
      setEditingTags(false);
    } catch (e) {
      setError(e.message);
    }
  }

  const categories = analysis
    ? parseBreakdown(analysis.styleBreakdown).slice().sort((a, b) => b.percent - a.percent)
    : [];

  return (
    <div>
      <div className="top-bar">
        <span style={{ width: 36 }} />
        <span className="analysis-top-bar-title">나의 옷장</span>
        <span style={{ width: 36 }} />
      </div>

      <div className="page">
        <div className="month-header">
          <button className="month-nav-btn" onClick={onBack}>
            <span className="material-symbol">arrow_back</span>
          </button>
          <span className="month-label">{dateKey}</span>
          <span style={{ width: 40 }} />
        </div>

        {outfit === undefined && <div className="page-center">불러오는 중...</div>}

        {outfit === null && (
          <div className="page-center">
            <p className="text-soft">이 날짜엔 기록이 없어요. 캘린더에서 먼저 기록을 남겨주세요 🌱</p>
          </div>
        )}

        {outfit && (
          <>
            <div className="analysis-photo-card">
              <img src={photoUrl(outfit.photoPath)} alt="오늘의 코디" />
              <span className="analysis-date-pill">{outfit.recordDate}</span>
              {isAnalyzing && (
                <div className="scan-overlay">
                  <div className="scan-line" />
                  <span className="scan-label">AI 분석 중...</span>
                </div>
              )}
            </div>

            <div className="blob-card" style={{ marginTop: 20 }}>
              <span className="blob-card-heading">
                <span className="material-symbol">auto_awesome</span>
                AI 스타일 분석
              </span>

              {!analysis?.styleBreakdown && (
                <button className="report-btn-primary" onClick={() => handleAnalyze(false)} disabled={isAnalyzing}>
                  {isAnalyzing ? '분석 중...' : 'AI로 분석하기'}
                </button>
              )}

              {error && <p className="error-text">{error}</p>}

              {analysis && categories.length > 0 && (
                <div className="style-bar-list">
                  {categories.map((c, i) => (
                    <div key={c.name} className="style-bar-row">
                      <div className="style-bar-top">
                        <span className="style-bar-label">{c.name}</span>
                        <div className="style-bar-track">
                          <div
                            className="style-bar-fill"
                            style={{
                              '--target-width': `${c.percent}%`,
                              background: i === 0 ? 'var(--ink)' : i === 1 ? '#767961' : '#c6c9ad',
                            }}
                          />
                        </div>
                        <span className="style-bar-percent">{c.percent}%</span>
                      </div>
                      {c.reason && <p className="style-bar-reason">{c.reason}</p>}
                    </div>
                  ))}
                </div>
              )}

              {analysis?.styleBreakdown && categories.length === 0 && (
                <p className="text-soft">분석 결과를 해석할 수 없었어요. 다시 시도해주세요.</p>
              )}

              {analysis?.styleBreakdown && (
                <button
                  className="report-btn-secondary"
                  onClick={() => handleAnalyze(true)}
                  disabled={isAnalyzing}
                >
                  <span className="material-symbol">refresh</span>
                  {isAnalyzing ? '재분석 중...' : 'AI 분석 다시하기'}
                </button>
              )}
            </div>

            {styleTwin && twinOutfit && (
              <div className="blob-card" style={{ marginTop: 20 }}>
                <span className="blob-card-heading">
                  <span className="material-symbol">diversity_1</span>
                  나의 스타일 트윈
                </span>
                <p className="text-soft" style={{ margin: '0 0 4px', fontSize: 13 }}>
                  오늘이랑 제일 닮은 코디였던 날이에요
                </p>
                <div className="style-twin-row">
                  <img
                    src={photoUrl(twinOutfit.photoPath)}
                    alt={styleTwin.recordDate}
                    className="style-twin-thumb"
                  />
                  <div className="style-twin-info">
                    <span className="style-twin-date">{styleTwin.recordDate}</span>
                    <span className="style-twin-score">{styleTwin.score}% 닮음</span>
                  </div>
                </div>
              </div>
            )}

            {analysis && (
              <div className="blob-card" style={{ marginTop: 20 }}>
                <span className="blob-card-heading">
                  <span className="material-symbol">mood</span>
                  오늘 나의 스타일 평가
                </span>

                {tagsSaved && !editingTags ? (
                  <>
                    <div className="report-chip-row">
                      {moodTag && <span className="item-tag-chip">{moodTag}</span>}
                      {reasonTags.map((tag) => (
                        <span key={tag} className="item-tag-chip muted">
                          {tag}
                        </span>
                      ))}
                      {!moodTag && reasonTags.length === 0 && (
                        <p className="text-soft" style={{ margin: 0, fontSize: 14 }}>
                          선택한 평가가 없어요
                        </p>
                      )}
                    </div>
                    <button
                      className="report-btn-secondary"
                      style={{ marginTop: 8 }}
                      onClick={() => setEditingTags(true)}
                    >
                      <span className="material-symbol">edit</span>
                      수정하기
                    </button>
                  </>
                ) : (
                  <>
                    <div className="report-chip-grid">
                      {MOOD_TAGS.map((tag) => (
                        <button
                          key={tag}
                          className={`report-chip ${moodTag === tag ? 'selected' : ''}`}
                          onClick={() => setMoodTag(moodTag === tag ? null : tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <span className="blob-card-heading" style={{ marginTop: 8 }}>
                      별로였다면, 이유는?
                    </span>
                    <div className="report-chip-row">
                      {REASON_TAGS.map((tag) => (
                        <button
                          key={tag}
                          className={`report-chip pill ${reasonTags.includes(tag) ? 'selected' : ''}`}
                          onClick={() => toggleReasonTag(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <button className="report-btn-primary" style={{ marginTop: 8 }} onClick={handleSaveTags}>
                      저장하기
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="blob-card" style={{ marginTop: 20 }}>
              <span className="blob-card-heading">
                <span className="material-symbol">edit_note</span>
                오늘의 메모
              </span>
              <p style={{ margin: 0, fontSize: 16, color: 'var(--olive)' }}>
                {outfit.memo || <span className="text-soft">여기에 오늘의 코디 메모를 남겨보세요...</span>}
              </p>
            </div>

            <div className="blob-card" style={{ marginTop: 20 }}>
              <span className="blob-card-heading">
                <span className="material-symbol">schedule_send</span>
                스타일 타임캡슐
              </span>

              {capsuleSaved && (
                <p className="text-soft">미래의 나에게 타임캡슐을 보냈어요. 그날이 되면 다시 알려드릴게요!</p>
              )}

              {!capsuleSaved && !capsuleWriting && (
                <button className="report-btn-secondary" onClick={() => setCapsuleWriting(true)}>
                  <span className="material-symbol">edit</span>
                  미래의 나에게 메시지 남기기
                </button>
              )}

              {!capsuleSaved && capsuleWriting && (
                <>
                  <textarea
                    className="memo-input"
                    rows={2}
                    placeholder="예) 이때는 이런 스타일 좋아했었네, 지금은 어때?"
                    value={capsuleMessage}
                    onChange={(e) => setCapsuleMessage(e.target.value)}
                  />
                  <div className="report-chip-row" style={{ marginTop: 10 }}>
                    {CAPSULE_DURATIONS.map((d) => (
                      <button
                        key={d.months}
                        className="report-chip pill"
                        onClick={() => handleSaveCapsule(d.months)}
                        disabled={isSavingCapsule || !capsuleMessage.trim()}
                      >
                        {isSavingCapsule ? '저장 중...' : d.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: 20 }}>
              {!showFactBomb ? (
                <button
                  className="blob-card year-ago-card fact-bomb-trigger"
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => handleFactBomb(false)}
                  disabled={isFactBombing}
                >
                  <span className="material-symbol">bolt</span>
                  {isFactBombing ? '팩폭 맞을 준비해!' : '팩트폭력 받아보기'}
                </button>
              ) : (
                <div className="blob-card">
                  <span className="blob-card-heading">
                    <span className="material-symbol">bolt</span>
                    팩트폭력 결과
                  </span>
                  <p className="fact-bomb-text">{factBomb}</p>
                  <button
                    className="report-btn-secondary"
                    onClick={() => handleFactBomb(true)}
                    disabled={isFactBombing}
                  >
                    <span className="material-symbol">refresh</span>
                    {isFactBombing ? '다시 받는 중...' : '더 맵게 다시 받기'}
                  </button>
                  {!chatOpen && (
                    <button className="report-btn-secondary" onClick={handleOpenChat}>
                      <span className="material-symbol">forum</span>
                      팩폭상담사와 채팅하기
                    </button>
                  )}
                  {chatOpen && (
                    <div className="chat-panel">
                      <div className="chat-bubble-list">
                        <div className="chat-bubble assistant">{factBomb}</div>
                        {chatMessages.map((m) => (
                          <div key={m.id} className={`chat-bubble ${m.role}`}>
                            {m.content}
                          </div>
                        ))}
                        {isChatSending && (
                          <div className="chat-bubble assistant chat-bubble-loading">
                            상담사가 생각 중...
                          </div>
                        )}
                      </div>

                      {chatError && <p className="chat-error">{chatError}</p>}

                      {chatMessages.filter((m) => m.role === 'user').length >= MAX_CHAT_TURNS ? (
                        <p className="chat-turns-done">오늘 상담은 여기까지예요. 다음에 또 만나요!</p>
                      ) : (
                        <div className="chat-input-row">
                          <input
                            className="chat-input"
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendChat();
                            }}
                            placeholder="할 말 있으면 해봐"
                            disabled={isChatSending}
                          />
                          <button
                            className="chat-send-btn"
                            onClick={handleSendChat}
                            disabled={isChatSending || !chatInput.trim()}
                          >
                            <span className="material-symbol">send</span>
                          </button>
                        </div>
                      )}
                      <p className="chat-turns-hint">
                        {Math.min(chatMessages.filter((m) => m.role === 'user').length, MAX_CHAT_TURNS)}/{MAX_CHAT_TURNS}회 상담
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {pastOutfit !== undefined && (
              <div style={{ marginTop: 20 }}>
                {pastOutfit === null ? (
                  <div className="blob-card year-ago-card year-ago-empty">
                    <span className="material-symbol">history</span>
                    1년 전 오늘({oneYearBefore(dateKey)})은 아직 기록이 없어요
                  </div>
                ) : !showPastOutfit ? (
                  <button
                    className="blob-card year-ago-card"
                    style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => setShowPastOutfit(true)}
                  >
                    <span className="material-symbol">history</span>
                    1년 전 오늘, 어떤 코디였는지 보기
                  </button>
                ) : (
                  <div className="outfit-list-item">
                    <img src={photoUrl(pastOutfit.photoPath)} alt="1년 전 코디" className="outfit-list-thumb" />
                    <div className="outfit-list-info">
                      <span className="outfit-list-date">{pastOutfit.recordDate}</span>
                      <span className="text-soft outfit-list-memo">{pastOutfit.memo || '메모 없음'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
