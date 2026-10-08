import React, { useRef, useState } from 'react';

export default function CinemaReel() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

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
          CINEMATIC STORIES <span>03 / 06</span>
        </div>
        <h2>
          Stories that <em>move.</em>
        </h2>
        <p>
          Photography freezes the tender second; cinema preserves the rhythm of laughter,
          the tremor in a vow, and the timeless emotion that makes your celebration alive.
        </p>
      </div>

      <div className="cinema-stage">
        <div className="cinema-glow" aria-hidden="true" />

        <div className="cinema-frame">
          <video
            ref={videoRef}
            src="/assets/studio/imagix-studio-reel.mp4"
            poster="/assets/studio/model-signature-bridal.webp"
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
                className="cinema-btn cinema-play-btn"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause studio reel' : 'Play studio reel'}
              >
                {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
              </button>

              <button
                className="cinema-btn cinema-audio-btn"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute studio audio' : 'Mute studio audio'}
              >
                {isMuted ? '🔇 SOUND OFF' : '🔊 SOUND ON'}
              </button>

              <button
                className="cinema-btn cinema-fs-btn"
                onClick={handleFullscreen}
                aria-label="View reel fullscreen"
              >
                ⛶ FULLSCREEN
              </button>
            </div>
          </div>
        </div>

        <div className="cinema-caption-row">
          <div>
            <strong>OFFICIAL IMAGIX STUDIO REEL</strong>
            <span>Featuring Real Wedding Moments &amp; High Fashion Model Sessions</span>
          </div>
          <a className="pill pill-accent" href="#contact">
            Book Cinematic Coverage <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
