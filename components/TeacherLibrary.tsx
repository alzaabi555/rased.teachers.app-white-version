import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Loader2, CheckCircle2, Check } from 'lucide-react';

// رابط السيرفر المباشر (لإرسال الروابط بأمان دون التأثير على التطبيق)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwMYqSpnXvlMrL6po82-XePyAWBd9FMNCTgY7WlYaOH6pn1kTazLqxEfvremqsSk_dU/exec";

// ✅ أيقونة 3D فخمة للوضع الفاتح مخصصة للمكتبة
const Icon3DLibrary = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <defs>
      <linearGradient id="gradLib" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#7e22ce" />
      </linearGradient>
      <filter id="glowLib"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect x="20" y="25" width="60" height="50" rx="8" fill="url(#gradLib)" filter="url(#glowLib)" />
    <path d="M35 25 V75 M65 25 V75 M35 40 H65 M35 60 H65" stroke="white" strokeWidth="2" opacity="0.4" />
    <rect x="40" y="35" width="20" height="30" rx="2" fill="white" opacity="0.9" />
  </svg>
);

const TeacherLibrary: React.FC = () => {
  // 🌍 استدعاء دالة الترجمة (t) مع باقي المتغيرات
  const { classes, dir, teacherInfo, t } = useApp(); 
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  
  // 🧠 حالة التحديد المتعدد للفصول
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // دالة لاختيار/إلغاء اختيار الفصول
  const toggleClass = (className: string) => {
    setSelectedClasses(prev => 
      prev.includes(className) 
        ? prev.filter(c => c !== className) // إلغاء التحديد
        : [...prev, className]              // إضافة التحديد
    );
  };

  // دالة لتحديد الكل / إلغاء تحديد الكل
  const toggleAllClasses = () => {
    if (selectedClasses.length === classes.length) {
      setSelectedClasses([]); // إلغاء الكل
    } else {
      setSelectedClasses([...classes]); // تحديد الكل
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !link.trim()) return;
    if (selectedClasses.length === 0) {
      alert(t('alertSelectOneClass') || 'الرجاء اختيار فصل واحد على الأقل.');
      return;
    }

    setLoading(true);
    try {
      // 🧠 ذكاء اصطناعي بسيط لمعرفة نوع الرابط
      let type = 'link';
      const lowerLink = link.toLowerCase();
      if (lowerLink.includes('youtube.com') || lowerLink.includes('youtu.be')) type = 'youtube';
      else if (lowerLink.includes('.pdf') || lowerLink.includes('drive.google')) type = 'pdf';

      // 🧠 معالجة التحديد المتعدد لإرساله كنص
      const targetClass = selectedClasses.length === classes.length ? (t('allClasses') || 'الكل') : selectedClasses.join(' , ');

      const payload = {
        resources: [{
          title,
          subject: teacherInfo?.subject || t('unspecified') || 'عام',
          link,
          type,
          targetClass
        }]
      };

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setTitle('');
        setLink('');
        setSelectedClasses([]); // تصفير التحديد بعد الإرسال
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      alert(t('alertSyncError') || 'فشل الاتصال بالسيرفر. تأكد من الإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-500 relative z-10 font-sans bg-slate-50 text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
      
      {/* ================= 🩺 الهيدر القياسي المشرق ================= */}
      <header 
        className="shrink-0 z-40 px-5 pt-[env(safe-area-inset-top)] w-full transition-all duration-300 bg-white border-b border-slate-100 shadow-sm pb-4"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-4 max-w-4xl mx-auto w-full mt-4 mb-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="bg-fuchsia-50 p-2.5 rounded-[1.2rem] shadow-sm border border-fuchsia-100">
              <Icon3DLibrary />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">
                {t('libraryTitle') || 'إدارة المكتبة والمصادر'}
              </h1>
              <p className="text-[11px] font-bold text-slate-500 mt-1">
                {t('librarySubtitle') || 'أرسل شروحات الفيديو والملفات لطلابك بضغطة زر 🚀'}
              </p>
            </div>
        </div>
      </header>

      {/* ================= 📝 محتوى الصفحة ================= */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28 custom-scrollbar relative z-10">
        <div className="max-w-3xl mx-auto w-full">
          
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
            {/* 🌟 رسالة النجاح (Overlay) */}
            {success && (
              <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100 shadow-sm">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 drop-shadow-sm" />
                </div>
                <h2 className="text-xl font-black text-emerald-600">{t('sendSuccess') || 'تم الإرسال للطلاب بنجاح!'}</h2>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-6 relative z-10">
              
              {/* عنوان الدرس */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-1">
                  {t('lessonTitleLabel') || 'عنوان الدرس أو الملف'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('lessonTitlePlaceholder') || "مثال: شرح درس القسمة المطولة..."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 font-bold text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-500/10 focus:border-fuchsia-400 focus:bg-white transition-all"
                  required
                />
              </div>

              {/* رابط الملف */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-1">
                  {t('fileLinkLabel') || 'رابط الملف (يوتيوب أو درايف)'}
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 font-bold text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-500/10 focus:border-fuchsia-400 focus:bg-white transition-all text-left"
                  dir="ltr"
                  required
                />
              </div>

              {/* 🧠 منطقة التحديد المتعدد للفصول (كبسولات ذكية) */}
              <div className="space-y-3 bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                <div className="flex justify-between items-center px-1 border-b border-slate-200/60 pb-3 mb-2">
                  <label className="text-xs font-black text-slate-500">{t('targetClassLabel') || 'إرسال إلى الفصول:'}</label>
                  <button 
                    type="button" 
                    onClick={toggleAllClasses}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 hover:bg-fuchsia-100 transition-colors"
                  >
                    {selectedClasses.length === classes.length ? (t('deselectAll') || 'إلغاء الكل') : (t('selectAll') || 'تحديد الكل')}
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {classes.map((c, i) => {
                    const isSelected = selectedClasses.includes(c);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleClass(c)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-[1rem] text-xs font-bold border transition-all active:scale-95 ${
                          isSelected 
                            ? 'bg-fuchsia-600 border-fuchsia-600 text-white shadow-md shadow-fuchsia-500/30 scale-105' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                        {c}
                      </button>
                    );
                  })}
                </div>
                {selectedClasses.length === 0 && <p className="text-[10px] text-rose-500 font-bold mt-2 px-1">{t('alertSelectOneClass') || 'يرجى اختيار فصل واحد على الأقل'}</p>}
              </div>

              {/* زر الإرسال */}
              <button
                type="submit"
                disabled={loading || selectedClasses.length === 0}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 disabled:active:scale-100 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/30 transition-all active:scale-95 mt-8"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> {t('sendToLibraryBtn') || 'إرسال للمكتبة'}</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherLibrary;