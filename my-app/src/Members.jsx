import React, { useState, useEffect, useMemo } from "react";
import { Search, Lock, Shield, ShieldCheck, Users, User, Users2, Baby } from "lucide-react";

// Mock Data
const teamData = [
  { id: 1, name: "Jon Snow", residence: "kwabenya", maritalstatus: "married (Men)", phone: "0551215454", access: "preacher" },
  { id: 2, name: "Cersei Lannister", residence: "kwabenya", maritalstatus: "married (Men)", phone: "0213142288", access: "preacher" },
  { id: 3, name: "Jaime Lannister", residence: "kwabenya", maritalstatus: "single (Men)", phone: "0229826739", access: "preacher" },
  { id: 4, name: "Arya Stark", residence: "kwabenya", maritalstatus: "married (Men)", phone: "0214256742", access: "admin" },
  { id: 5, name: "Daenerys Targaryen", residence: "kwabenya", maritalstatus: "married (Men)", phone: "0214451189", access: "commitee leader" },
  { id: 6, name: "Ever Melisandre", residence: "kwabenya", maritalstatus: "married (Men)", phone: "0225456483", access: "commitee leader" },
  { id: 7, name: "Ferrara Clifford", residence: "kwabenya", maritalstatus: "divorced (Women)", phone: "0531240123", access: "commitee leader" },
  { id: 8, name: "Rossini Frances", residence: "kwabenya", maritalstatus: "widowed (Men)", phone: "0224445555", access: "commitee leader" },
  { id: 9, name: "Rossini Frances", residence: "kwabenya", maritalstatus: "married (Women)", phone: "0224445555", access: "regular member" },
  { id: 10, name: "Rossini Frances", residence: "kwabenya", maritalstatus: "married (Women)", phone: "0224445555", access: "regular member" },
  { id: 11, name: "Rossini Frances", residence: "kwabenya", maritalstatus: "married (Men)", phone: "0224445555", access: "regular member" },
  { id: 12, name: "Rossini Frances", residence: "kwabenya", maritalstatus: "widowed (Men)", phone: "0224445555", access: "regular member" },
  { id: 13, name: "Rossini Frances", residence: "kwabenya", maritalstatus: "single (Women)", phone: "0224445555", access: "regular member" },
  { id: 14, name: "Rossini Frances", residence: "kwabenya", maritalstatus: "single (Women)", phone: "0224445555", access: "regular member" },
  { id: 15, name: "Rossini Frances", residence: "kwabenya", maritalstatus: "single (Women)", phone: "0224445555", access: "regular member" },
];

