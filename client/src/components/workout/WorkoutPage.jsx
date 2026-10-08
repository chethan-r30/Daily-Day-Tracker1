import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const today = () => new Date().toISOString().split('T')[0];

export default function WorkoutPage() {
  const { user, updateUser } = useAuth();
  const [date, setDate] = useState(today());
  const [logs, setLogs] = useState([]);
  const [bmiData, setBmiData] = useState(null);
  const [showBMIForm, setShowBMIForm] = useState(!user?.height);
  const [bmiForm, setBmiForm] = useState({
    height: user?.height || '',
    weight: user?.weight || '',
    gender: user?.gender || 'male'
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWorkout, setNewWorkout] = useState({ name: '', reps: '', durationMinutes: '' });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const isToday = date === today();

  const fetchLogs = useCallback(async () => {
    const { data } = await api.get(`/workouts/logs/${date}`);
    setLogs(data);
  }, [date]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const getBMI = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/workouts/bmi', bmiForm);
      setBmiData(data);
      await api.put('/auth/profile', bmiForm);
      updateUser({ height: parseFloat(bmiForm.height), weight: parseFloat(bmiForm.weight), gender: bmiForm.gender });
      setShowBMIForm(false);
      toast.success('BMI calculated!');
    } catch { toast.error('Failed to calculate BMI'); }
  };

  const addWorkout = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/workouts/logs', { ...newWorkout, date });
      setLogs(prev => [...prev, data]);
      setNewWorkout({ name: '', reps: '', durationMinutes: '' });
      setShowAddForm(false);
      toast.success('Workout logged!');
    } catch { toast.error('Failed to add workout'); }
    finally { setLoading(false); }
  };

  const updateWorkout = async (id) => {
    try {
      const { data } = await api.put(`/workouts/logs/${id}`, editForm);
      setLogs(prev => prev.map(l => l._id === id ? data : l));
      setEditId(null);
      toast.success('Workout updated!');
    } catch { toast.error('Failed to update'); }
  };

  const deleteWorkout = async (id) => {
    if (!window.confirm('Delete this workout?')) return;
    await api.delete(`/workouts/logs/${id}`);
    setLogs(prev => prev.filter(l => l._id !== id));
    toast.success('Deleted');
  };

  const totalCalories = logs.reduce((s, l) => s + (l.caloriesBurned || 0), 0);
  const totalMinutes = logs.reduce((s, l) => s + (l.durationMinutes || 0), 0);

  const getBMIColor = (cat) => ({ 'Normal Weight': 'green', 'Underweight': 'blue', 'Overweight': 'yellow', 'Obese': 'red' }[cat] || 'blue');

  return (
    <div className="container" style={{ paddingTop: '8px' }}>
      <div className="page-header">
        <h1 className="page-title">💪 Workout Tracker</h1>
        <p className="page-subtitle">Log workouts, track calories, get AI-powered suggestions.</p>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="card-title" style={{ margin: 0 }}>📊 BMI & Health Profile</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowBMIForm(!showBMIForm)}>
            {showBMIForm ? 'Hide' : '⚙️ Update'}
          </button>
        </div>

        {showBMIForm && (
          <form onSubmit={getBMI} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="form-label">Height (cm)</label>
              <input className="form-input" type="number" placeholder="170" value={bmiForm.height}
                onChange={e => setBmiForm({ ...bmiForm, height: e.target.value })} required />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" type="number" placeholder="70" value={bmiForm.weight}
                onChange={e => setBmiForm({ ...bmiForm, weight: e.target.value })} required />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="form-label">Gender</label>
              <select className="form-input" value={bmiForm.gender}
                onChange={e => setBmiForm({ ...bmiForm, gender: e.target.value })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary" type="submit">Calculate BMI</button>
            </div>
          </form>
        )}

        {bmiData && (
          <div>
            <div className="grid-3" style={{ marginBottom: '16px' }}>
              <div className="stat-card">
                <div className="stat-value">{bmiData.bmi}</div>
                <div className="stat-label">Your BMI</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '18px' }}>{bmiData.category}</div>
                <div className="stat-label">BMI Category</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '18px' }}>{bmiData.idealWeightRange}</div>
                <div className="stat-label">Ideal Weight</div>
              </div>
              {bmiData.bodyFatPct && (
                <div className="stat-card">
                  <div className="stat-value">{bmiData.bodyFatPct}%</div>
                  <div className="stat-label">Est. Body Fat</div>
                </div>
              )}
              {bmiData.bodyFatCategory && (
                <div className="stat-card">
                  <div className="stat-value" style={{ fontSize: '16px' }}>{bmiData.bodyFatCategory}</div>
                  <div className="stat-label">Body Fat Category</div>
                </div>
              )}
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: '18px' }}>{bmiData.targetBMI}</div>
                <div className="stat-label">Target BMI</div>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>{bmiData.advice}</p>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>🏃 {bmiData.gender === 'female' ? '👩' : '👨'} Personalized Workout Plan:</div>
            {bmiData.workoutPlan.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 600, minWidth: '20px' }}>{i + 1}.</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}

        {!bmiData && !showBMIForm && user?.height && (
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Height: {user.height}cm | Weight: {user.weight}kg — Click "Update" to recalculate BMI.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div className="date-row" style={{ margin: 0 }}>
          <label>Date:</label>
          <input className="date-input" type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={async () => { const { data } = await api.get('/workouts/history'); setHistory(data); setShowHistory(true); }}>📅 History</button>
          {isToday && <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>+ Log Workout</button>}
        </div>
      </div>

      {logs.length > 0 && (
        <div className="grid-3" style={{ marginBottom: '20px' }}>
          <div className="stat-card"><div className="stat-value">{logs.length}</div><div className="stat-label">Workouts</div></div>
          <div className="stat-card"><div className="stat-value">{totalCalories}</div><div className="stat-label">Calories Burned</div></div>
          <div className="stat-card"><div className="stat-value">{totalMinutes}m</div><div className="stat-label">Total Time</div></div>
        </div>
      )}

      {showAddForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">Log New Workout</div>
          <form onSubmit={addWorkout}>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Workout Name</label>
                <input className="form-input" placeholder="e.g. Push-ups" value={newWorkout.name}
                  onChange={e => setNewWorkout({ ...newWorkout, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Reps / Sets</label>
                <input className="form-input" type="number" placeholder="e.g. 20" value={newWorkout.reps}
                  onChange={e => setNewWorkout({ ...newWorkout, reps: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input className="form-input" type="number" placeholder="e.g. 15" value={newWorkout.durationMinutes}
                  onChange={e => setNewWorkout({ ...newWorkout, durationMinutes: e.target.value })} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Getting AI advice...' : 'Log Workout'}</button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-title">{isToday ? "Today's Workouts" : `Workouts on ${date}`}</div>
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏋️</div>
            <h3>No workouts logged</h3>
            <p>Add your first workout for today.</p>
          </div>
        ) : logs.map(log => (
          <div key={log._id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '12px' }}>
            {editId === log._id ? (
              <div>
                <div className="grid-3" style={{ marginBottom: '12px' }}>
                  <div><label className="form-label">Name</label><input className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                  <div><label className="form-label">Reps</label><input className="form-input" type="number" value={editForm.reps} onChange={e => setEditForm({ ...editForm, reps: e.target.value })} /></div>
                  <div><label className="form-label">Minutes</label><input className="form-input" type="number" value={editForm.durationMinutes} onChange={e => setEditForm({ ...editForm, durationMinutes: e.target.value })} /></div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => updateWorkout(log._id)}>Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{log.name}</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      <span>🔄 {log.reps} reps</span>
                      <span>⏱️ {log.durationMinutes} min</span>
                      <span>🔥 {log.caloriesBurned} cal</span>
                      <span>💊 {log.proteinSuggested}g protein</span>
                    </div>
                  </div>
                  {isToday && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(log._id); setEditForm({ name: log.name, reps: log.reps, durationMinutes: log.durationMinutes }); }}>✏️</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => deleteWorkout(log._id)}>🗑️</button>
                    </div>
                  )}
                </div>
                {log.aiSuggestion && (
                  <div className="ai-box" style={{ marginTop: '12px' }}>
                    <div className="ai-box-title">🤖 AI Coach Tip</div>
                    <div className="ai-box-text">{log.aiSuggestion}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Workout History</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(false)}>✕</button>
            </div>
            {history.length === 0 ? <p style={{ color: 'var(--color-text-muted)' }}>No workout history yet.</p> :
              Object.entries(history.reduce((acc, l) => { acc[l.date] = acc[l.date] || []; acc[l.date].push(l); return acc; }, {})).map(([d, items]) => (
                <div key={d} style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>{d}</div>
                  {items.map(l => (
                    <div key={l._id} style={{ fontSize: '14px', padding: '6px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{l.name} — {l.reps} reps, {l.durationMinutes}min</span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>🔥 {l.caloriesBurned} cal</span>
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
