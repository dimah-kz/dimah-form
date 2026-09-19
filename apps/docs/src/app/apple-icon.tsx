import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0A0A0A",
      }}
    >
      <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
        <rect x="14" y="4.5" width="13" height="13" rx="3.25" fill="#FAFAF9" />
        <path
          d="M8.5 16.25V24.5H17"
          stroke="#FAFAF9"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    {
      ...size,
    },
  );
}
