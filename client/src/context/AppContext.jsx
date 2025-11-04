import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [stocks, setStocks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const fetchStocks = async () => {
    const res = await axios.get(`${baseURL}/api/stocks`);
    setStocks(res.data);
  };

  const fetchEntries = async () => {
    const res = await axios.get(`${baseURL}/api/entries`);
    setEntries(res.data);
  };

  const addEntry = async (entry) => {
    setLoading(true);
    try {
      await axios.post(`${baseURL}/api/entries`, entry);
      await fetchEntries();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    fetchEntries();
  }, []);

  return (
    <AppContext.Provider
      value={{
        stocks,
        entries,
        addEntry,
        fetchStocks,
        fetchEntries,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
