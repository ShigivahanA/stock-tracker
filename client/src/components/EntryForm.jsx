import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function EntryForm() {
  const { stocks, entries, addEntry, loading } = useContext(AppContext);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  ); // default to today
  const navigate = useNavigate();

  const displayDate = new Date(selectedDate).toLocaleDateString("en-IN", {
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

    // Prevent duplicate entries for selected date
    for (const stock of stocks) {
      const alreadyExists = entries.some(
        (entry) =>
          (entry.stockId?._id === stock._id || entry.stockId === stock._id) &&
          entry.date === selectedDate
      );
      if (alreadyExists) {
        alert(`An entry for ${stock.name} already exists on ${displayDate}.`);
        return;
      }
    }

    setSaved(false);
    for (const stock of stocks) {
      const entry = form[stock._id];
      if (entry && entry.unitPrice && entry.totalValue) {
        await addEntry({
          stockId: stock._id,
          unitPrice: parseFloat(entry.unitPrice),
          totalValue: parseFloat(entry.totalValue),
          date: selectedDate, // user-selected date
        });
      }
    }

    setSaved(true);
    setTimeout(() => navigate("/"), 1000);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Fund Entry</h1>
          <p className="text-sm text-gray-500">Date: {displayDate}</p>
        </div>

        {/* Manual Date Picker */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="entryDate"
            className="text-sm text-gray-600 font-medium"
          >
            Select Date:
          </label>
          <input
            type="date"
            id="entryDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)} // prevent future dates
            className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>
      </header>

      {stocks.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">
          No funds found. Please add funds first.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          {stocks.map((stock) => {
            const alreadyExists = entries.some(
              (entry) =>
                (entry.stockId?._id === stock._id ||
                  entry.stockId === stock._id) &&
                entry.date === selectedDate
            );

            return (
              <div
                key={stock._id}
                className={`bg-white border rounded-2xl shadow-sm p-5 transition ${
                  alreadyExists ? "opacity-60 pointer-events-none" : ""
                }`}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1 font-medium">
                      Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Enter current unit price"
                      value={form[stock._id]?.unitPrice || ""}
                      onChange={(e) =>
                        handleChange(stock._id, "unitPrice", e.target.value)
                      }
                      disabled={alreadyExists}
                      className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1 font-medium">
                      Total Value (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter total investment value"
                      value={form[stock._id]?.totalValue || ""}
                      onChange={(e) =>
                        handleChange(stock._id, "totalValue", e.target.value)
                      }
                      disabled={alreadyExists}
                      className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                  </div>
                </div>

                {alreadyExists && (
                  <p className="text-xs text-red-500 mt-2">
                    Entry already recorded for {displayDate}.
                  </p>
                )}
              </div>
            );
          })}

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
