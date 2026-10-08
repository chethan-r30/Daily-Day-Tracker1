import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const today = () => new Date().toISOString().split('T')[0];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetablePage() {
  const [settings, setSettings] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [hours, setHours] = useState([]);
  const [setupForm, setSetupForm] = useState({ wakeUpTime: '06:00', sleepTime: '22:00' });
  const [showSetup, setShowSetup] = useState(false);
  const [editCell, setEditCell] = useState(null); // { day, hour }
  const [editTask, setEditTask] = useState('');
  const [date, setDate] = useState(today());
  const [dailyLogs, setDailyLogs] = useState([]);
  const [missedForms, setMissedForms] = useState({});
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'daily'

  const fetchTimetable = useCallback(async () => {
    const { data } = await api.get('/timetable');
    if (data.settings) {
      setSettings(data.settings);
      setHours(generateHours(data.settings.wakeUpTime, data.settings.sleepTime));
    }
    if (data.timetable) setTimetable(data.timetable);
  }, []);

  const fetchDailyLogs = useCallback(async () => {
    if (!settings) return;
    const { data } = await api.get(`/timetable/daily/${date}`);
    setDailyLogs(data);
    setAiSuggestion('');
    const forms = {};
    data.forEach(l => { if (!l.completed) forms[l._id] = l.missedReason || ''; });
    setMissedForms(forms);
  }, [date, settings]);

  useEffect(() => { fetchTimetable(); }, [fetchTimetable]);
  useEffect(() => { fetchDailyLogs(); }, [fetchDailyLogs]);

  function generateHours(wakeUp, sleep) {
    const hrs = [];
    const [wH] = wakeUp.split(':').map(Number);
    let [sH] = sleep.split(':').map(Number);
    if (sH <= wH) sH += 24;
    for (let h = wH; h < sH; h++) hrs.push(`${String(h % 24).padStart(2, '0')}:00`);
    return hrs;
  }

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/timetable/settings', setupForm);
      setSettings({ wakeUpTime: setupForm.wakeUpTime, sleepTime: setupForm.sleepTime });
      setHours(generateHours(setupForm.wakeUpTime, setupForm.sleepTime));
      setTimetable({ periods: data.periods });
      setShowSetup(false);
      toast.success('Timetable created!');
      fetchDailyLogs();
    } catch { toast.error('Failed to save settings'); }
  };

  const saveCell = async (day, hour) => {
    try {
      await api.put('/timetable/cell', { day, hour, task: editTask });
      setTimetable(prev => ({
        ...prev,
        periods: prev.periods.map(p =>
          p.day === day && p.hour === hour ? { ...p, task: editTask } : p
        )
      }));
      setEditCell(null);
      toast.success('Task saved!');
    } catch { toast.error('Failed to save task'); }
  };

  const getTask = (day, hour) => {
    if (!timetable) return '';
    const p = timetable.periods.find(p => p.day === day && p.hour === hour);
    return p?.task || '';
  };

  const toggleComplete = async (log) => {
    try {
      const { data } = await api.put(`/timetable/daily/${log._id}`, {
        completed: !log.completed,
        missedReason: missedForms[log._id] || ''
      });
      setDailyLogs(prev => prev.map(l => l._id === log._id ? data : l));
      if (!log.completed) {
        setMissedForms(prev => { const n = { ...prev }; delete n[log._id]; return n; });
      } else {
        setMissedForms(prev => ({ ...prev, [log._id]: '' }));
      }
    } catch { toast.error('Failed to update'); }
  };

  const saveMissedReason = async (log) => {
    try {
      const { data } = await api.put(`/timetable/daily/${log._id}`, {
        completed: false,
        missedReason: missedForms[log._id] || ''
      });
      setDailyLogs(prev => prev.map(l => l._id === log._id ? data : l));
      toast.success('Reason saved!');
    } catch { toast.error('Failed to save reason'); }
  };

  const getAISuggestion = async () => {
    const missed = dailyLogs.filter(l => !l.completed && l.task);
    setAiLoading(true);
    try {
      const { data } = await api.post('/timetable/ai-suggestion', {
        missedPeriods: missed.map(l => ({ hour: l.hour, task: l.task, missedReason: missedForms[l._id] || l.missedReason || '' }))
      });
      setAiSuggestion(data.suggestion);
    } catch { toast.error('AI suggestion failed'); }
    finally { setAiLoading(false); }
  };

  const completedCount = dailyLogs.filter(l => l.completed).length;
  const missedCount = dailyLogs.filter(l => !l.completed && l.task).length;
  const currentDay = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="container" style={{ paddingTop: '8px' }}>
      <div className="page-header">
        <h1 className="page-title">🗓️ Weekly Timetable</h1>
        <p className="page-subtitle">Plan your week hour by hour. Track what you do and why you don't.</p>
      </div>

      {/* Top controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn btn-sm ${activeTab === 'grid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('grid')}>📋 Weekly Grid</button>
          <button className={`btn btn-sm ${activeTab === 'daily' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('daily')}>✅ Daily Check</button>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { setShowSetup(true); if (settings) setSetupForm({ wakeUpTime: settings.wakeUpTime, sleepTime: settings.sleepTime }); }}>
          ⚙️ {settings ? 'Update Schedule' : 'Setup Timetable'}
        </button>
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <div className="modal-overlay" onClick={() => setShowSetup(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">⏰ Set Your Daily Schedule</h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              We'll build an hourly timetable grid between your wake-up and sleep time.
            </p>
            <form onSubmit={saveSettings}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">🌅 Wake Up Time</label>
                  <input className="form-input" type="time" value={setupForm.wakeUpTime}
                    onChange={e => setSetupForm({ ...setupForm, wakeUpTime: e.target.value })} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">🌙 Sleep Time</label>
                  <input className="form-input" type="time" value={setupForm.sleepTime}
                    onChange={e => setSetupForm({ ...setupForm, sleepTime: e.target.value })} required />
                </div>
              </div>
              {setupForm.wakeUpTime && setupForm.sleepTime && (
                <p style={{ fontSize: '13px', color: 'var(--color-primary)', marginBottom: '12px', fontWeight: 600 }}>
                  ⏱️ {generateHours(setupForm.wakeUpTime, setupForm.sleepTime).length} hourly slots will be created per day
                </p>
              )}
              <div className="modal-actions">
                <button className="btn btn-ghost" type="button" onClick={() => setShowSetup(false)}>Cancel</button>
                <button className="btn btn-primary" type="submit">Create Timetable</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* No timetable yet */}
      {!settings && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🗓️</div>
            <h3>No Timetable Setup Yet</h3>
            <p>Click "Setup Timetable" to enter your wake-up and sleep time. We'll build your weekly schedule automatically.</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowSetup(true)}>
              Setup Timetable
            </button>
          </div>
        </div>
      )}

      {/* ===== WEEKLY GRID TAB ===== */}
      {settings && activeTab === 'grid' && timetable && (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            ⏰ Schedule: <strong>{settings.wakeUpTime}</strong> → <strong>{settings.sleepTime}</strong> &nbsp;|&nbsp;
            Click any cell to assign a task
          </div>

          {/* Scrollable grid */}
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: `${hours.length * 110 + 120}px`, width: '100%' }}>
              <thead>
                <tr style={{ background: 'var(--color-primary)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#fff', minWidth: '110px', position: 'sticky', left: 0, background: 'var(--color-primary)', zIndex: 2 }}>
                    Day / Time
                  </th>
                  {hours.map(h => (
                    <th key={h} style={{ padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#fff', minWidth: '100px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, di) => (
                  <tr key={day} style={{ background: di % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)' }}>
                    <td style={{
                      padding: '10px 14px', fontWeight: 700, fontSize: '13px', color: 'var(--color-primary)',
                      position: 'sticky', left: 0, background: di % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)',
                      zIndex: 1, borderRight: '2px solid var(--color-border)'
                    }}>
                      {day.slice(0, 3)}
                    </td>
                    {hours.map(hour => {
                      const task = getTask(day, hour);
                      const isEditing = editCell?.day === day && editCell?.hour === hour;
                      return (
                        <td key={hour} style={{ padding: '4px', borderLeft: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', verticalAlign: 'top', minWidth: '100px' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <input
                                className="form-input"
                                value={editTask}
                                onChange={e => setEditTask(e.target.value)}
                                style={{ padding: '4px 6px', fontSize: '12px', minWidth: '90px' }}
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') saveCell(day, hour); if (e.key === 'Escape') setEditCell(null); }}
                              />
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button className="btn btn-primary btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={() => saveCell(day, hour)}>✓</button>
                                <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={() => setEditCell(null)}>✕</button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => { setEditCell({ day, hour }); setEditTask(task); }}
                              style={{
                                padding: '6px 8px', minHeight: '44px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                                fontSize: '12px', color: task ? 'var(--color-text)' : 'var(--color-text-faint)',
                                background: task ? 'rgba(1,105,111,0.07)' : 'transparent',
                                transition: 'background var(--transition)',
                                lineHeight: '1.4'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(1,105,111,0.12)'}
                              onMouseLeave={e => e.currentTarget.style.background = task ? 'rgba(1,105,111,0.07)' : 'transparent'}
                            >
                              {task || <span style={{ fontSize: '11px' }}>+ add</span>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '10px' }}>💡 Click any cell to edit. Press Enter to save, Escape to cancel.</p>
        </div>
      )}

      {/* ===== DAILY CHECK TAB ===== */}
      {settings && activeTab === 'daily' && (
        <div>
          {/* Date picker */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div className="date-row" style={{ margin: 0 }}>
              <label>Date:</label>
              <input className="date-input" type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} />
              <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '14px' }}>{currentDay}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={getAISuggestion} disabled={aiLoading}>
              {aiLoading ? '⏳ Analyzing...' : '🤖 Get AI Tips'}
            </button>
          </div>

          {/* Stats */}
          {dailyLogs.length > 0 && (
            <div className="grid-3" style={{ marginBottom: '20px' }}>
              <div className="stat-card"><div className="stat-value">{dailyLogs.length}</div><div className="stat-label">Total Slots</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-success)' }}>{completedCount}</div><div className="stat-label">Completed</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-error)' }}>{missedCount}</div><div className="stat-label">Missed</div></div>
            </div>
          )}

          {/* Progress bar */}
          {dailyLogs.length > 0 && (
            <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Day Progress</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {dailyLogs.length ? Math.round((completedCount / dailyLogs.length) * 100) : 0}%
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${dailyLogs.length ? (completedCount / dailyLogs.length) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {/* AI Suggestion */}
          {aiSuggestion && (
            <div className="ai-box" style={{ marginBottom: '20px' }}>
              <div className="ai-box-title">🤖 AI Time Management Coach</div>
              <div className="ai-box-text">{aiSuggestion}</div>
            </div>
          )}

          {/* Daily log list */}
          <div className="card">
            <div className="card-title">📋 {currentDay}'s Schedule</div>
            {dailyLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>No tasks for this day</h3>
                <p>Go to the Weekly Grid tab and fill in your tasks first.</p>
              </div>
            ) : dailyLogs.map(log => (
              <div key={log._id} style={{ marginBottom: '12px' }}>
                {/* Period row */}
                <div className={`checkbox-item ${log.completed ? 'completed' : ''}`} style={{ marginBottom: log.completed || !log.task ? '0' : '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', minWidth: '52px' }}>{log.hour}</span>
                  <input type="checkbox" checked={log.completed} onChange={() => toggleComplete(log)} />
                  <span className={`checkbox-label ${log.completed ? 'done' : ''}`} style={{ flex: 1 }}>
                    {log.task || <span style={{ color: 'var(--color-text-faint)', fontStyle: 'italic' }}>No task assigned</span>}
                  </span>
                  {log.completed && <span style={{ fontSize: '18px' }}>✅</span>}
                  {!log.completed && log.missedReason && (
                    <span className="badge badge-red" style={{ fontSize: '11px' }}>Reason saved</span>
                  )}
                </div>

                {/* Missed reason card — shows only if task exists and NOT completed */}
                {!log.completed && log.task && (
                  <div style={{
                    background: '#fff8f8', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)',
                    padding: '12px 14px', marginLeft: '0'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-error)', marginBottom: '8px' }}>
                      ❓ Why couldn't you complete <strong>"{log.task}"</strong> at {log.hour}?
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        className="form-input"
                        placeholder="e.g. Got distracted by phone, felt tired, something urgent came up..."
                        value={missedForms[log._id] || ''}
                        onChange={e => setMissedForms(prev => ({ ...prev, [log._id]: e.target.value }))}
                        style={{ flex: 1, minWidth: '200px', fontSize: '13px', padding: '8px 12px' }}
                      />
                      <button className="btn btn-sm" style={{ background: 'var(--color-error)', color: '#fff' }}
                        onClick={() => saveMissedReason(log)}>
                        Save Reason
                      </button>
                    </div>
                    {/* Quick reason chips */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {['Phone distraction', 'Felt tired', 'Forgot', 'Something urgent', 'Took too long'].map(r => (
                        <button key={r} className="btn btn-ghost btn-sm"
                          style={{ fontSize: '11px', padding: '3px 10px', border: '1px solid var(--color-border)', borderRadius: '20px' }}
                          onClick={() => setMissedForms(prev => ({ ...prev, [log._id]: r }))}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}