import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Upload, Copy, Trash2 } from "lucide-react";
import { readFromStorage, saveToStorage, STORAGE_KEYS } from "./utils/storage";
import { useSidebar } from "./context/SidebarContext";
import "./EditPages.css";

const ShareData = () => {
  const navigate = useNavigate();
  const { sidebarCollapsed } = useSidebar();
  const fileInputRef = useRef(null);

  const handleClearAllData = () => {
    if (
      window.confirm(
        "⚠️ WARNING: This will delete ALL app data!\n\n" +
        "This includes:\n" +
        "- All transactions and financial data\n" +
        "- All quarterly and revenue data\n" +
        "- All members\n" +
        "- All events\n" +
        "- All announcements\n" +
        "- All settings data (budget, notes, users, templates)\n\n" +
        "This action cannot be undone. Are you sure?"
      )
    ) {
      // Second confirmation
      if (
        window.confirm(
          "Are you ABSOLUTELY sure?\n\n" +
          "This is your last chance to cancel before all data is deleted permanently."
        )
      ) {
        // Clear dashboard data
        localStorage.removeItem(STORAGE_KEYS.BAR_CHART);
        localStorage.removeItem(STORAGE_KEYS.PIE_CHART);
        localStorage.removeItem(STORAGE_KEYS.LINE_CHART);
        localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        
        // Clear members and events
        localStorage.removeItem(STORAGE_KEYS.MEMBERS);
        localStorage.removeItem(STORAGE_KEYS.EVENTS);
        
        // Clear announcements
        localStorage.removeItem("churchAnnouncements");
        
        // Clear settings data
        localStorage.removeItem("sg_sermonTemplates");
        localStorage.removeItem("sg_budget");
        localStorage.removeItem("sg_notes");
        localStorage.removeItem("sg_users");
        localStorage.removeItem("sg_systemInfo");
        localStorage.removeItem("sg_settings");
        
        alert("All app data has been cleared. Starting fresh!");
        navigate("/dashboard");
      }
    }
  };

  const handleExport = () => {
    // Dashboard data
    const barChartData = readFromStorage(STORAGE_KEYS.BAR_CHART, []);
    const pieChartData = readFromStorage(STORAGE_KEYS.PIE_CHART, []);
    const lineData = readFromStorage(STORAGE_KEYS.LINE_CHART, []);
    const transactions = readFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
    
    // Members and events
    const members = readFromStorage(STORAGE_KEYS.MEMBERS, []);
    const events = readFromStorage(STORAGE_KEYS.EVENTS, []);
    
    // Announcements
    const announcements = JSON.parse(localStorage.getItem("churchAnnouncements") || "[]");
    
    // Settings data
    const sermonTemplates = JSON.parse(localStorage.getItem("sg_sermonTemplates") || "[]");
    const budget = JSON.parse(localStorage.getItem("sg_budget") || '{"categories":[],"expenses":[]}');
    const notes = JSON.parse(localStorage.getItem("sg_notes") || "[]");
    const users = JSON.parse(localStorage.getItem("sg_users") || "[]");

    const exportData = {
      dashboard: {
        barChartData,
        pieChartData,
        lineData,
        transactions,
      },
      members,
      events,
      announcements,
      settings: {
        sermonTemplates,
        budget,
        notes,
        users,
      },
      exportDate: new Date().toISOString(),
      version: "2.0",
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `church-app-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert("All app data exported successfully!");
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        // Support both old v1.0 format and new v2.0 format
        const isOldFormat = importedData.version === "1.0" || (!importedData.version && importedData.barChartData);
        
        // Confirm before importing
        if (
          window.confirm(
            `Import app data from ${
              importedData.exportDate
                ? new Date(importedData.exportDate).toLocaleDateString()
                : "unknown date"
            }?\n\nThis will replace ALL current app data.`
          )
        ) {
          if (isOldFormat) {
            // Old format - only dashboard data
            if (importedData.barChartData) saveToStorage(STORAGE_KEYS.BAR_CHART, importedData.barChartData);
            if (importedData.pieChartData) saveToStorage(STORAGE_KEYS.PIE_CHART, importedData.pieChartData);
            if (importedData.lineData) saveToStorage(STORAGE_KEYS.LINE_CHART, importedData.lineData);
            if (importedData.transactions) saveToStorage(STORAGE_KEYS.TRANSACTIONS, importedData.transactions);
          } else {
            // New format v2.0 - all app data
            // Dashboard data
            if (importedData.dashboard) {
              saveToStorage(STORAGE_KEYS.BAR_CHART, importedData.dashboard.barChartData || []);
              saveToStorage(STORAGE_KEYS.PIE_CHART, importedData.dashboard.pieChartData || []);
              saveToStorage(STORAGE_KEYS.LINE_CHART, importedData.dashboard.lineData || []);
              saveToStorage(STORAGE_KEYS.TRANSACTIONS, importedData.dashboard.transactions || []);
            }
            
            // Members and events
            if (importedData.members) saveToStorage(STORAGE_KEYS.MEMBERS, importedData.members);
            if (importedData.events) saveToStorage(STORAGE_KEYS.EVENTS, importedData.events);
            
            // Announcements
            if (importedData.announcements) {
              localStorage.setItem("churchAnnouncements", JSON.stringify(importedData.announcements));
            }
            
            // Settings data
            if (importedData.settings) {
              if (importedData.settings.sermonTemplates) {
                localStorage.setItem("sg_sermonTemplates", JSON.stringify(importedData.settings.sermonTemplates));
              }
              if (importedData.settings.budget) {
                localStorage.setItem("sg_budget", JSON.stringify(importedData.settings.budget));
              }
              if (importedData.settings.notes) {
                localStorage.setItem("sg_notes", JSON.stringify(importedData.settings.notes));
              }
              if (importedData.settings.users) {
                localStorage.setItem("sg_users", JSON.stringify(importedData.settings.users));
              }
            }
          }
          
          alert("All app data imported successfully!");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Import error:", error);
        alert("Error importing file. Please ensure it is a valid JSON file.");
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = () => {
    // Dashboard data
    const barChartData = readFromStorage(STORAGE_KEYS.BAR_CHART, []);
    const pieChartData = readFromStorage(STORAGE_KEYS.PIE_CHART, []);
    const lineData = readFromStorage(STORAGE_KEYS.LINE_CHART, []);
    const transactions = readFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
    
    // Members and events
    const members = readFromStorage(STORAGE_KEYS.MEMBERS, []);
    const events = readFromStorage(STORAGE_KEYS.EVENTS, []);
    
    // Announcements
    const announcements = JSON.parse(localStorage.getItem("churchAnnouncements") || "[]");
    
    // Settings data
    const sermonTemplates = JSON.parse(localStorage.getItem("sg_sermonTemplates") || "[]");
    const budget = JSON.parse(localStorage.getItem("sg_budget") || '{"categories":[],"expenses":[]}');
    const notes = JSON.parse(localStorage.getItem("sg_notes") || "[]");
    const users = JSON.parse(localStorage.getItem("sg_users") || "[]");

    const exportData = {
      dashboard: {
        barChartData,
        pieChartData,
        lineData,
        transactions,
      },
      members,
      events,
      announcements,
      settings: {
        sermonTemplates,
        budget,
        notes,
        users,
      },
      exportDate: new Date().toISOString(),
      version: "2.0",
    };

    navigator.clipboard
      .writeText(JSON.stringify(exportData, null, 2))
      .then(() => alert("All app data copied to clipboard! You can now share it."))
      .catch((err) => {
        console.error("Failed to copy:", err);
        alert("Failed to copy to clipboard. Please try export instead.");
      });
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <div className={`edit-page ${sidebarCollapsed ? "collapsed" : ""}`}>
      <div className="edit-page-header">
        <button onClick={handleBack} className="back-button">
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h1>Share App Data</h1>
      </div>

      <div className="edit-page-content">
        <div className="edit-card" style={{ maxWidth: "700px" }}>
          <div className="edit-card-header">
            <h2>Export or Import Data</h2>
            <p>
              Export all your app data (dashboard, members, events, announcements, settings) to share 
              or backup, or import data from another source.
            </p>
          </div>

          <div className="share-options">
            <div className="share-option-card" onClick={handleExport}>
              <div className="share-icon-container blue">
                <Download size={24} />
              </div>
              <div className="share-option-content">
                <h3>Export to File</h3>
                <p>Download dashboard data as JSON file</p>
              </div>
            </div>

            <div
              className="share-option-card"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="share-icon-container green">
                <Upload size={24} />
              </div>
              <div className="share-option-content">
                <h3>Import from File</h3>
                <p>Upload a JSON file to restore data</p>
              </div>
            </div>

            <div className="share-option-card" onClick={copyToClipboard}>
              <div className="share-icon-container yellow">
                <Copy size={24} />
              </div>
              <div className="share-option-content">
                <h3>Copy to Clipboard</h3>
                <p>Copy data as text to share easily</p>
              </div>
            </div>

            <div 
              className="share-option-card danger" 
              onClick={handleClearAllData}
              style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <div className="share-icon-container red">
                <Trash2 size={24} />
              </div>
              <div className="share-option-content">
                <h3>Clear All Data</h3>
                <p>Delete all app data and start completely fresh</p>
              </div>
            </div>
          </div>

          <div className="info-box">
            <p>
              <strong>Note:</strong> Exported data includes all app data (dashboard, members, events, 
              announcements, and settings). Importing will replace ALL your current app data.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default ShareData;
