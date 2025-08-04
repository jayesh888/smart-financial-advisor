import React, { useEffect, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import ChatBox from '../ChatBox/ChatBox';
import styles from './Dashboard.module.css';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

function Dashboard({ email }) {
  const [activeSection, setActiveSection] = useState('allocation');

  const [allocations, setAllocations] = useState([]);
  const [suggestion, setSuggestion] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [marketRates, setMarketRates] = useState({ stock: 0, mf: 0, fd: 0 });

  const [stockPercent, setStockPercent] = useState(0);
  const [mfPercent, setMfPercent] = useState(0);
  const [fdPercent, setFdPercent] = useState(0);
  const [customReturn, setCustomReturn] = useState(0);

  const [manualRisk, setManualRisk] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);

  const fetchAgentData = useCallback(async (overrideRisk = null, initialize = false) => {
    try {
      const payload = { email };
      if (overrideRisk) payload.risk_override = overrideRisk;

      const res = await axios.post('http://localhost:5000/agent', payload);

      setAllocations(res.data.allocation || []);
      setSuggestion(res.data.suggestion || '');
      setMarketRates({
        stock: res.data.stock_return,
        mf: res.data.mf_return,
        fd: res.data.fd_return
      });

      if (initialize && res.data.risk_appetite) {
        setRiskLevel(res.data.risk_appetite);
        setManualRisk(res.data.risk_appetite);

        const allocMap = {
          High: { stock: 70, mf: 20, fd: 10 },
          Medium: { stock: 40, mf: 40, fd: 20 },
          Low: { stock: 10, mf: 40, fd: 50 }
        };
        const defaultAlloc = allocMap[res.data.risk_appetite];
        setStockPercent(defaultAlloc.stock);
        setMfPercent(defaultAlloc.mf);
        setFdPercent(defaultAlloc.fd);
      }
    } catch (error) {
      console.error("Error fetching agent data:", error);
    }
  }, [email]);

  useEffect(() => {
    fetchAgentData(null, true);
  }, [fetchAgentData]);

  useEffect(() => {
    const total = stockPercent + mfPercent + fdPercent;
    if (total === 100) {
      const expected = (
        stockPercent * marketRates.stock +
        mfPercent * marketRates.mf +
        fdPercent * marketRates.fd
      ) / 100;
      setCustomReturn(expected);
    }
  }, [stockPercent, mfPercent, fdPercent, marketRates]);

  const handleRiskChange = (value) => {
    setRiskLevel(value);
    fetchAgentData(value);
  };

  const handleComparePlan = async () => {
    try {
      const res = await axios.post('http://localhost:5000/agent/compare', {
        email,
        custom_allocation: {
          Stocks: stockPercent,
          MutualFunds: mfPercent,
          FixedDeposits: fdPercent
        },
        risk: manualRisk
      });
      setComparisonResult(res.data);
    } catch (err) {
      console.error("Comparison failed:", err);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{
        width: '78vw',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        <div className={styles.toggleButtons}>
          <button
            className={`${styles.toggleButton} ${activeSection === 'allocation' ? styles.activeButton : ''}`}
            onClick={() => setActiveSection('allocation')}
          >
            View Investment Allocation
          </button>

          <button
            className={`${styles.toggleButton} ${activeSection === 'manual' ? styles.activeButton : ''}`}
            onClick={() => setActiveSection('manual')}
          >
            View Manual Simulator
          </button>
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          minHeight: 0
        }}>
          {activeSection === 'allocation' && (
            <>
              <h2>Investment Allocation</h2>

              <label><strong>Simulate Risk Level:</strong></label><br />
<div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
  {['Low', 'Medium', 'High'].map((level) => (
    <button
      key={level}
      onClick={() => handleRiskChange(level)}
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        border: '1px solid #0088FE',
        backgroundColor: riskLevel === level ? '#0088FE' : '#fff',
        color: riskLevel === level ? '#fff' : '#0088FE',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s',
        boxShadow: riskLevel === level ? '0 0 10px rgba(0, 136, 254, 0.3)' : 'none'
      }}
    >
      {level}
    </button>
  ))}
</div>


              {allocations.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={allocations}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {allocations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p>Loading chart...</p>
              )}

              <h3>Agent's Suggestion:</h3>
              <p>{suggestion || 'Loading...'}</p>
            </>
          )}

          {activeSection === 'manual' && (
            <>
              <h3>Manual Allocation Simulator</h3>
              <p>Adjust the sliders below to simulate your own investment allocation. Total must stay within 100%.</p>

              {/* Sliders */}
              <div style={{ marginBottom: '10px' }}>
                <label>Stocks: {stockPercent}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stockPercent}
                  onChange={(e) => {
                    const newVal = Number(e.target.value);
                    const diff = newVal - stockPercent;
                    const total = stockPercent + mfPercent + fdPercent;
                    if (diff <= 0 || total + diff <= 100) setStockPercent(newVal);
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Mutual Funds: {mfPercent}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mfPercent}
                  onChange={(e) => {
                    const newVal = Number(e.target.value);
                    const diff = newVal - mfPercent;
                    const total = stockPercent + mfPercent + fdPercent;
                    if (diff <= 0 || total + diff <= 100) setMfPercent(newVal);
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Fixed Deposits: {fdPercent}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={fdPercent}
                  onChange={(e) => {
                    const newVal = Number(e.target.value);
                    const diff = newVal - fdPercent;
                    const total = stockPercent + mfPercent + fdPercent;
                    if (diff <= 0 || total + diff <= 100) setFdPercent(newVal);
                  }}
                />
              </div>

              <div><strong>Total:</strong> {stockPercent + mfPercent + fdPercent}%</div>

              {stockPercent + mfPercent + fdPercent === 100 && (
                <>
                  <p><strong>Expected Return:</strong> {customReturn.toFixed(2)}% annually</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { category: 'Stocks', value: stockPercent },
                          { category: 'Mutual Funds', value: mfPercent },
                          { category: 'Fixed Deposits', value: fdPercent }
                        ]}
                        dataKey="value"
                        nameKey="category"
                        cx="50%" cy="50%" outerRadius={90}
                        label
                      >
                        <Cell fill="#0088FE" />
                        <Cell fill="#00C49F" />
                        <Cell fill="#FFBB28" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              )}

              <div style={{ marginTop: '30px' }}>
                <h4>Compare with Agent Plan</h4>
                <label>Choose Risk Level for Comparison:</label><br />
                <select
                  value={manualRisk}
                  onChange={(e) => setManualRisk(e.target.value)}
                  className={styles.riskSelect}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                <div style={{ marginTop: '10px' }}>
                  <button onClick={handleComparePlan} className={styles.compareButton}>
                    Compare My Plan
                  </button>
                </div>


                {comparisonResult && (
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>Your Plan Return:</strong> {comparisonResult.user_expected_return.toFixed(2)}%</p>
                    <p><strong>Agent Optimal Return:</strong> {comparisonResult.agent_expected_return.toFixed(2)}%</p>
                    <p><strong>Suggestion:</strong> {comparisonResult.recommendation}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ width: '22vw', height: '100vh', borderLeft: '2px solid #ccc' }}>
        <ChatBox email={email} />
      </div>
    </div>
  );
}

export default Dashboard;
