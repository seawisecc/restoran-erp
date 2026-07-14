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
import { BarChart3, ChefHat } from "lucide-react";

type Order = { id: string; total: number; paid_at: string };
type OrderItem = {
  order_id: string;
  menu_item_id: string | null;
  name: string;
  qty: number;
  price: number;
};
type RecipeLine = { qty_used: number; raw_materials: { cost_price: number } | null };
type MenuItemCosting = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  menu_item_recipes: RecipeLine[];
};

type FilterKey = "today" | "week" | "month" | "all";
type Tab = "ringkasan" | "costing";

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
  menuItems,
}: {
  orders: Order[];
  orderItems: OrderItem[];
  menuItems: MenuItemCosting[];
}) {
  const [tab, setTab] = useState<Tab>("ringkasan");
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

  // ===== Costing per produk =====
  const soldQtyByMenuId = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of filteredItems) {
      if (!it.menu_item_id) continue;
      map.set(it.menu_item_id, (map.get(it.menu_item_id) ?? 0) + it.qty);
    }
    return map;
  }, [filteredItems]);

  const costingRows = useMemo(() => {
    return menuItems.map((item) => {
      const hpp = item.menu_item_recipes.reduce(
        (sum, r) => sum + r.qty_used * (r.raw_materials?.cost_price ?? 0),
        0,
      );
      const margin = item.price - hpp;
      const marginPct = item.price > 0 ? (margin / item.price) * 100 : 0;
      const qtySold = soldQtyByMenuId.get(item.id) ?? 0;
      const hasRecipe = item.menu_item_recipes.length > 0;
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        hpp,
        margin,
        marginPct,
        qtySold,
        totalMargin: margin * qtySold,
        hasRecipe,
      };
    });
  }, [menuItems, soldQtyByMenuId]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Laporan</h1>
          <p className="text-sm text-ink-muted">
            {tab === "ringkasan"
              ? `Ringkasan penjualan · ${filterLabels[filter]}`
              : `Costing & margin per produk · ${filterLabels[filter]}`}
          </p>
        </div>
        {tab === "ringkasan" && (
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
        )}
      </div>

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab("ringkasan")}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold ${
            tab === "ringkasan"
              ? "border-accent bg-accent text-white"
              : "border-surface-border bg-surface-card text-ink-muted"
          }`}
        >
          <BarChart3 size={14} /> Ringkasan
        </button>
        <button
          onClick={() => setTab("costing")}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold ${
            tab === "costing"
              ? "border-accent bg-accent text-white"
              : "border-surface-border bg-surface-card text-ink-muted"
          }`}
        >
          <ChefHat size={14} /> Costing per Produk
        </button>
      </div>

      {tab === "ringkasan" ? (
        <>
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
        </>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-12 gap-2 border-b border-surface-border bg-surface px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
            <div className="col-span-4">Menu</div>
            <div className="col-span-2 text-right">HPP</div>
            <div className="col-span-2 text-right">Harga Jual</div>
            <div className="col-span-2 text-right">Margin</div>
            <div className="col-span-2 text-right">Terjual</div>
          </div>
          {costingRows.length === 0 ? (
            <p className="p-10 text-center text-sm text-ink-muted">
              Belum ada menu aktif.
            </p>
          ) : (
            costingRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-12 gap-2 border-b border-surface-border px-4 py-3 text-sm last:border-b-0"
              >
                <div className="col-span-4">
                  <p className="font-semibold text-ink">{row.name}</p>
                  {!row.hasRecipe && (
                    <p className="text-[10px] text-ink-muted">
                      Resep belum diisi
                    </p>
                  )}
                </div>
                <div className="col-span-2 text-right text-ink-muted">
                  {rupiah(row.hpp)}
                </div>
                <div className="col-span-2 text-right text-ink-muted">
                  {rupiah(row.price)}
                </div>
                <div
                  className={`col-span-2 text-right font-semibold ${
                    row.margin >= 0 ? "text-accent-success" : "text-accent-danger"
                  }`}
                >
                  {rupiah(row.margin)}
                  <span className="block text-[10px] font-normal">
                    {row.marginPct.toFixed(0)}%
                  </span>
                </div>
                <div className="col-span-2 text-right text-ink-muted">
                  {row.qtySold}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
