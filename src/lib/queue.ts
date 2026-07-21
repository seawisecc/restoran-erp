/**
 * Format nomor antrian take away: 1 -> "A001", 25 -> "A025".
 * Nomornya terus berlanjut sepanjang hari (tidak reset per pelanggan
 * dan tidak reset setelah dibayar) — baru mulai lagi dari 1 saat ganti
 * hari, supaya dalam satu hari tidak ada nomor kembar.
 */
export function formatQueue(n: number | null | undefined): string {
  if (n == null) return "—";
  return `A${String(n).padStart(3, "0")}`;
}

/**
 * Awal hari menurut kalender WIB (UTC+7), dikembalikan sebagai instant
 * UTC. Dipakai untuk reset nomor antrian & menyaring antrian dapur —
 * kalau memakai tengah malam UTC, pergantian hari jatuh pukul 07:00 WIB.
 */
export function startOfDayWib(): string {
  const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const midnightWibAsUtc = Date.UTC(
    nowWib.getUTCFullYear(),
    nowWib.getUTCMonth(),
    nowWib.getUTCDate(),
  );
  return new Date(midnightWibAsUtc - 7 * 60 * 60 * 1000).toISOString();
}
