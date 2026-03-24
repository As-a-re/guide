// Helper functions for localStorage operations

export const readFromStorage = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
};

// Storage keys
export const STORAGE_KEYS = {
  MEMBERS: 'church_members',
  EVENTS: 'church_events',
  BAR_CHART: 'dashboard_bar_chart',
  PIE_CHART: 'dashboard_pie_chart',
  LINE_CHART: 'dashboard_line_chart',
  TRANSACTIONS: 'dashboard_transactions',
};
