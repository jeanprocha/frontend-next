import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FE-4: /dashboard/* aposentado em favor de /clientes, /simulador,
  // /simulacoes. `redirects` roda ANTES do proxy (docs Next 16), então o
  // destino já cai numa rota protegida pelo matcher novo — nenhum usuário
  // deslogado vê a rota antiga antes de ser mandado ao sign-in.
  async redirects() {
    return [
      { source: "/dashboard/history", destination: "/simulacoes", permanent: false },
      { source: "/dashboard/companies", destination: "/clientes", permanent: false },
      { source: "/dashboard", destination: "/simulador", permanent: false },
      // Qualquer outro deep link residual sob /dashboard/*.
      { source: "/dashboard/:path*", destination: "/simulador", permanent: false },
    ];
  },
};

export default nextConfig;
