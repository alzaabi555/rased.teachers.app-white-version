import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Plus, Trash2, X, Edit2, Check, UserMinus, FolderPlus, ArrowRight, UserPlus, CheckCircle2 } from 'lucide-react';

interface StudentGroupsProps {
  onBack?: () => void;
}

const StudentGroups: React.FC<StudentGroupsProps> = ({ onBack }) => {
  const { students, classes, categorizations, setCategorizations, t, dir } = useApp();
  
  const [selectedClass, setSelectedClass] = useState<string>(classes[0] || '');
  const [activeCatId, setActiveCatId] = useState<string>('');
  
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  
  const [assigningToGroup, setAssigningToGroup] = useState<{ catId: string; groupId: string } | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const groupColors = [
    { id: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    { id: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    { id: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    { id: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    { id: 'rose', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
    { id: 'cyan', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
  ];
  const [selectedColor, setSelectedColor] = useState(groupColors[0]);

  const classCategorizations = useMemo(() => categorizations.filter(c => c.classId === selectedClass), [categorizations, selectedClass]);
  const activeCat = useMemo(() => classCategorizations.find(c => c.id === activeCatId) || null, [classCategorizations, activeCatId]);
  const classStudents = useMemo(() => students.filter(s => s.classes.includes(selectedClass)), [students, selectedClass]);
  
  const unassignedStudents = useMemo(() => {
    if (!activeCat) return [];
    const assignedIds = new Set(activeCat.groups.flatMap(g => g.studentIds));
    return classStudents.filter(s => !assignedIds.has(s.id));
  }, [classStudents, activeCat]);

  const getShortName = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1]}`;
  };

  const handleCreateCategorization = () => {
    if (!newCatTitle.trim() || !selectedClass) return;
    const newCat = {
      id: Math.random().toString(36).substring(2, 9),
      title: newCatTitle.trim(),
      classId: selectedClass,
      createdAt: new Date().toISOString(),
      groups: []
    };
    setCategorizations([...categorizations, newCat]);
    setNewCatTitle('');
    setActiveCatId(newCat.id);
  };

  const handleDeleteCategorization = (id: string) => {
    if (confirm(t('confirmDeleteCat'))) {
      setCategorizations(categorizations.filter(c => c.id !== id));
      if (activeCatId === id) setActiveCatId('');
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !activeCatId) return;
    setCategorizations(prev => prev.map(cat => {
      if (cat.id === activeCatId) {
        return {
          ...cat,
          groups: [...cat.groups, { id: Math.random().toString(36).substring(2, 9), name: newGroupName.trim(), color: selectedColor.id, studentIds: [], isCompleted: false }]
        };
      }
      return cat;
    }));
    setNewGroupName('');
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm(t('confirmDeleteGroup'))) {
      setCategorizations(prev => prev.map(cat => {
        if (cat.id === activeCatId) return { ...cat, groups: cat.groups.filter(g => g.id !== groupId) };
        return cat;
      }));
    }
  };

  const removeStudentFromGroup = (studentId: string, groupId: string) => {
    setCategorizations(prev => prev.map(cat => {
      if (cat.id === activeCatId) {
        return {
          ...cat,
          groups: cat.groups.map(g => g.id === groupId ? { ...g, studentIds: g.studentIds.filter(id => id !== studentId) } : g)
        };
      }
      return cat;
    }));
  };

  const toggleGroupCompletion = (groupId: string) => {
    setCategorizations(prev => prev.map(cat => {
      if (cat.id === activeCatId) {
        return {
          ...cat,
          groups: cat.groups.map(g => g.id === groupId ? { ...g, isCompleted: !g.isCompleted } : g)
        };
      }
      return cat;
    }));
  };

  const openAssignModal = (groupId: string) => {
    if (!activeCat) return;
    const group = activeCat.groups.find(g => g.id === groupId);
    if (group) {
      setSelectedStudentIds(new Set(group.studentIds)); 
      setAssigningToGroup({ catId: activeCat.id, groupId });
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudentIds);
    if (newSelection.has(studentId)) newSelection.delete(studentId);
    else newSelection.add(studentId);
    setSelectedStudentIds(newSelection);
  };

  const saveBulkAssignment = () => {
    if (!assigningToGroup) return;
    
    setCategorizations(prev => prev.map(cat => {
      if (cat.id === assigningToGroup.catId) {
        const updatedGroups = cat.groups.map(g => {
          if (g.id === assigningToGroup.groupId) {
            return { ...g, studentIds: Array.from(selectedStudentIds) };
          } else {
            return { ...g, studentIds: g.studentIds.filter(id => !selectedStudentIds.has(id)) };
          }
        });
        return { ...cat, groups: updatedGroups };
      }
      return cat;
    }));
    
    setAssigningToGroup(null);
  };

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-slate-500 bg-slate-50" dir={dir}>
        <Users className="w-16 h-16 mb-4 text-slate-300" />
        <p className="text-lg font-bold">{t('noClassesAdded')}</p>
      </div>
    );
  }

  // CSS للوحات المنسدلة الذكية (Responsive Drawers)
  const baseDrawerClasses = `fixed z-[101] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white shadow-2xl`;
  const bottomSheetClasses = `bottom-0 left-0 w-full h-[90vh] rounded-t-[2.5rem]`;
  const sidePanelClasses = `md:h-full md:w-[450px] md:top-0 md:rounded-none md:bottom-auto ${dir === 'rtl' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'}`;

  return (
    <div className={`flex flex-col h-full overflow-hidden text-slate-800 bg-slate-50 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
      
      {/* ================= 🩺 الهيدر المشرق ================= */}
      <header className="shrink-0 z-40 px-5 pt-[env(safe-area-inset-top)] w-full transition-all duration-300 bg-white border-b border-slate-200 shadow-sm" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 mb-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} style={{ WebkitAppRegion: 'no-drag' } as any} className="p-2.5 rounded-xl transition-colors bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-blue-600 border border-slate-200 active:scale-95">
                <ArrowRight className={`w-5 h-5 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
              </button>
            )}
            <div className="bg-emerald-50 p-3 rounded-[1.2rem] border border-emerald-100 shadow-sm">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div style={{ WebkitAppRegion: 'no-drag' } as any}>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-800">{t('manageGroupsTitle')}</h1>
              <p className="text-[11px] font-bold text-slate-500 mt-1">{t('groupsSubtitle')}</p>
            </div>
          </div>

          <select 
            value={selectedClass} 
            onChange={(e) => { setSelectedClass(e.target.value); setActiveCatId(''); }}
            style={{ WebkitAppRegion: 'no-drag' } as any}
            className="p-3 md:p-3.5 rounded-[1.2rem] border-2 border-slate-200 font-black text-sm md:text-base outline-none cursor-pointer min-w-[150px] md:min-w-[200px] bg-slate-50 text-slate-700 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
          >
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </header>

      {/* ================= 📝 محتوى الصفحة الداخلي ================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================= 🗂️ العمود الجانبي (التقسيمات) ================= */}
        <div className={`w-full md:w-[320px] lg:w-[350px] flex flex-col shrink-0 bg-white border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${dir === 'rtl' ? 'border-l' : 'border-r'}`}>
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-black text-base mb-4 flex items-center gap-2 text-slate-800">
              <FolderPlus className="w-5 h-5 text-blue-500" /> {t('classCategorizations')}
            </h2>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder={t('catNamePlaceholder')} 
                value={newCatTitle}
                onChange={(e) => setNewCatTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategorization()}
                className="flex-1 p-3.5 rounded-[1rem] border border-slate-200 text-sm font-bold outline-none bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 shadow-sm"
              />
              <button 
                onClick={handleCreateCategorization}
                disabled={!newCatTitle.trim()}
                className="p-3.5 rounded-[1rem] font-black flex items-center justify-center transition-all disabled:opacity-50 disabled:active:scale-100 bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-95"
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar pb-28 md:pb-4">
            {classCategorizations.length === 0 ? (
              <div className="text-center p-8 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 bg-slate-50/50 mt-4" dangerouslySetInnerHTML={{ __html: t('noCategorizations') }}></div>
            ) : (
              classCategorizations.map(cat => (
                <div 
                  key={cat.id} 
                  onClick={() => setActiveCatId(cat.id)}
                  className={`p-4 rounded-[1.2rem] border-2 cursor-pointer transition-all flex justify-between items-center group ${activeCatId === cat.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm'}`}
                >
                  <div>
                    <h3 className={`font-black text-[15px] ${activeCatId === cat.id ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-600 transition-colors'}`}>{cat.title}</h3>
                    <p className="text-[11px] font-bold mt-1 text-slate-400 group-hover:text-slate-500">
                      {cat.groups.length} {t('groupsCount')} • {cat.groups.reduce((acc, g) => acc + g.studentIds.length, 0)} {t('studentsCountWord')}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategorization(cat.id); }}
                    className="p-2.5 opacity-0 group-hover:opacity-100 rounded-xl transition-all text-rose-400 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= 🧩 منطقة العمل (المجموعات) ================= */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-50/50">
          {!activeCat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-60">
              <div className="w-24 h-24 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                 <Users className="w-12 h-12 text-slate-300" />
              </div>
              <h2 className="text-xl font-black text-slate-500">{t('selectCatToViewGroups')}</h2>
            </div>
          ) : (
            <>
              {/* شريط الإضافة للمجموعات */}
              <div className="p-4 md:p-5 border-b border-slate-200 bg-white flex flex-wrap gap-4 items-center shrink-0 shadow-sm z-10">
                <div className="flex gap-2 bg-slate-50 p-2 rounded-[1rem] border border-slate-100">
                  {groupColors.map(color => (
                    <button 
                      key={color.id}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${color.bg} ${color.border} ${selectedColor.id === color.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2 flex-1 min-w-[200px]">
                  <input 
                    type="text" 
                    placeholder={t('groupNamePlaceholder')} 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                    className="flex-1 p-3.5 rounded-[1.2rem] border border-slate-200 text-sm font-bold outline-none bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800"
                  />
                  <button 
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim()}
                    className="px-5 py-3.5 rounded-[1.2rem] font-black flex items-center gap-2 transition-all disabled:opacity-50 disabled:active:scale-100 bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-95"
                  >
                    <Plus className="w-5 h-5" strokeWidth={3} /> <span className="hidden sm:inline">{t('addBtn')}</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar pb-32 flex flex-col gap-8">
                
                {/* منطقة الطلاب غير الموزعين */}
                <div className="p-6 rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
                  <h3 className="font-black text-sm mb-5 flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-2">
                       <UserMinus className="w-4 h-4 text-rose-400" /> {t('unassignedStudents')}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl font-black bg-slate-100 text-slate-500 border border-slate-200">
                      {t('remainingLabel')} {unassignedStudents.length}
                    </span>
                  </h3>
                  {unassignedStudents.length === 0 ? (
                    <div className="text-center p-4 font-bold text-sm rounded-xl border border-emerald-200 text-emerald-600 bg-emerald-50">
                      {t('allStudentsAssigned')} 🎉
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {unassignedStudents.map(s => (
                        <div key={s.id} className="px-3 py-1.5 rounded-[1rem] text-[11px] font-black border bg-slate-50 border-slate-200 text-slate-600 shadow-sm">
                          {getShortName(s.name)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* صناديق المجموعات */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeCat.groups.map(group => {
                    const groupColor = groupColors.find(c => c.id === group.color) || groupColors[0];
                    const groupStudents = students.filter(s => group.studentIds.includes(s.id));
                    
                    const isCompleted = group.isCompleted;
                    const containerStyle = isCompleted 
                        ? `bg-emerald-50 border-emerald-200 opacity-80 scale-[0.98] shadow-sm grayscale-[30%]`
                        : `bg-white ${groupColor.border} shadow-md hover:shadow-lg`;

                    const headerStyle = isCompleted 
                        ? `bg-emerald-100 border-inherit` 
                        : `${groupColor.bg} border-inherit`;

                    return (
                      <div key={group.id} className={`rounded-[1.5rem] border-2 flex flex-col overflow-hidden transition-all duration-300 ${containerStyle}`}>
                        <div className={`p-4 border-b-2 flex justify-between items-center ${headerStyle}`}>
                          <div className="flex items-center gap-3">
                              <button 
                                onClick={() => toggleGroupCompletion(group.id)} 
                                title={isCompleted ? t('undoCompletion') : t('markAsCompleted')}
                                className={`p-2 rounded-xl transition-all border-2 active:scale-95 ${isCompleted ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' : 'bg-white/60 border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-600'}`}
                              >
                                  <CheckCircle2 size={18} className={isCompleted ? "animate-in zoom-in" : ""} />
                              </button>
                              <h3 className={`font-black text-lg ${isCompleted ? 'text-emerald-800' : groupColor.text}`}>
                                  {group.name}
                              </h3>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-[0.8rem] border ${isCompleted ? 'bg-emerald-200 border-emerald-300 text-emerald-800' : `bg-white/80 border-white/50 ${groupColor.text}`}`}>
                              {groupStudents.length}
                            </span>
                            <button onClick={() => handleDeleteGroup(group.id)} className="p-2 rounded-xl transition-colors text-rose-400 hover:bg-white/80 hover:text-rose-600" title={t('deleteGroupBtn')}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className={`p-4 flex-1 min-h-[160px] ${isCompleted ? 'bg-transparent' : 'bg-slate-50/30'}`}>
                          <div className="flex flex-col gap-2.5">
                            {groupStudents.map(s => (
                              <div key={s.id} className={`p-2.5 px-3 rounded-xl text-xs font-black border flex justify-between items-center group/item transition-all ${isCompleted ? 'bg-white/60 border-emerald-200 text-emerald-900/60 line-through' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:shadow-sm'}`}>
                                <span>{getShortName(s.name)}</span>
                                {!isCompleted && (
                                    <button onClick={() => removeStudentFromGroup(s.id, group.id)} className="p-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all text-rose-400 hover:bg-rose-50 hover:text-rose-600 active:scale-95" title={t('removeFromGroupBtn')}>
                                      <UserMinus className="w-4 h-4" />
                                    </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {!isCompleted && (
                            <div className="p-4 border-t border-slate-100 bg-white">
                              <button 
                                onClick={() => openAssignModal(group.id)}
                                className="w-full py-3 rounded-xl border-2 border-dashed font-black text-sm flex items-center justify-center gap-2 transition-all border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 active:scale-95"
                              >
                                <UserPlus className="w-4 h-4" /> {t('addStudentsToGroupBtn')}
                              </button>
                            </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================= 🎯 نافذة التحديد الجماعي الذكية (Drawer) ================= */}
      <>
        <div className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-all duration-300 ${assigningToGroup && activeCat ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setAssigningToGroup(null)} />
        <div className={`${baseDrawerClasses} ${bottomSheetClasses} ${sidePanelClasses} ${assigningToGroup && activeCat ? 'translate-y-0 opacity-100 visible pointer-events-auto' : 'translate-y-full md:translate-y-0 md:opacity-0 md:-translate-x-full invisible pointer-events-none'} !md:w-[500px]`}>
          
          <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 shrink-0 md:hidden" />
          
          <div className="flex justify-between items-center px-6 pt-10 pb-5 md:pt-14 border-b border-slate-100 shrink-0 bg-white">
            <div>
              <h3 className="font-black text-xl text-slate-800">{t('selectStudentsTitle')}</h3>
              <p className="text-[11px] font-bold mt-1 text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-lg inline-block border border-blue-100">
                {t('groupLabel')} {activeCat?.groups.find(g => g.id === assigningToGroup?.groupId)?.name}
              </p>
            </div>
            <button onClick={() => setAssigningToGroup(null)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors active:scale-95"><X size={18} /></button>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classStudents.map(student => {
                const isSelected = selectedStudentIds.has(student.id);
                const otherGroup = activeCat?.groups.find(g => g.id !== assigningToGroup?.groupId && g.studentIds.includes(student.id));
                
                return (
                  <div 
                    key={student.id}
                    onClick={() => toggleStudentSelection(student.id)}
                    className={`flex items-center p-3.5 rounded-[1.2rem] border-2 cursor-pointer transition-all active:scale-[0.98] ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 ${dir === 'rtl' ? 'ml-3' : 'mr-3'} shrink-0 transition-colors ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-slate-50'
                    }`}>
                      {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm truncate ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                        {getShortName(student.name)}
                      </p>
                      {otherGroup && !isSelected && (
                        <p className="text-[10px] font-bold mt-1 truncate text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-100">
                          {t('assignedToGroupLabel')} {otherGroup.name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-6 border-t border-slate-100 bg-white shrink-0">
            <button onClick={saveBulkAssignment} className="w-full py-4 rounded-[1.2rem] font-black text-sm shadow-lg shadow-blue-600/30 active:scale-95 transition-all bg-blue-600 text-white hover:bg-blue-700">
              {t('confirmAndAssignBtn')} ({selectedStudentIds.size})
            </button>
          </div>
          
        </div>
      </>

    </div>
  );
};

export default StudentGroups;