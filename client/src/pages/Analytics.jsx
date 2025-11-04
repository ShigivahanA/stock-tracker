import React, { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

export default function Analytics() {
  const { entries, stocks } = useContext(AppContext);

  /**
   * 🔹 Group entries by stockId and prepare chart data
   */
  const grouped = useMemo(() => {
    const map = {};

    for (const e of entries) {
      const id = e.stockId?._id || e.stockId;
      if (!id) continue;

      if (!map[id]) map[id] = [];

      map[id].push({
        date: e.date, // no need to include e.type anymore
        unitPrice: Number(e.unitPrice),
        totalValue: Number(e.totalValue),
      });
    }

    // Sort entries by date ascending
    for (const id in map) {
      map[id].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return map;
  }, [entries]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Analytics
          </h1>
          <p className="text-sm text-gray-500">
            Visual performance of your tracked funds
          </p>
        </div>
      </header>

      {/* Charts per fund */}
      {stocks.map((s) => (
        <section key={s._id} className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            {s.name}{" "}
            <span className="text-sm text-gray-500 font-normal">
              ({s.symbol})
            </span>
          </h2>

          <div className="h-72 bg-white rounded-2xl shadow-sm border hover:shadow-md transition">
            {grouped[s._id]?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={grouped[s._id]}
                  margin={{ top: 20, right: 25, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)} // shows MM-DD
                    stroke="#9ca3af"
                  />

                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="#9ca3af"
                    width={60}
                    tickFormatter={(v) => `₹${v}`}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                      fontSize: "0.8rem",
                    }}
                    formatter={(v) => [`₹${v.toFixed(2)}`, ""]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />

                  <Legend
                    wrapperStyle={{
                      paddingTop: 8,
                      fontSize: "0.75rem",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="unitPrice"
                    stroke="url(#blueGradient)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Unit Price (₹)"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalValue"
                    stroke="url(#greenGradient)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Total Value (₹)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No data yet for {s.symbol}
              </div>
            )}
          </div>
        </section>
      ))}

      {stocks.length === 0 && (
        <p className="text-center text-gray-500 mt-10">
          No funds added yet — add some to see analytics.
        </p>
      )}
    </div>
  );
}
