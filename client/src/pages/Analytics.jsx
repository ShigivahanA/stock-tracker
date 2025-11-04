import React, { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";

export default function Analytics() {
  const { entries, stocks } = useContext(AppContext);

  // group entries by stockId
  const grouped = useMemo(() => {
    const map = {};
    for (let e of entries) {
      const id = e.stockId?._id;
      if (!id) continue;
      if (!map[id]) map[id] = [];
      map[id].push({
        date: e.date + " " + e.type,
        unitPrice: e.unitPrice,
        totalValue: e.totalValue,
      });
    }
    for (let k in map) {
      map[k].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    return map;
  }, [entries]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">📈 Analytics</h1>
      {stocks.map((s) => (
        <div key={s._id} className="mb-6">
          <h2 className="font-semibold mb-2">
            {s.name} ({s.symbol})
          </h2>
          <div className="h-64 bg-white rounded-xl shadow p-2">
            {grouped[s._id]?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={grouped[s._id]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" hide />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="unitPrice" stroke="#2563eb" name="Unit Price ₹" />
                  <Line type="monotone" dataKey="totalValue" stroke="#16a34a" name="Total ₹" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm p-4">No data yet.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
