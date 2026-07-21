import { ImageResponse } from "next/og";

// Preview khusus halaman penawaran — memakai pengait harga karena
// halaman ini yang paling sering dibagikan ke calon klien.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Seawise Restaurants Edition — sistem operasional restoran mulai Rp4.700 per hari";

export default function KenapaOpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 72px",
          background:
            "linear-gradient(135deg, #16241c 0%, #1e3a2c 58%, #3c3524 100%)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: 21,
              background: "rgba(255,255,255,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              <path d="M6 17h12" />
            </svg>
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 12,
                height: 12,
                borderRadius: 6,
                background: "#c2632f",
                display: "flex",
              }}
            />
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", marginLeft: 20 }}
          >
            <div style={{ fontSize: 29, fontWeight: 700, color: "#ffffff" }}>
              Seawise Enterprise Apps
            </div>
            <div style={{ fontSize: 20, color: "rgba(255,255,255,0.55)" }}>
              Restaurants Edition
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 30,
              color: "#e0a878",
              letterSpacing: 2,
              marginBottom: 14,
            }}
          >
            SISTEM MANAJEMEN RESTORAN
          </div>
          <div
            style={{
              fontSize: 66,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            Hanya Rp4.700 per hari.
          </div>
          <div
            style={{
              fontSize: 30,
              color: "rgba(255,255,255,0.62)",
              marginTop: 18,
              lineHeight: 1.35,
            }}
          >
            Kasir per meja, layar dapur real-time, QR order,
          </div>
          <div
            style={{
              fontSize: 30,
              color: "rgba(255,255,255,0.62)",
              lineHeight: 1.35,
            }}
          >
            HPP per porsi, sampai laporan — satu platform.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              padding: "14px 30px",
              borderRadius: 999,
              background: "#ffffff",
              color: "#16241c",
              fontSize: 25,
              fontWeight: 700,
            }}
          >
            Lihat detail fitur
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 20,
              fontSize: 23,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Gratis 2 bulan untuk paket tahunan
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
