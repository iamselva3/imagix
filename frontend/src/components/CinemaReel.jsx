import React, { useRef, useState } from 'react';

export default function CinemaReel({ content }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const eyebrow = content?.eyebrow || 'CINEMATIC STORIES 03 / 06';
  const headingLead = content?.headingLead || 'Stories that';
  const headingAccent = content?.headingAccent || 'move.';
  const description = content?.description || 'Photography freezes the tender second; cinema preserves the rhythm of laughter, the tremor in a vow, and the timeless emotion that makes your celebration alive.';
  const videoUrl = content?.videoUrl || '/assets/studio/imagix-studio-reel.mp4';
  const posterUrl = content?.posterUrl || '/assets/studio/model-signature-bridal.webp';

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <section className="cinema-section section-pad" id="cinema">
      <div className="cinema-header" data-reveal>
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

      <div className="cinema-stage">
        <div className="cinema-glow" aria-hidden="true" />

        <div className="cinema-frame">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="cinema-video-element"
            onClick={togglePlay}
          />

          {/* Video Control Bar Overlay */}
          <div className="cinema-overlay">
            <div className="cinema-tags">
              <span className="cinema-pill">4K ULTRA HD</span>
              <span className="cinema-pill">24 FPS CINEMA</span>
              <span className="cinema-pill">HEIRLOOM SOUND</span>
            </div>

            <div className="cinema-controls">
              <button
                type="button"
                className="cinema-btn"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause film' : 'Play film'}
              >
                {isPlaying ? '❚❚' : '▶'}
              </button>

              <button
                type="button"
                className="cinema-btn"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute cinema audio' : 'Mute audio'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>

              <button
                type="button"
                className="cinema-btn"
                onClick={handleFullscreen}
                aria-label="View film fullscreen"
              >
                ⛶
              </button>
            </div>
          </div>
        </div>

        <div className="cinema-footer">
          <div className="cinema-meta-left">
            <span className="cinema-dot" />
            <span className="cinema-meta-text">HEIRLOOM WEDDING &amp; MOTION FILM ARCHIVE</span>
          </div>
          <a href="#contact" className="cinema-link">
            Commission a Cinema Film <span>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
