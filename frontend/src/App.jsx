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
import './styles.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function App() {
  const rootRef = useRef(null);
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
  const [splashDone, setSplashDone] = useState(!splash);

  const refreshScrollTrigger = useCallback(() => {
    ScrollTrigger.refresh();
  }, []);

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
        smoothWheel: true,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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
      gsap.utils.toArray('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          y: 28,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 86%',
            once: true,
          },
        });
      });

      // Clip path image unmask reveals
      gsap.utils.toArray('.image-reveal img').forEach((img) => {
        gsap.fromTo(
          img,
          { clipPath: 'inset(10% 8% 10% 8%)', scale: 1.07 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            scale: 1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: img,
              start: 'top 90%',
              once: true,
            },
          }
        );
      });
    },
    { scope: rootRef, dependencies: [splashDone], revertOnUpdate: true }
  );

  const finishSplash = useCallback(() => {
    setSplash(false);
    window.setTimeout(() => {
      setSplashDone(true);
      ScrollTrigger.refresh();
    }, 550);
  }, []);

  useEffect(() => {
    if (!splash) setSplashDone(true);
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
      {splash && <Splash onDone={finishSplash} />}

      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main id="main-content">
        <Hero onImageLoad={refreshScrollTrigger} />
        <StoryIntro />
        <Portfolio
          photos={photos}
          onImageLoad={refreshScrollTrigger}
          onSelectCategory={handleCategorySelect}
        />
        <CinemaReel />
        <Marquee />
        <Gallery
          photos={photos}
          onImageLoad={refreshScrollTrigger}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        <Process />
        <Testimonials />
        <Packages />
        <Contact />
      </main>

      <Footer theme={theme} />
      <WhatsAppButton />
    </div>
  );
}
