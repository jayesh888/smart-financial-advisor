import React, { useState, useEffect } from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate,useNavigate} from 'react-router-dom';

import SignupLoginForm from './components/SignupLoginForm/SignupLoginForm';
import ProfileForm from './components/ProfileForm/ProfileForm';
import Dashboard from './components/Dashboard/Dashboard';
import './App.css';

function AppWrapper() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    const profileFlag = localStorage.getItem('profileCompleted') === 'true';

    if (savedEmail) {
      setUserEmail(savedEmail);
      setIsLoggedIn(true);
      setProfileCompleted(profileFlag);
    }
  }, []);

  const handleLoginSuccess = (email, profileExists) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    setProfileCompleted(profileExists);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('profileCompleted', profileExists.toString());

    navigate(profileExists ? '/dashboard' : '/profile');
  };

  const handleProfileSaved = () => {
    setProfileCompleted(true);
    localStorage.setItem('profileCompleted', 'true');
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setUserEmail('');
    setProfileCompleted(false);
    setIsLoggedIn(false);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('profileCompleted');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '32px',
          fontWeight: '600',
          color: '#1e40af',
          fontFamily: 'Poppins, sans-serif',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 40px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #ccc',
          flexShrink: 0,
        }}
      >
        <span>Smart Financial Advisor</span>
        {isLoggedIn && profileCompleted && (
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Logout
          </button>
        )}
      </div>

      {/* Routes */}
      <div style={{ flexGrow: 1, overflow: 'auto' }}>
        <Routes>
          {!isLoggedIn ? (
            <Route path="*" element={<SignupLoginForm onLoginSuccess={handleLoginSuccess} />} />
          ) : !profileCompleted ? (
            <>
              <Route path="/profile" element={<ProfileForm email={userEmail} onProfileSaved={handleProfileSaved} />} />
              <Route path="*" element={<Navigate to="/profile" replace />} />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<Dashboard email={userEmail} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
