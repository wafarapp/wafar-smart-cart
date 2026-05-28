import { useEffect } from 'react';
import { Check, X } from 'lucide-react';

export default function BottomSheet({ open, onClose, title, options = [], value, onChange }) {
  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const select = (val) => {
    onChange(val);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="إغلاق"
        className="sheet-overlay fixed inset-0 z-[9998] border-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="sheet-panel fixed inset-x-0 bottom-0 z-[9999] max-h-[80vh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-purple-500/30 bg-[#1A1A2E] pb-[calc(16px+env(safe-area-inset-bottom))] animate-sheet-up"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-5 pb-4">
          <span className="text-[15px] font-bold text-white">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="flex rounded-lg bg-white/10 p-1.5"
            aria-label="إغلاق"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <div className="px-3 pb-2">
          {items.map((item) => {
            const selected = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => select(item.value)}
                className={`mb-1.5 flex w-full items-center justify-between rounded-xl px-4 py-3.5 transition-colors ${
                  selected ? 'bg-purple-500/25' : 'bg-white/[0.04]'
                }`}
              >
                <span className={`text-sm ${selected ? 'font-bold text-purple-200' : 'text-gray-300'}`}>
                  {item.label}
                </span>
                {selected && <Check size={16} className="text-purple-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
