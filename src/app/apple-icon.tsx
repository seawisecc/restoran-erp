import { ImageResponse } from "next/og";

// Ikon untuk "Add to Home Screen" di iOS/iPadOS.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1e3a2c",
          position: "relative",
        }}
      >
        <svg
          width="104"
          height="104"
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
            top: 36,
            right: 36,
            width: 18,
            height: 18,
            borderRadius: 9,
            background: "#c2632f",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
