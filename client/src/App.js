import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/home/Dashboard';
import ActivityPage from './components/activities/ActivityPage';
import WorkoutPage from './components/workout/WorkoutPage';
import StudyPage from './components/study/StudyPage';
import WhatsNewPage from './components/whatsnew/WhatsNewPage';
import TimetablePage from './components/timetable/TimetablePage';

// Add route inside <Routes>


const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  return user ? children : <Navigate to="/login" />;
};

const AppLayout = () => {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/activities" element={<PrivateRoute><ActivityPage /></PrivateRoute>} />
          <Route path="/workout" element={<PrivateRoute><WorkoutPage /></PrivateRoute>} />
          <Route path="/study" element={<PrivateRoute><StudyPage /></PrivateRoute>} />
          <Route path="/timetable" element={<PrivateRoute><TimetablePage /></PrivateRoute>} />
          <Route path="/whatsnew" element={<PrivateRoute><WhatsNewPage /></PrivateRoute>} />
        </Routes>
      </main>
      {user && <Footer />}
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
