import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import {
  LayoutDashboard, Users, CalendarCheck, BarChart3,
  Settings as SettingsIcon, Info, FileText, BookOpen, Medal, Loader2, CheckSquare, Library, CloudSync,
  MoreHorizontal
} from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import TeacherTasks from './components/TeacherTasks';
import AttendanceTracker from './components/AttendanceTracker';
import GradeBook from './components/GradeBook';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Modal from './components/Modal';
import Leaderboard from './components/Leaderboard';
import About from './components/About';
import UserGuide from './components/UserGuide';
import BrandLogo from './components/BrandLogo';
import WelcomeScreen from './components/WelcomeScreen';
import StudentGroups from './components/StudentGroups';
import TeacherLibrary from './components/TeacherLibrary';
import { useSchoolBell } from './hooks/useSchoolBell';

// زر المزامنة الشامل
import GlobalSyncManager from './components/GlobalSyncManager'; 

// --- ✨ MODERN CLEAN ICONS (بدون الوضع الليلي الإجباري) ---
const NavIconWrapper = ({ active, children }: any) => (
  <div className={`w-full h-full flex flex-col items-center justify-center transition-all duration-300 ${active ? 'scale-110 -translate-y-2' : 'opacity-60 hover:opacity-100'}`}>
    <div className={`relative p-2.5 rounded-[1.2rem] transition-all duration-300 ${active ? 'bg-blue-600 shadow-[0_8px_20px_rgba(37,99,235,0.4)] text-white' : 'text-slate-400'}`}>
      {children}
    </div>
  </div>
);

const DashboardIcon = ({ active }: any) => (
  <NavIconWrapper active={active}>
    <LayoutDashboard size={22} strokeWidth={active ? 2.5 : 2} />
  </NavIconWrapper>
);

const AttendanceIcon = ({ active }: any) => (
  <NavIconWrapper active={active}>
    <CalendarCheck size={22} strokeWidth={active ? 2.5 : 2} />
  </NavIconWrapper>
);

const StudentsIcon = ({ active }: any) => (
  <NavIconWrapper active={active}>
    <Users size={22} strokeWidth={active ? 2.5 : 2} />
  </NavIconWrapper>
);

const GradesIcon = ({ active }: any) => (
  <NavIconWrapper active={active}>
    <BarChart3 size={22} strokeWidth={active ? 2.5 : 2} />
  </NavIconWrapper>
);

const TasksIcon = ({ active }: any) => (
  <NavIconWrapper active={active}>
    <CheckSquare size={22} strokeWidth={active ? 2.5 : 2} />
  </NavIconWrapper>
);

const MoreIcon = ({ active }: any) => (
  <NavIconWrapper active={active}>
    <MoreHorizontal size={22} strokeWidth={active ? 2.5 : 2} />
  </NavIconWrapper>
);

