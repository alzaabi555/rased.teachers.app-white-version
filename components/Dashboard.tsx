import React, { useState, useEffect, useRef } from 'react';
import { ScheduleDay, PeriodTime } from '../types';
import { 
  Bell, Clock, Settings, Edit3,
  School, Download, Loader2, 
  ChevronLeft, User, Check, Camera,
  X, BellOff, Save, CalendarDays, CheckCircle2,
  Plus, Trash2, RefreshCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';

// رسمة افتراضية ناعمة
const DefaultAvatarSVG = ({ gender }: { gender: string }) => (
    <svg viewBox="0 0 100 100" className="w-full h-full bg-blue-50/50" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="40" r="16" fill={gender === 'female' ? '#f472b6' : '#60a5fa'} opacity="0.8"/>
        <path d="M20 90 C20 70 35 60 50 60 C65 60 80 70 80 90" fill={gender === 'female' ? '#f472b6' : '#60a5fa'} opacity="0.6"/>
    </svg>
);

interface DashboardProps {
    students: any[];
    teacherInfo: { name: string; school: string; subject: string; governorate: string; avatar?: string; stamp?: string; ministryLogo?: string; academicYear?: string; gender?: 'male' | 'female' };
    onUpdateTeacherInfo: (info: any) => void;
    schedule: ScheduleDay[];
    onUpdateSchedule: (schedule: ScheduleDay[]) => void;
    onSelectStudent: (student: any) => void;
    onNavigate: (tab: string) => void;
    onOpenSettings: () => void;
    periodTimes: PeriodTime[];
    setPeriodTimes: React.Dispatch<React.SetStateAction<PeriodTime[]>>;
    notificationsEnabled: boolean;
    onToggleNotifications: () => void;
    currentSemester: '1' | '2';
    onSemesterChange: (sem: '1' | '2') => void;
}

interface AssessmentMonth {
    id: string;
    monthIndex: number;
    monthName: string;
    tasks: string[];
}

const Dashboard: React.FC<DashboardProps> = ({
    students, 
    teacherInfo,
    onUpdateTeacherInfo,
    schedule,
    onUpdateSchedule,
    onNavigate,
    periodTimes,
    setPeriodTimes,
    notificationsEnabled,
    onToggleNotifications,
    currentSemester,
    onSemesterChange
}) => {
    const { classes, setSelectedClass, t, dir } = useApp();

    if (!teacherInfo) return <div className="flex items-center justify-center h-screen font-bold text-slate-400">{t('dashboardLoading')}</div>;
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stampInputRef = useRef<HTMLInputElement>(null); 
    const ministryLogoInputRef = useRef<HTMLInputElement>(null); 
    const modalScheduleFileInputRef = useRef<HTMLInputElement>(null);
    const scheduleFileInputRef = useRef<HTMLInputElement>(null);

    const [isImportingPeriods, setIsImportingPeriods] = useState(false);
    const [isImportingSchedule, setIsImportingSchedule] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(teacherInfo?.name || '');
    const [editSchool, setEditSchool] = useState(teacherInfo?.school || '');
    const [editSubject, setEditSubject] = useState(teacherInfo?.subject || '');
    const [editGovernorate, setEditGovernorate] = useState(teacherInfo?.governorate || '');
    const [editAvatar, setEditAvatar] = useState(teacherInfo?.avatar);
    const [editStamp, setEditStamp] = useState(teacherInfo?.stamp);
    const [editMinistryLogo, setEditMinistryLogo] = useState(teacherInfo?.ministryLogo);
    const [editAcademicYear, setEditAcademicYear] = useState(teacherInfo?.academicYear || '');
    const [editGender, setEditGender] = useState<'male' | 'female'>(teacherInfo?.gender || 'male');
    const [editSemester, setEditSemester] = useState<'1' | '2'>(currentSemester || '1');

    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleTab, setScheduleTab] = useState<'timing' | 'classes'>('timing');
    const [editingDayIndex, setEditingDayIndex] = useState(0); 
    const [tempPeriodTimes, setTempPeriodTimes] = useState<PeriodTime[]>([]);
    const [tempSchedule, setTempSchedule] = useState<ScheduleDay[]>([]);

    const [cloudMessage, setCloudMessage] = useState<any>(null);

    const weekDayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'] as const;
    const isRamadan = true;

    const [assessmentPlan, setAssessmentPlan] = useState<AssessmentMonth[]>(() => {
        try {
            const saved = localStorage.getItem('rased_assessment_plan');
            if (saved) return JSON.parse(saved);
        } catch (e) { console.error(e); }
        
        return [
            { id: 'm1', monthIndex: 2, monthName: t('mar'), tasks: [t('oralStart'), t('reportStart'), t('shortQ1'), t('shortQuiz1')] },
            { id: 'm2', monthIndex: 3, monthName: t('apr'), tasks: [t('oralCont'), t('reportCont'), t('shortQ2')] },
            { id: 'm3', monthIndex: 4, monthName: t('may'), tasks: [t('oralSubmit'), t('reportSubmit'), t('shortQuiz2')] }
        ];
    });

    const [showPlanSettingsModal, setShowPlanSettingsModal] = useState(false);
    const [tempPlan, setTempPlan] = useState<AssessmentMonth[]>([]);

    useEffect(() => {
        const checkAnnouncements = async () => {
            try {
                const CLOUD_JSON_URL = "https://raw.githubusercontent.com/alzaabi555/desktop-build/refs/heads/main/message.json";
                const response = await fetch(CLOUD_JSON_URL + "?t=" + new Date().getTime());
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.active && data.id) {
                        const cloudStorageKey = `rased_cloud_msg_${data.id}`;
                        const hasSeenCloud = localStorage.getItem(cloudStorageKey);
                        if (!hasSeenCloud) {
                            setCloudMessage(data);
                            return; 
                        }
                    }
                }
            } catch (error) {}
        };
        const timer = setTimeout(checkAnnouncements, 1500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if(showEditModal) {
            setEditName(teacherInfo.name || '');
            setEditSchool(teacherInfo.school || '');
            setEditSubject(teacherInfo.subject || '');
            setEditGovernorate(teacherInfo.governorate || '');
            setEditAvatar(teacherInfo.avatar);
            setEditStamp(teacherInfo.stamp);
            setEditMinistryLogo(teacherInfo.ministryLogo);
            setEditAcademicYear(teacherInfo.academicYear || '');
            setEditGender(teacherInfo.gender || 'male');
            setEditSemester(currentSemester);
        }
    }, [showEditModal, teacherInfo]); 

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (showScheduleModal) {
            setTempPeriodTimes(JSON.parse(JSON.stringify(periodTimes || [])));
            const currentSchedule = schedule && schedule.length ? schedule : [
                { dayName: t('sunday'), periods: Array(8).fill('') },
                { dayName: t('monday'), periods: Array(8).fill('') },
                { dayName: t('tuesday'), periods: Array(8).fill('') },
                { dayName: t('wednesday'), periods: Array(8).fill('') },
                { dayName: t('thursday'), periods: Array(8).fill('') },
            ];
            setTempSchedule(JSON.parse(JSON.stringify(currentSchedule)));
        }
    }, [showScheduleModal, periodTimes, schedule, t]);

    useEffect(() => {
        if (showPlanSettingsModal) {
            setTempPlan(JSON.parse(JSON.stringify(assessmentPlan)));
        }
    }, [showPlanSettingsModal, assessmentPlan]);

    const getDisplayImage = (avatar: string | undefined, gender: string | undefined) => {
        if (avatar && avatar.length > 50) return avatar;
        return null;
    };

    const getSubjectIcon = (subjectName: string) => {
        if (!subjectName) return null;
        const name = subjectName.trim().toLowerCase();
        const cleanName = name.replace(/[^\u0600-\u06FFa-z0-9\s]/g, '');
        if (cleanName.match(/اسلام|قران|قرآن|دين|توحيد|فقه|تربية اسلامية|حديث|تفسير/)) return <span className="text-2xl">🕌</span>;
        if (cleanName.match(/عربي|لغتي|نحو|ادب|أدب|لغة عربية|بلاغة|عروض/)) return <span className="text-2xl">📜</span>;
        if (cleanName.match(/رياضيات|حساب|جبر|هندسة|رياضة|math/)) return <span className="text-2xl">📐</span>;
        if (cleanName.match(/علوم|فيزياء|كيمياء|احياء|أحياء|biology|science/)) return <span className="text-2xl">🧪</span>;
        if (cleanName.match(/انجليزي|انقليزي|english|لغة انجليزية/)) return <span className="text-2xl">🅰️</span>;
        if (cleanName.match(/حاسوب|تقنية|رقمية|برمجة|كمبيوتر|computer/)) return <span className="text-2xl">💻</span>;
        if (cleanName.match(/اجتماعيات|تاريخ|جغرافيا|جغرافية|وطنية|دراسات|social/)) return <span className="text-2xl">🌍</span>;
        if (cleanName.match(/رياضة|بدنية|تربية بدنية|sport/)) return <span className="text-2xl">⚽</span>;
        if (cleanName.match(/فن|فنون|رسم|تربية فنية|موسيقى|موسيقي/)) return <span className="text-2xl">🎨</span>;
        if (cleanName.match(/تفكير|ناقد|منطق/)) return <span className="text-2xl">🧠</span>;
        if (cleanName.match(/مهارات|حياتية|مهارة/)) return <span className="text-2xl">🤝</span>;
        return <span className="text-xl opacity-50">📚</span>;
    };

    const handleSaveInfo = () => {
        const updatedInfo = {
            name: editName.trim(),
            school: editSchool.trim(),
            subject: editSubject.trim(),
            governorate: editGovernorate.trim(),
            academicYear: editAcademicYear.trim(),
            avatar: editAvatar,
            stamp: editStamp,
            ministryLogo: editMinistryLogo,
            gender: editGender
        };
        onUpdateTeacherInfo(updatedInfo);
        onSemesterChange(editSemester);
        setShowEditModal(false);
    };

    const handleSaveScheduleSettings = () => {
        setPeriodTimes(tempPeriodTimes);
        onUpdateSchedule(tempSchedule);
        setShowScheduleModal(false);
    };

    const handleSavePlanSettings = () => {
        setAssessmentPlan(tempPlan);
        localStorage.setItem('rased_assessment_plan', JSON.stringify(tempPlan));
        setShowPlanSettingsModal(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | undefined) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                const MAX_SIZE = 400;
                let width = img.width;
                let height = img.height;
                if (width > height) { if (width > MAX_SIZE) { height = (height * MAX_SIZE) / width; width = MAX_SIZE; } } 
                else { if (height > MAX_SIZE) { width = (width * MAX_SIZE) / height; height = MAX_SIZE; } }
                canvas.width = width; canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                const compressedBase64 = canvas.toDataURL('image/png');
                setter(compressedBase64);
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const parseExcelTime = (value: any): string => {
        if (!value) return '';
        if (typeof value === 'number') {
            const totalSeconds = Math.round(value * 86400);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        const str = String(value).trim();
        const match = str.match(/(\d{1,2}):(\d{2})/);
        return match ? `${String(match[1]).padStart(2, '0')}:${match[2]}` : '';
    };

    const handleImportSchedule = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImportingSchedule(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            const newSchedule = JSON.parse(JSON.stringify(tempSchedule));
            jsonData.forEach(row => {
                if (row.length < 2) return;
                const firstCell = String(row[0]).trim();
                const dayIndex = newSchedule.findIndex((d: any) => d.dayName === firstCell || firstCell.includes(d.dayName));
                if (dayIndex !== -1) {
                    for (let i = 1; i <= 8; i++) { if (row[i]) newSchedule[dayIndex].periods[i-1] = String(row[i]).trim(); }
                }
            });
            setTempSchedule(newSchedule);
        } catch (error) { } 
        finally { setIsImportingSchedule(false); if (e.target) e.target.value = ''; }
    };

    const handleImportPeriodTimes = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImportingPeriods(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            let newPeriodTimes = tempPeriodTimes.map(pt => ({ ...pt }));
            if (newPeriodTimes.length === 0) {
                newPeriodTimes = Array(8).fill(null).map(() => ({ startTime: '', endTime: '' }));
            }

            let updatesCount = 0;
            jsonData.forEach((row) => {
                if (row.length < 2) return;
                const firstCol = String(row[0] || '').trim();
                let pIndex = -1;
                const periodNumMatch = firstCol.match(/\d+/);
                
                if (periodNumMatch) {
                    pIndex = parseInt(periodNumMatch[0]) - 1;
                } else {
                    const words = ['اول', 'ثاني', 'ثالث', 'رابع', 'خامس', 'سادس', 'سابع', 'ثامن'];
                    const cleanStr = firstCol.replace(/أ/g, 'ا').replace(/ة/g, '').replace(/ي/g, 'ي').toLowerCase();
                    const foundWordIndex = words.findIndex(w => cleanStr.includes(w));
                    if (foundWordIndex !== -1) pIndex = foundWordIndex;
                }

                if (pIndex >= 0 && pIndex < 8) {
                    if (!newPeriodTimes[pIndex]) newPeriodTimes[pIndex] = { startTime: '', endTime: '' };
                    const parsedStart = parseExcelTime(row[1]);
                    const parsedEnd = parseExcelTime(row[2]);
                    if (parsedStart) newPeriodTimes[pIndex].startTime = parsedStart;
                    if (parsedEnd) newPeriodTimes[pIndex].endTime = parsedEnd;
                    if(parsedStart || parsedEnd) updatesCount++;
                }
            });

            if (updatesCount > 0) { 
                setTempPeriodTimes(newPeriodTimes); 
            } 
        } catch (error) { 
        } finally { 
            setIsImportingPeriods(false); 
            if (e.target) e.target.value = ''; 
        }
    };

    const checkActivePeriod = (start: string, end: string) => {
        if (!start || !end) return false;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        return currentMinutes >= (sh * 60 + sm) && currentMinutes < (eh * 60 + em);
    };

    const handleCloseCloudMessage = () => {
        if (cloudMessage && cloudMessage.id) {
            localStorage.setItem(`rased_cloud_msg_${cloudMessage.id}`, 'true');
        }
        setCloudMessage(null);
    };

    const todayRaw = new Date().getDay();
    const dayIndex = (todayRaw === 5 || todayRaw === 6) ? 0 : todayRaw;
    const todaySchedule = (schedule && schedule[dayIndex]) ? schedule[dayIndex] : { dayName: t('todaySchedule'), periods: [] };
    const isToday = todayRaw === dayIndex;

    const currentMonthIndex = new Date().getMonth();
    const currentTasks = assessmentPlan.find(p => p.monthIndex === currentMonthIndex)?.tasks || [];

    const monthNames = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];

    return (
        <div className="space-y-6 pb-28 animate-in fade-in duration-500 relative min-h-screen overflow-x-hidden bg-slate-50/30">
            {/* الترويسة الرئيسية */}
            <header 
                className={`shrink-0 z-40 px-5 pt-[env(safe-area-inset-top)] w-full transition-all duration-300 bg-transparent ${isRamadan ? 'text-white' : 'text-slate-800'}`}
                style={{ WebkitAppRegion: 'drag' } as any}
            >
                <div className="flex justify-between items-center mb-2 mt-4">
                    <div className="flex items-center gap-4 md:gap-6" style={{ WebkitAppRegion: 'no-drag' } as any}>
                        <div className="relative group cursor-pointer" onClick={() => setShowEditModal(true)}>
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                                {getDisplayImage(teacherInfo?.avatar, teacherInfo?.gender) ? (
                                    <img src={teacherInfo.avatar} className="w-full h-full object-cover" alt="Teacher" onError={(e) => e.currentTarget.style.display='none'} />
                                ) : <DefaultAvatarSVG gender={teacherInfo?.gender || 'male'} />}
                            </div>
                            <div className={`absolute -bottom-1 ${dir === 'rtl' ? '-right-1' : '-left-1'} p-1.5 rounded-xl shadow-sm border transition-transform group-hover:scale-110 bg-white text-blue-600 border-slate-100`}>
                                <Edit3 size={14} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">{teacherInfo?.name || t('welcome')}</h1>
                            <div className="flex items-center gap-2 text-slate-500">
                                <p className="text-xs md:text-sm font-bold flex items-center gap-1.5">
                                    <School size={14} className="text-blue-500" /> {teacherInfo?.school || t('schoolFallback')}
                                </p>
                                <span className="text-[10px] px-2.5 py-0.5 rounded-lg font-bold bg-blue-50 text-blue-600 border border-blue-100/50">
                                    {currentSemester === '1' ? t('semester1') : t('semester2')}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
                        <button onClick={onToggleNotifications} className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-300 ${notificationsEnabled ? 'bg-white border-slate-200 text-slate-700 shadow-sm hover:scale-105' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white'}`}>
                            {notificationsEnabled ? <Bell size={22} className="animate-pulse text-blue-500" /> : <BellOff size={22} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* رسائل التنبيه العلوية */}
            {cloudMessage && (
                <div className="px-5 mt-2 relative z-10 animate-in fade-in slide-in-from-top-4">
                    <div className={`relative p-4 rounded-[1.5rem] border overflow-hidden ${
                        cloudMessage.type === 'warning' ? 'bg-rose-50 border-rose-100' :
                        cloudMessage.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                        'bg-blue-50 border-blue-100'
                    }`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3">
                                <div className={`p-2.5 rounded-xl bg-white/60 shadow-sm ${
                                    cloudMessage.type === 'warning' ? 'text-rose-500' :
                                    cloudMessage.type === 'success' ? 'text-emerald-500' : 'text-blue-500'
                                }`}>
                                    <Bell size={18} className="animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-slate-800">{cloudMessage.title}</h3>
                                    <p className="text-xs font-bold mt-1 text-slate-600 leading-relaxed">{cloudMessage.body}</p>
                                </div>
                            </div>
                            <button onClick={handleCloseCloudMessage} className="p-1.5 rounded-xl bg-white/50 text-slate-400 hover:text-slate-700 hover:bg-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                قسم الجدول اليومي (تم تحويله إلى بطاقات أفقية مربعة)
            ========================================================= */}
            <div className="mt-6 relative z-10">
                <div className="px-5 flex justify-between items-center mb-3">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        {t('todaySchedule')} 
                        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50">
                            {t(weekDayKeys[dayIndex]) || todaySchedule.dayName}
                        </span>
                    </h2>
                    <button onClick={() => setShowScheduleModal(true)} className="p-2.5 rounded-xl bg-white text-slate-500 border border-slate-200 shadow-sm active:scale-95 transition-all hover:bg-slate-50 hover:text-blue-600">
                        <Settings size={20} />
                    </button>
                </div>

                {/* الحاوية الأفقية للبطاقات */}
                <div className="flex gap-4 overflow-x-auto px-5 pb-6 pt-2 snap-x custom-scrollbar hide-scrollbar">
                    {todaySchedule?.periods?.map((subject: string, idx: number) => {
                        if (!subject) return null;
                        const time = periodTimes[idx] || { startTime: '00:00', endTime: '00:00' };
                        const isActive = isToday && checkActivePeriod(time.startTime, time.endTime);
                        const displaySubject = teacherInfo?.subject && teacherInfo.subject.trim().length > 0 ? teacherInfo.subject : subject;

                        const activeClass = 'bg-[#3b82f6] text-white shadow-[0_8px_30px_rgb(59,130,246,0.3)] scale-[1.02] border-transparent z-10';
                        const inactiveClass = 'bg-white border-slate-100 text-slate-700 hover:border-blue-100 hover:shadow-md';

                        return (
                            <div key={idx} className={`snap-center shrink-0 w-[140px] h-[165px] flex flex-col justify-between p-4 rounded-[1.5rem] border transition-all duration-300 relative ${isActive ? activeClass : inactiveClass}`}>
                                
                                {/* النبض الأخضر للحصة الحالية */}
                                {isActive && (
                                    <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                                )}

                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl mb-2 ${isActive ? 'bg-white/20 text-white shadow-inner' : 'bg-blue-50 text-blue-600'}`}>
                                    {getSubjectIcon(displaySubject) || getSubjectIcon(subject) || (idx + 1)}
                                </div>
                                
                                <div>
                                    <h4 className={`font-black text-sm mb-1 line-clamp-1 ${isActive ? 'text-white' : 'text-slate-800'}`}>{subject}</h4>
                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                                        <Clock size={10} /> {time.startTime} - {time.endTime}
                                    </span>
                                    <span className={`text-[10px] font-bold mt-0.5 block ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                                        {t('period')} {idx + 1}
                                    </span>
                                </div>

                                {isActive && (
                                    <button 
                                        onClick={() => {
                                            if (setSelectedClass) setSelectedClass(subject);
                                            onNavigate('attendance');
                                        }} 
                                        className="mt-3 w-full py-2 rounded-xl font-bold text-[10px] bg-white text-[#3b82f6] shadow-sm flex items-center justify-center gap-1 hover:bg-blue-50 active:scale-95 transition-transform"
                                    >
                                        {t('takeAttendance')}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {/* مساحة فارغة في النهاية ليتمكن المستخدم من سحب آخر بطاقة بشكل مريح */}
                    <div className="w-2 shrink-0"></div>
                </div>
            </div>

            {/* قسم الخطة التقويمية */}
            <div className="px-5 mt-2 relative z-10">
                <div className="rounded-[2rem] p-6 bg-white shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-500"><CalendarDays size={20}/></div>
                            <h2 className="text-lg font-black text-slate-800">{t('continuousAssessmentPlan')}</h2>
                        </div>
                        <button onClick={() => setShowPlanSettingsModal(true)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <Settings size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {assessmentPlan.map((plan) => {
                            const isCurrent = currentMonthIndex === plan.monthIndex;
                            const isPast = currentMonthIndex > plan.monthIndex;
                            
                            let monthBg = 'bg-slate-50 border-slate-100';
                            if(isCurrent) monthBg = 'bg-blue-50/50 border-blue-200 shadow-sm';
                            if(isPast) monthBg = 'bg-slate-50/50 border-transparent opacity-60';

                            return (
                                <div key={plan.id} className={`p-5 rounded-[1.5rem] border transition-all ${monthBg}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className={`text-sm font-black ${isCurrent ? 'text-blue-700' : 'text-slate-600'}`}>{t('monthPrefix')} {plan.monthName}</span>
                                        {isCurrent && <span className="text-[9px] font-bold px-2.5 py-1 rounded-xl bg-blue-600 text-white shadow-sm animate-pulse">{t('currentMonthLabel')}</span>}
                                        {isPast && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                    </div>
                                    <ul className="space-y-2.5">
                                        {plan.tasks.map((task, idx) => (
                                            <li key={idx} className={`flex items-start gap-2.5 text-xs font-bold ${isPast ? 'text-slate-400' : 'text-slate-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isCurrent ? 'bg-blue-400' : 'bg-slate-300'}`}></div>
                                                <span className={isPast ? 'line-through decoration-slate-300' : ''}>{task}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* اللوحات الجانبية المنزلقة (Drawers) */}
            
            {/* 1. لوحة إعدادات الخطة التقويمية */}
            <>
                <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 ${showPlanSettingsModal ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setShowPlanSettingsModal(false)} />
                <div className={`fixed z-[101] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bottom-0 left-0 w-full h-[90vh] rounded-t-[2.5rem] md:h-full md:w-[450px] md:top-0 md:rounded-none bg-white shadow-2xl ${dir === 'rtl' ? 'md:left-0' : 'md:right-0'} ${showPlanSettingsModal ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 ' + (dir === 'rtl' ? 'md:-translate-x-full' : 'md:translate-x-full')}`}>
                    <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                    
                    <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 shrink-0">
                        <h3 className="font-black text-xl text-slate-800">{t('customizeAssessmentPlan')}</h3>
                        <div className="flex gap-2">
                            <button onClick={() => { if(window.confirm(t('confirmRestoreDefaultPlan'))) { setTempPlan([ { id: 'm1', monthIndex: 2, monthName: t('mar'), tasks: [t('oralStart'), t('reportStart'), t('shortQ1'), t('shortQuiz1')] }, { id: 'm2', monthIndex: 3, monthName: t('apr'), tasks: [t('oralCont'), t('reportCont'), t('shortQ2')] }, { id: 'm3', monthIndex: 4, monthName: t('may'), tasks: [t('oralSubmit'), t('reportSubmit'), t('shortQuiz2')] } ]); } }} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors" title={t('restoreDefault')}>
                                <RefreshCcw size={18} />
                            </button>
                            <button onClick={() => setShowPlanSettingsModal(false)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        <button onClick={() => setTempPlan([...tempPlan, { id: `new_${Date.now()}`, monthIndex: new Date().getMonth(), monthName: t('newMonth'), tasks: [] }])} className="w-full flex justify-center items-center gap-2 py-4 rounded-2xl bg-blue-50 text-blue-600 font-bold text-sm border border-blue-100 hover:bg-blue-100 transition-colors mb-2">
                            <Plus size={18}/> {t('addMonth')}
                        </button>
                        {tempPlan.map((month, idx) => (
                            <div key={month.id} className="rounded-[1.5rem] p-5 border border-slate-100 bg-slate-50/50 shadow-sm">
                                <div className="flex gap-3 mb-4">
                                    <select value={month.monthIndex} onChange={(e) => { const n = [...tempPlan]; n[idx].monthIndex = parseInt(e.target.value); n[idx].monthName = monthNames[parseInt(e.target.value)]; setTempPlan(n); }} className="rounded-xl text-sm font-bold px-4 py-3 outline-none flex-1 border border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all">
                                        {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                    </select>
                                    <button onClick={() => { if(window.confirm(t('confirmDeleteMonth'))) { setTempPlan(tempPlan.filter((_, i) => i !== idx)); } }} className="p-3 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {month.tasks.map((task, tIdx) => (
                                        <div key={tIdx} className="flex gap-2">
                                            <input value={task} onChange={(e) => { const n = [...tempPlan]; n[idx].tasks[tIdx] = e.target.value; setTempPlan(n); }} className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                            <button onClick={() => { const n = [...tempPlan]; n[idx].tasks = n[idx].tasks.filter((_, ti) => ti !== tIdx); setTempPlan(n); }} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => { const n = [...tempPlan]; n[idx].tasks.push(t('newTask')); setTempPlan(n); }} className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all mt-2">
                                        {t('addTask')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                        <button onClick={handleSavePlanSettings} className="w-full py-4 text-white rounded-2xl font-bold text-sm bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-blue-700"><Save size={18} /> {t('saveChanges')}</button>
                    </div>
                </div>
            </>

            {/* 2. لوحة تعديل الهوية الرسمية */}
            <>
                <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 ${showEditModal ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setShowEditModal(false)} />
                <div className={`fixed z-[101] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bottom-0 left-0 w-full h-[90vh] rounded-t-[2.5rem] md:h-full md:w-[450px] md:top-0 md:rounded-none bg-white shadow-2xl ${dir === 'rtl' ? 'md:left-0' : 'md:right-0'} ${showEditModal ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 ' + (dir === 'rtl' ? 'md:-translate-x-full' : 'md:translate-x-full')}`}>
                    <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                    
                    <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 shrink-0">
                        <h3 className="font-black text-xl text-slate-800">{t('officialIdentity')}</h3>
                        <button onClick={() => setShowEditModal(false)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="w-28 h-28 mx-auto mb-6 relative group">
                            {editAvatar ? (
                                <img src={editAvatar} className="w-full h-full rounded-[1.5rem] object-cover shadow-md border border-slate-200" alt="Profile" onError={(e) => { e.currentTarget.style.display='none'; }}/>
                            ) : (
                                <div className="w-full h-full rounded-[1.5rem] flex items-center justify-center bg-blue-50 border border-slate-100"><DefaultAvatarSVG gender={editGender}/></div>
                            )}
                            <button onClick={() => setEditAvatar(undefined)} className={`absolute -bottom-2 ${dir === 'rtl' ? '-right-2' : '-left-2'} bg-white text-rose-500 p-2 rounded-xl shadow-lg border border-slate-100 hover:bg-rose-50 transition-colors`}>
                                <X size={16} strokeWidth={3}/>
                            </button>
                        </div>

                        <div className={`space-y-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('namePlaceholder')}</label>
                                    <input value={editName} onChange={e => setEditName(e.target.value)} className="p-4 border border-slate-200 rounded-2xl text-sm font-bold w-full outline-none bg-slate-50 focus:bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('schoolPlaceholder')}</label>
                                    <input value={editSchool} onChange={e => setEditSchool(e.target.value)} className="p-4 border border-slate-200 rounded-2xl text-sm font-bold w-full outline-none bg-slate-50 focus:bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('subjectExample')}</label>
                                <input value={editSubject} onChange={e => setEditSubject(e.target.value)} className="p-4 border border-slate-200 rounded-2xl text-sm font-bold w-full outline-none bg-slate-50 focus:bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('governoratePlaceholder')}</label>
                                    <input value={editGovernorate} onChange={e => setEditGovernorate(e.target.value)} className="p-4 border border-slate-200 rounded-2xl text-sm font-bold w-full outline-none bg-slate-50 focus:bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('academicYearPlaceholder')}</label>
                                    <input value={editAcademicYear} onChange={e => setEditAcademicYear(e.target.value)} className="p-4 border border-slate-200 rounded-2xl text-sm font-bold w-full outline-none bg-slate-50 focus:bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>
                            </div>

                            <div className="p-1.5 rounded-2xl bg-slate-100 flex gap-1 mt-2 border border-slate-200/60">
                                <button onClick={() => setEditSemester('1')} className={`flex-1 py-3 rounded-[1rem] text-xs font-bold transition-all ${editSemester === '1' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('sem1')}</button>
                                <button onClick={() => setEditSemester('2')} className={`flex-1 py-3 rounded-[1rem] text-xs font-bold transition-all ${editSemester === '2' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('sem2')}</button>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-4 rounded-2xl text-[11px] font-bold flex flex-col items-center gap-2 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Camera size={20}/> {t('yourPhoto')}</button>
                                <button onClick={() => stampInputRef.current?.click()} className="flex-1 py-4 rounded-2xl text-[11px] font-bold flex flex-col items-center gap-2 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"><Check size={20}/> {t('stamp')}</button>
                                <button onClick={() => ministryLogoInputRef.current?.click()} className="flex-1 py-4 rounded-2xl text-[11px] font-bold flex flex-col items-center gap-2 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-amber-50 hover:text-amber-600 transition-colors"><School size={20}/> {t('logo')}</button>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, setEditAvatar)} className="hidden" accept="image/*"/>
                            <input type="file" ref={stampInputRef} onChange={(e) => handleFileUpload(e, setEditStamp)} className="hidden" accept="image/*"/>
                            <input type="file" ref={ministryLogoInputRef} onChange={(e) => handleFileUpload(e, setEditMinistryLogo)} className="hidden" accept="image/*"/>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                        <button onClick={handleSaveInfo} className="w-full py-4 text-white rounded-2xl font-bold text-sm bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-blue-700">{t('saveChanges')}</button>
                    </div>
                </div>
            </>

            {/* 3. لوحة إعدادات الساعة والجدول */}
            <>
                <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 ${showScheduleModal ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setShowScheduleModal(false)} />
                <div className={`fixed z-[101] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bottom-0 left-0 w-full h-[90vh] rounded-t-[2.5rem] md:h-full md:w-[450px] md:top-0 md:rounded-none bg-white shadow-2xl ${dir === 'rtl' ? 'md:left-0' : 'md:right-0'} ${showScheduleModal ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 ' + (dir === 'rtl' ? 'md:-translate-x-full' : 'md:translate-x-full')}`}>
                    <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                    
                    <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 shrink-0">
                        <h3 className="font-black text-xl text-slate-800">{t('manageSchedule')}</h3>
                        <div className="flex gap-2">
                            {scheduleTab === 'timing' ? (
                                <>
                                    <button onClick={() => modalScheduleFileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs hover:bg-emerald-100 transition-colors">
                                        <Download size={16}/> {isImportingPeriods ? '...' : t('importExcel')}
                                    </button>
                                    <input type="file" ref={modalScheduleFileInputRef} onChange={handleImportPeriodTimes} accept=".xlsx,.xls" className="hidden" />
                                </>
                            ) : (
                                <>
                                    <button onClick={() => scheduleFileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs hover:bg-blue-100 transition-colors">
                                        <Download size={16}/> {isImportingSchedule ? '...' : t('importExcel')}
                                    </button>
                                    <input type="file" ref={scheduleFileInputRef} onChange={handleImportSchedule} accept=".xlsx,.xls" className="hidden" />
                                </>
                            )}
                            <button onClick={() => setShowScheduleModal(false)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 py-4 shrink-0">
                            <div className="flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200/60">
                                <button onClick={() => setScheduleTab('timing')} className={`flex-1 py-3 rounded-[1rem] text-xs font-bold transition-all ${scheduleTab === 'timing' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('timing')}</button>
                                <button onClick={() => setScheduleTab('classes')} className={`flex-1 py-3 rounded-[1rem] text-xs font-bold transition-all ${scheduleTab === 'classes' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('classesTab')}</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                            {scheduleTab === 'timing' ? (
                                <div className="space-y-3">
                                    {tempPeriodTimes.map((pt, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                                            <span className="text-[11px] font-black w-10 text-center bg-white p-2 rounded-xl text-slate-400 shadow-sm">{idx+1}</span>
                                            <input type="time" value={pt.startTime} onChange={(e) => {const n=[...tempPeriodTimes]; if(n[idx]) n[idx].startTime=e.target.value; setTempPeriodTimes(n)}} className="flex-1 rounded-xl px-3 py-3 text-sm font-bold border border-slate-200 bg-white text-center text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"/>
                                            <span className="text-slate-300 font-bold">-</span>
                                            <input type="time" value={pt.endTime} onChange={(e) => {const n=[...tempPeriodTimes]; if(n[idx]) n[idx].endTime=e.target.value; setTempPeriodTimes(n)}} className="flex-1 rounded-xl px-3 py-3 text-sm font-bold border border-slate-200 bg-white text-center text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"/>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {tempSchedule.map((day, idx) => (
                                            <button key={idx} onClick={() => setEditingDayIndex(idx)} className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all ${editingDayIndex === idx ? 'bg-blue-600 text-white shadow-md border-transparent scale-105' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                                                {t(weekDayKeys[idx]) || day.dayName}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        {tempSchedule[editingDayIndex]?.periods.map((cls: string, pIdx: number) => (
                                            <div key={pIdx} className="flex items-center gap-3 p-2 rounded-2xl border border-slate-100 bg-slate-50/50">
                                                <span className="text-[11px] font-black w-10 text-center bg-white p-2.5 rounded-xl text-slate-400 shadow-sm">{pIdx + 1}</span>
                                                <input value={cls} onChange={(e) => {const n=[...tempSchedule]; if(n[editingDayIndex]?.periods) n[editingDayIndex].periods[pIdx]=e.target.value; setTempSchedule(n)}} placeholder={t('subjectNamePlaceholder')} className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                        <button onClick={handleSaveScheduleSettings} className="w-full py-4 text-white rounded-2xl font-bold text-sm bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-blue-700"><Save size={18} /> {t('saveChanges')}</button>
                    </div>
                </div>
            </>

        </div>
    );
};

export default Dashboard;