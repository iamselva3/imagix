import React from 'react';

const MARQUEE_ITEMS = [
  'WEDDINGS',
  'FAMILIES',
  'THE EVERYDAY',
  'PORTRAITS',
  'YOUR BRAND',
  'HEIRLOOM ALBUMS',
  'UNSCRIPTED MOMENTS',
];

export default function Marquee() {
  return (
    <div
      className="marquee"
      aria-label="Photography services: Weddings, families, everyday moments, portraits, and brand stories"
    >
      <div className="marquee-track">
        {Array.from({ length: 3 }).map((_, repeatIndex) => (
          <span className="marquee-segment" key={repeatIndex}>
            {MARQUEE_ITEMS.map((item, itemIndex) => (
              <React.Fragment key={`${repeatIndex}-${itemIndex}`}>
                <span className="marquee-word">{item}</span>
                <i className="marquee-star" aria-hidden="true">
                  ✳
                </i>
              </React.Fragment>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
