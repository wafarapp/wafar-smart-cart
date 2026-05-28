import { useNavigate } from 'react-router-dom';
import { ChevronRight, Shield, Mail, MapPin, Bell, Trash2, User, Edit3, Share2, Lock, Eye } from 'lucide-react';

const sections = [
  {
    id: 1,
    icon: Eye,
    color: '#60A5FA',
    title: '١. المعلومات التي نجمعها',
    content: [
      {
        subtitle: 'معلومات الحساب',
        text: 'عند إنشاء حساب على وفر، نجمع اسمك، رقم جوالك، وعنوانك. هذه المعلومات ضرورية لتقديم خدمة التوصيل.',
      },
      {
        subtitle: 'بيانات الموقع الجغرافي',
        text: 'نطلب إذن الوصول إلى موقعك الجغرافي لتحديد البقالات القريبة منك وحساب رسوم التوصيل بدقة. يمكنك إدارة هذا الإذن من إعدادات جهازك في أي وقت.',
      },
      {
        subtitle: 'بيانات الطلبات',
        text: 'نحتفظ بسجل طلباتك وتفاصيلها (المنتجات، الأسعار، البقالة المختارة) لتمكينك من تتبع طلباتك وعرض سجلك الشرائي.',
      },
      {
        subtitle: 'بيانات الجهاز',
        text: 'قد نجمع معلومات تقنية عن جهازك مثل نظام التشغيل ونوع المتصفح لتحسين أداء التطبيق وتجربة المستخدم.',
      },
    ],
  },
  {
    id: 2,
    icon: Shield,
    color: '#34D399',
    title: '٢. كيفية استخدام المعلومات',
    content: [
      { subtitle: 'تنفيذ الطلبات', text: 'نستخدم بياناتك لمعالجة طلباتك، والتواصل مع المتاجر والسائقين، وضمان وصول طلبك في الوقت المحدد.' },
      { subtitle: 'تحسين الخدمة', text: 'نحلل بيانات الاستخدام (بشكل مجمّع وغير شخصي) لفهم سلوك المستخدمين وتطوير ميزات جديدة تلبي احتياجاتك.' },
      { subtitle: 'الإشعارات', text: 'نرسل إشعارات تتعلق بحالة طلبك (قبول، تجهيز، توصيل). يمكنك تعطيل الإشعارات من إعدادات جهازك، علمًا بأن ذلك قد يؤثر على تجربة التتبع.' },
      { subtitle: 'أمان الحساب', text: 'نستخدم بياناتك للتحقق من هويتك وحماية حسابك من الوصول غير المصرح به.' },
    ],
  },
  {
    id: 3,
    icon: Share2,
    color: '#F59E0B',
    title: '٣. مشاركة البيانات',
    content: [
      { subtitle: 'البقالات والمتاجر', text: 'نشارك معلومات طلبك (الاسم، رقم الجوال، العنوان) مع البقالة المختارة لتمكينها من تجهيز وتسليم طلبك.' },
      { subtitle: 'سائقو التوصيل', text: 'يحصل السائق على عنوانك ورقم جوالك لإتمام عملية التوصيل فقط، ولا تُستخدم هذه البيانات لأي غرض آخر.' },
      { subtitle: 'لا بيع للبيانات', text: 'نحن لا نبيع بياناتك الشخصية أو نؤجرها أو نتاجر بها مع أي طرف ثالث تحت أي ظرف من الظروف.' },
      { subtitle: 'الجهات الحكومية', text: 'قد نفصح عن البيانات للجهات الحكومية السعودية المختصة إذا طُلب ذلك بموجب القانون أو الأنظمة المعمول بها في المملكة العربية السعودية.' },
    ],
  },
  {
    id: 4,
    icon: Lock,
    color: '#9F5FF1',
    title: '٤. حماية البيانات',
    content: [
      { subtitle: 'التشفير', text: 'تُنقل جميع بياناتك عبر بروتوكول HTTPS المشفر. كما نشفّر البيانات الحساسة المخزنة على خوادمنا.' },
      { subtitle: 'التخزين الآمن', text: 'تُخزَّن بياناتك على خوادم محمية بجدران حماية متقدمة وأنظمة كشف التسلل.' },
      { subtitle: 'الوصول المحدود', text: 'لا يصل إلى بياناتك إلا الموظفون المخوّلون الذين يحتاجون إليها لأداء وظائفهم، وهم ملزمون بسياسات سرية صارمة.' },
      { subtitle: 'مدة الاحتفاظ', text: 'نحتفظ ببياناتك طالما حسابك نشطًا أو حسبما يقتضيه تقديم الخدمة. يمكنك طلب حذف بياناتك في أي وقت.' },
    ],
  },
  {
    id: 5,
    icon: Trash2,
    color: '#F87171',
    title: '٥. حذف الحساب',
    content: [
      { subtitle: 'طريقة الحذف', text: 'يمكنك حذف حسابك في أي وقت من خلال الانتقال إلى صفحة الإعدادات في التطبيق، ثم الضغط على "حذف الحساب" في قسم المنطقة الحساسة.' },
      { subtitle: 'ما يحدث عند الحذف', text: 'عند حذف حسابك، يتم حذف جميع بياناتك الشخصية بشكل دائم خلال 30 يومًا. قد نحتفظ ببعض البيانات المجمّعة وغير الشخصية للإحصاءات.' },
      { subtitle: 'الطلبات الجارية', text: 'إذا كان لديك طلب قيد التنفيذ وقت الحذف، يُرجى إكمال الطلب أولًا أو التواصل مع الدعم لترتيب الأمور.' },
    ],
  },
  {
    id: 6,
    icon: User,
    color: '#6EE7B7',
    title: '٦. حقوق المستخدم',
    content: [
      { subtitle: 'حق الاطلاع', text: 'يحق لك الاطلاع على جميع البيانات الشخصية التي نحتفظ بها عنك، وطلب نسخة منها في أي وقت.' },
      { subtitle: 'حق التصحيح', text: 'يمكنك تحديث بياناتك الشخصية مباشرة من إعدادات التطبيق أو بالتواصل مع فريق الدعم.' },
      { subtitle: 'حق الحذف', text: 'يحق لك طلب حذف بياناتك الشخصية، وسنستجيب لطلبك خلال 30 يوم عمل وفقًا لأنظمة حماية البيانات السارية في المملكة العربية السعودية.' },
      { subtitle: 'حق الاعتراض', text: 'يمكنك الاعتراض على معالجة بياناتك لأغراض معينة كالتسويق، مع الإشارة إلى أن ذلك قد يؤثر على بعض ميزات التطبيق.' },
    ],
  },
  {
    id: 7,
    icon: Edit3,
    color: '#FCD34D',
    title: '٧. التعديلات على السياسة',
    content: [
      { subtitle: 'حق التحديث', text: 'نحتفظ بحق تحديث سياسة الخصوصية هذه في أي وقت لتعكس التغييرات في ممارساتنا أو متطلبات الأنظمة.' },
      { subtitle: 'الإخطار بالتغييرات', text: 'في حالة إجراء تغييرات جوهرية، سنخطرك عبر الإشعارات داخل التطبيق أو برسالة على جوالك المسجل قبل سريان التعديلات.' },
      { subtitle: 'الاستمرار في الاستخدام', text: 'يُعدّ استمرارك في استخدام التطبيق بعد إخطارك بالتغييرات قبولًا منك للسياسة المحدّثة.' },
    ],
  },
  {
    id: 8,
    icon: Mail,
    color: '#60A5FA',
    title: '٨. التواصل معنا',
    content: [
      { subtitle: 'الدعم والاستفسارات', text: 'إذا كان لديك أي استفسار حول سياسة الخصوصية أو طلبت ممارسة أي من حقوقك المذكورة أعلاه، يسعدنا التواصل معك.' },
    ],
    contact: true,
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div dir="rtl" className="min-h-screen pb-16" style={{ background: '#0D0D1A' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(13,13,26,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-sm">سياسة الخصوصية</h1>
          <p className="text-gray-500 text-xs">وفر | Wafr</p>
        </div>
        <div className="p-2 rounded-xl" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <Shield size={16} style={{ color: '#9F5FF1' }} />
        </div>
      </div>

      {/* Hero Banner */}
      <div className="mx-4 mt-5 p-5 rounded-3xl text-center"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(159,95,241,0.1))', border: '1px solid rgba(124,58,237,0.3)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #9F5FF1)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
          <Shield size={28} className="text-white" />
        </div>
        <h2 className="text-white font-black text-xl mb-1">خصوصيتك أولويتنا</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          نلتزم بحماية بياناتك الشخصية وفقًا لأنظمة حماية البيانات المعمول بها في المملكة العربية السعودية.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: '#34D399' }}>
          آخر تحديث: مايو ٢٠٢٦
        </div>
      </div>

      {/* Permission Badges */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        {[
          { icon: MapPin, label: 'إذن الموقع', desc: 'لتحديد البقالات القريبة', color: '#34D399' },
          { icon: Bell, label: 'إذن الإشعارات', desc: 'لتتبع حالة طلبك', color: '#60A5FA' },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="p-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
              style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <p className="text-white text-xs font-bold">{label}</p>
            <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="mx-4 mt-4 space-y-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Section Header */}
              <div className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: `${section.color}0a` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${section.color}18`, border: `1px solid ${section.color}33` }}>
                  <Icon size={16} style={{ color: section.color }} />
                </div>
                <h3 className="text-white font-bold text-sm">{section.title}</h3>
              </div>

              {/* Section Content */}
              <div className="px-4 py-3 space-y-3.5">
                {section.content.map((item, i) => (
                  <div key={i}>
                    <p className="text-xs font-bold mb-1" style={{ color: section.color }}>{item.subtitle}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}

                {section.contact && (
                  <a href="mailto:wafr.support@gmail.com"
                    className="flex items-center gap-3 p-3 rounded-xl mt-2"
                    style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(96,165,250,0.15)' }}>
                      <Mail size={16} style={{ color: '#60A5FA' }} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">راسلنا على البريد الإلكتروني</p>
                      <p className="text-xs mt-0.5" style={{ color: '#60A5FA' }}>wafr.support@gmail.com</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mx-4 mt-5 p-4 rounded-2xl text-center"
        style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <p className="text-gray-400 text-xs leading-relaxed">
          هذه السياسة تسري وفقًا لأنظمة المملكة العربية السعودية وتتوافق مع نظام حماية البيانات الشخصية (PDPL).
        </p>
        <p className="text-gray-600 text-xs mt-2">© ٢٠٢٦ وفر | Wafr · جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
}