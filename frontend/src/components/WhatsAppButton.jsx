import React, { useState, useEffect } from 'react';

export default function WhatsAppButton() {
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((config) => {
        if (config?.whatsappNumber) {
          const cleaned = config.whatsappNumber.replace(/\D/g, '');
          setWhatsappNumber(cleaned);
        }
      })
      .catch(() => {});
  }, []);

  const href = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        'Hello Imagix Photography! I would love to check availability for a photoshoot.'
      )}`
    : '#contact';

  return (
    <a
      className="whatsapp-float"
      href={href}
      target={whatsappNumber ? '_blank' : undefined}
      rel={whatsappNumber ? 'noreferrer' : undefined}
      aria-label="Chat with Imagix Photography on WhatsApp"
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.175 8.175 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.08l-.29-.17-3.02.79.81-2.95-.19-.3a8.212 8.212 0 0 1-1.26-4.35c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.49-1.41-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z" />
      </svg>
      <span className="whatsapp-tooltip">Chat with us</span>
    </a>
  );
}
