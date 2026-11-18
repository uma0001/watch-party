import React, { useMemo } from 'react';

const PARTY_EMOJIS = ['🍿', '🎬', '🎉', '⭐', '🎊', '🎥', '❤️', '🔥', '🎞️', '🥤', '🎭', '✨', '🎈', '👏', '🎦'];

interface Particle {
  id: number;
  emoji: string;
  left: string;
  bottom: string;
  duration: string;
  delay: string;
  size: string;
  opacity: number;
}

export const PartyBackground: React.FC = () => {
  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      emoji: PARTY_EMOJIS[i % PARTY_EMOJIS.length],
      left: `${5 + (i * 5.9) % 90}%`,
      bottom: `${-5 + (i * 7) % 20}%`,
      duration: `${14 + (i * 3.3) % 12}s`,
      delay: `${(i * 2.1) % 12}s`,
      size: `${1.0 + (i % 4) * 0.25}rem`,
      opacity: 0.25 + (i % 3) * 0.1,
    }));
  }, []);

  return (
    <>
      {/* Warm soft top glow — like a projector */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '300px',
          background: 'radial-gradient(ellipse at top, rgba(59,130,246,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Bottom warm glow */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          right: '10%',
          width: '400px',
          height: '250px',
          background: 'radial-gradient(ellipse at bottom, rgba(251,191,36,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Floating emoji particles — subtle on white */}
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
            opacity: p.opacity,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </>
  );
};
