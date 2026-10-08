import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { PROCESS_STEPS } from '../data/photographyData';

export default function Process({ content }) {
  const rootRef = useRef(null);

  const eyebrow = content?.eyebrow || 'EASY AS IT SHOULD BE 03 / 06';
  const headingLead = content?.headingLead || 'From hello to';
  const headingAccent = content?.headingAccent || 'heartfelt.';
  const description = content?.description || 'Great photographs start with feeling understood and completely at ease. Here is how we bring your story to life, step by step.';
  const steps = content?.steps || PROCESS_STEPS;

  useGSAP(
    () => {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) return;

      // Animate vertical connection line with scrub
      gsap.fromTo(
        '.process-line i',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 68%',
            end: 'bottom 72%',
            scrub: true,
          },
        }
      );

      // Stagger rows
      gsap.from('.process-row', {
        y: 30,
        opacity: 0,
        stagger: 0.15,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 75%',
          once: true,
        },
      });
    },
    { scope: rootRef }
  );

  return (
    <section className="process-section section-pad" id="process" ref={rootRef}>
      <div className="process-heading" data-reveal>
        <div className="eyebrow">
          {eyebrow}
        </div>
        <h2>
          {headingLead} <em>{headingAccent}</em>
        </h2>
        <p>
          {description}
        </p>
      </div>

      <div className="process-list">
        <div className="process-line" aria-hidden="true">
          <i />
        </div>

        {steps.map((step) => (
          <article className="process-row" key={step.num}>
            <span className="process-num">{step.num}</span>
            <div className="process-content">
              <h3>
                {step.lead} <em>{step.accent}</em>
              </h3>
              <p>{step.description}</p>
            </div>
            <b className="process-arrow" aria-hidden="true">
              ↗
            </b>
          </article>
        ))}
      </div>
    </section>
  );
}
