import React from 'react';
import { Users, Phone, ShieldCheck, Mail, GitBranch, Info } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useApp } from '../context/AppContext';

const About: React.FC = () => {
  const { t, dir } = useApp();
  
  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-500 font-sans bg-slate-50 text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
      
      {/* ================= 🩺 الهيدر المشرق ================= */}
      <header className="shrink-0 z-40 px-5 pt-[env(safe-area-inset-top)] w-full transition-all duration-300 bg-white border-b border-slate-100 shadow-sm pb-4" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex justify-between items-center max-w-3xl mx-auto w-full mt-4 mb-2">
            <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-[1.2rem] border border-blue-100 shadow-sm">
                    <Info className="w-6 h-6 text-blue-600" />
                </div>
                <div style={{ WebkitAppRegion: 'no-drag' } as any}>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">{t('navAbout')}</h1>
                    <p className="text-[11px] font-bold text-slate-500 mt-1">{t('appVersionLabel')}</p>
                </div>
            </div>
        </div>
      </header>

      {/* ================= 📝 محتوى الصفحة ================= */}
      <div className="flex-1 overflow-y-auto px-5 pt-10 pb-28 custom-scrollbar relative z-10">
          <div className="flex flex-col items-center max-w-3xl mx-auto animate-in fade-in zoom-in duration-500 relative z-10">
              
              {/* Logo Container */}
              <div className="w-36 h-36 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 flex items-center justify-center mb-8 border border-slate-100 p-5 relative group hover:scale-105 transition-all duration-300 select-none bg-white" style={{ WebkitAppRegion: 'no-drag' } as any}>
                  <BrandLogo className="w-full h-full relative z-10" showText={false} />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter text-slate-800 text-center">{t('appNameAbout')}</h1>
              <p className="px-5 py-2 rounded-full font-black text-xs mb-10 border border-slate-200 shadow-sm text-slate-500 bg-white">
                {t('appVersionLabel')}
              </p>
              
              <div className="w-full space-y-8" style={{ WebkitAppRegion: 'no-drag' } as any}>
                  
                  {/* قسم الملكية الفكرية والتحذير القانوني */}
                  <div className="border border-slate-200 rounded-[2rem] p-8 md:p-10 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-center gap-3 mb-8 justify-center">
                          <ShieldCheck className="w-8 h-8 text-blue-600" />
                          <h2 className="text-2xl font-black text-slate-800">{t('intellectualPropertyTitle')}</h2>
                      </div>
                      
                      <div className="space-y-6 text-sm leading-relaxed text-slate-600 font-medium">
                          <p className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <strong className="text-blue-700 font-black block mb-2 text-base">{t('aboutDeveloperTitle')}</strong>
                              {t('aboutDeveloperDesc')} <span className="font-black text-slate-800 bg-blue-100 px-2 py-0.5 rounded mx-1">{t('developerName')}</span> {t('aboutDeveloperDescCont')}
                          </p>
                          
                          <p className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <strong className="text-blue-700 font-black block mb-2 text-base">{t('ipRightsTitle')}</strong>
                              {t('ipRightsDesc1')} <span className="font-black text-slate-800">"{t('appNameQuote')}"</span> {t('ipRightsDesc2')}
                          </p>

                          <div className="p-6 rounded-2xl border-2 border-dashed bg-rose-50 border-rose-200 mt-8">
                              <p className="font-black mb-4 flex items-center gap-2 text-rose-600 text-base">
                                  <ShieldCheck size={20}/> {t('legalWarningTitle')}
                              </p>
                              <ul className={`list-disc list-inside space-y-2 text-xs md:text-sm font-bold ${dir === 'rtl' ? '' : 'text-left'} text-rose-700/80`}>
                                  <li>{t('legalWarning1')}</li>
                                  <li>{t('legalWarning2')}</li>
                                  <li>{t('legalWarning3')}</li>
                              </ul>
                              <p className="mt-5 text-[10px] md:text-xs font-bold italic text-rose-500 text-center border-t border-rose-200 pt-3">
                                  {t('legalWarningFooter')}
                              </p>
                          </div>
                      </div>
                  </div>

                  {/* قسم فريق العمل والتواصل */}
                  <div className="border border-slate-200 rounded-[2rem] p-8 md:p-10 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* بطاقة المصمم */}
                          <div className="flex items-center gap-4 p-5 rounded-[1.5rem] border bg-slate-50 border-slate-200 hover:border-blue-300 transition-colors group">
                              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                                  <Users size={24} />
                              </div>
                              <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{t('preparationAndDesign')}</p>
                                  <h3 className="text-base font-black text-slate-800">{t('developerName')}</h3>
                              </div>
                          </div>

                          {/* بطاقة الدعم الفني */}
                          <div className="flex items-center gap-4 p-5 rounded-[1.5rem] border bg-slate-50 border-slate-200 hover:border-emerald-300 transition-colors group">
                              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                                  <Phone size={24} />
                              </div>
                              <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{t('techSupport')}</p>
                                  <h3 className="text-base font-black text-slate-800" dir="ltr">98344555</h3>
                              </div>
                          </div>
                      </div>

                      {/* روابط إضافية */}
                      <div className="flex flex-col items-center gap-4 mt-8 pt-8 border-t border-slate-100">
                          <div className="flex justify-center gap-6">
                              <a href="https://github.com/mohammad-alzaabi" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold transition-colors text-slate-500 hover:text-blue-600 bg-slate-100 px-4 py-2 rounded-full">
                                 <GitBranch size={16} /> GitBranch: Rased
                              </a>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-xs font-bold w-full text-slate-500 bg-slate-50 py-3 rounded-xl border border-slate-100">
                              <Mail size={16} className="shrink-0 text-blue-500" /> 
                              <span className="break-all">{t('emailLabel')} mohammad.alzaabi21@edu.moe.om</span>
                          </div>
                      </div>
                  </div>
              </div>
              
              <p className="mt-12 mb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-full">
                  {t('allRightsReservedFooter')} {new Date().getFullYear()}
              </p>
          </div>
      </div>
    </div>
  );
};

export default About;