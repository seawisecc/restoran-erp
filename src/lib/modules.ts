// Daftar modul aplikasi = menu yang bisa diberi/dicabut aksesnya per
// pengguna. `key` harus sama dengan segmen route menu (href tanpa "/").
export const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "produk-stok", label: "Menu & Stok" },
  { key: "transaksi", label: "Transaksi" },
  { key: "dapur", label: "Dapur" },
  { key: "pelanggan", label: "Pelanggan" },
  { key: "pembelian", label: "Pembelian" },
  { key: "supplier", label: "Supplier" },
  { key: "laporan", label: "Laporan" },
  { key: "pengaturan", label: "Pengaturan" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

/**
 * `modules` null/undefined = akses penuh (dipakai untuk owner).
 * Kalau berupa array, user cuma boleh modul yang ada di dalamnya.
 */
export function canAccessModule(
  modules: string[] | null | undefined,
  key: string,
): boolean {
  if (modules == null) return true;
  return modules.includes(key);
}
