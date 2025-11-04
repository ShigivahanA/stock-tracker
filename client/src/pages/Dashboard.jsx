import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  RotateCcw,
  Loader2,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

export default function Dashboard() {
  const { stocks, entries, fetchAllData } = useContext(AppContext);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchAllData();
      toast.success("Data refreshed successfully!", { autoClose: 1000 });
    } catch (err) {
      toast.error("Refresh failed!");
      console.error("Refresh failed:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  /**
   * 🧮 Build maps for latest and previous entries per stock
   */
  const { latestMap, prevMap } = useMemo(() => {
    const grouped = new Map();

    // Group all entries by stockId
    for (const e of entries) {
      const id = e.stockId?._id || e.stockId;
      if (!id) continue;
      if (!grouped.has(id)) grouped.set(id, []);
      grouped.get(id).push(e);
    }

    const latestMap = new Map();
    const prevMap = new Map();

    // Sort chronologically and pick last two
    for (const [id, list] of grouped) {
      list.sort((a, b) => a.date.localeCompare(b.date));
      latestMap.set(id, list[list.length - 1]);
      if (list.length > 1) prevMap.set(id, list[list.length - 2]);
    }

    return { latestMap, prevMap };
  }, [entries]);

  /**
   * 💰 Calculate yesterday's total combined portfolio value
   */
  const yesterday = useMemo(() => {
    const todayDate = new Date();
    const yDate = new Date(todayDate.setDate(todayDate.getDate() - 1))
      .toISOString()
      .slice(0, 10);

    const yesterdayEntries = entries.filter((e) => e.date === yDate);
    const total = yesterdayEntries.reduce(
      (sum, e) => sum + (Number(e.totalValue) || 0),
      0
    );

    return { date: yDate, total };
  }, [entries]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hello, Athithan 👋
          </h1>
          <p className="text-sm text-gray-500">Today • {today}</p>
        </div>

        <button
          onClick={handleRefresh}
          className="p-2 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition active:scale-95"
          aria-label="Refresh"
        >
          {refreshing ? (
            <Loader2 className="text-blue-600 animate-spin" size={22} />
          ) : (
            <RotateCcw className="text-blue-600" size={22} />
          )}
        </button>
      </header>

      {/* Market Info */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center space-x-2 text-gray-700">
          <Clock className="text-blue-600" size={20} />
          <span className="font-medium">Market Hours</span>
        </div>
        <div className="text-sm text-gray-600 mt-2 sm:mt-0">
          🕘 Opens at <span className="font-semibold text-green-600">09:15 AM</span>&nbsp;
          🕕 Closes at <span className="font-semibold text-red-600">03:30 PM</span>
        </div>
      </div>

      {/* Yesterday's Combined Value */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg p-5">
        <h2 className="text-sm opacity-90">Yesterday&apos;s Portfolio Value</h2>
        <p className="text-3xl font-bold mt-1">
          ₹{(yesterday.total || 0).toFixed(2)}
        </p>
        <p className="text-xs opacity-80 mt-1">
          Combined total of all holdings on {yesterday.date}
        </p>
      </div>

      {/* Investment Funds */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Investment Funds
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stocks.map((s) => (
            <EditableFundCard key={s._id} stock={s} />
          ))}
        </div>
      </section>

      {/* Tracked Funds */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Tracked Funds
        </h2>

        {stocks.length === 0 ? (
          <p className="text-gray-500 text-sm">No Funds added yet.</p>
        ) : (
          <div className="grid gap-3">
            {stocks.map((s) => {
              const id = s._id;
              const latest = latestMap.get(id);
              const prev = prevMap.get(id);

              const latestPrice = latest ? Number(latest.unitPrice) : null;
              const prevPrice = prev ? Number(prev.unitPrice) : null;

              const diff =
                latestPrice != null && prevPrice != null
                  ? latestPrice - prevPrice
                  : null;
              const pct =
                diff != null && prevPrice > 0
                  ? (diff / prevPrice) * 100
                  : null;

              let trendIcon = <Minus size={18} className="text-gray-500" />;
              let trendText = <span className="text-gray-600">—</span>;

              if (diff != null) {
                if (diff > 0) {
                  trendIcon = (
                    <ArrowUpRight size={18} className="text-green-600" />
                  );
                  trendText = (
                    <span className="text-green-700 font-medium">
                      +₹{diff.toFixed(2)} {pct ? `(${pct.toFixed(2)}%)` : ""}
                    </span>
                  );
                } else if (diff < 0) {
                  trendIcon = (
                    <ArrowDownRight size={18} className="text-red-600" />
                  );
                  trendText = (
                    <span className="text-red-700 font-medium">
                      ₹{diff.toFixed(2)} {pct ? `(${pct.toFixed(2)}%)` : ""}
                    </span>
                  );
                }
              }

              return (
                <div
                  key={id}
                  className="bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.symbol}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500">Units</p>
                      <p className="text-base font-semibold text-gray-900">
                        {s.units ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">
                        Latest unit price
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {latestPrice != null
                          ? `₹${latestPrice.toFixed(4)}`
                          : "—"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {latest ? `${latest.date}` : "No entries yet"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {trendIcon}
                      {trendText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * EditableFundCard Component
 */
function EditableFundCard({ stock }) {
  const { updateStockUnits } = useContext(AppContext);
  const [isEditing, setIsEditing] = useState(false);
  const [units, setUnits] = useState(stock.units || 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateStockUnits(stock._id, Number(units));
    setSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-800">{stock.name}</h3>
          <p className="text-sm text-gray-500">{stock.symbol}</p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-blue-600 text-sm font-medium hover:underline"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      <p className="text-sm text-gray-500 mt-2">
        {stock.symbol === "OF"
          ? "Aggressive fund focusing on high-growth sectors."
          : "Stable fund blending equity and fixed income for consistency."}
      </p>

      <div className="mt-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="border rounded-lg px-3 py-1 text-sm w-24"
            />
            <button
              disabled={saving}
              onClick={handleSave}
              className="bg-blue-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-blue-700 transition"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <p className="mt-1 text-gray-800">
            <span className="font-semibold">{units}</span> units
          </p>
        )}
      </div>

      <Link
        to="/analytics"
        className="text-blue-600 text-sm mt-3 inline-flex items-center font-medium"
      >
        View Insights <ArrowRight size={14} className="ml-1" />
      </Link>
    </div>
  );
}
