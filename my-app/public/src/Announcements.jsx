import React, { useState, useEffect } from "react";
import { Plus, Pencil, AlertCircle, Calendar, Clock, Filter, Trash2, ChevronDown } from "lucide-react";
import "./Announcements.css";

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium",
    date: new Date().toISOString().split("T")[0],
  });
  const [filterPriority, setFilterPriority] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load announcements from localStorage on component mount
  useEffect(() => {
    const savedAnnouncements = localStorage.getItem("churchAnnouncements");
    if (savedAnnouncements) {
      setAnnouncements(JSON.parse(savedAnnouncements));
    } else {
      // Empty default announcements - users will add their own
      const defaultAnnouncements = [];
      setAnnouncements(defaultAnnouncements);
      localStorage.setItem("churchAnnouncements", JSON.stringify(defaultAnnouncements));
    }
    setIsLoading(false);
  }, []);

  // Save announcements to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("churchAnnouncements", JSON.stringify(announcements));
    }
  }, [announcements, isLoading]);

  const handleCreate = () => {
    const newAnnouncement = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
    };
    setAnnouncements([newAnnouncement, ...announcements]);
    setFormData({ title: "", content: "", priority: "medium", date: new Date().toISOString().split("T")[0] });
    setIsCreating(false);
  };

  const handleEdit = (id) => {
    const announcement = announcements.find((a) => a.id === id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      date: announcement.date,
    });
    setEditingId(id);
  };

  const handleUpdate = () => {
    setAnnouncements(
      announcements.map((announcement) =>
        announcement.id === editingId
          ? { ...announcement, ...formData, updatedAt: new Date().toISOString() }
          : announcement
      )
    );
    setEditingId(null);
    setFormData({ title: "", content: "", priority: "medium", date: new Date().toISOString().split("T")[0] });
  };

  const handleDelete = (id) => {
    setAnnouncements(announcements.filter((a) => a.id !== id));
  };
  
  // Filter announcements based on priority
  const filteredAnnouncements = filterPriority === "all" 
    ? announcements 
    : announcements.filter(a => a.priority === filterPriority);

  const AnnouncementForm = ({ onSubmit, isEditing }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    onSubmit();
  };

  return (
    <form className="announcement-form" onSubmit={handleSubmit}>
      <h3 className="form-title">
        {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
      </h3>
      
      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          placeholder="Enter announcement title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="form-input"
          required
          autoFocus
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="content">Content *</label>
        <textarea
          id="content"
          placeholder="Enter announcement details..."
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="form-textarea"
          rows={6}
          required
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="form-select"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <div className="date-input-container">
            <Calendar size={18} className="date-icon" />
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="form-input"
              required
            />
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-cancel"
          onClick={() => {
            setIsCreating(false);
            setEditingId(null);
            setFormData({ 
              title: "", 
              content: "", 
              priority: "medium",
              date: new Date().toISOString().split("T")[0] 
            });
          }}
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="btn btn-submit"
          disabled={!formData.title.trim() || !formData.content.trim()}
        >
          {isEditing ? 'Update' : 'Publish'} Announcement
        </button>
      </div>
    </form>
  );
};

  // Format date to be more readable
  const formatDateString = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get priority display name and color
  const getPriorityInfo = (priority) => {
    switch(priority) {
      case 'high':
        return { name: 'High Priority', color: 'high' };
      case 'medium':
        return { name: 'Medium Priority', color: 'medium' };
      case 'low':
        return { name: 'Low Priority', color: 'low' };
      default:
        return { name: 'Normal', color: 'medium' };
    }
  };

  return (
    <div className="announcements-container">
      <header className="header">
        <div>
          <p className="subtitle">Stay updated with the latest church news and events</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            <span>Filters</span>
            <ChevronDown size={16} className={showFilters ? 'rotate-180' : ''} />
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setIsCreating(true);
              setEditingId(null);
              setFormData({ 
                title: "", 
                content: "", 
                priority: "medium",
                date: new Date().toISOString().split("T")[0] 
              });
            }}
          >
            <Plus size={16} />
            <span>New Announcement</span>
          </button>
        </div>
      </header>

      <div className={`filter-section ${showFilters ? '' : 'collapsed'}`}>
        <h3>Filter by Priority</h3>
        <div className="filter-options">
          <button 
            className={`filter-option ${filterPriority === 'all' ? 'active' : ''}`}
            onClick={() => setFilterPriority('all')}
          >
            All Announcements
          </button>
          <button 
            className={`filter-option ${filterPriority === 'high' ? 'active' : ''}`}
            onClick={() => setFilterPriority('high')}
          >
            <span className="priority-dot high"></span>
            High Priority
          </button>
          <button 
            className={`filter-option ${filterPriority === 'medium' ? 'active' : ''}`}
            onClick={() => setFilterPriority('medium')}
          >
            <span className="priority-dot medium"></span>
            Medium Priority
          </button>
          <button 
            className={`filter-option ${filterPriority === 'low' ? 'active' : ''}`}
            onClick={() => setFilterPriority('low')}
          >
            <span className="priority-dot low"></span>
            Low Priority
          </button>
        </div>
      </div>

      {(isCreating || editingId !== null) && (
        <AnnouncementForm 
          onSubmit={editingId !== null ? handleUpdate : handleCreate} 
          isEditing={editingId !== null} 
        />
      )}

      <div className="announcements-grid">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement, index) => {
            const priorityInfo = getPriorityInfo(announcement.priority);
            return (
              <article key={announcement.id} className="announcement-card" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className={`priority-indicator priority-${announcement.priority}`}></div>
                <div className="announcement-content">
                  <div className="announcement-header">
                    <h3 className="announcement-title">{announcement.title}</h3>
                    <span className={`priority-badge priority-${announcement.priority}`}>
                      {priorityInfo.name}
                    </span>
                  </div>
                  
                  <div className="announcement-date">
                    <Calendar size={16} />
                    <span>{formatDateString(announcement.date)}</span>
                  </div>
                  
                  <p className="announcement-text">
                    {announcement.content}
                  </p>
                </div>
                
                <footer className="announcement-footer">
                  <div className="announcement-actions">
                    <button 
                      className="btn-icon" 
                      onClick={() => handleEdit(announcement.id)}
                      aria-label="Edit announcement"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      className="btn-icon delete" 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this announcement?')) {
                          handleDelete(announcement.id);
                        }
                      }}
                      aria-label="Delete announcement"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="announcement-meta">
                    <span className="announcement-time">
                      <Clock size={14} />
                      {new Date(announcement.createdAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </footer>
              </article>
            );
          })
        ) : (
          <div className="empty-state">
            <AlertCircle size={48} className="empty-state-icon" />
            <h3>No announcements found</h3>
            <p>{filterPriority === 'all' 
              ? 'There are no announcements to display.' 
              : `No ${filterPriority} priority announcements found.`}
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setFilterPriority('all');
                setIsCreating(true);
              }}
            >
              <Plus size={16} />
              <span>Create New Announcement</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
