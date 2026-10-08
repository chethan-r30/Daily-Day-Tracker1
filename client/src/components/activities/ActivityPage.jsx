import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const today = () => new Date().toISOString().split('T')[0];

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState(today());
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const isToday = date === today();

  const fetchActivities = useCallback(async () => {
    const { data } = await api.get('/activities');
    setActivities(data);
  }, []);

  const fetchLogs = useCallback(async () => {
    const { data } = await api.get(`/activities/logs/${date}`);
    setLogs(data);
  }, [date]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const addActivity = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.post('/activities', { name: newName.trim() });
      setNewName(''); setShowAdd(false);
      fetchActivities(); fetchLogs();
      toast.success('Activity added!');
    } catch { toast.error('Failed to add activity'); }
  };

  const toggleComplete = async (log) => {
    try {
      const { data } = await api.put(`/activities/logs/${log._id}/toggle`, { completed: !log.completed, note: log.note });
      setLogs(prev => prev.map(l => l._id === log._id ? data : l));
    } catch { toast.error('Failed to update'); }
  };

  const deleteActivity = async (id) => {
    if (!window.confirm('Remove this activity?')) return;
    try {
      await api.delete(`/activities/${id}`);
      fetchActivities(); fetchLogs();
      toast.success('Activity removed');
    } catch { toast.error('Failed to delete'); }
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/activities/${id}`, { name: editName });
      setEditId(null);
      fetchActivities(); fetchLogs();
      toast.success('Activity updated!');
    } catch { toast.error('Failed to update'); }
  };

  const loadHistory = async () => {
    const { data } = await api.get('/activities/history');
    setHistory(data);
    setShowHistory(true);
  };

  const completedCount = logs.filter(l => l.completed).length;
  const total = logs.length;

  return (
    <div className="container" style={{ paddingTop: '8px' }}>
      <div className="page-header">
        <h1 className="page-title">✅ Daily Activities</h1>
        <p className="page-subtitle">Track your daily habits — every day, every check matters.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div className="date-row" style={{ margin: 0 }}>
          <label>Date:</label>
          <input className="date-input" type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} />
          {!isToday && <span className="badge badge-yellow">Viewing past</span>}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadHistory}>📅 History</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>+ Add Activity</button>
        </div>
      </div>

      {total > 0 && (
        <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Today's Progress</span>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{completedCount}/{total} done</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${total ? (completedCount / total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {showAdd && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <form onSubmit={addActivity} style={{ display: 'flex', gap: '10px' }}>
            <input className="form-input" placeholder="Activity name (e.g. Morning Walk)" value={newName}
              onChange={e => setNewName(e.target.value)} style={{ flex: 1 }} autoFocus />
            <button className="btn btn-primary" type="submit">Add</button>
            <button className="btn btn-ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          {isToday ? "Today's Activities" : `Activities on ${date}`}
        </div>
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No activities yet</h3>
            <p>Add your first daily activity to start tracking.</p>
          </div>
        ) : logs.map(log => (
          <div key={log._id} className={`checkbox-item ${log.completed ? 'completed' : ''}`}>
            <input type="checkbox" checked={log.completed} onChange={() => toggleComplete(log)} />
            {editId === log.activity ? (
              <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)}
                style={{ flex: 1, padding: '4px 10px', fontSize: '14px' }} autoFocus />
            ) : (
              <span className={`checkbox-label ${log.completed ? 'done' : ''}`}>{log.activityName}</span>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              {isToday && (
                editId === log.activity
                  ? <><button className="btn btn-primary btn-sm" onClick={() => saveEdit(log.activity)}>Save</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button></>
                  : <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(log.activity); setEditName(log.activityName); }}>✏️</button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => deleteActivity(log.activity)} style={{ color: 'var(--color-error)' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Activity History</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(false)}>✕</button>
            </div>
            {Object.entries(
              history.reduce((acc, log) => { acc[log.date] = acc[log.date] || []; acc[log.date].push(log); return acc; }, {})
            ).slice(0, 14).map(([d, dayLogs]) => (
              <div key={d} style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>{d}</div>
                {dayLogs.map(l => (
                  <div key={l._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '16px' }}>{l.completed ? '✅' : '⬜'}</span>
                    <span style={{ fontSize: '14px', color: l.completed ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{l.activityName}</span>
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
