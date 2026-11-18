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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto flex items-center justify-between p-3 rounded-xl border shadow-lg text-sm ${
                isError
                  ? 'bg-zinc-900 border-red-800/60 text-red-300'
                  : isSuccess
                  ? 'bg-zinc-900 border-green-800/60 text-green-300'
                  : isWarning
                  ? 'bg-zinc-900 border-yellow-800/60 text-yellow-300'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5 pr-2">
                {isError && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                {isWarning && <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />}
                {!isError && !isSuccess && !isWarning && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
                <span className="font-medium text-xs leading-tight">{toast.message}</span>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-md hover:bg-zinc-800 transition-colors shrink-0 text-zinc-500 hover:text-white"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
