// Settings.jsx
import React, { useEffect, useMemo, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Download, Settings as SettingsIcon, User, Database, WifiOff, Wifi, FileText, DollarSign, BookOpen, PieChart, Users, HardDrive, Activity, Save, Moon, Search, Plus, Pencil, Trash2, RefreshCw, UserPlus, Copy, X, AlignLeft, AlignCenter, AlignRight, Maximize2 } from "lucide-react"
import { marked } from "marked"
import "./Settings.css"

/**
 * Full single-file Settings page
 * - Sections: Reports, Data Management (Budget + Expenses + Notes), User Management (Users + Sermon Templates), System Settings
 * - Template preview (single projection modal) with font size controls
 * - LocalStorage persistence for demo/testing
 */

/* === Section constants === */
const SECTIONS = {
  REPORTS: "reports",
  DATA_MANAGEMENT: "data",
  USER_MANAGEMENT: "users",
  SYSTEM_SETTINGS: "system",
}

const DEFAULT_TEMPLATE = {
  id: null,
  title: "",
  type: "sermon",
  template: "",
  backgroundImage: "",
  fontFamily: "Arial, sans-serif",
  fontSize: "18px",
  fontColor: "#111827",
  backgroundColor: "#ffffff",
  textAlign: "left",
  lineHeight: 1.4,
  padding: "1rem",
  borderRadius: "0.25rem",
  fontWeight: "400",
  textShadow: "none",
  opacity: 1,
}

/* === Helpers === */
const uid = (prefix = "") => `${prefix}${Math.random().toString(36).slice(2, 9)}`

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

const clamp = (v, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v))

/* Calculate actual localStorage usage */
const getLocalStorageSize = () => {
  let total = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }
  return total
}

