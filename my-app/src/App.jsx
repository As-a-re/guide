import { useState, useEffect } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { Home, Bell, Users, Music, Book, Settings, ChevronRight, Menu, X } from "lucide-react"
import { CalendarIcon, Search } from "lucide-react"
import TitleBar from "./TitleBar"

const NavItem = ({ to, icon: Icon, label, isActive }) => {
  return (
    <Link to={to} className={`nav-item ${isActive ? "active" : ""}`}>
      <div className="nav-item-content">
        <div className="nav-item-left">
          <Icon className="nav-icon" size={20} />
          <span className="nav-label">{label}</span>
        </div>
        <ChevronRight className="nav-arrow" size={16} />
      </div>
    </Link>
  )
}

const CustomCalendar = ({ isVisible, onClose }) => {
  if (!isVisible) return null

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = getDaysInMonth(currentMonth, currentYear)

  const calendar = []
  let day = 1

  for (let i = 0; i < 6; i++) {
    const week = []
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < firstDayOfMonth) {
        week.push("")
      } else if (day > daysInMonth) {
        week.push("")
      } else {
        week.push(day)
        day++
      }
    }
    calendar.push(week)
  }

  return (
    <div className="calendar-overlay">
      <div className="calendar-container">
        <div className="calendar-header">
          <h4>
            {new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })} {currentYear}
          </h4>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="calendar-grid">
          {days.map((day, idx) => (
            <div key={idx} className="calendar-day">
              {day}
            </div>
          ))}
          {calendar.flat().map((day, idx) => (
            <div key={idx} className={`calendar-cell ${day === currentDate.getDate() ? "today" : ""}`}>
              {day}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true)
      } else {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize() // Initial check

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const showTopNavBar = location.pathname === "/"

  const navigationItems = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/announcements", icon: Bell, label: "Announcements" },
    { to: "/members", icon: Users, label: "Members" },
    { to: "/songs", icon: Music, label: "Songs" },
    { to: "/events", icon: CalendarIcon, label: "Events" },
    { to: "/scripture", icon: Book, label: "Scriptures" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ]

  return (
    <div className="app-container">
      <TitleBar />

      {/* Mobile Menu Button */}
      <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <Link to="/" className="logo-link">
              <div className="logo-container">
                <img src="/logo.png" alt="Church Logo" className="logo" />
                <div className="logo-glow"></div>
              </div>
            </Link>
            {!sidebarCollapsed && (
              <div className="brand-text">
                <h1 className="brand-title">Church of Christ</h1>
                <p className="brand-subtitle">Management System</p>
              </div>
            )}
          </div>

          {/* Collapse Toggle for Desktop */}
          <button
            className="collapse-btn desktop-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronRight className={`collapse-icon ${sidebarCollapsed ? "collapsed" : ""}`} size={20} />
          </button>
        </div>

        <nav className="nav">
          <div className="nav-section">
            <div className="nav-section-title">{!sidebarCollapsed && <span>Main Navigation</span>}</div>
            {navigationItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.to}
              />
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="user-info">
              <div className="user-avatar">
                <Users size={20} />
              </div>
              <div className="user-details">
                <span className="user-name">Admin User</span>
                <span className="user-role">Administrator</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {showTopNavBar && (
          <div className="bg">
            <div className="top-nav">
              <div className="search-bar">
                <input type="text" placeholder="Search..." className="search-input" />
                <Search className="search-icon" size={20} />
              </div>

              <div className="time-info">
                <div>{formatDate(currentTime)}</div>
                <div>{formatTime(currentTime)}</div>
                <button onClick={() => setShowCalendar(!showCalendar)}>
                  <CalendarIcon size={20} />
                </button>
              </div>
            </div>

            <section className="hero-section">
              <div className="hero-content">
                <h1>Welcome to Church of Christ Management System</h1>
                <p>Empowering Ministry Through Technology</p>
                <div className="hero-cta">
                  <button className="primary-btn">Get Started</button>
                  <button className="secondary-btn">Learn More</button>
                </div>
              </div>
            </section>

            <section className="features-section">
              <div className="feature">
                <Users className="feature-icon" />
                <h3>Member Management</h3>
                <p>Seamlessly track and engage with your church community</p>
              </div>
              <div className="feature">
                <Bell className="feature-icon" />
                <h3>Announcements</h3>
                <p>Communicate effectively with instant notifications</p>
              </div>
              <div className="feature">
                <Music className="feature-icon" />
                <h3>Song Library</h3>
                <p>Organize and manage your worship music collection</p>
              </div>
              <div className="feature">
                <Book className="feature-icon" />
                <h3>Scripture Resources</h3>
                <p>Quick access to biblical references and study materials</p>
              </div>
            </section>

            <section className="quick-stats">
              <div className="stat">
                <h2>{Math.floor(Math.random() * 50) + 10}</h2>
                <p>Active Members</p>
              </div>
              <div className="stat">
                <h2>{Math.floor(Math.random() * 4) + 2}</h2>
                <p>Ministry Teams</p>
              </div>
              <div className="stat">
                <h2>{Math.floor(Math.random() * 10) + 5}</h2>
                <p>Upcoming Events</p>
              </div>
            </section>
          </div>
        )}
        <Outlet />
      </main>

      {showCalendar && <CustomCalendar isVisible={showCalendar} onClose={() => setShowCalendar(false)} />}

      {/* Enhanced Styles */}
      <style jsx global>{`
        /* Global Styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body, #root {
          height: 100%;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background-color: #131a2d;
          color: white;
          line-height: 1.6;
        }

        /* App Container */
        .app-container {
          display: flex;
          height: 100vh;
          overflow: hidden;
          position: relative;
        }

        /* Mobile Menu Button */
        .mobile-menu-btn {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 1001;
          background: rgba(30, 41, 63, 0.95);
          border: 1px solid rgba(76, 175, 80, 0.3);
          border-radius: 12px;
          padding: 0.75rem;
          color: white;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .mobile-menu-btn:hover {
          background: rgba(76, 175, 80, 0.1);
          border-color: #4caf50;
        }

        /* Enhanced Sidebar */
        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, #1e293f 0%, #1a2332 100%);
          border-right: 1px solid rgba(76, 175, 80, 0.1);
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }

        .sidebar.collapsed {
          width: 80px;
        }

        .sidebar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(76, 175, 80, 0.3), transparent);
        }

        /* Sidebar Header */
        .sidebar-header {
          padding: 2rem 1.5rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 1rem;
        }

        .logo-link {
          text-decoration: none;
          display: block;
          margin-bottom: 1rem;
        }

        .logo-container {
          position: relative;
          display: inline-block;
        }

        .logo {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          object-fit: cover;
          border: 2px solid rgba(76, 175, 80, 0.3);
          transition: all 0.3s ease;
          position: relative;
          z-index: 2;
        }

        .logo-glow {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          background: linear-gradient(45deg, #4caf50, #2e7d32);
          border-radius: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 1;
          filter: blur(8px);
        }

        .logo-container:hover .logo-glow {
          opacity: 0.3;
        }

        .logo-container:hover .logo {
          border-color: #4caf50;
          transform: scale(1.05);
        }

        .brand-text {
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        .sidebar.collapsed .brand-text {
          opacity: 0;
          pointer-events: none;
        }

        .brand-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #4caf50;
          margin-bottom: 0.25rem;
          letter-spacing: -0.025em;
        }

        .brand-subtitle {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 400;
        }

        /* Collapse Button */
        .collapse-btn {
          position: absolute;
          top: 1rem;
          right: -12px;
          width: 24px;
          height: 24px;
          background: #1e293f;
          border: 1px solid rgba(76, 175, 80, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .collapse-btn:hover {
          background: rgba(76, 175, 80, 0.1);
          border-color: #4caf50;
        }

        .collapse-icon {
          color: rgba(255, 255, 255, 0.6);
          transition: transform 0.3s ease;
        }

        .collapse-icon.collapsed {
          transform: rotate(180deg);
        }

        .desktop-only {
          display: block;
        }

        /* Navigation */
        .nav {
          flex: 1;
          padding: 1rem 0;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .nav::-webkit-scrollbar {
          display: none;
        }

        .nav-section {
          padding: 0 1rem;
        }

        .nav-section-title {
          padding: 0.75rem 0.5rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: opacity 0.3s ease;
        }

        .sidebar.collapsed .nav-section-title {
          opacity: 0;
          height: 0;
          padding: 0;
          overflow: hidden;
        }

        .nav-item {
          display: block;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.25rem;
          border-radius: 12px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .nav-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .nav-item:hover::before,
        .nav-item.active::before {
          opacity: 1;
        }

        .nav-item.active {
          color: #4caf50;
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.2);
        }

        .nav-item:hover {
          color: white;
          transform: translateX(4px);
        }

        .nav-item-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem;
          position: relative;
          z-index: 2;
        }

        .nav-item-left {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .nav-icon {
          color: #4caf50;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .nav-item:hover .nav-icon,
        .nav-item.active .nav-icon {
          transform: scale(1.1);
        }

        .nav-label {
          font-weight: 500;
          font-size: 0.9375rem;
          transition: opacity 0.3s ease;
        }

        .sidebar.collapsed .nav-label {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }

        .nav-arrow {
          color: rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          opacity: 0;
        }

        .nav-item:hover .nav-arrow {
          opacity: 1;
          transform: translateX(4px);
        }

        .sidebar.collapsed .nav-arrow {
          display: none;
        }

        .sidebar.collapsed .nav-item-content {
          justify-content: center;
          padding: 0.875rem 0.5rem;
        }

        /* Sidebar Footer */
        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          margin-top: auto;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .user-info:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(76, 175, 80, 0.2);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #4caf50, #2e7d32);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          overflow-y: auto;
          height: 100vh;
          scrollbar-width: none;
          -ms-overflow-style: none;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .main-content::-webkit-scrollbar {
          display: none;
        }

        .main-content.sidebar-collapsed {
          margin-left: 0;
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex;
          }

          .desktop-only {
            display: none;
          }

          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            transform: translateX(-100%);
            z-index: 1002;
            width: 280px;
          }

          .sidebar.mobile-open {
            transform: translateX(0);
          }

          .sidebar.collapsed {
            width: 280px;
          }

          .mobile-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1001;
            backdrop-filter: blur(4px);
          }

          .main-content {
            margin-left: 0;
            padding-top: 4rem;
          }

          .brand-text {
            opacity: 1 !important;
          }

          .nav-label {
            opacity: 1 !important;
            width: auto !important;
          }

          .nav-section-title {
            opacity: 1 !important;
            height: auto !important;
            padding: 0.75rem 0.5rem 0.5rem !important;
          }
        }

        /* Existing styles for other components remain the same */
        .bg {
          background-image: url('/b.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          height: 100%;
          width: 100%;
        }

        .top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: rgba(19, 26, 45, 0.9);
          position: sticky;
          top: 34px; /* Account for title bar height */
          border-radius: 10px; /* Rounded corners */
          border: 1px solid rgba(76, 175, 80, 0.2);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          z-index: 10;
        }

        .search-bar {
          display: flex;
          align-items: center;
          position: relative;
          width: 300px;
        }

        .search-input {
          background-color: #1e293f;
          color: white;
          padding: 10px 35px 10px 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          width: 100%;
          height: 40px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          border-color: #4caf50;
          box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
        }

        .search-input::placeholder {
          color: #94a3b8;
          opacity: 1;
        }

        .search-icon {
          position: absolute;
          top: 50%;
          right: 12px;
          margin-left: 85%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .search-input:focus + .search-icon {
          color: #4caf50;
        }

        .time-info {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .calendar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .calendar-container {
          background-color: #333;
          padding: 20px;
          border-radius: 10px;
          width: 400px;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
          margin-top: 20px;
        }

        .calendar-day {
          text-align: center;
          font-weight: bold;
        }

        .calendar-cell {
          text-align: center;
          padding: 10px;
          cursor: pointer;
        }

        .calendar-cell.today {
          background-color: #1e90ff;
          color: white;
        }

        .hero-section {
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          min-height: 50vh;
          background: linear-gradient(135deg, rgba(30, 41, 63, 0.8) 0%, rgba(19, 26, 45, 0.8) 100%);
          border-radius: 15px;
          padding: 4rem;
          margin-top: -3vh;
        }

        .hero-content {
          max-width: 800px;
        }

        .hero-section h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #4caf50;
        }

        .hero-section p {
          font-size: 1.5rem;
          margin-bottom: 2rem;
          color: #cbd5e1;
        }

        .hero-cta {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .primary-btn, .secondary-btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .primary-btn {
          background-color: #4caf50;
          color: white;
          border: none;
        }

        .secondary-btn {
          background-color: transparent;
          color: white;
          border: 2px solid white;
        }

        .features-section {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          margin-top: -4vh;
        }

        .feature {
          background-color: #1e293f;
          padding: 2rem;
          border-radius: 15px;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .feature:hover {
          transform: translateY(-10px);
        }

        .feature-icon {
          color: #4caf50;
          margin-bottom: 1rem;
          width: 48px;
          height: 48px;
        }

        .feature h3 {
          margin-bottom: 0.5rem;
          color: #4caf50;
        }

        .quick-stats {
          display: flex;
          justify-content: space-around;
          background-color: #1e293f;
          padding: 2rem;
          border-radius: 15px;
          margin-top: 4vh;
        }

        .stat {
          text-align: center;
        }

        .stat h2 {
          font-size: 3rem;
          color: #4caf50;
        }

        /* Responsive adjustments for features */
        @media (max-width: 1024px) {
          .features-section {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .features-section {
            grid-template-columns: 1fr;
          }
          
          .hero-section h1 {
            font-size: 2rem;
          }
          
          .hero-section p {
            font-size: 1.25rem;
          }
          
          .hero-cta {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
}

export default App
