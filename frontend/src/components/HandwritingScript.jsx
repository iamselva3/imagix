import React from 'react';

/**
 * HandwritingScript provides luxury, aesthetic cursive signature script typography
 * for "Capture" and "Moments" with sequential drawing animation (Capture first, then Moments).
 */

export function ScriptCapture({ className = '' }) {
  return (
    <div className={`handwriting-item script-capture ${className}`} aria-label="Capture">
      <div className="handwriting-draw-mask capture-mask">
        <span className="aesthetic-script-word">Capture</span>
      </div>

      <svg
        className="aesthetic-flourish flourish-capture"
        viewBox="0 0 160 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          className="flourish-path flourish-path-capture"
          d="M 6 12 C 45 18 105 16 154 6"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function ScriptMoments({ className = '' }) {
  return (
    <div className={`handwriting-item script-moments ${className}`} aria-label="Moments">
      <div className="handwriting-draw-mask moments-mask">
        <span className="aesthetic-script-word">Moments</span>
      </div>

      <svg
        className="aesthetic-flourish flourish-moments"
        viewBox="0 0 180 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          className="flourish-path flourish-path-moments"
          d="M 8 13 C 55 19 120 16 172 7"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
