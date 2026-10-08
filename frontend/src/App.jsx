import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';

import Header from './components/Header';
import Splash from './components/Splash';
import Hero from './components/Hero';
import StoryIntro from './components/StoryIntro';
import Portfolio from './components/Portfolio';
import CinemaReel from './components/CinemaReel';
import Marquee from './components/Marquee';
import Gallery from './components/Gallery';
import Process from './components/Process';
import Testimonials from './components/Testimonials';
import Packages from './components/Packages';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';

import { FALLBACK_PHOTOS } from './data/photographyData';
import { DEFAULT_CONTENT } from './data/defaultSiteContent';
import './styles.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function App() {
  const rootRef = useRef(null);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [photos, setPhotos] = useState(FALLBACK_PHOTOS);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Dark / Light Theme Management
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('imagix-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('imagix-theme', theme);
    } catch {
      // Storage might be disabled
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [splash, setSplash] = useState(
    () => !prefersReduced && !sessionStorage.getItem('imagix-intro-seen')
  );
  const [isRevealing, setIsRevealing] = useState(() => !splash);
  const [splashDone, setSplashDone] = useState(() => !splash);

  const refreshScrollTrigger = useCallback(() => {
    ScrollTrigger.refresh();
  }, []);

  // Fetch dynamic CMS content from /api/content
  const loadContent = useCallback(() => {
    fetch('/api/content')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.content) {
          setContent(data.content);
        }
      })
      .catch(() => {
        // Fall back to default content
      });
  }, []);

  useEffect(() => {
    loadContent();
    const onWindowFocus = () => loadContent();
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('storage', onWindowFocus);
    return () => {
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('storage', onWindowFocus);
    };
  }, [loadContent]);

  // Fetch photos from worker API: GET /api/photos
  useEffect(() => {
    let isMounted = true;
    fetch('/api/photos')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.photos?.length) return;
        const normalized = data.photos
          .map((photo) => ({
            ...photo,
            url: photo.url || `/media/${encodeURIComponent(photo.id)}`,
            thumbnailUrl:
              photo.thumbnailUrl ||
              `/media/${encodeURIComponent(photo.id)}?size=thumb`,
          }))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setPhotos(normalized);
      })
      .catch(() => {
        // Fall back to authentic studio photos
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Setup Lenis smooth scrolling connected to GSAP ScrollTrigger
  useGSAP(
    () => {
      if (prefersReduced) return;

      const lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.9,
      });

      lenis.on('scroll', ScrollTrigger.update);

      const updateRaf = (time) => {
        lenis.raf(time * 1000);
      };

      gsap.ticker.add(updateRaf);
      gsap.ticker.lagSmoothing(0);

      // Trigger recalculation after fonts and images load
      const onImageLoaded = () => ScrollTrigger.refresh();
      document.querySelectorAll('img').forEach((img) => {
        if (!img.complete) {
          img.addEventListener('load', onImageLoaded, { once: true });
        }
      });

      if (document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }

      return () => {
        gsap.ticker.remove(updateRaf);
        lenis.destroy();
      };
    },
    { scope: rootRef }
  );

  // Global masked scroll reveals and clip-path image reveals
  useGSAP(
    () => {
      if (prefersReduced || !splashDone) return;

      // Masked text line reveals
      const revealElements = gsap.utils.toArray('[data-reveal]');
      revealElements.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              once: true,
            },
          }
        );
      });

      // Ambient Parallax on decorative blur or background rings
      const glows = gsap.utils.toArray('.ambient-glow, .cinema-glow');
      glows.forEach((glow) => {
        gsap.to(glow, {
          y: -60,
          ease: 'none',
          scrollTrigger: {
            trigger: glow,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5,
          },
        });
      });

      // Smooth section headings subtle scale-in
      const headings = gsap.utils.toArray('.section-heading h2');
      headings.forEach((h) => {
        gsap.fromTo(
          h,
          { opacity: 0, y: 30, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: h,
              start: 'top 85%',
              once: true,
            },
          }
        );
      });
    },
    { scope: rootRef, dependencies: [splashDone], revertOnUpdate: true }
  );

  const handleSplashReveal = useCallback(() => {
    setIsRevealing(true);
  }, []);

  const finishSplash = useCallback(() => {
    setIsRevealing(true);
    setSplashDone(true);
    setSplash(false);
    ScrollTrigger.refresh();
  }, []);

  useEffect(() => {
    if (!splash) {
      setIsRevealing(true);
      setSplashDone(true);
    }
  }, [splash]);

  const handleCategorySelect = useCallback((categoryName) => {
    setSelectedCategory(categoryName);
    const galleryEl = document.getElementById('gallery');
    if (galleryEl) {
      galleryEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="app-shell" ref={rootRef}>
      {splash && <Splash onDone={finishSplash} onReveal={handleSplashReveal} />}

      <Header theme={theme} onToggleTheme={toggleTheme} general={content.general} />

      <main id="main-content">
        <Hero
          onImageLoad={refreshScrollTrigger}
          content={content.hero}
          isRevealing={isRevealing}
          splashDone={splashDone}
        />
        <StoryIntro content={content.story} />
        <Portfolio
          photos={photos}
          onImageLoad={refreshScrollTrigger}
          onSelectCategory={handleCategorySelect}
          content={content.portfolio}
        />
        <CinemaReel content={content.cinema} />
        <Marquee />
        <Gallery
          photos={photos}
          onImageLoad={refreshScrollTrigger}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          content={content.gallery}
        />
        <Process content={content.process} />
        <Testimonials content={content.testimonials} />
        <Packages content={content.packages} />
        <Contact content={content.contact} general={content.general} />
      </main>

      <Footer theme={theme} content={content.footer} general={content.general} />
      <WhatsAppButton />
    </div>
  );
}
