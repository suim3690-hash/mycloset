import { useEffect, useRef, useState } from 'react';
import { sendKlongMessage, fetchKlongRecommendation } from '../api/klongApi';

const WELCOME_MESSAGE = '안녕! 나는 클롱이야. 오늘 스타일 고민 있으면 편하게 물어봐 😊 아니면 아래 버튼으로 다른 브랜드 아이템도 추천해줄 수 있어!';

export default function KlongChatPage({ token, onBack }) {
  const [messages, setMessages] = useState([{ role: 'assistant', type: 'text', content: WELCOME_MESSAGE }]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [error, setError] = useState(null);

  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function buildHistory(list) {
    return list
      .filter((m) => m.type === 'text')
      .map((m) => ({ role: m.role, content: m.content }));
  }

  async function handleSend() {
    const content = input.trim();
    if (!content || isSending) return;
    setError(null);
    const nextMessages = [...messages, { role: 'user', type: 'text', content }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);
    try {
      const { reply } = await sendKlongMessage(buildHistory(messages), content);
      setMessages((prev) => [...prev, { role: 'assistant', type: 'text', content: reply }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  }

  async function handleRecommend() {
    if (isRecommending) return;
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', type: 'text', content: '다른 옷 추천받기' }]);
    setIsRecommending(true);
    try {
      const { result } = await fetchKlongRecommendation(token);
      const parsed = JSON.parse(result);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', type: 'recommendations', content: parsed.recommendations ?? [] },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsRecommending(false);
    }
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
          <span className="month-label">클롱과 대화하기</span>
          <span style={{ width: 40 }} />
        </div>

        <div className="chat-panel">
          <div className="chat-bubble-list klong-message-list" ref={listRef}>
            {messages.map((m, i) => {
              if (m.type === 'recommendations') {
                return (
                  <div key={i} className="klong-recommend-list">
                    {m.content.length === 0 && (
                      <div className="chat-bubble theirs">추천할 아이템을 찾지 못했어</div>
                    )}
                    {m.content.map((rec, j) => (
                      <div key={j} className="klong-recommend-card">
                        <span className="klong-recommend-swatch" style={{ background: rec.colorHex || '#e5e7eb' }}>
                          <span className="material-symbol">checkroom</span>
                        </span>
                        <div className="klong-recommend-info">
                          <span className="klong-recommend-brand">{rec.brand}</span>
                          <span className="klong-recommend-item">{rec.item}</span>
                          <p className="klong-recommend-reason">{rec.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div key={i} className={`chat-bubble ${m.role === 'user' ? 'mine' : 'theirs'}`}>
                  {m.content}
                </div>
              );
            })}
            {(isSending || isRecommending) && (
              <div className="chat-bubble theirs chat-bubble-loading">클롱이 생각 중...</div>
            )}
          </div>

          {error && <p className="chat-error">{error}</p>}

          <button className="report-btn-secondary" onClick={handleRecommend} disabled={isRecommending}>
            <span className="material-symbol">storefront</span>
            {isRecommending ? '추천을 준비하는 중...' : '다른 옷 추천받기'}
          </button>

          <div className="chat-input-row">
            <input
              className="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="클롱에게 물어보기"
              disabled={isSending}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={isSending || !input.trim()}>
              <span className="material-symbol">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
