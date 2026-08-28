import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Building,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
} from 'lucide-react';
import api from '../../services/api';

export const FacultyTimetablePage: React.FC = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('III Year');
  const [selectedSection, setSelectedSection] = useState<string>('Section A');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Modal Form Inputs
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1);
  const [formPeriodNumber, setFormPeriodNumber] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState<string>('09:00 AM');
  const [formEndTime, setFormEndTime] = useState<string>('09:55 AM');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formFacultyId, setFormFacultyId] = useState<string>('');
  const [formRoomNumber, setFormRoomNumber] = useState<string>('Lecture Hall 1');

  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dropdown data (Departments, Subjects, Faculty)
  useEffect(() => {
    api.get('/timetable/dropdown-data')
      .then((res) => {
        const depts = res.data.departments || [];
        setDepartments(depts);
        setSubjects(res.data.subjects || []);
        setFacultyList(res.data.faculty || []);
        if (depts.length > 0 && !selectedDeptId) {
          setSelectedDeptId(depts[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch timetable whenever filter changes
  const fetchTimetable = async () => {
    if (!selectedDeptId) return;
    setIsLoading(true);
    try {
      const res = await api.get('/timetable', {
        params: {
          departmentId: selectedDeptId,
          year: selectedYear,
          section: selectedSection,
        },
      });
      setSchedule(res.data.schedule || []);
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDeptId) {
      fetchTimetable();
    }
  }, [selectedDeptId, selectedYear, selectedSection]);

  const days = [
    { num: 1, name: 'Monday' },
    { num: 2, name: 'Tuesday' },
    { num: 3, name: 'Wednesday' },
    { num: 4, name: 'Thursday' },
    { num: 5, name: 'Friday' },
    { num: 6, name: 'Saturday' },
  ];

  const periods = [
    { num: 1, defaultStart: '09:00 AM', defaultEnd: '09:55 AM' },
    { num: 2, defaultStart: '09:55 AM', defaultEnd: '10:50 AM' },
    { num: 3, defaultStart: '11:10 AM', defaultEnd: '12:05 PM' },
    { num: 4, defaultStart: '01:00 PM', defaultEnd: '01:55 PM' },
    { num: 5, defaultStart: '01:55 PM', defaultEnd: '02:50 PM' },
    { num: 6, defaultStart: '02:50 PM', defaultEnd: '03:45 PM' },
  ];

  const handleOpenCreateModal = (dayNum = 1, periodNum = 1) => {
    setModalMode('CREATE');
    setEditingSlotId(null);
    setFormDayOfWeek(dayNum);
    setFormPeriodNumber(periodNum);

    const pConfig = periods.find((p) => p.num === periodNum) || periods[0];
    setFormStartTime(pConfig.defaultStart);
    setFormEndTime(pConfig.defaultEnd);

    const relevantSubjects = subjects.filter((s) => s.department_id === selectedDeptId);
    setFormSubjectId(relevantSubjects[0]?.id || subjects[0]?.id || '');
    setFormFacultyId(facultyList[0]?.id || '');
    setFormRoomNumber('Lecture Hall 101');
    setShowModal(true);
  };

  const handleOpenEditModal = (slot: any) => {
    setModalMode('EDIT');
    setEditingSlotId(slot.id);
    setFormDayOfWeek(slot.day_of_week);
    setFormPeriodNumber(slot.period_number);
    setFormStartTime(slot.start_time);
    setFormEndTime(slot.end_time);
    setFormSubjectId(slot.subject_id);
    setFormFacultyId(slot.faculty_id || '');
    setFormRoomNumber(slot.room_number || 'Lecture Hall 1');
    setShowModal(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectId) {
      setFeedback({ msg: 'Please select a subject', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'CREATE') {
        await api.post('/timetable', {
          departmentId: selectedDeptId,
          year: selectedYear,
          section: selectedSection,
          dayOfWeek: formDayOfWeek,
          periodNumber: formPeriodNumber,
          startTime: formStartTime,
          endTime: formEndTime,
          subjectId: formSubjectId,
          facultyId: formFacultyId || null,
          roomNumber: formRoomNumber,
        });
        setFeedback({ msg: 'Class slot added to timetable successfully!', type: 'success' });
      } else {
        await api.put(`/timetable/${editingSlotId}`, {
          subjectId: formSubjectId,
          facultyId: formFacultyId || null,
          startTime: formStartTime,
          endTime: formEndTime,
          roomNumber: formRoomNumber,
        });
        setFeedback({ msg: 'Class slot updated successfully!', type: 'success' });
      }

      setShowModal(false);
      fetchTimetable();
    } catch (err: any) {
      setFeedback({ msg: err.response?.data?.error || 'Failed to save timetable slot', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to remove this class slot from the timetable?')) return;

    try {
      await api.delete(`/timetable/${slotId}`);
      setFeedback({ msg: 'Slot removed from timetable', type: 'success' });
      fetchTimetable();
    } catch (err: any) {
      setFeedback({ msg: err.response?.data?.error || 'Failed to remove slot', type: 'error' });
    }
  };

  const currentDept = departments.find((d) => d.id === selectedDeptId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            <span>Timetable Builder & Schedule Manager</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Faculty and Admins can create, schedule, and update class timetables for all departments.
          </p>
        </div>

        <button
          onClick={() => handleOpenCreateModal(1, 1)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all flex items-center space-x-2 shadow-md shadow-indigo-600/30 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Class Slot</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Filter Bar: Department, Year, Section */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Department
          </label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Academic Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="I Year">I Year</option>
            <option value="II Year">II Year</option>
            <option value="III Year">III Year</option>
            <option value="IV Year">IV Year</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Section A">Section A</option>
            <option value="Section B">Section B</option>
            <option value="Section C">Section C</option>
          </select>
        </div>

        <div className="ml-auto text-right">
          <p className="text-xs font-black text-indigo-700">{currentDept?.name || 'Department'}</p>
          <p className="text-[11px] text-slate-400">{selectedYear} • {selectedSection} Schedule</p>
        </div>
      </div>

      {/* Timetable Interactive Matrix */}
      <div className="glass-card rounded-3xl p-6 overflow-x-auto shadow-xs">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-7 gap-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
            <div className="text-left pl-3 text-slate-700">Day / Period</div>
            {periods.map((p) => (
              <div key={p.num} className="bg-slate-50 py-2 rounded-xl border border-slate-100">
                <p className="text-slate-800 font-extrabold">Period {p.num}</p>
                <p className="text-[10px] text-slate-400 font-normal">{p.defaultStart.split(' ')[0]} - {p.defaultEnd}</p>
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {days.map((day) => (
              <div key={day.num} className="grid grid-cols-7 gap-3 py-3 items-stretch">
                <div className="text-left font-black text-slate-800 text-xs pl-3 flex items-center">
                  {day.name}
                </div>

                {periods.map((p) => {
                  const slot = schedule.find((s) => s.day_of_week === day.num && s.period_number === p.num);
                  return (
                    <div
                      key={p.num}
                      className={`p-3 rounded-2xl border text-left text-xs transition-all relative group flex flex-col justify-between min-h-[95px] ${
                        slot
                          ? 'bg-indigo-50/70 border-indigo-200/90 text-indigo-950 shadow-2xs hover:bg-indigo-50'
                          : 'bg-slate-50/40 border-dashed border-slate-200 text-slate-400 hover:bg-slate-100/60'
                      }`}
                    >
                      {slot ? (
                        <>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight truncate">{slot.subject_name}</p>
                            <span className="text-[10px] text-indigo-700 font-bold block">{slot.subject_code}</span>
                            <p className="text-[10px] text-slate-500 mt-1 truncate">
                              {slot.faculty_name || 'Faculty Assigned'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-indigo-100">
                            <span className="font-semibold text-slate-700">{slot.room_number || 'Lab 1'}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                              <button
                                onClick={() => handleOpenEditModal(slot)}
                                className="p-1 hover:bg-indigo-200/60 rounded text-indigo-800"
                                title="Edit Slot"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="p-1 hover:bg-rose-100 rounded text-rose-600"
                                title="Remove Slot"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div
                          onClick={() => handleOpenCreateModal(day.num, p.num)}
                          className="h-full w-full flex flex-col items-center justify-center cursor-pointer space-y-1 text-slate-400 hover:text-indigo-600"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-[10px] font-medium">+ Assign Slot</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Slot Creator / Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {modalMode === 'CREATE' ? 'Add Timetable Class Slot' : 'Edit Class Slot'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={formDayOfWeek}
                    onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  >
                    {days.map((d) => (
                      <option key={d.num} value={d.num}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Period Number</label>
                  <select
                    value={formPeriodNumber}
                    onChange={(e) => {
                      const pNum = Number(e.target.value);
                      setFormPeriodNumber(pNum);
                      const pConf = periods.find((p) => p.num === pNum);
                      if (pConf) {
                        setFormStartTime(pConf.defaultStart);
                        setFormEndTime(pConf.defaultEnd);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  >
                    {periods.map((p) => (
                      <option key={p.num} value={p.num}>Period {p.num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="09:55 AM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <select
                  required
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-700"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects
                    .filter((s) => !selectedDeptId || s.department_id === selectedDeptId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Faculty</label>
                  <select
                    value={formFacultyId}
                    onChange={(e) => setFormFacultyId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="">-- Select Professor --</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>{f.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room / Lab Number</label>
                  <input
                    type="text"
                    required
                    value={formRoomNumber}
                    onChange={(e) => setFormRoomNumber(e.target.value)}
                    placeholder="e.g. IT-Lab 102"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : modalMode === 'CREATE' ? 'Create Class Slot' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
