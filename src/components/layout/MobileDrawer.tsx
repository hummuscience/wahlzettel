import { useEffect } from 'react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side: 'left' | 'right';
  children: React.ReactNode;
}

export function MobileDrawer({ isOpen, onClose, side, children }: MobileDrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <div
      className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div
        className={`absolute top-0 bottom-0 w-[85vw] max-w-sm bg-[#f5f5f0] shadow-xl overflow-y-auto transition-transform duration-300 ${
          side === 'left' ? 'left-0' : 'right-0'
        } ${
          isOpen
            ? 'translate-x-0'
            : side === 'left' ? '-translate-x-full' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-frankfurt-blue text-white px-4 py-3 flex items-center justify-between z-10">
          <span className="font-bold text-sm">&nbsp;</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-white/40 text-white/70 hover:border-white hover:text-white flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
