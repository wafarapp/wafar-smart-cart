import { Component } from 'react';
import { ChevronRight } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0D0D1A' }}>
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-white font-bold text-lg">حدث خطأ غير متوقع</h2>
            <p className="text-gray-400 text-sm">يرجى المحاولة مرة أخرى</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-6 py-3 rounded-xl text-white font-bold"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)' }}
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;