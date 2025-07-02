import { useState, useEffect, useRef } from "react"
import { Download, Settings, User, Database, WifiOff, Wifi, FileText, DollarSign, BookOpen, FileTextIcon, PieChart, Users, HardDrive, Activity, Save, Moon, Search, Plus, Pencil, Trash2, RefreshCw, UserPlus, Copy, X } from "lucide-react"
import { marked } from "marked"
import "./Settings.css"

// Settings Sections
const SECTIONS = {
  REPORTS: "reports",
  DATA_MANAGEMENT: "data",
  USER_MANAGEMENT: "users",
  SYSTEM_SETTINGS: "system",
  BUDGET: "budget",
  NOTES: "notes",
  SERMONS: "sermons",
  MEMBERS: "members",
  EVENTS: "events",
}

// Budget categories
const BUDGET_CATEGORIES = [
  "Tithes & Offerings",
  "Missions",
  "Building Maintenance",
  "Utilities",
  "Staff Salaries",
  "Outreach Programs",
  "Worship Ministry",
  "Children's Ministry",
  "Youth Ministry",
  "Other Expenses",
]

// Member categories
const MEMBER_CATEGORIES = [
  { id: "all", label: "All Members", icon: <Users size={16} /> },
  { id: "men", label: "Men", icon: <Users size={16} /> },
  { id: "women", label: "Women", icon: <Users size={16} /> },
  { id: "youth", label: "Youth", icon: <Users size={16} /> },
  { id: "children", label: "Children", icon: <Users size={16} /> },
]

