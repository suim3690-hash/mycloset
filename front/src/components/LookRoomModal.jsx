import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchRoom, fetchRoomMessages, joinRoom, leaveRoom, sendRoomMessage } from '../api/roomApi';

const POLL_INTERVAL_MS = 4000;

export default function LookRoomModal({ lookCategory, user, token, onClose, onMembershipChanged }) {
  const [memberCount, setMemberCount] = useState(0);
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const listRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const [room, msgs] = await Promise.all([
          fetchRoom(lookCategory, token),
          fetchRoomMessages(lookCategory),
        ]);
        if (cancelled) return;
        setMemberCount(room.memberCount);
        setJoined(room.joined);
        setMessages(msgs);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    }

    loadAll();
    const interval = setInterval(async () => {
      try {
        const msgs = await fetchRoomMessages(lookCategory);
        if (!cancelled) setMessages(msgs);
      } catch {
        // ignore transient polling errors
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [lookCategory, token]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleJoin() {
    setIsJoining(true);
    setError(null);
    try {
      const room = await joinRoom(lookCategory, token);
      setMemberCount(room.memberCount);
      setJoined(room.joined);
      onMembershipChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setIsJoining(false);
    }
  }

  async function handleLeave() {
    try {
      const room = await leaveRoom(lookCategory, token);
      setMemberCount(room.memberCount);
      setJoined(room.joined);
      onMembershipChanged?.();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSend() {
    const content = messageInput.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const updated = await sendRoomMessage(lookCategory, token, content);
      setMessages(updated);
      setMessageInput('');
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet room-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="icon-btn" onClick={onClose}>
            <span className="material-symbol">close</span>
          </button>
          <span className="modal-title">{lookCategory}</span>
          <span className="room-member-count">
            <span className="material-symbol">group</span>
            {memberCount}명
          </span>
        </div>

        <div className="room-modal-body">
          <div className="chat-bubble-list room-message-list" ref={listRef}>
            {messages.length === 0 && (
              <p className="text-soft" style={{ textAlign: 'center', padding: '20px 0' }}>
                아직 대화가 없어요. 첫 메시지를 남겨보세요!
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.userId === user.id ? 'mine' : 'theirs'}`}>
                {m.userId !== user.id && <span className="room-message-sender">{m.senderName}</span>}
                {m.content}
              </div>
            ))}
          </div>

          {error && <p className="chat-error">{error}</p>}

          {!joined ? (
            <button className="report-btn-primary" onClick={handleJoin} disabled={isJoining}>
              {isJoining ? '참가하는 중...' : `${lookCategory} 방 참가하기`}
            </button>
          ) : (
            <>
              <div className="chat-input-row">
                <input
                  className="chat-input"
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder="메시지를 남겨보세요"
                  disabled={isSending}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSend}
                  disabled={isSending || !messageInput.trim()}
                >
                  <span className="material-symbol">send</span>
                </button>
              </div>
              <button className="room-leave-btn" onClick={handleLeave}>
                방 나가기
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
