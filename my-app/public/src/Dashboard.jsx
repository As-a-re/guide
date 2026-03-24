import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar as CalendarIcon, Search, Edit2, Plus, Trash2, Share2 } from "lucide-react";
import "./Dashboard.css";
import { readFromStorage, saveToStorage, STORAGE_KEYS } from "./utils/storage";
import { useSidebar } from "./context/SidebarContext";

/* -------------------------------------------------------------------------- */
/*                           INITIAL DATA (EMPTY)                            */
/* -------------------------------------------------------------------------- */
// Empty initial data - users will add their own real data through the UI
// All data persists in localStorage for offline use

// Initial data for the line chart (monthly trends) - empty, users add via Edit Revenue page
const initialLineData = [
  { name: "Jan", baskets: 0, welfares: 0, offerings: 0, donations: 0 },
  { name: "Feb", baskets: 0, welfares: 0, offerings: 0, donations: 0 },
  { name: "Mar", baskets: 0, welfares: 0, offerings: 0, donations: 0 },
  { name: "Apr", baskets: 0, welfares: 0, offerings: 0, donations: 0 },
  { name: "May", baskets: 0, welfares: 0, offerings: 0, donations: 0 },
  { name: "Jun", baskets: 0, welfares: 0, offerings: 0, donations: 0 },
  { name: "Jul", baskets: 0, welfares: 0, offerings: 0, donations: 0 },
  { name: "Aug", baskets: 0, welfares: 0, offerings: 0, donations: 0 },
  { name: "Sep", baskets: 0, welfares: 0, offerings: 0, donations: 0 },
  { name: "Oct", baskets: 0, welfares: 0, offerings: 0, donations: 0 },
  { name: "Nov", baskets: 0, welfares: 0, offerings: 0, donations: 0 },
  { name: "Dec", baskets: 0, welfares: 0, offerings: 0, donations: 0 },
];

// Initial data for the bar chart (quarterly giving) - empty, users add via Edit Quarters page
const initialBarData = [];

// Initial data for the pie chart (category distribution) - starts at zero
const initialPieData = [
  { name: "Baskets", value: 0, color: "#3b82f6" },
  { name: "Welfares", value: 0, color: "#b9103a" },
  { name: "Offerings", value: 0, color: "#10b981" },
  { name: "Donations", value: 0, color: "#fbbf24" },
];

