import React, { useState } from 'react';
import { TESTIMONIALS } from '../data/photographyData';

export default function Testimonials({ content }) {
  const [current, setCurrent] = useState(0);
  const list = (content?.list && content.list.length > 0) ? content.list : TESTIMONIALS;
  const safeCurrent = Math.min(current, list.length - 1);
  const item = list[safeCurrent] || list[0];

  const handlePrev = () => {
    setCurrent((prev) => (prev + list.length - 1) % list.length);
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % list.length);
  };

  if (!item) return null;

  return (
    <section className="testimonial-section" aria-label="Client testimonials">
      <div className="testimonial-photo">
        <img
          src={item.photo}
          alt={`${item.name} wedding ceremony in ${item.place}`}
          loading="lazy"
        />
      </div>

      <div className="testimonial-copy">
        <span className="quote-glyph" aria-hidden="true">
          “
        </span>
        <blockquote key={item.name}>
          {item.quote}
        </blockquote>
        <p>
          {item.name} <i>·</i> {item.place}
        </p>

        <div className="testimonial-controls">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={handlePrev}
          >
            ←
          </button>
          <span>
            {String(safeCurrent + 1).padStart(2, '0')} <i>/</i>{' '}
            {String(list.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={handleNext}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
