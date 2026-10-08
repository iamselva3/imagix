import React from 'react';

export default function StoryIntro() {
  return (
    <section className="story section-pad" id="story">
      <div className="eyebrow" data-reveal>
        A LITTLE ABOUT US <span>✳</span>
      </div>
      <div className="story-grid">
        <h2 data-reveal>
          Life happens in the in-between. <em>That’s where we look.</em>
        </h2>
        <div>
          <p>
            From the happy chaos of an early wedding morning in Chennai to the quiet sunset
            vows on an Ooty hillside, we make photographs that look like fine art and feel
            like real life.
          </p>
          <p>
            No awkward posing, no stiff smiles. Just warm guidance, intuitive light, and
            genuine memories you will cherish fifty years from today.
          </p>
          <a href="#contact" className="line-link">
            Get to know our process <span>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
