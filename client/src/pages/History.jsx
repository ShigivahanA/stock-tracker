import React, { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";

export default function History() {
  const { entries } = useContext(AppContext);

  // sort newest first
  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [entries]
  );

  // compute day-to-day profit/loss by stock
  const rows = sorted.map((e, i) => {
    const prev = sorted.find(
      (p) => p.stockId?._id === e.stockId?._id && p.date < e.date && p.type === "close"
    );
    let change = null;
    if (e.type === "close" && prev) {
      change = e.totalValue - prev.totalValue;
    }
    return { ...e, change };
  });

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">📜 History</h1>
      {rows.length === 0 ? (
        <p className="text-gray-500">No entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left">Date</th>
                <th className="px-2 py-1 text-left">Stock</th>
                <th className="px-2 py-1">Type</th>
                <th className="px-2 py-1">Unit (₹)</th>
                <th className="px-2 py-1">Total (₹)</th>
                <th className="px-2 py-1">Δ (₹)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e._id} className="border-b">
                  <td className="px-2 py-1">{e.date}</td>
                  <td className="px-2 py-1">{e.stockId?.symbol}</td>
                  <td className="px-2 py-1 capitalize">{e.type}</td>
                  <td className="px-2 py-1 text-right">{e.unitPrice.toFixed(2)}</td>
                  <td className="px-2 py-1 text-right">{e.totalValue.toFixed(2)}</td>
                  <td
                    className={`px-2 py-1 text-right ${
                      e.change > 0
                        ? "text-green-600"
                        : e.change < 0
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {e.change !== null ? e.change.toFixed(2) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
