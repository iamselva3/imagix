import React, { useState, useMemo, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { CATEGORIES } from '../data/photographyData';
import Lightbox from './Lightbox';

gsap.registerPlugin(Flip);

const FILTER_TABS = ['All', ...CATEGORIES.map((c) => c.name)];

export default function Gallery({ photos = [], onImageLoad, selectedCategory, onCategoryChange, content }) {
  const [filter, setFilter] = useState(selectedCategory || 'All');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const gridRef = useRef(null);
  const previousFlipState = useRef(null);

  const eyebrow = content?.eyebrow || 'THE GALLERY 02 / 06';
  const heading = content?.heading || 'A little peek.';
  const subheading = content?.subheading || 'Real laughter, quiet tears, and timeless frames from couples and families who trusted us with their sacred moments.';

  // Sync if parent updates selectedCategory
  useEffect(() => {
    if (selectedCategory && selectedCategory !== filter) {
      if (gridRef.current) {
        previousFlipState.current = Flip.getState(gridRef.current.children);
      }
      setFilter(selectedCategory);
    }
  }, [selectedCategory]);

  // Listen to custom event for filter triggers from other sections
  useEffect(() => {
    const handleFilterEvent = (e) => {
      if (e.detail && FILTER_TABS.includes(e.detail)) {
        if (gridRef.current) {
          previousFlipState.current = Flip.getState(gridRef.current.children);
        }
        setFilter(e.detail);
        if (onCategoryChange) onCategoryChange(e.detail);
      }
    };
    document.addEventListener('imagix-filter-gallery', handleFilterEvent);
    return () => document.removeEventListener('imagix-filter-gallery', handleFilterEvent);
  }, [onCategoryChange]);

  const filteredPhotos = useMemo(() => {
    if (filter === 'All') return photos;
    return photos.filter((p) => p.category === filter);
  }, [photos, filter]);

  // Smooth Flip animation when filter changes
  useLayoutEffect(() => {
    if (!previousFlipState.current || !gridRef.current) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      previousFlipState.current = null;
      return;
    }

    Flip.from(previousFlipState.current, {
      duration: 0.55,
      ease: 'power2.inOut',
      absolute: true,
      stagger: 0.02,
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }
        ),
      onLeave: (elements) =>
        gsap.to(elements, { opacity: 0, scale: 0.94, duration: 0.3, ease: 'power2.in' }),
    });

    previousFlipState.current = null;
  }, [filter]);

  const handleSelectFilter = (categoryName) => {
    if (gridRef.current) {
      previousFlipState.current = Flip.getState(gridRef.current.children);
    }
    setFilter(categoryName);
    if (onCategoryChange) onCategoryChange(categoryName);
  };

  const handleStepLightbox = useCallback(
    (delta) => {
      setLightboxIndex((curr) => {
        if (curr === null) return null;
        return (curr + delta + filteredPhotos.length) % filteredPhotos.length;
      });
    },
    [filteredPhotos.length]
  );

  return (
    <section className="gallery-section section-pad" id="gallery">
      <div className="section-heading">
        <div data-reveal>
          <div className="eyebrow">
            {eyebrow}
          </div>
          <h2>
            {heading}
          </h2>
        </div>
        <p>
          {subheading}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-bar" role="tablist" aria-label="Filter gallery by category">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={filter === tab}
            className={`filter-btn ${filter === tab ? 'active' : ''}`}
            onClick={() => handleSelectFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      <div className="masonry-grid" ref={gridRef}>
        {filteredPhotos.map((photo, index) => (
          <figure
            key={photo.id || `${photo.category}-${index}`}
            className={`masonry-item image-reveal masonry-span-${(index % 6) + 1}`}
            onClick={() => setLightboxIndex(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setLightboxIndex(index);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Open photo: ${photo.title || photo.category}`}
          >
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={photo.alt || `${photo.category} photograph by Imagix`}
              loading="lazy"
              onLoad={onImageLoad}
            />
            <figcaption>
              <span>{photo.title || photo.category}</span>
              <i>↗</i>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={filteredPhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onStep={handleStepLightbox}
        />
      )}
    </section>
  );
}
