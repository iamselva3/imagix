import React from 'react';

export default function StoryIntro({ content }) {
  const eyebrow = content?.eyebrow || 'A LITTLE ABOUT US ✳';
  const titleLead = content?.titleLead || 'Life happens in the in-between.';
  const titleAccent = content?.titleAccent || 'That’s where we look.';
  const paragraph1 = content?.paragraph1 || 'From the happy chaos of an early wedding morning in Chennai to the quiet sunset vows on an Ooty hillside, we make photographs that look like fine art and feel like real life.';
  const paragraph2 = content?.paragraph2 || 'No awkward posing, no stiff smiles. Just warm guidance, intuitive light, and genuine memories you will cherish fifty years from today.';
  const linkText = content?.linkText || 'Get to know our process ↗';
  const linkHref = content?.linkHref || '#contact';

  return (
    <section className="story section-pad" id="story">
      <div className="eyebrow" data-reveal>
        {eyebrow}
      </div>
      <div className="story-grid">
        <h2 data-reveal>
          {titleLead} <em>{titleAccent}</em>
        </h2>
        <div>
          <p>{paragraph1}</p>
          <p>{paragraph2}</p>
          <a href={linkHref} className="line-link">
            {linkText}
          </a>
        </div>
      </div>
    </section>
  );
}
