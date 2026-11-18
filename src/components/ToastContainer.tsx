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
                isError   ? 'bg-white border-red-200 text-red-700'
                : isSuccess ? 'bg-white border-green-200 text-green-700'
                : isWarning ? 'bg-white border-yellow-200 text-yellow-700'
                : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2.5 pr-2">
                {isError   && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                {isWarning && <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />}
                {!isError && !isSuccess && !isWarning && <Info className="w-4 h-4 text-blue-500 shrink-0" />}
                <span className="font-medium text-xs leading-tight">{toast.message}</span>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors shrink-0 text-gray-400 hover:text-gray-700"
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
