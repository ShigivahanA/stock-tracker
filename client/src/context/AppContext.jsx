import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [stocks, setStocks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  /**
   * 🔹 Fetch all stocks from server
   */
  const fetchStocks = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/stocks`);
      setStocks(res.data);
    } catch (err) {
      console.error("Failed to fetch stocks:", err);
    }
  };

  /**
   * 🔹 Fetch all entries from server
   */
  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/entries`);
      setEntries(res.data);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
    }
  };

  /**
   * 🔹 Add a new entry
   */
  const addEntry = async (entry) => {
    setLoading(true);
    try {
      await axios.post(`${baseURL}/api/entries`, entry);
      await fetchEntries(); // refresh after adding
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔹 Refresh everything (for the refresh button)
   */
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStocks(), fetchEntries()]);
    } catch (err) {
      console.error("Refresh failed:", err);
      alert("Refresh failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const updateStockUnits = async (stockId, newUnits) => {
  try {
    await axios.patch(`${baseURL}/api/stocks/${stockId}`, { units: newUnits });
    await fetchStocks(); // refresh list
    toast.success("Units updated!", { autoClose: 1000 });
  } catch (err) {
    console.error("Failed to update units:", err);
    toast.error("Failed to update units");
  }
};

  /**
   * 🔹 Initial load
   */
  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        stocks,
        entries,
        addEntry,
        fetchStocks,
        fetchEntries,
        fetchAllData, // ✅ make sure this is exposed for Dashboard refresh
        loading,
        updateStockUnits,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
