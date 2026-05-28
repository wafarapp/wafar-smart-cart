export default function AppLayout({ children }) {
  return (
    <div
      dir="rtl"
      className="min-h-screen"
      className="min-h-screen bg-background"
    >
      {children}
    </div>
  );
}