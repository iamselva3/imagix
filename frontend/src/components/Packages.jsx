import React from 'react';
import { PACKAGES } from '../data/photographyData';

export default function Packages({ content }) {
  const eyebrow = content?.eyebrow || 'A GOOD PLACE TO START 04 / 06';
  const headingLead = content?.headingLead || 'Room for';
  const headingAccent = content?.headingAccent || 'your story.';
  const subtitle = content?.subtitle || 'Every celebration has its own cadence and style. Here are our starting curations; we tailor final coverage to your unique plans.';
  const note = content?.note || 'All collections include color correction, high-resolution downloads, and an online client gallery.';
  const packagesList = content?.packages || PACKAGES;

  return (
    <section className="packages-section section-pad" id="packages">
      <div className="section-heading">
        <div data-reveal>
          <div className="eyebrow">
            {eyebrow}
          </div>
          <h2>
            {headingLead} <em>{headingAccent}</em>
          </h2>
        </div>
        <p>
          {subtitle}
        </p>
      </div>

      <div className="package-grid">
        {packagesList.map((pkg) => (
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
        {note}
      </p>
    </section>
  );
}
