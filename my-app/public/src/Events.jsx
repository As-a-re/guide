import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, X  } from "lucide-react";
import { readFromStorage, saveToStorage, STORAGE_KEYS } from "./utils/storage";
import { useSidebar } from "./context/SidebarContext";

// Empty default events - users will add their own events
const defaultEvents = [];

const CalendarPage = () => {
  const { sidebarCollapsed } = useSidebar();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventForm, setEventForm] = useState({
    name: "",
    date: "",
    description: ""
  });
  
  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = readFromStorage(STORAGE_KEYS.EVENTS, defaultEvents);
    setEvents(savedEvents);
  }, []);
  
  // Save events to localStorage whenever they change
  const updateEvents = (newEvents) => {
    setEvents(newEvents);
    saveToStorage(STORAGE_KEYS.EVENTS, newEvents);
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(new Date(newDate));
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(new Date(newDate));
  };
  
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(date);
  };

  const handleEventSubmit = (e) => {
    e.preventDefault();
    if (editingEvent) {
      // Update existing event
      const updatedEvents = events.map(event => 
        event.id === editingEvent.id ? { ...event, ...eventForm } : event
      );
      updateEvents(updatedEvents);
      setEditingEvent(null);
    } else {
      // Add new event
      const newEvent = {
        id: Date.now(),
        ...eventForm
      };
      updateEvents([...events, newEvent]);
    }
    setEventForm({ name: "", date: "", description: "" });
    setShowEventForm(false);
  };

  const handleEditEvent = (event) => {
    setEventForm({
      name: event.name,
      date: event.date,
      description: event.description
    });
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleDeleteEvent = (id) => {
    updateEvents(events.filter(event => event.id !== id));
  };

  const getEventsForDate = (day) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    ).toISOString().split('T')[0];
    return events.filter(event => event.date === date);
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDay();
    
    // Add days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      days.push(
        <td 
          key={`prev-${day}`} 
          className="calendar-cell other-month"
          onClick={() => {
            const prevMonth = new Date(year, month - 1, day);
            setCurrentMonth(new Date(prevMonth));
          }}
        >
          <div className="day-number">{day}</div>
        </td>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateEvents = getEventsForDate(day);
      const isToday = today.getDate() === day && 
                    today.getMonth() === currentMonth.getMonth() && 
                    today.getFullYear() === currentMonth.getFullYear();
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();
      
      days.push(
        <td 
          key={day} 
          className={`calendar-cell 
            ${isSelected ? 'selected' : ''} 
            ${dateEvents.length > 0 ? 'has-events' : ''}
            ${isToday ? 'today' : ''}
          `}
          onClick={() => handleDateClick(day)}
        >
          <div className="day-number">
            {day}
            {isToday && <span className="today-indicator">•</span>}
          </div>
          {dateEvents.length > 0 && (
            <div className="event-indicator">
              {dateEvents.length} event{dateEvents.length > 1 ? 's' : ''}
            </div>
          )}
        </td>
      );
    }

    // Add days from next month to complete the grid
    const remainingDays = 6 - lastDayOfMonth;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(
        <td 
          key={`next-${i}`} 
          className="calendar-cell other-month"
          onClick={() => {
            const nextMonth = new Date(year, month + 1, i);
            setCurrentMonth(new Date(nextMonth));
          }}
        >
          <div className="day-number">{i}</div>
        </td>
      );
    }

    // Create rows with 7 cells each
    const rows = [];
    let cells = [];
    
    days.forEach((day, i) => {
      if (i % 7 !== 0) {
        cells.push(day);
      } else {
        if (cells.length > 0) {
          rows.push(<tr key={i}>{cells}</tr>);
        }
        cells = [day];
      }
    });
    
    if (cells.length > 0) {
      rows.push(<tr key={days.length}>{cells}</tr>);
    }

    return rows;
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <p className="subtitle">Full Events Interactive Page</p>
        </div>
        <div className="controls">
          <button className="btn" onClick={handlePreviousMonth}>
            <ChevronLeft size={18} />
          </button>
          <button className="btn today-btn" onClick={handleToday}>
            Today
          </button>
          <button className="btn" onClick={handleNextMonth}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="content">
        <div className="events-panel">
          <div className="events-header">
            <h3 className="events-title">Events</h3>
            <button className="add-event-button" onClick={() => setShowEventForm(true)}>
              <Plus size={18} className="button-icon" />
              <span>Add Event</span>
            </button>
          </div>

          {showEventForm ? (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">
                    {editingEvent ? 'Edit Event' : 'Create New Event'}
                  </h3>
                  <button 
                    onClick={() => {
                      setEventForm({ name: "", date: "", description: "" });
                      setEditingEvent(null);
                      setShowEventForm(false);
                    }}
                    className="close-button"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleEventSubmit}>
                  <div className="form-group">
                    <label className="form-label">Event Name</label>
                    <input
                      type="text"
                      name="name"
                      value={eventForm.name}
                      onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      value={eventForm.description}
                      onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                      className="form-textarea"
                      rows="3"
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setEventForm({ name: "", date: "", description: "" });
                        setEditingEvent(null);
                        setShowEventForm(false);
                      }}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="submit-button"
                    >
                      {editingEvent ? 'Update Event' : 'Create Event'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="events-list">
              {selectedDate ? (
                <div className="date-events">
                  <h3 className="date-header">
                    Events for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  {getEventsForDate(selectedDate.getDate()).length > 0 ? (
                    getEventsForDate(selectedDate.getDate()).map((event) => (
                      <div key={event.id} className="event-card">
                        <div className="event-content">
                          <h4 className="event-title">{event.name}</h4>
                          {event.description && <p className="event-description">{event.description}</p>}
                        </div>
                        <div className="event-actions">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                            className="edit-action-button"
                          >
                            <Edit size={14} className="button-icon" />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            className="delete-action-button"
                          >
                            <Trash2 size={14} className="button-icon" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-events-message">No events scheduled for this day.</p>
                  )}
                </div>
              ) : (
                <div className="upcoming-events">
                  <h3 className="upcoming-events-header">Upcoming Events</h3>
                  {events.length > 0 ? (
                    [...events]
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((event) => (
                        <div key={event.id} className="upcoming-event-card">
                          <div 
                            className="upcoming-event-content"
                            onClick={() => {
                              setSelectedDate(new Date(event.date));
                            }}
                          >
                            <div className="event-details">
                              <div>
                                <h4 className="event-title">{event.name}</h4>
                                {event.description && <p className="event-description">{event.description}</p>}
                              </div>
                              <div className="event-date">
                                {new Date(event.date).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="event-actions-bar">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                              className="edit-action-button small"
                            >
                              <Edit size={12} className="button-icon" />
                              <span>Edit</span>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.id);
                              }}
                              className="delete-action-button small"
                            >
                              <Trash2 size={12} className="button-icon" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-upcoming-events">No upcoming events. Create one to get started!</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={`calendar-panel ${sidebarCollapsed ? "collapsed" : ""}`}>
            <div className="calendar-header">
              <div className="calendar-navigation">
                <button onClick={handlePreviousMonth} className="month-nav" aria-label="Previous month">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleToday} className="today-button">
                  Today
                </button>
                <button onClick={handleNextMonth} className="month-nav" aria-label="Next month">
                  <ChevronRight size={20} />
                </button>
              </div>
              <h2 className="calendar-title">
                {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
              </h2>
            </div>
            <table className="calendar-table">
              <thead>
                <tr>
                  {daysOfWeek.map(day => (
                    <th key={day}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renderCalendarDays()}
              </tbody>
            </table>
          </div>
        </div>

      <style jsx>{`
        /* Layout */
        .container {
          padding: 24px;
          color: #ffffff;
          height: 85vh;
          max-width: 100%;
        }

        .content {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
          height: 100%;
        }

        .events-panel {
          background: #1e1e2d;
          border-radius: 8px;
          padding: 20px;
          overflow-y: auto;
        }

        .events-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .events-title {
          font-size: 1rem;
          font-weight: 500;
          color: #fff;
          margin: 0;
        }

        .add-event-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .add-event-button:hover {
          background: #4338ca;
        }

        .button-icon {
          display: flex;
          align-items: center;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 50;
        }

        .modal-content {
          background: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          width: 100%;
          max-width: 28rem;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .modal-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          color: #111827;
        }

        .close-button {
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          color: #374151;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.25rem;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .form-textarea {
          min-height: 6rem;
          resize: vertical;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 1.5rem;
        }

        .cancel-button {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          background-color: #f3f4f6;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
        }

        .cancel-button:hover {
          background-color: #e5e7eb;
        }

        .submit-button {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
          background-color: #4f46e5;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
        }

        .submit-button:hover {
          background-color: #4338ca;
        }

        /* Events List */
        .events-list {
          padding: 1rem;
          overflow-y: auto;
        }

        .date-events {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .date-header {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #e5e7eb;
        }

        .event-card,
        .upcoming-event-card {
          background: #2d3748;
          border: 1px solid #4a5568;
          border-radius: 0.5rem;
          overflow: hidden;
          transition: all 0.2s;
        }

        .event-card:hover,
        .upcoming-event-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .event-content,
        .upcoming-event-content {
          padding: 1rem;
          cursor: pointer;
        }

        .event-title {
          font-weight: 500;
          color: #e2e8f0;
          margin: 0 0 0.25rem 0;
        }

        .event-description {
          font-size: 0.875rem;
          color: #a0aec0;
          margin: 0;
        }

        .event-actions,
        .event-actions-bar {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #2d3748;
          border-top: 1px solid #4a5568;
        }

        .edit-action-button,
        .delete-action-button {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-action-button {
          color: #60a5fa;
          background: rgba(96, 165, 250, 0.1);
        }

        .edit-action-button:hover {
          background: rgba(96, 165, 250, 0.2);
        }

        .delete-action-button {
          color: #f87171;
          background: rgba(248, 113, 113, 0.1);
        }

        .delete-action-button:hover {
          background: rgba(248, 113, 113, 0.2);
        }

        .edit-action-button.small,
        .delete-action-button.small {
          font-size: 0.6875rem;
          padding: 0.125rem 0.375rem;
        }

        .no-events-message,
        .no-upcoming-events {
          color: #a0aec0;
          font-style: italic;
          text-align: center;
          padding: 1rem;
        }

        /* Upcoming Events */
        .upcoming-events {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .upcoming-events-header {
          font-size: 1.125rem;
          font-weight: 600;
          color: #e5e7eb;
          margin: 0 0 0.5rem 0;
        }

        .upcoming-event-card {
          border: 1px solid #4a5568;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .event-details {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .event-date {
          font-size: 0.75rem;
          color: #a0aec0;
          white-space: nowrap;
          margin-left: 1rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .content {
            grid-template-columns: 1fr;
          }
          
          .events-panel {
            max-height: 300px;
          }
        }

        .header {
          background-color: #242b3d;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          height: 7vh;
          padding-top: 1rem;
        }

        .subtitle {
          color: #8b8b8b;
          margin: 4px 0 0 1vw;
        }

        .controls {
          display: flex;
          gap: 8px;
        }

        .btn {
          background-color: #2a324d;
          border: none;
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn:hover {
          background-color: #3a4366;
        }

        .content {
          background-color: #131a2d;
          display: grid;
          grid-template-columns: minmax(250px, 20%) 1fr;
          gap: 24px;
          height: 85vh;
          width: 83vw;
          margin-left: -1vw;
        }

        .events-panel {
          background-color: #242b3d;
          border-radius: 8px;
          padding: 16px;
          height: 100%;
          overflow-y: auto;
        }

        .events-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .add-event-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background-color: #4ade80;
          color: #1a1f2e;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .add-event-btn:hover {
          background-color: #22c55e;
        }

        .event-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .event-form input,
        .event-form textarea {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #4a5568;
          background-color: #2a324d;
          color: white;
        }

        .event-form textarea {
          height: 100px;
          resize: vertical;
        }

        .form-buttons {
          display: flex;
          gap: 8px;
        }

        .submit-btn,
        .cancel-btn {
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
        }

        .submit-btn {
          background-color: #4ade80;
          color: #1a1f2e;
        }

        .cancel-btn {
          background-color: #ef4444;
          color: white;
        }

        .event-card {
          background-color: #4ade80;
          color: #1a1f2e;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .event-card h4 {
          margin: 0 0 8px 0;
        }

        .event-date {
          font-size: 0.9em;
          opacity: 0.8;
          margin-top: 8px;
        }

        .calendar-panel {
          background-color: #242b3d;
          border-radius: 8px;
          padding: 24px;
          height: 85vh;
          width: 55vw;
        }

        .calendar-panel.collapsed {
          width: 70vw;             
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .view-options {
          display: flex;
          gap: 8px;
        }

        .view-btn {
          background-color: #2a324d;
          border: none;
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .view-btn.active {
          background-color: #4ade80;
          color: #1a1f2e;
        }

        .calendar-table {
          width: 95%;
          border-collapse: separate;
          border-spacing: 4px;
          margin-top: -1rem;
        }

        .calendar-table th {
          padding: 12px;
          text-align: center;
          font-weight: normal;
          color: #8b8b8b;
        }

        .calendar-cell {
          background-color: #2a324d;
          position: relative;
          padding: 16px;
          text-align: center;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          height: 13vh;
        }

        .calendar-cell:hover {
          background-color: #323e5c;
        }

        .calendar-cell.has-events {
          background-color: rgba(74, 222, 128, 0.1);
        }

        .calendar-cell.selected {
          background-color: #2a324d;
          border: 2px solid #4ade80;
        }

        .calendar-cell.empty {
          background-color: transparent;
          cursor: default;
        }

        .day-number {
          position: absolute;
          top: 8px;
          left: 8px;
        }

        .event-indicator {
          font-size: 0.8em;
          color: #4ade80;
          margin-top: 24px;
        }

        @media (max-width: 1024px) {
        .content {
            grid-template-columns: 1fr;
          }

        .events-panel {
            order: 2;
            max-height: 300px;
          }

          .calendar-panel {
            order: 1;
          }

          .calendar-cell {
            height: 10vh;
          }
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .controls {
            width: 100%;
            justify-content: center;
          }

          .view-options {
            display: none;
          }

          .calendar-cell {
            height: 8vh;
            padding: 8px;
          }

          .event-indicator {
            font-size: 0.7em;
            margin-top: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;