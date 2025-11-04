import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeftCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function EntryForm() {
  const { stocks, addEntry, loading } = useContext(AppContext);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handleChange = (stockId, field, value) => {
    setForm((prev) => ({
      ...prev,
      [stockId]: { ...prev[stockId], [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaved(false);
    for (const stock of stocks) {
      const entry = form[stock._id];
      if (entry && entry.unitPrice && entry.totalValue) {
        await addEntry({
          stockId: stock._id,
          unitPrice: parseFloat(entry.unitPrice),
          totalValue: parseFloat(entry.totalValue),
        });
      }
    }
    setSaved(true);
    setTimeout(() => navigate("/"), 1200);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Daily Fund Entry</h1>
            <p className="text-sm text-gray-500">Date: {today}</p>
          </div>
        </div>
      </header>

      {stocks.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">
          No funds found. Please add funds first.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 animate-fadeIn"
          autoComplete="off"
        >
          {stocks.map((stock) => (
            <div
              key={stock._id}
              className="bg-white border rounded-2xl shadow-sm hover:shadow-md transition p-5"
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {stock.name}
                  </h2>
                  <p className="text-sm text-gray-500">{stock.symbol}</p>
                </div>
                <p className="text-xs text-gray-400">
                  Units Held:{" "}
                  <span className="text-gray-700 font-medium">
                    {stock.units ?? 0}
                  </span>
                </p>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1 font-medium">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter current unit price"
                    step="0.0001"
                    value={form[stock._id]?.unitPrice || ""}
                    onChange={(e) =>
                      handleChange(stock._id, "unitPrice", e.target.value)
                    }
                    className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1 font-medium">
                    Total Value (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter total investment value"
                    step="0.01"
                    value={form[stock._id]?.totalValue || ""}
                    onChange={(e) =>
                      handleChange(stock._id, "totalValue", e.target.value)
                    }
                    className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Save Button */}
          <div className="mt-8">
            <button
              disabled={loading}
              type="submit"
              className={`w-full py-3 rounded-xl text-white font-semibold transition-all ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? (
                <span className="flex justify-center items-center">
                  <Loader2 className="animate-spin mr-2" size={18} /> Saving...
                </span>
              ) : saved ? (
                <span className="flex justify-center items-center">
                  <CheckCircle2 className="text-green-300 mr-2" size={18} />
                  Entries Saved!
                </span>
              ) : (
                "Save Entries"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
