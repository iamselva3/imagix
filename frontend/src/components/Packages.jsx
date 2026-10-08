import React from 'react';
import { PACKAGES } from '../data/photographyData';

export default function Packages() {
  return (
    <section className="packages-section section-pad" id="packages">
      <div className="section-heading">
        <div data-reveal>
          <div className="eyebrow">
            A GOOD PLACE TO START <span>04 / 06</span>
          </div>
          <h2>
            Room for <em>your story.</em>
          </h2>
        </div>
        <p>
          Every celebration has its own cadence and style. Here are our starting
          curations; we tailor final coverage to your unique plans.
        </p>
      </div>

      <div className="package-grid">
        {PACKAGES.map((pkg) => (
          <article
            key={pkg.eyebrow}
            className={`package-card ${pkg.featured ? 'featured' : ''}`}
          >
            <div className="package-card-header">
              <span className="eyebrow">{pkg.eyebrow}</span>
              {pkg.featured && <span className="favourite">SIGNATURE CHOICE</span>}
            </div>

            <h3>{pkg.title}</h3>
            <p className="package-text">{pkg.text}</p>

            <ul className="package-features">
              {pkg.items.map((feat) => (
                <li key={feat}>{feat}</li>
              ))}
            </ul>

            <a href="#contact" className="line-link">
              {pkg.action} <span>↗</span>
            </a>
          </article>
        ))}
      </div>

      <p className="package-note">
        All collections include color correction, high-resolution downloads, and an online client gallery.
      </p>
    </section>
  );
}
