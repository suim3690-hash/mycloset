import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchMagazine } from '../api/magazineApi';
import { CATEGORY_COLORS } from '../constants/magazineCategories';
import { LOOK_CATEGORIES } from '../constants/lookCategories';
import CaptureModal from './CaptureModal';

const QUICK_CATEGORIES = ['스트릿룩', '클래식룩', '미니멀룩'];
const PAGE_SIZE = 6;
const MAX_PAGES = 5;

export default function MagazinePage() {
  const [selected, setSelected] = useState(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [articles, setArticles] = useState(undefined);
  const [bookmarked, setBookmarked] = useState(new Set());
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [captureOpen, setCaptureOpen] = useState(false);

  const selectedKey = useMemo(() => Array.from(selected).sort().join(','), [selected]);

  const visibleCategories = useMemo(() => {
    const extra = Array.from(selected).filter((c) => !QUICK_CATEGORIES.includes(c));
    return [...QUICK_CATEGORIES, ...extra];
  }, [selected]);

  useEffect(() => {
    let cancelled = false;
    setArticles(undefined);
    setError(null);
    setPage(1);

    fetchMagazine(Array.from(selected))
      .then((data) => {
        if (!cancelled) setArticles(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  const pageCount = articles ? Math.min(Math.ceil(articles.length / PAGE_SIZE), MAX_PAGES) : 0;
  const pagedArticles = articles ? articles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : [];

  function toggleCategory(cat) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function toggleBookmark(e, id) {
    e.stopPropagation();
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openArticle(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div>
      <div className="top-bar">
        <button className="icon-btn" onClick={() => setCaptureOpen(true)}>
          <span className="material-symbol">edit_note</span>
        </button>
        <span className="top-bar-title">나의 옷장</span>
        <button className="icon-btn" onClick={() => setPickerOpen(true)}>
          <span className="material-symbol">menu</span>
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
          {visibleCategories.map((c) => (
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

        {articles === undefined && <div className="page-center">불러오는 중...</div>}
        {error && <p className="error-text">{error}</p>}

        {articles && articles.length === 0 && (
          <div className="page-center">
            <p className="text-soft">이 룩엔 아직 기사가 없어요</p>
          </div>
        )}

        {articles && articles.length > 0 && (
          <div className="magazine-feed">
            {pagedArticles.map((article) => (
              <div
                key={article.id}
                className="magazine-card"
                onClick={() => openArticle(article.sourceUrl)}
              >
                <div className="magazine-card-photo">
                  {article.imageUrl ? (
                    <img src={article.imageUrl} alt={article.title} />
                  ) : (
                    <span className="material-symbol">image</span>
                  )}
                </div>
                <button
                  className="magazine-bookmark"
                  onClick={(e) => toggleBookmark(e, article.id)}
                >
                  <span className="material-symbol" style={{ fontVariationSettings: bookmarked.has(article.id) ? "'FILL' 1" : "'FILL' 0" }}>
                    bookmark
                  </span>
                </button>
                <div className="magazine-card-body">
                  <span
                    className="magazine-category-label"
                    style={{ color: CATEGORY_COLORS[article.category] ?? 'var(--olive)' }}
                  >
                    {article.category}
                  </span>
                  <h3 className="magazine-title">{article.title}</h3>
                  <p className="magazine-summary">{article.summaryKo}</p>
                  <span className="magazine-source">{article.sourceName}에서 보기 →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <div className="magazine-pagination">
            <button
              className="magazine-page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <span className="material-symbol">chevron_left</span>
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`magazine-page-btn ${p === page ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="magazine-page-btn"
              disabled={page === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              <span className="material-symbol">chevron_right</span>
            </button>
          </div>
        )}
      </div>

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

      {captureOpen && (
        <CaptureModal date={new Date()} onClose={() => setCaptureOpen(false)} onSaved={() => setCaptureOpen(false)} />
      )}
    </div>
  );
}
