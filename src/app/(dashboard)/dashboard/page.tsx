export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Ringkasan penjualan dan operasional hari ini
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Penjualan Hari Ini", value: "Rp 0" },
          { label: "Transaksi", value: "0" },
          { label: "Menu Terlaris", value: "-" },
          { label: "Stok Menipis", value: "0 item" },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="text-xs text-ink-muted">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
