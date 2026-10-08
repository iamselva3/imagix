import React, { useState, useEffect, useRef } from 'react';

export default function Lightbox({ photos, index, onClose, onStep }) {
  const [zoom, setZoom] = useState(1);
  const touchStartRef = useRef(null);
  const pointersRef = useRef(new Map());

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onStep(-1);
      if (e.key === 'ArrowRight') onStep(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onStep]);

  // Reset zoom on index change
  useEffect(() => {
    setZoom(1);
  }, [index]);

  const photo = photos[index];
  if (!photo) return null;

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    touchStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (pointersRef.current.size >= 2) {
      const points = Array.from(pointersRef.current.values());
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      setZoom(Math.max(1, Math.min(3, dist / 180)));
    }
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e) => {
    if (pointersRef.current.size === 1 && zoom === 1 && touchStartRef.current) {
      const deltaX = e.clientX - touchStartRef.current.x;
      if (Math.abs(deltaX) > 45) {
        onStep(deltaX < 0 ? 1 : -1);
      }
    }
    pointersRef.current.delete(e.pointerId);
  };

  const handleWheel = (e) => {
    if (photo.isVideo) return;
    e.preventDefault();
    setZoom((prev) => Math.max(1, Math.min(3, prev + (e.deltaY < 0 ? 0.2 : -0.2))));
  };

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="High resolution photography viewer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        className="lightbox-close"
        onClick={onClose}
        aria-label="Close photo viewer (Escape)"
      >
        ✕
      </button>

      <button
        className="lightbox-arrow prev"
        onClick={() => onStep(-1)}
        aria-label="Previous image (Left arrow)"
      >
        ←
      </button>

      <figure>
        {photo.isVideo ? (
          <video
            src={photo.videoUrl || photo.url}
            controls
            autoPlay
            playsInline
            className="lightbox-media-video"
          />
        ) : (
          <img
            src={photo.url}
            alt={photo.alt || photo.title || photo.category}
            style={{ transform: `scale(${zoom})` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          />
        )}
        <figcaption>
          <strong>{photo.title || `${photo.category} Collection`}</strong>
          <span>
            {String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
          </span>
        </figcaption>
      </figure>

      <button
        className="lightbox-arrow next"
        onClick={() => onStep(1)}
        aria-label="Next image (Right arrow)"
      >
        →
      </button>
    </div>
  );
}
