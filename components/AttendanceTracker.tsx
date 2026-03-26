import React, { useState, useMemo, useEffect } from 'react';
import { Student, AttendanceStatus } from '../types';
import { MessageCircle, Loader2, Share2, DoorOpen, UserCircle2, ChevronLeft, ChevronRight, Search, X, Check, Clock } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { StudentAvatar } from './StudentAvatar';
import { useApp } from '../context/AppContext';

interface AttendanceTrackerProps {
  students: Student[];
  classes: string[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ students, classes, setStudents }) => {
  // === 🧠 العقل والمنطق البرمجي (لم يتم المساس به) 🧠 ===
  const { t, dir, language } = useApp();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toLocaleDateString('en-CA'));
  
  const [selectedGrade, setSelectedGrade] = useState<string>(() => sessionStorage.getItem('rased_grade') || 'all');
  const [classFilter, setClassFilter] = useState<string>(() => sessionStorage.getItem('rased_class') || 'all');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [notificationTarget, setNotificationTarget] = useState<{student: Student, type: 'absent' | 'late' | 'truant'} | null>(null);

  useEffect(() => {
      sessionStorage.setItem('rased_grade', selectedGrade);
      sessionStorage.setItem('rased_class', classFilter);
  }, [selectedGrade, classFilter]);

  const [weekOffset, setWeekOffset] = useState(0);
  
  const weekDates = useMemo(() => {
      const dates = [];
      const startOfWeek = new Date();
      startOfWeek.setDate(today.getDate() - (today.getDay()) + (weekOffset * 7)); 
      
      for (let i = 0; i < 5; i++) { 
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          dates.push(d);
      }
      return dates;
  }, [weekOffset]);

  const getStatus = (student: Student) => {
    return student.attendance.find(a => a.date === selectedDate)?.status;
  };

  const toggleAttendance = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const filtered = s.attendance.filter(a => a.date !== selectedDate);
      const currentStatus = s.attendance.find(a => a.date === selectedDate)?.status;
      
      const newStudent = {
        ...s,
        attendance: currentStatus === status ? filtered : [...filtered, { date: selectedDate, status }]
      };

      if ((status === 'absent' || status === 'late' || status === 'truant') && currentStatus !== status) {
        setTimeout(() => setNotificationTarget({ student: newStudent, type: status }), 50);
      }

      return newStudent;
    }));
  };

  const markAll = (status: AttendanceStatus) => {
      const visibleIds = new Set(filteredStudents.map(s => s.id));
      setStudents(prev => prev.map(s => {
          if (!visibleIds.has(s.id)) return s;
          const filtered = s.attendance.filter(a => a.date !== selectedDate);
          return {
              ...s,
              attendance: [...filtered, { date: selectedDate, status }]
          };
      }));
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
      return Array.from(grades).sort();
  }, [students]);

  const visibleClasses = useMemo(() => {
      if (selectedGrade === 'all') return classes;
      return classes.filter(c => c.startsWith(selectedGrade));
  }, [classes, selectedGrade]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = classFilter === 'all' || s.classes.includes(classFilter);
      let matchesGrade = true;
      if (selectedGrade !== 'all') {
          matchesGrade = s.grade === selectedGrade || (s.classes[0] && s.classes[0].startsWith(selectedGrade));
      }
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesClass && matchesGrade && matchesSearch;
    });
  }, [students, classFilter, selectedGrade, searchTerm]);

  const stats = useMemo(() => {
      const present = filteredStudents.filter(s => getStatus(s) === 'present').length;
      const absent = filteredStudents.filter(s => getStatus(s) === 'absent').length;
      const late = filteredStudents.filter(s => getStatus(s) === 'late').length;
      const truant = filteredStudents.filter(s => getStatus(s) === 'truant').length;
      return { present, absent, late, truant, total: filteredStudents.length };
  }, [filteredStudents, selectedDate]);

  const performNotification = async (method: 'whatsapp' | 'sms') => {
      if(!notificationTarget || !notificationTarget.student.parentPhone) { alert(t('noPhoneRegistered')); return; }
      const { student, type } = notificationTarget;
      let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length < 5) return alert(t('invalidPhone'));
      if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
      if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
      else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);
      
      let statusText = '';
      if (type === 'absent') statusText = t('statusAbsent'); 
      else if (type === 'late') statusText = t('statusLate'); 
      else if (type === 'truant') statusText = t('statusTruant');
      
      const dateText = new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
      const msg = encodeURIComponent(`${t('whatsappMsgPart1')} ${student.name} ${t('whatsappMsgPart2')}${statusText}${t('whatsappMsgPart3')}${dateText}${t('whatsappMsgPart4')}`);
      
      if (method === 'whatsapp') {
          if ((window as any).electron) { (window as any).electron.openExternal(`whatsapp://send?phone=${cleanPhone}&text=${msg}`); } 
          else { 
              const universalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`; 
              try { 
                  if (Capacitor.isNativePlatform()) { await Browser.open({ url: universalUrl }); } 
                  else { window.open(universalUrl, '_blank'); } 
              } catch (e) { window.open(universalUrl, '_blank'); } 
          }
      } else { 
          window.location.href = `sms:${cleanPhone}?body=${msg}`; 
      }
      setNotificationTarget(null);
  };

  const handleExportDailyExcel = async () => {
      if (filteredStudents.length === 0) return alert(t('noStudents'));
      setIsExportingExcel(true);
      try {
          const targetDate = new Date(selectedDate);
          const year = targetDate.getFullYear();
          const month = targetDate.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const data = filteredStudents.map((s, idx) => {
              const row: any = { 
                [t('excelNo')]: idx + 1, 
                [t('excelStudentName')]: s.name, 
                [t('excelClass')]: s.classes[0] || '' 
              };
              let abs = 0, late = 0, truant = 0;
              for (let d = 1; d <= daysInMonth; d++) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const record = s.attendance.find(a => a.date === dateStr);
                  let symbol = '';
                  if (record) {
                      if (record.status === 'present') symbol = '✓';
                      else if (record.status === 'absent') { symbol = language === 'ar' ? 'غ' : 'A'; abs++; }
                      else if (record.status === 'late') { symbol = language === 'ar' ? 'ت' : 'L'; late++; }
                      else if (record.status === 'truant') { symbol = language === 'ar' ? 'س' : 'T'; truant++; }
                  }
                  row[`${d}`] = symbol;
              }
              row[t('excelTotalAbsent')] = abs; 
              row[t('excelTotalLate')] = late; 
              row[t('excelTotalTruant')] = truant;
              return row;
          });
          const wb = XLSX.utils.book_new(); 
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, `${t('excelMonthPrefix')}${month + 1}`);
          const fileName = `Attendance_${month + 1}.xlsx`;
          if (Capacitor.isNativePlatform()) {
              const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
              const result = await Filesystem.writeFile({ path: fileName, data: wbout, directory: Directory.Cache });
              await Share.share({ title: t('attendanceRecord'), url: result.uri });
          } else { XLSX.writeFile(wb, fileName); }
      } catch (error) { alert(t('exportError')); } finally { setIsExportingExcel(false); }
  };

  // === 🎨 الجسد (التصميم الجديد واللوحات المنزلقة) 🎨 ===
  // CSS للوحات المنسدلة الذكية
  const baseDrawerClasses = `fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl`;
  const bottomSheetClasses = `bottom-0 left-0 w-full h-[85vh] rounded-t-[2.5rem]`;
  const sidePanelClasses = `md:h-full md:w-[450px] md:top-0 md:rounded-none md:bottom-auto ${dir === 'rtl' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'}`;

  return (
   <div className={`flex flex-col h-full pb-24 md:pb-8 overflow-hidden relative bg-slate-50 text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
            
      <header className="shrink-0 z-40 px-5 pt-[env(safe-area-inset-top)] w-full transition-all duration-300 bg-white border-b border-slate-100 shadow-sm pb-2" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex justify-between items-center gap-3 mb-5 mt-4">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 shrink-0">{t('attendanceTitle')}</h1>
              
              <div className="flex-1 relative group" style={{ WebkitAppRegion: 'no-drag' } as any}>
                  <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('searchStudentPlaceholder')} 
                      className={`w-full border border-slate-200 rounded-[1.5rem] py-3.5 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm font-bold outline-none transition-all bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white shadow-sm`}
                  />
              </div>

              <button 
                  onClick={handleExportDailyExcel} 
                  disabled={isExportingExcel} 
                  className="w-12 h-12 shrink-0 rounded-[1.2rem] border bg-white border-slate-200 text-slate-500 flex items-center justify-center active:scale-95 transition-all hover:bg-slate-50 hover:text-blue-600 shadow-sm"
                  style={{ WebkitAppRegion: 'no-drag' } as any}
                  title={t('exportRecord')}
              >
                  {isExportingExcel ? <Loader2 className="w-5 h-5 animate-spin text-blue-500"/> : <Share2 className="w-5 h-5"/>}
              </button>
          </div>

          {/* شريط الأيام الذكي */}
          <div className="flex items-center justify-between gap-2 mb-4 p-2 rounded-[1.5rem] bg-slate-50 border border-slate-100 shadow-inner" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-colors bg-transparent"><ChevronRight className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-0' : 'rotate-180'}`}/></button>
              <div className="flex flex-1 justify-between gap-1 md:gap-2 text-center">
                  {weekDates.map((date, idx) => {
                      const isSelected = date.toLocaleDateString('en-CA') === selectedDate;
                      const isToday = date.toLocaleDateString('en-CA') === today.toLocaleDateString('en-CA');
                      return (
                          <button 
                              key={idx} 
                              onClick={() => setSelectedDate(date.toLocaleDateString('en-CA'))}
                              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl flex-1 transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-[1.02]' : 'text-slate-500 hover:bg-white hover:shadow-sm border border-transparent'}`}
                          >
                              <span className={`text-[10px] font-bold mb-1 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>{date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' })}</span>
                              <span className="text-sm font-black">{date.getDate()}</span>
                              {isToday && !isSelected && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></div>}
                          </button>
                      );
                  })}
              </div>
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-colors bg-transparent"><ChevronLeft className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-0' : 'rotate-180'}`}/></button>
          </div>

          <div className="mb-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1 custom-scrollbar">
                  <button onClick={() => { setSelectedGrade('all'); setClassFilter('all'); }} className={`px-5 py-2.5 text-[11px] font-bold whitespace-nowrap rounded-xl transition-all border shrink-0 ${selectedGrade === 'all' && classFilter === 'all' ? 'bg-blue-600 text-white shadow-md border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{t('all')}</button>
                  {availableGrades.map(g => (
                      <button key={g} onClick={() => { setSelectedGrade(g); setClassFilter('all'); }} className={`px-5 py-2.5 text-[11px] font-bold whitespace-nowrap rounded-xl transition-all border shrink-0 ${selectedGrade === g && classFilter === 'all' ? 'bg-blue-600 text-white shadow-md border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{t('gradePrefix')} {g}</button>
                  ))}
                  {visibleClasses.map(c => (
                      <button key={c} onClick={() => setClassFilter(c)} className={`px-5 py-2.5 text-[11px] font-bold whitespace-nowrap rounded-xl transition-all border shrink-0 ${classFilter === c ? 'bg-blue-600 text-white shadow-md border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{c}</button>
                  ))}
              </div>
          </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-5 pb-28 custom-scrollbar pt-6">
          <div className="relative z-10 w-full max-w-6xl mx-auto">
              
              {/* لوحة الإحصائيات (Mark All) */}
              <div className="mb-6 bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center gap-3 text-center">
                      <button onClick={() => markAll('present')} className="flex-1 rounded-2xl p-3 border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm active:scale-95 transition-all hover:bg-emerald-100">
                          <span className="block text-[11px] font-bold mb-1 opacity-80 uppercase tracking-wider">{t('presentAll')}</span>
                          <span className="block text-2xl font-black">{stats.present}</span>
                      </button>
                      <button onClick={() => markAll('absent')} className="flex-1 rounded-2xl p-3 border border-rose-100 bg-rose-50 text-rose-700 shadow-sm active:scale-95 transition-all hover:bg-rose-100">
                          <span className="block text-[11px] font-bold mb-1 opacity-80 uppercase tracking-wider">{t('absentAll')}</span>
                          <span className="block text-2xl font-black">{stats.absent}</span>
                      </button>
                      <div className="flex-1 rounded-2xl p-3 border border-amber-100 bg-amber-50 text-amber-700 shadow-sm">
                          <span className="block text-[11px] font-bold mb-1 opacity-80 uppercase tracking-wider">{t('lateAll')}</span>
                          <span className="block text-2xl font-black">{stats.late}</span>
                      </div>
                  </div>
              </div>

              {/* بطاقات الطلاب */}
              {filteredStudents.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredStudents.map(student => {
                          const status = getStatus(student);
                          return (
                              <div key={student.id} className={`rounded-[1.5rem] border-2 flex flex-col items-center overflow-hidden transition-all duration-300 bg-white hover:shadow-lg group ${
                                  status === 'present' ? 'border-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.15)] bg-emerald-50/30' : 
                                  status === 'absent' ? 'border-rose-400 shadow-[0_4px_20px_rgba(244,63,94,0.15)] bg-rose-50/30' : 
                                  status === 'late' ? 'border-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.15)] bg-amber-50/30' :
                                  status === 'truant' ? 'border-purple-400 shadow-[0_4px_20px_rgba(168,85,247,0.15)] bg-purple-50/30' :
                                  'border-slate-100 shadow-sm hover:border-blue-200'
                              }`}>
                                  <div className="p-5 flex flex-col items-center w-full flex-1">
                                      <StudentAvatar gender={student.gender} className="w-16 h-16 rounded-[1.2rem] bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform" />
                                      <h3 className="font-black text-sm text-center line-clamp-1 w-full mt-4 text-slate-800" title={student.name}>{student.name}</h3>
                                      <span className="text-[10px] px-3 py-1 rounded-xl mt-2 font-bold bg-slate-50 text-slate-500 border border-slate-100">{student.classes[0]}</span>
                                  </div>

                                  {/* أزرار الحضور والغياب للبطاقة */}
                                  <div className="flex w-full border-t border-slate-100 divide-x divide-slate-100 mt-auto bg-slate-50/50">
                                      
                                      <button onClick={() => toggleAttendance(student.id, 'present')} className={`flex-1 py-3.5 flex flex-col items-center justify-center gap-1.5 transition-colors ${status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100 hover:text-emerald-500'}`}>
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${status === 'present' ? 'bg-emerald-500 text-white scale-110 shadow-md' : 'bg-slate-200 text-white'}`}><Check size={14} strokeWidth={3}/></div>
                                          <span className="text-[9px] font-bold uppercase tracking-wider">{t('present')}</span>
                                      </button>

                                      <button onClick={() => toggleAttendance(student.id, 'absent')} className={`flex-1 py-3.5 flex flex-col items-center justify-center gap-1.5 transition-colors ${status === 'absent' ? 'bg-rose-100 text-rose-700' : 'text-slate-400 hover:bg-slate-100 hover:text-rose-500'}`}>
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${status === 'absent' ? 'bg-rose-500 text-white scale-110 shadow-md' : 'bg-slate-200 text-white'}`}><X size={14} strokeWidth={3}/></div>
                                          <span className="text-[9px] font-bold uppercase tracking-wider">{t('absent')}</span>
                                      </button>

                                      <button onClick={() => toggleAttendance(student.id, 'late')} className={`flex-1 py-3.5 flex flex-col items-center justify-center gap-1.5 transition-colors ${status === 'late' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100 hover:text-amber-500'}`}>
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${status === 'late' ? 'bg-amber-500 text-white scale-110 shadow-md' : 'bg-slate-200 text-white'}`}><Clock size={14} strokeWidth={3}/></div>
                                          <span className="text-[9px] font-bold uppercase tracking-wider">{t('late')}</span>
                                      </button>

                                      <button onClick={() => toggleAttendance(student.id, 'truant')} className={`flex-1 py-3.5 flex flex-col items-center justify-center gap-1.5 transition-colors ${status === 'truant' ? 'bg-purple-100 text-purple-700' : 'text-slate-400 hover:bg-slate-100 hover:text-purple-500'}`}>
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${status === 'truant' ? 'bg-purple-500 text-white scale-110 shadow-md' : 'bg-slate-200 text-white'}`}><DoorOpen size={14} strokeWidth={2}/></div>
                                          <span className="text-[9px] font-bold uppercase tracking-wider">{t('truant')}</span>
                                      </button>

                                  </div>
                              </div>
                          );
                      })}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-70">
                      <div className="bg-white p-6 rounded-full border border-slate-100 mb-4 shadow-sm">
                          <UserCircle2 className="w-12 h-12 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-500">{t('noStudents')}</p>
                  </div>
              )}
          </div>
      </div>

      {/* 🚀 نافذة إشعار ولي الأمر (أصبحت لوحة منزلقة ذكية) */}
      <>
          <div className={`fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm transition-all duration-300 ${!!notificationTarget ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setNotificationTarget(null)} />
          <div className={`${baseDrawerClasses} ${bottomSheetClasses} ${sidePanelClasses} ${!!notificationTarget ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'}`}>
              
              <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
              
              {notificationTarget && (
                  <div className="flex flex-col h-full p-6 pt-10 md:pt-14">
                      
                      <div className="text-center flex-1">
                          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-inner ${
                              notificationTarget.type === 'absent' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 
                              notificationTarget.type === 'late' ? 'bg-amber-50 text-amber-500 border border-amber-100' : 
                              'bg-purple-50 text-purple-500 border border-purple-100'
                          }`}>
                              <MessageCircle className="w-10 h-10" />
                          </div>

                          <h3 className="font-black text-2xl mb-3 text-slate-800">{t('parentNotification')}</h3>
                          
                          <div className="text-sm font-bold mb-8 leading-relaxed text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              {t('sendAlertPrompt')}
                              <div className="text-xl mt-2 font-black text-blue-600">
                                  {notificationTarget.student.name}
                              </div>
                          </div>
                      </div>

                      <div className="space-y-3 shrink-0 pb-6">
                          <button 
                              onClick={() => performNotification('whatsapp')} 
                              className="w-full py-4 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg bg-[#25D366] hover:bg-[#1fa851]"
                          >
                              <MessageCircle className="w-6 h-6" /> {t('sendWhatsapp')}
                          </button>

                          <button 
                              onClick={() => performNotification('sms')} 
                              className="w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
                          >
                              {t('sendSms')}
                          </button>

                          <button 
                              onClick={() => setNotificationTarget(null)} 
                              className="w-full py-4 font-bold text-xs transition-colors text-slate-400 hover:text-rose-500 bg-transparent"
                          >
                              {t('cancelAction')}
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </>

    </div>
  );
};

export default AttendanceTracker;