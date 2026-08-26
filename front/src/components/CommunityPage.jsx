import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchOutfits, photoUrl, setOutfitLiked, setOutfitSaved, fetchComments, addComment } from '../api/outfitApi';
import { fetchRoomCounts } from '../api/roomApi';
import { LOOK_CATEGORIES } from '../constants/lookCategories';
import CaptureModal from './CaptureModal';
import LookRoomModal from './LookRoomModal';
import SharePicker from './SharePicker';

const QUICK_CATEGORIES = ['미니멀룩', '클래식룩', '스트릿룩'];

function parseRecordDate(recordDate) {
  const [y, m, d] = recordDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function timeAgo(createdAt) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return '방금 전';
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function renderCaption(memo) {
  const parts = memo.split(/(#\S+)/g);
  return parts.map((part, i) =>
    part.startsWith('#') ? (
      <span key={i} className="community-hashtag">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function CommunityCard({ outfit, user, token, onViewUser, onChanged }) {
  const isOwner = user && outfit.userId === user.id;
  const [likeCount, setLikeCount] = useState(outfit.likeCount ?? 0);
  const [liked, setLiked] = useState(outfit.isLiked === 1);
  const [saved, setSaved] = useState(outfit.isSaved === 1);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(undefined);
  const [commentInput, setCommentInput] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function handleToggleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((n) => n + (next ? 1 : -1));
    try {
      await setOutfitLiked(outfit.id, next);
    } catch {
      setLiked(!next);
      setLikeCount((n) => n + (next ? -1 : 1));
    }
  }

  async function handleToggleSave() {
    const next = !saved;
    setSaved(next);
    try {
      await setOutfitSaved(outfit.id, next);
      onChanged();
    } catch {
      setSaved(!next);
    }
  }

  async function handleToggleComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments === undefined) {
      try {
        setComments(await fetchComments(outfit.id));
      } catch {
        setComments([]);
      }
    }
  }

  async function handlePostComment() {
    if (!commentInput.trim()) return;
    setIsPostingComment(true);
    try {
      const updated = await addComment(outfit.id, commentInput.trim());
      setComments(updated);
      setCommentInput('');
    } catch {
      // no-op, keep input so user can retry
    } finally {
      setIsPostingComment(false);
    }
  }

  return (
    <article className="community-card">
      <div className="community-photo">
        <img src={photoUrl(outfit.photoPath)} alt={outfit.recordDate} />

        {outfit.lookCategory && (
          <div className="community-look-badges-overlay">
            {outfit.lookCategory.split(',').filter(Boolean).map((cat) => (
              <span key={cat} className="community-look-badge">
                {cat}
              </span>
            ))}
          </div>
        )}

        {isOwner && (
          <button className="community-edit-icon-btn" onClick={() => setEditOpen(true)} aria-label="수정">
            <span className="material-symbol">edit</span>
          </button>
        )}

        {outfit.itemTags && (
          <div className="community-tag-overlay">
            {outfit.itemTags.split(',').filter(Boolean).map((tag) => (
              <span key={tag} className="community-tag-pill">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="community-photo-actions">
          <button className="community-photo-action" onClick={handleToggleLike}>
            <span
              className="material-symbol"
              style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0", color: liked ? '#ff4d5e' : '#fff' }}
            >
              favorite
            </span>
            <span className="community-photo-action-count">{likeCount}</span>
          </button>
          <button className="community-photo-action" onClick={handleToggleComments}>
            <span className="material-symbol">chat_bubble_outline</span>
            <span className="community-photo-action-count">{comments?.length ?? ''}</span>
          </button>
          <button className="community-photo-action" onClick={handleToggleSave}>
            <span className="material-symbol" style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>
              bookmark
            </span>
          </button>
        </div>
      </div>

      <div className="community-post-meta">
        <button className="community-post-user-btn" onClick={() => onViewUser(outfit.userId)}>
          <span className="community-avatar">
            {outfit.authorAvatarPath ? (
              <img src={photoUrl(outfit.authorAvatarPath)} alt={outfit.authorDisplayName} />
            ) : (
              <span className="material-symbol">checkroom</span>
            )}
          </span>
          <span className="community-username">{outfit.authorDisplayName ?? '나의 옷장'}</span>
        </button>
        <span className="community-time">
          {timeAgo(outfit.createdAt)}
          {outfit.location && ` · ${outfit.location}`}
        </span>
      </div>

      {outfit.memo && <p className="community-caption">{renderCaption(outfit.memo)}</p>}

      {commentsOpen && (
        <div className="community-comments">
          {comments === undefined && <p className="text-soft" style={{ fontSize: 13 }}>불러오는 중...</p>}
          {comments?.length === 0 && (
            <p className="text-soft" style={{ fontSize: 13 }}>첫 댓글을 남겨보세요!</p>
          )}
          {comments?.map((c) => (
            <div key={c.id} className="community-comment-row">
              <span className="community-comment-content">{c.content}</span>
              <span className="community-comment-time">
                {new Date(c.createdAt).toLocaleString('ko-KR', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
          <div className="community-comment-input-row">
            <input
              className="memo-input"
              type="text"
              placeholder="댓글을 남겨보세요"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
            />
            <button className="location-use-btn" onClick={handlePostComment} disabled={isPostingComment}>
              등록
            </button>
          </div>
        </div>
      )}

      {editOpen && (
        <CaptureModal
          date={parseRecordDate(outfit.recordDate)}
          token={token}
          initialMode="edit"
          onClose={() => setEditOpen(false)}
          onSaved={onChanged}
        />
      )}
    </article>
  );
}

export default function CommunityPage({ user, token, onOpenProfile, onViewUser }) {
  const [outfits, setOutfits] = useState(undefined);
  const [selected, setSelected] = useState(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [roomCounts, setRoomCounts] = useState({});
  const [activeRoom, setActiveRoom] = useState(null);

  function loadOutfits() {
    fetchOutfits()
      .then(setOutfits)
      .catch(() => setOutfits([]));
  }

  function loadRoomCounts() {
    fetchRoomCounts()
      .then((rooms) => {
        const map = {};
        rooms.forEach((r) => {
          map[r.lookCategory] = r.memberCount;
        });
        setRoomCounts(map);
      })
      .catch(() => setRoomCounts({}));
  }

  useEffect(() => {
    loadOutfits();
    loadRoomCounts();
  }, []);

  function toggleCategory(cat) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const visiblePosts = useMemo(() => {
    if (!outfits) return [];
    if (selected.size === 0) return outfits;
    return outfits.filter((o) => {
      const postCategories = o.lookCategory ? o.lookCategory.split(',').filter(Boolean) : [];
      return (
        postCategories.some((cat) => selected.has(cat)) ||
        Array.from(selected).some((cat) => (o.memo ?? '').includes(`#${cat}`))
      );
    });
  }, [outfits, selected]);

  return (
    <div>
      <div className="top-bar">
        <button className="icon-btn" onClick={() => setUploadOpen(true)}>
          <span className="material-symbol">menu</span>
        </button>
        <span className="top-bar-title">나의 옷장</span>
        <button className="icon-btn" onClick={onOpenProfile}>
          <span className="material-symbol">settings</span>
        </button>
      </div>

      <div className="page">
        <div className="category-row">
          <button
            className={`category-pill ${selected.size === 0 ? 'active' : ''}`}
            onClick={() => setSelected(new Set())}
          >
            ALL
          </button>
          {QUICK_CATEGORIES.map((c) => (
            <button
              key={c}
              className={`category-pill ${selected.has(c) ? 'active' : ''}`}
              onClick={() => toggleCategory(c)}
            >
              {c}
            </button>
          ))}
          <button className="category-pill category-pill-add" onClick={() => setPickerOpen(true)}>
            <span className="material-symbol">add</span>
          </button>
        </div>

        {selected.size > 0 && (
          <div className="selected-summary">
            {selected.size}개 룩 선택됨 · {Array.from(selected).join(', ')}
          </div>
        )}

        <div className="room-row">
          {[...LOOK_CATEGORIES]
            .sort((a, b) => (roomCounts[b] ?? 0) - (roomCounts[a] ?? 0))
            .map((cat) => (
              <button key={cat} className="room-pill" onClick={() => setActiveRoom(cat)}>
                <span className="material-symbol">forum</span>
                {cat} 방
                <span className="room-pill-count">{roomCounts[cat] ?? 0}명</span>
              </button>
            ))}
        </div>

        {outfits === undefined && <div className="page-center">불러오는 중...</div>}

        {outfits && visiblePosts.length === 0 && (
          <div className="page-center">
            <p className="text-soft">
              {outfits.length === 0
                ? '커뮤니티에 공유된 코디가 아직 없어요. 우측 하단 + 버튼으로 캘린더 기록을 공유해보세요 🌱'
                : '이 룩엔 아직 게시물이 없어요'}
            </p>
          </div>
        )}

        {outfits && visiblePosts.length > 0 && (
          <div className="community-feed">
            {visiblePosts.map((outfit) => (
              <CommunityCard
                key={outfit.id}
                outfit={outfit}
                user={user}
                token={token}
                onViewUser={onViewUser}
                onChanged={loadOutfits}
              />
            ))}
          </div>
        )}
      </div>

      <button className="fab-round" onClick={() => setUploadOpen(true)}>
        <span className="material-symbol">add</span>
      </button>

      {pickerOpen && createPortal(
        <div className="modal-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="icon-btn" onClick={() => setPickerOpen(false)}>
                <span className="material-symbol">close</span>
              </button>
              <span className="modal-title">원하는 룩 선택</span>
              <span style={{ width: 36 }} />
            </div>
            <div className="modal-content">
              <div className="tag-row">
                {LOOK_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`tag-chip ${selected.has(cat) ? 'selected' : ''}`}
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button className="primary-button" onClick={() => setPickerOpen(false)}>
                적용
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {uploadOpen && (
        <SharePicker token={token} onClose={() => setUploadOpen(false)} onShared={loadOutfits} />
      )}

      {activeRoom && (
        <LookRoomModal
          lookCategory={activeRoom}
          user={user}
          token={token}
          onClose={() => setActiveRoom(null)}
          onMembershipChanged={loadRoomCounts}
        />
      )}
    </div>
  );
}
