import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * MobileHeader – reusable header row with back button, title, subtitle, and optional right content.
 * Intended to be placed inside a parent sticky/fixed container, or used standalone.
 *
 * Props:
 *   title       – main heading text
 *   subtitle    – smaller line below title (optional)
 *   onBack      – custom back handler; defaults to navigate(-1)
 *   rightContent – JSX rendered on the right side (optional)
 *   dark        – use dark (default) or light colour scheme
 */
export default function MobileHeader({ title, subtitle, onBack, rightContent, dark = true }) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleBack}
        className="p-2 rounded-xl flex-shrink-0"
        style={{
          background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        }}
      >
        <ChevronRight size={18} style={{ color: dark ? '#D1D5DB' : '#374151' }} />
      </button>

      <div className="flex-1 min-w-0">
        {title && (
          <h1
            className="font-bold text-sm truncate"
            style={{ color: dark ? '#FFFFFF' : '#111827' }}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs truncate" style={{ color: dark ? '#6B7280' : '#9CA3AF' }}>
            {subtitle}
          </p>
        )}
      </div>

      {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
    </div>
  );
}