const AppContent: React.FC = () => {
  const {
    isDataLoaded, students, setStudents, classes, setClasses,
    teacherInfo, setTeacherInfo, schedule, setSchedule,
    periodTimes, setPeriodTimes, currentSemester, setCurrentSemester,
    t, dir, language
  } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [appVersion, setAppVersion] = useState('4.4.1');

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        if (window.electron && window.electron.getAppVersion) {
          const ver = await window.electron.getAppVersion();
          setAppVersion(ver);
        } else if (Capacitor.isNativePlatform()) {
          const info = await CapacitorApp.getInfo();
          setAppVersion(info.version);
        }
      } catch (error) { console.error("Version error", error); }
    };
    fetchVersion();
  }, []);

  const [showWelcome, setShowWelcome] = useState<boolean>(() => !localStorage.getItem('rased_welcome_seen'));
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => localStorage.getItem('bell_enabled') === 'true');

  useSchoolBell(periodTimes, schedule, notificationsEnabled);

  const handleToggleNotifications = () => {
    setNotificationsEnabled(prev => {
      const newState = !prev;
      localStorage.setItem('bell_enabled', String(newState));
      return newState;
    });
  };

  const handleFinishWelcome = () => {
    localStorage.setItem('rased_welcome_seen', 'true');
    setShowWelcome(false);
  };

  const mobileNavItems = [
    { id: 'dashboard', label: t('navDashboard') || (dir === 'rtl' ? 'الرئيسية' : 'Dashboard'), IconComponent: DashboardIcon },
    { id: 'attendance', label: t('navAttendance') || (dir === 'rtl' ? 'الغياب' : 'Attendance'), IconComponent: AttendanceIcon },
    { id: 'students', label: t('navStudents') || (dir === 'rtl' ? 'الطلاب' : 'Students'), IconComponent: StudentsIcon },
    { id: 'grades', label: t('navGrades') || (dir === 'rtl' ? 'الدرجات' : 'Grades'), IconComponent: GradesIcon },
    { id: 'tasks', label: t('navTasks') || t('tasks') || (dir === 'rtl' ? 'المهام' : 'Tasks'), IconComponent: TasksIcon },
  ];
  
  const desktopNavItems = [
    { id: 'dashboard', label: t('navDashboard') || (dir === 'rtl' ? 'الرئيسية' : 'Dashboard'), icon: LayoutDashboard },
    { id: 'attendance', label: t('navAttendance') || (dir === 'rtl' ? 'الغياب' : 'Attendance'), icon: CalendarCheck },
    { id: 'students', label: t('navStudents') || (dir === 'rtl' ? 'الطلاب' : 'Students'), icon: Users },
    { id: 'groups', label: t('navGroups') || (dir === 'rtl' ? 'المجموعات' : 'Groups'), icon: Users },
    { id: 'grades', label: t('navGrades') || (dir === 'rtl' ? 'الدرجات' : 'Grades'), icon: BarChart3 },
    { id: 'tasks', label: t('navTasks') || t('tasks') || (dir === 'rtl' ? 'المهام' : 'Tasks'), icon: CheckSquare },
    { id: 'library', label: t('navLibrary') || t('library') || (dir === 'rtl' ? 'المكتبة' : 'Library'), icon: Library },
    { id: 'leaderboard', label: t('navKnights') || (dir === 'rtl' ? 'الفرسان' : 'Leaderboard'), icon: Medal },
    { id: 'reports', label: t('navReports') || (dir === 'rtl' ? 'التقارير' : 'Reports'), icon: FileText },
    { id: 'sync', label: t('navCloudSync') || (dir === 'rtl' ? 'مزامنة السحابة' : 'Cloud Sync'), icon: CloudSync },
    { id: 'guide', label: t('navGuide') || (dir === 'rtl' ? 'الدليل' : 'Guide'), icon: BookOpen },
    { id: 'settings', label: t('navSettings') || (dir === 'rtl' ? 'الإعدادات' : 'Settings'), icon: SettingsIcon },
    { id: 'about', label: t('navAbout') || (dir === 'rtl' ? 'حول' : 'About'), icon: Info },
  ];

  if (!isDataLoaded) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center bg-slate-50 fixed inset-0 z-[99999]" dir={dir}>
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-sm">{t('loadingData') || (dir === 'rtl' ? 'جاري تحميل البيانات...' : 'Loading Data...')}</p>
      </div>
    );
  }

  if (showWelcome) return <WelcomeScreen onFinish={handleFinishWelcome} />;

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setShowMoreMenu(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard
          students={students} teacherInfo={teacherInfo} onUpdateTeacherInfo={(i) => setTeacherInfo(prev => ({ ...prev, ...i }))}
          schedule={schedule} onUpdateSchedule={setSchedule} onSelectStudent={() => { }} onNavigate={handleNavigate}
          onOpenSettings={() => setActiveTab('settings')} periodTimes={periodTimes} setPeriodTimes={setPeriodTimes}
          notificationsEnabled={notificationsEnabled} onToggleNotifications={handleToggleNotifications}
          currentSemester={currentSemester} onSemesterChange={setCurrentSemester}
        />;
      case 'tasks': return <TeacherTasks students={students} teacherSubject={teacherInfo?.subject || 'عام'} />;
      case 'library': return <TeacherLibrary />;
      case 'attendance': return <AttendanceTracker students={students} classes={classes} setStudents={setStudents} />;
      case 'students':
        return <StudentList
          students={students} classes={classes} onAddClass={(n) => setClasses(p => [...p, n])} 
          onAddStudentManually={(n, c, p, a, g, cid) => setStudents(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: n, classes: [c], attendance: [], behaviors: [], grades: [], grade: '', parentPhone: p, avatar: a, gender: g || 'male', parentCode: cid }])}
          onBatchAddStudents={(newS) => setStudents(prev => [...prev, ...newS])} 
          onUpdateStudent={(u) => setStudents(p => p.map(s => s.id === u.id ? u : s))}
          onDeleteStudent={(id) => setStudents(p => p.filter(s => s.id !== id))} 
          onViewReport={() => {}} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} 
          onDeleteClass={(cn) => setClasses(p => p.filter(c => c !== cn))}
        />;
      case 'groups': return <StudentGroups />;
      case 'grades': return <GradeBook students={students} classes={classes} onUpdateStudent={(u) => setStudents(p => p.map(s => s.id === u.id ? u : s))} setStudents={setStudents} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} teacherInfo={teacherInfo} />;
      case 'leaderboard': return <Leaderboard students={students} classes={classes} onUpdateStudent={(u) => setStudents(p => p.map(s => s.id === u.id ? u : s))} teacherInfo={teacherInfo} />;
      case 'reports': return <Reports />;
      case 'sync': return <GlobalSyncManager />;
      case 'guide': return <UserGuide />;
      case 'settings': return <Settings />;
      case 'about': return <About />;
      default: return null;
    }
  };

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden relative bg-slate-50 text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>

      {/* 🖥️ الشريط العلوي المخصص لويندوز */}
      <div 
        className="hidden md:flex w-full h-9 shrink-0 items-center justify-center relative z-[99999] bg-white border-b border-slate-200 shadow-sm"
        style={{ WebkitAppRegion: 'drag' as any }}
      >
        <span className="text-slate-500 text-[10px] font-black tracking-widest uppercase">
          {t('appNameMain') || 'راصد'} - {t('appSubtitleMain') || 'نسخة المعلم'}
        </span>
        <div className="absolute top-0 right-0 w-40 h-full" style={{ WebkitAppRegion: 'no-drag' as any }}></div>
        <div className="absolute top-0 left-0 w-40 h-full" style={{ WebkitAppRegion: 'no-drag' as any }}></div>
      </div>

      {/* محتوى التطبيق الأساسي */}
      <div className="flex flex-1 overflow-hidden relative z-10 w-full">
        
        {/* Sidebar (Desktop) */}
        <aside className={`hidden md:flex w-[260px] flex-col z-50 h-full relative bg-white border-slate-100 shadow-sm ${dir === 'rtl' ? 'border-l' : 'border-r'}`}>
          {/* تم إضافة pt-12 لإنزال القائمة لأسفل قليلاً وإعطاء مساحة جمالية */}