const MembersTableManager = () => {
  const [members, setMembers] = useState(teamData);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [editMode, setEditMode] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", residence: "", maritalstatus: "", phone: "", access: "" });
  
  // Filter members based on search and active filter
  const filteredData = useMemo(() => {
    return members.filter(member => {
      // Apply search filter
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.phone.includes(searchQuery);
      
      // Apply category filter
      let matchesCategory = true;
      if (activeFilter === 'men') {
        matchesCategory = member.maritalstatus.includes('(Men)');
      } else if (activeFilter === 'women') {
        matchesCategory = member.maritalstatus.includes('(Women)');
      } else if (activeFilter === 'youth') {
        matchesCategory = member.maritalstatus.toLowerCase().includes('youth');
      } else if (activeFilter === 'children') {
        matchesCategory = member.maritalstatus.toLowerCase().includes('child');
      }
      
      return matchesSearch && matchesCategory;
    });
  }, [members, searchQuery, activeFilter]);
  
  // Count members in each category
  const memberCounts = useMemo(() => {
    return {
      all: members.length,
      men: members.filter(m => m.maritalstatus.includes('(Men)')).length,
      women: members.filter(m => m.maritalstatus.includes('(Women)')).length,
      youth: members.filter(m => m.maritalstatus.toLowerCase().includes('youth')).length,
      children: members.filter(m => m.maritalstatus.toLowerCase().includes('child')).length
    };
  }, [members]);

const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleAddMember = () => {
    if (editMode) {
      setMembers(members.map((member) => (member.id === currentMember.id ? form : member)));
      setEditMode(false);
    } else {
      const newMember = { ...form, id: members.length + 1 };
      setMembers([...members, newMember]);
    }
    setForm({ id: "", name: "", residence: "", maritalstatus: "", phone: "", access: "" });
  };

  const handleEditMember = (member) => {
    setEditMode(true);
    setCurrentMember(member);
    setForm(member);
  };

  const handleRemoveMember = (id) => {
    setMembers(members.filter((member) => member.id !== id));
  };

  const renderAccessBadge = (access) => {
    const icon = access === "admin" ? <Shield size={16} /> : access === "preacher" ? <ShieldCheck size={16} /> : <Lock size={16} />;
    const className =
      access === "admin" ? "badge badge-admin" :
      access === "preacher" ? "badge badge-preacher" :
      access === "commitee leader" ? "badge badge-commiteeleader" : "badge badge-regularmember";

    return (
      <div className={className}>
        {icon}
        <span>{access}</span>
      </div>
    );
  };

  return (
    <div className="members-container">
      <div className="header">
        <div>
          <h2 className="title">MEMBERS</h2>
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
          className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <Users size={16} className="mr-2" />
          All Members
          <span className="count-badge">{memberCounts.all}</span>
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'men' ? 'active' : ''}`}
          onClick={() => setActiveFilter('men')}
        >
          <User size={16} className="mr-2" />
          Men
          <span className="count-badge">{memberCounts.men}</span>
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'women' ? 'active' : ''}`}
          onClick={() => setActiveFilter('women')}
        >
          <Users2 size={16} className="mr-2" />
          Women
          <span className="count-badge">{memberCounts.women}</span>
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'youth' ? 'active' : ''}`}
          onClick={() => setActiveFilter('youth')}
        >
          <Users size={16} className="mr-2" />
          Youth
          <span className="count-badge">{memberCounts.youth}</span>
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'children' ? 'active' : ''}`}
          onClick={() => setActiveFilter('children')}
        >
          <Baby size={16} className="mr-2" />
          Children
          <span className="count-badge">{memberCounts.children}</span>
        </button>
      </div>
      <div className="form-wrapper">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="residence"
          placeholder="Residence"
          value={form.residence}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="maritalstatus"
          placeholder="Marital Status"
          value={form.maritalstatus}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="access"
          placeholder="Access Level"
          value={form.access}
          onChange={handleInputChange}
        />
        <button onClick={handleAddMember}>
          {editMode ? "Update Member" : "Add Member"}
        </button>
      </div>
      <div className="table-wrapper">
        <table className="team-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Residence</th>
              <th>Marital status</th>
              <th>Phone Number</th>
              <th>Role Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((member) => (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.name}</td>
                <td>{member.residence}</td>
                <td>{member.maritalstatus}</td>
                <td>{member.phone}</td>
                <td>{renderAccessBadge(member.access)}</td>
                <td className="actions-cell">
                  <button 
                    className="action-btn edit-btn" 
                    onClick={() => handleEditMember(member)}
                    title="Edit member"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button 
                    className="action-btn delete-btn" 
                    onClick={() => handleRemoveMember(member.id)}
                    title="Delete member"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    <span>Delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        body {
          margin: 0;
          font-family: 'Arial', sans-serif;
        }
        .members-container {
          padding: 20px;
          background-color: #14213d;
          color: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
        }
        .subtitle {
          font-size: 14px;
          color: #aaaaaa;
        }
        .search-bar {
          position: relative;
          width: 300px;
          margin-bottom: 1rem;
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
        .search-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #888;
        }
        .form-wrapper {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .form-wrapper input {
          padding: 10px;
          border: none;
          border-radius: 5px;
          outline: none;
          background-color: #243447;
          color: #ffffff;
        }
        .form-wrapper button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          background-color: #1f9d55;
          color: #ffffff;
          cursor: pointer;
        }
        .form-wrapper button:hover {
          background-color: #1d8c4a;
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
        .table-wrapper {
          width: 100%;
          overflow-x: auto;
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
        .action-btn:active {
          transform: translateY(0);
        }
        @media (max-width: 768px) {
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
        }
        .team-table {
          width: 100%;
          border-collapse: collapse;
          background-color: #1d273b;
        }
        .team-table th,
        .team-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #2a3c54;
        }
        .team-table th {
          background-color: #22314f;
          color: #ffffff;
          font-weight: bold;
        }
        .team-table tr:hover {
          background-color: #2a3c54;
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
    `}</style>
</div>
  );
};

export default MembersTableManager;
