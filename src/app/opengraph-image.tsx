import { ImageResponse } from "next/og";

// Gambar yang muncul saat link aplikasi dibagikan (WhatsApp, Slack, X, dll).
// Gaya diselaraskan dengan Pharmacy Store Edition: latar hijau gelap,
// logo di atas, headline besar, deskripsi, lalu chip fitur.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Seawise Enterprise Apps — Restaurants Edition";

export default function OpengraphImage() {
  const chips = [
    "Kasir per Meja",
    "Layar Dapur",
    "QR Order",
    "HPP per Porsi",
    "Multi-Outlet",
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "62px 66px",
          background:
            "linear-gradient(135deg, #16241c 0%, #1e3a2c 48%, #4a3f2a 100%)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 17,
              background: "rgba(255,255,255,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <svg
              width="34"
              height="34"
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
                top: 13,
                right: 13,
                width: 11,
                height: 11,
                borderRadius: 6,
                background: "#c2632f",
                display: "flex",
              }}
            />
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", marginLeft: 18 }}
          >
            <div style={{ fontSize: 27, fontWeight: 700, color: "#ffffff" }}>
              Seawise Enterprise Apps
            </div>
            <div style={{ fontSize: 19, color: "rgba(255,255,255,0.55)" }}>
              Restaurants Edition
            </div>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 58,
          }}
        >
          <div
            style={{
              fontSize: 66,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.12,
            }}
          >
            Restoran Anda, rapi dari
          </div>
          <div
            style={{
              fontSize: 66,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.12,
            }}
          >
            dapur sampai kasir.
          </div>
        </div>

        {/* Deskripsi */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 22,
          }}
        >
          <div
            style={{
              fontSize: 25,
              color: "rgba(255,255,255,0.62)",
              lineHeight: 1.4,
            }}
          >
            Kasir per meja, layar dapur real-time, QR order, stok &amp; HPP per
          </div>
          <div
            style={{
              fontSize: 25,
              color: "rgba(255,255,255,0.62)",
              lineHeight: 1.4,
            }}
          >
            porsi, hingga laporan — dalam satu aplikasi.
          </div>
        </div>

        {/* Chip fitur */}
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 34 }}>
          {chips.map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                padding: "10px 21px",
                marginRight: 11,
                marginTop: 11,
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.16)",
                color: "rgba(255,255,255,0.86)",
                fontSize: 22,
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
