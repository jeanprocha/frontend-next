// Barrel público da feature portfolio (FE-4, PR 4c). app/ só importa
// daqui — nunca de features/portfolio/** directamente (lint de fronteira).
export { PortfolioPage, type PortfolioPageProps } from "./components/portfolio-page"
export { CompanyCard } from "./components/company-card"
export { NewCompanyForm } from "./components/new-company-form"
export { usePortfolioCompanies } from "./hooks/use-portfolio-companies"