// Transactions data - empty, users add via Add Transaction button
const initialTransactions = [];

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
/*                               CUSTOM CALENDAR                              */
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
/*                                MAIN DASHBOARD                              */
/* -------------------------------------------------------------------------- */
export default function Dashboard() {

  const { sidebarCollapsed } = useSidebar();
  const navigate = useNavigate();
  
  // State for UI and data
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingQuarter, setEditingQuarter] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Load persisted data from localStorage (lazy init)
  const [barChartData, setBarChartData] = useState(() => readFromStorage(STORAGE_KEYS.BAR_CHART, initialBarData));
  const [pieChartData, setPieChartData] = useState(() => readFromStorage(STORAGE_KEYS.PIE_CHART, initialPieData));
  const [lineData] = useState(() => readFromStorage(STORAGE_KEYS.LINE_CHART, initialLineData));
  const [transactions, setTransactions] = useState(() => readFromStorage(STORAGE_KEYS.TRANSACTIONS, initialTransactions));
  
  // Persist datasets when they change
  useEffect(() => { saveToStorage(STORAGE_KEYS.BAR_CHART, barChartData); }, [barChartData]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PIE_CHART, pieChartData); }, [pieChartData]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.LINE_CHART, lineData); }, [lineData]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions); }, [transactions]);
  
  // Form state
  const [form, setForm] = useState({ 
    id: null,
    name: "", 
    baskets: "", 
    welfares: "", 
    offerings: "", 
    donations: "" 
  });

  // Delete transaction (used by delete button)
  const handleDeleteTransaction = (id) => {
    if (!window.confirm('Delete transaction?')) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Calculate totals from transactions (revenue adds, expense subtracts)
  const totals = transactions.reduce((acc, curr) => {
    const amount = parseInt(curr.amount) || 0;
    const multiplier = curr.type === 'revenue' ? 1 : -1;
    const adjustedAmount = amount * multiplier;
    
    if (curr.category === 'Baskets') {
      acc.baskets += adjustedAmount;
    } else if (curr.category === 'Welfares') {
      acc.welfares += adjustedAmount;
    } else if (curr.category === 'Offerings') {
      acc.offerings += adjustedAmount;
    } else if (curr.category === 'Donations') {
      acc.donations += adjustedAmount;
    }
    
    return acc;
  }, { baskets: 0, welfares: 0, offerings: 0, donations: 0 });
  
  const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);

  // Update pie chart data based on transactions
  useEffect(() => {
    const newPieData = [
      { 
        name: "Baskets", 
        value: Math.max(0, totals.baskets),
        color: "#3b82f6"
      },
      { 
        name: "Welfares", 
        value: Math.max(0, totals.welfares),
        color: "#b9103a"
      },
      { 
        name: "Offerings", 
        value: Math.max(0, totals.offerings),
        color: "#10b981"
      },
      { 
        name: "Donations", 
        value: Math.max(0, totals.donations),
        color: "#fbbf24"
      },
    ];
    setPieChartData(newPieData);
  }, [transactions, totals.baskets, totals.welfares, totals.offerings, totals.donations]);

  /* ----------------------------- CLOCK TICKER ---------------------------- */
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1_000);
    return () => clearInterval(interval);
  }, []);

  /* --------------------------- HANDLERS & ACTIONS ------------------------- */
  // Form handling for editing quarters
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'name' ? value : parseInt(value) || 0
    }));
  };

  // Quarter management - only editing existing quarters
  const saveQuarter = (e) => {
    e.preventDefault();
    const newQuarter = {
      id: form.id,
      name: form.name,
      baskets: parseInt(form.baskets) || 0,
      welfares: parseInt(form.welfares) || 0,
      offerings: parseInt(form.offerings) || 0,
      donations: parseInt(form.donations) || 0
    };

    const newData = [...barChartData];
    newData[editingQuarter] = newQuarter;
    
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

  // Listen for campaign edits and reload pie chart data from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedPieData = readFromStorage(STORAGE_KEYS.PIE_CHART, initialPieData);
      setPieChartData(updatedPieData);
    };
    window.addEventListener('storage', handleStorageChange);
    // Initial load
    handleStorageChange();
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  /* ----------------------------------------------------------------------- */
  /*                                 RENDER                                  */
  /* ----------------------------------------------------------------------- */
  return (
    <div className={`dashboard ${sidebarCollapsed ? "collapsed" : ""}`}>
      {/* ───────────────────────── TOP BAR ───────────────────────── */}
      <header className="top-nav">
        <div className="search-bar">
          <input className="search-input" placeholder="Search…" />
          <Search className="search-icon" size={20} />
        </div>
        <div className="time-info">
          <div>{formatDate(currentTime)}</div>
          <div>{formatTime(currentTime)}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => navigate('/share-data')} 
              title="Export or import dashboard data"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              <Share2 size={16} />
              Share
            </button>
            <button onClick={() => setShowCalendar(true)}>
              <CalendarIcon size={20} />
            </button>
          </div>
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="add-button" onClick={() => navigate('/edit-quarters')}><Edit2 size={12} /> Edit Quarters</button>
            </div>
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

          {/* ── FORM MODAL ── */}
          {showForm && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Edit Quarter</h3>

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
        </section>

        {/* ───── TOP ROW: REVENUE GENERATED ───── */}
        <section className="card revenue">
          <h2>Revenue Generated</h2>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button className="add-button" onClick={() => navigate('/edit-revenue')}><Edit2 size={12} /> Edit Revenue</button>
          </div>
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

        {/* ───── BOTTOM ROW: CAMPAIGN & CAMPAIGN TABLE ───── */}
        <section className="card campaign" style={{ marginTop: '2rem' }}>
          <h2>Campaign Progress</h2>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button className="add-button" onClick={() => navigate('/edit-campaign')} style={{ marginLeft: 8 }}><Edit2 size={12} /> Edit Campaign</button>
          </div>
          
          <div className="chart-holder">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => 
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                >
                  {pieChartData.map((entry, i) => (
                    <Cell 
                      key={`cell-${i}`} 
                      fill={entry.color || COLORS[i % COLORS.length]} 
                      stroke="#0f172a"
                      strokeWidth={2}
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
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card campaign-data-table" style={{ marginTop: '2rem' }}>
          <h2>Campaign Data - Transaction History</h2>
          <div style={{ 
            backgroundColor: '#1a2332', 
            borderRadius: '0.75rem', 
            border: '1px solid #2d3a52',
            overflow: 'hidden',
            marginTop: '1rem'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#0f172a',
                  borderBottom: '2px solid #2d3a52'
                }}>
                  <th style={{ 
                    padding: '1rem 0.75rem',
                    textAlign: 'left',
                    color: '#94a3b8',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Date</th>
                  <th style={{ 
                    padding: '1rem 0.75rem',
                    textAlign: 'left',
                    color: '#94a3b8',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Description</th>
                  <th style={{ 
                    padding: '1rem 0.75rem',
                    textAlign: 'left',
                    color: '#94a3b8',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Category</th>
                  <th style={{ 
                    padding: '1rem 0.75rem',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Type</th>
                  <th style={{ 
                    padding: '1rem 0.75rem',
                    textAlign: 'right',
                    color: '#94a3b8',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  // Sort transactions by date (newest first)
                  [...transactions]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((transaction, index) => {
                      return (
                        <tr 
                          key={transaction.id}
                          style={{ 
                            borderBottom: index !== transactions.length - 1 ? '1px solid #2d3a52' : 'none',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ 
                            padding: '1rem 0.75rem',
                            color: '#94a3b8',
                            fontSize: '0.8125rem'
                          }}>
                            {new Date(transaction.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td style={{ 
                            padding: '1rem 0.75rem',
                            color: '#e2e8f0',
                            fontWeight: 500
                          }}>
                            {transaction.user}
                          </td>
                          <td style={{ 
                            padding: '1rem 0.75rem',
                            color: '#e2e8f0'
                          }}>
                            <span className={`category-badge ${transaction.category.toLowerCase()}`}>
                              {transaction.category}
                            </span>
                          </td>
                          <td style={{ 
                            padding: '1rem 0.75rem',
                            textAlign: 'center'
                          }}>
                            <span className={`type-badge ${transaction.type}`}>
                              {transaction.type === 'revenue' ? '+ Revenue' : '- Expense'}
                            </span>
                          </td>
                          <td style={{ 
                            padding: '1rem 0.75rem',
                            textAlign: 'right',
                            fontWeight: 600,
                            fontSize: '0.9375rem'
                          }}>
                            <span className={`amount-${transaction.type === 'expense' ? 'debit' : 'credit'}`}>
                              {transaction.type === 'expense' ? '-' : '+'}GH₵{transaction.amount.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ 
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#94a3b8'
                    }}>
                      No transactions recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ 
                  borderTop: '2px solid #2d3a52',
                  backgroundColor: '#0f172a'
                }}>
                  <td colSpan="4" style={{ 
                    padding: '1rem 0.75rem',
                    color: '#e2e8f0',
                    fontWeight: 700,
                    fontSize: '0.9375rem'
                  }}>
                    Net Total (All Categories)
                  </td>
                  <td style={{ 
                    padding: '1rem 0.75rem',
                    textAlign: 'right',
                    color: grandTotal >= 0 ? '#4caf50' : '#ef4444',
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}>
                    GH₵{grandTotal.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ 
                  backgroundColor: '#0f172a',
                  borderTop: '1px solid #2d3a52'
                }}>
                  <td colSpan="5" style={{ 
                    padding: '1rem 0.75rem'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                      marginTop: '0.5rem'
                    }}>
                      {pieChartData.map((item) => (
                        <div key={item.name} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          backgroundColor: '#1a2332',
                          borderRadius: '0.5rem',
                          border: `1px solid ${item.color}40`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: item.color
                            }}></span>
                            <span style={{ 
                              color: '#94a3b8',
                              fontSize: '0.8125rem',
                              fontWeight: 500
                            }}>
                              {item.name}
                            </span>
                          </div>
                          <span style={{
                            color: item.value >= 0 ? '#10b981' : '#ef4444',
                            fontWeight: 600,
                            fontSize: '0.875rem'
                          }}>
                            GH₵{item.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="card-transactions" style={{ marginTop: '4rem' }}>
          <h2>Recent Transactions</h2>
          <div className="transactions-container">
            <div className="transactions-header">
              <h3>Recent Transactions</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="add-transaction" onClick={() => navigate('/edit-transaction/new')}>
                  <Plus size={16} /> Add Transaction
                </button>
              </div>
            </div>
            <div className="transactions-list">
              {transactions.length > 0 ? (
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="date">
                          {new Date(t.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="description">{t.user}</td>
                        <td className="type">
                          <span className={`type-badge ${t.type}`}>
                            {t.type === 'revenue' ? '+ Revenue' : '- Expense'}
                          </span>
                        </td>
                        <td className="category">
                          <span className={`category-badge ${t.category.toLowerCase()}`}>
                            {t.category}
                          </span>
                        </td>
                        <td className="amount">
                          <span className={`amount-${t.type === 'expense' ? 'debit' : 'credit'}`}>
                            {t.type === 'expense' ? '-' : '+'}GH₵{Math.abs(t.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </td>
                        <td className="actions">
                          <button onClick={() => navigate(`/edit-transaction/${t.id}`)} className="edit-btn" title="Edit transaction">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteTransaction(t.id)} className="danger" title="Delete transaction">
                            <Trash2 size={14} />
                          </button>
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
    </div>
  );
}