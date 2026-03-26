import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckSquare, Plus, Trash2, 
  BookOpen, Users, Check 
} from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  subject: string;
  targetClass: string;
  createdAt: string;
}

interface TeacherTasksProps {
  students: any[]; 
  teacherSubject: string; 
}

// ✅ أيقونة 3D فخمة للوضع الفاتح مخصصة للمهام
const Icon3DTasks = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <defs>
      <linearGradient id="gradTask" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4f46e5" />
        <stop offset="100%" stopColor="#3730a3" />
      </linearGradient>
      <filter id="glowTask"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect x="20" y="20" width="60" height="65" rx="8" fill="url(#gradTask)" filter="url(#glowTask)" />
    <rect x="35" y="35" width="30" height="5" rx="2" fill="white" opacity="0.9" />
    <rect x="35" y="50" width="30" height="5" rx="2" fill="white" opacity="0.9" />
    <rect x="35" y="65" width="15" height="5" rx="2" fill="white" opacity="0.9" />
    <path d="M25 32 L30 38 L45 25" fill="none" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M25 47 L30 53 L45 40" fill="none" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TeacherTasks: React.FC<TeacherTasksProps> = ({ teacherSubject }) => {
  // 🌍 استدعاء محرك الترجمة (t) مع الاتجاه (dir) والفصول
  const { t, dir, classes } = useApp(); 

  const safeClasses = Array.isArray(classes) ? classes : [];

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('rased_teacher_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // 🧠 حالة التحديد المتعدد للفصول
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('rased_teacher_tasks', JSON.stringify(tasks));
  }, [tasks]);

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
    if (selectedClasses.length === safeClasses.length) {
      setSelectedClasses([]); // إلغاء الكل
    } else {
      setSelectedClasses([...safeClasses]); // تحديد الكل
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    // التحقق من اختيار فصل واحد على الأقل
    if (selectedClasses.length === 0) {
        alert(t('alertSelectOneClass') || 'الرجاء اختيار فصل واحد على الأقل.');
        return;
    }

    // 🧠 دمج الفصول المحددة (أو كتابة "الكل" إذا تم تحديد جميع الفصول)
    const finalTargetClass = selectedClasses.length === safeClasses.length 
        ? (t('allClasses') || 'الكل') 
        : selectedClasses.join(' , ');

    const newTask: Task = {
      id: `T-${Date.now()}`,
      title: newTaskTitle.trim(),
      subject: teacherSubject || t('unspecified') || 'عام',
      targetClass: finalTargetClass,
      createdAt: new Date().toISOString()
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle(''); 
    setSelectedClasses([]); // تصفير التحديد بعد الإرسال
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm(t('confirmDeleteTask') || 'هل أنت متأكد من حذف هذه المهمة؟')) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-500 relative z-10 font-sans bg-slate-50 text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
      
      {/* ================= 🩺 الهيدر المشرق ================= */}
      <header 
        className="shrink-0 z-40 px-5 pt-[env(safe-area-inset-top)] w-full transition-all duration-300 bg-white border-b border-slate-100 shadow-sm pb-4"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-4 max-w-4xl mx-auto w-full mt-4 mb-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="bg-indigo-50 p-2.5 rounded-[1.2rem] shadow-sm border border-indigo-100">
              <Icon3DTasks />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">
                {t('tasksTitle') || 'المهام والواجبات'}
              </h1>
              <p className="text-[11px] font-bold text-slate-500 mt-1">
                {t('tasksSubtitle') || 'أرسل الواجبات لطلابك بسرعة بضغطة زر 🚀'}
              </p>
            </div>
        </div>
      </header>

      {/* ================= 📝 محتوى الصفحة ================= */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28 custom-scrollbar relative z-10">
        <div className="max-w-3xl mx-auto w-full space-y-8">
          
          {/* بطاقة إضافة مهمة جديدة */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm relative overflow-hidden">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800">
              <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500"><Plus size={20} strokeWidth={3} /></div>
              {t('addNewTask') || 'إضافة مهمة جديدة'}
            </h2>
            
            <form onSubmit={handleAddTask} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-1">
                  {t('taskTitleLabel') || 'عنوان المهمة / الواجب'}
                </label>
                <div className="relative">
                  <BookOpen className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
                  <input 
                    required 
                    type="text" 
                    placeholder={t('taskTitlePlaceholder') || 'مثال: حل أسئلة الفصل الأول صفحة 45...'} 
                    value={newTaskTitle} 
                    onChange={e => setNewTaskTitle(e.target.value)} 
                    className={`w-full text-sm font-bold py-4 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} rounded-2xl outline-none border transition-all bg-slate-50 text-slate-800 border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400`} 
                  />
                </div>
              </div>

              {/* منطقة التحديد المتعدد للفصول (كبسولات ذكية) */}
              <div className="space-y-3 bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                <div className="flex justify-between items-center px-1 border-b border-slate-200/60 pb-3 mb-2">
                  <label className="text-xs font-black text-slate-500">
                    {t('targetClassLabel') || 'الفصول المستهدفة:'}
                  </label>
                  <button 
                    type="button" 
                    onClick={toggleAllClasses}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100"
                  >
                    {selectedClasses.length === safeClasses.length ? (t('deselectAll') || 'إلغاء الكل') : (t('selectAll') || 'تحديد الكل')}
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {safeClasses.map((c, i) => {
                    const isSelected = selectedClasses.includes(c);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleClass(c)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-[1rem] text-xs font-bold border transition-all active:scale-95 ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105' 
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

              <button 
                type="submit" 
                disabled={selectedClasses.length === 0 || !newTaskTitle.trim()}
                className="w-full py-4 mt-4 rounded-2xl text-sm font-black shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Plus size={20} strokeWidth={3} /> {t('sendTaskBtn') || 'إضافة المهمة'}
              </button>
            </form>
          </div>

          {/* قائمة المهام النشطة */}
          <div className="mt-10">
            <h3 className="text-lg font-black mb-6 text-slate-800 flex items-center gap-2">
              <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
              {t('activeTasks') || 'المهام النشطة'} <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full ml-2">({tasks.length})</span>
            </h3>
            
            {tasks.length === 0 ? (
              <div className="p-10 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                   <CheckSquare size={32} className="text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-500">
                  {t('noTasksAdded') || 'لا توجد مهام حالياً. أضف مهمة لطلابك لتصلهم في المزامنة!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task.id} className="p-5 rounded-2xl border border-slate-200 flex flex-col gap-3 transition-all bg-white hover:shadow-md hover:border-indigo-200 group">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm md:text-base font-black leading-snug text-slate-800 pr-4">{task.title}</h4>
                      <button onClick={() => handleDeleteTask(task.id)} className="p-2.5 rounded-xl transition-colors shrink-0 bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100 opacity-80 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2 pt-3 border-t border-slate-100/60">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border bg-indigo-50 border-indigo-100 text-indigo-700">
                        <Users size={12} strokeWidth={2.5} /> {t('targetPrefix') || 'مستهدف'}: {task.targetClass}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default TeacherTasks;