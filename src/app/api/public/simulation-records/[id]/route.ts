import { NextResponse } from "next/server"

/**
 * Proxy same-origin → motor Go. Evita 404 no Next quando NEXT_PUBLIC_API_URL aponta
 * para a própria app e garante o caminho /public/simulation-records/ no dev.
 */
const engineBase = (): string => {
  const b =
    process.env.ENGINE_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://127.0.0.1:8080"
  return b.replace(/\/$/, "")
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id?.trim()) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 })
  }

  const upstream = await fetch(
    `${engineBase()}/public/simulation-records/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  )

  const text = await upstream.text()
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  })
}
