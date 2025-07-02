import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar as CalendarIcon, Search, Edit2, Plus, Trash2 } from "lucide-react";
import "./Dashboard.css";

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                   */
/* -------------------------------------------------------------------------- */
// Initial data for the line chart (monthly trends)
const initialLineData = [
  { name: "Jan", baskets: 400, welfares: 200, offerings: 300, donations: 150 },
  { name: "Feb", baskets: 450, welfares: 250, offerings: 350, donations: 200 },
  { name: "Mar", baskets: 400, welfares: 180, offerings: 280, donations: 120 },
  { name: "Apr", baskets: 500, welfares: 300, offerings: 400, donations: 250 },
  { name: "May", baskets: 480, welfares: 280, offerings: 380, donations: 220 },
];

// Initial data for the bar chart (quarterly giving)
const initialBarData = [
  { id: 1, name: "Q1 2023", baskets: 1250, welfares: 630, offerings: 930, donations: 470 },
  { id: 2, name: "Q2 2023", baskets: 1350, welfares: 730, offerings: 1030, donations: 570 },
  { id: 3, name: "Q3 2023", baskets: 1430, welfares: 820, offerings: 1120, donations: 650 },
];

// Initial data for the pie chart (category distribution)
const initialPieData = [
  { name: "Baskets", value: 4030, color: "#3b82f6" },
  { name: "Welfares", value: 2180, color: "#b9103a" },
  { name: "Offerings", value: 3080, color: "#10b981" },
  { name: "Donations", value: 1690, color: "#fbbf24" },
];

// Sample transactions data
const initialTransactions = [
  { id: "01e4daa", user: "Tithes Collection", date: "2023-05-15", amount: 1250, category: "Baskets" },
  { id: "01e4dab", user: "Church Building Fund", date: "2023-05-16", amount: 350, category: "Donations" },
  { id: "0315daaa", user: "Pastor's Welfare", date: "2023-05-17", amount: 450, category: "Welfares" },
  { id: "51034szv", user: "Sunday Service", date: "2023-05-18", amount: 280, category: "Offerings" },
  { id: "01e4dac", user: "Benevolence Fund", date: "2023-05-19", amount: 180, category: "Welfares" },
  { id: "01e4dad", user: "Thanksgiving Service", date: "2023-05-20", amount: 320, category: "Offerings" },
  { id: "01e4dae", user: "Building Maintenance", date: "2023-05-21", amount: 270, category: "Baskets" },
];

// Chart colors
const COLORS = ["#3b82f6", "#b9103a", "#10b981", "#fbbf24"];

/* -------------------------------------------------------------------------- */
/*                                   UTILS                                   */
/* -------------------------------------------------------------------------- */
const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatTime = (date) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/* -------------------------------------------------------------------------- */
/*                               CUSTOM CALENDAR                              */
/* -------------------------------------------------------------------------- */
const CustomCalendar = ({ isVisible, onClose }) => {
  if (!isVisible) return null;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = i - firstDay + 1;
    return d > 0 && d <= daysInMonth ? d : "";
  });

  return (
    <div className="calendar-overlay">
      <div className="calendar-container">
        <div className="calendar-header">
          <h4>
            {now.toLocaleString("default", { month: "long" })} {year}
          </h4>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="calendar-grid">
          {days.map((d) => (
            <div key={d} className="calendar-day">
              {d}
            </div>
          ))}
          {cells.map((d, i) => (
            <div
              key={i}
              className={`calendar-cell ${d === now.getDate() ? "today" : ""}`}
            >
              {d}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                MAIN DASHBOARD                              */
/* -------------------------------------------------------------------------- */
export default function Dashboard() {
  // State for UI and data
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingQuarter, setEditingQuarter] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Chart data states
  const [barChartData, setBarChartData] = useState(initialBarData);
  const [pieChartData, setPieChartData] = useState(initialPieData);
  const [lineData, setLineData] = useState(initialLineData);
  const [transactions, setTransactions] = useState(initialTransactions);
  
  // Form state
  const [form, setForm] = useState({ 
    id: null,
    name: "", 
    baskets: "", 
    welfares: "", 
    offerings: "", 
    donations: "" 
  });
  
  // Calculate totals
  const totals = barChartData.reduce((acc, curr) => ({
    baskets: acc.baskets + (parseInt(curr.baskets) || 0),
    welfares: acc.welfares + (parseInt(curr.welfares) || 0),
    offerings: acc.offerings + (parseInt(curr.offerings) || 0),
    donations: acc.donations + (parseInt(curr.donations) || 0)
  }), { baskets: 0, welfares: 0, offerings: 0, donations: 0 });
  
  const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);

  /* ----------------------------- CLOCK TICKER ---------------------------- */
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1_000);
    return () => clearInterval(interval);
  }, []);

  /* --------------------------- HANDLERS & ACTIONS ------------------------- */
  // Form handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'name' ? value : parseInt(value) || 0
    }));
  };

  // Quarter management
  const startEdit = (index) => {
    setEditingQuarter(index);
    setForm(barChartData[index]);
    setShowForm(true);
  };

  const deleteQuarter = (index) => {
    const newData = barChartData.filter((_, i) => i !== index);
    setBarChartData(newData);
    updatePieChart(newData);
  };

  const saveQuarter = (e) => {
    e.preventDefault();
    const newQuarter = {
      id: form.id || Date.now(),
      name: form.name,
      baskets: parseInt(form.baskets) || 0,
      welfares: parseInt(form.welfares) || 0,
      offerings: parseInt(form.offerings) || 0,
      donations: parseInt(form.donations) || 0
    };

    let newData;
    if (editingQuarter !== null) {
      newData = [...barChartData];
      newData[editingQuarter] = newQuarter;
    } else {
      newData = [...barChartData, newQuarter];
    }
    
    setBarChartData(newData);
    updatePieChart(newData);
    resetForm();
  };

  const resetForm = () => {
    setEditingQuarter(null);
    setShowForm(false);
    setForm({ 
      id: null, 
      name: "", 
      baskets: "", 
      welfares: "", 
      offerings: "", 
      donations: "" 
    });
  };

  // Update pie chart when bar chart data changes
  const updatePieChart = (data = barChartData) => {
    const newPieData = [
      { 
        name: "Baskets", 
        value: data.reduce((sum, q) => sum + (parseInt(q.baskets) || 0), 0),
        color: "#3b82f6"
      },
      { 
        name: "Welfares", 
        value: data.reduce((sum, q) => sum + (parseInt(q.welfares) || 0), 0),
        color: "#b9103a"
      },
      { 
        name: "Offerings", 
        value: data.reduce((sum, q) => sum + (parseInt(q.offerings) || 0), 0),
        color: "#10b981"
      },
      { 
        name: "Donations", 
        value: data.reduce((sum, q) => sum + (parseInt(q.donations) || 0), 0),
        color: "#fbbf24"
      },
    ];
    setPieChartData(newPieData);
  };

  /* ----------------------------------------------------------------------- */
  /*                                 RENDER                                  */
  /* ----------------------------------------------------------------------- */
  return (
    <div className="dashboard">
      {/* ───────────────────────── TOP BAR ───────────────────────── */}
      <header className="top-nav">
        <div className="search-bar">
          <input className="search-input" placeholder="Search…" />
          <Search className="search-icon" size={20} />
        </div>
        <div className="time-info">
          <div>{formatDate(currentTime)}</div>
          <div>{formatTime(currentTime)}</div>
          <button onClick={() => setShowCalendar(true)}>
            <CalendarIcon size={20} />
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span>Total Baskets</span>
          <h3>GH₵{totals.baskets.toLocaleString()}</h3>
        </div>
        <div className="summary-card">
          <span>Total Welfares</span>
          <h3>GH₵{totals.welfares.toLocaleString()}</h3>
        </div>
        <div className="summary-card">
          <span>Total Offerings</span>
          <h3>GH₵{totals.offerings.toLocaleString()}</h3>
        </div>
        <div className="summary-card">
          <span>Total Donations</span>
          <h3>GH₵{totals.donations.toLocaleString()}</h3>
        </div>
        <div className="summary-card highlight">
          <span>Grand Total</span>
          <h3>GH₵{grandTotal.toLocaleString()}</h3>
        </div>
      </div>

      {/* Main Grid Layout */}
      <main className="grid-container">
        {/* ───── TOP ROW: GIVING AMOUNT & REVENUE ───── */}
        <section className="card giving">
          <header className="card-header">
            <h2>Quarterly Giving</h2>
            <button 
              className="add-button" 
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <Plus size={14} /> Quarter
            </button>
          </header>
          <div className="chart-holder">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }}
                  tickLine={{ stroke: '#2d3a52' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }}
                  tickLine={{ stroke: '#2d3a52' }}
                  tickFormatter={(value) => `GH₵${value}`}
                />
                <Tooltip 
                  formatter={(value) => `GH₵${value}`}
                  labelFormatter={(label) => `Quarter: ${label}`}
                  contentStyle={{
                    backgroundColor: '#1e293f',
                    border: '1px solid #2d3a52',
                    borderRadius: '4px',
                    color: '#e2e8f0'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="baskets" 
                  name="Baskets" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="welfares" 
                  name="Welfares" 
                  fill="#b9103a" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="offerings" 
                  name="Offerings" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="donations" 
                  name="Donations" 
                  fill="#fbbf24" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── FORM MODAL ── */}
          {showForm && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>{editingQuarter !== null ? 'Edit Quarter' : 'Add Quarter'}</h3>
                <form onSubmit={saveQuarter}>
                  <div className="form-group">
                    <label>Quarter Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Q1 2023"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Baskets (GH₵)</label>
                    <input 
                      type="number" 
                      name="baskets"
                      value={form.baskets}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Welfares (GH₵)</label>
                    <input 
                      type="number" 
                      name="welfares"
                      value={form.welfares}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Offerings (GH₵)</label>
                    <input 
                      type="number" 
                      name="offerings"
                      value={form.offerings}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Donations (GH₵)</label>
                    <input 
                      type="number" 
                      name="donations"
                      value={form.donations}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={resetForm}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-save">
                      {editingQuarter !== null ? 'Update' : 'Add'} Quarter
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── TABLE ── */}
          <div className="scroll-x">
            <table className="tx-table small">
              <thead>
                <tr>
                  <th>Quarter</th>
                  <th>Tithes</th>
                  <th>Offerings</th>
                  <th>Donations</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {barChartData.map((q, i) => (
                  <tr key={q.name}>
                    <td>{q.name}</td>
                    <td>GH₵{q.value1}</td>
                    <td>GH₵{q.value2}</td>
                    <td>GH₵{q.value3}</td>
                    <td>GH₵{q.value4}</td>
                    <td className="actions">
                      <button onClick={() => startEdit(i)}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteQuarter(i)} className="danger">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ───── TOP ROW: REVENUE GENERATED ───── */}
        <section className="card revenue">
          <h2>Revenue Generated</h2>
          <div className="chart-holder">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }}
                  tickLine={{ stroke: '#2d3a52' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }}
                  tickLine={{ stroke: '#2d3a52' }}
                  tickFormatter={(value) => `GH₵${value}`}
                />
                <Tooltip 
                  formatter={(value) => `GH₵${value}`}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{
                    backgroundColor: '#1e293f',
                    border: '1px solid #2d3a52',
                    borderRadius: '4px',
                    color: '#e2e8f0'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="baskets" 
                  name="Baskets" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="welfares" 
                  name="Welfares" 
                  stroke="#b9103a" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#b9103a' }}
                  activeDot={{ r: 6, fill: '#b9103a' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="offerings" 
                  name="Offerings" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="donations" 
                  name="Donations" 
                  stroke="#fbbf24" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#fbbf24' }}
                  activeDot={{ r: 6, fill: '#fbbf24' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ───── BOTTOM ROW: CAMPAIGN & TRANSACTIONS ───── */}
        <section className="card campaign">
          <h2>Campaign Progress</h2>
          <div className="chart-holder">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent, value }) => 
                    `${name}: ${(percent * 100).toFixed(0)}%\n(GH₵${value.toLocaleString()})`
                  }
                  labelLine={true}
                  labelLineStyle={{
                    stroke: '#2d3a52',
                    strokeWidth: 1,
                    fill: 'none'
                  }}
                >
                  {pieChartData.map((entry, i) => (
                    <Cell 
                      key={`cell-${i}`} 
                      fill={entry.color || COLORS[i % COLORS.length]} 
                      stroke="#0f172a"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [
                    `GH₵${value.toLocaleString()}`,
                    name
                  ]}
                  contentStyle={{
                    backgroundColor: '#1e293f',
                    border: '1px solid #2d3a52',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    padding: '8px 12px'
                  }}
                  itemStyle={{
                    padding: '4px 0',
                    textTransform: 'capitalize'
                  }}
                />
                <Legend 
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={(value, entry, index) => (
                    <span style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                      {value}: GH₵{pieChartData[index]?.value?.toLocaleString()}
                    </span>
                  )}
                  iconType="circle"
                  iconSize={10}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="campaign-edit">
            {pieChartData.map((d, i) => (
              <div key={d.name} className="campaign-edit-item">
                <span className="campaign-label" style={{ color: COLORS[i % COLORS.length] }}>
                  {d.name}
                </span>
                <div className="campaign-input-group">
                  <span>GH₵</span>
                  <input
                    type="number"
                    value={d.value}
                    onChange={(e) => {
                      const newPieData = [...pieChartData];
                      newPieData[i].value = parseInt(e.target.value) || 0;
                      setPieChartData(newPieData);
                    }}
                    min="0"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card transactions">
          <h2>Recent Transactions</h2>
          <div className="transactions-container">
            <div className="transactions-header">
              <h3>Recent Transactions</h3>
              <button className="add-transaction">
                <Plus size={16} /> Add Transaction
              </button>
            </div>
            <div className="transactions-list">
              {transactions.length > 0 ? (
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="description">{t.user}</td>
                        <td className="date">
                          {new Date(t.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="category">
                          <span className={`category-badge ${t.category.toLowerCase()}`}>
                            {t.category}
                          </span>
                        </td>
                        <td className="amount">
                          <span className={`amount-${t.amount < 0 ? 'debit' : 'credit'}`}>
                            {t.amount < 0 ? '-' : ''}GH₵{Math.abs(t.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-transactions">
                  <p>No transactions found</p>
                </div>
              )}
            </div>
            {transactions.length > 5 && (
              <div className="transactions-footer">
                <button className="view-all">View All Transactions</button>
              </div>
            )}
          </div>
        </section>
      </main>

      {showCalendar && (
        <CustomCalendar isVisible={showCalendar} onClose={() => setShowCalendar(false)} />
      )}

      {/* ───────────────────────── GLOBAL STYLE ───────────────────── */}
      <style jsx>{`
        :root {
          --bg: #0f172a;
          --panel: #1e293f;
          --border: #2d3a52;
          --text: #e2e8f0;
          --accent: #3b82f6;
        }
        .dashboard {
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          font-family: "Inter", sans-serif;
        }
        /* ─── NAV ─── */
        .top-nav {
          display: flex;
          gap: 1rem;
          padding: 1rem 1.5rem;
          position: sticky;
          top: 0;
          z-index: 50;
          background: #131a2d;
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .search-bar {
          flex: 1 1 300px;
          position: relative;
        }
        .search-input {
          width: 100%;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          color: var(--text);
        }
        .search-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
        }
        .search-icon {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        .time-info {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .time-info button {
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
        }
        .time-info button:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        /* ─── GRID ─── */
        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
          padding: 1.5rem;
          max-width: 1920px;
          margin: 0 auto;
          grid-auto-rows: minmax(100px, auto);
        }
        .card {
          background: var(--panel);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
        }
        .card h2 {
          margin: 0 0 1rem;
          font-size: 1.25rem;
        }
        .chart-holder {
          flex: 1;
        }
        .tx-table,
        .tx-table.small {
          width: 100%;
          border-collapse: collapse;
        }
        .tx-table th,
        .tx-table td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border);
        }
        .tx-table th {
          text-align: left;
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .tx-table td {
          font-size: 0.9rem;
        }
        .tx-table.small td {
          font-size: 0.8rem;
        }
        .actions button {
          margin-right: 0.25rem;
          background: none;
          border: 1px solid var(--accent);
          border-radius: 4px;
          color: var(--accent);
          padding: 0.25rem;
          display: inline-flex;
          align-items: center;
        }
        .actions button.danger {
          border-color: #ef4444;
          color: #ef4444;
        }
        .scroll-x {
          overflow-x: auto;
        }

        /* ─── FORM MODAL ─── */
        .modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .modal-card {
          background: var(--panel);
          padding: 1.5rem;
          border-radius: 12px;
          width: 100%;
          max-width: 360px;
        }
        .field {
          margin: 0.75rem 0;
          display: flex;
          flex-direction: column;
        }
        .field label {
          margin-bottom: 0.25rem;
        }
        .field input {
          background: var(--bg);
          border: 1px solid var(--border);
          padding: 0.5rem;
          border-radius: 6px;
          color: var(--text);
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .primary {
          background: var(--accent);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          color: white;
        }
        .ghost {
          background: none;
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.5rem 1rem;
          border-radius: 6px;
        }

        /* ─── CAMPAIGN EDIT ─── */
        .campaign-edit {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .campaign-edit label {
          display: flex;
          flex-direction: column;
          font-size: 0.8rem;
        }
        .campaign-edit input {
          margin-top: 0.25rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 0.25rem 0.5rem;
          color: var(--text);
        }

        /* ─── CALENDAR ─── */
        .calendar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }
        .calendar-container {
          background: var(--panel);
          padding: 1.5rem;
          border-radius: 12px;
          width: 100%;
          max-width: 400px;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.25rem;
        }
        .calendar-day,
        .calendar-cell {
          text-align: center;
          padding: 0.5rem 0;
        }
        .calendar-day {
          font-weight: 600;
          color: #94a3b8;
        }
        .calendar-cell.today {
          background: var(--accent);
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
