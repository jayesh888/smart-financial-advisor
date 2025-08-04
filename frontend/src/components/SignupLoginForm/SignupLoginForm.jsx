import React, { useState } from 'react';
import axios from 'axios';
import styles from './SignupLoginForm.module.css';

function SignupLoginForm({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    emailOrUsername: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [responseMsg, setResponseMsg] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponseMsg('Loading...');

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setResponseMsg("Passwords do not match.");
      return;
    }

    try {
      const payload = isLogin
        ? { emailOrUsername: formData.emailOrUsername, password: formData.password }
        : { username: formData.username, email: formData.email, password: formData.password };

      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`http://localhost:5000${endpoint}`, payload);
      setResponseMsg(response.data.message);

      if (isLogin && response.data.message.includes("successful")) {
        const profileExists = response.data.profileExists;
        onLoginSuccess(response.data.email, profileExists);
      } else if (!isLogin && response.data.message.includes("Registration successful")) {
        setResponseMsg("Registration successful. Please login to continue.");
        setIsLogin(true); 
      }
    } catch (error) {
      setResponseMsg(error.response?.data?.error || "Something went wrong.");
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          className={`${styles.tabButton} ${isLogin ? styles.activeTab : ''}`}
          onClick={() => setIsLogin(true)}
        >
          Login
        </button>
        <button
          className={`${styles.tabButton} ${!isLogin ? styles.activeTab : ''}`}
          onClick={() => setIsLogin(false)}
        >
          Register
        </button>
      </div>

      <h2 className={styles.title}>{isLogin ? 'Login' : 'Register'}</h2>

      <form onSubmit={handleSubmit}>
        {isLogin ? (
          <>
            <input
              className={styles.input}
              type="text"
              name="emailOrUsername"
              placeholder="Email or Username"
              onChange={handleChange}
              required
            />
            <input
              className={styles.input}
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
            <div className={styles.forgotPassword}>Forgot password?</div>
          </>
        ) : (
          <>
            <input
              className={styles.input}
              type="text"
              name="username"
              placeholder="Username"
              onChange={handleChange}
              required
            />
            <input
              className={styles.input}
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              required
            />
            <input
              className={styles.input}
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
            <input
              className={styles.input}
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              onChange={handleChange}
              required
            />
          </>
        )}
        <button className={styles.button} type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <p className={styles.message}>{responseMsg}</p>
    </div>
  );
}

export default SignupLoginForm;
