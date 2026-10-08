import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: '🏠 Home' },
    { path: '/activities', label: '✅ Activities' },
    { path: '/workout', label: '💪 Workout' },
    { path: '/study', label: '📚 Study' },
    { path: '/timetable', label: '🗓️ Timetable' },
    { path: '/whatsnew', label: '✨ What’s New' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Daily Tracker">
            <rect width="32" height="32" rx="8" fill="#01696f" />
            <path d="M8 10h16M8 16h10M8 22h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="24" cy="22" r="4" fill="#4f98a3" />
            <path d="M22.5 22l1 1 2-2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>DailyTracker</span>
        </Link>

        <div className="nav-desktop">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <span className="nav-user">Hi, {user?.name?.split(' ')[0]}</span>
          <button className="btn btn-secondary btn-sm hide-mobile" onClick={handleLogout}>Logout</button>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <div className="container mobile-menu-inner">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`mobile-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      )}
    </nav>
  );
}
