/**
 * LoadingOverlay - Small dark-themed loader overlay
 * Prevents white flash during navigation/loading
 */
export default function LoadingOverlay({ isLoading }) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50" style={{ background: 'rgba(13,13,26,0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-purple-900/30"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
      </div>
    </div>
  );
}