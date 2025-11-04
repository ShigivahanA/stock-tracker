import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "../src/context/AppContext";
import Dashboard from "./pages/Dashboard";
import EntryForm from "./components/EntryForm";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 pb-16">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<EntryForm />} />
              <Route path="/history" element={<History />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </main>
          <Navbar />
        </div>
      </Router>
    </AppProvider>
  );
}
