import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { readFromStorage, saveToStorage, STORAGE_KEYS } from "./utils/storage";
import { useSidebar } from "./context/SidebarContext";
import "./EditPages.css";

const EditTransaction = () => {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const { sidebarCollapsed } = useSidebar();
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    id: null,
    user: "",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    category: "Baskets",
    type: "revenue",
  });

  useEffect(() => {
    const data = readFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
    setTransactions(data);

    if (transactionId && transactionId !== "new") {
      const transaction = data.find((t) => t.id === transactionId);
      if (transaction) {
        setForm(transaction);
      }
    }
  }, [transactionId]);

  const handleSave = () => {
    let updatedTransactions;
    if (form.id) {
      // Edit existing transaction
      updatedTransactions = transactions.map((t) =>
        t.id === form.id ? { ...form } : t
      );
    } else {
      // Add new transaction
      const newTransaction = {
        ...form,
        id: Date.now().toString(),
      };
      updatedTransactions = [newTransaction, ...transactions];
    }

    saveToStorage(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);
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
        <h1>{form.id ? "Edit Transaction" : "Add Transaction"}</h1>
      </div>

      <div className="edit-page-content">
        <div className="edit-card" style={{ maxWidth: "600px" }}>
          <div className="edit-card-header">
            <h2>Transaction Details</h2>
            <p>
              {form.id
                ? "Update the transaction information"
                : "Add a new transaction to the system"}
            </p>
          </div>

          <div className="edit-form">
            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <input
                id="description"
                type="text"
                value={form.user}
                onChange={(e) => setForm({ ...form, user: e.target.value })}
                className="edit-input"
                placeholder="e.g., Tithes Collection"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="edit-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Transaction Type *</label>
              <select
                id="type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="edit-input"
                required
              >
                <option value="revenue">Revenue (Income)</option>
                <option value="expense">Expense (Payment)</option>
              </select>
              <small style={{ 
                display: 'block', 
                marginTop: '0.5rem', 
                color: '#94a3b8', 
                fontSize: '0.8125rem' 
              }}>
                {form.type === 'revenue' 
                  ? '💰 Revenue will add to the category total' 
                  : '💸 Expense will subtract from the category total'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount (GH₵) *</label>
              <input
                id="amount"
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
                }
                className="edit-input"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="edit-input"
                required
              >
                <option value="Baskets">Baskets</option>
                <option value="Welfares">Welfares</option>
                <option value="Offerings">Offerings</option>
                <option value="Donations">Donations</option>
              </select>
            </div>

            <div className="edit-actions">
              <button onClick={handleCancel} className="btn-cancel">
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-save"
                disabled={!form.user || !form.date || form.amount === 0}
              >
                <Save size={18} />
                {form.id ? "Update Transaction" : "Add Transaction"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTransaction;
