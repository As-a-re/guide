import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X, Plus, Trash2 } from "lucide-react";
import { readFromStorage, saveToStorage, STORAGE_KEYS } from "./utils/storage";
import { useSidebar } from "./context/SidebarContext";
import "./EditPages.css";

const EditQuarters = () => {
  const navigate = useNavigate();
  const { sidebarCollapsed } = useSidebar();
  const [barChartData, setBarChartData] = useState([]);
  const [editData, setEditData] = useState([]);

  useEffect(() => {
    const data = readFromStorage(STORAGE_KEYS.BAR_CHART, []);
    setBarChartData(data);
    setEditData(JSON.parse(JSON.stringify(data)));
  }, []);

  const handleAddQuarter = () => {
    const newQuarter = {
      id: Date.now(),
      name: `Q${editData.length + 1} ${new Date().getFullYear()}`,
      baskets: 0,
      welfares: 0,
      offerings: 0,
      donations: 0
    };
    setEditData([...editData, newQuarter]);
  };

  const handleDeleteQuarter = (idx) => {
    if (!window.confirm('Are you sure you want to delete this quarter?')) return;
    const nd = editData.filter((_, i) => i !== idx);
    setEditData(nd);
  };

  const handleSave = () => {
    saveToStorage(STORAGE_KEYS.BAR_CHART, editData);
    
    // Update pie chart based on bar chart totals
    const newPieData = [
      { 
        name: "Baskets", 
        value: editData.reduce((sum, q) => sum + (parseInt(q.baskets) || 0), 0),
        color: "#3b82f6"
      },
      { 
        name: "Welfares", 
        value: editData.reduce((sum, q) => sum + (parseInt(q.welfares) || 0), 0),
        color: "#b9103a"
      },
      { 
        name: "Offerings", 
        value: editData.reduce((sum, q) => sum + (parseInt(q.offerings) || 0), 0),
        color: "#10b981"
      },
      { 
        name: "Donations", 
        value: editData.reduce((sum, q) => sum + (parseInt(q.donations) || 0), 0),
        color: "#fbbf24"
      },
    ];
    saveToStorage(STORAGE_KEYS.PIE_CHART, newPieData);
    
    navigate("/dashboard");
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  return (
    <div className={`edit-page ${sidebarCollapsed ? "collapsed" : ""}`}>
      <div className="edit-page-header">
        <button onClick={handleCancel} className="back-button">
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h1>Edit Quarterly Giving</h1>
      </div>

      <div className="edit-page-content">
        <div className="edit-card">
          <div className="edit-card-header">
            <h2>Quarterly Giving Data</h2>
            <p>Update the financial data for each quarter</p>
          </div>

          <div className="edit-form">
            {editData.length > 0 ? (
              <div className="edit-table-container">
                <table className="edit-table">
                  <thead>
                    <tr>
                      <th>Quarter</th>
                      <th>Baskets (GH₵)</th>
                      <th>Welfares (GH₵)</th>
                      <th>Offerings (GH₵)</th>
                      <th>Donations (GH₵)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editData.map((q, idx) => (
                      <tr key={q.id}>
                        <td>
                          <input
                            type="text"
                            value={q.name}
                            onChange={(e) => {
                              const nd = [...editData];
                              nd[idx].name = e.target.value;
                              setEditData(nd);
                            }}
                            className="edit-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={q.baskets}
                            onChange={(e) => {
                              const nd = [...editData];
                              nd[idx].baskets = parseInt(e.target.value) || 0;
                              setEditData(nd);
                            }}
                            className="edit-input"
                            min="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={q.welfares}
                            onChange={(e) => {
                              const nd = [...editData];
                              nd[idx].welfares = parseInt(e.target.value) || 0;
                              setEditData(nd);
                            }}
                            className="edit-input"
                            min="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={q.offerings}
                            onChange={(e) => {
                              const nd = [...editData];
                              nd[idx].offerings = parseInt(e.target.value) || 0;
                              setEditData(nd);
                            }}
                            className="edit-input"
                            min="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={q.donations}
                            onChange={(e) => {
                              const nd = [...editData];
                              nd[idx].donations = parseInt(e.target.value) || 0;
                              setEditData(nd);
                            }}
                            className="edit-input"
                            min="0"
                          />
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDeleteQuarter(idx)} 
                            className="btn-danger-small"
                            title="Delete quarter"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ 
                padding: '3rem 2rem', 
                textAlign: 'center', 
                color: '#94a3b8',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '0.5rem',
                border: '1px dashed #2d3a52',
                marginBottom: '1.5rem'
              }}>
                <p style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 500 }}>No quarters added yet</p>
                <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Click "Add Quarter" below to create your first quarter</p>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <button onClick={handleAddQuarter} className="btn-add">
                <Plus size={18} />
                Add Quarter
              </button>
            </div>

            <div className="edit-actions">
              <button onClick={handleCancel} className="btn-cancel">
                <X size={18} />
                Cancel
              </button>
              <button onClick={handleSave} className="btn-save">
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQuarters;
