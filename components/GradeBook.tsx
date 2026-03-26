import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, GradeRecord, AssessmentTool } from '../types';
import { 
  Plus, X, Trash2, Settings, Check, Loader2, Edit2, 
  FileSpreadsheet, FileUp, Wand2, BarChart3, SlidersHorizontal, 
  FileDown, PieChart, AlertTriangle, Download, Copy 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import * as XLSX from 'xlsx';
import { StudentAvatar } from './StudentAvatar';

interface GradeBookProps {
  students: Student[];
  classes: string[];
  onUpdateStudent: (s: Student) => void;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  currentSemester: '1' | '2';
  onSemesterChange: (sem: '1' | '2') => void;
  teacherInfo?: { name: string; school: string; subject: string; governorate: string };
}

const DEFAULT_GRADING_SETTINGS = {
  totalScore: 100,
  finalExamWeight: 40,
  finalExamName: 'الامتحان النهائي'
};

const GradeBook: React.FC<GradeBookProps> = ({ 
  students = [], 
  classes = [], 
  onUpdateStudent, 
  setStudents, 
  currentSemester, 
  onSemesterChange, 
  teacherInfo 
}) => {
  // === 🧠 العقل والمنطق البرمجي (لم يتم المساس به) 🧠 ===
  const { assessmentTools, setAssessmentTools, t, dir } = useApp();
  const tools = useMemo(() => Array.isArray(assessmentTools) ? assessmentTools : [], [assessmentTools]);

  const [gradingSettings, setGradingSettings] = useState(() => {
    const saved = localStorage.getItem('rased_grading_settings');
    return saved ? JSON.parse(saved) : DEFAULT_GRADING_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('rased_grading_settings', JSON.stringify(gradingSettings));
  }, [gradingSettings]);

  const [selectedGrade, setSelectedGrade] = useState<string>(() => sessionStorage.getItem('rased_grade') || 'all');
  const [selectedClass, setSelectedClass] = useState<string>(() => sessionStorage.getItem('rased_class') || 'all');

  useEffect(() => {
      sessionStorage.setItem('rased_grade', selectedGrade);
      sessionStorage.setItem('rased_class', selectedClass);
  }, [selectedGrade, selectedClass]);

  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showToolsManager, setShowToolsManager] = useState(false);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [editToolName, setEditToolName] = useState('');
  const [showDistModal, setShowDistModal] = useState(false);
  
  const [distTotal, setDistTotal] = useState<number>(gradingSettings.totalScore || 100);
  const [distFinalScore, setDistFinalScore] = useState<number>(gradingSettings.finalExamWeight || 40);
  
  const finalExamNameRaw = gradingSettings.finalExamName || 'الامتحان النهائي';
  const isDefaultExamName = finalExamNameRaw === 'الامتحان النهائي' || finalExamNameRaw === 'Final Exam';
  const defaultFinalExamNameTranslated = isDefaultExamName ? t('finalExamNameDefault') : finalExamNameRaw;
  const [distFinalName, setDistFinalName] = useState<string>(defaultFinalExamNameTranslated);
  
  const [bulkFillTool, setBulkFillTool] = useState<AssessmentTool | null>(null);
  const [bulkScore, setBulkScore] = useState('');
  const [activeToolId, setActiveToolId] = useState<string>('');

  useEffect(() => {
    if (tools.length > 0 && !activeToolId) {
      setActiveToolId(tools[0].id);
    }
  }, [tools, activeToolId]);

  const cleanText = (text: string) => text ? String(text).trim() : '';
  const normalizeText = (text: string) => text ? String(text).trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ـ]/g, '') : '';
  
  const extractNumericScore = (val: any): number | null => {
    if (val === undefined || val === null || val === '') return null;
    const strVal = String(val).trim();
    const cleanNum = strVal.replace(/[^0-9.]/g, '');
    const num = Number(cleanNum);
    return isNaN(num) || cleanNum === '' ? null : num;
  };

  const getGradeSymbol = (score: number) => {
    const percentage = (score / gradingSettings.totalScore) * 100;
    if (dir === 'rtl') {
        if (percentage >= 90) return 'أ';
        if (percentage >= 80) return 'ب';
        if (percentage >= 65) return 'ج';
        if (percentage >= 50) return 'د';
        return 'هـ';
    } else {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 65) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    }
  };

  const getSymbolColor = (score: number) => {
    const percentage = (score / gradingSettings.totalScore) * 100;
    if (percentage >= 90) return 'text-emerald-600 bg-emerald-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    if (percentage >= 65) return 'text-amber-600 bg-amber-50';
    if (percentage >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-rose-600 bg-rose-50';
  };

  const getSemesterGrades = (student: Student, sem: '1' | '2') => {
    return (student.grades || []).filter(g => (g.semester || '1') === sem);
  };

  const availableGrades = useMemo(() => {
    const grades = new Set<string>();
    students.forEach(s => {
      if (s.grade) grades.add(s.grade);
      else if (s.classes[0]) {
        const match = s.classes[0].match(/^(\d+)/);
        if (match) grades.add(match[1]);
      }
    });
    return Array.from(grades).sort((a, b) => parseInt(a) - parseInt(b));
  }, [students]);

  const visibleClasses = useMemo(() => {
    if (selectedGrade === 'all') return classes;
    return classes.filter(c => c.startsWith(selectedGrade));
  }, [classes, selectedGrade]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = selectedClass === 'all' || s.classes.includes(selectedClass);
      let matchesGrade = true;
      if (selectedGrade !== 'all') {
        matchesGrade = s.grade === selectedGrade || (s.classes[0] && s.classes[0].startsWith(selectedGrade));
      }
      return matchesClass && matchesGrade;
    });
  }, [students, selectedClass, selectedGrade]);

  const handleDownloadTemplate = async () => {
    try {
      const headers = [t('nameLabel'), t('classLabelTemplate').replace(':', ''), ...tools.map(t => t.name)];
      const sampleRow: any = { [t('nameLabel')]: t('sampleStudentName'), [t('classLabelTemplate').replace(':', '')]: t('sampleClass') };
      tools.forEach(t => sampleRow[t.name] = '10');
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
      ws['!cols'] = [{ wch: 25 }, { wch: 10 }, ...tools.map(() => ({ wch: 15 }))];

      XLSX.utils.book_append_sheet(wb, ws, t('gradingTemplateSheetName'));
      const fileName = `Rased_Template.xlsx`;

      if (Capacitor.isNativePlatform()) {
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        const result = await Filesystem.writeFile({ path: fileName, data: wbout, directory: Directory.Cache });
        await Share.share({ title: t('gradingTemplateTitle'), url: result.uri });
      } else {
        XLSX.writeFile(wb, fileName);
      }
      setShowMenu(false);
    } catch (e) {
      alert(t('errorDownloadingTemplate'));
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' }) as any[];
      
      if (jsonData.length === 0) throw new Error(t('errorEmptyFile'));

      const headers = Object.keys(jsonData[0]);
      const nameKeywords = ['الاسم', 'اسم الطالب', 'name', 'student'];
      const nameKey = headers.find(h => nameKeywords.some(kw => normalizeText(h).includes(normalizeText(kw)))) || headers[0];

      const potentialTools = headers.filter(h => {
        const lowerH = normalizeText(h);
        if (h === nameKey) return false;
        if (lowerH.startsWith('__empty')) return false; 
        if (!cleanText(h)) return false; 
        const excludedPartial = ['مجموع', 'total', 'تقدير', 'نتيجة', 'rank', 'م'];
        if (excludedPartial.some(ex => lowerH.includes(ex))) return false;
        return true;
      });

      let updatedTools = [...tools];
      potentialTools.forEach(h => {
        const cleanH = cleanText(h);
        if (cleanH && !updatedTools.some(t => t.name === cleanH)) {
          updatedTools.push({ id: Math.random().toString(36).substr(2, 9), name: cleanH, maxScore: 0 });
        }
      });
      setAssessmentTools(updatedTools);

      let updatedCount = 0;
      setStudents(prev => prev.map(s => {
          const row = jsonData.find((r: any) => normalizeText(String(r[nameKey] || '').trim()) === normalizeText(s.name));
          if (!row) return s;
          
          updatedCount++;
          let newGrades = [...(s.grades || [])];
          
          potentialTools.forEach(headerStr => {
            const val = extractNumericScore(row[headerStr]);
            if (val !== null) {
              const toolName = cleanText(headerStr);
              newGrades = newGrades.filter(g => !(g.category.trim() === toolName.trim() && (g.semester || '1') === currentSemester));
              newGrades.unshift({
                id: Math.random().toString(36).substr(2, 9),
                subject: teacherInfo?.subject || t('generalSubject'),
                category: toolName, 
                score: val, 
                maxScore: 0, 
                date: new Date().toISOString(), 
                semester: currentSemester
              });
            }
          });
          return { ...s, grades: newGrades };
        })
      );
      
      alert(`${t('alertGradesImported1')} ${updatedCount} ${t('alertGradesImported2')}`);
      setShowMenu(false);
    } catch (error: any) { 
      alert(`${t('importErrorMsg')}: ` + error.message); 
    } finally { 
      setIsImporting(false); 
      if (e.target) e.target.value = ''; 
    }
  };

  const handleExportExcel = async () => {
    if (filteredStudents.length === 0) return alert(t('noStudentsToExport'));
    setIsExporting(true);
    
    try {
      const data = filteredStudents.map(student => {
        const row: any = { [t('nameLabel')]: student.name, [t('classLabelTemplate').replace(':', '')]: student.classes[0] || '' };
        const semGrades = getSemesterGrades(student, currentSemester);
        let total = 0;
        
        tools.forEach(tool => {
          const g = semGrades.find(grade => grade.category.trim() === tool.name.trim());
          row[tool.name] = g ? g.score : '';
          total += g ? Number(g.score) : 0;
        });
        
        row[t('excelTotal')] = total;
        row[t('excelGrade')] = getGradeSymbol(total);
        return row;
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, t('gradesSheetName'));
      
      const fileName = `Grades_Report_${currentSemester}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;
      
      if (Capacitor.isNativePlatform()) {
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        const result = await Filesystem.writeFile({ 
            path: fileName, 
            data: wbout, 
            directory: Directory.Cache 
        });
        await Share.share({ title: t('gradesReportTitle'), url: result.uri });
      } else { 
        XLSX.writeFile(wb, fileName); 
      }
      setShowMenu(false);
    } catch (e) {
        alert(t('exportError'));
    } finally { 
        setIsExporting(false); 
    }
  };

  const handleGradeChange = (studentId: string, value: string) => {
    if (!activeToolId) return alert(t('alertSelectToolFirst'));
    const activeTool = tools.find(t => t.id === activeToolId);
    if (!activeTool) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const numValue = value === '' ? null : Number(value);
    let updatedGrades = (student.grades || []).filter(
      g => !(g.category.trim() === activeTool.name.trim() && (g.semester || '1') === currentSemester)
    );

    if (numValue !== null) {
      updatedGrades.push({
        id: Math.random().toString(36).substr(2, 9),
        subject: teacherInfo?.subject || t('subjectFallback'),
        category: activeTool.name,
        score: numValue,
        maxScore: activeTool.maxScore || 0,
        date: new Date().toISOString(),
        semester: currentSemester
      });
    }
    onUpdateStudent({ ...student, grades: updatedGrades });
  };

  const getStudentGradeForActiveTool = (student: Student) => {
    if (!activeToolId) return '';
    const activeTool = tools.find(t => t.id === activeToolId);
    if (!activeTool) return '';
    const grade = (student.grades || []).find(
      g => g.category.trim() === activeTool.name.trim() && (g.semester || '1') === currentSemester
    );
    return grade ? grade.score.toString() : '';
  };

  const handleCopyContinuousTotal = () => {
    const gradesList = filteredStudents.map(student => {
        const semGrades = getSemesterGrades(student, currentSemester);
        let continuousTotal = 0;
        let hasAnyGrade = false;
        
        tools.forEach(tool => {
            if (!tool.isFinal) { 
                const g = semGrades.find(grade => grade.category.trim() === tool.name.trim());
                if (g && g.score !== null && g.score !== undefined && g.score !== '') {
                    continuousTotal += Number(g.score);
                    hasAnyGrade = true;
                }
            }
        });
        
        return hasAnyGrade ? continuousTotal.toString() : ''; 
    });
    
    const textToCopy = gradesList.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert(t('alertContinuousTotalCopied'));
    }).catch(() => alert(t('alertCopyError')));
  };

  const handleAddTool = () => {
    if (newToolName.trim()) {
      if (tools.some(t => t.name === newToolName.trim())) return alert(t('alertToolExists'));
      const newTool: AssessmentTool = { id: Math.random().toString(36).substr(2, 9), name: newToolName.trim(), maxScore: 0 };
      setAssessmentTools([...tools, newTool]);
      setNewToolName('');
      setIsAddingTool(false);
      setActiveToolId(newTool.id);
    }
  };

  const handleDeleteTool = (id: string) => {
    if (confirm(t('confirmDeleteTool'))) {
      setAssessmentTools(tools.filter(t => t.id !== id));
      if (activeToolId === id) setActiveToolId('');
    }
  };

  const handleSaveDistribution = () => {
    const newSettings = { totalScore: distTotal, finalExamWeight: distFinalScore, finalExamName: distFinalName };
    setGradingSettings(newSettings);
    
    let newTools = [...tools];
    let finalToolIndex = newTools.findIndex(t => t.isFinal === true);
    if (finalToolIndex === -1) finalToolIndex = newTools.findIndex(t => t.name.trim() === distFinalName.trim());
    
    if (finalToolIndex !== -1) {
      newTools[finalToolIndex] = { ...newTools[finalToolIndex], name: distFinalName, maxScore: distFinalScore, isFinal: true };
    } else {
      newTools.push({ id: Math.random().toString(36).substr(2, 9), name: distFinalName, maxScore: distFinalScore, isFinal: true });
    }
    
    setAssessmentTools(newTools);
    setShowDistModal(false);
    alert(t('alertDistributionSaved'));
  };

  const handleBulkFill = () => {
    if (!bulkFillTool || bulkScore === '') return;
    const numericScore = parseFloat(bulkScore);
    const visibleIds = new Set(filteredStudents.map(s => s.id));
    
    setStudents(prev => prev.map(student => {
        if (!visibleIds.has(student.id)) return student;
        const keptGrades = (student.grades || []).filter(g => !(g.category.trim() === bulkFillTool.name.trim() && (g.semester || '1') === currentSemester));
        const newGrade: GradeRecord = { 
          id: Math.random().toString(36), 
          subject: teacherInfo?.subject || t('subjectFallback'), 
          category: bulkFillTool.name, 
          score: numericScore, 
          maxScore: bulkFillTool.maxScore || 0, 
          date: new Date().toISOString(), 
          semester: currentSemester 
        };
        return { ...student, grades: [newGrade, ...keptGrades] };
    }));
    setBulkFillTool(null);
    setBulkScore('');
  };

  const handleClearGrades = () => {
    if (confirm(`${t('confirmClearGradesWarning1')} ${currentSemester}${t('confirmClearGradesWarning2')}`)) {
      setStudents(prev => prev.map(s => ({
          ...s,
          grades: (s.grades || []).filter(g => (g.semester || '1') !== currentSemester)
      })));
      setShowMenu(false);
    }
  };

  // === 🎨 الجسد (التصميم الجديد واللوحات المنزلقة) 🎨 ===
  // CSS للوحات المنسدلة الذكية (Responsive Drawers)
  const baseDrawerClasses = `fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl`;
  const bottomSheetClasses = `bottom-0 left-0 w-full h-[90vh] rounded-t-[2.5rem]`;
  const sidePanelClasses = `md:h-full md:w-[450px] md:top-0 md:rounded-none md:bottom-auto ${dir === 'rtl' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'}`;

  return (
   <div className={`flex flex-col h-full pb-24 md:pb-8 overflow-hidden relative bg-slate-50 text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
            
      <header className="shrink-0 z-40 px-5 pt-[env(safe-area-inset-top)] w-full transition-all duration-300 bg-white border-b border-slate-100 shadow-sm pb-4" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex justify-between items-center mt-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-[1.2rem] text-blue-600 shadow-sm border border-slate-100">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">{t('gradeBookTitle')}</h1>
              <p className="text-[11px] font-bold text-slate-500 mt-1">{filteredStudents.length} {t('registeredStudents')}</p>
            </div>
          </div>
          
          <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button onClick={() => setShowToolsManager(true)} className="p-3 rounded-[1.2rem] border active:scale-95 transition-all bg-white border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm" title={t('manageTools')}>
              <Settings className="w-5 h-5" />
            </button>
            <div className="relative z-[90]">
              <button onClick={() => setShowMenu(!showMenu)} className={`p-3 rounded-[1.2rem] border active:scale-95 transition-all shadow-sm ${showMenu ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <SlidersHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                  <div className={`absolute ${dir === 'rtl' ? 'left-0' : 'right-0'} top-full mt-3 w-64 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50 animate-in zoom-in-95 origin-top-left bg-white text-slate-700`}>
                    <button onClick={() => { setShowDistModal(true); setShowMenu(false); }} className={`flex items-center gap-3 px-5 py-4 transition-colors w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} border-b border-slate-50 hover:bg-slate-50`}>
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><PieChart size={16} /></div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-slate-800">{t('gradeDistributionSettings')}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">{t('setFinalGradeAndWeight')}</span>
                      </div>
                    </button>
                    <button onClick={handleDownloadTemplate} className={`flex items-center gap-3 px-5 py-4 transition-colors w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} border-b border-slate-50 hover:bg-slate-50`}>
                      <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><FileSpreadsheet size={16} /></div>
                      <span className="text-sm font-bold text-slate-700">{t('downloadEmptyTemplate')}</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-3 px-5 py-4 transition-colors w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} hover:bg-slate-50`}>
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp size={16} />}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{t('importFromExcel')}</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
                    <button onClick={handleExportExcel} disabled={isExporting} className={`flex items-center gap-3 px-5 py-4 transition-colors w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} hover:bg-slate-50`}>
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown size={16} />}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{t('exportReport')}</span>
                    </button>
                    <button onClick={handleClearGrades} className={`flex items-center gap-3 px-5 py-4 transition-colors w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} border-t border-slate-50 hover:bg-rose-50 text-rose-600`}>
                      <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><Trash2 size={16} /></div>
                      <span className="text-sm font-bold">{t('resetSemesterGrades')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 relative z-50 w-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* فلتر الفصول والمراحل */}
          <div className="flex gap-4">
            <div className="flex flex-1 overflow-x-auto gap-2 pb-1 custom-scrollbar w-full">
              <button onClick={() => { setSelectedGrade('all'); setSelectedClass('all'); }} className={`shrink-0 px-5 py-2.5 text-[11px] font-bold whitespace-nowrap transition-all rounded-xl border ${selectedGrade === 'all' ? 'bg-blue-600 text-white shadow-md border-transparent' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>{t('allGradesList')}</button>
              {availableGrades.map(g => (
                <button key={g} onClick={() => { setSelectedGrade(g); setSelectedClass('all'); }} className={`shrink-0 px-5 py-2.5 text-[11px] font-bold whitespace-nowrap transition-all rounded-xl border ${selectedGrade === g ? 'bg-blue-600 text-white shadow-md border-transparent' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>{t('gradePrefix')} {g}</button>
              ))}
            </div>
            <div className="flex flex-1 overflow-x-auto gap-2 pb-1 custom-scrollbar w-full">
              <button onClick={() => setSelectedClass('all')} className={`shrink-0 px-5 py-2.5 text-[11px] font-bold whitespace-nowrap transition-all rounded-xl border ${selectedClass === 'all' ? 'bg-blue-600 text-white shadow-md border-transparent' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>{t('all')}</button>
              {visibleClasses.map(c => (
                <button key={c} onClick={() => setSelectedClass(c)} className={`shrink-0 px-5 py-2.5 text-[11px] font-bold whitespace-nowrap transition-all rounded-xl border ${selectedClass === c ? 'bg-blue-600 text-white shadow-md border-transparent' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>{c}</button>
              ))}
            </div>
          </div>
          
          {/* شريط أدوات التقييم (Tools) */}
          <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar w-full pt-1">
            {tools.map(tool => (
                <button key={tool.id} onClick={() => setActiveToolId(tool.id)} className={`shrink-0 px-5 py-3 rounded-[1rem] text-[11px] font-black whitespace-nowrap border flex items-center gap-2 active:scale-95 transition-all shadow-sm ${activeToolId === tool.id ? 'bg-indigo-600 text-white border-transparent scale-[1.02] shadow-indigo-600/20' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'} ${tool.isFinal && activeToolId !== tool.id ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                  {activeToolId === tool.id && <Check className="w-4 h-4" strokeWidth={3} />}
                  {tool.isFinal && <span className={activeToolId === tool.id ? "text-amber-300" : "text-amber-500"}>★</span>}
                  {tool.name}
                </button>
            ))}
          </div>

          {/* أزرار الإجراءات السريعة (نسخ / تعبئة) */}
          <div className="flex gap-3 pt-2">
            {tools.length > 0 && (
              <button onClick={handleCopyContinuousTotal} className="flex-1 py-3 px-2 text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-colors hover:bg-indigo-100" title={t('copyContinuousTotalTitle')}>
                <Copy size={16} /> {t('continuousAssessment')}
              </button>
            )}

            {activeToolId && (
              <>
                <button onClick={() => {
                    const tool = tools.find(t => t.id === activeToolId);
                    if (!tool) return;
                    const gradesList = filteredStudents.map(student => {
                      const grade = getStudentGradeForActiveTool(student);
                      return grade !== '' ? grade : ''; 
                    });
                    const textToCopy = gradesList.join('\n');
                    navigator.clipboard.writeText(textToCopy).then(() => {
                      alert(`${t('alertToolCopied1')}${tool.name}${t('alertToolCopied2')}`);
                    }).catch(() => alert(t('alertCopyError')));
                  }} 
                  className="flex-1 py-3 px-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-colors hover:bg-emerald-100"
                >
                  <Copy size={16} /> {t('copyTool')}
                </button>

                <button onClick={() => setBulkFillTool(tools.find(t => t.id === activeToolId) || null)} className="flex-1 py-3 px-2 text-blue-700 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-colors hover:bg-blue-100">
                  <Wand2 size={16} /> {t('bulkFill')}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* منطقة إدخال الدرجات */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28 custom-scrollbar relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredStudents.map(student => {
            const currentGrade = getStudentGradeForActiveTool(student);
            const semGrades = getSemesterGrades(student, currentSemester);
            const totalScore = semGrades.reduce((acc, curr) => acc + (curr.score || 0), 0);
            const symbolColor = getSymbolColor(totalScore);

            return (
              <div key={student.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-200 flex flex-col items-center relative transition-all hover:shadow-md hover:border-indigo-200 group">
                <StudentAvatar gender={student.gender} className="w-14 h-14 mb-3 border border-slate-100 shadow-sm group-hover:scale-105 transition-transform" />
                
                <h3 className="font-black text-xs text-center line-clamp-1 w-full text-slate-800 mb-3" title={student.name}>
                  {student.name}
                </h3>
                
                <div className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('excelTotal')}</span>
                        <span className={`text-sm font-black ${symbolColor.split(' ')[0]}`}>{totalScore}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('excelGrade')}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${symbolColor}`}>{getGradeSymbol(totalScore)}</span>
                    </div>
                </div>
                
                <div className="w-full relative mt-auto">
                    <input 
                        type="tel" 
                        maxLength={3} 
                        value={currentGrade} 
                        onChange={e => handleGradeChange(student.id, e.target.value)} 
                        placeholder="-" 
                        className="w-full h-12 rounded-[1rem] text-center font-black text-lg outline-none border-2 transition-all bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10" 
                    />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          اللوحات المنسدلة الذكية (Drawers)
      ========================================================= */}

      {/* ⚙️ 1. لوحة إدارة أدوات التقييم (Tools Manager) */}
      <>
        <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${showToolsManager ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => { setShowToolsManager(false); setIsAddingTool(false); }} />
        <div className={`${baseDrawerClasses} ${bottomSheetClasses} ${sidePanelClasses} ${showToolsManager ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'}`}>
          <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
          <div className="flex justify-between items-center px-6 pt-10 pb-5 md:pt-14 border-b border-slate-100 shrink-0">
            <h3 className="font-black text-xl text-slate-800">{t('assessmentToolsTitle')}</h3>
            <button onClick={() => { setShowToolsManager(false); setIsAddingTool(false); }} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={18} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {!isAddingTool ? (
              <>
                <button onClick={() => setIsAddingTool(true)} className="w-full py-4 mb-4 rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus size={18} strokeWidth={3} /> {t('addNewTool')}
                </button>
                
                <div className="space-y-3">
                  {tools.length > 0 ? (
                    tools.map(tool => (
                      <div key={tool.id} className="flex items-center justify-between p-4 rounded-2xl border shadow-sm group transition-colors bg-white border-slate-200 hover:border-indigo-200">
                        <div className="flex items-center gap-3">
                          {tool.isFinal && <span className="text-[10px] px-2 py-1 rounded-lg font-black bg-amber-100 text-amber-700">★ {t('final')}</span>}
                          <span className="text-sm font-black text-slate-700">{tool.name}</span>
                        </div>
                        {!tool.isFinal && (
                          <button onClick={() => handleDeleteTool(tool.id)} className="p-2.5 rounded-xl transition-colors bg-rose-50 text-rose-500 hover:bg-rose-100">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : <p className="text-sm text-center py-10 font-bold text-slate-400">{t('noToolsAdded')}</p>}
                </div>
              </>
            ) : (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-indigo-50 text-indigo-600"><Plus size={32} /></div>
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">{t('toolNamePlaceholder')}</label>
                <input autoFocus placeholder={t('toolNamePlaceholder')} value={newToolName} onChange={e => setNewToolName(e.target.value)} className="w-full p-4 rounded-2xl mb-6 font-bold text-sm outline-none border transition-colors bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800" />
                <div className="flex gap-3">
                  <button onClick={() => setIsAddingTool(false)} className="flex-1 py-4 font-black text-sm rounded-2xl transition-colors bg-slate-100 text-slate-500 hover:bg-slate-200">{t('closeBtn') || 'إلغاء'}</button>
                  <button onClick={handleAddTool} className="flex-[2] py-4 font-black text-sm rounded-2xl shadow-lg transition-colors bg-indigo-600 hover:bg-indigo-700 text-white">{t('saveTool')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>

      {/* 📊 2. لوحة توزيع الدرجات (Grade Distribution) */}
      <>
        <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${showDistModal ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setShowDistModal(false)} />
        <div className={`${baseDrawerClasses} ${bottomSheetClasses} ${sidePanelClasses} ${showDistModal ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'}`}>
          <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
          <div className="flex justify-between items-center px-6 pt-10 pb-5 md:pt-14 border-b border-slate-100 shrink-0">
            <h3 className="font-black text-xl text-slate-800">{t('gradeDistributionSettings')}</h3>
            <button onClick={() => setShowDistModal(false)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={18} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            <div className="p-5 rounded-3xl border bg-slate-50 border-slate-200">
              <label className="block text-xs font-black mb-3 text-slate-600">{t('totalSubjectScoreLabel')}</label>
              <input type="number" value={distTotal} onChange={e => setDistTotal(Number(e.target.value))} className="w-full p-4 rounded-2xl text-center font-black text-xl outline-none transition-colors bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-indigo-700" />
            </div>

            <div className="p-5 rounded-3xl border bg-slate-50 border-slate-200">
              <label className="block text-xs font-black mb-3 text-slate-600">{t('finalExamScoreLabel')}</label>
              <input type="number" value={distFinalScore} onChange={e => setDistFinalScore(Number(e.target.value))} className="w-full p-4 rounded-2xl text-center font-black text-xl outline-none transition-colors bg-white border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-amber-600" />
              <p className="text-[10px] mt-3 font-bold text-slate-400 bg-slate-100 p-2 rounded-lg text-center">{t('finalExamNote')}</p>
            </div>

            <div className="p-5 rounded-3xl border bg-slate-50 border-slate-200">
              <label className="block text-xs font-black mb-3 text-slate-600">{t('finalExamNameLabel')}</label>
              <input type="text" value={distFinalName} onChange={e => setDistFinalName(e.target.value)} className="w-full p-4 rounded-2xl text-center font-bold text-sm outline-none transition-colors bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800" placeholder={t('finalExamNameExample')} />
            </div>

            <div className="flex items-center justify-between p-5 rounded-3xl border bg-blue-50 border-blue-100 shadow-sm">
              <div className="text-center flex-1">
                <span className="block text-[10px] font-black mb-1.5 text-blue-500 uppercase tracking-widest">{t('continuousAssessment')}</span>
                <span className="text-2xl font-black text-blue-800">{distTotal - distFinalScore}</span>
              </div>
              <div className="text-2xl font-black mx-2 text-blue-200">+</div>
              <div className="text-center flex-1">
                <span className="block text-[10px] font-black mb-1.5 text-amber-500 uppercase tracking-widest">{t('final')}</span>
                <span className="text-2xl font-black text-amber-600">{distFinalScore}</span>
              </div>
              <div className="text-2xl font-black mx-2 text-blue-200">=</div>
              <div className="text-center flex-1">
                <span className="block text-[10px] font-black mb-1.5 text-emerald-500 uppercase tracking-widest">المجموع</span>
                <span className="text-3xl font-black text-emerald-600">{distTotal}</span>
              </div>
            </div>

          </div>
          <div className="p-6 border-t border-slate-100 bg-white shrink-0">
            <button onClick={handleSaveDistribution} className="w-full py-4 rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 transition-all">{t('saveDistribution')}</button>
          </div>
        </div>
      </>

      {/* 🪄 3. لوحة التعبئة السريعة (Bulk Fill) */}
      <>
        <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${!!bulkFillTool ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => { setBulkFillTool(null); setBulkScore(''); }} />
        <div className={`fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl 
            ${!!bulkFillTool ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-[150%] md:translate-y-0 md:opacity-0 md:scale-95 invisible pointer-events-none'} 
            bottom-0 left-0 w-full rounded-t-[2.5rem] 
            md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto md:w-[400px] md:h-auto md:rounded-[2.5rem]`}>
            
            <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
            
            <button onClick={() => { setBulkFillTool(null); setBulkScore(''); }} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-colors hidden md:block">
                <X size={18} />
            </button>

            {bulkFillTool && (
                <div className="p-8 text-center pt-10 md:pt-12">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-indigo-50 text-indigo-500 shadow-inner">
                        <Wand2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-black text-2xl mb-2 text-slate-800">{t('bulkFill')}</h3>
                    <p className="text-sm font-bold mb-6 inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {bulkFillTool.name}
                    </p>
                    
                    <div className="mb-6 relative">
                        <input 
                            type="number" 
                            autoFocus 
                            placeholder={t('score')} 
                            className="w-full rounded-[1.5rem] p-4 text-center text-2xl font-black outline-none border-2 transition-colors bg-slate-50 border-slate-200 focus:border-indigo-500 text-indigo-700 focus:bg-white placeholder:text-slate-300" 
                            value={bulkScore} 
                            onChange={e => setBulkScore(e.target.value)} 
                        />
                    </div>
                    
                    <button onClick={handleBulkFill} disabled={bulkScore === ''} className="w-full py-4 rounded-[1.2rem] font-black text-sm shadow-lg shadow-indigo-500/30 active:scale-95 transition-all bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:active:scale-100">
                        {t('applyBulkFill')}
                    </button>
                </div>
            )}
        </div>
      </>

    </div>
  );
};

export default GradeBook;