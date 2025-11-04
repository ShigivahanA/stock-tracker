import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function EntryForm() {
  const { stocks, addEntry, loading } = useContext(AppContext);
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const handleChange = (stockId, field, value) => {
    setForm((prev) => ({
      ...prev,
      [stockId]: { ...prev[stockId], [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    navigate("/");
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">🕘 Daily Entry</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {stocks.map((stock) => (
          <div key={stock._id} className="bg-white p-3 rounded-xl shadow">
            <h2 className="font-semibold mb-2">
              {stock.name} ({stock.symbol})
            </h2>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Unit Price"
                step="0.0001"
                value={form[stock._id]?.unitPrice || ""}
                onChange={(e) =>
                  handleChange(stock._id, "unitPrice", e.target.value)
                }
                className="border rounded w-full p-2 text-sm"
              />
              <input
                type="number"
                placeholder="Total Value (₹)"
                step="0.01"
                value={form[stock._id]?.totalValue || ""}
                onChange={(e) =>
                  handleChange(stock._id, "totalValue", e.target.value)
                }
                className="border rounded w-full p-2 text-sm"
              />
            </div>
          </div>
        ))}

        <button
          disabled={loading}
          type="submit"
          className="bg-blue-600 text-white w-full py-2 rounded-lg mt-3"
        >
          {loading ? "Saving..." : "Save Entries"}
        </button>
      </form>
    </div>
  );
}
