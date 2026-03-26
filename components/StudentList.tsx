import React, { useState, useEffect, useMemo } from 'react';
import { Student, BehaviorType } from '../types';
import { 
    Search, ThumbsUp, ThumbsDown, Edit2, Trash2, LayoutGrid, UserPlus, 
    FileSpreadsheet, MoreVertical, Settings, Users, AlertCircle, X, 
    Dices, Timer, Play, Pause, RotateCcw, CheckCircle2, MessageCircle, Plus,
    Sparkles, Phone, Send, Star, Loader2, Mail, RefreshCcw 
} from 'lucide-react';
import ExcelImport from './ExcelImport';
import { useApp } from '../context/AppContext';
import { StudentAvatar } from './StudentAvatar';

import positiveSound from '../assets/positive.mp3';
import negativeSound from '../assets/negative.mp3';
import tadaSound from '../assets/tada.mp3';
import alarmSound from '../assets/alarm.mp3';

interface StudentListProps {
    students: Student[];
    classes: string[];
    onAddClass: (name: string) => void;
    onAddStudentManually: (name: string, className: string, phone?: string, avatar?: string, gender?: 'male'|'female', civilID?: string) => void;
    onBatchAddStudents: (students: Student[]) => void;
    onUpdateStudent: (student: Student) => void;
    onDeleteStudent: (id: string) => void;
    onViewReport: (student: Student) => void;
    currentSemester: '1' | '2';
    onDeleteClass?: (className: string) => void; 
    onSemesterChange?: (sem: '1' | '2') => void;
    onEditClass?: (oldName: string, newName: string) => void;
}

const SOUNDS = {
    positive: positiveSound,
    negative: negativeSound,
    tada: tadaSound, 
    alarm: alarmSound
}

const NEGATIVE_BEHAVIORS = [
    { id: '1', original: 'إزعاج في الحصة', transKey: 'behNeg1', points: -2 },
    { id: '2', original: 'عدم حل الواجب', transKey: 'behNeg2', points: -2 },
    { id: '3', original: 'نسيان الكتاب والدفتر', transKey: 'behNeg3', points: -1 },
    { id: '4', original: 'تأخر عن الحصة', transKey: 'behNeg4', points: -1 },
    { id: '5', original: 'سلوك غير لائق', transKey: 'behNeg5', points: -3 },
    { id: '6', original: 'النوم في الفصل', transKey: 'behNeg6', points: -2 },
];

const POSITIVE_BEHAVIORS = [
    { id: 'p1', original: 'إجابة متميزة', transKey: 'behPos1', points: 2 },
    { id: 'p2', original: 'إجابة صحيحة', transKey: 'behPos2', points: 1 },
    { id: 'p3', original: 'واجب مميز', transKey: 'behPos3', points: 2 },
    { id: 'p4', original: 'مساعدة الزملاء', transKey: 'behPos4', points: 2 },
    { id: 'p5', original: 'مشاركة صفية متميزة', transKey: 'behPos5', points: 5 },
    { id: 'p6', original: 'إبداع وتميز', transKey: 'behPos6', points: 3 },
];

const GOOGLE_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzKPPsQsM_dIttcYSxRLs6LQuvXhT6Qia5TwJ1Tw4ObQ-eZFZeJhV6epXXjxA9_SwWk/exec"; 

