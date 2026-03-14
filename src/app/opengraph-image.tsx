import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Stalk.ai – Monitor Everything, Miss Nothing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #07070f 0%, #0d0d1a 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Logo square */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            marginRight: 48,
            flexShrink: 0,
          }}
        >
          {/* Eye SVG */}
          <svg
            width="72"
            height="72"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 32 C18 18, 46 18, 54 32 C46 46, 18 46, 10 32 Z"
              fill="none"
              stroke="white"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="32" r="8" fill="white" />
            <circle cx="32" cy="32" r="4.5" fill="#6d28d9" />
          </svg>
        </div>

        {/* Text */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{ fontSize: 80, fontWeight: 800, color: "white", lineHeight: 1 }}
            >
              Stalk
            </span>
            <span
              style={{ fontSize: 80, fontWeight: 800, color: "#7c3aed", lineHeight: 1 }}
            >
              .ai
            </span>
          </div>
          <span
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.55)",
              marginTop: 12,
              maxWidth: 560,
              lineHeight: 1.3,
            }}
          >
            Monitor Everything, Miss Nothing
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
