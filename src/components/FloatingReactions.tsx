import { AnimatePresence, motion } from 'motion/react';
import React, { useMemo } from 'react';
import { LiveReaction } from '../types/watchParty';

interface FloatingReactionsProps {
  reactions: LiveReaction[];
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  // Map reactions with deterministic random horizontal offsets for realistic particle drift
  const formattedReactions = useMemo(() => {
    return reactions.map((rx) => {
      // Generate a semi-random offset based on ID hash
      let hash = 0;
      for (let i = 0; i < rx.id.length; i++) {
        hash = (hash << 5) - hash + rx.id.charCodeAt(i);
        hash |= 0;
      }
      const xOffset = (Math.abs(hash) % 120) - 60; // -60px to +60px
      const randomRotate = (Math.abs(hash) % 30) - 15; // -15deg to +15deg

      return {
        ...rx,
        xOffset,
        randomRotate,
      };
    });
  }, [reactions]);

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-2xl lg:rounded-3xl">
      <AnimatePresence>
        {formattedReactions.map((rx) => (
          <motion.div
            key={rx.id}
            initial={{ opacity: 0, y: '100%', scale: 0.4, x: rx.xOffset, rotate: rx.randomRotate }}
            animate={{
              opacity: [0, 1, 1, 0.8, 0],
              y: ['100%', '60%', '30%', '-20%'],
              scale: [0.4, 1.2, 1.4, 1.1, 0.8],
              x: [rx.xOffset, rx.xOffset + 20, rx.xOffset - 15, rx.xOffset + 10],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.8, ease: 'easeOut' }}
            className="absolute bottom-6 right-12 flex flex-col items-center select-none"
          >
            {/* Floating Emoji */}
            <span className="text-4xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] filter">
              {rx.emoji}
            </span>

            {/* Sender Username Badge */}
            <span className="text-[10px] font-semibold text-white bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shadow-lg mt-0.5 truncate max-w-[100px]">
              {rx.username}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