const StudentList: React.FC<StudentListProps> = ({ 
    students = [], 
    classes = [], 
    onAddClass, 
    onAddStudentManually, 
    onBatchAddStudents, 
    onUpdateStudent, 
    onDeleteStudent, 
    currentSemester, 
    onDeleteClass 
}) => {
    const { defaultStudentGender, setDefaultStudentGender, setStudents, teacherInfo, t, dir, language } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    
    const [selectedGrade, setSelectedGrade] = useState<string>(() => sessionStorage.getItem('rased_grade') || 'all');
    const [selectedClass, setSelectedClass] = useState<string>(() => sessionStorage.getItem('rased_class') || 'all');

    useEffect(() => {
        sessionStorage.setItem('rased_grade', selectedGrade);
        sessionStorage.setItem('rased_class', selectedClass);
    }, [selectedGrade, selectedClass]);
    
    const [showManualAddModal, setShowManualAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAddClassModal, setShowAddClassModal] = useState(false);
    const [showManageClasses, setShowManageClasses] = useState(false); 
    const [showMenu, setShowMenu] = useState(false);

    const [newClassInput, setNewClassInput] = useState('');
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentPhone, setNewStudentPhone] = useState('');
    const [newStudentGender, setNewStudentGender] = useState<'male' | 'female'>(defaultStudentGender);
    const [newStudentClass, setNewStudentClass] = useState('');
    const [newStudentCivilID, setNewStudentCivilID] = useState(''); 

    const [showNegativeModal, setShowNegativeModal] = useState(false);
    const [showPositiveModal, setShowPositiveModal] = useState(false);
    const [selectedStudentForBehavior, setSelectedStudentForBehavior] = useState<Student | null>(null);

    const [customPositiveReason, setCustomPositiveReason] = useState('');
    const [customNegativeReason, setCustomNegativeReason] = useState('');

    const [randomWinner, setRandomWinner] = useState<Student | null>(null);
    const [pickedStudentIds, setPickedStudentIds] = useState<string[]>([]);

    const [showTimerModal, setShowTimerModal] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerInput, setTimerInput] = useState('5');

    const [messages, setMessages] = useState<any[]>([]);
    const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
    const [isFetchingMsgs, setIsFetchingMsgs] = useState(false);

    const [readMessagesCount, setReadMessagesCount] = useState<number>(() => {
        return parseInt(localStorage.getItem('rased_read_messages_count') || '0', 10);
    });

    useEffect(() => {
        if (isMessagesModalOpen && messages.length > 0) {
            setReadMessagesCount(messages.length);
            localStorage.setItem('rased_read_messages_count', messages.length.toString());
        }
    }, [isMessagesModalOpen, messages.length]);

    const fetchParentMessages = async () => {
        if (!teacherInfo?.school || !teacherInfo?.subject) return;
        setIsFetchingMsgs(true);
        try {
            const url = `${GOOGLE_WEB_APP_URL}?action=getMessages&school=${encodeURIComponent(teacherInfo.school)}&subject=${encodeURIComponent(teacherInfo.subject)}`;
            const response = await fetch(url);
            const result = await response.json();
            if (result.status === 'success') {
                setMessages(result.messages || []);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setIsFetchingMsgs(false);
        }
    };

    const handleReplyToMessage = (msg: any) => {
        const student = students.find(s => 
            String(s.parentCode || '').trim() === String(msg.civilID || '').trim()
        );
        
        if (!student) {
            alert(t('alertNoStudentFoundWithCivilId'));
            return;
        }
        if (!student.parentPhone) {
            alert(`${t('alertNoParentPhone')} ${student.name}`);
            return;
        }

        const truncatedMsg = msg.message.length > 60 ? msg.message.substring(0, 60) + '...' : msg.message;
        const replyText = `${t('whatsappReplyIntro')} "${student.name}"${t('whatsappReplyRegarding')} "${truncatedMsg}"${t('whatsappReplyInform')}`;
        const encodedText = encodeURIComponent(replyText);

        let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
        if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
        else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);

        if ((window as any).electron) { 
            (window as any).electron.openExternal(`whatsapp://send?phone=${cleanPhone}&text=${encodedText}`); 
        } else { 
            const universalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`; 
            window.open(universalUrl, '_blank'); 
        }
    };

    useEffect(() => {
        fetchParentMessages();
    }, [teacherInfo?.school, teacherInfo?.subject]);

    useEffect(() => {
        let interval: any;
        if (isTimerRunning && timerSeconds > 0) {
            if (timerSeconds === 10) {
                const countdownAudio = new Audio(SOUNDS.tada);
                countdownAudio.volume = 1.0;
                countdownAudio.play().catch((e) => console.error("Error playing audio", e));
            }
            interval = setInterval(() => {
                setTimerSeconds((prev) => prev - 1);
            }, 1000);
        } else if (timerSeconds === 0 && isTimerRunning) {
            setIsTimerRunning(false);
            if (navigator.vibrate) {
                navigator.vibrate([500, 200, 500]);
            }
            setTimeout(() => alert(t('alertTimerEnded')), 500);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timerSeconds]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const startTimer = (minutes: number) => {
        setTimerSeconds(minutes * 60);
        setIsTimerRunning(true);
    };

    const safeClasses = useMemo(() => Array.isArray(classes) ? classes : [], [classes]);
    const safeStudents = useMemo(() => Array.isArray(students) ? students : [], [students]);

    useEffect(() => {
        if (safeClasses.length > 0 && !newStudentClass) {
            setNewStudentClass(safeClasses[0]);
        }
    }, [safeClasses]);

    useEffect(() => {
        setPickedStudentIds([]);
    }, [selectedClass, selectedGrade]);

    useEffect(() => {
        setNewStudentGender(defaultStudentGender);
    }, [defaultStudentGender]);

    const availableGrades = useMemo(() => {
        const grades = new Set<string>();
        if (safeStudents.length > 0) {
            safeStudents.forEach(s => {
                if (!s) return;
                if (s.grade) {
                    grades.add(s.grade);
                } else if (s.classes && s.classes[0]) {
                    const match = s.classes[0].match(/^(\d+)/);
                    if (match) grades.add(match[1]);
                }
            });
        }
        return Array.from(grades).sort();
    }, [safeStudents]);

    const filteredStudents = useMemo(() => {
        if (safeStudents.length === 0) return [];
        return safeStudents.filter(student => {
            if (!student) return false;
            const nameMatch = (student.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const studentClasses = student.classes || [];
            const matchesClass = selectedClass === 'all' || studentClasses.includes(selectedClass);
            
            let matchesGrade = true;
            if (selectedGrade !== 'all') {
               const firstClass = studentClasses[0] || '';
               matchesGrade = student.grade === selectedGrade || firstClass.startsWith(selectedGrade);
            }
            return nameMatch && matchesClass && matchesGrade;
        });
    }, [safeStudents, searchTerm, selectedClass, selectedGrade]);

    const playSound = (type: 'positive' | 'negative' | 'tada') => {
        const audio = new Audio(SOUNDS[type]);
        audio.volume = 0.5;
        audio.play().catch(e => console.error(e));
    };

    const calculateTotalPoints = (student: Student) => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const monthlyPoints = (student.behaviors || [])
            .filter(b => {
                const d = new Date(b.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((acc, b) => acc + b.points, 0); 
        return monthlyPoints;
    };

    const handleRandomPick = () => {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const presentStudents = filteredStudents.filter(s => {
            const attendanceRecord = s.attendance.find(a => a.date === todayStr);
            const isAbsentOrTruant = attendanceRecord?.status === 'absent' || attendanceRecord?.status === 'truant';
            return !isAbsentOrTruant;
        });

        if (presentStudents.length === 0) {
            alert(t('alertNoPresentStudentsForDraw'));
            return;
        }

        const eligibleCandidates = presentStudents.filter(s => !pickedStudentIds.includes(s.id));

        if (eligibleCandidates.length === 0) {
            if (confirm(t('alertAllPresentSelected'))) {
                setPickedStudentIds([]);
            }
            return;
        }

        const randomIndex = Math.floor(Math.random() * eligibleCandidates.length);
        const winner = eligibleCandidates[randomIndex];

        setPickedStudentIds(prev => [...prev, winner.id]);
        setRandomWinner(winner);
        playSound('tada'); 
        setShowMenu(false);
    };

    const handleBehavior = (student: Student, type: BehaviorType) => {
        setSelectedStudentForBehavior(student);
        setCustomPositiveReason('');
        setCustomNegativeReason('');
        
        if (type === 'positive') {
            setShowPositiveModal(true);
        } else {
            setShowNegativeModal(true);
        }
    };

    const handleSendSmartReport = (student: Student) => {
        if (!student.parentPhone) {
            alert(t('alertNoParentPhone'));
            return;
        }

        const currentGrades = (student.grades || []).filter(g => (g.semester || '1') === currentSemester);
        const totalScore = currentGrades.reduce((acc, curr) => acc + (curr.score || 0), 0);

        const positiveBehaviors = (student.behaviors || []).filter(b => b.type === 'positive');
        
        const isFemale = student.gender === 'female';
        const topBehavior = positiveBehaviors.length > 0 
            ? positiveBehaviors[0].description 
            : (isFemale ? t('whatsappSmartGeneralBehaviorFemale') : t('whatsappSmartGeneralBehaviorMale'));

        const childTitle = isFemale ? t('whatsappSmartIntroFemale') : t('whatsappSmartIntroMale');
        const scoreText = isFemale ? t('whatsappSmartScoreFemale') : t('whatsappSmartScoreMale');
        const behaviorText = isFemale ? t('whatsappSmartBehaviorFemale') : t('whatsappSmartBehaviorMale');
        const teacherTitle = teacherInfo?.gender === 'female' ? t('whatsappSmartTeacherFemale') : t('whatsappSmartTeacherMale');

        const message = `${t('whatsappSmartMsg1')} ${childTitle} (${student.name}) ${t('whatsappSmartMsg2')} ${childTitle} ${scoreText} (${totalScore}) ${t('whatsappSmartMsg3')} ${teacherInfo?.subject || '...'}، ${behaviorText}: "${topBehavior}"${t('whatsappSmartMsg4')} ${teacherTitle}: ${teacherInfo?.name || ''}`;

        const msg = encodeURIComponent(message);
        let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
        if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
        else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);

        if ((window as any).electron) { 
            (window as any).electron.openExternal(`whatsapp://send?phone=${cleanPhone}&text=${msg}`); 
        } else { 
            const universalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`; 
            window.open(universalUrl, '_blank'); 
        }
    };

    const handleSendNegativeReport = async (student: Student) => {
        if (!student.parentPhone) {
            alert(t('alertNoParentPhone'));
            return;
        }

        const negativeBehaviors = (student.behaviors || []).filter(b => b.type === 'negative');

        if (negativeBehaviors.length === 0) {
            alert(t('alertStudentIsExcellent'));
            return;
        }

        let message = `${t('whatsappNegMsg1')}${student.name}${t('whatsappNegMsg2')}`;

        negativeBehaviors.slice(0, 5).forEach(b => {
            const dateObj = new Date(b.date);
            const date = dateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
            const time = dateObj.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
            
            message += `🔴 *${b.description}*\n📅 ${date} - ⏰ ${time}\n─────────────────\n`;
        });

        message += t('whatsappNegMsg3');
        
        const msg = encodeURIComponent(message);
        let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
        
        if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
        if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
        else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);

        if ((window as any).electron) { 
            (window as any).electron.openExternal(`whatsapp://send?phone=${cleanPhone}&text=${msg}`); 
        } else { 
            const universalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`; 
            window.open(universalUrl, '_blank'); 
        }
    };

    const confirmPositiveBehavior = (originalTitle: string, points: number) => {
        if (!selectedStudentForBehavior) return;
        playSound('positive');
        const newBehavior = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            type: 'positive' as const,
            description: originalTitle,
            points: points,
            semester: currentSemester
        };
        onUpdateStudent({ 
            ...selectedStudentForBehavior, 
            behaviors: [newBehavior, ...(selectedStudentForBehavior.behaviors || [])] 
        });
        setShowPositiveModal(false);
        setSelectedStudentForBehavior(null);
    };

    const confirmNegativeBehavior = (originalTitle: string, points: number) => {
        if (!selectedStudentForBehavior) return;
        playSound('negative');
        const newBehavior = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            type: 'negative' as const,
            description: originalTitle,
            points: points,
            semester: currentSemester
        };
        onUpdateStudent({ 
            ...selectedStudentForBehavior, 
            behaviors: [newBehavior, ...(selectedStudentForBehavior.behaviors || [])] 
        });
        setShowNegativeModal(false);
        setSelectedStudentForBehavior(null);
    };

    const handleQuietAndDiscipline = () => {
        if (!confirm(t('alertConfirmAddDiscipline'))) return;

        const todayStr = new Date().toLocaleDateString('en-CA');
        const now = new Date();

        const eligibleStudents = filteredStudents.filter(student => {
            const attendance = student.attendance.find(a => a.date === todayStr);
            const isAbsent = attendance?.status === 'absent' || attendance?.status === 'truant';
            if (isAbsent) return false;

            const hasNegativeToday = (student.behaviors || []).some(b => {
                const bDate = new Date(b.date);
                return b.type === 'negative' && 
                       bDate.getDate() === now.getDate() &&
                       bDate.getMonth() === now.getMonth() &&
                       bDate.getFullYear() === now.getFullYear();
            });
            if (hasNegativeToday) return false;

            return true;
        });

        if (eligibleStudents.length === 0) {
            alert(t('alertNoEligibleStudents'));
            return;
        }

        const updatedStudents = students.map(student => {
            if (eligibleStudents.find(es => es.id === student.id)) {
                const newBehavior = {
                    id: Math.random().toString(36).substr(2, 9),
                    date: new Date().toISOString(),
                    type: 'positive' as const,
                    description: 'هدوء وانضباط',
                    points: 2,
                    semester: currentSemester
                };
                return { ...student, behaviors: [newBehavior, ...(student.behaviors || [])] };
            }
            return student;
        });

        setStudents(updatedStudents);
        playSound('positive');
        alert(`${t('alertDisciplineAdded1')} ${eligibleStudents.length} ${t('alertDisciplineAdded2')}`);
        setShowMenu(false);
    };

    const handleManualAddSubmit = () => {
        if (newStudentName && newStudentClass && newStudentCivilID) {
            onAddStudentManually(newStudentName, newStudentClass, newStudentPhone, undefined, newStudentGender, newStudentCivilID);
            setNewStudentName('');
            setNewStudentPhone('');
            setNewStudentCivilID('');
            setShowManualAddModal(false);
        } else {
            alert(t('alertEnterStudentInfo'));
        }
    };

    const handleAddClassSubmit = () => {
        if (newClassInput.trim()) {
            onAddClass(newClassInput.trim());
            setNewClassInput('');
            setShowAddClassModal(false);
        }
    };
    
    const handleEditStudentSave = () => {
        if (editingStudent) {
            if (!editingStudent.parentCode || editingStudent.parentCode.trim() === '') {
                alert(t('alertCivilIdRequiredForCloud'));
                return;
            }
            onUpdateStudent(editingStudent);
            setEditingStudent(null);
        }
    };

    const handleBatchGenderUpdate = (gender: 'male' | 'female') => {
        if (confirm(t('alertConfirmGenderChange'))) {
            setDefaultStudentGender(gender);
            setStudents(prev => prev.map(s => ({ ...s, gender: gender, avatar: undefined })));
        }
    };

    // تصميم اللوحات المنسدلة الذكية (Responsive Drawers)
    const baseDrawerClasses = `fixed z-[101] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl`;
    const bottomSheetClasses = `bottom-0 left-0 w-full h-[90vh] rounded-t-[2.5rem]`;
    const sidePanelClasses = `md:h-full md:w-[450px] md:top-0 md:rounded-none md:bottom-auto ${dir === 'rtl' ? 'md:left-0' : 'md:right-0'}`;

    return (
   <div className={`flex flex-col h-full pb-24 md:pb-8 overflow-hidden relative bg-slate-50 text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
            
        <header className="shrink-0 z-40 px-5 pt-[env(safe-area-inset-top)] w-full transition-all duration-300 bg-white border-b border-slate-100 shadow-sm pb-4" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="flex justify-between items-center mt-4 mb-4">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-[1.2rem] text-blue-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">{t('studentsTitle')}</h1>
                        <p className="text-[11px] font-bold text-slate-500 mt-1">{safeStudents.length} {t('registeredStudents')}</p>
                    </div>
                </div>

                <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
                    <button onClick={() => { setIsMessagesModalOpen(true); fetchParentMessages(); }} className="relative p-3 rounded-[1.2rem] border border-purple-200 bg-purple-50 text-purple-600 active:scale-95 transition-all hover:bg-purple-100 flex items-center gap-2" title={t('parentsInboxTitle')}>
                        <Mail className="w-5 h-5" />
                        <span className="hidden md:inline text-xs font-black">{t('inboxInbox')}</span>
                        {messages.length > readMessagesCount && (
                            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-bounce border border-white">
                                {messages.length - readMessagesCount}
                            </span>
                        )}
                    </button>

                    <button onClick={() => setShowTimerModal(true)} className={`p-3 rounded-[1.2rem] border active:scale-95 transition-all flex items-center gap-2 ${timerSeconds > 0 ? 'bg-amber-50 text-amber-500 border-amber-200 animate-pulse' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`} title={t('timerTitle')}>
                        <Timer className="w-5 h-5" />
                        {timerSeconds > 0 && <span className="text-xs font-black min-w-[30px]">{formatTime(timerSeconds)}</span>}
                    </button>

                    <button onClick={handleRandomPick} className="p-3 rounded-[1.2rem] border active:scale-95 transition-all bg-white border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200" title={t('randomDraw')}>
                        <Dices className="w-5 h-5" />
                    </button>

                    <div className="relative z-[90]">
                        <button onClick={() => setShowMenu(!showMenu)} className={`p-3 rounded-[1.2rem] border active:scale-95 transition-all ${showMenu ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        {showMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                            <div className={`absolute ${dir === 'rtl' ? 'left-0' : 'right-0'} top-full mt-3 w-60 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50 animate-in zoom-in-95 origin-top-left bg-white text-slate-700`}>
                                <button onClick={handleQuietAndDiscipline} className={`flex items-center gap-3 px-5 py-4 transition-colors w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} text-sm font-bold border-b border-slate-50 hover:bg-slate-50`}>
                                    <div className="p-2 bg-purple-50 rounded-xl text-purple-600"><Sparkles size={16} /></div> {t('rewardDiscipline')}
                                </button>
                                <button onClick={() => { setShowManualAddModal(true); setShowMenu(false); }} className={`flex items-center gap-3 px-5 py-4 transition-colors w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} text-sm font-bold border-b border-slate-50 hover:bg-slate-50`}>
                                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><UserPlus size={16} /></div> {t('addStudentManually')}
                                </button>
                                <button onClick={() => { setShowImportModal(true); setShowMenu(false); }} className={`flex items-center gap-3 px-5 py-4 transition-colors w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} text-sm font-bold border-b border-slate-50 hover:bg-slate-50`}>
                                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><FileSpreadsheet size={16} /></div> {t('importFromExcelMenu')}
                                </button>
                                <button onClick={() => { setShowAddClassModal(true); setShowMenu(false); }} className={`flex items-center gap-3 px-5 py-4 transition-colors w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} text-sm font-bold border-b border-slate-50 hover:bg-slate-50`}>
                                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><LayoutGrid size={16} /></div> {t('addNewClassMenu')}
                                </button>
                                <button onClick={() => { setShowManageClasses(true); setShowMenu(false); }} className={`flex items-center gap-3 px-5 py-4 transition-colors w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} text-sm font-bold hover:bg-slate-50`}>
                                    <div className="p-2 bg-slate-100 rounded-xl text-slate-500"><Settings size={16} /></div> {t('manageClassesMenu')}
                                </button>
                            </div>
                        </>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4 relative z-10" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <div className="relative">
                    <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-4 w-5 h-5 text-slate-400`} />
                    <input 
                        type="text" 
                        placeholder={t('searchStudent')} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full bg-slate-50/50 border border-slate-200 rounded-[1.5rem] py-4 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm font-bold outline-none transition-all text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white`}
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible pb-1 custom-scrollbar">
                    <button onClick={() => { setSelectedGrade('all'); setSelectedClass('all'); }} className={`px-5 py-2.5 text-[11px] font-bold whitespace-nowrap transition-all rounded-xl border ${selectedGrade === 'all' && selectedClass === 'all' ? 'bg-blue-600 text-white shadow-md border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{t('all')}</button>
                    {availableGrades.map(g => (
                         <button key={g} onClick={() => { setSelectedGrade(g); setSelectedClass('all'); }} className={`px-5 py-2.5 text-[11px] font-bold whitespace-nowrap transition-all rounded-xl border ${selectedGrade === g ? 'bg-blue-600 text-white shadow-md border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{t('gradePrefix')} {g}</button>
                    ))}
                    {safeClasses.filter(c => selectedGrade === 'all' || c.startsWith(selectedGrade)).map(c => (
                        <button key={c} onClick={() => setSelectedClass(c)} className={`px-5 py-2.5 text-[11px] font-bold whitespace-nowrap transition-all rounded-xl border ${selectedClass === c ? 'bg-blue-600 text-white shadow-md border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{c}</button>
                    ))}
                </div>
            </div>
        </header>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28 custom-scrollbar relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredStudents.length > 0 ? filteredStudents.map(student => {
                    const totalPoints = calculateTotalPoints(student);
                    return (
                    <div key={student.id} className="bg-white rounded-[1.5rem] border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-blue-200 group h-full">
                        <div className="p-5 flex flex-col items-center w-full relative flex-1">
                            <div className="relative mb-4 mt-2">
                                <StudentAvatar 
                                    gender={student.gender}
                                    className="w-20 h-20 rounded-[1.2rem] bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform"
                                />
                                {totalPoints !== 0 && (
                                   <div className={`absolute -top-3 ${dir === 'rtl' ? '-right-4' : '-left-4'} z-10 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm border border-white bg-amber-50 text-amber-600`}>
                                        <Star size={12} className="fill-amber-500 text-amber-500" />
                                        {totalPoints}
                                    </div>
                                )}
                            </div>

                            <h3 className="font-black text-[15px] text-center line-clamp-1 w-full text-slate-800">{student.name}</h3>
                            <div className="flex gap-1 mt-2">
                                <span className="text-[11px] px-3 py-1 rounded-xl font-bold bg-slate-50 text-slate-500 border border-slate-100">{student.classes && student.classes.length > 0 ? student.classes[0] : t('unspecified')}</span>
                            </div>
                        </div>

                        {/* الشريط السفلي الذكي (الإجراءات) */}
                        <div className="flex w-full justify-between items-center px-4 py-3 bg-slate-50 border-t border-slate-100 mt-auto rounded-b-[1.5rem]">
                            
                            {/* المجموعة الأساسية: السلوكيات */}
                            <div className="flex gap-2">
                                <button onClick={() => handleBehavior(student, 'positive')} className="bg-emerald-100 text-emerald-700 p-2.5 rounded-full hover:bg-emerald-200 active:scale-95 transition-all shadow-sm z-20" title={t('positiveReinforcement')}>
                                    <ThumbsUp size={16} />
                                </button>
                                <button onClick={() => handleBehavior(student, 'negative')} className="bg-rose-100 text-rose-700 p-2.5 rounded-full hover:bg-rose-200 active:scale-95 transition-all shadow-sm z-20" title={t('behavioralAlert')}>
                                    <ThumbsDown size={16} />
                                </button>
                            </div>

                            {/* المجموعة الثانوية: المراسلة والتعديل */}
                            <div className="flex gap-1">
                                <button onClick={() => handleSendSmartReport(student)} className="text-slate-400 hover:text-blue-500 p-2.5 rounded-xl hover:bg-blue-100 active:scale-95 transition-all z-20" title="تقرير التميز">
                                    <MessageCircle size={18} />
                                </button>
                                <button onClick={() => handleSendNegativeReport(student)} className="text-slate-400 hover:text-amber-500 p-2.5 rounded-xl hover:bg-amber-100 active:scale-95 transition-all z-20" title="إنذار سلوكي">
                                    <Send size={18} />
                                </button>
                                <button onClick={() => setEditingStudent(student)} className="text-slate-400 hover:text-indigo-500 p-2.5 rounded-xl hover:bg-indigo-100 active:scale-95 transition-all z-20" title={t('editStudentData')}>
                                    <Edit2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}) : (
                    <div className="flex flex-col items-center justify-center py-20 col-span-full text-center">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                            <UserPlus className="w-12 h-12 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">{t('noMatchingStudents')}</p>
                        {safeClasses.length === 0 && <p className="text-xs mt-3 font-bold cursor-pointer text-blue-500 hover:text-blue-600 transition-colors" onClick={() => setShowAddClassModal(true)}>{t('startByAddingClass')}</p>}
                    </div>
                )}
            </div>
        </div>

        {/* =========================================================
            اللوحات المنسدلة الذكية - تم إضافة pt-12 لجميع العناوين
        ========================================================= */}

        {/* 📥 1. لوحة صندوق الوارد */}
        <>
            <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${isMessagesModalOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setIsMessagesModalOpen(false)} />
            <div className={`fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl
                ${isMessagesModalOpen ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'}
                bottom-0 left-0 w-full h-[90vh] rounded-t-[2.5rem]
                md:top-0 md:bottom-auto md:h-full md:w-[450px] md:rounded-none
                ${dir === 'rtl' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'}
            `}>
                <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                <div className="flex justify-between items-center px-6 pt-10 pb-5 md:pt-14 border-b border-slate-100 shrink-0">
                    <h3 className="font-black text-xl flex items-center gap-2 text-purple-600">
                        <Mail className="w-6 h-6" /> {t('parentsInboxTitle')}
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={fetchParentMessages} className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors">
                            <RefreshCcw className={`w-5 h-5 ${isFetchingMsgs ? 'animate-spin text-purple-600' : ''}`} />
                        </button>
                        <button onClick={() => setIsMessagesModalOpen(false)} className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-colors">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {isFetchingMsgs && messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                            <p className="text-slate-500 font-bold">{t('fetchingMessages')}</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="w-10 h-10 text-slate-300" /></div>
                            <p className="text-slate-500 font-bold text-sm">{t('noNewMessages')}</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className="p-5 border border-slate-100 rounded-[1.5rem] bg-white shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className={`absolute top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} w-1.5 h-full bg-purple-500`}></div>
                                <div className={`flex justify-between items-start mb-3 ${dir === 'rtl' ? 'pl-2' : 'pr-2'}`}>
                                    <div>
                                        <h4 className="font-black text-slate-800 text-base">{msg.studentName}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">{t('civilIdPrefix')} {msg.civilID}</p>
                                    </div>
                                    <span className="text-[10px] font-bold bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100 text-slate-500">
                                        {new Date(msg.date).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </span>
                                </div>
                                <div className={`bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 leading-relaxed ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {msg.message}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button onClick={() => handleReplyToMessage(msg)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black shadow-sm active:scale-95 transition-all bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                                        <MessageCircle size={16} /> {t('replyViaWhatsapp')}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>

        {/* 🧑‍🎓 2. لوحة الإضافة اليدوية */}
        <>
            <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${showManualAddModal ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setShowManualAddModal(false)} />
            <div className={`fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl
                ${showManualAddModal ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'}
                bottom-0 left-0 w-full h-[90vh] rounded-t-[2.5rem]
                md:top-0 md:bottom-auto md:h-full md:w-[450px] md:rounded-none
                ${dir === 'rtl' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'}
            `}>
                <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                <div className="flex justify-between items-center px-6 pt-10 pb-5 md:pt-14 border-b border-slate-100 shrink-0">
                    <h3 className="font-black text-xl text-slate-800">{t('addStudentTitle')}</h3>
                    <button onClick={() => setShowManualAddModal(false)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-blue-50 text-blue-500">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('studentNamePlaceholder')}</label>
                        <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className="w-full p-4 rounded-2xl text-sm font-bold outline-none border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('selectClassPlaceholder')}</label>
                        <select value={newStudentClass} onChange={(e) => setNewStudentClass(e.target.value)} className="w-full p-4 rounded-2xl text-sm font-bold outline-none border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all">
                            <option value="" disabled>{t('selectClassPlaceholder')}</option>
                            {safeClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('civilIdPlaceholderMandatory')}</label>
                        <input type="number" value={newStudentCivilID} onChange={(e) => setNewStudentCivilID(e.target.value)} className="w-full p-4 rounded-2xl text-sm font-bold outline-none border border-slate-200 bg-amber-50 focus:bg-white text-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('parentPhoneOptional')}</label>
                        <input type="tel" value={newStudentPhone} onChange={(e) => setNewStudentPhone(e.target.value)} className="w-full p-4 rounded-2xl text-sm font-bold outline-none border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => setNewStudentGender('male')} className={`flex-1 py-4 rounded-2xl font-bold text-xs transition-all border ${newStudentGender === 'male' ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{t('maleStudent')}</button>
                        <button onClick={() => setNewStudentGender('female')} className={`flex-1 py-4 rounded-2xl font-bold text-xs transition-all border ${newStudentGender === 'female' ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{t('femaleStudent')}</button>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                    <button onClick={handleManualAddSubmit} disabled={!newStudentName || !newStudentClass || !newStudentCivilID} className="w-full py-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-500/30 bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50">{t('saveStudentBtn')}</button>
                </div>
            </div>
        </>

        {/* 📊 3. لوحة استيراد الإكسل */}
        <>
            <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${showImportModal ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setShowImportModal(false)} />
            <div className={`fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl
                ${showImportModal ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'}
                bottom-0 left-0 w-full h-[90vh] rounded-t-[2.5rem]
                md:top-0 md:bottom-auto md:h-full md:w-[600px] md:rounded-none
                ${dir === 'rtl' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'}
            `}>
                <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                <div className="flex justify-between items-center px-6 pt-10 pb-5 md:pt-14 border-b border-slate-100 shrink-0">
                    <h3 className="font-black text-xl text-slate-800">{t('importFromExcelMenu')}</h3>
                    <button onClick={() => setShowImportModal(false)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <ExcelImport 
                        existingClasses={safeClasses} 
                        onImport={(importedStudents) => {
                            const normalizeArabicName = (name: string) => {
                                if (!name) return '';
                                return name
                                    .replace(/[أإآءؤئ]/g, 'ا')
                                    .replace(/ة/g, 'ه')
                                    .replace(/ى/g, 'ي')
                                    .replace(/عبد /g, 'عبد')
                                    .replace(/\s+/g, '')
                                    .trim();
                            };
                            setStudents(prevStudents => {
                                const updatedStudents = [...prevStudents];
                                importedStudents.forEach(imported => {
                                    const normalizedImportedName = normalizeArabicName(imported.name);
                                    let existingIndex = -1;
                                    if (imported.parentCode && imported.parentCode.trim() !== '') {
                                        existingIndex = updatedStudents.findIndex(s => s.parentCode === imported.parentCode);
                                    }
                                    if (existingIndex === -1) {
                                        existingIndex = updatedStudents.findIndex(s => normalizeArabicName(s.name) === normalizedImportedName);
                                    }
                                    if (existingIndex >= 0) {
                                        updatedStudents[existingIndex] = {
                                            ...updatedStudents[existingIndex],
                                            parentCode: (imported.parentCode && imported.parentCode.trim() !== '') ? imported.parentCode : updatedStudents[existingIndex].parentCode,
                                            parentPhone: (imported.parentPhone && imported.parentPhone.trim() !== '') ? imported.parentPhone : updatedStudents[existingIndex].parentPhone,
                                            gender: imported.gender || updatedStudents[existingIndex].gender
                                        };
                                    } else {
                                        updatedStudents.push(imported);
                                    }
                                });
                                return updatedStudents;
                            });
                            setShowImportModal(false); 
                        }} 
                        onAddClass={onAddClass} 
                    />
                </div>
            </div>
        </>

        {/* 🏫 4. لوحة إضافة صف جديد */}
        <>
            <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${showAddClassModal ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setShowAddClassModal(false)} />
            <div className={`fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl
                ${showAddClassModal ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'}
                bottom-0 left-0 w-full rounded-t-[2.5rem]
                md:top-0 md:bottom-auto md:h-full md:w-[400px] md:rounded-none
                ${dir === 'rtl' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'}
            `}>
                <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                <div className="flex justify-between items-center px-6 pt-10 pb-5 md:pt-14 border-b border-slate-100 shrink-0">
                    <h3 className="font-black text-xl text-slate-800">{t('addNewClassTitle')}</h3>
                    <button onClick={() => setShowAddClassModal(false)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={18} /></button>
                </div>
                <div className="p-6">
                    <div className="bg-amber-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-amber-500"><LayoutGrid size={28}/></div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('classNameExample')}</label>
                    <input autoFocus type="text" placeholder={t('classNameExample')} value={newClassInput} onChange={(e) => setNewClassInput(e.target.value)} className="w-full p-4 rounded-2xl text-sm font-bold outline-none border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all mb-6" />
                    <button onClick={handleAddClassSubmit} disabled={!newClassInput.trim()} className="w-full py-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-500/30 bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50">{t('addBtnSimple')}</button>
                </div>
            </div>
        </>

        {/* ⚙️ 5. لوحة إدارة الصفوف */}
        <>
            <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${showManageClasses ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setShowManageClasses(false)} />
            <div className={`fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl
                ${showManageClasses ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'}
                bottom-0 left-0 w-full h-[85vh] rounded-t-[2.5rem]
                md:top-0 md:bottom-auto md:h-full md:w-[450px] md:rounded-none
                ${dir === 'rtl' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'}
            `}>
                <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                <div className="flex justify-between items-center px-6 pt-10 pb-5 md:pt-14 border-b border-slate-100 shrink-0">
                    <h3 className="font-black text-xl text-slate-800">{t('classSettingsTitle')}</h3>
                    <button onClick={() => setShowManageClasses(false)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    <div className="rounded-[1.5rem] p-5 bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-2 mb-4 text-blue-800">
                            <Users className="w-5 h-5" />
                            <span className="font-black text-sm">{t('schoolTypeBatchChange')}</span>
                        </div>
                        <div className="flex gap-3 mb-3">
                            <button onClick={() => handleBatchGenderUpdate('male')} className={`flex-1 py-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${defaultStudentGender === 'male' ? 'bg-white border-blue-200 shadow-sm text-blue-700' : 'bg-white/50 border-transparent text-slate-500 hover:bg-white'}`}>
                                <span className="text-xl">👨‍🎓</span><span className="font-black text-sm">{t('boys')}</span>
                            </button>
                            <button onClick={() => handleBatchGenderUpdate('female')} className={`flex-1 py-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${defaultStudentGender === 'female' ? 'bg-white border-pink-200 shadow-sm text-pink-700' : 'bg-white/50 border-transparent text-slate-500 hover:bg-white'}`}>
                                <span className="text-xl">👩‍🎓</span><span className="font-black text-sm">{t('girls')}</span>
                            </button>
                        </div>
                        <p className="text-[10px] font-bold text-blue-500">{t('iconUnificationNote')}</p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-slate-500">{t('deleteClassInstruction')}</span>
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">{t('deleteClassWarning')}</span>
                        </div>
                        <div className="space-y-3">
                            {safeClasses.map(cls => (
                                <div key={cls} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-colors">
                                    <span className="font-black text-sm text-slate-800">{cls}</span>
                                    <button onClick={() => { if(onDeleteClass && confirm(t('alertConfirmDeleteClass'))) onDeleteClass(cls); }} className="p-2.5 rounded-xl bg-white text-rose-500 border border-slate-100 hover:bg-rose-50 transition-colors shadow-sm"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                            {safeClasses.length === 0 && <p className="text-xs text-center p-4 text-slate-400">{t('noClassesAdded')}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </>

        {/* 👍 6. لوحة السلوك الإيجابي */}
        <>
            <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${showPositiveModal ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => { setShowPositiveModal(false); setSelectedStudentForBehavior(null); }} />
            <div className={`fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl
                ${showPositiveModal ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'}
                bottom-0 left-0 w-full rounded-t-[2.5rem]
                md:top-0 md:bottom-auto md:h-full md:w-[450px] md:rounded-none
                ${dir === 'rtl' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'}
            `}>
                <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                <div className="flex justify-between items-center px-6 pt-10 pb-5 md:pt-14 border-b border-slate-100 shrink-0">
                    <h3 className="font-black text-xl flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-6 h-6" /> {t('positiveReinforcement')}</h3>
                    <button onClick={() => { setShowPositiveModal(false); setSelectedStudentForBehavior(null); }} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={18} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <p className="text-sm font-bold mb-5 text-slate-500">
                        {t('chooseExcellenceType')} <bdi className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{selectedStudentForBehavior?.name}</bdi>
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {POSITIVE_BEHAVIORS.map(b => (
                            <button key={b.id} onClick={() => confirmPositiveBehavior(b.original, b.points)} className="p-4 border border-emerald-100 rounded-2xl text-xs font-bold active:scale-95 transition-all flex flex-col items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm">
                                <span>{t(b.transKey)}</span>
                                <span className="text-[11px] px-3 py-1 rounded-xl bg-white text-emerald-600 shadow-sm">+{b.points} {t('points')}</span>
                            </button>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <p className={`text-[11px] font-bold mb-3 ${dir === 'rtl' ? 'text-right' : 'text-left'} text-slate-500`}>{t('orAddCustomBehavior')}</p>
                        <div className="flex gap-2">
                            <input type="text" value={customPositiveReason} onChange={(e) => setCustomPositiveReason(e.target.value)} placeholder={t('otherReasonPlaceholder')} className="flex-1 border border-slate-200 rounded-[1rem] px-4 py-3 text-sm font-bold outline-none bg-slate-50 focus:bg-white text-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                            <button onClick={() => { if(customPositiveReason.trim()) confirmPositiveBehavior(customPositiveReason, 1); }} className="px-5 py-3 rounded-[1rem] text-sm font-bold active:scale-95 flex items-center gap-2 transition-colors bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm">
                                <Plus size={18} /> {t('addBtnSmall')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>

        {/* 👎 7. لوحة السلوك السلبي */}
        <>
            <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${showNegativeModal ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => { setShowNegativeModal(false); setSelectedStudentForBehavior(null); }} />
            <div className={`fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl
                ${showNegativeModal ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'}
                bottom-0 left-0 w-full rounded-t-[2.5rem]
                md:top-0 md:bottom-auto md:h-full md:w-[450px] md:rounded-none
                ${dir === 'rtl' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'}
            `}>
                <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                <div className="flex justify-between items-center px-6 pt-10 pb-5 md:pt-14 border-b border-slate-100 shrink-0">
                    <h3 className="font-black text-xl flex items-center gap-2 text-rose-600"><AlertCircle className="w-6 h-6" /> {t('behavioralAlert')}</h3>
                    <button onClick={() => { setShowNegativeModal(false); setSelectedStudentForBehavior(null); }} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={18} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <p className="text-sm font-bold mb-5 text-slate-500">
                        {t('chooseNoteType')} <bdi className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">{selectedStudentForBehavior?.name}</bdi>
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {NEGATIVE_BEHAVIORS.map(b => (
                            <button key={b.id} onClick={() => confirmNegativeBehavior(b.original, b.points)} className="p-4 border border-rose-100 rounded-2xl text-xs font-bold active:scale-95 transition-all flex flex-col items-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-sm">
                                <span>{t(b.transKey)}</span>
                                <span className="text-[11px] px-3 py-1 rounded-xl bg-white text-rose-600 shadow-sm">{b.points} {t('points')}</span>
                            </button>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <p className={`text-[11px] font-bold mb-3 ${dir === 'rtl' ? 'text-right' : 'text-left'} text-slate-500`}>{t('orAddCustomNote')}</p>
                        <div className="flex gap-2">
                            <input type="text" value={customNegativeReason} onChange={(e) => setCustomNegativeReason(e.target.value)} placeholder={t('otherReasonPlaceholder')} className="flex-1 border border-slate-200 rounded-[1rem] px-4 py-3 text-sm font-bold outline-none bg-slate-50 focus:bg-white text-slate-800 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all" />
                            <button onClick={() => { if(customNegativeReason.trim()) confirmNegativeBehavior(customNegativeReason, -1); }} className="px-5 py-3 rounded-[1rem] text-sm font-bold active:scale-95 flex items-center gap-2 transition-colors bg-rose-500 text-white hover:bg-rose-600 shadow-sm">
                                <Plus size={18} /> {t('addBtnSmall')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>

        {/* ✏️ 8. لوحة تعديل الطالب */}
        <>
            <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${!!editingStudent ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setEditingStudent(null)} />
            <div className={`fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl
                ${!!editingStudent ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'}
                bottom-0 left-0 w-full h-[90vh] rounded-t-[2.5rem]
                md:top-0 md:bottom-auto md:h-full md:w-[450px] md:rounded-none
                ${dir === 'rtl' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'}
            `}>
                <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                <div className="flex justify-between items-center px-6 pt-10 pb-5 md:pt-14 border-b border-slate-100 shrink-0">
                    <h3 className="font-black text-xl text-slate-800">{t('editStudentData')}</h3>
                    <button onClick={() => setEditingStudent(null)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={18} /></button>
                </div>
                {editingStudent && (
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 bg-blue-50 text-blue-500">
                        <Edit2 className="w-8 h-8" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('namePlaceholderSimple')}</label>
                        <input type="text" value={editingStudent.name} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} className="w-full p-4 rounded-2xl text-sm font-bold outline-none border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('selectClassPlaceholder')}</label>
                        <select value={editingStudent.classes && editingStudent.classes.length > 0 ? editingStudent.classes[0] : ''} onChange={(e) => setEditingStudent({...editingStudent, classes: [e.target.value]})} className="w-full p-4 rounded-2xl text-sm font-bold outline-none border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all">
                            {safeClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('phoneNumberPlaceholder')}</label>
                        <input type="tel" value={editingStudent.parentPhone || ''} onChange={(e) => setEditingStudent({...editingStudent, parentPhone: e.target.value})} className="w-full p-4 rounded-2xl text-sm font-bold outline-none border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('civilIdEssentialNote')}</label>
                        <input type="number" value={editingStudent.parentCode || ''} onChange={(e) => setEditingStudent({...editingStudent, parentCode: e.target.value})} placeholder={t('enterCivilIdHere')} className="w-full p-4 rounded-2xl text-center font-mono font-black tracking-widest outline-none border border-amber-200 bg-amber-50 focus:bg-white text-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => setEditingStudent({...editingStudent, gender: 'male'})} className={`flex-1 py-4 rounded-2xl font-bold text-xs transition-all border ${editingStudent.gender === 'male' ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{t('maleStudent')}</button>
                        <button onClick={() => setEditingStudent({...editingStudent, gender: 'female'})} className={`flex-1 py-4 rounded-2xl font-bold text-xs transition-all border ${editingStudent.gender === 'female' ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{t('femaleStudent')}</button>
                    </div>
                    <button onClick={() => { if(confirm(t('alertConfirmDeleteStudent'))) { onDeleteStudent(editingStudent.id); setEditingStudent(null); }}} className="w-full py-4 mt-2 border border-rose-200 rounded-2xl font-black text-sm transition-colors bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center gap-2">
                        <Trash2 className="w-5 h-5"/> حذف الطالب
                    </button>
                </div>
                )}
                <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                    <button onClick={handleEditStudentSave} className="w-full py-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-500/30 bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all">{t('saveChangesBtn')}</button>
                </div>
            </div>
        </>

        {/* 🎉 9. لوحة العجلة العشوائية (الفائز) */}
        <>
            <div className={`fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md transition-all duration-300 ${!!randomWinner ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setRandomWinner(null)} />
            <div className={`fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-white shadow-2xl
                ${!!randomWinner ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:scale-95 invisible pointer-events-none'}
                bottom-0 left-0 w-full rounded-t-[2.5rem]
                md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto md:w-[400px] md:rounded-[2.5rem] md:h-auto
            `}>
                {randomWinner && (
                    <div className="text-center pt-16 pb-10 px-6">
                        <div className="mb-8 relative inline-block">
                            <div className="w-32 h-32 rounded-[2rem] border-4 shadow-xl overflow-hidden mx-auto bg-purple-50 border-purple-200">
                                <StudentAvatar gender={randomWinner.gender} className="w-full h-full" />
                            </div>
                            <div className={`absolute -top-4 ${dir === 'rtl' ? '-right-4' : '-left-4'} text-5xl animate-bounce`}>🎉</div>
                            <div className={`absolute -bottom-2 ${dir === 'rtl' ? '-left-2' : '-right-2'} text-5xl animate-bounce`} style={{animationDelay: '0.2s'}}>✨</div>
                        </div>
                        <h2 className="text-3xl font-black mb-2 text-slate-800">{randomWinner.name}</h2>
                        <p className="text-sm font-bold inline-block px-4 py-1.5 rounded-full mb-8 bg-purple-50 text-purple-600 border border-purple-100">
                            {randomWinner.classes[0]}
                        </p>
                        <div className="flex gap-3 max-w-sm mx-auto">
                            <button onClick={() => { handleBehavior(randomWinner, 'positive'); setRandomWinner(null); }} className="flex-1 py-4 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all bg-emerald-500 text-white hover:bg-emerald-600">
                                {t('reinforceBtn')}
                            </button>
                            <button onClick={() => setRandomWinner(null)} className="flex-1 py-4 rounded-2xl font-black text-sm transition-all bg-slate-100 text-slate-600 hover:bg-slate-200">
                                {t('closeBtn')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>

        {/* ⏱️ 10. لوحة المؤقت */}
        <>
            <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${showTimerModal ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setShowTimerModal(false)} />
            <div className={`fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl 
                ${showTimerModal ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-[150%] md:translate-y-0 md:opacity-0 md:scale-95 invisible pointer-events-none'} 
                bottom-0 left-0 w-full rounded-t-[2.5rem] 
                md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto md:w-[380px] md:h-auto md:rounded-[2.5rem]`}>
                
                <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
                
                <button onClick={() => setShowTimerModal(false)} className="absolute top-10 right-6 p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-colors hidden md:block">
                    <X size={18} />
                </button>

                <div className="p-6 text-center pt-14">
                    <h3 className="font-black text-xl mb-6 flex items-center justify-center gap-2 text-slate-800">
                        <Timer className="w-6 h-6 text-amber-500"/> {t('timerTitle')}
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[1, 3, 5, 10, 15, 20].map(min => (
                            <button key={min} onClick={() => startTimer(min)} className="border border-slate-200 rounded-2xl py-3 text-sm font-bold transition-all active:scale-95 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600">
                                {min} {t('minuteAbbrev')}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 items-center mb-4">
                        <input type="number" value={timerInput} onChange={(e) => setTimerInput(e.target.value)} className="w-full border border-slate-200 rounded-2xl py-3 px-4 text-center font-black outline-none transition-colors bg-slate-50 focus:bg-white text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400" placeholder={t('minutePlaceholder')} />
                        <button onClick={() => startTimer(Number(timerInput))} className="p-3.5 rounded-2xl active:scale-95 shadow-lg shadow-indigo-500/30 transition-colors bg-indigo-600 hover:bg-indigo-700">
                            <Play size={20} fill="white" className="text-white" />
                        </button>
                    </div>

                    {isTimerRunning && (
                        <div className="border-t border-slate-100 pt-6 mt-4">
                            <h2 className="text-5xl font-black mb-6 font-mono text-slate-800 tracking-wider">{formatTime(timerSeconds)}</h2>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setIsTimerRunning(false)} className="p-4 rounded-2xl border border-rose-100 active:scale-95 transition-colors bg-rose-50 text-rose-600 hover:bg-rose-100">
                                    <Pause size={24} fill="currentColor" />
                                </button>
                                <button onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }} className="p-4 rounded-2xl border border-slate-200 active:scale-95 transition-colors bg-slate-100 text-slate-500 hover:bg-slate-200">
                                    <RotateCcw size={24} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>

    </div>
  );
};

export default StudentList;