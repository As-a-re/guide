import { useState, useMemo, useEffect } from "react"
import { Search, Lock, Shield, ShieldCheck, Users, User, Users2, Baby, Edit, Trash2, Save, X } from "lucide-react"
import { readFromStorage, saveToStorage, STORAGE_KEYS } from "./utils/storage";

// Empty default data - users will add their own members
const defaultMembers = [];

const MembersTableManager = () => {
  const [teamData, setTeamData] = useState([]);
  
  // Load members from localStorage on component mount
  useEffect(() => {
    const savedMembers = readFromStorage(STORAGE_KEYS.MEMBERS, defaultMembers);
    setTeamData(savedMembers);
  }, []);
  
  // Save members to localStorage whenever teamData changes
  const updateTeamData = (newTeamData) => {
    setTeamData(newTeamData);
    saveToStorage(STORAGE_KEYS.MEMBERS, newTeamData);
  };
  
  const [members, setMembers] = useState(teamData)
  
  // Update local state when teamData changes
  useEffect(() => {
    setMembers(teamData);
  }, [teamData]);
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [form, setForm] = useState({ id: "", name: "", residence: "", maritalstatus: "", phone: "", access: "" })

  // Filter members based on search and active filter
  const filteredData = useMemo(() => {
    return members.filter((member) => {
      // Apply search filter
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) || member.phone.includes(searchQuery)

      // Apply category filter
      let matchesCategory = true
      if (activeFilter === "men") {
        matchesCategory = member.maritalstatus.includes("(Men)")
      } else if (activeFilter === "women") {
        matchesCategory = member.maritalstatus.includes("(Women)")
      } else if (activeFilter === "youth") {
        matchesCategory = member.maritalstatus.toLowerCase().includes("youth")
      } else if (activeFilter === "children") {
        matchesCategory = member.maritalstatus.toLowerCase().includes("child")
      }

      return matchesSearch && matchesCategory
    })
  }, [members, searchQuery, activeFilter])

  // Count members in each category
  const memberCounts = useMemo(() => {
    return {
      all: members.length,
      men: members.filter((m) => m.maritalstatus.includes("(Men)")).length,
      women: members.filter((m) => m.maritalstatus.includes("(Women)")).length,
      youth: members.filter((m) => m.maritalstatus.toLowerCase().includes("youth")).length,
      children: members.filter((m) => m.maritalstatus.toLowerCase().includes("child")).length,
    }
  }, [members])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleAddMember = () => {
    const newMember = {
      id: members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1,
      ...form,
    }
    const updatedMembers = [...members, newMember];
    updateTeamData(updatedMembers);
    setForm({ id: "", name: "", residence: "", maritalstatus: "", phone: "", access: "regular member" });
  }

  const handleDeleteMember = (id) => {
    const updatedMembers = members.filter((member) => member.id !== id);
    updateTeamData(updatedMembers);
  }

  const renderAccessBadge = (access) => {
    const icon =
      access === "admin" ? <Shield size={16} /> : access === "preacher" ? <ShieldCheck size={16} /> : <Lock size={16} />
    const className =
      access === "admin"
        ? "badge badge-admin"
        : access === "preacher"
          ? "badge badge-preacher"
          : access === "commitee leader"
            ? "badge badge-commiteeleader"
            : "badge badge-regularmember"
    return (
      <div className={className}>
        {icon}
        <span>{access}</span>
      </div>
    )
  }

  // Inline editing component
  const MemberRow = ({ member, onEdit, onRemove }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({ ...member })

    const handleEditClick = () => {
      setIsEditing(true)
    }

    const handleSave = () => {
      onEdit(editForm)
      setIsEditing(false)
    }

    const handleCancel = () => {
      setEditForm({ ...member })
      setIsEditing(false)
    }

    const handleInputChange = (e) => {
      const { name, value } = e.target
      setEditForm((prev) => ({ ...prev, [name]: value }))
    }

    if (isEditing) {
      return (
        <tr className="editing-row">
          <td>
            <input type="text" name="name" value={editForm.name} onChange={handleInputChange} className="edit-input" />
          </td>
          <td>
            <input
              type="text"
              name="residence"
              value={editForm.residence}
              onChange={handleInputChange}
              className="edit-input"
            />
          </td>
          <td>
            <select
              name="maritalstatus"
              value={editForm.maritalstatus}
              onChange={handleInputChange}
              className="edit-input"
            >
              <option value="single (Men)">Single (Men)</option>
              <option value="married (Men)">Married (Men)</option>
              <option value="divorced (Men)">Divorced (Men)</option>
              <option value="widowed (Men)">Widowed (Men)</option>
              <option value="single (Women)">Single (Women)</option>
              <option value="married (Women)">Married (Women)</option>
              <option value="divorced (Women)">Divorced (Women)</option>
              <option value="widowed (Women)">Widowed (Women)</option>
            </select>
          </td>
          <td>
            <input
              type="text"
              name="phone"
              value={editForm.phone}
              onChange={handleInputChange}
              className="edit-input"
            />
          </td>
          <td>
            <select name="access" value={editForm.access} onChange={handleInputChange} className="edit-input">
              <option value="regular member">Regular Member</option>
              <option value="commitee leader">Committee Leader</option>
              <option value="preacher">Preacher</option>
              <option value="admin">Admin</option>
            </select>
          </td>
          <td className="actions-cell">
            <button onClick={handleSave} className="action-btn save-btn">
              <Save size={14} />
              <span>Save</span>
            </button>
            <button onClick={handleCancel} className="action-btn cancel-btn">
              <X size={14} />
              <span>Cancel</span>
            </button>
          </td>
        </tr>
      )
    }

    return (
      <tr>
        <td>{member.name}</td>
        <td>{member.residence}</td>
        <td>{member.maritalstatus}</td>
        <td>{member.phone}</td>
        <td>{renderAccessBadge(member.access)}</td>
        <td className="actions-cell">
          <button onClick={handleEditClick} className="action-btn edit-btn">
            <Edit size={14} />
            <span>Edit</span>
          </button>
          <button onClick={() => onRemove(member.id)} className="action-btn delete-btn">
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </td>
      </tr>
    )
  }

  return (
    <div className="members-container">
      <div className="members-header">
        <div className="header">
          <div>
            <p className="subtitle">Managing the Church Members</p>
          </div>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="search-icon" size={20} />
          </div>
        </div>

        {/* Category Filters */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            <Users size={16} className="mr-2" />
            All Members
            <span className="count-badge">{memberCounts.all}</span>
          </button>
          <button
            className={`filter-tab ${activeFilter === "men" ? "active" : ""}`}
            onClick={() => setActiveFilter("men")}
          >
            <User size={16} className="mr-2" />
            Men
            <span className="count-badge">{memberCounts.men}</span>
          </button>
          <button
            className={`filter-tab ${activeFilter === "women" ? "active" : ""}`}
            onClick={() => setActiveFilter("women")}
          >
            <Users2 size={16} className="mr-2" />
            Women
            <span className="count-badge">{memberCounts.women}</span>
          </button>
          <button
            className={`filter-tab ${activeFilter === "youth" ? "active" : ""}`}
            onClick={() => setActiveFilter("youth")}
          >
            <Users size={16} className="mr-2" />
            Youth
            <span className="count-badge">{memberCounts.youth}</span>
          </button>
          <button
            className={`filter-tab ${activeFilter === "children" ? "active" : ""}`}
            onClick={() => setActiveFilter("children")}
          >
            <Baby size={16} className="mr-2" />
            Children
            <span className="count-badge">{memberCounts.children}</span>
          </button>
        </div>

        {/* Add New Member Form */}
        <div className="form-wrapper">
          <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleInputChange} />
          <input
            type="text"
            name="residence"
            placeholder="Residence"
            value={form.residence}
            onChange={handleInputChange}
          />
          <select
            name="maritalstatus"
            value={form.maritalstatus}
            onChange={handleInputChange}
            className="access-select"
          >
            <option value="">Select Marital Status</option>
            <option value="single (Men)">Single (Men)</option>
            <option value="married (Men)">Married (Men)</option>
            <option value="divorced (Men)">Divorced (Men)</option>
            <option value="widowed (Men)">Widowed (Men)</option>
            <option value="single (Women)">Single (Women)</option>
            <option value="married (Women)">Married (Women)</option>
            <option value="divorced (Women)">Divorced (Women)</option>
            <option value="widowed (Women)">Widowed (Women)</option>
          </select>
          <input type="text" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleInputChange} />
          <select name="access" value={form.access} onChange={handleInputChange} className="access-select">
            <option value="">Select Access Level</option>
            <option value="admin">Admin</option>
            <option value="preacher">Preacher</option>
            <option value="commitee leader">Committee Leader</option>
            <option value="regular member">Regular Member</option>
          </select>
          <button onClick={handleAddMember} className="add-button">
            Add Member
          </button>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="members-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Residence</th>
              <th>Marital Status</th>
              <th>Phone Number</th>
              <th>Access Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onEdit={(updatedMember) => {
                  setMembers(members.map((m) => (m.id === updatedMember.id ? updatedMember : m)))
                }}
                onRemove={handleDeleteMember}
              />
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        body {
          margin: 0;
          font-family: 'Arial', sans-serif;
        }

        .members-container {
          padding: 20px;
          background-color: #14213d;
          color: #ffffff;
          min-height: 100vh;
        }

        .members-header {
          position: sticky;
          top: 0;
          background-color: #14213d;
          z-index: 1;
          padding-bottom: 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          margin-top: 1rem;
        }

        .subtitle {
          font-size: 14px;
          color: #aaaaaa;
          margin: 5px 0 0 0;
        }

        .search-bar {
          position: relative;
          width: 300px;
        }

        .search-input {
          padding: 10px 35px 10px 10px;
          border: none;
          border-radius: 5px;
          outline: none;
          background-color: #243447;
          color: #ffffff;
          width: 100%;
        }

        .search-input::placeholder {
          color: #aaaaaa;
        }

        .search-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #888;
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          margin: 1.5rem 0;
          flex-wrap: wrap;
        }

        .filter-tab {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          background-color: #2d3748;
          color: #e2e8f0;
          border: 1px solid #4a5568;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .filter-tab:hover {
          background-color: #4a5568;
          border-color: #718096;
        }

        .filter-tab.active {
          background-color: #4299e1;
          color: white;
          border-color: #63b3ed;
        }

        .mr-2 {
          margin-right: 0.5rem;
        }

        .count-badge {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          margin-left: 0.5rem;
        }

        .form-wrapper {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .form-wrapper input,
        .access-select {
          padding: 10px;
          border: none;
          border-radius: 5px;
          outline: none;
          background-color: #243447;
          color: #ffffff;
          min-width: 150px;
        }

        .form-wrapper input::placeholder {
          color: #aaaaaa;
        }

        .access-select option {
          background-color: #243447;
          color: #ffffff;
        }

        .add-button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          background-color: #1f9d55;
          color: #ffffff;
          cursor: pointer;
          font-weight: 500;
        }

        .add-button:hover {
          background-color: #1d8c4a;
        }

        .table-scroll-container {
          overflow-y: auto;
          max-height: 70vh;
          border-radius: 8px;
          border: 1px solid #2a3c54;
        }

        .members-table {
          width: 100%;
          border-collapse: collapse;
          background-color: #1d273b;
        }

        .members-table th,
        .members-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #2a3c54;
        }

        .members-table th {
          background-color: #22314f;
          color: #ffffff;
          font-weight: bold;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .members-table tr:hover {
          background-color: #2a3c54;
        }

        .editing-row {
          background-color: #2a4365;
        }

        .edit-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #4a5568;
          border-radius: 4px;
          background-color: #2d3748;
          color: #ffffff;
          font-size: 14px;
        }

        .edit-input option {
          background-color: #2d3748;
          color: #ffffff;
        }

        .actions-cell {
          white-space: nowrap;
          padding: 8px 12px !important;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 12px;
          margin: 0 4px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
        }

        .action-btn svg {
          flex-shrink: 0;
        }

        .action-btn span {
          display: inline-block;
        }

        .edit-btn {
          background-color: #3b82f6;
        }

        .edit-btn:hover {
          background-color: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .delete-btn {
          background-color: #ef4444;
        }

        .delete-btn:hover {
          background-color: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .save-btn {
          background-color: #10b981;
        }

        .save-btn:hover {
          background-color: #059669;
        }

        .cancel-btn {
          background-color: #6b7280;
        }

        .cancel-btn:hover {
          background-color: #4b5563;
        }

        .action-btn:active {
          transform: translateY(0);
        }

        .badge {
          display: flex;
          align-items: center;
          padding: 5px 10px;
          border-radius: 5px;
          color: #ffffff;
          font-size: 12px;
          font-weight: bold;
          text-transform: capitalize;
        }

        .badge-admin {
          background-color: #1f9d55;
        }

        .badge-preacher {
          background-color: #5c6ac4;
        }

        .badge-regularmember {
          background-color: #6c757d;
        }

        .badge-commiteeleader {
          background-color: rgb(200, 202, 55);
        }

        .badge span {
          margin-left: 5px;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .search-bar {
            width: 100%;
          }

          .form-wrapper {
            flex-direction: column;
          }

          .form-wrapper input,
          .access-select {
            width: 100%;
          }

          .action-btn span {
            display: none;
          }

          .action-btn {
            padding: 6px 8px;
            border-radius: 50%;
            width: 32px;
            height: 32px;
          }

          .action-btn svg {
            margin: 0;
          }

          .filter-tabs {
            flex-direction: column;
          }

          .filter-tab {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default MembersTableManager
