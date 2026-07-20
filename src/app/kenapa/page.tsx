import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  Check,
  ChefHat,
  Flame,
  Gift,
  LayoutDashboard,
  Package,
  QrCode,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UtensilsCrossed,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Kenapa Seawise — Restaurants Edition",
  description:
    "Kasir per meja, layar dapur real-time, QR order, stok & HPP, sampai laporan. Satu aplikasi untuk restoran Indonesia. Mulai Rp4.700 per hari.",
};

const CONTACT = "mailto:seawise.cc@gmail.com?subject=Tanya%20Seawise%20Restaurants%20Edition";

/* ────────────────────────── komponen kecil ────────────────────────── */

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e3a2c]">
        <ChefHat size={18} className="text-white" strokeWidth={1.8} />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#c2632f]" />
      </div>
      <div className="leading-tight">
        <div
          className={`text-sm font-semibold ${light ? "text-white" : "text-[#1c2620]"}`}
        >
          Seawise Enterprise
        </div>
        <div
          className={`text-[11px] ${light ? "text-white/60" : "text-[#8a8f88]"}`}
        >
          Restaurants Edition
        </div>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#c2632f]">
      {children}
    </p>
  );
}

/** Panel mockup — bingkai lembut ala device Apple. */
function Frame({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border shadow-[0_30px_70px_-35px_rgba(28,38,32,0.5)] ${
        tone === "dark"
          ? "border-white/10 bg-[#16241c]"
          : "border-[#e2ddd3] bg-white"
      }`}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────── mockups ────────────────────────────── */

function TableGridMock() {
  const tables = [
    { n: "M1", s: "12 menit lalu", busy: true },
    { n: "M2", s: "4 kursi", busy: false },
    { n: "M3", s: "31 menit lalu", busy: true },
    { n: "M4", s: "2 kursi", busy: false },
    { n: "M5", s: "6 kursi", busy: false },
    { n: "M6", s: "5 menit lalu", busy: true },
    { n: "M7", s: "4 kursi", busy: false },
    { n: "M8", s: "4 kursi", busy: false },
  ];
  return (
    <Frame>
      <div className="border-b border-[#e2ddd3] px-5 py-3.5">
        <p className="text-sm font-bold text-[#1c2620]">Pilih Meja</p>
        <p className="text-[11px] text-[#8a8f88]">8 meja · 3 sedang terisi</p>
      </div>
      <div className="grid grid-cols-4 gap-2.5 p-5">
        {tables.map((t) => (
          <div
            key={t.n}
            className={`flex aspect-square flex-col items-center justify-center rounded-2xl border text-center ${
              t.busy
                ? "border-[#b98900]/40 bg-[#fdf3d6] text-[#b98900]"
                : "border-[#e2ddd3] bg-white text-[#1c2620]"
            }`}
          >
            <span className="text-base font-bold">{t.n}</span>
            <span className="mt-0.5 text-[9px] font-medium opacity-80">
              {t.s}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function KdsMock() {
  const tickets = [
    { t: "Meja 3", i: ["2× Nasi Goreng", "1× Es Teh"], s: "Dimasak", c: "#b98900" },
    { t: "Meja 7", i: ["1× Ayam Bakar", "2× Sup Iga"], s: "Antre", c: "#6b6f6a" },
    { t: "Meja 1", i: ["3× Sate Ayam"], s: "Siap", c: "#1f8a4c" },
  ];
  return (
    <Frame tone="dark">
      <div className="border-b border-white/10 px-5 py-3.5">
        <p className="text-sm font-bold text-white">Layar Dapur</p>
        <p className="text-[11px] text-white/50">Realtime · 3 tiket aktif</p>
      </div>
      <div className="grid gap-2.5 p-5 sm:grid-cols-3">
        {tickets.map((k) => (
          <div key={k.t} className="rounded-2xl bg-white/[0.06] p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-white">{k.t}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{ backgroundColor: k.c + "26", color: k.c }}
              >
                {k.s}
              </span>
            </div>
            {k.i.map((it) => (
              <p key={it} className="text-[11px] leading-relaxed text-white/70">
                {it}
              </p>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  );
}

function QrMock() {
  return (
    <Frame>
      <div className="flex items-center gap-5 p-6">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#1e3a2c]">
          <QrCode size={44} className="text-white" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#1c2620]">Meja 5</p>
          <p className="mb-3 text-[11px] text-[#8a8f88]">
            Scan · pesan langsung dari HP tamu
          </p>
          <div className="space-y-1.5">
            {["Nasi Goreng Spesial", "Es Kopi Susu"].map((m) => (
              <div
                key={m}
                className="flex items-center justify-between rounded-lg border border-[#e2ddd3] px-2.5 py-1.5"
              >
                <span className="text-[11px] text-[#1c2620]">{m}</span>
                <span className="text-[11px] font-bold text-[#1e3a2c]">+</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function CostingMock() {
  const rows = [
    { n: "Nasi Goreng Spesial", h: "Rp 11.400", j: "Rp 28.000", m: "59%" },
    { n: "Ayam Bakar Madu", h: "Rp 17.200", j: "Rp 38.000", m: "55%" },
    { n: "Es Kopi Susu", h: "Rp 4.900", j: "Rp 18.000", m: "73%" },
  ];
  return (
    <Frame>
      <div className="grid grid-cols-4 gap-2 border-b border-[#e2ddd3] bg-[#f7f6f2] px-5 py-2.5 text-[9px] font-bold uppercase tracking-wide text-[#8a8f88]">
        <span className="col-span-2">Menu</span>
        <span>HPP</span>
        <span className="text-right">Margin</span>
      </div>
      {rows.map((r) => (
        <div
          key={r.n}
          className="grid grid-cols-4 items-center gap-2 border-b border-[#f0eee8] px-5 py-3 last:border-0"
        >
          <span className="col-span-2 truncate text-[11px] font-semibold text-[#1c2620]">
            {r.n}
          </span>
          <span className="text-[11px] text-[#8a8f88]">{r.h}</span>
          <span className="text-right text-[11px] font-bold text-[#1f8a4c]">
            {r.m}
          </span>
        </div>
      ))}
    </Frame>
  );
}

function ChargeMock() {
  return (
    <Frame>
      <div className="space-y-3 p-5">
        {[
          { l: "Pajak (PB1)", v: "10%", on: true },
          { l: "Service Charge", v: "5%", on: true },
        ].map((c) => (
          <div
            key={c.l}
            className="flex items-center justify-between rounded-xl border border-[#e2ddd3] px-4 py-3"
          >
            <div>
              <p className="text-xs font-semibold text-[#1c2620]">{c.l}</p>
              <p className="text-[10px] text-[#8a8f88]">{c.v} dari subtotal</p>
            </div>
            <span
              className={`flex h-5 w-9 items-center rounded-full p-0.5 ${
                c.on ? "justify-end bg-[#1e3a2c]" : "bg-[#d9d6cd]"
              }`}
            >
              <span className="h-4 w-4 rounded-full bg-white" />
            </span>
          </div>
        ))}
        <div className="rounded-xl bg-[#f7f6f2] p-4 text-[11px]">
          <div className="flex justify-between text-[#8a8f88]">
            <span>Subtotal</span>
            <span>Rp 120.000</span>
          </div>
          <div className="flex justify-between text-[#8a8f88]">
            <span>Service (5%)</span>
            <span>Rp 6.000</span>
          </div>
          <div className="flex justify-between text-[#8a8f88]">
            <span>Pajak (10%)</span>
            <span>Rp 12.600</span>
          </div>
          <div className="mt-1.5 flex justify-between border-t border-[#e2ddd3] pt-1.5 text-sm font-bold text-[#1c2620]">
            <span>Total</span>
            <span>Rp 138.600</span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function AccessMock() {
  const users = [
    { n: "Budi", r: "Kasir", m: "2 modul" },
    { n: "Sinta", r: "Manajer", m: "6 modul" },
    { n: "Andi", r: "Staff Dapur", m: "1 modul" },
  ];
  return (
    <Frame>
      <div className="border-b border-[#e2ddd3] px-5 py-3.5">
        <p className="text-sm font-bold text-[#1c2620]">Manajemen Pengguna</p>
        <p className="text-[11px] text-[#8a8f88]">Hak akses per modul</p>
      </div>
      {users.map((u) => (
        <div
          key={u.n}
          className="flex items-center justify-between border-b border-[#f0eee8] px-5 py-3 last:border-0"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1e3a2c] text-[10px] font-bold text-white">
              {u.n.charAt(0)}
            </span>
            <div>
              <p className="text-[11px] font-semibold text-[#1c2620]">{u.n}</p>
              <p className="text-[10px] text-[#8a8f88]">{u.r}</p>
            </div>
          </div>
          <span className="rounded-full bg-[#e3f6e9] px-2.5 py-0.5 text-[10px] font-bold text-[#1f8a4c]">
            {u.m}
          </span>
        </div>
      ))}
    </Frame>
  );
}

/* ─────────────────────────── seksi fitur ─────────────────────────── */

function FeatureSection({
  eyebrow,
  title,
  body,
  mock,
  reverse = false,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  body: string;
  mock: React.ReactNode;
  reverse?: boolean;
  tone?: "light" | "cream";
}) {
  return (
    <section
      className={tone === "cream" ? "bg-[#f5f3ee]" : "bg-white"}
    >
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className={reverse ? "md:order-2" : ""}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h3 className="text-3xl font-semibold leading-[1.15] tracking-tight text-[#1c2620] md:text-4xl">
              {title}
            </h3>
            <p className="mt-5 text-base leading-relaxed text-[#5f665f] md:text-lg">
              {body}
            </p>
          </div>
          <div className={reverse ? "md:order-1" : ""}>{mock}</div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── halaman ──────────────────────────── */

export default function KenapaPage() {
  const grid = [
    { icon: LayoutDashboard, t: "Dashboard", d: "Omzet, transaksi, dan menu terlaris hari ini." },
    { icon: ShoppingCart, t: "Kasir per Meja", d: "Denah meja, buka order sekali ketuk." },
    { icon: Flame, t: "Layar Dapur (KDS)", d: "Tiket masuk real-time, status per item." },
    { icon: QrCode, t: "QR Order Meja", d: "Tamu pesan sendiri dari HP-nya." },
    { icon: UtensilsCrossed, t: "Menu & Kategori", d: "Katalog menu, harga, aktif/nonaktif." },
    { icon: Package, t: "Stok & HPP", d: "Resep bahan baku, modal per porsi otomatis." },
    { icon: Truck, t: "Pembelian & Supplier", d: "PO bahan, penerimaan, harga rata-rata." },
    { icon: Gift, t: "Loyalty Poin", d: "Poin didapat & ditukar, rate diatur sendiri." },
    { icon: Receipt, t: "Pajak & Service", d: "Nyalakan/matikan, atur persentasenya." },
    { icon: BarChart3, t: "Laporan", d: "Penjualan & riwayat transaksi per periode." },
    { icon: Building2, t: "Multi-Outlet", d: "Banyak cabang dalam satu akun." },
    { icon: Users, t: "Pengguna & Hak Akses", d: "Pilih modul yang boleh dibuka tiap staf." },
  ];

  const included = [
    "Semua fitur — tanpa batasan transaksi",
    "Multi-outlet & multi-pengguna",
    "Layar dapur real-time & QR order",
    "Laporan penjualan & riwayat lengkap",
    "Data tiap restoran terisolasi & aman",
    "Pendampingan aktivasi + update berkelanjutan",
  ];

  return (
    <div className="bg-white font-sans text-[#1c2620]">
      {/* ───────── Nav ───────── */}
      <header className="sticky top-0 z-50 border-b border-[#e8e5dd]/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-[#5f665f] md:flex">
            <a href="#fitur" className="transition-colors hover:text-[#1c2620]">
              Fitur
            </a>
            <a href="#harga" className="transition-colors hover:text-[#1c2620]">
              Harga
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#1c2620] transition-colors hover:bg-[#f0eee8] sm:block"
            >
              Masuk
            </Link>
            <a
              href={CONTACT}
              className="rounded-full bg-[#1e3a2c] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#16281f]"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 480px at 12% -12%, #dde7d7 0%, rgba(221,231,215,0) 58%)," +
              "radial-gradient(820px 460px at 100% -6%, #f3e0d2 0%, rgba(243,224,210,0) 55%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-20 text-center md:pb-24 md:pt-28">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#c2632f]">
            Sistem Manajemen Restoran
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-[#1c2620] sm:text-5xl md:text-6xl">
            Restoran Anda,
            <br />
            <span className="text-[#5f665f]">rapi dari dapur sampai kasir.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#5f665f] md:text-lg">
            Kasir per meja yang instan, layar dapur real-time, QR order, stok &amp;
            HPP per porsi, sampai laporan — semuanya dalam satu aplikasi yang
            dirancang khusus untuk restoran Indonesia.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href={CONTACT}
              className="rounded-full bg-[#1e3a2c] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#16281f]"
            >
              Hubungi Kami
            </a>
            <a
              href="#harga"
              className="rounded-full border border-[#d5d0c4] px-7 py-3.5 text-sm font-semibold text-[#1c2620] transition-colors hover:bg-[#f0eee8]"
            >
              Lihat Harga
            </a>
          </div>
          <p className="mt-5 text-xs text-[#8a8f88]">
            Mulai Rp4.700 per hari · aktivasi dibantu tim Seawise
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl px-6 pb-20 md:pb-28">
          <TableGridMock />
        </div>
      </section>

      {/* ───────── Masalah ───────── */}
      <section className="border-y border-[#e8e5dd] bg-[#f5f3ee]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[#1c2620] md:text-4xl">
              Mengelola restoran nggak harus ribet.
            </h2>
            <p className="mt-4 text-base text-[#5f665f]">
              Kebocoran kecil yang diam-diam menggerus margin — dan bikin pusing
              saat tutup buku.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                t: "Pesanan tercecer ke dapur",
                d: "Catatan kertas hilang, pesanan telat atau salah antar. Tamu menunggu, dapur ikut panik.",
              },
              {
                t: "Modal per porsi tak terpantau",
                d: "Harga bahan naik pelan-pelan tanpa terasa. Menu terlihat laris, padahal margin tipis.",
              },
              {
                t: "Rekap manual tiap tutup",
                d: "Omzet, stok, dan hutang supplier ada di tempat berbeda. Rekap makan waktu, rawan salah.",
              },
            ].map((p) => (
              <div
                key={p.t}
                className="rounded-2xl border border-[#e2ddd3] bg-white p-7"
              >
                <h3 className="mb-2.5 text-base font-semibold text-[#1c2620]">
                  {p.t}
                </h3>
                <p className="text-sm leading-relaxed text-[#5f665f]">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Deep dive fitur ───────── */}
      <div id="fitur" className="scroll-mt-20">
        <FeatureSection
          eyebrow="Kasir per Meja"
          title="Satu ketukan, langsung jalan."
          body="Denah meja terlihat jelas — mana yang kosong, mana yang terisi dan sudah berapa lama. Ketuk meja, layar menu terbuka seketika tanpa loading. Tambah item langsung terasa responsif, dan tombol bayar selalu siap diklik. Dibangun agar kasir tetap cepat bahkan di jam sibuk."
          mock={<TableGridMock />}
        />
        <FeatureSection
          eyebrow="Layar Dapur (KDS)"
          title="Dapur tahu lebih dulu."
          body="Setiap pesanan langsung muncul di layar dapur secara real-time, lengkap dengan nomor meja dan statusnya: antre, dimasak, siap. Tidak ada lagi kertas hilang atau teriak-teriak antar ruangan. Pramusaji cukup lihat layar untuk tahu mana yang siap diantar."
          mock={<KdsMock />}
          reverse
          tone="cream"
        />
        <FeatureSection
          eyebrow="QR Order Meja"
          title="Tamu pesan dari mejanya sendiri."
          body="Cetak QR untuk tiap meja langsung dari aplikasi. Tamu scan, lihat menu, lalu memesan dari HP mereka — pesanan masuk ke kasir dan dapur tanpa perlu dicatat ulang. Antrean di kasir berkurang, salah catat pesanan nyaris hilang."
          mock={<QrMock />}
        />
        <FeatureSection
          eyebrow="Stok & HPP"
          title="Tahu untung di tiap piring."
          body="Susun resep bahan baku untuk tiap menu, dan sistem menghitung modal per porsi secara otomatis. Harga bahan diperbarui sendiri mengikuti pembelian terakhir dengan rata-rata tertimbang — jadi margin yang Anda lihat selalu mencerminkan harga hari ini, bukan tebakan."
          mock={<CostingMock />}
          reverse
          tone="cream"
        />
        <FeatureSection
          eyebrow="Pajak & Service"
          title="Aturannya, Anda yang tentukan."
          body="Setiap restoran berbeda. Nyalakan atau matikan pajak dan service charge sesuai kebutuhan, lalu atur persentasenya sendiri. Perhitungan langsung mengikuti di layar kasir dan tercatat rapi di setiap transaksi."
          mock={<ChargeMock />}
        />
        <FeatureSection
          eyebrow="Multi-Outlet & Hak Akses"
          title="Banyak cabang, satu kendali."
          body="Kelola beberapa outlet dalam satu akun dan berpindah cabang dalam sekali klik. Tambahkan anggota tim, lalu pilih modul apa saja yang boleh mereka buka — kasir cukup melihat transaksi, manajer melihat semuanya. Data tiap restoran terisolasi di level database."
          mock={<AccessMock />}
          reverse
          tone="cream"
        />
      </div>

      {/* ───────── Grid fitur ───────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[#1c2620] md:text-4xl">
              Semua yang restoran Anda butuhkan.
            </h2>
            <p className="mt-4 text-base text-[#5f665f]">
              Satu langganan, seluruh operasional tercakup.
            </p>
          </div>
          <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map(({ icon: Icon, t, d }) => (
              <div key={t}>
                <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0eee8]">
                  <Icon size={19} className="text-[#1e3a2c]" strokeWidth={1.8} />
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-[#1c2620]">
                  {t}
                </h3>
                <p className="text-sm leading-relaxed text-[#5f665f]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Harga ───────── */}
      <section id="harga" className="scroll-mt-20 border-y border-[#e8e5dd] bg-[#f5f3ee]">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Harga</Eyebrow>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight text-[#1c2620] md:text-5xl">
              Hanya Rp4.700 per hari.
            </h2>
            <p className="mt-4 text-base text-[#5f665f]">
              Lebih murah dari satu porsi makan — untuk sistem yang menjaga
              seluruh operasional restoran Anda.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {/* Bulanan */}
            <div className="rounded-3xl border border-[#e2ddd3] bg-white p-8">
              <p className="text-sm font-semibold text-[#8a8f88]">Bulanan</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#1c2620]">
                Rp170.000
                <span className="text-base font-normal text-[#8a8f88]">
                  /bulan
                </span>
              </p>
              <p className="mt-3 text-sm text-[#5f665f]">
                Fleksibel, bisa berhenti kapan saja.
              </p>
            </div>

            {/* Tahunan */}
            <div className="relative rounded-3xl border-2 border-[#1e3a2c] bg-white p-8">
              <span className="absolute -top-3 left-8 rounded-full bg-[#c2632f] px-3 py-1 text-[11px] font-bold text-white">
                Hemat 2 bulan
              </span>
              <p className="text-sm font-semibold text-[#1e3a2c]">Tahunan</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#1c2620]">
                Rp1.700.000
                <span className="text-base font-normal text-[#8a8f88]">
                  /tahun
                </span>
              </p>
              <p className="mt-3 text-sm text-[#5f665f]">
                Setara Rp4.700/hari — gratis 2 bulan, hemat Rp340.000 dibanding
                bayar bulanan.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-[#e2ddd3] bg-white p-8">
            <div className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {included.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#e3f6e9]">
                    <Check size={11} className="text-[#1f8a4c]" strokeWidth={3} />
                  </span>
                  <span className="text-sm text-[#3f463f]">{f}</span>
                </div>
              ))}
            </div>
            <a
              href={CONTACT}
              className="mt-8 block rounded-full bg-[#1e3a2c] px-6 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#16281f]"
            >
              Hubungi Kami untuk Mulai
            </a>
          </div>
        </div>
      </section>

      {/* ───────── CTA akhir ───────── */}
      <section className="bg-[#16241c]">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
            Siap membuat restoran lebih tenang?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/60">
            Ceritakan kebutuhan restoran Anda — tim Seawise membantu dari
            aktivasi sampai siap dipakai tim di lapangan.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href={CONTACT}
              className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#16241c] transition-colors hover:bg-white/90"
            >
              Hubungi Kami
            </a>
            <Link
              href="/login"
              className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Masuk ke Aplikasi
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="bg-[#16241c] pb-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 border-t border-white/10 px-6 pt-10 sm:flex-row sm:justify-between">
          <Logo light />
          <div className="flex items-center gap-2 text-xs text-white/40">
            <ShieldCheck size={13} />
            <span>© 2026 Seawise Creative · Restaurants Edition</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
