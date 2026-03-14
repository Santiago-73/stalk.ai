import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          borderRadius: 7,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 32 C18 18, 46 18, 54 32 C46 46, 18 46, 10 32 Z"
            fill="none"
            stroke="white"
            stroke-width="3.5"
            stroke-linejoin="round"
          />
          <circle cx="32" cy="32" r="8" fill="white" />
          <circle cx="32" cy="32" r="4.5" fill="#6d28d9" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
