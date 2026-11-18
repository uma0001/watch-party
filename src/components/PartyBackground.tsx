import React, { useMemo } from 'react';

// Floating watch-party themed emojis
const PARTY_EMOJIS = ['🍿', '🎬', '🎉', '⭐', '🎊', '🎥', '❤️', '🔥', '🎞️', '🥤', '🎭', '✨', '🎈', '👏', '🎦'];

interface Particle {
  id: number;
  emoji: string;
  left: string;
  bottom: string;
  duration: string;
  delay: string;
  size: string;
}

interface StarDot {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: string;
  delay: string;
}

export const PartyBackground: React.FC = () => {
  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      emoji: PARTY_EMOJIS[i % PARTY_EMOJIS.length],
      left: `${5 + (i * 5.5) % 90}%`,
      bottom: `${-5 + (i * 7) % 20}%`,
      duration: `${12 + (i * 3.7) % 14}s`,
      delay: `${(i * 2.3) % 12}s`,
      size: `${1.1 + (i % 4) * 0.3}rem`,
    }));
  }, []);

  const stars: StarDot[] = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${(i * 7.3) % 100}%`,
      top: `${(i * 11.7) % 100}%`,
      size: 1 + (i % 3),
      duration: `${2.5 + (i * 0.7) % 3}s`,
      delay: `${(i * 0.4) % 3}s`,
    }));
  }, []);

  return (
    <>
      {/* Cinema vignette overlay */}
      <div className="cinema-vignette" />

      {/* Projector beam from top */}
      <div className="projector-beam" />

      {/* Twinkling stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="star-dot"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDuration: star.duration,
            animationDelay: star.delay,
            opacity: 0.15,
          }}
        />
      ))}

      {/* Floating emoji particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="party-particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            fontSize: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </>
  );
};
