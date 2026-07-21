import { ImageResponse } from "next/og";

// Gambar yang muncul saat link aplikasi dibagikan (WhatsApp, Slack, X, dll).
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
          justifyContent: "space-between",
          padding: "68px 72px",
          background:
            "linear-gradient(135deg, #eef0ea 0%, #f5f3ee 55%, #f1ded0 100%)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: 22,
              background: "#1e3a2c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <svg
              width="42"
              height="42"
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
                top: 17,
                right: 17,
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
            <div style={{ fontSize: 30, fontWeight: 700, color: "#1c2620" }}>
              Seawise Enterprise Apps
            </div>
            <div style={{ fontSize: 21, color: "#7c837b" }}>
              Restaurants Edition
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 62,
              fontWeight: 700,
              color: "#1c2620",
              lineHeight: 1.12,
            }}
          >
            Restoran Anda, rapi
          </div>
          <div
            style={{
              fontSize: 62,
              fontWeight: 700,
              color: "#5f665f",
              lineHeight: 1.12,
            }}
          >
            dari dapur sampai kasir.
          </div>
        </div>

        {/* Chip fitur */}
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {chips.map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                padding: "11px 22px",
                marginRight: 12,
                marginTop: 12,
                borderRadius: 999,
                background: "#ffffff",
                border: "1px solid #e2ddd3",
                color: "#1c2620",
                fontSize: 23,
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
