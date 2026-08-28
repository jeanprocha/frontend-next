import { ImageResponse } from "next/og"
import { TribiaOgCard } from "@/lib/og-image"

export const alt = "TribIA — Um parecer, não uma estimativa"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(<TribiaOgCard />, { ...size })
}
