import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, ShieldCheck, Zap, LayoutDashboard } from 'lucide-react';
import BrandLogo from './BrandLogo';

interface WelcomeScreenProps {
    onFinish: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFinish }) => {
    const [step, setStep] = useState(0);
    
    // 💊 الإبقاء على المتغير البرمجي كما هو في الكود الأصلي
    const isRamadan = true;

    const slides = [
        {
            id: 0,
            icon: <BrandLogo className="w-36 h-36 relative z-10" showText={false} />,
            title: "مرحباً بك في راصد",
            desc: "المساعد الرقمي الذكي للمعلم العماني المحترف. إدارة متكاملة للفصل الدراسي بلمسة واحدة.",
            color: isRamadan ? "text-white" : "text-slate-900", // ألوان أهدأ
        },
        {
            id: 1,
            customContent: (
                <div className="grid grid-cols-2 gap-5 w-full px-2 relative z-10">
                    {[
                        { icon: Check, title: "حضور ذكي", color: "emerald" },
                        { icon: LayoutDashboard, title: "سجل درجات", color: "amber" },
                        { icon: Zap, title: "تقارير شاملة", color: "purple" },
                        { icon: ShieldCheck, title: "يعمل بلا إنترنت", color: "blue" },
                    ].map((item, index) => (
                        <div key={index} className={`p-6 rounded-[2.5rem] flex flex-col items-center text-center transition-all ${isRamadan ? 'bg-white/5 border border-white/10 backdrop-blur-xl' : 'bg-white border border-slate-100 shadow-sm'}`}>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isRamadan ? `bg-${item.color}-500/15 text-${item.color}-300` : `bg-${item.color}-50 text-${item.color}-600`}`}>
                                <item.icon className="w-7 h-7"/>
                            </div>
                            <h3 className={`font-black text-xs md:text-sm ${isRamadan ? 'text-white' : 'text-slate-800'}`}>{item.title}</h3>
                        </div>
                    ))}
                </div>
            ),
            title: "كل ما تحتاجه",
            desc: "تخلى عن السجلات الورقية. رصد الغياب، الدرجات، والسلوك، وإصدار التقارير أصبح أسرع وأسهل.",
            color: isRamadan ? "text-white" : "text-slate-900",
        },
        {
            id: 2,
            icon: (
                <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center shadow-inner relative z-10 transition-colors ${isRamadan ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                    <ShieldCheck className="w-16 h-16" strokeWidth={1.5} />
                </div>
            ),
            title: "بياناتك في أمان",
            desc: "نحن نحترم خصوصيتك. جميع بيانات طلابك وسجلاتك محفوظة محلياً على جهازك فقط ولا يتم مشاركتها سحابياً.\n\nتحياتي لكم / محمد درويش الزعابي",
            color: isRamadan ? "text-emerald-300" : "text-emerald-600",
        }
    ];

    const nextStep = () => {
        if (step < slides.length - 1) {
            setStep(step + 1);
        } else {
            onFinish();
        }
    };

    return (
        <div className={`fixed inset-0 flex flex-col items-center justify-between py-16 px-6 z-[99999] overflow-hidden font-sans transition-colors duration-500 ${isRamadan ? 'bg-[#0b1120]' : 'bg-slate-50'}`}>
            
            {/* ✨ تأثيرات الإضاءة الخلفية (Glow) الهادئة للوضع الداكن ✨ */}
            {isRamadan && (
                <>
                    <div className="absolute top-[-15%] right-[-15%] w-80 h-80 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="absolute bottom-[-15%] left-[-15%] w-80 h-80 bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none"></div>
                </>
            )}

            {/* Top Indicator - زوايا أنعم */}
            <div className="w-full flex justify-center gap-2.5 mt-2 relative z-10">
                {slides.map((s, idx) => (
                    <div 
                        key={idx} 
                        className={`h-2 rounded-full transition-all duration-500 ${step === idx ? (isRamadan ? 'w-10 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'w-10 bg-indigo-700') : (isRamadan ? 'w-2.5 bg-white/10' : 'w-2.5 bg-slate-200')}`}
                    />
                ))}
            </div>

            {/* Content Slider */}
            <div className="flex-1 flex items-center justify-center w-full max-w-lg relative z-10">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} // تأثير حركة أنعم (CircOut)
                        className="flex flex-col items-center text-center w-full"
                    >
                        <div className="mb-12 relative w-full flex justify-center">
                            {slides[step].customContent ? slides[step].customContent : (
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.15, duration: 0.4 }}
                                    className="relative"
                                >
                                    {/* دائرة توهج ناعمة خلف الأيقونات */}
                                    {isRamadan && <div className="absolute inset-2 bg-indigo-500/15 rounded-full blur-3xl"></div>}
                                    {slides[step].icon}
                                </motion.div>
                            )}
                        </div>
                        
                        <h1 className={`text-3xl md:text-4xl font-black mb-5 tracking-tight transition-colors ${slides[step].color}`}>
                            {slides[step].title}
                        </h1>
                        <p className={`font-bold text-sm md:text-base leading-relaxed max-w-[95%] whitespace-pre-line transition-colors ${isRamadan ? 'text-indigo-100/80' : 'text-slate-600/80'}`}>
                            {slides[step].desc}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Actions - زوايا ناعمة وألوان هادئة */}
            <div className="w-full max-w-md space-y-5 relative z-10">
                <button 
                    onClick={nextStep}
                    className={`w-full py-4.5 rounded-[1.5rem] font-black text-base transition-all active:scale-95 flex items-center justify-center gap-2.5 ${isRamadan ? 'bg-indigo-600 text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] hover:bg-indigo-500' : 'bg-indigo-700 text-white shadow-lg shadow-indigo-200/40 hover:bg-indigo-800'}`}
                >
                    {step === slides.length - 1 ? (
                        <>لننطلق <span className="text-xl">🚀</span></>
                    ) : (
                        <>التالي <ChevronLeft className="w-5 h-5 rtl:rotate-180" /></>
                    )
                }
                </button>
                
                {step < slides.length - 1 && (
                    <button 
                        onClick={onFinish}
                        className={`w-full py-2 text-xs font-bold transition-colors ${isRamadan ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                        تخطى المقدمة
                    </button>
                )}
            </div>
        </div>
    );
};

export default WelcomeScreen;