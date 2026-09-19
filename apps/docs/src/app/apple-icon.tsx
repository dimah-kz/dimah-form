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
      <svg width="118" height="118" viewBox="0 0 32 32" fill="none">
        <path
          fill="#FAFAF9"
          fillRule="evenodd"
          d="M6 4h14c5.523 0 10 4.477 10 10v4c0 5.523-4.477 10-10 10H6A4 4 0 0 1 2 24V8a4 4 0 0 1 4-4zm10.5 8h5a2.5 2.5 0 0 1 2.5 2.5v3a2.5 2.5 0 0 1-2.5 2.5h-5a2.5 2.5 0 0 1-2.5-2.5v-3a2.5 2.5 0 0 1 2.5-2.5z"
        />
      </svg>
    </div>,
    {
      ...size,
    },
  );
}