/* Format bytes to human readable */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/* Format uptime duration */
const formatUptime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/* === Component === */
const SettingsPage = () => {
  const navigate = useNavigate()
  
  /* Navigation */
  const [activeSection, setActiveSection] = useState(SECTIONS.REPORTS)
  /* Tabs (for sections that use tabs) */
  const [activeTab, setActiveTab] = useState("budget") // Default tab for Data Management

  /* Templates (sermons, bible_study, devotional) */
  const [sermonTemplates, setSermonTemplates] = useState(() =>
    readJSON("sg_sermonTemplates", [])
  )
  const [templateType, setTemplateType] = useState("sermon")
  const [newTemplate, setNewTemplate] = useState({ ...DEFAULT_TEMPLATE })

  /* Budget & expenses */
  const [budget, setBudget] = useState(() =>
    readJSON("sg_budget", {
      categories: [],
      expenses: [],
    })
  )

  /* Notes */
  const [notes, setNotes] = useState(() =>
    readJSON("sg_notes", [])
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [notesFilter, setNotesFilter] = useState("all")
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [newNote, setNewNote] = useState({
    id: null,
    title: "",
    category: "meeting",
    date: new Date().toISOString().slice(0, 10),
    content: "",
  })

  /* Users (simple local list) */
  const [users, setUsers] = useState(() =>
    readJSON("sg_users", [])
  )
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Member" })

  /* System info & settings */
  const [systemInfo, setSystemInfo] = useState(() => {
    const stored = readJSON("sg_systemInfo", {
      appVersion: "1.0.0",
      storageUsed: "0",
      totalStorage: "1000",
      uptime: "00:00:00",
      lastBackup: null,
      lastSync: null,
      pageTimes: {},
      startTime: Date.now(),
      currentPage: "Settings",
      lastUpdated: new Date().toLocaleString(),
    })
    // Set start time if not exists
    if (!stored.startTime) {
      stored.startTime = Date.now()
    }
    return stored
  })
  const [settings, setSettings] = useState(() =>
    readJSON("sg_settings", { offlineMode: false, autoSave: true, darkMode: false })
  )
  
  // Separate state for runtime metrics (doesn't persist to localStorage)
  const [runtimeMetrics, setRuntimeMetrics] = useState({
    uptime: "00:00:00",
    lastUpdated: new Date().toLocaleString(),
  })

  /* UI small state */
  const [templateEditorMode, setTemplateEditorMode] = useState(false) // full-screen editor mode

  /* Modal states for inputs (replacing prompt()) */
  const [inputModal, setInputModal] = useState({
    isOpen: false,
    title: "",
    fields: [], // Array of {name, label, type, defaultValue}
    onSubmit: null,
  })
  const [inputValues, setInputValues] = useState({})

  // Use refs to track runtime data without triggering re-renders
  const systemInfoRef = useRef(systemInfo)
  
  // Update ref whenever systemInfo changes
  useEffect(() => {
    systemInfoRef.current = systemInfo
  }, [systemInfo])

  /* Persist important states to localStorage */
  useEffect(() => writeJSON("sg_sermonTemplates", sermonTemplates), [sermonTemplates])
  useEffect(() => writeJSON("sg_budget", budget), [budget])
  useEffect(() => writeJSON("sg_notes", notes), [notes])
  useEffect(() => writeJSON("sg_users", users), [users])
  
  // Only persist non-runtime systemInfo data
  useEffect(() => {
    const { uptime, lastUpdated, currentPage, ...persistData } = systemInfo
    writeJSON("sg_systemInfo", persistData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemInfo.appVersion, systemInfo.lastBackup, systemInfo.lastSync, systemInfo.startTime])
  
  useEffect(() => writeJSON("sg_settings", settings), [settings])

  /* Real-time system information tracking */
  useEffect(() => {
    const startTime = systemInfo.startTime || Date.now()
    
    // Detect actual localStorage quota (try to estimate available storage)
    const getStorageQuota = () => {
      // Try to use Storage API if available
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(estimate => {
          const totalBytes = estimate.quota || 10 * 1024 * 1024 // Default to 10MB if not available
          const usedBytes = estimate.usage || getLocalStorageSize()
          
          setSystemInfo(prev => ({
            ...prev,
            storageUsed: formatBytes(usedBytes),
            totalStorage: formatBytes(totalBytes),
          }))
          
          setRuntimeMetrics(prev => ({
            ...prev,
            lastUpdated: new Date().toLocaleString(),
          }))
        }).catch(() => {
          // Fallback to localStorage calculation
          const usedBytes = getLocalStorageSize()
          const totalBytes = 10 * 1024 * 1024 // 10MB fallback
          
          setSystemInfo(prev => ({
            ...prev,
            storageUsed: formatBytes(usedBytes),
            totalStorage: formatBytes(totalBytes),
          }))
          
          setRuntimeMetrics(prev => ({
            ...prev,
            lastUpdated: new Date().toLocaleString(),
          }))
        })
      } else {
        // Fallback: use localStorage size estimation
        const usedBytes = getLocalStorageSize()
        const totalBytes = 10 * 1024 * 1024 // 10MB typical limit
        
        setSystemInfo(prev => ({
          ...prev,
          storageUsed: formatBytes(usedBytes),
          totalStorage: formatBytes(totalBytes),
        }))
        
        setRuntimeMetrics(prev => ({
          ...prev,
          lastUpdated: new Date().toLocaleString(),
        }))
      }
    }

    // Update uptime
    const updateUptime = () => {
      const uptime = Date.now() - startTime
      const newUptime = formatUptime(uptime)
      
      setRuntimeMetrics(prev => {
        // Only update if changed to prevent unnecessary re-renders
        if (prev.uptime !== newUptime) {
          return { ...prev, uptime: newUptime }
        }
        return prev
      })
    }

    // Initial calculation
    getStorageQuota()
    updateUptime()

    // Update storage every 10 seconds (less frequent to avoid scroll issues)
    const storageInterval = setInterval(getStorageQuota, 10000)
    // Update uptime every 10 seconds
    const uptimeInterval = setInterval(updateUptime, 10000)

    return () => {
      clearInterval(storageInterval)
      clearInterval(uptimeInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Track page visit time */
  useEffect(() => {
    const pageStartTime = Date.now()
    
    return () => {
      const timeSpent = Date.now() - pageStartTime
      
      setSystemInfo(prev => ({
        ...prev,
        pageTimes: {
          ...prev.pageTimes,
          Settings: formatUptime(
            (prev.pageTimes.Settings ? parseInt(prev.pageTimes.Settings) * 1000 : 0) + timeSpent
          )
        }
      }))
    }
  }, [])

  /* Dark mode class */
  useEffect(() => {
    if (settings.darkMode) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [settings.darkMode])

  /* Keyboard shortcuts for template editor */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && templateEditorMode) {
        closeTemplateEditor()
      }
    }

    if (templateEditorMode) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [templateEditorMode])

  /* Derived / filtered data */
  const filteredNotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return notes
      .filter((n) => (notesFilter === "all" ? true : n.category === notesFilter))
      .filter((n) => (term ? `${n.title} ${n.content}`.toLowerCase().includes(term) : true))
  }, [notes, notesFilter, searchTerm])

  /* === Notes functions === */
  const openAddNote = () => {
    setSelectedNote(null)
    setNewNote({
      id: null,
      title: "",
      category: "meeting",
      date: new Date().toISOString().slice(0, 10),
      content: "",
    })
    setIsNoteModalOpen(true)
  }

  const addNote = () => {
    const note = { ...newNote, id: uid("n_") }
    setNotes((prev) => [note, ...prev])
    setIsNoteModalOpen(false)
  }

  const updateNote = (id, payload) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...payload } : n)))
  }

  const deleteNote = (id) => {
    if (!window.confirm("Delete this note?")) return
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  /* === Budget & expenses functions === */
  const openAddCategory = () => {
    setInputModal({
      isOpen: true,
      title: "Add Budget Category",
      fields: [
        { name: "name", label: "Category Name", type: "text", defaultValue: "" }
      ],
      onSubmit: (values) => {
        if (!values.name?.trim()) return
        const category = { id: uid("c_"), name: values.name.trim(), allocated: 0, spent: 0 }
        setBudget((b) => ({ ...b, categories: [category, ...b.categories] }))
        setInputModal({ ...inputModal, isOpen: false })
      }
    })
    setInputValues({ name: "" })
  }

  const openEditCategory = (category) => {
    setInputModal({
      isOpen: true,
      title: "Edit Category",
      fields: [
        { name: "name", label: "Category Name", type: "text", defaultValue: category.name },
        { name: "allocated", label: "Allocated Amount", type: "number", defaultValue: category.allocated || 0 }
      ],
      onSubmit: (values) => {
        if (!values.name?.trim()) return
        const newAllocated = parseFloat(values.allocated) || 0
        setBudget((b) => ({
          ...b,
          categories: b.categories.map((c) =>
            c.id === category.id ? { ...c, name: values.name.trim(), allocated: newAllocated } : c
          ),
        }))
        setInputModal({ ...inputModal, isOpen: false })
      }
    })
    setInputValues({ name: category.name, allocated: category.allocated || 0 })
  }

  const confirmDeleteCategory = (id) => {
    const cat = budget.categories.find((c) => c.id === id)
    if (!cat) return
    if (cat.spent > 0) {
      alert("Cannot delete category with expenses.")
      return
    }
    if (!window.confirm(`Delete category "${cat.name}"?`)) return
    setBudget((b) => ({ ...b, categories: b.categories.filter((c) => c.id !== id) }))
  }

  const addExpense = (categoryId) => {
    setInputModal({
      isOpen: true,
      title: "Add Expense",
      fields: [
        { name: "title", label: "Expense Title", type: "text", defaultValue: "" },
        { name: "amount", label: "Amount", type: "number", defaultValue: "0" }
      ],
      onSubmit: (values) => {
        if (!values.title?.trim()) return
        const amount = parseFloat(values.amount) || 0
        const date = new Date().toISOString()
        const expense = { id: uid("e_"), categoryId, title: values.title.trim(), amount, date }
        setBudget((b) => {
          const categories = b.categories.map((c) =>
            c.id === categoryId ? { ...c, spent: (c.spent || 0) + amount } : c
          )
          return { ...b, expenses: [expense, ...(b.expenses || [])], categories }
        })
        setInputModal({ ...inputModal, isOpen: false })
      }
    })
    setInputValues({ title: "", amount: "0" })
  }

  /* Template functions */

  const openTemplateEditor = (template = null) => {
    if (template) {
      setNewTemplate(template)
    } else {
      setNewTemplate({ ...DEFAULT_TEMPLATE, type: templateType, id: null })
    }
    setTemplateEditorMode(true)
  }

  const closeTemplateEditor = () => {
    setTemplateEditorMode(false)
    setNewTemplate({ ...DEFAULT_TEMPLATE })
  }

  const addTemplate = () => {
    if (!newTemplate.title.trim()) {
      alert("Please provide a template name")
      return
    }
    const t = { 
      ...newTemplate, 
      id: uid("t_"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setSermonTemplates((prev) => [t, ...prev])
    closeTemplateEditor()
  }

  const updateTemplate = (id, payload) => {
    setSermonTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...payload, updatedAt: new Date().toISOString() } : t)))
    closeTemplateEditor()
  }

  const deleteTemplate = (id) => {
    if (!window.confirm("Delete template?")) return
    setSermonTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const duplicateTemplate = (template) => {
    const newT = {
      ...template,
      id: uid("t_"),
      title: `${template.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setSermonTemplates((prev) => [newT, ...prev])
  }

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setNewTemplate((prev) => ({ ...prev, backgroundImage: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const clearBackgroundImage = () => setNewTemplate((prev) => ({ ...prev, backgroundImage: "" }))

  const projectTemplate = (template) => {
    // Navigate to the standalone presentation page
    navigate(`/presentation/${template.id}`)
  }

  /* === Users === */
  const addUser = () => {
    if (!newUser.name || !newUser.email) {
      alert("Provide name and email")
      return
    }
    const u = { ...newUser, id: uid("u_") }
    setUsers((prev) => [u, ...prev])
    setNewUser({ name: "", email: "", role: "Member" })
  }

  /* === System Actions === */
  const createBackup = () => {
    // demo backup behavior: just set lastBackup timestamp
    setSystemInfo((s) => ({ ...s, lastBackup: new Date().toISOString() }))
    alert("Backup created (demo).")
  }

  const updateStorageUsage = () => {
    // Try to use Storage API for accurate quota detection
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        const totalBytes = estimate.quota || 10 * 1024 * 1024
        const usedBytes = estimate.usage || getLocalStorageSize()
        
        setSystemInfo((s) => ({ 
          ...s, 
          storageUsed: formatBytes(usedBytes),
          totalStorage: formatBytes(totalBytes),
        }))
        
        setRuntimeMetrics((r) => ({
          ...r,
          lastUpdated: new Date().toLocaleString(),
        }))
        
        // Show details
        const dataBreakdown = {
          'Templates': formatBytes((localStorage.getItem('sg_sermonTemplates') || '').length),
          'Budget': formatBytes((localStorage.getItem('sg_budget') || '').length),
          'Notes': formatBytes((localStorage.getItem('sg_notes') || '').length),
          'Users': formatBytes((localStorage.getItem('sg_users') || '').length),
          'System Info': formatBytes((localStorage.getItem('sg_systemInfo') || '').length),
        }
        
        const details = Object.entries(dataBreakdown)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
        
        alert(`Storage Updated!\n\nTotal Used: ${formatBytes(usedBytes)}\nAvailable: ${formatBytes(totalBytes)}\nPercentage: ${((usedBytes / totalBytes) * 100).toFixed(2)}%\n\n${details}`)
      })
    } else {
      // Fallback
      const usedBytes = getLocalStorageSize()
      const totalBytes = 10 * 1024 * 1024
      
      setSystemInfo((s) => ({ 
        ...s, 
        storageUsed: formatBytes(usedBytes),
        totalStorage: formatBytes(totalBytes),
      }))
      
      setRuntimeMetrics((r) => ({
        ...r,
        lastUpdated: new Date().toLocaleString(),
      }))
      
      const dataBreakdown = {
        'Templates': formatBytes((localStorage.getItem('sg_sermonTemplates') || '').length),
        'Budget': formatBytes((localStorage.getItem('sg_budget') || '').length),
        'Notes': formatBytes((localStorage.getItem('sg_notes') || '').length),
        'Users': formatBytes((localStorage.getItem('sg_users') || '').length),
        'System Info': formatBytes((localStorage.getItem('sg_systemInfo') || '').length),
      }
      
      const details = Object.entries(dataBreakdown)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
      
      alert(`Storage Updated!\n\nTotal: ${formatBytes(usedBytes)} / ${formatBytes(totalBytes)}\n\n${details}`)
    }
  }

  /* ensure numbers */
  // Use memoized storage calculation to prevent scroll issues
  const storageData = useMemo(() => {
    const usedBytes = getLocalStorageSize()
    // Try to parse the stored total, fallback to 10MB
    let totalBytes = 10 * 1024 * 1024
    
    // Parse stored total storage string (e.g., "5.00 MB" -> bytes)
    if (systemInfo.totalStorage) {
      const match = systemInfo.totalStorage.match(/([\d.]+)\s*(MB|GB|KB|Bytes)/)
      if (match) {
        const value = parseFloat(match[1])
        const unit = match[2]
        const multipliers = { 'Bytes': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024 }
        totalBytes = value * (multipliers[unit] || 1)
      }
    }
    
    const percent = clamp((usedBytes / totalBytes) * 100, 0, 100)
    
    return {
      totalBytes,
      usedBytes,
      percent
    }
  }, [systemInfo.totalStorage])
  
  const usedStorageBytes = storageData.usedBytes
  const storagePercent = storageData.percent

  /* Get storage breakdown by data type */
  const getStorageBreakdown = () => {
    const breakdown = []
    const keys = [
      { key: 'sg_sermonTemplates', label: 'Sermon Templates' },
      { key: 'sg_budget', label: 'Budget Data' },
      { key: 'sg_notes', label: 'Notes' },
      { key: 'sg_users', label: 'Users' },
      { key: 'sg_systemInfo', label: 'System Info' },
      { key: 'sg_settings', label: 'Settings' },
      { key: 'dashboard_bar_chart', label: 'Dashboard Charts' },
      { key: 'dashboard_pie_chart', label: 'Dashboard Pie' },
      { key: 'dashboard_line_chart', label: 'Dashboard Line' },
      { key: 'dashboard_transactions', label: 'Transactions' },
    ]

    keys.forEach(({ key, label }) => {
      const data = localStorage.getItem(key)
      if (data) {
        const bytes = data.length + key.length
        breakdown.push({ label, bytes, formatted: formatBytes(bytes) })
      }
    })

    // Sort by size descending
    return breakdown.sort((a, b) => b.bytes - a.bytes)
  }

  /* === Rendering sub-sections === */
  
  // Memoize dashboard data to prevent recalculation
  const dashboardData = useMemo(() => {
    const bar = readJSON('dashboard_bar_chart', [])
    const pie = readJSON('dashboard_pie_chart', [])
    const line = readJSON('dashboard_line_chart', [])
    const transactions = readJSON('dashboard_transactions', [])
    return { barChartData: bar, pieChartData: pie, lineData: line, transactions }
  }, []) // Empty deps - only read once on mount

  const downloadBlob = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadJSONReport = () => {
    downloadBlob(JSON.stringify(dashboardData, null, 2), 'church_report.json', 'application/json')
  }

  const transactionsToCSV = (txs) => {
    const header = ['id','description','date','category','amount']
    const rows = txs.map(t => [t.id, `"${(t.user||'').replace(/"/g,'""')}"`, t.date, t.category, t.amount])
    return [header.join(','), ...rows.map(r => r.join(','))].join('\n')
  }

  const downloadTransactionsCSV = () => {
    const { transactions } = dashboardData
    if (!transactions || transactions.length === 0) return alert('No transactions to export')
    const csv = transactionsToCSV(transactions)
    downloadBlob(csv, 'transactions.csv', 'text/csv')
  }

  const generatePDFReport = () => {
    const { barChartData, pieChartData, lineData, transactions } = dashboardData
    const styles = `body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:20px}h1,h2{color:#111}table{width:100%;border-collapse:collapse;margin-bottom:16px}th,td{border:1px solid #ddd;padding:8px;text-align:left}`
    const tableFrom = (arr, cols) => {
      if (!arr || arr.length === 0) return '<p>No data</p>'
      const head = '<tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>'
      const body = arr.map(r => '<tr>' + cols.map(c => `<td>${(r[c]!==undefined? r[c] : '')}</td>`).join('') + '</tr>').join('')
      return `<table>${head}${body}</table>`
    }

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Church Report</title><style>${styles}</style></head><body><h1>Church Report</h1><h2>Quarterly Giving</h2>${tableFrom(barChartData,['name','baskets','welfares','offerings','donations'])}<h2>Revenue (Monthly)</h2>${tableFrom(lineData,['name','baskets','welfares','offerings','donations'])}<h2>Campaign Progress</h2>${tableFrom(pieChartData,['name','value'])}<h2>Recent Transactions</h2>${tableFrom(transactions,['id','user','date','category','amount'])}<script>window.onload=function(){setTimeout(()=>{window.print();},300)}</script></body></html>`

    const w = window.open('', '_blank')
    if (!w) return alert('Unable to open print window (popup blocked)')
    w.document.write(html)
    w.document.close()
  }

  /* Reports */
  const ReportsSection = React.memo(() => (
    <div className="section-container">
      <h2 className="section-title">
        <FileText /> Reports
      </h2>
      <p className="section-description">Generate and download financial & activity reports.</p>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Monthly Summary</h3>
        </div>
        <div className="card-body">
          <p className="mb-4">Download quick reports for the selected period.</p>
          <div className="report-buttons">
            <button className="button button-primary" onClick={generatePDFReport}>
              <Download size={16} /> Download PDF
            </button>
            <button className="button" onClick={downloadTransactionsCSV}>
              Export CSV
            </button>
            <button className="button" onClick={downloadJSONReport}>
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  ))

  /* Data Management (Budget + Notes) - Memoized to prevent re-renders */
  const DataManagementSection = React.memo(() => (
    <div className="section-container">
      <div className="section-header-fixed">
        <h2 className="section-title">
          <Database /> Data Management
        </h2>
        <p className="section-description">Manage budgets, expenses, and meeting notes.</p>

        <div className="section-tabs">
          <button
            className={`tab-button ${activeTab === "budget" ? "active" : ""}`}
            onClick={() => setActiveTab("budget")}
          >
            <DollarSign size={16} /> Budget
          </button>
          <button
            className={`tab-button ${activeTab === "notes" ? "active" : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            <FileText size={16} /> Notes
          </button>
        </div>
      </div>

      <div className="tab-content-scrollable">
        {activeTab === "budget" && (
        <div className="budget-section">
          <h3 className="mb-4">Budget Overview</h3>

          <div className="budget-summary-cards">
            <div className="budget-summary-card">
              <label className="budget-label">Total Categories</label>
              <div className="budget-amount">{budget.categories.length}</div>
            </div>
            <div className="budget-summary-card">
              <label className="budget-label">Total Expenses</label>
              <div className="budget-amount">{(budget.expenses || []).length}</div>
            </div>
            <div className="budget-summary-card">
              <label className="budget-label">Storage Used</label>
              <div className="budget-amount">{systemInfo.storageUsed}</div>
            </div>
          </div>

          <div className="budget-actions mb-4">
            <button className="button button-primary" onClick={openAddCategory}>
              <Plus size={14} /> Add Category
            </button>
            <button
              className="button"
              onClick={() => {
                const catId = budget.categories?.[0]?.id
                if (!catId) return alert("Add a category first.")
                addExpense(catId)
              }}
            >
              Add Expense (demo)
            </button>
          </div>

          <div className="budget-categories">
            <div className="flex justify-between items-center mb-4">
              <h4>Budget Categories</h4>
              <span className="text-sm text-gray-500">Showing {budget.categories.length} categories</span>
            </div>

            {budget.categories.length === 0 ? (
              <div className="empty-state">
                <FileText size={32} className="text-gray-400" />
                <p>No budget categories found.</p>
                <button className="button button-primary mt-4" onClick={openAddCategory}>
                  <Plus size={16} /> Add Your First Category
                </button>
              </div>
            ) : (
              <div className="budget-category-list">
                {budget.categories.map((category) => {
                  const spent = category.spent || 0
                  const allocated = category.allocated || 0
                  const pct = clamp((spent / (allocated || 1)) * 100, 0, 200)
                  return (
                    <div key={category.id} className="budget-category-item">
                      <div className="budget-category-info">
                        <span className="budget-category-name">{category.name}</span>
                        <div className="budget-category-amounts">
                          <span>Allocated: ${allocated.toLocaleString()}</span>
                          <span>Spent: ${spent.toLocaleString()}</span>
                          <span>Remaining: ${(allocated - spent).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="budget-category-progress">
                        <div
                          className="budget-progress-bar"
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            backgroundColor: spent > allocated ? "#ef4444" : "#3b82f6",
                          }}
                        />
                      </div>

                      <div className="budget-category-actions">
                        <button className="icon-button" onClick={() => openEditCategory(category)} title="Edit Category">
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => confirmDeleteCategory(category.id)}
                          title="Delete Category"
                          disabled={category.spent > 0}
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="icon-button" onClick={() => addExpense(category.id)} title="Add Expense">
                          <Plus size={16} />
                        </button>
                      </div>

                      {category.spent > 0 && <div className="text-xs text-gray-500 mt-1">Cannot delete category with expenses</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="notes-section">
          <div className="notes-header">
            <h3>Meeting Notes & Minutes</h3>
            <p>Record and manage meeting minutes and important notes for church activities.</p>

            <div className="notes-actions">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              <select className="form-select" value={notesFilter} onChange={(e) => setNotesFilter(e.target.value)}>
                <option value="all">All Notes</option>
                <option value="meeting">Meetings</option>
                <option value="sermon">Sermons</option>
                <option value="event">Events</option>
                <option value="other">Other</option>
              </select>

              <button className="button button-primary" onClick={openAddNote}>
                <Plus size={16} /> New Note
              </button>
            </div>
          </div>

          <div className="notes-grid">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <div key={note.id} className="note-card">
                  <div className="note-header">
                    <h3>{note.title}</h3>
                    <div className="note-actions">
                      <button
                        className="btn-icon"
                        onClick={() => {
                          setNewNote({ ...note, date: (note.date || "").split("T")[0] })
                          setSelectedNote(note)
                          setIsNoteModalOpen(true)
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button className="btn-icon delete" onClick={() => deleteNote(note.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="note-content">
                    {note.content &&
                      typeof note.content === "string" &&
                      note.content.split("\n").map((para, i) => para && <p key={i}>{para}</p>)}
                  </div>

                  <div className="note-footer">
                    <span className="note-date">{formatDate(note.date)}</span>
                    <span className={`note-category ${note.category}`}>{note.category}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <FileText size={48} />
                <p>No notes found. Create your first note!</p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  ))

  /* User Management - Memoized to prevent re-renders */
  const UserManagementSection = React.memo(() => (
    <div className="section-container">
      <div className="section-header-fixed">
        <h2 className="section-title">
          <Users /> User Management
        </h2>
        <p className="section-description">Manage user accounts, roles, permissions, and sermon/teaching templates.</p>

        <div className="section-tabs">
          <button className={`tab-button ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
            <Users size={16} /> Users
          </button>
          <button className={`tab-button ${activeTab === "sermons" ? "active" : ""}`} onClick={() => setActiveTab("sermons")}>
            <BookOpen size={16} /> Sermon & Teaching Templates
          </button>
        </div>
      </div>

      <div className="tab-content-scrollable">
        {activeTab === "users" && (
        <div className="users-section">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">User Roles</h3>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Permissions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="user-roles-tbody">
                    <tr>
                      <td className="user-role-cell user-role-name">Administrator</td>
                      <td className="user-role-cell">Full access to all features</td>
                      <td className="user-role-cell">All permissions</td>
                    </tr>
                    <tr>
                      <td className="user-role-cell user-role-name">Pastor</td>
                      <td className="user-role-cell">Access to most features</td>
                      <td className="user-role-cell">All except user management</td>
                    </tr>
                    <tr>
                      <td className="user-role-cell user-role-name">Secretary</td>
                      <td className="user-role-cell">Limited access to data entry</td>
                      <td className="user-role-cell">Data entry, view reports</td>
                    </tr>
                    <tr>
                      <td className="user-role-cell user-role-name">Member</td>
                      <td className="user-role-cell">Basic access</td>
                      <td className="user-role-cell">View own data, basic features</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="user-management-section mt-6">
            <h3 className="user-management-title">Add New User</h3>
            <div className="user-form-container">
              <div className="user-form-grid">
                <div>
                  <label className="user-form-label">Full Name</label>
                  <input type="text" className="user-form-input" placeholder="John Doe" value={newUser.name} onChange={(e) => setNewUser((s) => ({ ...s, name: e.target.value }))} />
                </div>
                <div>
                  <label className="user-form-label">Email</label>
                  <input type="email" className="user-form-input" placeholder="john@example.com" value={newUser.email} onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))} />
                </div>
                <div>
                  <label className="user-form-label">Role</label>
                  <select className="user-form-select" value={newUser.role} onChange={(e) => setNewUser((s) => ({ ...s, role: e.target.value }))}>
                    <option>Administrator</option>
                    <option>Pastor</option>
                    <option>Secretary</option>
                    <option>Member</option>
                  </select>
                </div>
                <div className="user-form-button-container">
                  <button className="user-form-button primary" onClick={addUser}>
                    <UserPlus size={16} /> Add User
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="card mt-6">
            <div className="card-header">
              <h3 className="card-title">Current Users</h3>
              <span className="card-subtitle">{users.length} total users</span>
            </div>
            <div className="card-body">
              {users.length > 0 ? (
                <div className="users-list">
                  {users.map((user) => (
                    <div key={user.id} className="user-item">
                      <div className="user-avatar">
                        <User size={20} />
                      </div>
                      <div className="user-details">
                        <h4 className="user-name">{user.name}</h4>
                        <p className="user-email">{user.email}</p>
                      </div>
                      <div className="user-role-badge">
                        {user.role}
                      </div>
                      <button
                        className="icon-button delete-btn"
                        onClick={() => {
                          if (window.confirm(`Remove user "${user.name}"?`)) {
                            setUsers((prev) => prev.filter((u) => u.id !== user.id))
                          }
                        }}
                        title="Remove User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-small">
                  <Users size={32} className="text-gray-400" />
                  <p>No users found. Add your first user above.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "sermons" && (
        <div className="sermon-templates mt-6">
          <div className="templates-header">
            <div>
              <h3>Sermon & Teaching Templates</h3>
              <p>Create and manage templates for sermons, Bible studies, and devotionals with rich formatting.</p>
            </div>

            <div className="templates-actions">
              <select className="form-select" value={templateType} onChange={(e) => setTemplateType(e.target.value)}>
                <option value="sermon">Sermon Templates</option>
                <option value="bible_study">Bible Study Templates</option>
                <option value="devotional">Devotional Templates</option>
              </select>

              <button
                className="button button-primary"
                onClick={() => openTemplateEditor()}
              >
                <Plus size={16} /> New Template
              </button>
            </div>
          </div>

          <div className="templates-grid mt-4">
            {sermonTemplates.filter((t) => t.type === templateType).map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <div className="template-title-section">
                    <h4>{template.title}</h4>
                    <span className="template-type-badge">{template.type.replace("_", " ")}</span>
                  </div>
                  <div className="template-actions">
                    <button
                      className="icon-button"
                      onClick={() => openTemplateEditor(template)}
                      title="Edit Template"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => duplicateTemplate(template)}
                      title="Duplicate Template"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => projectTemplate(template)}
                      title="Preview Full Screen"
                    >
                      <Maximize2 size={16} />
                    </button>
                    <button
                      className="icon-button delete-btn"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this template?")) deleteTemplate(template.id)
                      }}
                      title="Delete Template"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div 
                  className="template-preview"
                  style={{
                    backgroundColor: template.backgroundColor || "#ffffff",
                    backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                >
                  <div 
                    className="template-preview-content"
                    style={{
                      color: template.fontColor || "#111827",
                      fontFamily: template.fontFamily || "Arial, sans-serif",
                      fontSize: "12px",
                      textAlign: template.textAlign || "left",
                      backgroundColor: template.backgroundImage ? "rgba(255,255,255,0.9)" : "transparent",
                      padding: "1rem",
                      borderRadius: "0.25rem"
                    }}
                    dangerouslySetInnerHTML={{ __html: marked(template.template || "No content") }}
                  />
                </div>

                <div className="template-meta">
                  <div className="template-meta-item">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">{template.createdAt ? formatDate(template.createdAt) : "N/A"}</span>
                  </div>
                  <div className="template-meta-item">
                    <span className="meta-label">Updated:</span>
                    <span className="meta-value">{template.updatedAt ? formatDate(template.updatedAt) : "N/A"}</span>
                  </div>
                </div>

                <div className="template-footer">
                  <button
                    className="template-action-btn"
                    onClick={() => {
                      navigator.clipboard?.writeText(template.template)
                      alert("Template content copied to clipboard!")
                    }}
                  >
                    <Copy size={14} /> Copy Content
                  </button>
                  <button
                    className="template-action-btn primary"
                    onClick={() => projectTemplate(template)}
                  >
                    <Maximize2 size={14} /> Present
                  </button>
                </div>
              </div>
            ))}
          </div>

          {sermonTemplates.filter((t) => t.type === templateType).length === 0 && (
            <div className="empty-state mt-6">
              <BookOpen size={48} />
              <h4>No {templateType.replace("_", " ")} templates yet</h4>
              <p>Create your first {templateType.replace("_", " ").toLowerCase()} template to get started with organized teaching materials.</p>
              <button
                className="button button-primary mt-4"
                onClick={() => openTemplateEditor()}
              >
                <Plus size={16} /> Create {templateType.replace("_", " ")} Template
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  ))

  /* Runtime Metrics Component - Isolated to prevent parent re-renders */
  const RuntimeMetricsCard = React.memo(({ 
    uptime, 
    lastUpdated, 
    notesCount, 
    templatesCount, 
    usersCount 
  }) => (
    <div className="system-info-card">
      <div className="system-info-card-header">
        <div className="system-info-icon activity">
          <Activity size={24} />
        </div>
        <h3>App Usage</h3>
      </div>
      <div className="system-info-card-body">
        <div className="system-stat">
          <span className="stat-label">Uptime:</span>
          <span className="stat-value">{uptime}</span>
        </div>
        <div className="system-stat">
          <span className="stat-label">Current Page:</span>
          <span className="stat-value">Settings</span>
        </div>
        <div className="system-stat">
          <span className="stat-label">Last Updated:</span>
          <span className="stat-value">{lastUpdated}</span>
        </div>
        <div className="system-stat">
          <span className="stat-label">Total Notes:</span>
          <span className="stat-value">{notesCount}</span>
        </div>
        <div className="system-stat">
          <span className="stat-label">Total Templates:</span>
          <span className="stat-value">{templatesCount}</span>
        </div>
        <div className="system-stat">
          <span className="stat-label">Total Users:</span>
          <span className="stat-value">{usersCount}</span>
        </div>
      </div>
    </div>
  ))

  /* System Settings - Now memoized since runtime metrics are isolated */
  const SystemSettingsSection = React.memo(() => (
    <div className="system-settings section-container">
      <h2 className="section-title">
        <SettingsIcon /> System Information & Usage
      </h2>
      <p className="section-description">Monitor system performance, storage, and configure application settings.</p>

      {/* System Info Cards Grid */}
      <div className="system-cards-grid">
        {/* App Usage Card - Isolated Runtime Metrics */}
        <RuntimeMetricsCard
          uptime={runtimeMetrics.uptime}
          lastUpdated={runtimeMetrics.lastUpdated}
          notesCount={notes.length}
          templatesCount={sermonTemplates.length}
          usersCount={users.length}
        />

        {/* Page Usage Card */}
        <div className="system-info-card">
          <div className="system-info-card-header">
            <div className="system-info-icon chart">
              <PieChart size={24} />
            </div>
            <h3>Page Usage</h3>
          </div>
          <div className="system-info-card-body">
            {Object.entries(systemInfo.pageTimes || {}).length > 0 ? (
              Object.entries(systemInfo.pageTimes).map(([page, time]) => (
                <div key={page} className="system-stat">
                  <span className="stat-label">{page}:</span>
                  <span className="stat-value">{time}</span>
                </div>
              ))
            ) : (
              <div className="empty-state-small">
                <PieChart size={32} className="text-gray-400" />
                <p>No page usage data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Storage Card */}
        <div className="system-info-card">
          <div className="system-info-card-header">
            <div className="system-info-icon storage">
              <HardDrive size={24} />
            </div>
            <h3>Storage</h3>
          </div>
          <div className="system-info-card-body">
            <div className="storage-stats">
              <div className="storage-info">
                <span className="stat-label">Used:</span>
                <span className="stat-value highlight">{systemInfo.storageUsed}</span>
              </div>
              <div className="storage-info">
                <span className="stat-label">Total:</span>
                <span className="stat-value">{systemInfo.totalStorage}</span>
              </div>
            </div>

            <div className="storage-bar-container">
              <div className="storage-bar-track">
                <div 
                  className="storage-bar-fill" 
                  style={{ 
                    width: `${storagePercent}%`,
                    backgroundColor: storagePercent > 80 ? '#ef4444' : storagePercent > 60 ? '#f59e0b' : '#3b82f6'
                  }} 
                />
              </div>
              <span className="storage-percentage">{storagePercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page Section Wrapper */}
      <div className="page-section">
        {/* Storage Breakdown Card */}
        {/* Application Settings Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Database size={20} />
              Storage Breakdown
            </h3>
          <p className="card-subtitle">Detailed storage usage by data type (Updates automatically)</p>
        </div>
        <div className="card-body">
          <div className="storage-breakdown-list">
            {getStorageBreakdown().map((item, index) => {
              const itemPercent = (item.bytes / usedStorageBytes) * 100
              return (
                <div key={index} className="storage-breakdown-item">
                  <div className="storage-breakdown-info">
                    <span className="storage-breakdown-label">{item.label}</span>
                    <span className="storage-breakdown-size">{item.formatted}</span>
                  </div>
                  <div className="storage-breakdown-bar">
                    <div 
                      className="storage-breakdown-fill"
                      style={{ 
                        width: `${itemPercent}%`,
                        backgroundColor: '#3b82f6'
                      }}
                    />
                  </div>
                  <span className="storage-breakdown-percent">{itemPercent.toFixed(1)}%</span>
                </div>
              )
            })}
            
            {getStorageBreakdown().length === 0 && (
              <div className="empty-state-small">
                <Database size={32} className="text-gray-400" />
                <p>No data stored yet</p>
              </div>
            )}
          </div>

          <div className="storage-summary mt-4">
            <div className="storage-summary-item">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Items:</span>
              <span className="text-sm font-semibold">{getStorageBreakdown().length}</span>
            </div>
            <div className="storage-summary-item">
              <span className="text-sm text-gray-600 dark:text-gray-400">Used Space:</span>
              <span className="text-sm font-semibold">{systemInfo.storageUsed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Application Settings Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <SettingsIcon size={20} />
            Application Settings
          </h3>
          <p className="card-subtitle">Configure application behavior and preferences</p>
        </div>
        <div className="card-body">
          {/* Offline Mode Toggle */}
          <div className="settings-toggle-item">
            <div className="settings-toggle-content">
              <div className="settings-toggle-header">
                <Wifi size={20} className={settings.offlineMode ? "text-gray-400" : "text-green-500"} />
                <h4>Online Mode</h4>
                <span className={`status-pill ${settings.offlineMode ? "inactive" : "active"}`}>
                  {settings.offlineMode ? "Inactive" : "Active"}
                </span>
              </div>
              <p className="settings-toggle-description">
                {settings.offlineMode 
                  ? "App is currently in inactive mode. Some features may be limited." 
                  : "App is currently online. All features are available."}
              </p>
            </div>
            <label className="toggle-switch" title="Toggle Online/Offline Mode">
              <input 
                type="checkbox" 
                className="toggle-input" 
                checked={!settings.offlineMode} 
                onChange={() => setSettings((s) => ({ ...s, offlineMode: !s.offlineMode }))} 
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-divider"></div>

          {/* Auto-save Toggle */}
          <div className="settings-toggle-item">
            <div className="settings-toggle-content">
              <div className="settings-toggle-header">
                <Save size={20} className="text-blue-500" />
                <h4>Auto-save Changes</h4>
                <span className={`status-pill ${settings.autoSave ? "active" : "inactive"}`}>
                  {settings.autoSave ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="settings-toggle-description">
                Automatically save changes to your work as you go. Recommended for data safety.
              </p>
            </div>
            <label className="toggle-switch" title="Toggle Auto-save">
              <input 
                type="checkbox" 
                className="toggle-input" 
                checked={settings.autoSave} 
                onChange={() => setSettings((s) => ({ ...s, autoSave: !s.autoSave }))} 
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-divider"></div>

          {/* Dark Mode Toggle */}
          <div className="settings-toggle-item">
            <div className="settings-toggle-content">
              <div className="settings-toggle-header">
                <Moon size={20} className="text-purple-500" />
                <h4>Dark Mode</h4>
                <span className={`status-pill ${settings.darkMode ? "active" : "inactive"}`}>
                  {settings.darkMode ? "Dark" : "Light"}
                </span>
              </div>
              <p className="settings-toggle-description">
                Switch between light and dark theme. Dark mode reduces eye strain in low light.
              </p>
            </div>
            <label className="toggle-switch" title="Toggle Dark Mode">
              <input 
                type="checkbox" 
                className="toggle-input" 
                checked={settings.darkMode} 
                onChange={() => setSettings((s) => ({ ...s, darkMode: !s.darkMode }))} 
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="system-actions-card">
        <div className="action-buttons-group">
          <button className="btn btn-primary" onClick={updateStorageUsage}>
            <RefreshCw size={16} /> Refresh Storage
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (window.confirm("Are you sure you want to clear all usage data?")) {
                setSystemInfo((prev) => ({ ...prev, pageTimes: {}, uptime: "00:00:00" }))
                alert("Usage data cleared successfully!")
              }
            }}
          >
            <Trash2 size={16} /> Clear Usage Data
          </button>
          <button className="btn btn-success" onClick={createBackup}>
            <Download size={16} /> Create Backup
          </button>
        </div>
      </div>
      </div>
    </div>
  ))

  /* Main render (layout) */
  return (
    <div className="settings-container">
      <div className="settings-wrapper">
        <div className="settings-header">
          <h1 className="settings-title">
            <SettingsIcon size={28} />
            Admin Settings
          </h1>

          <div className={`status-badge ${settings.offlineMode ? "inactive" : "live"}`}>
            {settings.offlineMode ? (
              <>
                <WifiOff size={16} /> Inactive Mode
              </>
            ) : (
              <>
                <Wifi size={16} /> Live
              </>
            )}
          </div>
        </div>

        <div className="settings-grid">
          {/* Sidebar */}
          <div className="sidebar-container">
            <nav className="sidebar-nav">
              <button className={`nav-button ${activeSection === SECTIONS.REPORTS ? "active" : ""}`} onClick={() => setActiveSection(SECTIONS.REPORTS)}>
                <FileText size={18} /> Reports
              </button>

              <button
                className={`nav-button ${activeSection === SECTIONS.DATA_MANAGEMENT ? "active" : ""}`}
                onClick={() => {
                  setActiveSection(SECTIONS.DATA_MANAGEMENT)
                  setActiveTab("budget")
                }}
              >
                <Database size={18} /> Data Management
              </button>

              <button
                className={`nav-button ${activeSection === SECTIONS.USER_MANAGEMENT ? "active" : ""}`}
                onClick={() => {
                  setActiveSection(SECTIONS.USER_MANAGEMENT)
                  setActiveTab("users") // Set to users tab when clicking User Management
                }}
              >
                <User size={18} /> User Management
              </button>

              <button className={`nav-button ${activeSection === SECTIONS.SYSTEM_SETTINGS ? "active" : ""}`} onClick={() => setActiveSection(SECTIONS.SYSTEM_SETTINGS)}>
                <SettingsIcon size={18} /> System Settings
              </button>
            </nav>

            <div className="system-info-card mt-6">
              <h3 className="system-info-title">System Information</h3>
              <div className="info-grid">
                <div className="info-row">
                  <span>Version:</span>
                  <span className="info-value">{systemInfo.appVersion}</span>
                </div>
                <div className="info-row">
                  <span>Storage:</span>
                  <span className="info-value">
                    {systemInfo.storageUsed} / {systemInfo.totalStorage}
                    <div className="storage-mini-bar mt-2">
                      <div className="storage-mini-progress" style={{ width: `${storagePercent}%` }} />
                    </div>
                  </span>
                </div>
                <div className="info-row">
                  <span>Uptime:</span>
                  <span className="info-value">{runtimeMetrics.uptime}</span>
                </div>
                <div className="info-row">
                  <span>Last Backup:</span>
                  <span className="info-value">{systemInfo.lastBackup ? formatDate(systemInfo.lastBackup) : "Never"}</span>
                </div>
                <div className="info-row">
                  <span>Last Sync:</span>
                  <span className="info-value">{systemInfo.lastSync || "Never"}</span>
                </div>
              </div>

              <button onClick={createBackup} className="button button-primary button-full mt-3">
                <Database size={16} /> Create Backup
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="settings-content">
            {activeSection === SECTIONS.REPORTS && <ReportsSection />}
            {activeSection === SECTIONS.DATA_MANAGEMENT && <DataManagementSection />}
            {activeSection === SECTIONS.USER_MANAGEMENT && <UserManagementSection />}
            {activeSection === SECTIONS.SYSTEM_SETTINGS && <SystemSettingsSection />}
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNoteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedNote ? "Edit Note" : "New Note"}</h3>
              <button className="modal-close-btn" onClick={() => setIsNoteModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={newNote.title} onChange={(e) => setNewNote((s) => ({ ...s, title: e.target.value }))} placeholder="Enter note title" />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select value={newNote.category} onChange={(e) => setNewNote((s) => ({ ...s, category: e.target.value }))}>
                  <option value="meeting">Meeting</option>
                  <option value="sermon">Sermon</option>
                  <option value="event">Event</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input type="date" value={newNote.date} onChange={(e) => setNewNote((s) => ({ ...s, date: e.target.value }))} />
              </div>

              <div className="form-group">
                <label>Content</label>
                <textarea rows={10} value={newNote.content} onChange={(e) => setNewNote((s) => ({ ...s, content: e.target.value }))} placeholder="Write your note content here..." />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsNoteModalOpen(false)}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (selectedNote) {
                      updateNote(selectedNote.id, newNote)
                      setSelectedNote(null)
                    } else {
                      addNote()
                    }
                  }}
                >
                  {selectedNote ? "Update Note" : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Template Editor */}
      {templateEditorMode && (
        <div className="template-editor-fullscreen">
          {/* Editor Header */}
          <div className="template-editor-header">
            <div className="template-editor-title-section">
              <button className="back-button" onClick={closeTemplateEditor} title="Back to Templates (ESC)">
                <X size={20} />
                <span>Back</span>
              </button>
              <div className="template-editor-title-info">
                <h2>{newTemplate.id ? "Edit Template" : "Create New Template"}</h2>
                <p>Design your {newTemplate.type?.replace("_", " ") || "template"} with custom styling and content</p>
              </div>
            </div>
            
            <div className="template-editor-actions">
              <button 
                className="button-secondary button-sm" 
                onClick={() => projectTemplate(newTemplate)} 
                title="Preview Full Screen"
              >
                <Maximize2 size={14} />
                Preview
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (newTemplate.id) {
                    updateTemplate(newTemplate.id, newTemplate)
                  } else {
                    addTemplate()
                  }
                }}
              >
                <Save size={16} />
                {newTemplate.id ? "Update Template" : "Save Template"}
              </button>
            </div>
          </div>

          {/* Editor Content - Scrollable */}
          <div className="template-editor-content">
            <div className="template-editor-grid">
              {/* Left Column - Settings */}
              <div className="template-editor-sidebar">
                {/* Basic Info Section */}
                <div className="form-section">
                  <h4 className="form-section-title">Basic Information</h4>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Template Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g., Sunday Morning Sermon" 
                      value={newTemplate.title} 
                      onChange={(e) => setNewTemplate((s) => ({ ...s, title: e.target.value }))} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Template Type</label>
                    <select 
                      className="form-select" 
                      value={newTemplate.type} 
                      onChange={(e) => setNewTemplate((s) => ({ ...s, type: e.target.value }))}
                    >
                      <option value="sermon">Sermon</option>
                      <option value="bible_study">Bible Study</option>
                      <option value="devotional">Devotional</option>
                    </select>
                  </div>
                </div>

                {/* Background Section */}
                <div className="form-section">
                  <h4 className="form-section-title">Background & Colors</h4>
                  
                  <div className="form-group">
                    <label className="form-label">Background Image (Optional)</label>
                    <div className="template-image-upload-container">
                      {newTemplate.backgroundImage ? (
                        <div className="template-image-preview">
                          <img src={newTemplate.backgroundImage} alt="Background preview" className="template-preview-img" />
                          <button 
                            type="button" 
                            onClick={clearBackgroundImage} 
                            className="template-remove-image-btn" 
                            aria-label="Remove background image"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="template-upload-placeholder">
                          <p className="template-upload-placeholder-text">No background image selected</p>
                          <p className="text-xs text-gray-500 mt-1">Recommended: 1920x1080 (16:9)</p>
                        </div>
                      )}
                    </div>

                    <label className="template-upload-label">
                      {newTemplate.backgroundImage ? "Change Background Image" : "Upload Background Image"}
                      <input type="file" className="template-file-input" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Text Color</label>
                      <div className="color-picker-wrapper">
                        <input 
                          type="color" 
                          className="color-input" 
                          value={newTemplate.fontColor} 
                          onChange={(e) => setNewTemplate((s) => ({ ...s, fontColor: e.target.value }))} 
                        />
                        <input 
                          type="text" 
                          className="color-text-input" 
                          value={newTemplate.fontColor} 
                          onChange={(e) => setNewTemplate((s) => ({ ...s, fontColor: e.target.value }))} 
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Background Color</label>
                      <div className="color-picker-wrapper">
                        <input 
                          type="color" 
                          className="color-input" 
                          value={newTemplate.backgroundColor} 
                          onChange={(e) => setNewTemplate((s) => ({ ...s, backgroundColor: e.target.value }))} 
                        />
                        <input 
                          type="text" 
                          className="color-text-input" 
                          value={newTemplate.backgroundColor} 
                          onChange={(e) => setNewTemplate((s) => ({ ...s, backgroundColor: e.target.value }))} 
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography Section */}
                <div className="form-section">
                  <h4 className="form-section-title">Typography</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Font Family</label>
                      <select 
                        className="form-select" 
                        value={newTemplate.fontFamily} 
                        onChange={(e) => setNewTemplate((s) => ({ ...s, fontFamily: e.target.value }))}
                      >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="'Georgia', serif">Georgia</option>
                        <option value="'Verdana', sans-serif">Verdana</option>
                        <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Font Size</label>
                      <select 
                        className="form-select" 
                        value={newTemplate.fontSize} 
                        onChange={(e) => setNewTemplate((s) => ({ ...s, fontSize: e.target.value }))}
                      >
                        <option value="12px">12px - Small</option>
                        <option value="14px">14px</option>
                        <option value="16px">16px - Default</option>
                        <option value="18px">18px</option>
                        <option value="20px">20px - Large</option>
                        <option value="24px">24px</option>
                        <option value="28px">28px - Extra Large</option>
                        <option value="32px">32px</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Line Height</label>
                    <select 
                      className="form-select" 
                      value={newTemplate.lineHeight} 
                      onChange={(e) => setNewTemplate((s) => ({ ...s, lineHeight: parseFloat(e.target.value) }))}
                    >
                      <option value="1.2">Tight (1.2)</option>
                      <option value="1.4">Normal (1.4)</option>
                      <option value="1.6">Relaxed (1.6)</option>
                      <option value="1.8">Loose (1.8)</option>
                      <option value="2.0">Extra Loose (2.0)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Text Alignment</label>
                    <div className="flex gap-2">
                      <button 
                        className={`alignment-btn ${newTemplate.textAlign === "left" ? "active" : ""}`}
                        onClick={() => setNewTemplate((s) => ({ ...s, textAlign: "left" }))} 
                        title="Align Left"
                      >
                        <AlignLeft size={18} />
                        <span>Left</span>
                      </button>
                      <button 
                        className={`alignment-btn ${newTemplate.textAlign === "center" ? "active" : ""}`}
                        onClick={() => setNewTemplate((s) => ({ ...s, textAlign: "center" }))} 
                        title="Center"
                      >
                        <AlignCenter size={18} />
                        <span>Center</span>
                      </button>
                      <button 
                        className={`alignment-btn ${newTemplate.textAlign === "right" ? "active" : ""}`}
                        onClick={() => setNewTemplate((s) => ({ ...s, textAlign: "right" }))} 
                        title="Align Right"
                      >
                        <AlignRight size={18} />
                        <span>Right</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Content & Preview */}
              <div className="template-editor-main">
                {/* Content Section */}
                <div className="form-section">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="form-section-title mb-1">Template Content</h4>
                      <p className="text-xs text-gray-500">Use Markdown for formatting. Supports headers, lists, bold, italic, etc.</p>
                    </div>
                  </div>

                  <textarea
                    className="template-content-textarea"
                    value={newTemplate.template}
                    onChange={(e) => setNewTemplate((s) => ({ ...s, template: e.target.value }))}
                    rows={16}
                    placeholder="# Sermon Title&#10;&#10;**Date:** [Date]&#10;**Text:** [Scripture Reference]&#10;&#10;## Introduction&#10;&#10;- Point 1&#10;- Point 2&#10;&#10;## Main Message&#10;&#10;Your message content here..."
                    style={{
                      backgroundColor: newTemplate.backgroundColor,
                      color: newTemplate.fontColor,
                      fontFamily: newTemplate.fontFamily,
                      fontSize: newTemplate.fontSize,
                      lineHeight: newTemplate.lineHeight,
                      textAlign: newTemplate.textAlign || "left",
                    }}
                  />

                  <div className="form-hint">
                    <strong>Markdown Tips:</strong> Use # for headings, **bold**, *italic*, - for lists, [link](url), &gt; for quotes
                  </div>
                </div>

                {/* Live Preview Section */}
                <div className="form-section">
                  <h4 className="form-section-title">Live Preview</h4>
                  <div 
                    className="template-live-preview"
                    style={{
                      backgroundColor: newTemplate.backgroundColor,
                      backgroundImage: newTemplate.backgroundImage ? `url(${newTemplate.backgroundImage})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      minHeight: "300px",
                      borderRadius: "0.5rem",
                      border: "1px solid #e5e7eb",
                      padding: "2rem",
                      overflow: "auto",
                      maxHeight: "500px"
                    }}
                  >
                    <div
                      style={{
                        color: newTemplate.fontColor,
                        fontFamily: newTemplate.fontFamily,
                        fontSize: newTemplate.fontSize,
                        lineHeight: newTemplate.lineHeight,
                        textAlign: newTemplate.textAlign || "left",
                        backgroundColor: newTemplate.backgroundImage ? "rgba(255,255,255,0.95)" : "transparent",
                        padding: newTemplate.backgroundImage ? "1.5rem" : "0",
                        borderRadius: "0.375rem"
                      }}
                      dangerouslySetInnerHTML={{ __html: marked(newTemplate.template || "*No content to preview*") }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Modal (replaces window.prompt()) */}
      {inputModal.isOpen && (
        <div className="modal-overlay" onClick={() => setInputModal({ ...inputModal, isOpen: false })}>
          <div className="modal-content input-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{inputModal.title}</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setInputModal({ ...inputModal, isOpen: false })}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault()
                if (inputModal.onSubmit) {
                  inputModal.onSubmit(inputValues)
                }
              }}>
                {inputModal.fields.map((field) => (
                  <div key={field.name} className="form-group">
                    <label htmlFor={field.name}>{field.label}</label>
                    <input
                      type={field.type || "text"}
                      id={field.name}
                      value={inputValues[field.name] || field.defaultValue || ""}
                      onChange={(e) => setInputValues({ ...inputValues, [field.name]: e.target.value })}
                      placeholder={field.label}
                      autoFocus={field === inputModal.fields[0]}
                    />
                  </div>
                ))}
                <div className="modal-actions">
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => setInputModal({ ...inputModal, isOpen: false })}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
