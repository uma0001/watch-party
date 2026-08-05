import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import React from 'react';
import { ToastMessage } from '../hooks/useRoom';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-md shadow-xl text-sm ${
                isError
                  ? 'bg-rose-950/90 border-rose-800/80 text-rose-200'
                  : isSuccess
                  ? 'bg-emerald-950/90 border-emerald-800/80 text-emerald-200'
                  : isWarning
                  ? 'bg-amber-950/90 border-amber-800/80 text-amber-200'
                  : 'bg-zinc-900/90 border-zinc-800 text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3 pr-2">
                {isError && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {isWarning && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
                {!isError && !isSuccess && !isWarning && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
                <span className="font-medium leading-tight">{toast.message}</span>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 text-zinc-400 hover:text-white"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
