"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Utensils,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartPoint = { label: string; omzet: number; trx: number };
type TopItem = { name: string; qty: number };
type LowStock = {
  id: string;
  name: string;
  unit: string;
  stock_qty: number;
  min_stock: number;
};

function rupiah(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}
/** Versi ringkas untuk sumbu grafik: 1.250.000 -> 1,3jt */
function rupiahShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}rb`;
  return String(n);
}

export function DashboardClient({
  omzetToday,
  trxToday,
  avgToday,
  omzetWeek,
  openOrders,
  chart,
  topItems,
  lowStock,
}: {
  omzetToday: number;
  trxToday: number;
  avgToday: number;
  omzetWeek: number;
  openOrders: number;
  chart: ChartPoint[];
  topItems: TopItem[];
  lowStock: LowStock[];
}) {
  const stats = [
    {
      label: "Penjualan Hari Ini",
      value: rupiah(omzetToday),
      icon: TrendingUp,
      hint: `${trxToday} transaksi`,
    },
    {
      label: "Rata-rata / Transaksi",
      value: rupiah(avgToday),
      icon: Receipt,
      hint: "hari ini",
    },
    {
      label: "Penjualan 7 Hari",
      value: rupiah(omzetWeek),
      icon: TrendingUp,
      hint: "termasuk hari ini",
    },
    {
      label: "Pesanan Berjalan",
      value: String(openOrders),
      icon: ShoppingCart,
      hint: "belum dibayar",
    },
  ];

  const maxQty = topItems.length > 0 ? topItems[0].qty : 0;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">
          Ringkasan penjualan dan operasional restoran Anda
        </p>
      </div>

      {/* ── Kartu ringkasan ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, hint }) => (
          <div key={label} className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface">
                <Icon size={15} className="text-accent" />
              </span>
              <p className="text-xs text-ink-muted">{label}</p>
            </div>
            <p className="text-xl font-bold text-ink">{value}</p>
            <p className="mt-0.5 text-[11px] text-ink-muted">{hint}</p>
          </div>
        ))}
      </div>

      {/* ── Grafik penjualan ── */}
      <div className="card mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Penjualan 7 Hari</h2>
            <p className="text-xs text-ink-muted">
              Total omzet transaksi lunas per hari
            </p>
          </div>
          <Link
            href="/laporan"
            className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            Laporan <ArrowRight size={13} />
          </Link>
        </div>

        {omzetWeek === 0 ? (
          <p className="py-14 text-center text-sm text-ink-muted">
            Belum ada transaksi lunas dalam 7 hari terakhir.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chart}
                margin={{ top: 5, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="omzetFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e3a2c" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#1e3a2c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ddd3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6b6f6a" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2ddd3" }}
                />
                <YAxis
                  tickFormatter={rupiahShort}
                  tick={{ fontSize: 11, fill: "#6b6f6a" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(value: number) => [rupiah(value), "Omzet"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2ddd3",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="omzet"
                  stroke="#1e3a2c"
                  strokeWidth={2}
                  fill="url(#omzetFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* ── Menu terlaris ── */}
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Utensils size={16} className="text-accent" />
            <h2 className="text-base font-bold text-ink">
              Menu Terlaris Hari Ini
            </h2>
          </div>

          {topItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">
              Belum ada penjualan hari ini.
            </p>
          ) : (
            <div className="space-y-3">
              {topItems.map((it, i) => (
                <div key={it.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface text-[11px] font-bold text-ink-muted">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-ink">
                        {it.name}
                      </p>
                      <p className="shrink-0 text-xs font-bold text-ink-muted">
                        {it.qty} porsi
                      </p>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${maxQty > 0 ? (it.qty / maxQty) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Stok menipis ── */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-accent-warning" />
              <h2 className="text-base font-bold text-ink">Stok Menipis</h2>
            </div>
            <Link
              href="/pembelian"
              className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              Pembelian <ArrowRight size={13} />
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">
              Semua stok bahan baku aman.
            </p>
          ) : (
            <div className="divide-y divide-surface-border">
              {lowStock.slice(0, 6).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {m.name}
                    </p>
                    <p className="text-xs text-ink-muted">
                      Minimum {m.min_stock} {m.unit}
                    </p>
                  </div>
                  <span className="badge-danger shrink-0">
                    {m.stock_qty} {m.unit}
                  </span>
                </div>
              ))}
              {lowStock.length > 6 && (
                <p className="pt-2.5 text-xs text-ink-muted">
                  +{lowStock.length - 6} bahan lainnya menipis
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
