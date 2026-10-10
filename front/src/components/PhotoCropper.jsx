import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const OUTPUT_WIDTH = 960;
const OUTPUT_HEIGHT = 1280; // 3:4, matches .photo-crop-frame aspect ratio

const PhotoCropper = forwardRef(function PhotoCropper({ src, filterCss = 'none' }, ref) {
  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);

  const [naturalSize, setNaturalSize] = useState(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNaturalSize(null);
  }, [src]);

  function clamp(nextOffset, effectiveScale, size) {
    if (!size || !frameRef.current) return nextOffset;
    const fw = frameRef.current.clientWidth;
    const fh = frameRef.current.clientHeight;
    const dispW = size.w * effectiveScale;
    const dispH = size.h * effectiveScale;
    const maxX = Math.max(0, (dispW - fw) / 2);
    const maxY = Math.max(0, (dispH - fh) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
      y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
    };
  }

  function handleImgLoad(e) {
    const img = e.target;
    const size = { w: img.naturalWidth, h: img.naturalHeight };
    const frame = frameRef.current;
    const scale = frame ? Math.max(frame.clientWidth / size.w, frame.clientHeight / size.h) : 1;
    setNaturalSize(size);
    setBaseScale(scale);
    setOffset({ x: 0, y: 0 });
  }

  function handlePointerDown(e) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: offset };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragRef.current || !naturalSize) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const next = { x: dragRef.current.origin.x + dx, y: dragRef.current.origin.y + dy };
    setOffset(clamp(next, baseScale * zoom, naturalSize));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleZoomChange(e) {
    const nextZoom = Number(e.target.value);
    setZoom(nextZoom);
    if (naturalSize) {
      setOffset((prev) => clamp(prev, baseScale * nextZoom, naturalSize));
    }
  }

  useImperativeHandle(ref, () => ({
    exportCroppedFile(filename = 'outfit.jpg') {
      return new Promise((resolve, reject) => {
        if (!naturalSize || !frameRef.current || !imgRef.current) {
          reject(new Error('이미지를 불러오지 못했어요'));
          return;
        }
        const fw = frameRef.current.clientWidth;
        const ratio = OUTPUT_WIDTH / fw;
        const effectiveScale = baseScale * zoom;
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_WIDTH;
        canvas.height = OUTPUT_HEIGHT;
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(OUTPUT_WIDTH / 2 + offset.x * ratio, OUTPUT_HEIGHT / 2 + offset.y * ratio);
        ctx.scale(effectiveScale * ratio, effectiveScale * ratio);
        ctx.drawImage(imgRef.current, -naturalSize.w / 2, -naturalSize.h / 2);
        ctx.restore();
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('이미지 변환에 실패했어요'));
            return;
          }
          resolve(new File([blob], filename, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.92);
      });
    },
  }));

  const displayWidth = naturalSize ? naturalSize.w * baseScale * zoom : 0;
  const displayHeight = naturalSize ? naturalSize.h * baseScale * zoom : 0;

  return (
    <div className="photo-crop-wrap">
      <div
        className="photo-crop-frame"
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <img
          ref={imgRef}
          src={src}
          alt="업로드한 사진"
          crossOrigin="anonymous"
          draggable={false}
          onLoad={handleImgLoad}
          style={{
            filter: filterCss,
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: displayWidth || 'auto',
            height: displayHeight || 'auto',
            maxWidth: 'none',
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
          }}
        />
      </div>
      <div className="photo-crop-zoom-row">
        <span className="material-symbol">photo_size_select_small</span>
        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={zoom}
          onChange={handleZoomChange}
          className="photo-crop-zoom-slider"
        />
        <span className="material-symbol">photo_size_select_large</span>
      </div>
      <p className="text-soft photo-crop-hint">드래그해서 위치를 옮기고, 슬라이더로 크기를 조절하세요</p>
    </div>
  );
});

export default PhotoCropper;
