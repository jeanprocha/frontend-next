import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
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
            width: 14,
            height: 14,
            transform: "rotate(45deg)",
            border: "2.5px solid #34D399",
          }}
        />
      </div>
    ),
    { ...size },
  )
}
