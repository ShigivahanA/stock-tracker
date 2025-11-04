import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { stocks, entries } = useContext(AppContext);

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const latest = entries.slice(0, 4); // few recent entries

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">📈 Dashboard</h1>
      <p className="text-sm text-gray-500 mb-4">Date: {today}</p>

      {stocks.length === 0 ? (
        <p className="text-gray-500">No stocks added yet.</p>
      ) : (
        <div className="grid gap-3">
          {stocks.map((s) => (
            <div
              key={s._id}
              className="bg-white rounded-xl shadow p-3 border flex justify-between"
            >
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-gray-400">{s.symbol}</p>
              </div>
              <Link
                to="/add"
                className="text-blue-600 text-sm self-center underline"
              >
                Add Entry
              </Link>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold mt-6 mb-2">Recent Entries</h2>
      {latest.map((e) => (
        <div key={e._id} className="text-sm border-b py-1">
          {e.stockId?.symbol} – {e.type} @ ₹{e.unitPrice.toFixed(2)} | Total ₹
          {e.totalValue.toFixed(2)}
        </div>
      ))}
    </div>
  );
}
