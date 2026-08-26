import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FILTERS } from '../constants/filters';
import { registerOutfit, fetchOutfitsByDateAll, setMainOutfit, updateOutfitDetails, photoUrl } from '../api/outfitApi';
import { reverseGeocode, getCurrentLocation } from '../api/geoApi';
import { LOOK_CATEGORIES } from '../constants/lookCategories';
import { toDateKey } from '../utils/date';
import ShareSheet from './ShareSheet';

function filterCss(filterKey) {
  return FILTERS.find((f) => f.key === filterKey)?.css ?? 'none';
}

function TagChipInput({ tags, tagInput, onTagInputChange, onAddTag, onRemoveTag }) {
  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      onAddTag();
    }
  }

  return (
    <div className="memo-section">
      <label className="memo-label">아이템 태그</label>
      {tags.length > 0 && (
        <div className="item-tag-row" style={{ marginBottom: 10 }}>
          {tags.map((tag) => (
            <button key={tag} className="item-tag-chip removable" onClick={() => onRemoveTag(tag)}>
              {tag}
              <span className="material-symbol">close</span>
            </button>
          ))}
        </div>
      )}
      <input
        className="memo-input"
        type="text"
        placeholder="예) Outer - 니트가디건 (엔터로 추가, 없어도 저장 가능)"
        value={tagInput}
        onChange={(e) => onTagInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onAddTag}
      />
    </div>
  );
}

