// Skeleton instan saat pindah menu. Layout (Sidebar/Topbar) tidak ikut
// re-render antar route, jadi hanya area konten ini yang menampilkan
// placeholder — perpindahan menu terasa cepat tanpa layar kosong.
export default function DashboardLoading() {
  return (
    <div className="sw-anim-fade space-y-4">
      {/* Judul halaman */}
      <div className="h-7 w-52 rounded-md sw-skeleton" />

      {/* Kartu statistik */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="mb-3 h-4 w-24 rounded sw-skeleton" />
            <div className="h-8 w-20 rounded sw-skeleton" />
          </div>
        ))}
      </div>

      {/* Blok tabel/konten */}
      <div className="card p-4">
        <div className="mb-4 h-5 w-40 rounded sw-skeleton" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded sw-skeleton" />
          ))}
        </div>
      </div>
    </div>
  );
}
