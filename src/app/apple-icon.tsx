import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

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
          backgroundColor: "#0F172A",
        }}
      >
        {/* Losango em CSS — ver lib/og-image.tsx para o porquê de não usar "◈". */}
        <div
          style={{
            display: "flex",
            width: 76,
            height: 76,
            transform: "rotate(45deg)",
            border: "12px solid #34D399",
          }}
        />
      </div>
    ),
    { ...size },
  )
}
