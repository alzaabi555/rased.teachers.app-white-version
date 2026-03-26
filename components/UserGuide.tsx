import React, { useState, useMemo } from 'react';
import {
  Home, Users, Calendar, BarChart, Award, Settings, BookOpen, 
  Download, Menu, X, WifiOff, MessageCircle, FileText, Shield, 
  CheckCircle, PenTool, PieChart, Printer, Save, RefreshCw, 
  Trash2, Share2, MousePointer, User, Bell, File, Clock, Star
} from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useApp } from '../context/AppContext';

// --- Components ---

type DetailCardProps = {
  icon: React.ElementType;
  title: string;
  desc: string;
  details?: string[];
  colorClass?: string;
};

const DetailCard: React.FC<DetailCardProps> = ({ icon: Icon, title, desc, details, colorClass }) => (
  <div className="p-6 rounded-[2rem] border transition-all duration-300 bg-white border-slate-200 hover:border-blue-300 hover:shadow-md group">
    <div className="flex items-start gap-4">
      <div className={`p-3.5 rounded-2xl shrink-0 transition-colors ${colorClass ?? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
        <Icon size={24} />
      </div>
      <div>
        <h4 className="font-black text-lg mb-2 text-slate-800">{title}</h4>
        <p className="text-sm leading-relaxed font-bold mb-3 text-slate-500">{desc}</p>
        {details && (
          <ul className="space-y-2 mt-4 border-t pt-4 border-slate-100">
            {details.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-600">
                <span className="text-blue-500 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
);

const UserGuide: React.FC = () => {
  const { t, dir } = useApp(); 
  const [activeSection, setActiveSection] = useState('hero');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const menuItems = useMemo(
    () => [
      { id: 'dashboard', label: t('dashboardMenu'), icon: Home },
      { id: 'attendance', label: t('attendanceMenu'), icon: Calendar },
      { id: 'students', label: t('studentsMenu'), icon: Users },
      { id: 'grades', label: t('gradesMenu'), icon: BarChart },
      { id: 'knights', label: t('knightsMenu'), icon: Award },
      { id: 'reports', label: t('reportsMenu'), icon: Printer },
      { id: 'settings', label: t('settingsMenu'), icon: Settings },
    ],
    [t]
  );

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
        // إضافة offset لتعويض الهيدر الثابت
        const yOffset = -80; 
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setSidebarOpen(false);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);

      const element = document.getElementById('guide-content-inner');
      
      if (!element) {
        alert(t('alertNoContentFound'));
        return;
      }

      const opt = {
        margin: [10, 10, 10, 10],
        filename: 'Rased_Manual.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#f8fafc',
            scrollY: 0 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      const worker = html2pdf().set(opt).from(element);

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = await worker.output('datauristring');
        const base64Data = pdfBase64.split(',')[1];

        const result = await Filesystem.writeFile({
          path: `Rased_Manual_${new Date().getTime()}.pdf`,
          data: base64Data,
          directory: Directory.Cache,
        });
        
        await Share.share({ 
            title: t('exportPdfTitle'), 
            url: result.uri,
            dialogTitle: t('exportPdfDialogTitle')
        });
      } else {
        worker.save();
      }
    } catch (e) {
      console.error("PDF Export Error:", e);
      alert(t('pdfErrorMsg'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 bg-slate-50 text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
      
      {/* 📱 خلفية شفافة للقائمة الجانبية في الجوال */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isSidebarOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} 
        onClick={() => setSidebarOpen(false)} 
      />

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed inset-y-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} z-50 w-72 shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isSidebarOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')} lg:translate-x-0 lg:static
          bg-white border-slate-200 ${dir === 'rtl' ? 'border-l' : 'border-r'}
        `}
      >
        <div className="h-full flex flex-col pt-[env(safe-area-inset-top)]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[1rem] bg-blue-50 text-blue-600 border border-blue-100">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-black text-xl text-slate-800">{t('rasedGuideTitle')}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-xl transition-colors text-slate-400 hover:bg-rose-50 hover:text-rose-500 active:scale-95" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-[1rem] text-sm font-bold transition-all duration-300
                  ${
                    activeSection === item.id
                      ? `bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-[1.02]`
                      : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'opacity-100' : 'opacity-70'}`} />
                {item.label}
              </button>
            ))}
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 active:scale-95"
            >
              {isExporting ? (
                <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> {t('savingStatus')}</span>
              ) : (
                <>
                  <Download size={18} /> {t('downloadPdfBtn')}
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar bg-slate-50" id="main-scroll-area">
        
        {/* Mobile Menu Button - متوافق مع النوتش */}
        <div className="sticky top-0 z-30 lg:hidden px-4 pt-[env(safe-area-inset-top)] pb-2 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="flex items-center mt-2 gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button
                onClick={() => setSidebarOpen(true)}
                className="p-3 rounded-xl shadow-sm transition-all bg-white border border-slate-200 text-slate-600 active:scale-95"
                >
                <Menu size={24} />
                </button>
                <span className="font-black text-lg text-slate-800">{t('rasedGuideTitle')}</span>
            </div>
        </div>

        <div id="guide-content-inner" className="w-full bg-slate-50" dir={dir}>

            {/* الهيدر المفتوح (Hero) */}
            <header id="hero" className="relative px-6 text-center border-b border-slate-200 bg-white transition-all pb-16 pt-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black mb-6 border bg-blue-50 border-blue-100 text-blue-600">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> {t('versionTag')}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-800 mb-6 leading-tight">
                {t('userGuideComprehensive')} <span className="text-blue-600 block sm:inline mt-2 sm:mt-0">{t('comprehensiveText')}</span>
              </h1>
              <p className="text-base md:text-lg max-w-2xl mx-auto font-bold text-slate-500 leading-relaxed">
                {t('heroDescription')}
              </p>
            </header>

            <div className="max-w-5xl mx-auto px-6 pb-32 space-y-24 pt-12">
              
              {/* 1. Dashboard */}
              <section id="dashboard" className="scroll-mt-32">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                    <Home className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">{t('sec1Title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailCard
                    icon={User}
                    colorClass="bg-blue-50 text-blue-600"
                    title={t('sec1Card1Title')}
                    desc={t('sec1Card1Desc')}
                    details={[t('sec1Card1Det1'), t('sec1Card1Det2'), t('sec1Card1Det3'), t('sec1Card1Det4')]}
                  />
                  <DetailCard
                    icon={Calendar}
                    colorClass="bg-amber-50 text-amber-600"
                    title={t('sec1Card2Title')}
                    desc={t('sec1Card2Desc')}
                    details={[t('sec1Card2Det1'), t('sec1Card2Det2'), t('sec1Card2Det3')]}
                  />
                  <DetailCard
                    icon={Bell}
                    colorClass="bg-rose-50 text-rose-600"
                    title={t('sec1Card3Title')}
                    desc={t('sec1Card3Desc')}
                    details={[t('sec1Card3Det1'), t('sec1Card3Det2'), t('sec1Card3Det3')]}
                  />
                  <DetailCard
                    icon={Clock}
                    colorClass="bg-emerald-50 text-emerald-600"
                    title={t('sec1Card4Title')}
                    desc={t('sec1Card4Desc')}
                    details={[t('sec1Card4Det1'), t('sec1Card4Det2')]}
                  />
                </div>
              </section>

              {/* 2. Attendance */}
              <section id="attendance" className="scroll-mt-32">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">{t('sec2Title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailCard
                    icon={CheckCircle}
                    colorClass="bg-emerald-50 text-emerald-600"
                    title={t('sec2Card1Title')}
                    desc={t('sec2Card1Desc')}
                    details={[t('sec2Card1Det1'), t('sec2Card1Det2'), t('sec2Card1Det3'), t('sec2Card1Det4')]}
                  />
                  <DetailCard
                    icon={MousePointer}
                    colorClass="bg-blue-50 text-blue-600"
                    title={t('sec2Card2Title')}
                    desc={t('sec2Card2Desc')}
                    details={[t('sec2Card2Det1'), t('sec2Card2Det2'), t('sec2Card2Det3'), t('sec2Card2Det4'), t('sec2Card2Det5')]}
                  />
                  <DetailCard
                    icon={MessageCircle}
                    colorClass="bg-purple-50 text-purple-600"
                    title={t('sec2Card3Title')}
                    desc={t('sec2Card3Desc')}
                    details={[t('sec2Card3Det1'), t('sec2Card3Det2'), t('sec2Card3Det3')]}
                  />
                  <DetailCard
                    icon={Share2}
                    colorClass="bg-orange-50 text-orange-600"
                    title={t('sec2Card4Title')}
                    desc={t('sec2Card4Desc')}
                    details={[t('sec2Card4Det1'), t('sec2Card4Det2'), t('sec2Card4Det3')]}
                  />
                </div>
              </section>

              {/* 3. Students */}
              <section id="students" className="scroll-mt-32">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-pink-50 text-pink-600 border border-pink-100 shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">{t('sec3Title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailCard
                    icon={Award}
                    colorClass="bg-amber-50 text-amber-600"
                    title={t('sec3Card1Title')}
                    desc={t('sec3Card1Desc')}
                    details={[t('sec3Card1Det1'), t('sec3Card1Det2'), t('sec3Card1Det3')]}
                  />
                  <DetailCard
                    icon={Clock}
                    colorClass="bg-cyan-50 text-cyan-600"
                    title={t('sec3Card2Title')}
                    desc={t('sec3Card2Desc')}
                    details={[t('sec3Card2Det1'), t('sec3Card2Det2'), t('sec3Card2Det3')]}
                  />
                  <DetailCard
                    icon={File}
                    colorClass="bg-indigo-50 text-indigo-600"
                    title={t('sec3Card3Title')}
                    desc={t('sec3Card3Desc')}
                    details={[t('sec3Card3Det1'), t('sec3Card3Det2'), t('sec3Card3Det3')]}
                  />
                  <DetailCard
                    icon={Star}
                    colorClass="bg-yellow-50 text-yellow-600"
                    title={t('sec3Card4Title')}
                    desc={t('sec3Card4Desc')}
                    details={[t('sec3Card4Det1'), t('sec3Card4Det2')]}
                  />
                </div>
              </section>

              {/* 4. Grades */}
              <section id="grades" className="scroll-mt-32">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                    <BarChart className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">{t('sec4Title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailCard
                    icon={PenTool}
                    colorClass="bg-emerald-50 text-emerald-600"
                    title={t('sec4Card1Title')}
                    desc={t('sec4Card1Desc')}
                    details={[t('sec4Card1Det1')]}
                  />
                  <DetailCard
                    icon={Settings}
                    colorClass="bg-slate-100 text-slate-600"
                    title={t('sec4Card2Title')}
                    desc={t('sec4Card2Desc')}
                    details={[t('sec4Card2Det1')]}
                  />
                  <DetailCard
                    icon={PieChart}
                    colorClass="bg-purple-50 text-purple-600"
                    title={t('sec4Card3Title')}
                    desc={t('sec4Card3Desc')}
                    details={[t('sec4Card3Det1')]}
                  />
                  <DetailCard
                    icon={FileText}
                    colorClass="bg-blue-50 text-blue-600"
                    title={t('sec4Card4Title')}
                    desc={t('sec4Card4Desc')}
                    details={[t('sec4Card4Det1')]}
                  />
                </div>
              </section>

              {/* 5. Knights */}
              <section id="knights" className="scroll-mt-32">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">{t('sec5Title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailCard
                    icon={Award}
                    colorClass="bg-amber-50 text-amber-600"
                    title={t('sec5Card1Title')}
                    desc={t('sec5Card1Desc')}
                    details={[t('sec5Card1Det1')]}
                  />
                  <DetailCard
                    icon={FileText}
                    colorClass="bg-blue-50 text-blue-600"
                    title={t('sec5Card2Title')}
                    desc={t('sec5Card2Desc')}
                    details={[t('sec5Card2Det1')]}
                  />
                  <DetailCard
                    icon={Users}
                    colorClass="bg-emerald-50 text-emerald-600"
                    title={t('sec5Card3Title')}
                    desc={t('sec5Card3Desc')}
                    details={[t('sec5Card3Det1')]}
                  />
                </div>
              </section>

              {/* 6. Reports */}
              <section id="reports" className="scroll-mt-32">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                    <Printer className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">{t('sec6Title')}</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <DetailCard
                    icon={FileText}
                    colorClass="bg-blue-50 text-blue-600"
                    title={t('sec6Card1Title')}
                    desc={t('sec6Card1Desc')}
                    details={[t('sec6Card1Det1')]}
                  />
                  <DetailCard
                    icon={Printer}
                    colorClass="bg-indigo-50 text-indigo-600"
                    title={t('sec6Card2Title')}
                    desc={t('sec6Card2Desc')}
                    details={[t('sec6Card2Det1')]}
                  />
                  <DetailCard
                    icon={Shield}
                    colorClass="bg-emerald-50 text-emerald-600"
                    title={t('sec6Card3Title')}
                    desc={t('sec6Card3Desc')}
                    details={[t('sec6Card3Det1')]}
                  />
                </div>
              </section>

              {/* 7. Settings */}
              <section id="settings" className="scroll-mt-32 border-t border-slate-200 pt-16">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
                    <Settings className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">{t('sec7Title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailCard
                    icon={Save}
                    colorClass="bg-blue-50 text-blue-600"
                    title={t('sec7Card1Title')}
                    desc={t('sec7Card1Desc')}
                    details={[t('sec7Card1Det1')]}
                  />
                  <DetailCard
                    icon={RefreshCw}
                    colorClass="bg-emerald-50 text-emerald-600"
                    title={t('sec7Card2Title')}
                    desc={t('sec7Card2Desc')}
                    details={[t('sec7Card2Det1')]}
                  />
                  <DetailCard
                    icon={Trash2}
                    colorClass="bg-rose-50 text-rose-600"
                    title={t('sec7Card3Title')}
                    desc={t('sec7Card3Desc')}
                    details={[t('sec7Card3Det1')]}
                  />
                  <DetailCard
                    icon={WifiOff}
                    colorClass="bg-slate-100 text-slate-600"
                    title={t('sec7Card4Title')}
                    desc={t('sec7Card4Desc')}
                    details={[t('sec7Card4Det1')]}
                  />
                </div>
              </section>
            </div>

            <footer className="text-center py-10 text-sm font-bold border-t border-slate-200 text-slate-500 bg-white">
              {t('footerText1')} {new Date().getFullYear()}
            </footer>

        </div> 
      </main>
    </div>
  );
};

export default UserGuide;