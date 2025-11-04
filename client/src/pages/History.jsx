import React, { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { TrendingUp, TrendingDown, Clock4 } from "lucide-react";

export default function History() {
  const { entries } = useContext(AppContext);

  // sort newest first
  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [entries]
  );

  // compute day-to-day profit/loss by stock
  const rows = sorted.map((e) => {
    const prev = sorted.find(
      (p) => p.stockId?._id === e.stockId?._id && p.date < e.date && p.type === "close"
    );
    let change = null;
    if (e.type === "close" && prev) {
      change = e.totalValue - prev.totalValue;
    }
    return { ...e, change };
  });

  // Total gain/loss across all close entries
  const netChange = rows.reduce((acc, e) => acc + (e.change || 0), 0);
  const positive = netChange > 0;
  const negative = netChange < 0;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
          <p className="text-sm text-gray-500">All your recorded entries</p>
        </div>
        <Clock4 className="text-blue-600" size={26} />
      </header>

      {/* Summary Card */}
      {rows.length > 0 && (
        <div
          className={`rounded-2xl p-4 mb-5 text-white shadow-md ${
            positive
              ? "bg-gradient-to-r from-green-600 to-emerald-500"
              : negative
              ? "bg-gradient-to-r from-red-600 to-rose-500"
              : "bg-gradient-to-r from-gray-500 to-gray-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm opacity-90">Overall Change</h2>
              <p className="text-2xl font-bold">
                {netChange > 0 ? "+" : ""}
                {netChange.toFixed(2)} ₹
              </p>
            </div>
            {positive ? (
              <TrendingUp size={32} className="opacity-80" />
            ) : negative ? (
              <TrendingDown size={32} className="opacity-80" />
            ) : (
              <span className="text-lg font-semibold">—</span>
            )}
          </div>
          <p className="text-xs opacity-80 mt-1">Net profit/loss over recorded sessions</p>
        </div>
      )}

      {/* History Table */}
      {rows.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No entries yet.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Stock</th>
                <th className="px-4 py-2 text-center">Type</th>
                <th className="px-4 py-2 text-right">Unit (₹)</th>
                <th className="px-4 py-2 text-right">Total (₹)</th>
                <th className="px-4 py-2 text-right">Δ (₹)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr
                  key={e._id}
                  className={`border-b last:border-none ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-2 text-gray-700">{e.date}</td>
                  <td className="px-4 py-2 text-gray-700 font-medium">
                    {e.stockId?.symbol}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        e.type === "open"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {e.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-800 font-medium">
                    {e.unitPrice.toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-800 font-semibold">
                    {e.totalValue.toFixed(2)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${
                      e.change > 0
                        ? "text-green-600"
                        : e.change < 0
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {e.change !== null
                      ? `${e.change > 0 ? "+" : ""}${e.change.toFixed(2)}`
                      : "—"}
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
