import React, { useState, useRef } from 'react';

export default function Contact() {
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startedAtRef = useRef(Date.now());

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('Sending your note to the studio…');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.startedAt = startedAtRef.current;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Could not send your inquiry. Please try again.');
      }

      setStatus('Thank you! Your note has been received. We will respond within 24 hours.');
      form.reset();
      startedAtRef.current = Date.now();
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setStatus('Could not connect to the studio server. Please check your connection or try WhatsApp.');
      } else {
        setStatus(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="contact-section section-pad" id="contact">
      <div className="contact-intro">
        <div className="eyebrow" data-reveal>
          YOUR TURN <span>05 / 06</span>
        </div>
        <h2 data-reveal>
          Let’s make
          <br />
          something <em>last.</em>
        </h2>
        <p>
          Tell us about your celebration, your milestone, or the portrait you’ve been
          dreaming of. We can’t wait to hear from you.
        </p>

        <div className="contact-detail">
          <span>FIND US ON INSTAGRAM</span>
          <a
            href="https://www.instagram.com/imagixphotography_/"
            target="_blank"
            rel="noreferrer"
          >
            @imagixphotography_ ↗
          </a>
        </div>

        <div className="contact-detail">
          <span>STUDIO LOCATION</span>
          <p>Tamil Nadu, India · Available for worldwide travel</p>
        </div>
      </div>

      <form className="contact-form" onSubmit={handleSubmit} noValidate={false}>
        <label>
          Your name
          <input
            name="name"
            type="text"
            autoComplete="name"
            placeholder="How should we call you?"
            required
            maxLength={100}
          />
        </label>

        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength={180}
          />
        </label>

        <div className="form-row">
          <label>
            Phone (optional)
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              maxLength={40}
            />
          </label>

          <label>
            When is your event?
            <input
              name="eventDate"
              type="text"
              placeholder="e.g. December 2026 or Winter"
              maxLength={30}
            />
          </label>
        </div>

        <label>
          Tell us a little about your vision
          <textarea
            name="message"
            rows={4}
            placeholder="The feeling of the day, favourite locations, questions for us…"
            required
            maxLength={2000}
          />
        </label>

        {/* Honeypot field for bot filtering */}
        <label className="contact-honeypot" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>

        <button
          className="pill pill-accent"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending…' : 'Send Your Note'} <span>↗</span>
        </button>

        {status && (
          <p className="form-status" role="status" aria-live="polite">
            {status}
          </p>
        )}
      </form>
    </section>
  );
}
