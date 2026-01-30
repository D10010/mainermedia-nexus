import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'default',
  showClose = true
}) {
  const sizes = {
    small: 'max-w-md',
    default: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl'
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`
              relative w-full ${sizes[size]}
              bg-[#12161D] border border-white/[0.08] rounded-sm
              shadow-2xl max-h-[90vh] overflow-hidden flex flex-col
            `}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0E1116] flex items-center justify-between">
                <h2 className="text-[12px] font-mono uppercase tracking-[0.2em] text-gray-300">
                  {title}
                </h2>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="p-6 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}