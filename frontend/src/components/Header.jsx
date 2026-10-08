import React, { useState, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'Cinema', href: '#cinema' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Process', href: '#process' },
  { label: 'Packages', href: '#packages' },
  { label: 'Contact', href: '#contact' },
];

export default function Header({ theme = 'light', onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sectionIds = ['home', 'story', 'work', 'cinema', 'gallery', 'process', 'packages', 'contact'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          setActiveSection(visible.target.id);
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.2, 0.5] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-is-open', menuOpen);
    return () => document.body.classList.remove('menu-is-open');
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
        <a className="brand" href="#home" aria-label="Imagix Photography home">
          <img
            className="brand-logo"
            src={theme === 'dark' ? '/assets/imagix-gold-lockup-light.svg' : '/assets/imagix-gold-lockup-dark.svg'}
            alt="Imagix Photography"
            width="160"
            height="46"
          />
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, href }) => {
            const id = href.slice(1);
            const isActive = activeSection === id;
            return (
              <a
                key={href}
                href={href}
                className={isActive ? 'active' : ''}
              >
                {label}
              </a>
            );
          })}
        </nav>

        <a className="pill pill-outline header-cta" href="#contact">
          Book Your Shoot <span>→</span>
        </a>

        {/* Dark / Light Mode Switcher */}
        {onToggleTheme && (
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        )}

        <button
          className={`nav-toggle ${menuOpen ? 'open' : ''}`}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>
      </header>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-inner">
          <nav>
            {NAV_LINKS.map(({ label, href }, index) => (
              <a key={href} href={href} onClick={closeMenu}>
                <small>{String(index + 1).padStart(2, '0')}</small>
                <span>{label}</span>
                <i>↗</i>
              </a>
            ))}
          </nav>
          <div className="mobile-menu-footer">
            <button
              type="button"
              className="mobile-theme-toggle"
              onClick={onToggleTheme}
            >
              {theme === 'dark' ? '☼ LIGHT MODE' : '☾ DARK MODE'}
            </button>
            <a
              href="https://www.instagram.com/imagixphotography_/"
              target="_blank"
              rel="noreferrer"
            >
              @imagixphotography_ ↗
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
