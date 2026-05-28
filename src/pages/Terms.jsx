import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const sections = [
  {
    icon: '📋',
    title: 'قبول الشروط',
    color: '#9F5FF1',
    content: 'باستخدامك لتطبيق وفر، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى التوقف عن استخدام التطبيق فوراً.',
  },
  {
    icon: '🛒',
    title: 'استخدام الخدمة',
    color: '#60A5FA',
    content: 'تطبيق وفر هو منصة وساطة بين العملاء والبقالات المحلية وسائقي التوصيل. نحن لسنا مسؤولين عن جودة المنتجات المباعة من قِبل البقالات المسجلة. يجب أن يكون المستخدم مقيماً في المناطق التي تغطيها الخدمة.',
  },
  {
    icon: '🔒',
    title: 'الحساب والمسؤولية',
    color: '#34D399',
    content: 'أنت مسؤول عن الحفاظ على سرية بيانات حسابك. يُحظر استخدام التطبيق لأغراض غير مشروعة أو نشر محتوى مسيء. نحتفظ بالحق في تعليق أي حساب يُساء استخدامه دون إشعار مسبق.',
  },
  {
    icon: '💰',
    title: 'الأسعار والدفع',
    color: '#FCD34D',
    content: 'الأسعار المعروضة هي أسعار البقالات المشتركة وقد تتغير دون إشعار مسبق. رسوم التوصيل تُحسب بناءً على المسافة والطلب. الدفع يكون نقداً عند الاستلام أو عبر المحفظة الإلكترونية.',
  },
  {
    icon: '🚚',
    title: 'التوصيل والإلغاء',
    color: '#F59E0B',
    content: 'أوقات التوصيل تقديرية وقد تتأثر بالازدحام أو الظروف الجوية. يمكن إلغاء الطلب قبل قبوله من البقالة. بعد قبول الطلب، يخضع الإلغاء لسياسة الاسترداد المعمول بها.',
  },
  {
    icon: '⚖️',
    title: 'القانون المعمول به',
    color: '#F87171',
    content: 'تخضع هذه الشروط لأحكام نظام التجارة الإلكترونية السعودي وأنظمة هيئة الاتصالات وتقنية المعلومات. يُحل أي نزاع أمام الجهات القضائية المختصة في المملكة العربية السعودية.',
  },
  {
    icon: '🔄',
    title: 'التعديلات',
    color: '#A78BFA',
    content: 'نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر التطبيق. استمرارك في استخدام التطبيق بعد التعديلات يعني قبولك لها.',
  },
];

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div dir="rtl" className="min-h-screen pb-12" style={{ background: '#0D0D1A' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-4 flex items-center gap-3"
        style={{ background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
        <div>
          <h1 className="text-white font-black text-base">الشروط والأحكام</h1>
          <p className="text-gray-600 text-xs">وفر · قواعد الاستخدام</p>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-4 mt-5 p-5 rounded-3xl text-center"
        style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(124,58,237,0.08))', border: '1px solid rgba(96,165,250,0.25)' }}>
        <div className="text-5xl mb-3">📜</div>
        <h2 className="text-white font-black text-lg mb-1">شروط وأحكام الاستخدام</h2>
        <p className="text-gray-400 text-sm">يرجى قراءة هذه الشروط بعناية قبل استخدام تطبيق وفر</p>
        <p className="text-gray-600 text-xs mt-2">آخر تحديث: مايو 2026</p>
      </div>

      {/* Sections */}
      <div className="px-4 mt-5 space-y-3">
        {sections.map((sec, i) => (
          <div key={i} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${sec.color}18`, border: `1px solid ${sec.color}30` }}>
                {sec.icon}
              </div>
              <h3 className="text-white font-bold text-sm">{sec.title}</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{sec.content}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="mx-4 mt-5 p-4 rounded-2xl text-center"
        style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
        <p className="text-gray-400 text-sm mb-2">لأي استفسار حول هذه الشروط</p>
        <a href="mailto:wafr.support@gmail.com"
          className="font-bold text-sm"
          style={{ color: '#34D399' }}>
          wafr.support@gmail.com
        </a>
      </div>
    </div>
  );
}