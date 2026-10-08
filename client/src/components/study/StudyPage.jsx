import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const today = () => new Date().toISOString().split('T')[0];

export default function StudyPage() {
  const [subjects, setSubjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState(today());
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', targetMinutesPerDay: 60 });
  const [editSubjectId, setEditSubjectId] = useState(null);
  const [editSubjectForm, setEditSubjectForm] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const isToday = date === today();

  const fetchSubjects = useCallback(async () => {
    const { data } = await api.get('/study/subjects');
    setSubjects(data);
  }, []);

  const fetchLogs = useCallback(async () => {
    const { data } = await api.get(`/study/logs/${date}`);
    setLogs(data);
  }, [date]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const addSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/study/subjects', newSubject);
      setNewSubject({ name: '', targetMinutesPerDay: 60 });
      setShowAddSubject(false);
      fetchSubjects(); fetchLogs();
      toast.success('Subject added!');
    } catch { toast.error('Failed to add subject'); }
  };

  const updateSubject = async (id) => {
    try {
      await api.put(`/study/subjects/${id}`, editSubjectForm);
      setEditSubjectId(null);
      fetchSubjects(); fetchLogs();
      toast.success('Subject updated!');
    } catch { toast.error('Failed to update subject'); }
  };

  const deleteSubject = async (id) => {
    if (!window.confirm('Remove this subject?')) return;
    await api.delete(`/study/subjects/${id}`);
    fetchSubjects(); fetchLogs();
    toast.success('Subject removed');
  };

  const updateLog = async (logId, topic, minutesStudied) => {
    try {
      const { data } = await api.put(`/study/logs/${logId}`, { topic, minutesStudied });
      setLogs(prev => prev.map(l => l._id === logId ? { ...data, targetMinutesPerDay: l.targetMinutesPerDay } : l));
    } catch { toast.error('Failed to save'); }
  };

  const totalMinutes = logs.reduce((s, l) => s + (l.minutesStudied || 0), 0);
  const totalTarget = subjects.reduce((s, sub) => s + (sub.targetMinutesPerDay || 60), 0);

  return (
    <div className="container" style={{ paddingTop: '8px' }}>
      <div className="page-header">
        <h1 className="page-title">📚 Study Tracker</h1>
        <p className="page-subtitle">Track your study sessions and hit your daily targets.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div className="date-row" style={{ margin: 0 }}>
          <label>Date:</label>
          <input className="date-input" type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={async () => { const { data } = await api.get('/study/history'); setHistory(data); setShowHistory(true); }}>📅 History</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddSubject(!showAddSubject)}>+ Add Subject</button>
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="grid-3" style={{ marginBottom: '20px' }}>
          <div className="stat-card"><div className="stat-value">{subjects.length}</div><div className="stat-label">Subjects</div></div>
          <div className="stat-card"><div className="stat-value">{totalMinutes}m</div><div className="stat-label">Studied Today</div></div>
          <div className="stat-card"><div className="stat-value">{totalTarget}m</div><div className="stat-label">Daily Target</div></div>
        </div>
      )}

      {showAddSubject && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">Add New Subject</div>
          <form onSubmit={addSubject}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: '200px' }}>
                <label className="form-label">Subject Name</label>
                <input className="form-input" placeholder="e.g. Mathematics" value={newSubject.name}
                  onChange={e => setNewSubject({ ...newSubject, name: e.target.value })} required autoFocus />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">Daily Target (minutes)</label>
                <input className="form-input" type="number" placeholder="60" value={newSubject.targetMinutesPerDay}
                  onChange={e => setNewSubject({ ...newSubject, targetMinutesPerDay: parseInt(e.target.value) })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button className="btn btn-primary" type="submit">Add Subject</button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowAddSubject(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-title">{isToday ? "Today's Study Log" : `Study Log for ${date}`}</div>
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <h3>No subjects yet</h3>
            <p>Add your first subject to start tracking.</p>
          </div>
        ) : logs.map(log => {
          const subject = subjects.find(s => s._id === log.subject?.toString() || s._id === log.subject);
          const target = log.targetMinutesPerDay || subject?.targetMinutesPerDay || 60;
          const pct = Math.min(100, Math.round((log.minutesStudied / target) * 100));
          return (
            <div key={log._id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  {editSubjectId === log.subject ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input className="form-input" value={editSubjectForm.name}
                        onChange={e => setEditSubjectForm({ ...editSubjectForm, name: e.target.value })}
                        style={{ padding: '4px 10px', fontSize: '15px', width: '180px' }} />
                      <input className="form-input" type="number" value={editSubjectForm.targetMinutesPerDay}
                        onChange={e => setEditSubjectForm({ ...editSubjectForm, targetMinutesPerDay: parseInt(e.target.value) })}
                        style={{ padding: '4px 10px', fontSize: '14px', width: '100px' }} placeholder="Target min" />
                      <button className="btn btn-primary btn-sm" onClick={() => updateSubject(log.subject)}>Save</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditSubjectId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ fontWeight: 700, fontSize: '16px' }}>{log.subjectName}
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: '8px' }}>Target: {target} min/day</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditSubjectId(log.subject); setEditSubjectForm({ name: log.subjectName, targetMinutesPerDay: target }); }}>✏️</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => deleteSubject(log.subject)}>🗑️</button>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  <span>{log.minutesStudied} min studied</span>
                  <span>{pct}% of target</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${pct >= 100 ? 'good' : pct >= 60 ? '' : 'warning'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <StudyLogInputs log={log} isToday={isToday} onSave={updateLog} />
            </div>
          );
        })}
      </div>

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Study History</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(false)}>✕</button>
            </div>
            {Object.entries(history.reduce((acc, l) => { acc[l.date] = acc[l.date] || []; acc[l.date].push(l); return acc; }, {})).slice(0, 14).map(([d, dayLogs]) => (
              <div key={d} style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>{d}</div>
                {dayLogs.map(l => (
                  <div key={l._id} style={{ fontSize: '14px', padding: '6px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{l.subjectName} {l.topic ? `— ${l.topic}` : ''}</span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{l.minutesStudied} min</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StudyLogInputs({ log, isToday, onSave }) {
  const [topic, setTopic] = useState(log.topic || '');
  const [minutes, setMinutes] = useState(log.minutesStudied || 0);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSave(log._id, topic, minutes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ flex: 2, minWidth: '180px' }}>
        <label className="form-label">Topic studied</label>
        <input className="form-input" placeholder="e.g. Calculus - Integration" value={topic}
          onChange={e => setTopic(e.target.value)} disabled={!isToday} />
      </div>
      <div style={{ flex: 1, minWidth: '130px' }}>
        <label className="form-label">Minutes studied</label>
        <input className="form-input" type="number" min="0" value={minutes}
          onChange={e => setMinutes(parseInt(e.target.value) || 0)} disabled={!isToday} />
      </div>
      {isToday && (
        <button className={`btn btn-sm ${saved ? 'btn-ghost' : 'btn-secondary'}`} onClick={handleSave}>
          {saved ? '✅ Saved' : 'Save'}
        </button>
      )}
    </div>
  );
}
