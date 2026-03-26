import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CloudSync, Users, GraduationCap, CloudUpload, CloudDownload,
  CheckCircle2, X, AlertCircle, Loader2, Server, Smartphone
} from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const STUDENT_APP_URL = "https://script.google.com/macros/s/AKfycbwMYqSpnXvlMrL6po82-XePyAWBd9FMNCTgY7WlYaOH6pn1kTazLqxEfvremqsSk_dU/exec";
const PARENT_APP_URL = "https://script.google.com/macros/s/AKfycbzKPPsQsM_dIttcYSxRLs6LQuvXhT6Qia5TwJ1Tw4ObQ-eZFZeJhV6epXXjxA9_SwWk/exec";
const DEVICE_SYNC_URL = "https://script.google.com/macros/s/AKfycbxXUII_Q_6K6TuewJ0k44mi8mCB-6LQNbDo9rhVdaVOvYCyKFRNCBuddLe_PyLorCdT/exec";

// ✅ أيقونة 3D فخمة لمركز المزامنة
const Icon3DSync = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14">
    <defs>
      <linearGradient id="gradSync" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <filter id="glowSync"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <circle cx="50" cy="50" r="30" fill="url(#gradSync)" filter="url(#glowSync)" />
    <path d="M35 50 A 15 15 0 0 1 65 50" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <path d="M35 50 A 15 15 0 0 0 65 50" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 4" />
    <polygon points="65,45 70,55 60,55" fill="white" />
    <polygon points="35,55 30,45 40,45" fill="white" />
  </svg>
);