function LookCategoryPicker({ selected, onToggle }) {
  return (
    <div className="memo-section">
      <label className="memo-label">무슨 룩이에요? (여러 개 선택 가능)</label>
      {selected.length > 0 && (
        <p className="text-soft" style={{ margin: '0 0 8px', fontSize: 13 }}>
          {selected.join(', ')}
        </p>
      )}
      <div className="tag-row">
        {LOOK_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`tag-chip ${selected.includes(cat) ? 'selected' : ''}`}
            onClick={() => onToggle(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

function LocationInput({ location, onLocationChange, onUseMyLocation, isLocating }) {
  return (
    <div className="memo-section">
      <label className="memo-label">위치 (선택)</label>
      <div className="location-input-row">
        <input
          className="memo-input"
          type="text"
          placeholder="예) 홍대, 강남"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
        />
        <button type="button" className="location-use-btn" onClick={onUseMyLocation} disabled={isLocating}>
          <span className="material-symbol">near_me</span>
          {isLocating ? '확인 중' : '내 위치'}
        </button>
      </div>
    </div>
  );
}

export default function CaptureModal({ date, onClose, onSaved, initialMode }) {
  const dateKey = toDateKey(date);

  const [existingOutfits, setExistingOutfits] = useState(undefined);
  const [mode, setMode] = useState('add');

  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [filterKey, setFilterKey] = useState('ORIGINAL');
  const [memo, setMemo] = useState('');
  const [itemTags, setItemTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [lookCategories, setLookCategories] = useState([]);
  const [location, setLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editMemo, setEditMemo] = useState('');
  const [editItemTags, setEditItemTags] = useState([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [editLookCategories, setEditLookCategories] = useState([]);
  const [editLocation, setEditLocation] = useState('');
  const [isEditLocating, setIsEditLocating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [error, setError] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchOutfitsByDateAll(dateKey)
      .then((list) => {
        if (cancelled) return;
        setExistingOutfits(list);
        if (list.length === 0) {
          setMode('add');
          return;
        }
        if (initialMode === 'edit') {
          const main = list.find((o) => o.isMain === 1) ?? list[0];
          prefillEditState(main);
          setMode('edit');
        } else {
          setMode('view');
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const mainOutfit = existingOutfits?.find((o) => o.isMain === 1) ?? existingOutfits?.[0] ?? null;

  function prefillEditState(outfit) {
    setEditMemo(outfit?.memo || '');
    setEditItemTags(outfit?.itemTags ? outfit.itemTags.split(',').filter(Boolean) : []);
    setEditTagInput('');
    setEditLookCategories(outfit?.lookCategory ? outfit.lookCategory.split(',').filter(Boolean) : []);
    setEditLocation(outfit?.location || '');
    setError(null);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function addTag() {
    const value = tagInput.trim();
    if (!value || itemTags.includes(value)) {
      setTagInput('');
      return;
    }
    setItemTags((prev) => [...prev, value]);
    setTagInput('');
  }

  function removeTag(tag) {
    setItemTags((prev) => prev.filter((t) => t !== tag));
  }

  function toggleLookCategory(cat) {
    setLookCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function toggleEditLookCategory(cat) {
    setEditLookCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  async function handleUseMyLocation() {
    setIsLocating(true);
    setError(null);
    try {
      const { lat, lon } = await getCurrentLocation();
      const place = await reverseGeocode(lat, lon);
      setLocation(place || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLocating(false);
    }
  }

  async function handleUseMyLocationForEdit() {
    setIsEditLocating(true);
    setError(null);
    try {
      const { lat, lon } = await getCurrentLocation();
      const place = await reverseGeocode(lat, lon);
      setEditLocation(place || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsEditLocating(false);
    }
  }

  function addEditTag() {
    const value = editTagInput.trim();
    if (!value || editItemTags.includes(value)) {
      setEditTagInput('');
      return;
    }
    setEditItemTags((prev) => [...prev, value]);
    setEditTagInput('');
  }

  function removeEditTag(tag) {
    setEditItemTags((prev) => prev.filter((t) => t !== tag));
  }

  function startEditing() {
    prefillEditState(mainOutfit);
    setMode('edit');
  }

  async function handleSave() {
    if (!photoFile) {
      setError('사진을 먼저 선택해주세요');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const saved = await registerOutfit({
        recordDate: dateKey,
        filterType: filterKey,
        memo,
        itemTags: itemTags.join(','),
        lookCategory: lookCategories.join(','),
        location,
        photoFile,
      });
      const refreshed = await fetchOutfitsByDateAll(dateKey);
      setExistingOutfits(refreshed);
      setMode('view');
      setPhotoFile(null);
      setPreviewUrl(null);
      setFilterKey('ORIGINAL');
      setMemo('');
      setItemTags([]);
      setTagInput('');
      setLookCategories([]);
      setLocation('');
      onSaved(saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveEdit() {
    setIsSavingEdit(true);
    setError(null);
    try {
      const updated = await updateOutfitDetails(
        mainOutfit.id,
        editMemo,
        editItemTags.join(','),
        editLookCategories.join(','),
        editLocation,
      );
      const refreshed = await fetchOutfitsByDateAll(dateKey);
      setExistingOutfits(refreshed);
      setMode('view');
      onSaved(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleSetMain(id) {
    try {
      const refreshed = await setMainOutfit(id, dateKey);
      setExistingOutfits(refreshed);
      onSaved(refreshed);
    } catch (e) {
      setError(e.message);
    }
  }

  const isFormMode = mode === 'add' || mode === 'edit';
  const hasExisting = (existingOutfits?.length ?? 0) > 0;
  const titles = { add: '사진 추가', edit: '기록 수정' };

  return createPortal(
    <>
      <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {isFormMode && hasExisting ? (
            <button className="icon-btn" onClick={() => setMode('view')}>
              <span className="material-symbol">arrow_back</span>
            </button>
          ) : (
            <button className="icon-btn" onClick={onClose}>
              <span className="material-symbol">close</span>
            </button>
          )}
          <span className="modal-title">{titles[mode] ?? dateKey}</span>
          {mode === 'view' && mainOutfit ? (
            <button className="icon-btn" onClick={() => setShareOpen(true)}>
              <span className="material-symbol">share</span>
            </button>
          ) : (
            <span style={{ width: 36 }} />
          )}
        </div>

        <div className="modal-content">
          {existingOutfits === undefined && <div className="page-center">불러오는 중...</div>}

          {existingOutfits !== undefined && mode === 'view' && mainOutfit && (
            <>
              <div className="photo-drop" style={{ filter: filterCss(mainOutfit.filterType) }}>
                <img src={photoUrl(mainOutfit.photoPath)} alt="오늘의 코디" />
              </div>

              {existingOutfits.length > 1 && (
                <div className="photo-thumb-row">
                  {existingOutfits.map((o) => (
                    <button
                      key={o.id}
                      className={`photo-thumb ${o.id === mainOutfit.id ? 'active' : ''}`}
                      onClick={() => handleSetMain(o.id)}
                    >
                      <img src={photoUrl(o.photoPath)} alt="" style={{ filter: filterCss(o.filterType) }} />
                      {o.id === mainOutfit.id && <span className="photo-thumb-badge">메인</span>}
                    </button>
                  ))}
                </div>
              )}

              <div className="memo-section">
                <label className="memo-label">TODAY'S MEMO</label>
                <p className="modal-memo-display">
                  {mainOutfit.memo || <span className="text-soft">메모가 없어요</span>}
                </p>
              </div>

              <div className="memo-section">
                <label className="memo-label">아이템 태그</label>
                {mainOutfit.itemTags ? (
                  <div className="item-tag-row">
                    {mainOutfit.itemTags.split(',').filter(Boolean).map((tag) => (
                      <span key={tag} className="item-tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-soft" style={{ margin: 0, fontSize: 14 }}>
                    태그가 없어요
                  </p>
                )}
              </div>

              <div className="memo-section">
                <label className="memo-label">무슨 룩이에요?</label>
                {mainOutfit.lookCategory ? (
                  <div className="item-tag-row">
                    {mainOutfit.lookCategory.split(',').filter(Boolean).map((cat) => (
                      <span key={cat} className="item-tag-chip">
                        {cat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-soft" style={{ margin: 0, fontSize: 14 }}>
                    선택 안 함
                  </p>
                )}
              </div>

              <div className="memo-section">
                <label className="memo-label">위치</label>
                <p className="text-soft" style={{ margin: 0, fontSize: 14 }}>
                  {mainOutfit.location || '위치 없음'}
                </p>
              </div>

              {error && <p className="error-text">{error}</p>}

              <button className="report-btn-secondary" onClick={startEditing}>
                <span className="material-symbol">edit</span>
                수정하기
              </button>

              <button className="secondary-button" onClick={() => setMode('add')}>
                <span className="material-symbol">add_a_photo</span>
                사진 추가하기
              </button>
            </>
          )}

          {existingOutfits !== undefined && mode === 'edit' && mainOutfit && (
            <>
              <div className="photo-drop" style={{ filter: filterCss(mainOutfit.filterType) }}>
                <img src={photoUrl(mainOutfit.photoPath)} alt="오늘의 코디" />
              </div>

              <div className="memo-section">
                <label className="memo-label">TODAY'S MEMO</label>
                <textarea
                  className="memo-input"
                  rows={2}
                  placeholder="예) 친구와 카페 갈 때 입은 캐주얼 룩"
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                />
              </div>

              <TagChipInput
                tags={editItemTags}
                tagInput={editTagInput}
                onTagInputChange={setEditTagInput}
                onAddTag={addEditTag}
                onRemoveTag={removeEditTag}
              />

              <LookCategoryPicker selected={editLookCategories} onToggle={toggleEditLookCategory} />

              <LocationInput
                location={editLocation}
                onLocationChange={setEditLocation}
                onUseMyLocation={handleUseMyLocationForEdit}
                isLocating={isEditLocating}
              />

              {error && <p className="error-text">{error}</p>}

              <button className="primary-button" onClick={handleSaveEdit} disabled={isSavingEdit}>
                {isSavingEdit ? '저장 중...' : '저장하기'}
              </button>
            </>
          )}

          {existingOutfits !== undefined && mode === 'add' && (
            <>
              <label className="photo-drop" style={{ filter: previewUrl ? filterCss(filterKey) : 'none' }}>
                {previewUrl ? (
                  <img src={previewUrl} alt="선택한 사진" />
                ) : (
                  <div className="photo-drop-placeholder">
                    <span className="material-symbol">photo_camera</span>
                    <span className="text-soft">사진을 추가해주세요</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} hidden />
              </label>

              <div className="filter-row">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    className={`filter-swatch ${filterKey === filter.key ? 'selected' : ''}`}
                    onClick={() => setFilterKey(filter.key)}
                  >
                    <span className="filter-swatch-box" style={{ filter: filter.css }} />
                    <span className="filter-swatch-label">{filter.label}</span>
                  </button>
                ))}
              </div>

              <div className="memo-section">
                <label className="memo-label">TODAY'S MEMO</label>
                <textarea
                  className="memo-input"
                  rows={2}
                  placeholder="예) 친구와 카페 갈 때 입은 캐주얼 룩"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>

              <TagChipInput
                tags={itemTags}
                tagInput={tagInput}
                onTagInputChange={setTagInput}
                onAddTag={addTag}
                onRemoveTag={removeTag}
              />

              <LookCategoryPicker selected={lookCategories} onToggle={toggleLookCategory} />

              <LocationInput
                location={location}
                onLocationChange={setLocation}
                onUseMyLocation={handleUseMyLocation}
                isLocating={isLocating}
              />

              {error && <p className="error-text">{error}</p>}

              <button className="primary-button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </>
          )}
        </div>
      </div>
      </div>

      {shareOpen && <ShareSheet outfit={mainOutfit} onClose={() => setShareOpen(false)} />}
    </>,
    document.body,
  );
}
