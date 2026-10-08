import React from 'react';

export default function Footer({ theme = 'light' }) {
  const currentYear = new Date().getFullYear();

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

        <p className="footer-tagline">Keep the good stuff close.</p>

        <a href="#home" className="footer-up" onClick={scrollToTop}>
          Back to the top ↑
        </a>
      </div>

      <div className="footer-bottom">
        <span>© {currentYear} IMAGIX PHOTOGRAPHY. ALL RIGHTS RESERVED.</span>
        <span>MADE WITH CARE IN TAMIL NADU</span>
        <a
          href="https://www.instagram.com/imagixphotography_/"
          target="_blank"
          rel="noreferrer"
        >
          INSTAGRAM ↗
        </a>
      </div>
    </footer>
  );
}
