import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [stocks, setStocks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  /**
   * 🔹 Fetch all stocks from the backend
   */
  const fetchStocks = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/stocks`);
      setStocks(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch stocks:", err);
      toast.error("Failed to fetch stocks");
    }
  };

  /**
   * 🔹 Fetch all entries from the backend
   */
  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/entries`);
      setEntries(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch entries:", err);
      toast.error("Failed to fetch entries");
    }
  };

  /**
   * 🔹 Add a new entry (type defaults to "close" on backend)
   */
  const addEntry = async (entry) => {
    setLoading(true);
    try {
      // No need to send `type` now
      const { stockId, unitPrice, totalValue, date } = entry;

      if (!stockId || !unitPrice || !totalValue || !date) {
        throw new Error("Missing required entry fields");
      }

      await axios.post(`${baseURL}/api/entries`, {
        stockId,
        unitPrice,
        totalValue,
        date,
      });

      await fetchEntries();
      toast.success("Entry saved successfully!", { autoClose: 1000 });
    } catch (err) {
      console.error("❌ Failed to save entry:", err);
      const msg = err.response?.data?.error || "Failed to save entry";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔹 Update stock units
   */
  const updateStockUnits = async (stockId, newUnits) => {
    try {
      await axios.patch(`${baseURL}/api/stocks/${stockId}`, { units: newUnits });
      await fetchStocks();
      toast.success("Units updated!", { autoClose: 1000 });
    } catch (err) {
      console.error("❌ Failed to update units:", err);
      toast.error("Failed to update units");
    }
  };

  /**
   * 🔹 Refresh all data (used in Dashboard)
   */
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStocks(), fetchEntries()]);
    } catch (err) {
      console.error("❌ Refresh failed:", err);
      toast.error("Refresh failed");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔹 Load data on mount
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
        fetchAllData,
        updateStockUnits,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