const GlobalSyncManager: React.FC = () => {
  const { 
    students, setStudents, classes, setClasses, 
    teacherInfo, setTeacherInfo, schedule, setSchedule, 
    periodTimes, setPeriodTimes, dir, t,
    groups = [], assessmentTools = [], categorizations = [], 
    gradeSettings = {}, certificateSettings = {}, hiddenClasses = [], setAssessmentTools
  } = useApp();
  
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const handleSync = async (type: 'student' | 'parent' | 'backup' | 'restore') => {
    
    if ((type === 'backup' || type === 'restore') && !teacherInfo?.civilId) {
      alert(t('alertEnterCivilId') || 'الرجاء إدخال الرقم المدني في الإعدادات أولاً!');
      return;
    }

    if (type === 'restore') {
      if (!window.confirm(t('alertConfirmPull') || "تحذير خطير: سيتم استبدال كل بياناتك الحالية بالبيانات المحفوظة في السحابة. هل أنت متأكد؟")) return;
    }
    if (type === 'backup') {
      if (!window.confirm(t('alertConfirmPush') || "هل أنت متأكد من رفع بياناتك الحالية للسحابة كنسخة احتياطية؟")) return;
    }

    setSyncState('syncing');

    try {
      // 🎓 1. تحديث تطبيق الطلاب
      if (type === 'student') {
        setSyncMessage(t('syncingMsg') || 'جاري تحديث بيانات تطبيق الطلاب والمهام...');
        const savedTasks = JSON.parse(localStorage.getItem('rased_teacher_tasks') || '[]');
        const payload = { students: students, tasks: savedTasks, className: 'الكل' };
        await fetch(STUDENT_APP_URL, { method: 'POST', body: JSON.stringify(payload) });
      }
      
      // 👨‍👩‍👦 2. تحديث تطبيق أولياء الأمور
      else if (type === 'parent') {
        setSyncMessage(t('syncingMsg') || 'جاري معالجة ومزامنة بيانات أولياء الأمور...');
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const parentPayload = students
            .filter(s => s.parentCode && s.parentCode.trim() !== "")
            .map(s => {
                const monthlyPoints = (s.behaviors || [])
                    .filter(b => {
                        const d = new Date(b.date);
                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    })
                    .reduce((acc, b) => acc + b.points, 0);

                return {
                    parentCode: s.parentCode,
                    name: s.name,
                    className: s.classes[0] || "",
                    subject: teacherInfo?.subject || t('unspecified') || 'عام', 
                    schoolName: teacherInfo?.school || t('unspecified') || 'عام',
                    totalPoints: monthlyPoints,
                    behaviors: s.behaviors || [],
                    grades: s.grades || [],
                    attendance: s.attendance || [] 
                };
            });

        if (parentPayload.length === 0) throw new Error(t('alertNoCivilIdToSync') || 'لا يوجد طلاب لديهم رقم مدني للمزامنة!');
        await fetch(PARENT_APP_URL, { method: 'POST', body: JSON.stringify(parentPayload) });
      }
      
      // ☁️ 3. الرفع الاحتياطي (Backup)
      else if (type === 'backup') {
        setSyncMessage(t('syncingMsg') || 'جاري تقسيم البيانات ورفعها بأمان للسحابة...');
        const cleanId = teacherInfo.civilId.trim();
        const teacherUniqueId = "id_" + cleanId;
        const forceTimestamp = Date.now(); 

        const recordsToSync = [
          { id: "tools_data", type: "Tools", data: JSON.stringify(assessmentTools), lastUpdated: forceTimestamp },
          { id: "groups_data", type: "Groups", data: JSON.stringify(groups || []), lastUpdated: forceTimestamp },
          { id: "categorizations_data", type: "Categorizations", data: JSON.stringify(categorizations || []), lastUpdated: forceTimestamp },
          { id: "gradeSettings_data", type: "GradeSettings", data: JSON.stringify(gradeSettings), lastUpdated: forceTimestamp },
          { id: "classes_data", type: "Classes", data: JSON.stringify(classes), lastUpdated: forceTimestamp },
          { id: "teacher_info_data", type: "TeacherInfo", data: JSON.stringify(teacherInfo), lastUpdated: forceTimestamp },
          { id: "schedule_data", type: "Schedule", data: JSON.stringify(schedule || {}), lastUpdated: forceTimestamp },
          { id: "periodTimes_data", type: "PeriodTimes", data: JSON.stringify(periodTimes || []), lastUpdated: forceTimestamp },
          { id: "certSettings_data", type: "CertSettings", data: JSON.stringify(certificateSettings || {}), lastUpdated: forceTimestamp },
          { id: "hiddenClasses_data", type: "HiddenClasses", data: JSON.stringify(hiddenClasses || []), lastUpdated: forceTimestamp },
        ];

        if (!students || students.length === 0) {
            recordsToSync.push({ id: "students_chunk_0", type: "StudentsChunk", data: "[]", lastUpdated: forceTimestamp });
        } else {
            const CHUNK_SIZE = 100;
            for (let i = 0; i < students.length; i += CHUNK_SIZE) {
              recordsToSync.push({
                id: `students_chunk_${i}`, 
                type: "StudentsChunk", 
                data: JSON.stringify(students.slice(i, i + CHUNK_SIZE)), 
                lastUpdated: forceTimestamp 
              });
            }
        }

        const response = await fetch(DEVICE_SYNC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'sync', teacherPhone: teacherUniqueId, records: recordsToSync })
        });

        const result = await response.json();
        if (result.status !== 'success') throw new Error("Server Error");
      } 
      
      // 📥 4. جلب البيانات (Restore)
      else if (type === 'restore') {
        setSyncMessage(t('syncingMsg') || 'جاري جلب بياناتك من السحابة وتجميعها...');
        const cleanId = teacherInfo.civilId.trim();
        const teacherUniqueId = "id_" + cleanId;

        const response = await fetch(DEVICE_SYNC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'sync', teacherPhone: teacherUniqueId, records: [] }) 
        });

        const result = await response.json();

        if (result.status === 'success' && result.records && result.records.length > 0) {
          let incomingChunks: any[] = [];
          let hasData = false;

          let newAssessmentTools = assessmentTools;
          let newGroups = groups;
          let newCategorizations = categorizations;
          let newGradeSettings = gradeSettings;
          let newClasses = classes;
          let newTeacherInfo = teacherInfo;
          let newSchedule = schedule;
          let newPeriodTimes = periodTimes;
          let newCertificateSettings = certificateSettings;
          let newHiddenClasses = hiddenClasses;
          let newStudents = students;

          result.records.forEach((serverRec: any) => {
              hasData = true;
              try {
                  const parsedData = JSON.parse(serverRec.data);
                  if (serverRec.id === "tools_data") newAssessmentTools = parsedData;
                  if (serverRec.id === "groups_data") newGroups = parsedData;
                  if (serverRec.id === "categorizations_data") newCategorizations = parsedData;
                  if (serverRec.id === "gradeSettings_data") newGradeSettings = parsedData;
                  if (serverRec.id === "classes_data") newClasses = parsedData;
                  if (serverRec.id === "teacher_info_data") newTeacherInfo = parsedData;
                  if (serverRec.id === "schedule_data") newSchedule = parsedData;
                  if (serverRec.id === "periodTimes_data") newPeriodTimes = parsedData;
                  if (serverRec.id === "certSettings_data") newCertificateSettings = parsedData;
                  if (serverRec.id === "hiddenClasses_data") newHiddenClasses = parsedData;
                  if (serverRec.type === "StudentsChunk") incomingChunks.push({id: serverRec.id, data: parsedData});
              } catch (e) { console.error("Error parsing", e); }
          });

          if (incomingChunks.length > 0) {
              incomingChunks.sort((a, b) => parseInt(a.id.replace('students_chunk_', '')) - parseInt(b.id.replace('students_chunk_', '')));
              newStudents = incomingChunks.reduce((acc, chunk) => acc.concat(chunk.data), []);
              
              const uniqueStudentsMap = new Map();
              newStudents.forEach((student: any) => {
                  if (student && student.id) uniqueStudentsMap.set(student.id, student);
              });
              newStudents = Array.from(uniqueStudentsMap.values());
          } else if (hasData) {
              newStudents = []; 
          }

          if (hasData) {
              const dataToSave = {
                version: '4.4.1',
                timestamp: new Date().toISOString(),
                students: newStudents,
                classes: newClasses,
                hiddenClasses: newHiddenClasses,
                groups: newGroups,
                schedule: newSchedule,
                periodTimes: newPeriodTimes,
                teacherInfo: newTeacherInfo,
                assessmentTools: newAssessmentTools,
                certificateSettings: newCertificateSettings,
                categorizations: newCategorizations,
                gradeSettings: newGradeSettings 
              };

              const jsonString = JSON.stringify(dataToSave, null, 2);
              if (Capacitor.isNativePlatform() || (window as any).electron !== undefined) {
                  await Filesystem.writeFile({ path: 'raseddatabasev2.json', data: jsonString, directory: Directory.Data, encoding: Encoding.UTF8 });
              } else {
                  localStorage.setItem('rased_web_backup', jsonString);
              }

              setStudents(newStudents);
              setClasses(newClasses);
              if (setAssessmentTools) setAssessmentTools(newAssessmentTools);
              setTeacherInfo(newTeacherInfo);
              
              setSyncState('success');
              setSyncMessage(t('syncSuccess') || 'تم استرجاع بياناتك بنجاح! سيتم إعادة تشغيل التطبيق...');
              setTimeout(() => window.location.reload(), 2000);
              return; 
          }
        } else { 
          throw new Error(t('alertNoDataInCloud') || 'لا توجد بيانات محفوظة أو فشل الجلب');
        }
      }

      setSyncState('success');
      setSyncMessage(t('syncSuccess') || 'تمت المزامنة بنجاح! ✨');
      setTimeout(() => {
        setSyncState('idle');
      }, 3000);

    } catch (error) {
      console.error(error);
      setSyncState('error');
      setSyncMessage(t('syncError') || 'فشل الاتصال! يرجى التأكد من اتصال الإنترنت والمحاولة مجدداً.');
      setTimeout(() => setSyncState('idle'), 4000);
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-500 relative z-10 font-sans bg-slate-50 text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
      
      {/* 🌟 الهيدر المشرق (Hero Header) */}
      <header className="shrink-0 z-40 px-5 pt-[env(safe-area-inset-top)] w-full transition-all duration-300 bg-white border-b border-slate-100 shadow-sm pb-8" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex flex-col items-center justify-center text-center mt-8" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="mb-4">
            <Icon3DSync />
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-3 text-slate-800 tracking-tight">
            {t('syncMenuTitle') || 'مركز مزامنة السحابة'}
          </h2>
          <p className="text-sm font-bold max-w-md text-slate-500 leading-relaxed">
            من هنا يمكنك مزامنة بياناتك مع تطبيقات الطلاب وأولياء الأمور، أو أخذ نسخة احتياطية لبياناتك بالكامل لاسترجاعها لاحقاً.
          </p>
        </div>
      </header>

      {/* 📝 محتوى الصفحة */}
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-28 custom-scrollbar relative z-10 bg-slate-50">
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* 🔄 حالات التحميل والنجاح والخطأ */}
        {syncState !== 'idle' ? (
          <div className="p-12 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center text-center min-h-[350px] border bg-white border-slate-200">
            
            {syncState === 'syncing' && (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <Loader2 className="w-20 h-20 animate-spin mb-6 text-blue-500" />
                <p className="text-xl font-black text-slate-700">{syncMessage}</p>
                <p className="text-xs font-bold text-slate-400 mt-2">يرجى الانتظار ولا تغلق التطبيق...</p>
              </div>
            )}

            {syncState === 'success' && (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 bg-emerald-50 border-2 border-emerald-200">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                </div>
                <p className="text-xl font-black text-slate-800">{syncMessage}</p>
              </div>
            )}

            {syncState === 'error' && (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-rose-500/20 bg-rose-50 border-2 border-rose-200">
                  <AlertCircle className="w-14 h-14 text-rose-500" />
                </div>
                <p className="text-xl font-black mb-8 text-slate-800">{syncMessage}</p>
                <button onClick={() => setSyncState('idle')} className="px-8 py-4 rounded-[1.2rem] font-black text-sm transition-all active:scale-95 bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200">
                  {t('closeBtn') || 'الرجوع للمركز'}
                </button>
              </div>
            )}
          </div>
        ) : (
          
          /* 🎛️ شبكة الأزرار الكبيرة المشرقة */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            
            {/* كرت مزامنة الطلاب */}
            <button onClick={() => handleSync('student')} className="group p-8 rounded-[2rem] flex flex-col items-start gap-5 transition-all duration-300 active:scale-[0.98] border shadow-sm bg-white border-slate-200 hover:border-blue-400 hover:shadow-md">
              <div className="p-4 rounded-[1.2rem] transition-colors bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white shadow-sm border border-blue-100 group-hover:border-blue-600">
                <Smartphone className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <div className={`text-right ${dir === 'ltr' ? 'text-left' : ''}`}>
                <h3 className="text-lg font-black mb-2 text-slate-800">تطبيق الطلاب والمهام</h3>
                <p className="text-[13px] font-bold leading-relaxed text-slate-500 group-hover:text-slate-600 transition-colors">
                  إرسال الدرجات، المهام، النقاط، والمراكز فوراً ليتمكن الطالب من رؤيتها في تطبيقه.
                </p>
              </div>
            </button>

            {/* كرت مزامنة أولياء الأمور */}
            <button onClick={() => handleSync('parent')} className="group p-8 rounded-[2rem] flex flex-col items-start gap-5 transition-all duration-300 active:scale-[0.98] border shadow-sm bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md">
              <div className="p-4 rounded-[1.2rem] transition-colors bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white shadow-sm border border-emerald-100 group-hover:border-emerald-600">
                <Users className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <div className={`text-right ${dir === 'ltr' ? 'text-left' : ''}`}>
                <h3 className="text-lg font-black mb-2 text-slate-800">تطبيق أولياء الأمور</h3>
                <p className="text-[13px] font-bold leading-relaxed text-slate-500 group-hover:text-slate-600 transition-colors">
                  مزامنة سجلات الغياب، السلوكيات، والدرجات للطلاب الذين تم ربط أرقامهم المدنية.
                </p>
              </div>
            </button>

            {/* كرت النسخ الاحتياطي */}
            <button onClick={() => handleSync('backup')} className="group p-8 rounded-[2rem] flex flex-col items-start gap-5 transition-all duration-300 active:scale-[0.98] border shadow-sm bg-white border-slate-200 hover:border-amber-400 hover:shadow-md">
              <div className="p-4 rounded-[1.2rem] transition-colors bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white shadow-sm border border-amber-100 group-hover:border-amber-500">
                <CloudUpload className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <div className={`text-right ${dir === 'ltr' ? 'text-left' : ''}`}>
                <h3 className="text-lg font-black mb-2 text-slate-800">{t('syncBackupBtn') || 'رفع نسخة احتياطية (سحابي)'}</h3>
                <p className="text-[13px] font-bold leading-relaxed text-slate-500 group-hover:text-slate-600 transition-colors">
                  حفظ نسخة كاملة من بياناتك وإعداداتك في السحابة لضمان عدم ضياعها أو لنقلها لجهاز آخر.
                </p>
              </div>
            </button>

            {/* كرت الاسترجاع */}
            <button onClick={() => handleSync('restore')} className="group p-8 rounded-[2rem] flex flex-col items-start gap-5 transition-all duration-300 active:scale-[0.98] border shadow-sm bg-white border-slate-200 hover:border-rose-400 hover:shadow-md">
              <div className="p-4 rounded-[1.2rem] transition-colors bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white shadow-sm border border-rose-100 group-hover:border-rose-600">
                <CloudDownload className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <div className={`text-right ${dir === 'ltr' ? 'text-left' : ''}`}>
                <h3 className="text-lg font-black mb-2 text-slate-800">{t('syncRestoreBtn') || 'استرجاع البيانات (سحابي)'}</h3>
                <p className="text-[13px] font-bold leading-relaxed text-slate-500 group-hover:text-slate-600 transition-colors">
                  جلب بياناتك المحفوظة مسبقاً من السحابة. (تحذير: سيتم استبدال بياناتك الحالية بالكامل).
                </p>
              </div>
            </button>

          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSyncManager;