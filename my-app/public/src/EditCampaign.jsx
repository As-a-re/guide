import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { readFromStorage, saveToStorage, STORAGE_KEYS } from "./utils/storage";
import { useSidebar } from "./context/SidebarContext";
import "./EditPages.css";

const EditCampaign = () => {
  const navigate = useNavigate();
  const { sidebarCollapsed } = useSidebar();
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    const data = readFromStorage(STORAGE_KEYS.PIE_CHART, []);
    setPieData(data);
  }, []);

  const handleSave = () => {
    saveToStorage(STORAGE_KEYS.PIE_CHART, pieData);
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
        <h1>Edit Campaign Distribution</h1>
      </div>

      <div className="edit-page-content">
        <div className="edit-card">
          <div className="edit-card-header">
            <h2>Campaign Progress Data</h2>
            <p>Update the distribution values and colors for each category</p>
          </div>

          <div className="edit-form">
            <div className="campaign-grid">
              {pieData.map((p, idx) => (
                <div key={p.name} className="campaign-edit-card">
                  <div className="campaign-card-header">
                    <div
                      className="color-indicator"
                      style={{ backgroundColor: p.color }}
                    />
                    <h3>{p.name}</h3>
                  </div>
                  <div className="campaign-card-body">
                    <div className="form-group">
                      <label>Amount (GH₵)</label>
                      <input
                        type="number"
                        value={p.value}
                        onChange={(e) => {
                          const nd = [...pieData];
                          nd[idx].value = parseInt(e.target.value) || 0;
                          setPieData(nd);
                        }}
                        className="edit-input"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Color</label>
                      <div className="color-input-group">
                        <input
                          type="color"
                          value={p.color}
                          onChange={(e) => {
                            const nd = [...pieData];
                            nd[idx].color = e.target.value;
                            setPieData(nd);
                          }}
                          className="color-picker"
                        />
                        <input
                          type="text"
                          value={p.color}
                          onChange={(e) => {
                            const nd = [...pieData];
                            nd[idx].color = e.target.value;
                            setPieData(nd);
                          }}
                          className="edit-input"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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

export default EditCampaign;
