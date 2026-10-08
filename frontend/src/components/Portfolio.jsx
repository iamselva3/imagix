import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { CATEGORIES } from '../data/photographyData';

export default function Portfolio({ photos = [], onImageLoad, onSelectCategory, content }) {
  const stageRef = useRef(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const eyebrow = content?.eyebrow || 'A QUICK GLANCE 02 / 06';
  const heading = content?.heading || 'Stories worth keeping.';
  const categoriesList =
    Array.isArray(content?.categories) && content.categories.length > 0
      ? content.categories
      : CATEGORIES;

  useGSAP(
    () => {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const cards = gsap.utils.toArray('.portfolio-card', stageRef.current);
      if (prefersReduced || cards.length < 2) {
        stageRef.current?.classList.add('portfolio-static');
        return;
      }

      // Initial placement: Card 0 visible, subsequent cards below (yPercent: 100)
      gsap.set(cards, {
        yPercent: (i) => (i === 0 ? 0 : 100),
        autoAlpha: (i) => (i === 0 ? 1 : 0),
        scale: 1,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: () => (window.innerWidth <= 880 ? 'top 68px' : 'top top'),
          end: () => `+=${(cards.length - 1) * (window.innerWidth <= 880 ? 250 : 300)}`,
          pin: true,
          scrub: 0.35,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const rawProgress = self.progress;
            const newIndex = Math.min(
              cards.length - 1,
              Math.floor(rawProgress * (cards.length - 1) + 0.22)
            );
            setActiveCardIndex(newIndex);
          },
        },
      });

      // Upgraded vertical card deck rise:
      // Each card rises vertically from bottom over the previous with its solid background,
      // completely eliminating horizontal collisions and text overlapping.
      for (let i = 1; i < cards.length; i++) {
        const timePos = i - 1;
        // Next card rises from bottom
        tl.to(
          cards[i],
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 1,
            ease: 'power2.inOut',
          },
          timePos
        );

        // Previous card gently dims and scales behind it
        tl.to(
          cards[i - 1],
          {
            scale: 0.96,
            autoAlpha: 0,
            duration: 0.8,
            ease: 'power2.in',
          },
          timePos + 0.2
        );
      }

      return () => {
        tl.kill();
      };
    },
    { scope: stageRef, dependencies: [photos], revertOnUpdate: true }
  );

  const handleSeeWork = (categoryName) => {
    if (onSelectCategory) {
      onSelectCategory(categoryName);
    } else {
      document.dispatchEvent(
        new CustomEvent('imagix-filter-gallery', { detail: categoryName })
      );
    }
  };

  const goToCard = (index) => {
    const cards = gsap.utils.toArray('.portfolio-card', stageRef.current);
    if (!cards.length) return;
    setActiveCardIndex(index);

    cards.forEach((card, i) => {
      if (i < index) {
        gsap.to(card, { yPercent: 0, autoAlpha: 0, scale: 0.96, duration: 0.45 });
      } else if (i === index) {
        gsap.to(card, { yPercent: 0, autoAlpha: 1, scale: 1, duration: 0.55 });
      } else {
        gsap.to(card, { yPercent: 100, autoAlpha: 0, scale: 1, duration: 0.45 });
      }
    });
  };

  return (
    <section className="portfolio-section" id="work">
      <div className="portfolio-intro section-pad">
        <div data-reveal>
          <div className="eyebrow">
            {eyebrow}
          </div>
          <h2>
            {heading}
          </h2>
        </div>

        {/* Quick Chapter Navigation Tabs */}
        <div className="portfolio-tabs" role="tablist" aria-label="Portfolio chapters">
          {categoriesList.map((cat, idx) => (
            <button
              key={cat.name}
              role="tab"
              aria-selected={activeCardIndex === idx}
              className={`portfolio-tab-btn ${activeCardIndex === idx ? 'active' : ''}`}
              onClick={() => goToCard(idx)}
            >
              <small>{String(idx + 1).padStart(2, '0')}</small>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="portfolio-stage" ref={stageRef}>
        {categoriesList.map((category, index) => {
          const defaultCat =
            CATEGORIES[index] ||
            CATEGORIES.find((c) => c.name === category.name) ||
            {};
          const catName = category.name || defaultCat.name || `Category ${index + 1}`;
          const catEyebrow = category.eyebrow || defaultCat.eyebrow || '';
          const catTitle = category.title || defaultCat.title || '';
          const catTagline = category.tagline || defaultCat.tagline || '';
          const catVideoUrl = category.videoUrl || defaultCat.videoUrl;
          const catCoverImage = category.coverImage || defaultCat.coverImage;
          const catDetailImage = category.detailImage || defaultCat.detailImage;

          const categoryPhotos = photos.filter((p) => p.category === catName);
          const coverPhoto =
            categoryPhotos.find((p) => p.isCover) || categoryPhotos[0];
          const mainImage = coverPhoto?.url || catCoverImage;
          const detailPhoto =
            categoryPhotos.find((p) => p.id !== coverPhoto?.id) || categoryPhotos[1];
          const subImage =
            detailPhoto?.thumbnailUrl || detailPhoto?.url || catDetailImage;

          return (
            <article
              className={`portfolio-card ${index === activeCardIndex ? 'current' : ''}`}
              key={catName}
              data-index={index}
            >
              {/* Left/Center Visual Canvas */}
              <div className="portfolio-visuals">
                <div className="portfolio-photo photo-large">
                  {category.videoUrl ? (
                    <video
                      src={category.videoUrl}
                      poster={mainImage}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="portfolio-video-media"
                    />
                  ) : (
                    <img
                      src={mainImage}
                      alt={coverPhoto?.alt || `${category.name} photography by Imagix`}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      onLoad={onImageLoad}
                    />
                  )}
                  <span className="photo-badge">
                    {category.videoUrl ? '4K CINEMA REEL' : `IMAGIX · ${String(index + 1).padStart(2, '0')}`}
                  </span>
                </div>

                <div className="portfolio-photo photo-small">
                  <img
                    src={subImage}
                    alt={detailPhoto?.alt || `${category.name} candid detail`}
                    loading="lazy"
                    onLoad={onImageLoad}
                  />
                </div>
              </div>

              {/* Right Narrative Card with Solid Backing */}
              <div className="portfolio-copy">
                <div className="eyebrow">{catEyebrow}</div>
                <h3>{catTitle}</h3>
                <p>{catTagline}</p>
                <div className="portfolio-actions">
                  <a
                    className="pill pill-accent"
                    href="#gallery"
                    onClick={() => handleSeeWork(catName)}
                  >
                    Explore {catName} <span>↗</span>
                  </a>
                  <a
                    className="line-link"
                    href="#contact"
                  >
                    Inquire for date <span>→</span>
                  </a>
                </div>
              </div>
            </article>
          );
        })}

        {/* Dynamic Controls: Counter, Navigation Arrows & Progress Bar */}
        <div className="portfolio-control">
          <button
            className="portfolio-nav-btn prev"
            aria-label="Previous story"
            onClick={() => goToCard((activeCardIndex + CATEGORIES.length - 1) % CATEGORIES.length)}
          >
            ←
          </button>

          <div className="portfolio-number">
            <strong>{String(activeCardIndex + 1).padStart(2, '0')}</strong>
            <span>/ 06</span>
          </div>

          <div className="portfolio-progress">
            <i
              style={{
                width: `${((activeCardIndex + 1) / CATEGORIES.length) * 100}%`,
              }}
            />
          </div>

          <button
            className="portfolio-nav-btn next"
            aria-label="Next story"
            onClick={() => goToCard((activeCardIndex + 1) % CATEGORIES.length)}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
