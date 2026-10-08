import React from 'react';

export default function Footer({ theme = 'light', content, general }) {
  const currentYear = new Date().getFullYear();

  const tagline = content?.tagline || general?.tagline || 'Keep the good stuff close.';
  const copyright = content?.copyright || `© ${currentYear} IMAGIX PHOTOGRAPHY. ALL RIGHTS RESERVED.`;
  const instagramUrl = general?.instagramUrl || 'https://www.instagram.com/imagixphotography_/';

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="footer-top">
        <a href="#home" className="footer-brand" aria-label="Imagix Photography home">
          <img
            src={
              theme === 'dark'
                ? '/assets/imagix-gold-lockup-light.svg'
                : '/assets/imagix-gold-lockup-dark.svg'
            }
            alt="Imagix Photography"
            width="155"
            height="44"
          />
        </a>

        <p className="footer-tagline">{tagline}</p>

        <a href="#home" className="footer-up" onClick={scrollToTop}>
          Back to the top ↑
        </a>
      </div>

      <div className="footer-bottom">
        <span>{copyright}</span>
        <span>MADE WITH CARE IN TAMIL NADU</span>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
        >
          INSTAGRAM ↗
        </a>
      </div>
    </footer>
  );
}
