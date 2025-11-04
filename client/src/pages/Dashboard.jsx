import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  TrendingUp,
  Clock,
  BarChart2,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

export default function Dashboard() {
  const { stocks, entries } = useContext(AppContext);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchAllData(); // refresh from backend
      toast.success("Data refreshed successfully!", { autoClose: 1000 });
    } catch (err) {
      toast.error("Refresh failed!");
      console.error("Refresh failed:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 800); // small visual delay
    }
  };

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Build quick lookup maps for latest entry and previous day's close per stock
  const { latestMap, prevCloseMap } = useMemo(() => {
    const byStock = new Map(); // stockId -> entries[]
    for (const e of entries) {
      const id = e.stockId?._id || e.stockId; // tolerate either populated or raw id
      if (!id) continue;
      if (!byStock.has(id)) byStock.set(id, []);
      byStock.get(id).push(e);
    }

    // sort each list by date asc then createdAt asc to easily pick last
    for (const [id, arr] of byStock) {
      arr.sort((a, b) => {
        if (a.date === b.date) {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        return a.date.localeCompare(b.date);
      });
    }

    const latestMap = new Map();
    const prevCloseMap = new Map();

    for (const [id, arr] of byStock) {
      // latest = last entry in its list
      latestMap.set(id, arr[arr.length - 1]);

      // find previous day's close: walk from end, find first 'close' whose date < latest.date
      const latestDate = arr[arr.length - 1]?.date;
      let prevClose = null;
      for (let i = arr.length - 2; i >= 0; i--) {
        if (arr[i].type === "close" && arr[i].date < latestDate) {
          prevClose = arr[i];
          break;
        }
      }
      // if none found, fallback to any earlier entry (best-effort baseline)
      if (!prevClose) {
        for (let i = arr.length - 2; i >= 0; i--) {
          if (arr[i].date < latestDate) {
            prevClose = arr[i];
            break;
          }
        }
      }
      if (prevClose) prevCloseMap.set(id, prevClose);
    }

    return { latestMap, prevCloseMap };
  }, [entries]);

  // Yesterday’s combined total (sum of yesterday's "close" totals across all stocks)
  const yesterday = useMemo(() => {
    const todayDate = new Date();
    const yDate = new Date(todayDate.setDate(todayDate.getDate() - 1))
      .toISOString()
      .slice(0, 10);

    const yesterdayEntries = entries.filter(
      (e) => e.date === yDate && e.type === "close"
    );

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
    <h1 className="text-2xl font-bold text-gray-900">Hello, Athithan 👋</h1>
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
        <p className="text-3xl font-bold mt-1">₹{(yesterday.total || 0).toFixed(2)}</p>
        <p className="text-xs opacity-80 mt-1">
          Combined total of all stock holdings on {yesterday.date}
        </p>
      </div>

      {/* Investment Funds */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Investment Funds</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Opportunities Fund */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Opportunities Fund</h3>
              <BarChart2 className="text-blue-500" size={20} />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Aggressive fund focusing on high-growth sectors.
            </p>
            <Link
              to="/analytics"
              className="text-blue-600 text-sm mt-3 inline-flex items-center font-medium"
            >
              View Insights <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>

          {/* Balanced Fund */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Balanced Fund</h3>
              <BarChart2 className="text-green-500" size={20} />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Stable fund blending equity and fixed income for consistency.
            </p>
            <Link
              to="/analytics"
              className="text-green-600 text-sm mt-3 inline-flex items-center font-medium"
            >
              View Insights <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tracked Funds */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Tracked Funds</h2>
        {stocks.length === 0 ? (
          <p className="text-gray-500 text-sm">No Funds added yet.</p>
        ) : (
          <div className="grid gap-3">
            {stocks.map((s) => {
              const id = s._id;
              const latest = latestMap.get(id);
              const prev = prevCloseMap.get(id);

              const latestPrice = latest ? Number(latest.unitPrice) : null;
              const prevPrice = prev ? Number(prev.unitPrice) : null;
              const diff = (latestPrice != null && prevPrice != null)
                ? latestPrice - prevPrice
                : null;
              const pct = (diff != null && prevPrice > 0)
                ? (diff / prevPrice) * 100
                : null;

              const UpIcon = ArrowUpRight;
              const DownIcon = ArrowDownRight;

              let trendIcon = <Minus size={18} className="text-gray-500" />;
              let trendText = <span className="text-gray-600">—</span>;
              if (diff != null) {
                if (diff > 0) {
                  trendIcon = <UpIcon size={18} className="text-green-600" />;
                  trendText = (
                    <span className="text-green-700 font-medium">
                      +₹{diff.toFixed(2)} {pct != null ? `(${pct.toFixed(2)}%)` : ""}
                    </span>
                  );
                } else if (diff < 0) {
                  trendIcon = <DownIcon size={18} className="text-red-600" />;
                  trendText = (
                    <span className="text-red-700 font-medium">
                      ₹{diff.toFixed(2)} {pct != null ? `(${pct.toFixed(2)}%)` : ""}
                    </span>
                  );
                }
              }

              return (
                <div
                  key={s._id}
                  className="bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.symbol}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500">Units</p>
                      <p className="text-base font-semibold text-gray-900">{s.units ?? 0}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Latest unit price</p>
                      <p className="text-lg font-bold text-gray-900">
                        {latestPrice != null ? `₹${latestPrice.toFixed(4)}` : "—"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {latest ? `${latest.date} • ${latest.type}` : "No entries yet"}
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