<div className="p-6 pt-12 flex flex-col items-center gap-3 relative z-10 border-b border-slate-50" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="w-16 h-16 shrink-0 bg-blue-50 p-2 rounded-[1.5rem]"><BrandLogo className="w-full h-full" showText={false} /></div>
            <div className="text-center mt-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t('appNameMain') || 'راصد'}</h1>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{t('appSubtitleMain') || 'النسخة المتقدمة'}</span>
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar relative z-10">
            {desktopNavItems.map(item => (
              <button key={item.id} onClick={() => handleNavigate(item.id)} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-[1.2rem] transition-all duration-300 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-[1.02]' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}>
                <item.icon className="w-5 h-5" strokeWidth={activeTab === item.id ? 2.5 : 2} />
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 bg-slate-50/50">
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 md:pb-4 relative z-10">
            <div className="max-w-6xl mx-auto w-full min-h-full">{renderContent()}</div>
          </div>
        </main>
      </div>

      {/* Bottom Nav (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] h-[85px] rounded-t-[2.5rem] flex justify-around items-end pb-3 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        {mobileNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => handleNavigate(item.id)} className="relative w-full h-full flex flex-col items-center justify-end pb-1.5 outline-none">
              <div className="w-12 h-12 flex items-center justify-center">
                 <item.IconComponent active={isActive} />
              </div>
              <span className={`text-[10px] font-black transition-colors duration-300 mt-1 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{item.label}</span>
            </button>
          );
        })}
        <button onClick={() => setShowMoreMenu(true)} className="relative w-full h-full flex flex-col items-center justify-end pb-1.5 outline-none">
          <div className="w-12 h-12 flex items-center justify-center">
            <MoreIcon active={showMoreMenu} />
          </div>
          <span className={`text-[10px] font-black transition-colors duration-300 mt-1 ${showMoreMenu ? 'text-blue-600' : 'text-slate-400'}`}>{t('navMore') || (dir === 'rtl' ? 'المزيد' : 'More')}</span>
        </button>
      </div>

      {/* More Menu Modal (الهاتف) */}
      <Modal isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} className="max-w-md rounded-[2.5rem] mb-[90px] md:hidden z-[10000] bg-transparent overflow-visible bottom-0">
        <div className="p-6 rounded-[2.5rem] border backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-500 bg-white/95 border-slate-100">
          
          <div className="w-14 h-1.5 rounded-full mx-auto mb-6 bg-slate-200"></div>

          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => handleNavigate('groups')} className="group p-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border bg-slate-50 border-slate-100 active:scale-95 transition-all duration-300 hover:bg-emerald-50 hover:border-emerald-100">
              <div className="p-3 rounded-2xl transition-colors bg-white text-emerald-500 shadow-sm group-hover:bg-emerald-500 group-hover:text-white">
                <Users size={22} strokeWidth={2.5} />
              </div>
              <span className="font-black text-[11px] text-slate-600">{t('navGroups') || (dir === 'rtl' ? 'المجموعات' : 'Groups')}</span>
            </button>

            <button onClick={() => handleNavigate('leaderboard')} className="group p-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border bg-slate-50 border-slate-100 active:scale-95 transition-all duration-300 hover:bg-amber-50 hover:border-amber-100">
              <div className="p-3 rounded-2xl transition-colors bg-white text-amber-500 shadow-sm group-hover:bg-amber-500 group-hover:text-white">
                <Medal size={22} strokeWidth={2.5} />
              </div>
              <span className="font-black text-[11px] text-slate-600">{t('navKnights') || (dir === 'rtl' ? 'الفرسان' : 'Knights')}</span>
            </button>

            <button onClick={() => handleNavigate('reports')} className="group p-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border bg-slate-50 border-slate-100 active:scale-95 transition-all duration-300 hover:bg-blue-50 hover:border-blue-100">
              <div className="p-3 rounded-2xl transition-colors bg-white text-blue-500 shadow-sm group-hover:bg-blue-500 group-hover:text-white">
                <FileText size={22} strokeWidth={2.5} />
              </div>
              <span className="font-black text-[11px] text-slate-600">{t('navReports') || (dir === 'rtl' ? 'التقارير' : 'Reports')}</span>
            </button>

            <button onClick={() => handleNavigate('settings')} className="group p-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border bg-slate-50 border-slate-100 active:scale-95 transition-all duration-300 hover:bg-slate-100 hover:border-slate-200">
              <div className="p-3 rounded-2xl transition-colors bg-white text-slate-500 shadow-sm group-hover:bg-slate-500 group-hover:text-white">
                <SettingsIcon size={22} strokeWidth={2.5} />
              </div>
              <span className="font-black text-[11px] text-slate-600">{t('navSettings') || (dir === 'rtl' ? 'الإعدادات' : 'Settings')}</span>
            </button>

            <button onClick={() => handleNavigate('guide')} className="group p-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border bg-slate-50 border-slate-100 active:scale-95 transition-all duration-300 hover:bg-cyan-50 hover:border-cyan-100">
              <div className="p-3 rounded-2xl transition-colors bg-white text-cyan-500 shadow-sm group-hover:bg-cyan-500 group-hover:text-white">
                <BookOpen size={22} strokeWidth={2.5} />
              </div>
              <span className="font-black text-[11px] text-slate-600">{t('navGuideShort') || t('navGuide') || (dir === 'rtl' ? 'الدليل' : 'Guide')}</span>
            </button>

            <button onClick={() => handleNavigate('about')} className="group p-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border bg-slate-50 border-slate-100 active:scale-95 transition-all duration-300 hover:bg-rose-50 hover:border-rose-100">
              <div className="p-3 rounded-2xl transition-colors bg-white text-rose-500 shadow-sm group-hover:bg-rose-500 group-hover:text-white">
                <Info size={22} strokeWidth={2.5} />
              </div>
              <span className="font-black text-[11px] text-slate-600">{t('navAbout') || (dir === 'rtl' ? 'حول' : 'About')}</span>
            </button>

            <button onClick={() => handleNavigate('library')} className="group p-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border bg-slate-50 border-slate-100 active:scale-95 transition-all duration-300 hover:bg-fuchsia-50 hover:border-fuchsia-100">
              <div className="p-3 rounded-2xl transition-colors bg-white text-fuchsia-500 shadow-sm group-hover:bg-fuchsia-500 group-hover:text-white">
                <Library size={22} strokeWidth={2.5} />
              </div>
              <span className="font-black text-[11px] text-slate-600">{t('navLibrary') || t('library') || (dir === 'rtl' ? 'المكتبة' : 'Library')}</span>
            </button>

            {/* 🔄 زر المزامنة للهاتف */}
            <button onClick={() => handleNavigate('sync')} className="group p-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 border bg-slate-50 border-slate-100 active:scale-95 transition-all duration-300 hover:bg-indigo-50 hover:border-indigo-100 col-span-2">
              <div className="p-3 rounded-2xl transition-colors bg-white text-indigo-500 shadow-sm group-hover:bg-indigo-500 group-hover:text-white">
                <CloudSync size={22} strokeWidth={2.5} />
              </div>
              <span className="font-black text-[11px] text-slate-600">مزامنة السحابة</span>
            </button>

          </div>
        </div>
      </Modal>

    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppProvider>
      <AppContent />
    </AppProvider>
  </ThemeProvider>
);

export default App;