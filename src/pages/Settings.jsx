import { useNavigate } from 'react-router-dom';
import { Trash2, LogOut, ChevronRight, Shield, Mail, FileText } from 'lucide-react';

import { base44 } from '@/api/base44Client';

const glass = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '16px' };

export default function Settings() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('wafarCustomer');
    localStorage.removeItem('wafarStore');
    localStorage.removeItem('wafarAdmin');
    localStorage.removeItem('wafarDriver');
    navigate('/');
  };

  return (
    <div dir="rtl" className="min-h-screen pb-10 bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-5%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse, rgba(248,113,113,0.08) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', userSelect: 'none' }}>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
        <div>
          <h1 className="text-white font-black text-base">الإعدادات</h1>
          <p className="text-gray-600 text-xs">وفر · الحساب والخصوصية</p>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-4 relative z-10">
        {/* Account Section */}
        <div style={glass} className="overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">الحساب</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 transition-all active:bg-white/5" style={{ userSelect: 'none' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <LogOut size={16} style={{ color: '#FBB824' }} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-white text-sm font-medium">تسجيل الخروج</p>
              <p className="text-gray-600 text-xs mt-0.5">الخروج من جميع الجلسات</p>
            </div>
            <ChevronRight size={16} className="text-gray-700" style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>

        {/* Info Section */}
        <div style={glass} className="overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">القانوني والدعم</p>
          </div>

          {/* Privacy Policy */}
          <button onClick={() => navigate('/privacy')} className="w-full flex items-center gap-4 px-4 py-4 border-b transition-all active:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.06)', userSelect: 'none' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <Shield size={16} style={{ color: '#9F5FF1' }} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-white text-sm font-medium">سياسة الخصوصية</p>
              <p className="text-gray-600 text-xs mt-0.5">كيف نحمي بياناتك</p>
            </div>
            <ChevronRight size={16} className="text-gray-700" style={{ transform: 'rotate(180deg)' }} />
          </button>

          {/* Terms & Conditions */}
          <button onClick={() => navigate('/terms')} className="w-full flex items-center gap-4 px-4 py-4 border-b transition-all active:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.06)', userSelect: 'none' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
              <FileText size={16} style={{ color: '#60A5FA' }} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-white text-sm font-medium">الشروط والأحكام</p>
              <p className="text-gray-600 text-xs mt-0.5">قواعد استخدام المنصة</p>
            </div>
            <ChevronRight size={16} className="text-gray-700" style={{ transform: 'rotate(180deg)' }} />
          </button>

          {/* Contact Us */}
          <a href="mailto:wafr.support@gmail.com" className="w-full flex items-center gap-4 px-4 py-4 transition-all active:bg-white/5" style={{ userSelect: 'none', display: 'flex' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Mail size={16} style={{ color: '#34D399' }} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-white text-sm font-medium">تواصل معنا</p>
              <p className="text-gray-600 text-xs mt-0.5">wafr.support@gmail.com</p>
            </div>
            <ChevronRight size={16} className="text-gray-700" style={{ transform: 'rotate(180deg)' }} />
          </a>
        </div>

        {/* Danger Zone */}
        <div style={{ ...glass, border: '1px solid rgba(248,113,113,0.2)' }} className="overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(248,113,113,0.1)' }}>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(248,113,113,0.7)' }}>منطقة الخطر</p>
          </div>
          <button onClick={() => navigate('/delete-account')} className="w-full flex items-center gap-4 px-4 py-4 transition-all active:bg-red-500/5" style={{ userSelect: 'none' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <Trash2 size={16} style={{ color: '#F87171' }} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-medium" style={{ color: '#F87171' }}>حذف الحساب</p>
              <p className="text-gray-600 text-xs mt-0.5">حذف نهائي لا يمكن التراجع عنه</p>
            </div>
            <ChevronRight size={16} className="text-gray-700" style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>

        {/* App info */}
        <div className="text-center pt-4 space-y-1">
          <p className="text-gray-700 text-xs">وفر · الإصدار 1.0.0</p>
          <p className="text-gray-800 text-xs">جميع الحقوق محفوظة © 2026</p>
        </div>
      </div>
    </div>
  );
}