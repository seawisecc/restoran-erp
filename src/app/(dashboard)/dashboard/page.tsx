import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/get-active-company";
import { startOfDayWib } from "@/lib/queue";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

/** Awal hari WIB, n hari ke belakang (n=0 berarti hari ini). */
function startOfDayWibOffset(daysAgo: number): string {
  const base = new Date(startOfDayWib()).getTime();
  return new Date(base - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

/** Label tanggal untuk sumbu grafik, mis. "21 Jul". */
function labelWib(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const companyId = await getActiveCompanyId();

  const todayStart = startOfDayWib();
  const weekStart = startOfDayWibOffset(6); // 7 hari termasuk hari ini

  const [
    { data: weekOrders },
    { data: todayOrders },
    { data: materials },
    { data: openOrders },
  ] = await Promise.all([
    // Transaksi lunas 7 hari terakhir — dipakai untuk grafik & ringkasan.
    supabase
      .from("orders")
      .select("id, total, paid_at")
      .eq("company_id", companyId)
      .eq("status", "paid")
      .gte("paid_at", weekStart)
      .order("paid_at", { ascending: true }),
    // Item terjual hari ini untuk menghitung menu terlaris.
    supabase
      .from("orders")
      .select("id, order_items(name, qty)")
      .eq("company_id", companyId)
      .eq("status", "paid")
      .gte("paid_at", todayStart),
    supabase
      .from("raw_materials")
      .select("id, name, unit, stock_qty, min_stock")
      .eq("company_id", companyId),
    supabase
      .from("orders")
      .select("id")
      .eq("company_id", companyId)
      .eq("status", "open"),
  ]);

  // ── Ringkasan hari ini ──
  const paidToday = (weekOrders ?? []).filter(
    (o) => o.paid_at && o.paid_at >= todayStart,
  );
  const omzetToday = paidToday.reduce((s, o) => s + Number(o.total), 0);
  const trxToday = paidToday.length;
  const avgToday = trxToday > 0 ? Math.round(omzetToday / trxToday) : 0;

  // ── Grafik 7 hari ──
  const chart: { label: string; omzet: number; trx: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const from = startOfDayWibOffset(i);
    const to = startOfDayWibOffset(i - 1);
    const inRange = (weekOrders ?? []).filter(
      (o) => o.paid_at && o.paid_at >= from && o.paid_at < to,
    );
    chart.push({
      label: labelWib(from),
      omzet: inRange.reduce((s, o) => s + Number(o.total), 0),
      trx: inRange.length,
    });
  }
  const omzetWeek = chart.reduce((s, b) => s + b.omzet, 0);

  // ── Menu terlaris hari ini ──
  const qtyByName = new Map<string, number>();
  for (const order of todayOrders ?? []) {
    for (const it of order.order_items ?? []) {
      qtyByName.set(it.name, (qtyByName.get(it.name) ?? 0) + Number(it.qty));
    }
  }
  const topItems = [...qtyByName.entries()]
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // ── Stok bahan menipis ──
  const lowStock = (materials ?? [])
    .filter(
      (m) => Number(m.min_stock) > 0 && Number(m.stock_qty) <= Number(m.min_stock),
    )
    .map((m) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      stock_qty: Number(m.stock_qty),
      min_stock: Number(m.min_stock),
    }));

  return (
    <DashboardClient
      omzetToday={omzetToday}
      trxToday={trxToday}
      avgToday={avgToday}
      omzetWeek={omzetWeek}
      openOrders={(openOrders ?? []).length}
      chart={chart}
      topItems={topItems}
      lowStock={lowStock}
    />
  );
}