const SettingsPage = () => {
  // Active section state
  const [activeSection, setActiveSection] = useState(SECTIONS.REPORTS)
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [templateType, setTemplateType] = useState("sermon")

  // Expense functions
  const handleExpenseFormChange = (e) => {
    const { name, value, files } = e.target
    setExpenseForm(prev => ({
      ...prev,
      [name]: name === 'amount' 
        ? value.replace(/[^0-9.]/g, '') 
        : name === 'receipt' 
          ? files[0] 
          : value
    }))
  }

  const validateExpenseForm = () => {
    if (!expenseForm.categoryId) {
      setError('Please select a category')
      return false
    }
    if (!expenseForm.amount || isNaN(parseFloat(expenseForm.amount)) || parseFloat(expenseForm.amount) <= 0) {
      setError('Please enter a valid amount')
      return false
    }
    if (!expenseForm.date) {
      setError('Please select a date')
      return false
    }
    return true
  }

  const saveExpense = () => {
    if (!validateExpenseForm()) return
    
    setIsLoading(true)
    setError('')
    
    try {
      const now = new Date().toISOString()
      const amount = parseFloat(expenseForm.amount)
      const categoryId = expenseForm.categoryId
      
      // Create or update expense
      let updatedExpenses = [...budget.expenses]
      const expenseData = {
        id: expenseForm.id || Date.now(),
        categoryId,
        amount,
        date: expenseForm.date,
        description: expenseForm.description,
        receipt: expenseForm.receipt,
        createdAt: expenseForm.createdAt || now,
        updatedAt: now
      }
      
      if (expenseForm.id) {
        // Update existing expense
        const expenseIndex = updatedExpenses.findIndex(e => e.id === expenseForm.id)
        if (expenseIndex !== -1) {
          // Subtract old amount from category
          const oldExpense = updatedExpenses[expenseIndex]
          const oldAmount = parseFloat(oldExpense.amount)
          
          updatedExpenses[expenseIndex] = expenseData
          
          // Update category spent amount (subtract old, add new)
          updateCategorySpent(categoryId, amount - oldAmount, oldExpense.categoryId !== categoryId ? oldExpense.categoryId : null)
        }
      } else {
        // Add new expense
        updatedExpenses.push(expenseData)
        // Update category spent amount
        updateCategorySpent(categoryId, amount)
      }
      
      // Update budget with new expenses
      const totals = calculateBudgetTotals(budget.categories)
      setBudget(prev => ({
        ...prev,
        expenses: updatedExpenses,
        ...totals
      }))
      
      setShowAddExpense(false)
      
    } catch (err) {
      console.error('Error saving expense:', err)
      setError('Failed to save expense. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const updateCategorySpent = (categoryId, amount, oldCategoryId = null) => {
    setBudget(prev => {
      const updatedCategories = [...prev.categories]
      
      // If category changed, subtract from old category
      if (oldCategoryId) {
        const oldCategoryIndex = updatedCategories.findIndex(c => c.id === oldCategoryId)
        if (oldCategoryIndex !== -1) {
          updatedCategories[oldCategoryIndex] = {
            ...updatedCategories[oldCategoryIndex],
            spent: Math.max(0, updatedCategories[oldCategoryIndex].spent - amount)
          }
        }
      }
      
      // Add to new category
      const categoryIndex = updatedCategories.findIndex(c => c.id === categoryId)
      if (categoryIndex !== -1) {
        updatedCategories[categoryIndex] = {
          ...updatedCategories[categoryIndex],
          spent: (updatedCategories[categoryIndex].spent || 0) + amount
        }
      }
      
      return {
        ...prev,
        categories: updatedCategories
      }
    })
  }
  
  const deleteExpense = (expenseId) => {
    const expense = budget.expenses.find(e => e.id === expenseId)
    if (!expense) return
    
    try {
      // Update category spent amount
      setBudget(prev => {
        const updatedCategories = [...prev.categories]
        const categoryIndex = updatedCategories.findIndex(c => c.id === expense.categoryId)
        
        if (categoryIndex !== -1) {
          updatedCategories[categoryIndex] = {
            ...updatedCategories[categoryIndex],
            spent: Math.max(0, updatedCategories[categoryIndex].spent - expense.amount)
          }
        }
        
        const updatedExpenses = prev.expenses.filter(e => e.id !== expenseId)
        const totals = calculateBudgetTotals(updatedCategories)
        
        return {
          ...prev,
          categories: updatedCategories,
          expenses: updatedExpenses,
          ...totals
        }
      })
      
    } catch (err) {
      console.error('Error deleting expense:', err)
      setError('Failed to delete expense. Please try again.')
    }
  }
  
  const openAddExpense = () => {
    setExpenseForm({
      id: null,
      categoryId: budget.categories[0]?.id || '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      receipt: null
    })
    setError('')
    setShowAddExpense(true)
  }
  
  const openEditExpense = (expense) => {
    setExpenseForm({
      id: expense.id,
      categoryId: expense.categoryId,
      amount: expense.amount.toString(),
      date: expense.date.split('T')[0],
      description: expense.description || '',
      receipt: expense.receipt,
      createdAt: expense.createdAt
    })
    setError('')
    setShowAddExpense(true)
  }

  // Budget functions
  const openAddCategory = () => {
    setBudgetForm({
      id: null,
      name: '',
      allocated: '',
      description: ''
    })
    setError('')
    setIsBudgetFormOpen(true)
  }

  const openEditCategory = (category) => {
    setBudgetForm({
      id: category.id,
      name: category.name,
      allocated: category.allocated,
      description: category.description || ''
    })
    setError('')
    setIsBudgetFormOpen(true)
  }

  const handleBudgetFormChange = (e) => {
    const { name, value } = e.target
    setBudgetForm(prev => ({
      ...prev,
      [name]: name === 'allocated' ? value.replace(/[^0-9.]/g, '') : value
    }))
  }

  const validateBudgetForm = () => {
    if (!budgetForm.name.trim()) {
      setError('Category name is required')
      return false
    }
    if (!budgetForm.allocated || isNaN(parseFloat(budgetForm.allocated)) || parseFloat(budgetForm.allocated) < 0) {
      setError('Please enter a valid allocated amount')
      return false
    }
    return true
  }

  const saveBudgetCategory = () => {
    if (!validateBudgetForm()) return
    
    setIsLoading(true)
    setError('')
    
    try {
      const updatedCategories = [...budget.categories]
      const now = new Date().toISOString()
      
      if (budgetForm.id) {
        // Update existing category
        const index = updatedCategories.findIndex(cat => cat.id === budgetForm.id)
        if (index !== -1) {
          updatedCategories[index] = {
            ...updatedCategories[index],
            name: budgetForm.name,
            allocated: parseFloat(budgetForm.allocated),
            description: budgetForm.description,
            updatedAt: now
          }
        }
      } else {
        // Add new category
        updatedCategories.push({
          id: Date.now(),
          name: budgetForm.name,
          allocated: parseFloat(budgetForm.allocated),
          spent: 0,
          description: budgetForm.description,
          createdAt: now,
          updatedAt: now
        })
      }
      
      const totals = calculateBudgetTotals(updatedCategories)
      
      setBudget(prev => ({
        ...prev,
        categories: updatedCategories,
        ...totals
      }))
      
      setIsBudgetFormOpen(false)
      
    } catch (err) {
      console.error('Error saving budget category:', err)
      setError('Failed to save category. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDeleteCategory = (categoryId) => {
    setCategoryToDelete(categoryId)
    setIsDeleteConfirmOpen(true)
  }

  const deleteBudgetCategory = () => {
    if (!categoryToDelete) return
    
    try {
      const updatedCategories = budget.categories.filter(cat => cat.id !== categoryToDelete)
      const totals = calculateBudgetTotals(updatedCategories)
      
      setBudget(prev => ({
        ...prev,
        categories: updatedCategories,
        ...totals
      }))
      
      setIsDeleteConfirmOpen(false)
      setCategoryToDelete(null)
      
    } catch (err) {
      console.error('Error deleting category:', err)
      setError('Failed to delete category. Please try again.')
    }
  }

  const exportBudget = () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        ...calculateBudgetTotals(budget.categories),
        categories: budget.categories.map(cat => ({
          name: cat.name,
          allocated: cat.allocated,
          spent: cat.spent,
          remaining: cat.allocated - cat.spent,
          description: cat.description || ''
        }))
      }
      
      // Create and trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `church-budget-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (err) {
      console.error('Error exporting budget:', err)
      setError('Failed to export budget. Please try again.')
    }
  }

  // Track time spent on each page
  const [pageTimes, setPageTimes] = useState({})
  const [currentPage, setCurrentPage] = useState("settings")
  const [lastPageChange, setLastPageChange] = useState(Date.now())

  // Track total app usage time
  const [totalUsageTime, setTotalUsageTime] = useState(0)
  const [appStartTime] = useState(Date.now())

  // Track storage usage
  const [storageUsage, setStorageUsage] = useState({
    total: 0,
    used: 0,
    available: 0,
    usageByType: {},
  })

  // App Settings State
  const [settings, setSettings] = useState({
    offlineMode: false,
    autoSave: true,
    darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
    backupFrequency: "daily",
    notifications: true,
    analytics: true,
  })

  // Apply dark mode when setting changes
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [settings.darkMode])

  // Report Generation State
  const [reportSettings, setReportSettings] = useState({
    reportType: "monthly",
    startDate: "",
    endDate: "",
    format: "pdf",
    includeCharts: true,
  })

  // Budget State
  const [budget, setBudget] = useState({
    categories: BUDGET_CATEGORIES.map((category) => ({
      id: Date.now() + Math.random(),
      name: category,
      allocated: 0,
      spent: 0,
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })),
    totalAllocated: 0,
    totalSpent: 0,
    remainingBalance: 0,
    expenses: [] // Array to store all expenses
  })
  
  // Budget form state
  const [budgetForm, setBudgetForm] = useState({
    id: null,
    name: '',
    allocated: '',
    description: ''
  })
  
  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    id: null,
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    receipt: null
  })
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Calculate budget totals
  const calculateBudgetTotals = (categories) => {
    const totalAllocated = categories.reduce((sum, cat) => sum + (parseFloat(cat.allocated) || 0), 0)
    const totalSpent = categories.reduce((sum, cat) => sum + (parseFloat(cat.spent) || 0), 0)
    return {
      totalAllocated,
      totalSpent,
      remainingBalance: totalAllocated - totalSpent
    }
  }

  // Notes State
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    category: "meeting",
    date: new Date().toISOString().split("T")[0],
  })

  // Sermon Templates State
  const [sermonTemplates, setSermonTemplates] = useState([
    {
      id: 1,
      title: "Sunday Sermon",
      type: "sermon",
      template: "## Title\n\n### Scripture\n\n### Main Points\n1. \n2. \n3. \n\n### Application\n\n### Prayer Points",
      backgroundImage: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Bible Study",
      type: "bible_study",
      template:
        "## Study: [Topic]\n\n### Scripture Reference\n\n### Key Verses\n\n### Discussion Questions\n1. \n2. \n3. \n\n### Application\n\n### Closing Prayer",
      backgroundImage: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ])

  const [newTemplate, setNewTemplate] = useState({
    id: null,
    title: "",
    type: "sermon",
    template: "",
    backgroundImage: "",
  })

  // Handle image upload
  const handleImageUpload = (e, isEdit = false) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const imageDataUrl = reader.result
      setNewTemplate((prev) => ({
        ...prev,
        backgroundImage: imageDataUrl,
      }))
    }
    reader.readAsDataURL(file)
  }

  // Clear background image
  const clearBackgroundImage = () => {
    setNewTemplate((prev) => ({
      ...prev,
      backgroundImage: "",
    }))
  }

  // Close template modal
  const closeTemplateModal = () => {
    const modal = document.getElementById("template-modal")
    if (modal && typeof modal.close === "function") {
      modal.close()
    } else if (modal && modal.style) {
      modal.style.display = "none"
      document.body.style.overflow = "auto"
    }
  }

  // System Info and Usage State
  const [systemInfo, setSystemInfo] = useState({
    appVersion: "1.0.0",
    lastBackup: null,
    storageUsed: "0 MB",
    totalStorage: "1 GB",
    lastSync: "Never",
    appStartTime: new Date(),
    pageTimes: {},
    currentPage: "settings",
  })

  // Refs for tracking time spent
  const pageLoadTime = useRef(Date.now())
  const lastPage = useRef("settings")

  // Initialize component
  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem("appSettings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }

    // Load saved data
    const savedBudget = localStorage.getItem("churchBudget")
    if (savedBudget) {
      setBudget(JSON.parse(savedBudget))
    }

    const savedNotes = localStorage.getItem("churchNotes")
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }

    const savedTemplates = localStorage.getItem("sermonTemplates")
    if (savedTemplates) {
      setSermonTemplates(JSON.parse(savedTemplates))
    }

    // Initialize system info and storage
    loadSystemInfo()
    updateStorageUsage()

    // Set up interval for time tracking
    const interval = setInterval(updateUsageStats, 60000)

    // Set up beforeunload to save time tracking
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      updatePageTime()
    }
  }, [])

  // Track page view time
  useEffect(() => {
    // Update time for the previous page
    updatePageTime()

    // Update current page and reset timer
    lastPage.current = activeSection
    pageLoadTime.current = Date.now()

    // Update system info with current page
    setSystemInfo((prev) => ({
      ...prev,
      currentPage: activeSection,
    }))
  }, [activeSection])

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(settings))
  }, [settings])
  
  // Update budget totals when categories change
  useEffect(() => {
    const totals = calculateBudgetTotals(budget.categories)
    setBudget(prev => ({
      ...prev,
      ...totals
    }))
  }, [budget.categories])

  useEffect(() => {
    localStorage.setItem("churchBudget", JSON.stringify(budget))
  }, [budget])

  useEffect(() => {
    localStorage.setItem("churchNotes", JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    localStorage.setItem("sermonTemplates", JSON.stringify(sermonTemplates))
  }, [sermonTemplates])

  // Update storage usage
  const updateStorageUsage = async () => {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate()
        const usageMB = (estimate.usage / (1024 * 1024)).toFixed(2)
        const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2)

        setSystemInfo((prev) => ({
          ...prev,
          storageUsed: `${usageMB} MB`,
          totalStorage: `${quotaMB} MB`,
        }))
      } catch (error) {
        console.error("Error getting storage estimate:", error)
      }
    }
  }

  // Update page time tracking
  const updatePageTime = () => {
    const now = Date.now()
    const timeSpent = Math.floor((now - pageLoadTime.current) / 1000)

    if (timeSpent > 0) {
      setSystemInfo((prev) => ({
        ...prev,
        pageTimes: {
          ...prev.pageTimes,
          [lastPage.current]: (prev.pageTimes[lastPage.current] || 0) + timeSpent,
        },
      }))
    }

    return timeSpent
  }

  // Update usage stats
  const updateUsageStats = () => {
    const now = new Date()
    const uptime = Math.floor((now - systemInfo.appStartTime) / 1000)

    setSystemInfo((prev) => ({
      ...prev,
      uptime: formatTime(uptime),
      lastUpdated: now.toLocaleString(),
    }))
  }

  // Format time in seconds to a human readable format
  const formatTime = (seconds) => {
    if (!seconds) return "0s"

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

    return parts.join(" ")
  }

  // Handle before unload to save time tracking
  const handleBeforeUnload = () => {
    updatePageTime()
  }

  // Budget functions
  const updateBudgetCategory = (index, field, value) => {
    const newCategories = [...budget.categories]
    const newValue = field === "name" ? value : Number.parseFloat(value) || 0

    newCategories[index] = {
      ...newCategories[index],
      [field]: newValue,
    }

    // Calculate totals
    const totalAllocated = newCategories.reduce((sum, cat) => sum + (Number.parseFloat(cat.allocated) || 0), 0)
    const totalSpent = newCategories.reduce((sum, cat) => sum + (Number.parseFloat(cat.spent) || 0), 0)

    const updatedBudget = {
      categories: newCategories.map((cat) => ({
        ...cat,
        remaining: (Number.parseFloat(cat.allocated) || 0) - (Number.parseFloat(cat.spent) || 0),
      })),
      totalAllocated,
      totalSpent,
      remainingBalance: totalAllocated - totalSpent,
    }

    setBudget(updatedBudget)
    return updatedBudget
  }

  const addBudgetCategory = () => {
    const newCategory = {
      name: `Category ${budget.categories.length + 1}`,
      allocated: 0,
      spent: 0,
      remaining: 0,
    }

    setBudget((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }))
  }

  const removeBudgetCategory = (index) => {
    if (budget.categories.length <= 1) return

    const newCategories = [...budget.categories]
    newCategories.splice(index, 1)

    // Recalculate totals
    const totalAllocated = newCategories.reduce((sum, cat) => sum + (Number.parseFloat(cat.allocated) || 0), 0)
    const totalSpent = newCategories.reduce((sum, cat) => sum + (Number.parseFloat(cat.spent) || 0), 0)

    setBudget({
      categories: newCategories.map((cat) => ({
        ...cat,
        remaining: (Number.parseFloat(cat.allocated) || 0) - (Number.parseFloat(cat.spent) || 0),
      })),
      totalAllocated,
      totalSpent,
      remainingBalance: totalAllocated - totalSpent,
    })
  }

  // Notes functions
  const addNote = () => {
    if (!newNote.title || !newNote.content) return

    const noteToAdd = {
      id: Date.now(),
      ...newNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setNotes([noteToAdd, ...notes])

    // Reset form
    setNewNote({
      title: "",
      content: "",
      category: "meeting",
      date: new Date().toISOString().split("T")[0],
    })

    alert("Note added successfully!")
  }

  const updateNote = (id, updates) => {
    setNotes(
      notes.map((note) =>
        note.id === id
          ? {
              ...note,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    )
  }

  const deleteNote = (id) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      setNotes(notes.filter((note) => note.id !== id))
    }
  }

  // Sermon template functions
  const addTemplate = () => {
    if (!newTemplate.title || !newTemplate.template) {
      alert("Please provide both a title and template content")
      return
    }

    const templateToAdd = {
      id: Date.now(),
      title: newTemplate.title,
      type: newTemplate.type || "sermon",
      template: newTemplate.template,
      backgroundImage: newTemplate.backgroundImage || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setSermonTemplates([...sermonTemplates, templateToAdd])
    setNewTemplate({
      id: null,
      title: "",
      type: "sermon",
      template: "",
      backgroundImage: "",
    })

    alert("Template added successfully!")
  }

  const updateTemplate = (id, updates) => {
    setSermonTemplates(
      sermonTemplates.map((tpl) =>
        tpl.id === id
          ? {
              ...tpl,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : tpl,
      ),
    )
  }

  const deleteTemplate = (id) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      setSermonTemplates(sermonTemplates.filter((tpl) => tpl.id !== id))
    }
  }

  const duplicateTemplate = (template) => {
    setSermonTemplates([
      ...sermonTemplates,
      {
        ...template,
        id: Date.now(),
        title: `${template.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
  }

  const loadSystemInfo = () => {
    setSystemInfo((prev) => ({
      ...prev,
      lastBackup: new Date().toLocaleString(),
      storageUsed: "245.6 MB",
      lastSync: new Date().toLocaleString(),
    }))
  }

  // Toggle offline mode
  const toggleOfflineMode = () => {
    setSettings((prev) => ({
      ...prev,
      offlineMode: !prev.offlineMode,
    }))
  }

  // Track page view time
  const trackPageView = (page) => {
    const now = Date.now()
    const timeSpent = Math.floor((now - lastPageChange) / 1000)

    setPageTimes((prev) => ({
      ...prev,
      [currentPage]: (prev[currentPage] || 0) + timeSpent,
    }))

    setCurrentPage(page)
    setLastPageChange(now)
  }

  // Calculate total usage time
  const calculateTotalUsage = () => {
    const totalSeconds = Object.values(pageTimes).reduce((sum, time) => sum + time, 0)
    return formatTime(totalSeconds)
  }

  // Calculate storage usage
  const calculateStorageUsage = () => {
    const total = 1024 * 1024 * 1024 * 2 // 2GB
    const used = 1024 * 1024 * 512 // 512MB

    setStorageUsage({
      total,
      used,
      available: total - used,
      usageByType: {
        Documents: { used: 1024 * 1024 * 100, total: 1024 * 1024 * 200 },
        Images: { used: 1024 * 1024 * 200, total: 1024 * 1024 * 500 },
        Database: { used: 1024 * 1024 * 150, total: 1024 * 1024 * 300 },
        Other: { used: 1024 * 1024 * 62, total: 1024 * 1024 * 100 },
      },
    })
  }

  // Format storage size
  const formatStorageSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Calculate storage percentage
  const calculateStoragePercentage = (used, total) => {
    return total > 0 ? Math.round((used / total) * 100) : 0
  }

  // Update page time when component mounts/unmounts
  useEffect(() => {
    setLastPageChange(Date.now())
    calculateStorageUsage()

    const usageInterval = setInterval(() => {
      const now = Date.now()
      const sessionTime = Math.floor((now - appStartTime) / 1000)
      setTotalUsageTime(sessionTime)
    }, 1000)

    return () => {
      clearInterval(usageInterval)
      trackPageView("settings")
    }
  }, [])

  // Handle report generation
  const generateReport = () => {
    const reportData = {
      ...reportSettings,
      generatedAt: new Date().toISOString(),
      data: "Sample report data. In a real app, this would contain actual report data.",
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report-${new Date().toISOString().split("T")[0]}.${reportSettings.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    alert(`Report generated and downloaded as ${a.download}`)
  }

  // Handle backup
  const createBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      data: "Application data would be here in a real app",
    }

    const blob = new Blob([JSON.stringify(backupData)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setSystemInfo((prev) => ({
      ...prev,
      lastBackup: new Date().toLocaleString(),
    }))

    alert("Backup created successfully!")
  }

  // Save note (add or update)
  const saveNote = () => {
    if (!newNote.title || !newNote.content) {
      alert("Please fill in all required fields")
      return
    }

    if (selectedNote) {
      updateNote(selectedNote.id, newNote)
    } else {
      addNote()
    }

    setIsNoteModalOpen(false)
    setSelectedNote(null)
  }

  // Export notes as text file
  const exportNotes = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      noteCount: notes.length,
      notes: notes,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `church-notes-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import notes from file
  const importNotes = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.notes && Array.isArray(data.notes)) {
          if (window.confirm(`Import ${data.notes.length} notes? This will add to your existing notes.`)) {
            setNotes((prevNotes) => [...data.notes, ...prevNotes])
            alert("Notes imported successfully!")
          }
        } else {
          throw new Error("Invalid notes format")
        }
      } catch (error) {
        alert("Error importing notes. Please check the file format.")
        console.error("Import error:", error)
      }
    }
    reader.readAsText(file)

    event.target.value = ""
  }

  // Filter notes based on selected category and search term
  const [notesFilter, setNotesFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNote, setSelectedNote] = useState(null)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)

  const filteredNotes = notes.filter((note) => {
    const matchesCategory = notesFilter === "all" || note.category === notesFilter
    const matchesSearch =
      searchTerm === "" ||
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Format date for display
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Calculate time spent on each page
  const getPageTimeSpent = (pageId) => {
    const seconds = systemInfo.pageTimes[pageId] || 0
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  // Calculate total app usage time
  const getTotalUsageTime = () => {
    const totalSeconds = Object.values(systemInfo.pageTimes).reduce((sum, time) => sum + time, 0)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  // Initialize active tab based on section
  useEffect(() => {
    if (activeSection === SECTIONS.USER_MANAGEMENT && !activeTab) {
      setActiveTab("users")
    } else if (activeSection === SECTIONS.DATA_MANAGEMENT && !activeTab) {
      setActiveTab("overview")
    }
  }, [activeSection, activeTab])

  // Render template preview
  const renderTemplatePreview = (template) => {
    return (
      <div
        className="template-preview-content"
        style={
          template.backgroundImage
            ? {
                backgroundImage: `url(${template.backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "200px",
                display: "flex",
                flexDirection: "column",
              }
            : {}
        }
      >
        {template.backgroundImage && <div className="template-preview-overlay"></div>}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h4 className="text-lg font-medium mb-2">{template.title}</h4>
          <div className="template-markdown-content" dangerouslySetInnerHTML={{ __html: marked(template.template) }} />
        </div>
      </div>
    )
  }

  // Render Budget Form Modal
  const renderBudgetFormModal = () => (
    <div className={`modal ${isBudgetFormOpen ? 'open' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{budgetForm.id ? 'Edit Category' : 'Add New Category'}</h3>
          <button className="close-button" onClick={() => setIsBudgetFormOpen(false)}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Category Name</label>
            <input
              type="text"
              name="name"
              value={budgetForm.name}
              onChange={handleBudgetFormChange}
              placeholder="e.g., Building Maintenance"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Allocated Amount ($)</label>
            <input
              type="text"
              name="allocated"
              value={budgetForm.allocated}
              onChange={handleBudgetFormChange}
              placeholder="0.00"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              name="description"
              value={budgetForm.description}
              onChange={handleBudgetFormChange}
              placeholder="Add any notes about this category"
              className="form-input"
              rows="3"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className="button button-secondary" 
            onClick={() => setIsBudgetFormOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="button button-primary" 
            onClick={saveBudgetCategory}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </div>
    </div>
  )

  // Render Delete Confirmation Modal
  const renderDeleteConfirmation = () => (
    <div className={`modal ${isDeleteConfirmOpen ? 'open' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Delete Category</h3>
          <button className="close-button" onClick={() => setIsDeleteConfirmOpen(false)}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete this category? This action cannot be undone.</p>
          <p className="text-sm text-gray-500">Note: This will not delete any transactions or expenses.</p>
        </div>
        <div className="modal-footer">
          <button 
            className="button button-secondary" 
            onClick={() => setIsDeleteConfirmOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="button button-danger" 
            onClick={deleteBudgetCategory}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Category'}
          </button>
        </div>
      </div>
    </div>
  )

  // Render Expense Form Modal
  const renderExpenseForm = () => (
    <div className={`modal ${showAddExpense ? 'open' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{expenseForm.id ? 'Edit Expense' : 'Add New Expense'}</h3>
          <button className="close-button" onClick={() => setShowAddExpense(false)}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Category</label>
            <select
              name="categoryId"
              value={expenseForm.categoryId}
              onChange={handleExpenseFormChange}
              className="form-select"
              disabled={isLoading}
            >
              {budget.categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Amount ($)</label>
            <div className="input-with-prefix">
              <span className="prefix">$</span>
              <input
                type="text"
                name="amount"
                value={expenseForm.amount}
                onChange={handleExpenseFormChange}
                placeholder="0.00"
                className="form-input"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={expenseForm.date}
              onChange={handleExpenseFormChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={expenseForm.description}
              onChange={handleExpenseFormChange}
              placeholder="Enter expense details"
              className="form-input"
              rows="3"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Receipt (optional)</label>
            <div className="file-upload">
              <label className="file-upload-label">
                <input
                  type="file"
                  name="receipt"
                  onChange={handleExpenseFormChange}
                  className="file-input"
                  accept="image/*,.pdf"
                  disabled={isLoading}
                />
                <span className="file-upload-button">
                  {expenseForm.receipt?.name || 'Choose file...'}
                </span>
                {expenseForm.receipt?.name && (
                  <span className="file-name">{expenseForm.receipt.name}</span>
                )}
              </label>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="button button-secondary"
            onClick={() => setShowAddExpense(false)}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            onClick={saveExpense}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  )

  // Render Expense List
  const renderExpenseList = () => {
    if (budget.expenses.length === 0) {
      return (
        <div className="empty-state">
          <FileText size={32} className="text-gray-400" />
          <p>No expenses recorded yet.</p>
          <button
            className="button button-primary mt-4"
            onClick={openAddExpense}
          >
            <Plus size={16} /> Add Your First Expense
          </button>
        </div>
      )
    }

    return (
      <div className="expense-list-container">
        <div className="expense-list-header">
          <h4>Recent Expenses</h4>
          <div className="expense-totals">
            <span>Total: <strong>${budget.totalSpent.toLocaleString()}</strong></span>
            <span className="ml-4">
              This Month: <strong>$
                {budget.expenses
                  .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
                  .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                  .toLocaleString()}
              </strong>
            </span>
          </div>
        </div>
        
        <div className="expense-list">
          {budget.expenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(expense => {
              const category = budget.categories.find(c => c.id === expense.categoryId)
              return (
                <div key={expense.id} className="expense-item">
                  <div className="expense-category">
                    <div className="category-color" style={{ backgroundColor: '#4CAF50' }} />
                    <div>
                      <div className="expense-category-name">{category?.name || 'Uncategorized'}</div>
                      <div className="expense-date">
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="expense-details">
                    <div className="expense-description">
                      {expense.description || 'No description'}
                    </div>
                    <div className="expense-actions">
                      <span className="expense-amount">
                        ${parseFloat(expense.amount).toFixed(2)}
                      </span>
                      <button
                        className="icon-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditExpense(expense)
                        }}
                        title="Edit Expense"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm('Are you sure you want to delete this expense?')) {
                            deleteExpense(expense.id)
                          }
                        }}
                        title="Delete Expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    )
  }

  // Render the appropriate section based on activeSection
  const renderActiveSection = () => {
    switch (activeSection) {
      case SECTIONS.REPORTS:
        return (
          <div className="section-container">
            <h2 className="section-title">Reports & Analytics</h2>
            <p className="section-description">
              Generate and view reports on church activities, attendance, and finances.
            </p>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <FileText size={20} />
                  Generate Report
                </h3>
                <p className="card-subtitle">Create custom reports for your church data</p>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Report Type</label>
                    <select
                      className="form-select"
                      value={reportSettings.reportType}
                      onChange={(e) => setReportSettings({ ...reportSettings, reportType: e.target.value })}
                    >
                      <option value="monthly">Monthly Summary</option>
                      <option value="quarterly">Quarterly Report</option>
                      <option value="annual">Annual Report</option>
                      <option value="custom">Custom Date Range</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Format</label>
                    <select
                      className="form-select"
                      value={reportSettings.format}
                      onChange={(e) => setReportSettings({ ...reportSettings, format: e.target.value })}
                    >
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={reportSettings.startDate}
                      onChange={(e) => setReportSettings({ ...reportSettings, startDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={reportSettings.endDate}
                      onChange={(e) => setReportSettings({ ...reportSettings, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="checkbox-container">
                    <input
                      id="includeCharts"
                      name="includeCharts"
                      type="checkbox"
                      checked={reportSettings.includeCharts}
                      onChange={(e) => setReportSettings({ ...reportSettings, includeCharts: e.target.checked })}
                      className="checkbox-input"
                    />
                    <div>
                      <label htmlFor="includeCharts" className="checkbox-label">
                        Include Charts & Visualizations
                      </label>
                      <p className="checkbox-description">Adds visual elements to the report</p>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={generateReport} className="button button-primary">
                    <Download size={16} />
                    <span>Generate & Download Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case SECTIONS.DATA_MANAGEMENT:
        return (
          <div className="section-container">
            <h2 className="section-title">Data Management</h2>
            <p className="section-description">Manage church data, budgets, and meeting notes in one place.</p>

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
                <BookOpen size={16} /> Notes & Minutes
              </button>
            </div>

            {activeTab === "budget" && (
              <div className="budget-section">
                <div className="budget-header">
                  <h3>Church Budget Management</h3>
                  <div className="budget-summary-cards">
                    <div className="budget-summary-card">
                      <span className="budget-label">Total Allocated</span>
                      <span className="budget-amount">${budget.totalAllocated.toLocaleString()}</span>
                    </div>
                    <div className="budget-summary-card">
                      <span className="budget-label">Total Spent</span>
                      <span className="budget-amount spent">${budget.totalSpent.toLocaleString()}</span>
                    </div>
                    <div className="budget-summary-card">
                      <span className="budget-label">Remaining</span>
                      <span className="budget-amount remaining">${budget.remainingBalance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="budget-actions">
                  <div className="flex flex-wrap gap-3">
                    <button 
                      className="button button-primary" 
                      onClick={openAddCategory}
                    >
                      <Plus size={16} /> Add Category
                    </button>
                    <button 
                      className="button button-secondary"
                      onClick={openAddExpense}
                    >
                      <Plus size={16} /> Add Expense
                    </button>
                    <button 
                      className="button button-outline" 
                      onClick={exportBudget}
                      disabled={budget.categories.length === 0}
                    >
                      <Download size={16} /> Export Budget
                    </button>
                  </div>
                  {error && <div className="error-message mt-2">{error}</div>}
                </div>
                
                {/* Expense List */}
                <div className="mt-6">
                  {renderExpenseList()}
                </div>

                <div className="budget-categories">
                  <div className="flex justify-between items-center mb-4">
                    <h4>Budget Categories</h4>
                    <span className="text-sm text-gray-500">
                      Showing {budget.categories.length} categories
                    </span>
                  </div>
                  {budget.categories.length === 0 ? (
                    <div className="empty-state">
                      <FileTextIcon size={32} className="text-gray-400" />
                      <p>No budget categories found.</p>
                      <button 
                        className="button button-primary mt-4"
                        onClick={openAddCategory}
                      >
                        <Plus size={16} /> Add Your First Category
                      </button>
                    </div>
                  ) : (
                    <div className="budget-category-list">
                      {budget.categories.map((category) => (
                      <div key={category.id} className="budget-category-item">
                        <div className="budget-category-info">
                          <span className="budget-category-name">{category.name}</span>
                          <div className="budget-category-amounts">
                            <span>Allocated: ${category.allocated.toLocaleString()}</span>
                            <span>Spent: ${category.spent.toLocaleString()}</span>
                            <span>Remaining: ${(category.allocated - category.spent).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="budget-category-progress">
                          <div
                            className="budget-progress-bar"
                            style={{
                              width: `${Math.min(100, (category.spent / (category.allocated || 1)) * 100)}%`,
                              backgroundColor: category.spent > category.allocated ? "#ef4444" : "#3b82f6",
                            }}
                          />
                        </div>
                        <div className="budget-category-actions">
                          <button
                            className="icon-button"
                            onClick={() => openEditCategory(category)}
                            title="Edit Category"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-button danger"
                            onClick={() => confirmDeleteCategory(category.id)}
                            title="Delete Category"
                            disabled={category.spent > 0}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {category.spent > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Cannot delete category with expenses
                          </div>
                        )}
                      </div>
                    ))}
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
                      <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="form-select"
                      value={notesFilter}
                      onChange={(e) => setNotesFilter(e.target.value)}
                    >
                      <option value="all">All Notes</option>
                      <option value="meeting">Meetings</option>
                      <option value="sermon">Sermons</option>
                      <option value="event">Events</option>
                      <option value="other">Other</option>
                    </select>
                    <button className="button button-primary" onClick={() => setIsNoteModalOpen(true)}>
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
                                setNewNote({ ...note, date: note.date.split("T")[0] })
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
                          <span className="note-date">{new Date(note.date).toLocaleDateString()}</span>
                          <span className={`note-category ${note.category}`}>{note.category}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <FileTextIcon size={48} />
                      <p>No notes found. Create your first note!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )

      case SECTIONS.USER_MANAGEMENT:
        return (
          <div className="section-container">
            <h2 className="section-title">User Management</h2>
            <p className="section-description">
              Manage user accounts, roles, permissions, and sermon/teaching templates.
            </p>

            <div className="section-tabs">
              <button
                className={`tab-button ${activeTab === "users" ? "active" : ""}`}
                onClick={() => setActiveTab("users")}
              >
                <Users size={16} /> Users
              </button>
              <button
                className={`tab-button ${activeTab === "sermons" ? "active" : ""}`}
                onClick={() => setActiveTab("sermons")}
              >
                <BookOpen size={16} /> Sermon & Teaching Templates
              </button>
            </div>

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

                <div className="user-management-section">
                  <h3 className="user-management-title">Add New User</h3>
                  <div className="user-form-container">
                    <div className="user-form-grid">
                      <div>
                        <label className="user-form-label">Full Name</label>
                        <input type="text" className="user-form-input" placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="user-form-label">Email</label>
                        <input type="email" className="user-form-input" placeholder="john@example.com" />
                      </div>
                      <div>
                        <label className="user-form-label">Role</label>
                        <select className="user-form-select">
                          <option>Select a role</option>
                          <option>Administrator</option>
                          <option>Pastor</option>
                          <option>Secretary</option>
                          <option>Member</option>
                        </select>
                      </div>
                      <div className="user-form-button-container">
                        <button className="user-form-button primary">
                          <UserPlus size={16} />
                          Add User
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sermons" && (
              <div className="sermon-templates">
                <div className="templates-header">
                  <div>
                    <h3>Sermon & Teaching Templates</h3>
                    <p>Create and manage templates for sermons and Bible studies.</p>
                  </div>

                  <div className="templates-actions">
                    <select
                      className="form-select"
                      value={templateType}
                      onChange={(e) => setTemplateType(e.target.value)}
                    >
                      <option value="sermon">Sermon Template</option>
                      <option value="bible_study">Bible Study Template</option>
                      <option value="devotional">Devotional Template</option>
                    </select>

                    <button
                      className="button button-primary"
                      onClick={() => {
                        setNewTemplate({
                          id: null,
                          title: "",
                          type: templateType,
                          template: "",
                          backgroundImage: "",
                        })
                        setIsNoteModalOpen(false)
                        const modal = document.getElementById("template-modal")
                        if (modal) modal.style.display = "flex"
                      }}
                    >
                      <Plus size={16} /> New Template
                    </button>
                  </div>
                </div>

                <div className="templates-grid">
                  {sermonTemplates
                    .filter((template) => template.type === templateType)
                    .map((template) => (
                      <div key={template.id} className="template-card">
                        <div className="template-header">
                          <h4>{template.title}</h4>
                          <div className="template-actions">
                            <button
                              className="icon-button"
                              onClick={() => {
                                setNewTemplate(template)
                                const modal = document.getElementById("template-modal")
                                if (modal) modal.style.display = "flex"
                              }}
                              title="Edit Template"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="icon-button danger"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this template?")) {
                                  deleteTemplate(template.id)
                                }
                              }}
                              title="Delete Template"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              className="icon-button"
                              onClick={() => {
                                navigator.clipboard.writeText(template.template)
                                alert("Template copied to clipboard!")
                              }}
                              title="Copy Template"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="template-preview">{renderTemplatePreview(template)}</div>
                        <div className="template-meta">
                          <span>Type: {template.type.replace("_", " ")}</span>
                          <span>Last updated: {formatDate(template.updatedAt)}</span>
                        </div>
                      </div>
                    ))}
                </div>

                {sermonTemplates.filter((t) => t.type === templateType).length === 0 && (
                  <div className="empty-state">
                    <BookOpen size={48} />
                    <h4>No {templateType.replace("_", " ")} templates</h4>
                    <p>Create your first {templateType.replace("_", " ").toLowerCase()} template to get started.</p>
                    <button
                      className="button button-primary"
                      onClick={() => {
                        setNewTemplate({
                          id: null,
                          title: "",
                          type: templateType,
                          template: "",
                          backgroundImage: "",
                        })
                        const modal = document.getElementById("template-modal")
                        if (modal) modal.style.display = "flex"
                      }}
                    >
                      <Plus size={16} /> Create Template
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case SECTIONS.SYSTEM_SETTINGS:
        return (
          <div className="system-settings">
            <h2>System Information & Usage</h2>

            <div className="system-cards">
              <div className="system-card">
                <div className="system-card-header">
                  <Activity size={24} />
                  <h3>App Usage</h3>
                </div>
                <div className="system-card-body">
                  <div className="info-row">
                    <span>Uptime:</span>
                    <span>{systemInfo.uptime || "00:00:00"}</span>
                  </div>
                  <div className="info-row">
                    <span>Current Page:</span>
                    <span>{systemInfo.currentPage || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span>Last Updated:</span>
                    <span>{systemInfo.lastUpdated || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="system-card">
                <div className="system-card-header">
                  <PieChart size={24} />
                  <h3>Page Usage</h3>
                </div>
                <div className="system-card-body">
                  {Object.entries(systemInfo.pageTimes || {}).map(([page, time]) => (
                    <div key={page} className="info-row">
                      <span>{page}:</span>
                      <span>{formatTime(time)}</span>
                    </div>
                  ))}
                  {Object.keys(systemInfo.pageTimes || {}).length === 0 && <p>No page usage data available</p>}
                </div>
              </div>

              <div className="system-card">
                <div className="system-card-header">
                  <HardDrive size={24} />
                  <h3>Storage</h3>
                </div>
                <div className="system-card-body">
                  <div className="info-row">
                    <span>Used:</span>
                    <span>{systemInfo.storageUsed}</span>
                  </div>
                  <div className="info-row">
                    <span>Total:</span>
                    <span>{systemInfo.totalStorage}</span>
                  </div>
                  <div className="storage-bar">
                    <div
                      className="storage-progress"
                      style={{
                        width: `${(Number.parseFloat(systemInfo.storageUsed) / Number.parseFloat(systemInfo.totalStorage)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Application Settings</h3>
              </div>
              <div className="card-body">
                <div className="toggle-container">
                  <div className="toggle-content">
                    <h3 className="toggle-title">
                      <Wifi size={20} />
                      Offline Mode
                    </h3>
                    <p className="toggle-description">
                      {settings.offlineMode
                        ? "App is currently in offline mode. Some features may be limited."
                        : "App is currently online. All features are available."}
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={settings.offlineMode}
                      onChange={toggleOfflineMode}
                      role="switch"
                      aria-checked={settings.offlineMode}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-container">
                  <div className="toggle-content">
                    <h3 className="toggle-title">
                      <Save size={20} />
                      Auto-save Changes
                    </h3>
                    <p className="toggle-description">Automatically save changes to your work as you go.</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={settings.autoSave}
                      onChange={() => setSettings({ ...settings, autoSave: !settings.autoSave })}
                      role="switch"
                      aria-checked={settings.autoSave}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-container">
                  <div className="toggle-content">
                    <h3 className="toggle-title">
                      <Moon size={20} />
                      Dark Mode
                    </h3>
                    <p className="toggle-description">Switch between light and dark theme.</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={settings.darkMode}
                      onChange={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
                      role="switch"
                      aria-checked={settings.darkMode}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="system-actions">
              <button className="btn btn-primary" onClick={updateStorageUsage}>
                <RefreshCw size={16} /> Refresh
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear all usage data?")) {
                    setSystemInfo((prev) => ({
                      ...prev,
                      pageTimes: {},
                    }))
                  }
                }}
              >
                <Trash2 size={16} /> Clear Data
              </button>
            </div>
          </div>
        )

      default:
        return (
          <div className="section-container">
            <h2 className="section-title">Welcome to Settings</h2>
            <p className="section-description">Select a section from the sidebar to get started.</p>
          </div>
        )
    }
  }

  return (
    <div className="settings-container">
      <div className="settings-wrapper">
        <div className="settings-header">
          <h1 className="settings-title">
            <Settings size={28} />
            Admin Settings
          </h1>
          <div className={`status-badge ${settings.offlineMode ? "offline" : "online"}`}>
            {settings.offlineMode ? (
              <>
                <WifiOff size={16} /> Offline Mode
              </>
            ) : (
              <>
                <Wifi size={16} /> Online
              </>
            )}
          </div>
        </div>

        <div className="settings-grid">
          {/* Left sidebar navigation */}
          <div className="sidebar-container">
            <nav className="sidebar-nav">
              <button
                className={`nav-button ${activeSection === SECTIONS.REPORTS ? "active" : ""}`}
                onClick={() => setActiveSection(SECTIONS.REPORTS)}
              >
                <FileText size={18} />
                Reports
              </button>
              <button
                className={`nav-button ${activeSection === SECTIONS.DATA_MANAGEMENT ? "active" : ""}`}
                onClick={() => {
                  setActiveSection(SECTIONS.DATA_MANAGEMENT)
                  setActiveTab("budget")
                }}
              >
                <Database size={18} />
                Data Management
              </button>
              <button
                className={`nav-button ${activeSection === SECTIONS.USER_MANAGEMENT ? "active" : ""}`}
                onClick={() => {
                  setActiveSection(SECTIONS.USER_MANAGEMENT)
                  setActiveTab("users")
                }}
              >
                <User size={18} />
                User Management
              </button>
              <button
                className={`nav-button ${activeSection === SECTIONS.SYSTEM_SETTINGS ? "active" : ""}`}
                onClick={() => setActiveSection(SECTIONS.SYSTEM_SETTINGS)}
              >
                <Settings size={18} />
                System Settings
              </button>
            </nav>

            {/* System Info Card */}
            <div className="system-info-card">
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
                    <div className="storage-mini-bar">
                      <div
                        className="storage-mini-progress"
                        style={{
                          width: `${(Number.parseFloat(systemInfo.storageUsed) / Number.parseFloat(systemInfo.totalStorage)) * 100}%`,
                        }}
                      />
                    </div>
                  </span>
                </div>
                <div className="info-row">
                  <span>Uptime:</span>
                  <span className="info-value">{systemInfo.uptime || "00:00:00"}</span>
                </div>
                <div className="info-row">
                  <span>Last Backup:</span>
                  <span className="info-value">{systemInfo.lastBackup || "Never"}</span>
                </div>
                <div className="info-row">
                  <span>Last Sync:</span>
                  <span className="info-value">{systemInfo.lastSync || "Never"}</span>
                </div>
              </div>
              <button onClick={createBackup} className="button button-primary button-full">
                <Database size={16} />
                <span>Create Backup</span>
              </button>
            </div>
          </div>

          {/* Right content area */}
          <div className="settings-content">{renderActiveSection()}</div>
        </div>
      </div>

      {/* New Note Modal */}
      {isNoteModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedNote ? "Edit Note" : "New Note"}</h3>
              <button className="btn-icon close" onClick={() => setIsNoteModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Enter note title"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  className="form-select"
                  value={newNote.category}
                  onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                >
                  <option value="meeting">Meeting</option>
                  <option value="sermon">Sermon</option>
                  <option value="event">Event</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newNote.date}
                  onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  className="form-textarea"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={10}
                  placeholder="Enter your note content here..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsNoteModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (selectedNote) {
                    updateNote(selectedNote.id, newNote)
                  } else {
                    addNote()
                  }
                  setIsNoteModalOpen(false)
                  setSelectedNote(null)
                }}
              >
                {selectedNote ? "Update Note" : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      <div id="template-modal" className="modal" style={{ display: "none" }}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>{newTemplate.id ? "Edit Template" : "New Template"}</h3>
            <button
              className="btn-icon close"
              onClick={() => {
                const modal = document.getElementById("template-modal")
                if (modal) modal.style.display = "none"
              }}
            >
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Template Name</label>
              <input
                type="text"
                className="form-input"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                placeholder="Enter template name"
              />
            </div>
            <div className="form-group">
              <label>Background Image</label>
              <div className="template-image-upload-container">
                {newTemplate.backgroundImage ? (
                  <div className="template-image-preview">
                    <img
                      src={newTemplate.backgroundImage || "/placeholder.svg"}
                      alt="Template preview"
                      className="template-preview-img"
                    />
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
                  </div>
                )}
              </div>
              <label className="template-upload-label">
                {newTemplate.backgroundImage ? "Change Background Image" : "Upload Background Image"}
                <input
                  type="file"
                  className="template-file-input"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, !!newTemplate.id)}
                />
              </label>
              <p className="template-image-hint">Recommended size: 1920x1080px (16:9 aspect ratio)</p>
            </div>

            <div className="form-group">
              <label>Template Content</label>
              <div className="relative">
                <textarea
                  className="template-content-textarea"
                  value={newTemplate.template}
                  onChange={(e) => setNewTemplate({ ...newTemplate, template: e.target.value })}
                  rows={10}
                  placeholder="Enter your template content here..."
                  style={
                    newTemplate.backgroundImage
                      ? {
                          backgroundImage: `url(${newTemplate.backgroundImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                          backgroundBlendMode: "lighten",
                        }
                      : {}
                  }
                />
                <p className="hint-text">Use markdown for formatting. Common placeholders: [Verse], [Title], [Date]</p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => {
                const modal = document.getElementById("template-modal")
                if (modal) modal.style.display = "none"
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (newTemplate.id) {
                  updateTemplate(newTemplate.id, newTemplate)
                } else {
                  addTemplate()
                }
                const modal = document.getElementById("template-modal")
                if (modal) modal.style.display = "none"
              }}
            >
              {newTemplate.id ? "Update Template" : "Save Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
