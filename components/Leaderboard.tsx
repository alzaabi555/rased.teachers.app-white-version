import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Student } from '../types';
import { Trophy, Crown, Sparkles, Star, Search, Award, Download, X, Loader2, MinusCircle, Medal } from 'lucide-react'; 
import { useApp } from '../context/AppContext';
import { StudentAvatar } from './StudentAvatar';
import positiveSound from '../assets/positive.mp3';

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import html2pdf from 'html2pdf.js';

// 🌟 استدعاء المكون الجديد للشهادة
import CertificateTemplate from './CertificateTemplate';

interface LeaderboardProps {
    students: Student[];
    classes: string[];
    onUpdateStudent?: (student: Student) => void;
    teacherInfo?: { 
        name: string; 
        school: string; 
        subject: string; 
        governorate: string; 
        ministryLogo?: string; 
        stamp?: string;
    }; 
}

const Leaderboard: React.FC<LeaderboardProps> = ({ students, classes, onUpdateStudent, teacherInfo }) => {
    // === 🧠 العقل والمنطق البرمجي (لم يتم المساس به) 🧠 ===
    const { currentSemester, t, dir, language } = useApp();
    
    const today = new Date();
    const currentMonth = today.getMonth(); 
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthName = t(monthKeys[currentMonth]);

    const [schoolType, setSchoolType] = useState<'boys' | 'girls' | 'mixed'>(() => {
        return (localStorage.getItem('rased_school_type') as any) || 'mixed';
    });

    useEffect(() => {
        localStorage.setItem('rased_school_type', schoolType);
    }, [schoolType]);

    const getPageTitle = () => {
        if (language === 'en') return `${t('knightsOfMonth_mixed')} ${monthName}`;
        if (schoolType === 'boys') return `${t('knightsOfMonth_boys')} ${monthName}`;
        if (schoolType === 'girls') return `${t('knightsOfMonth_girls')} ${monthName}`;
        return `${t('knightsOfMonth_mixed')} ${monthName}`;
    };

    const [selectedClass, setSelectedClass] = useState<string>(() => sessionStorage.getItem('rased_class') || 'all');
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        sessionStorage.setItem('rased_class', selectedClass);
    }, [selectedClass]);

    const [certificateStudent, setCertificateStudent] = useState<Student | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const certificateRef = useRef<HTMLDivElement>(null);

    const getShortName = (fullName: string) => {
        if (!fullName) return '';
        const nameParts = fullName.trim().split(' ');
        if (nameParts.length === 1) return nameParts[0];
        return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
    };
    
    const tickerText = useMemo(() => {
        let baseStudents = students;
        if (selectedClass !== 'all') {
            baseStudents = students.filter(s => s.classes?.includes(selectedClass));
        }

        const studentsWithPoints = baseStudents.map(student => {
            const monthlyPoints = (student.behaviors || [])
                .filter(b => {
                    const d = new Date(b.date);
                    return d.getMonth() === currentMonth && d.getFullYear() === today.getFullYear();
                })
                .reduce((acc, b) => acc + b.points, 0);
            return { ...student, monthlyPoints };
        }).filter(s => s.monthlyPoints > 0)
          .sort((a, b) => b.monthlyPoints - a.monthlyPoints);

        if (studentsWithPoints.length === 0) return t('noPointsYet');

        if (selectedClass === 'all') {
            const classTopMap = new Map<string, typeof studentsWithPoints[0]>();
            studentsWithPoints.forEach(s => {
                const sClass = s.classes[0];
                if (sClass && !classTopMap.has(sClass)) {
                    classTopMap.set(sClass, s);
                }
            });

            return Array.from(classTopMap.values())
                .map(s => `👑 ${t('championOf')} (${s.classes[0]}): ${getShortName(s.name)} [${s.monthlyPoints} ${t('pointsWord')}]`)
                .join(' 🌟 | 🌟 ');
        } else {
            const top3 = studentsWithPoints.slice(0, 3);
            const medals = [`🥇 ${t('firstPlace')}`, `🥈 ${t('secondPlace')}`, `🥉 ${t('thirdPlace')}`];
            return top3
                .map((s, idx) => `${medals[idx]}: ${getShortName(s.name)} [${s.monthlyPoints} ${t('pointsWord')}]`)
                .join(' ✨ | ✨ ');
        }
    }, [students, selectedClass, currentMonth, t]);

    const rankedStudents = useMemo(() => {
        let filtered = students;
        if (selectedClass !== 'all') filtered = students.filter(s => s.classes?.includes(selectedClass));
        if (searchTerm.trim()) filtered = filtered.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const withPoints = filtered.map(student => {
            const monthlyPoints = (student.behaviors || [])
                .filter(b => {
                    const d = new Date(b.date);
                    return d.getMonth() === currentMonth && d.getFullYear() === today.getFullYear();
                })
                .reduce((acc, b) => acc + b.points, 0);
            return { ...student, monthlyPoints };
        });
        return withPoints.sort((a, b) => b.monthlyPoints - a.monthlyPoints);
    }, [students, selectedClass, searchTerm, currentMonth]);

    const topThree = rankedStudents.slice(0, 3);
    const restOfStudents = rankedStudents.slice(3);

    const handleAddPoints = (student: Student) => {
        if (!onUpdateStudent) return;
        new Audio(positiveSound).play().catch(() => {});
        const isBoy = student.gender !== 'female';
        const desc = isBoy ? t('pointsActionDesc_boys') : t('pointsActionDesc_girls');
        const newBehavior = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            type: 'positive' as const,
            description: desc,
            points: 3,
            semester: currentSemester
        };
        onUpdateStudent({ ...student, behaviors: [newBehavior, ...(student.behaviors || [])] });
    };

    const handleDeductPoint = (student: Student) => {
        if (!onUpdateStudent) return;
        if (confirm(`${t('deductConfirm1')} ${student.name}${t('deductConfirm2')}`)) {
            const correctionBehavior = {
                id: Math.random().toString(36).substr(2, 9),
                date: new Date().toISOString(),
                type: 'negative' as const, 
                description: t('pointsCorrectionDesc'),
                points: -3, 
                semester: currentSemester
            };
            onUpdateStudent({ ...student, behaviors: [correctionBehavior, ...(student.behaviors || [])] });
        }
    };

    const handleDownloadPDF = async () => {
        if (!certificateRef.current || !certificateStudent) return;
        setIsGeneratingPdf(true);
        const opt = {
            margin: 0, filename: `Rased_Award_${certificateStudent.name}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 3, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        try {
            const worker = html2pdf().set(opt).from(certificateRef.current).toPdf();
            if (Capacitor.isNativePlatform()) {
                const pdfBase64 = await worker.output('datauristring');
                const result = await Filesystem.writeFile({
                    path: `Award_${Date.now()}.pdf`, data: pdfBase64.split(',')[1], directory: Directory.Cache
                });
                await Share.share({ title: t('certificateBtn'), url: result.uri });
            } else { worker.save(); }
        } catch (e) { alert(t('errorSavingPdf')); } finally { setIsGeneratingPdf(false); }
    };

    // === 🎨 الجسد (التصميم الجديد المشرق) 🎨 ===
    const baseDrawerClasses = `fixed z-[101] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl`;
    const bottomSheetClasses = `bottom-0 left-0 w-full h-[90vh] rounded-t-[2.5rem]`;
    const sidePanelClasses = `md:h-full md:w-[650px] md:top-0 md:rounded-none md:bottom-auto ${dir === 'rtl' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'}`;

    return (
        <div className={`flex flex-col h-full pb-24 md:pb-8 overflow-hidden relative bg-slate-50 text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
            
            <header className="shrink-0 z-40 px-5 pt-[env(safe-area-inset-top)] w-full transition-all duration-300 bg-white border-b border-slate-100 shadow-sm pb-4" style={{ WebkitAppRegion: 'drag' } as any}>
                <div className="flex flex-col items-center text-center relative mt-4">
                    <div className={`absolute ${dir === 'rtl' ? 'left-0' : 'right-0'} top-0 flex gap-2`} style={{ WebkitAppRegion: 'no-drag' } as any}>
                        <select 
                            value={schoolType} 
                            onChange={(e) => setSchoolType(e.target.value as any)}
                            className="border border-slate-200 rounded-[1rem] text-[10px] px-3 py-2 outline-none font-bold cursor-pointer transition-colors bg-slate-50 text-slate-600 hover:bg-slate-100 focus:border-indigo-400"
                        >
                            <option value="mixed">{t('mixedSchool')}</option>
                            <option value="boys">{t('boysSchool')}</option>
                            <option value="girls">{t('girlsSchool')}</option>
                        </select>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-[1.5rem] border border-amber-100 mb-3 shadow-inner shadow-amber-500/10">
                        <Crown className="w-8 h-8 text-amber-500 fill-amber-500 animate-bounce" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2 text-slate-800">{getPageTitle()}</h1>

                    {/* 📢 الشريط الإخباري الذكي (تصميم مشرق) */}
                    <div className="w-full max-w-2xl mt-4 mb-4 flex items-center rounded-2xl border border-blue-100 overflow-hidden shadow-sm bg-blue-50/50" style={{ WebkitAppRegion: 'no-drag' } as any}>
                        <div className="px-5 py-3 flex items-center gap-1.5 font-black text-xs shrink-0 z-10 bg-blue-600 text-white shadow-md">
                            <Sparkles size={16} className="animate-pulse text-amber-300" />
                            {t('newsTickerTitle')}
                        </div>
                        <div className="flex-1 overflow-hidden relative flex items-center px-2">
                            {/* @ts-ignore */}
                            <marquee direction={dir === 'rtl' ? 'right' : 'left'} scrollamount="4" className="font-bold text-sm pt-1 tracking-wide text-blue-800">
                                {tickerText}
                            </marquee>
                        </div>
                    </div>
                    
                    <div className="relative w-full max-w-sm mb-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
                        <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                        <input 
                            type="text" 
                            placeholder={t('searchPlaceholder')} 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className={`w-full border border-slate-200 rounded-[1.5rem] py-3.5 ${dir === 'rtl' ? 'pr-12' : 'pl-12'} text-sm font-bold outline-none transition-all bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10`} 
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 custom-scrollbar w-full justify-start md:justify-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
                        <button onClick={() => setSelectedClass('all')} className={`shrink-0 whitespace-nowrap px-5 py-2.5 rounded-xl text-[11px] font-black border transition-all ${selectedClass === 'all' ? 'bg-blue-600 text-white shadow-md border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{t('all')}</button>
                        {classes.map(c => (
                            <button key={c} onClick={() => setSelectedClass(c)} className={`shrink-0 whitespace-nowrap px-5 py-2.5 rounded-xl text-[11px] font-black border transition-all ${selectedClass === c ? 'bg-blue-600 text-white shadow-md border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{c}</button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28 custom-scrollbar relative z-10">
                
                {/* منصة التتويج (Top 3) */}
                {topThree.length > 0 && (
                    <div className="flex justify-center items-end gap-2 md:gap-6 py-6 mb-8 border-b border-slate-200/60 pb-10">
                        {[topThree[1], topThree[0], topThree[2]].map((s, i) => s && (
                            <div key={s.id} className={`flex flex-col items-center relative ${i === 1 ? 'z-10 -mb-6' : 'opacity-95'}`}>
                                <div className="relative cursor-pointer group" onClick={() => handleAddPoints(s)}>
                                    
                                    {/* تاج الفائز الأول */}
                                    {i === 1 && <Crown className="w-12 h-12 text-amber-500 fill-amber-400 absolute -top-10 left-1/2 -translate-x-1/2 animate-pulse drop-shadow-md" />}
                                    
                                    {/* ميداليات المراكز */}
                                    {i === 0 && <div className="absolute -top-4 -right-2 w-8 h-8 bg-slate-200 rounded-full border-2 border-white flex items-center justify-center text-sm shadow-md z-20 font-black text-slate-500">2</div>}
                                    {i === 1 && <div className="absolute -bottom-2 right-0 w-10 h-10 bg-amber-400 rounded-full border-4 border-white flex items-center justify-center text-lg shadow-lg z-20 font-black text-white">1</div>}
                                    {i === 2 && <div className="absolute -top-4 -left-2 w-8 h-8 bg-orange-200 rounded-full border-2 border-white flex items-center justify-center text-sm shadow-md z-20 font-black text-orange-600">3</div>}

                                    <div className={`rounded-full border-4 shadow-xl overflow-hidden mb-3 bg-white transform transition-transform group-hover:scale-105 ${i === 1 ? 'w-28 h-28 md:w-36 md:h-36 border-amber-400 ring-4 ring-amber-100' : i === 0 ? 'w-20 h-20 md:w-28 md:h-28 border-slate-300' : 'w-20 h-20 md:w-28 md:h-28 border-orange-300'}`}>
                                        <StudentAvatar gender={s.gender} className="w-full h-full" />
                                    </div>
                                </div>
                                <div className="px-4 py-2.5 rounded-[1rem] text-center border shadow-sm w-32 md:w-40 transition-colors bg-white border-slate-200">
                                    <h3 className="font-black text-[13px] md:text-sm truncate text-slate-800" title={s.name}>{getShortName(s.name)}</h3>
                                    <span className="text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md mt-1 inline-block" dir="ltr">{s.monthlyPoints} {t('pointsWord')}</span>
                                </div>
                                <div className="flex gap-1.5 mt-3 w-full justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                                    <button onClick={() => setCertificateStudent(s)} className="text-[10px] px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold border border-blue-100">
                                        <Award size={14} /> {t('certificateBtn')}
                                    </button>
                                    <button onClick={() => handleDeductPoint(s)} className="text-[10px] px-2.5 py-1.5 rounded-lg shadow-sm transition-colors flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100" title={t('deductBtnTitle')}>
                                        <MinusCircle size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* باقي الطلاب المتميزين */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {restOfStudents.map((s, index) => (
                        <div key={s.id} className="rounded-[1.5rem] p-4 shadow-sm border border-slate-200 flex flex-col items-center relative active:scale-95 transition-all duration-300 bg-white hover:shadow-md hover:border-indigo-200 group">
                            <div className={`absolute top-2 ${dir === 'rtl' ? 'right-2' : 'left-2'} font-black w-6 h-6 rounded-full flex items-center justify-center text-[10px] bg-slate-50 text-slate-500 border border-slate-200`}>{index + 4}</div>
                            
                            <div className="w-16 h-16 rounded-full border-2 shadow-sm overflow-hidden mb-3 mt-2 cursor-pointer border-slate-100 group-hover:scale-105 transition-transform" onClick={() => handleAddPoints(s)}>
                                <StudentAvatar gender={s.gender} className="w-full h-full" />
                            </div>
                            
                            <h3 className="font-black text-xs truncate w-full text-center text-slate-800 mb-1" title={s.name}>{getShortName(s.name)}</h3>
                            <span className="font-bold text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md" dir="ltr">{s.monthlyPoints} Pts</span>
                            
                            <div className="flex gap-1.5 w-full mt-3 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                                <button onClick={() => setCertificateStudent(s)} className="flex-1 py-1.5 text-[10px] font-bold rounded-xl border transition-colors bg-slate-50 text-slate-500 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">{t('certificateBtn')}</button>
                                <button onClick={() => handleDeductPoint(s)} className="px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-colors bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100"><MinusCircle size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 📜 لوحة استخراج الشهادة (Drawer) */}
            <>
                <div className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${!!certificateStudent ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => !isGeneratingPdf && setCertificateStudent(null)} />
                <div className={`${baseDrawerClasses} ${bottomSheetClasses} ${sidePanelClasses} ${!!certificateStudent ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'} !md:w-[700px]`}>
                    
                    <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                    
                    <div className="flex justify-between items-center px-6 pt-10 pb-5 md:pt-14 border-b border-slate-100 shrink-0 bg-white">
                        <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                            <Award className="text-blue-500 w-6 h-6"/> {t('previewAndIssueCert')}
                        </h3>
                        <button onClick={() => !isGeneratingPdf && setCertificateStudent(null)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={18} /></button>
                    </div>

                    {certificateStudent && (
                        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-8 flex justify-center items-center custom-scrollbar">
                            {/* إحاطة الشهادة بـ div يضمن عدم تجاوزها للشاشة (Responsive Scale) */}
                            <div className="w-full max-w-[800px] overflow-x-auto custom-scrollbar flex justify-center bg-white shadow-xl rounded-lg p-2">
                                <div ref={certificateRef} className="shrink-0" dir="rtl" style={{ transformOrigin: 'top center', transform: 'scale(0.85)' }}>
                                    <CertificateTemplate 
                                        studentName={certificateStudent.name}
                                        grade={certificateStudent.classes[0]}
                                        teacherName={teacherInfo?.name || t('defaultTeacherNameLine')}
                                        schoolName={teacherInfo?.school}
                                        subject={teacherInfo?.subject}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                        <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="w-full py-4 rounded-[1.2rem] font-black text-lg shadow-lg shadow-blue-600/30 bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:active:scale-100">
                            {isGeneratingPdf ? <Loader2 size={24} className="animate-spin" /> : <><Download size={24} /> {t('saveAndExportPdf')}</>}
                        </button>
                    </div>
                </div>
            </>

        </div>
    );
};

export default Leaderboard;