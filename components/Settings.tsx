import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, AlertTriangle, FileJson, Trash2, 
  Download, RefreshCw, Loader2, Zap, Database, ArrowRight, Globe, Settings as SettingsIcon 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

// ✅ أيقونات 3D فخمة للوضع الفاتح
const Icon3DProfile = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <defs>
      <linearGradient id="gradP" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <circle cx="50" cy="35" r="18" fill="url(#gradP)" filter="url(#glow)" />
    <path d="M20 85 Q50 100 80 85 V75 Q50 55 20 75 Z" fill="url(#gradP)" />
  </svg>
);

const Icon3DDatabase = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <defs>
      <linearGradient id="gradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <path d="M20 30 Q50 15 80 30 V70 Q50 85 20 70 Z" fill="url(#gradD)" filter="url(#glow)" />
    <path d="M20 50 Q50 35 80 50" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
  </svg>
);

const Settings = () => {
  const { 
    teacherInfo, setTeacherInfo, students, setStudents, 
    classes, setClasses, schedule, setSchedule, 
    periodTimes, setPeriodTimes, assessmentTools, setAssessmentTools,
    certificateSettings, setCertificateSettings, hiddenClasses, setHiddenClasses,
    groups, setGroups, categorizations, setCategorizations, gradeSettings, setGradeSettings,
    language, setLanguage, t, dir 
  } = useApp();

  const [name, setName] = useState(teacherInfo?.name || '');
  const [school, setSchool] = useState(teacherInfo?.school || '');
  const [civilId, setCivilId] = useState(teacherInfo?.civilId || ''); 
  
  const [loading, setLoading] = useState<'backup' | 'restore' | 'reset' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      setName(teacherInfo?.name || '');
      setSchool(teacherInfo?.school || '');
      setCivilId(teacherInfo?.civilId || '');
  }, [teacherInfo]);

  // 🌍 زر تبديل اللغة
  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  // ✅ الدوال الأساسية للنسخ الاحتياطي (محلياً Local Backup)
  const handleBackup = async () => {
    setLoading('backup');
    try {
      const dataToSave = {
        version: '3.8.7', timestamp: new Date().toISOString(),
        students, classes, hiddenClasses, groups, schedule, periodTimes, 
        teacherInfo, assessmentTools, certificateSettings, categorizations, gradeSettings
      };
      const fileName = `Rased_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const jsonString = JSON.stringify(dataToSave, null, 2);

      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({ path: fileName, data: jsonString, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: 'Rased Backup', url: result.uri });
      } else {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = fileName;
        document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      }
      alert(t('alertExportSuccess'));
    } catch (error) { alert(t('alertExportError')); } finally { setLoading(null); }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !confirm(t('alertConfirmRestore'))) return;
    setLoading('restore');
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target?.result as string);
            if (data.students) {
                setStudents(data.students); setClasses(data.classes || []);
                if(data.hiddenClasses) setHiddenClasses(data.hiddenClasses);
                if(data.groups) setGroups(data.groups);
                if(data.categorizations) setCategorizations(data.categorizations);
                if(data.schedule) setSchedule(data.schedule);
                if(data.periodTimes) setPeriodTimes(data.periodTimes);
                if(data.teacherInfo) setTeacherInfo(data.teacherInfo);
                if(data.assessmentTools) setAssessmentTools(data.assessmentTools);
                if(data.certificateSettings) setCertificateSettings(data.certificateSettings);
                if(data.gradeSettings) setGradeSettings(data.gradeSettings);
                
                if (Capacitor.isNativePlatform() || (window as any).electron !== undefined) {
                    await Filesystem.writeFile({ path: 'raseddatabasev2.json', data: event.target?.result as string, directory: Directory.Data, encoding: Encoding.UTF8 });
                }
                alert(t('alertRestoreSuccess'));
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (error) { alert(t('alertInvalidFile')); } finally { setLoading(null); }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = async () => {
      if (!confirm(t('alertConfirmReset'))) return;
      setLoading('reset');
      try {
          localStorage.clear();
          if (Capacitor.isNativePlatform() || (window as any).electron) {
              await Filesystem.deleteFile({ path: 'raseddatabasev2.json', directory: Directory.Data }).catch(() => {});
          }
          alert(t('alertResetSuccess'));
          window.location.reload();
      } catch (e) { alert('Error'); } finally { setLoading(null); }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-500 relative z-10 font-sans bg-slate-50 text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
      
      {/* ================= 🩺 الهيدر القياسي ================= */}
      <header 
        className="shrink-0 z-40 px-5 pt-[env(safe-area-inset-top)] w-full transition-all duration-300 bg-white border-b border-slate-100 shadow-sm pb-4"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex justify-between items-center max-w-4xl mx-auto w-full mt-4 mb-2">
            <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-[1.2rem] text-blue-600 shadow-sm border border-slate-100">
                    <SettingsIcon className="w-6 h-6" />
                </div>
                <div style={{ WebkitAppRegion: 'no-drag' } as any}>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">{t('settingsTitle')}</h1>
                    <p className="text-[11px] font-bold text-slate-500 mt-1">
                        {t('settingsSubtitle')}
                    </p>
                </div>
            </div>
            
            {/* 🌍 زر التبديل */}
            <button 
              onClick={toggleLanguage} 
              style={{ WebkitAppRegion: 'no-drag' } as any}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-sm bg-slate-50 text-blue-600 hover:bg-blue-50 border border-slate-200"
            >
              <Globe size={18} />
              <span className="hidden sm:inline">{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>
        </div>
      </header>

      {/* ================= 📝 محتوى الصفحة داخل حاوية تمرير مستقلة ================= */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28 custom-scrollbar relative z-10">
        <div className="space-y-6 max-w-4xl relative z-10 mx-auto w-full">
          
          {/* بطاقة الملف الشخصي */}
          <div className="rounded-[2rem] p-8 transition-all duration-300 border bg-white border-slate-200 shadow-sm">
            <div className="flex items-center gap-5 mb-8 border-b border-slate-100 pb-6">
              <Icon3DProfile />
              <div>
                  <h2 className="text-xl font-black text-slate-800">{t('profileTitle')}</h2>
                  <p className="text-xs font-bold text-slate-500 mt-1">{t('profileSubtitle')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                  <label className="text-[10px] font-black mx-2 uppercase text-slate-400 tracking-wider">{t('civilIdLabel')}</label>
                  <input type="text" value={civilId} onChange={e => setCivilId(e.target.value)} className="w-full rounded-[1.5rem] px-5 py-4 border-2 outline-none text-sm font-black transition-all bg-blue-50 border-blue-100 text-blue-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-blue-300" placeholder={t('civilIdPlaceholder')} />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-black mx-2 uppercase text-slate-400 tracking-wider">{t('teacherNameLabel')}</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-[1.5rem] px-5 py-4 border outline-none text-sm font-bold transition-all bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder={t('teacherNamePlaceholder')} />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-black mx-2 uppercase text-slate-400 tracking-wider">{t('schoolNameLabel')}</label>
                  <input value={school} onChange={e => setSchool(e.target.value)} className="w-full rounded-[1.5rem] px-5 py-4 border outline-none text-sm font-bold transition-all bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder={t('schoolNamePlaceholder')} />
              </div>
            </div>

            <button onClick={() => setTeacherInfo({ ...teacherInfo, name, school, civilId })} className="mt-8 w-full py-4 rounded-[1.2rem] font-black text-sm transition-all flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 active:scale-95">
              <Save size={18} /> {t('saveProfileBtn')}
            </button>
          </div>

          {/* بطاقة النسخ المحلي */}
          <div className="rounded-[2rem] p-8 border bg-white border-slate-200 shadow-sm">
            <div className="flex items-center gap-5 mb-8 border-b border-slate-100 pb-6">
              <Icon3DDatabase />
              <div>
                <h2 className="text-xl font-black text-slate-800">{t('backupTitle')}</h2>
                <p className="text-[10px] font-black px-3 py-1.5 rounded-xl mt-2 inline-block bg-emerald-50 text-emerald-600 border border-emerald-100">{t('backupSubtitle')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <button onClick={handleBackup} className="group flex flex-col items-center justify-center p-8 rounded-[1.5rem] bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-black shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95">
                <Database className="w-10 h-10 mb-4" /> {t('createBackupBtn')}
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="group flex flex-col items-center justify-center p-8 rounded-[1.5rem] border-2 border-emerald-100 bg-emerald-50 text-emerald-700 font-black hover:bg-emerald-100 hover:border-emerald-200 hover:-translate-y-1 transition-all active:scale-95">
                <RefreshCw className="w-10 h-10 mb-4" /> {t('importBackupBtn')}
              </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleRestore} />
          </div>

          {/* منطقة الخطر */}
          <div className="rounded-[2rem] p-8 border bg-rose-50/50 border-rose-100 mb-10">
            <button onClick={handleFactoryReset} className="w-full py-4 border-2 border-rose-200 text-rose-600 bg-white rounded-[1.2rem] font-black hover:bg-rose-100 shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95">
              <Trash2 size={18} /> {t('dangerZoneBtn')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;