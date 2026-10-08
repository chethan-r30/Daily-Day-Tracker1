import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const today = () => new Date().toISOString().split('T')[0];
const getLast7Days = () => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - i));
  return d.toISOString().split('T')[0];
});

function getRating(pct) {
  if (pct >= 90) return { label: 'Excellent', color: '#437a22', bg: '#d1fae5' };
  if (pct >= 70) return { label: 'Good', color: '#01696f', bg: '#ccfbf1' };
  if (pct >= 40) return { label: 'Average', color: '#d19900', bg: '#fef9c3' };
  return { label: 'Poor', color: '#dc2626', bg: '#fee2e2' };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [activityHistory, setActivityHistory] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [studyHistory, setStudyHistory] = useState([]);
  const days = getLast7Days();

  useEffect(() => {
    api.get('/activities/history').then(r => setActivityHistory(r.data));
    api.get('/workouts/history').then(r => setWorkoutHistory(r.data));
    api.get('/study/history').then(r => setStudyHistory(r.data));
  }, []);

  const activityByDay = days.map(d => {
    const dayLogs = activityHistory.filter(l => l.date === d);
    if (!dayLogs.length) return 0;
    return Math.round((dayLogs.filter(l => l.completed).length / dayLogs.length) * 100);
  });
  const avgActivity = activityByDay.filter(Boolean).length ? Math.round(activityByDay.filter(Boolean).reduce((a, b) => a + b, 0) / activityByDay.filter(Boolean).length) : 0;

  const workoutByDay = days.map(d => workoutHistory.filter(l => l.date === d).reduce((s, l) => s + (l.caloriesBurned || 0), 0));
  const maxCalories = Math.max(...workoutByDay, 1);
  const avgWorkout = workoutByDay.filter(Boolean).length ? Math.round(workoutByDay.reduce((a, b) => a + b, 0) / 7) : 0;
  const workoutPct = Math.min(100, Math.round((avgCalories => avgCalories / 5)(avgWorkout)));

  const studyByDay = days.map(d => studyHistory.filter(l => l.date === d).reduce((s, l) => s + (l.minutesStudied || 0), 0));
  const targetMinutes = 120;
  const avgStudy = studyByDay.filter(Boolean).length ? Math.round(studyByDay.reduce((a, b) => a + b, 0) / 7) : 0;
  const studyPct = Math.min(100, Math.round((avgStudy / targetMinutes) * 100));

  const actRating = getRating(avgActivity);
  const wkRating = getRating(workoutPct);
  const stRating = getRating(studyPct);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } }
  };

  const labels = days.map(d => d.slice(5));

  return (
    <div className="container" style={{ paddingTop: '8px' }}>
      <div className="page-header">
        <h1 className="page-title">🏠 Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}!</h1>
        <p className="page-subtitle">Here's your 7-day performance overview.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Activities', rating: actRating, value: `${avgActivity}% avg completion`, link: '/activities', icon: '✅' },
          { label: 'Workouts', rating: wkRating, value: `${avgWorkout} avg cal/day`, link: '/workout', icon: '💪' },
          { label: 'Study', rating: stRating, value: `${avgStudy} avg min/day`, link: '/study', icon: '📚' }
        ].map(item => (
          <Link to={item.link} key={item.label} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ borderTop: `3px solid ${item.rating.color}`, transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '4px' }}>{item.icon} {item.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>{item.value}</div>
                </div>
                <span style={{ background: item.rating.bg, color: item.rating.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                  {item.rating.label}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid-2" style={{ gap: '20px' }}>
        <div className="card">
          <div className="card-title">✅ Activity Completion (7 days)</div>
          <div className="chart-box">
            <Bar data={{
              labels,
              datasets: [{ data: activityByDay, backgroundColor: '#01696f', borderRadius: 6 }]
            }} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 100, ticks: { callback: v => v + '%', font: { size: 11 } } } } }} />
          </div>
        </div>

        <div className="card">
          <div className="card-title">💪 Calories Burned (7 days)</div>
          <div className="chart-box">
            <Line data={{
              labels,
              datasets: [{ data: workoutByDay, borderColor: '#4f98a3', backgroundColor: 'rgba(79,152,163,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#4f98a3' }]
            }} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <div className="card-title">📚 Study Minutes (7 days)</div>
          <div className="chart-box">
            <Bar data={{
              labels,
              datasets: [{ data: studyByDay, backgroundColor: '#437a22', borderRadius: 6 }]
            }} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <div className="card-title">🎯 7-Day Rating Summary</div>
          <div className="chart-box" style={{ minHeight: '220px', maxWidth: '260px', margin: '0 auto' }}>
            <Doughnut data={{
              labels: ['Activities', 'Workout', 'Study'],
              datasets: [{ data: [avgActivity, Math.min(100, workoutPct), studyPct], backgroundColor: ['#01696f', '#4f98a3', '#437a22'], borderWidth: 0, hoverOffset: 6 }]
            }} options={{ maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom' } } }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Overall Score</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {Math.round((avgActivity + Math.min(100, workoutPct) + studyPct) / 3)}%
            </div>
            <span style={{ background: getRating(Math.round((avgActivity + Math.min(100, workoutPct) + studyPct) / 3)).bg, color: getRating(Math.round((avgActivity + Math.min(100, workoutPct) + studyPct) / 3)).color, padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
              {getRating(Math.round((avgActivity + Math.min(100, workoutPct) + studyPct) / 3)).label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
