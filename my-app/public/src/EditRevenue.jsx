import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { readFromStorage, saveToStorage, STORAGE_KEYS } from "./utils/storage";
import { useSidebar } from "./context/SidebarContext";
import "./EditPages.css";

const EditRevenue = () => {
  const navigate = useNavigate();
  const { sidebarCollapsed } = useSidebar();
  const [lineData, setLineData] = useState([]);

  useEffect(() => {
    const data = readFromStorage(STORAGE_KEYS.LINE_CHART, []);
    setLineData(data);
  }, []);

  const handleSave = () => {
    saveToStorage(STORAGE_KEYS.LINE_CHART, lineData);
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
        <h1>Edit Monthly Revenue</h1>
      </div>

      <div className="edit-page-content">
        <div className="edit-card">
          <div className="edit-card-header">
            <h2>Monthly Revenue Data</h2>
            <p>Update the revenue trends for each month</p>
          </div>

          <div className="edit-form">
            <div className="edit-table-container">
              <table className="edit-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Baskets (GH₵)</th>
                    <th>Welfares (GH₵)</th>
                    <th>Offerings (GH₵)</th>
                    <th>Donations (GH₵)</th>
                  </tr>
                </thead>
                <tbody>
                  {lineData.map((m, idx) => (
                    <tr key={m.name}>
                      <td>
                        <span className="month-label">{m.name}</span>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={m.baskets}
                          onChange={(e) => {
                            const nd = [...lineData];
                            nd[idx] = { ...nd[idx], baskets: parseInt(e.target.value) || 0 };
                            setLineData(nd);
                          }}
                          className="edit-input"
                          min="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={m.welfares}
                          onChange={(e) => {
                            const nd = [...lineData];
                            nd[idx] = { ...nd[idx], welfares: parseInt(e.target.value) || 0 };
                            setLineData(nd);
                          }}
                          className="edit-input"
                          min="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={m.offerings}
                          onChange={(e) => {
                            const nd = [...lineData];
                            nd[idx] = { ...nd[idx], offerings: parseInt(e.target.value) || 0 };
                            setLineData(nd);
                          }}
                          className="edit-input"
                          min="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={m.donations}
                          onChange={(e) => {
                            const nd = [...lineData];
                            nd[idx] = { ...nd[idx], donations: parseInt(e.target.value) || 0 };
                            setLineData(nd);
                          }}
                          className="edit-input"
                          min="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

export default EditRevenue;
