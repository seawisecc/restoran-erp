"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Order = { id: string; total: number; paid_at: string };
type OrderItem = { order_id: string; name: string; qty: number; price: number };

type FilterKey = "today" | "week" | "month" | "all";

function rupiah(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isThisWeek(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return d >= start;
}

function isThisMonth(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

const filterFns: Record<FilterKey, (iso: string) => boolean> = {
  today: isToday,
  week: isThisWeek,
  month: isThisMonth,
  all: () => true,
};

const filterLabels: Record<FilterKey, string> = {
  today: "Hari Ini",
  week: "Minggu Ini",
  month: "Bulan Ini",
  all: "Semua",
};

export function LaporanClient({
  orders,
  orderItems,
}: {
  orders: Order[];
  orderItems: OrderItem[];
}) {
  const [filter, setFilter] = useState<FilterKey>("week");

  const filteredOrders = useMemo(
    () => orders.filter((o) => filterFns[filter](o.paid_at)),
    [orders, filter],
  );

  const filteredOrderIds = useMemo(
    () => new Set(filteredOrders.map((o) => o.id)),
    [filteredOrders],
  );

  const filteredItems = useMemo(
    () => orderItems.filter((it) => filteredOrderIds.has(it.order_id)),
    [orderItems, filteredOrderIds],
  );

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const transactionCount = filteredOrders.length;
  const avgOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const it of filteredItems) {
      const existing = map.get(it.name);
      if (existing) {
        existing.qty += it.qty;
        existing.revenue += it.qty * it.price;
      } else {
        map.set(it.name, { name: it.name, qty: it.qty, revenue: it.qty * it.price });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredItems]);

  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of filteredOrders) {
      const key = new Date(o.paid_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      map.set(key, (map.get(key) ?? 0) + o.total);
    }
    return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }));
  }, [filteredOrders]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Laporan</h1>
          <p className="text-sm text-ink-muted">
            Ringkasan penjualan &middot; {filterLabels[filter]}
          </p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                filter === key
                  ? "border-accent bg-accent text-white"
                  : "border-surface-border bg-surface-card text-ink-muted"
              }`}
            >
              {filterLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-ink-muted">Total Penjualan</p>
          <p className="mt-1 text-xl font-bold text-ink">{rupiah(totalRevenue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted">Jumlah Transaksi</p>
          <p className="mt-1 text-xl font-bold text-ink">{transactionCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted">Rata-rata / Transaksi</p>
          <p className="mt-1 text-xl font-bold text-ink">{rupiah(avgOrderValue)}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold text-ink">Tren Penjualan</h3>
          {trendData.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink-muted">
              Belum ada data penjualan pada rentang ini.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e2d8" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6b6f6a" }}
                  axisLine={{ stroke: "#e6e2d8" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b6f6a" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}rb`}
                />
                <Tooltip
                  formatter={(v: number) => rupiah(v)}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e6e2d8",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="revenue" fill="#1a2420" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-ink">Menu Terlaris</h3>
          {topItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              Belum ada data.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-ink-muted">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {item.name}
                    </p>
                    <p className="text-xs text-ink-muted">{item.qty} terjual</p>
                  </div>
                  <p className="flex-shrink-0 text-sm font-bold text-ink">
                    {rupiah(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
