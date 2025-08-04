import React, { useState } from 'react';
import axios from 'axios';
import styles from './ProfileForm.module.css';

function ProfileForm({ email, onProfileSaved }) {
  const [formData, setFormData] = useState({
    name: '',
    monthly_income: '',
    monthly_expenses: '',
    risk_appetite: '',
    financial_goal: '',
    investment_horizon: ''
  });

  const [responseMsg, setResponseMsg] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponseMsg('Submitting...');

    try {
      const response = await axios.post('http://localhost:5000/profile', {
        ...formData,
        email
      });

      setResponseMsg(response.data.message);

      if (response.data.message.includes("success")) {
        onProfileSaved();
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setResponseMsg(error.response.data.error);
      } else {
        setResponseMsg("Something went wrong");
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.profileCard}>
        <h2 className={styles.title}>Complete Your Financial Profile</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="monthly_income"
            placeholder="Monthly Income"
            type="number"
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="monthly_expenses"
            placeholder="Monthly Expenses"
            type="number"
            onChange={handleChange}
            required
          />
          <select
            className={styles.input}
            name="risk_appetite"
            onChange={handleChange}
            required
          >
            <option value="">Select Risk Appetite</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <input
            className={styles.input}
            name="financial_goal"
            placeholder="Financial Goal (e.g. Retirement)"
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            name="investment_horizon"
            placeholder="Investment Horizon (Years)"
            type="number"
            onChange={handleChange}
            required
          />
          <button className={styles.button} type="submit">Save Profile</button>
        </form>
        {responseMsg && <p className={styles.responseMsg}>{responseMsg}</p>}
      </div>
    </div>
  );
}

export default ProfileForm;
