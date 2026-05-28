export default function PageLoader({ light = false }) {
  return (
    <div
      className={`flex min-h-[50vh] items-center justify-center ${light ? 'bg-[#f8fafc]' : 'bg-[#0D0D1A]'}`}
      role="status"
      aria-label="جاري التحميل"
    >
      <div className="relative h-10 w-10">
        <div
          className={`absolute inset-0 rounded-full border-4 ${
            light ? 'border-emerald-100' : 'border-purple-900/30'
          }`}
        />
        <div
          className={`absolute inset-0 animate-spin rounded-full border-4 border-t-transparent ${
            light ? 'border-emerald-600' : 'border-t-purple-500'
          }`}
        />
      </div>
    </div>
  );
}
