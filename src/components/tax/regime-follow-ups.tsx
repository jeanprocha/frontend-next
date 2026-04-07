"use client"

import {
  Apple,
  Globe,
  GraduationCap,
  HeartHandshake,
  Home,
  Lightbulb,
  Scale,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useTaxStore, isImobiliarioRegime } from "@/store/useTaxStore"

export function RegimeFollowUps() {
  const {
    companyRegime,
    imobiliarioRedutorAjusteBrl,
    setImobiliarioRedutorAjusteBrl,
  } = useTaxStore()

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        "dark:border-border/60 dark:bg-card/80",
      )}
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Ajustes e alertas do regime
      </p>
      <div className="space-y-4">
        {isImobiliarioRegime(companyRegime) && (
          <div className="space-y-1.5">
            <Label
              htmlFor="imobiliario-redutor"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Redutor de ajuste (R$, opcional)
            </Label>
            <Input
              id="imobiliario-redutor"
              inputMode="decimal"
              placeholder="Ex.: 40000.00 — vazio usa padrão do servidor (env)"
              value={imobiliarioRedutorAjusteBrl}
              onChange={(e) => setImobiliarioRedutorAjusteBrl(e.target.value)}
              className="h-9"
            />
            <p className="text-sm text-muted-foreground">
              Valor ilustrativo abatido da receita total antes de aplicar a alíquota efetiva na projeção.
            </p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Valores baseados em alíquotas estimadas da LC 68/2024. Consulte um especialista para decisões fiscais.
        </p>
        {companyRegime === "simples_hibrido" && (
          <div
            className="flex gap-2.5 rounded-md border border-amber-200/80 bg-amber-50/80 p-3 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100"
            role="note"
          >
            <Lightbulb
              className="size-4 shrink-0 text-amber-700 dark:text-amber-300"
              aria-hidden
            />
            <div className="min-w-0 space-y-1 text-sm leading-snug">
              <p className="font-semibold text-amber-900 dark:text-amber-50">
                Foco em competitividade B2B
              </p>
              <p className="text-amber-900/95 dark:text-amber-100/90">
                No modo híbrido você recolhe IBS/CBS na alíquota cheia da simulação, mas a operação gera
                crédito integral para seus clientes. Indicado para quem vende para grandes empresas e quer
                reduzir atrito em contratos que exigem crédito pleno na cadeia.
              </p>
            </div>
          </div>
        )}
        {companyRegime === "prof_liberal" && (
          <div
            className="flex animate-in fade-in-0 slide-in-from-top-2 items-start gap-3 rounded-xl border border-indigo-100 border-l-4 border-l-indigo-500 bg-indigo-50/50 p-4 duration-300 dark:border-indigo-900/40 dark:border-l-indigo-400 dark:bg-indigo-950/20"
            role="note"
          >
            <div className="shrink-0 rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
              <Scale className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-50">
                Profissões regulamentadas (ilustrativo)
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-indigo-800 dark:text-indigo-200/90">
                Sociedades de advogados, engenheiros, contadores, arquitetos e demais profissões com registro
                podem enquadrar-se em benefícios específicos na LC 68/2024. O TribIA aplica na projeção{" "}
                <strong>70% da alíquota CBS+IBS padrão do ano selecionado</strong> (redução ilustrativa de 30%
                sobre essa alíquota), mantendo <strong>créditos por despesa elegível</strong> conforme o regime
                de cada fornecedor. Compare com o cenário &quot;Lucro Real / Presumido&quot; para avaliar troca de
                estratégia; confirme o enquadramento com seu contador.
              </p>
            </div>
          </div>
        )}
        {companyRegime === "diferenciado_60" && (
          <div
            className="flex animate-in fade-in-0 slide-in-from-top-2 items-start gap-3 rounded-xl border border-blue-100 border-l-4 border-l-blue-500 bg-blue-50/50 p-4 duration-300 dark:border-blue-900/40 dark:border-l-blue-400 dark:bg-blue-950/20"
            role="note"
          >
            <div className="shrink-0 rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
              <GraduationCap className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-50">Setor favorecido</h4>
              <p className="mt-1 text-xs leading-relaxed text-blue-700 dark:text-blue-200/90">
                Sua atividade possui <strong>60% de redução</strong> na alíquota padrão CBS+IBS. O TribIA aplica{" "}
                <strong>40% dessa alíquota</strong> sobre a receita do <strong>ano selecionado</strong>; na
                referência plena (26,5%), isso equivale a cerca de <strong>10,6%</strong>. Você mantém o direito
                ao <strong>abatimento integral de créditos</strong> nas despesas elegíveis, conforme o regime de
                cada fornecedor. Confirme o enquadramento com seu contador.
              </p>
            </div>
          </div>
        )}
        {companyRegime === "aliquota_zero" && (
          <div
            className="flex animate-in fade-in-0 slide-in-from-top-2 items-start gap-3 rounded-xl border border-emerald-100 border-l-4 border-l-emerald-500 bg-emerald-50/50 p-4 duration-300 dark:border-emerald-900/40 dark:border-l-emerald-500 dark:bg-emerald-950/20"
            role="note"
          >
            <div className="shrink-0 rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300">
              <Apple className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-50">
                Alíquota zero com manutenção de crédito
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-emerald-700 dark:text-emerald-200/90">
                A projeção trata a saída como <strong>isenta de CBS+IBS</strong> sobre a receita de serviços
                (ilustrativo, Anexo I / cesta básica). Um valor <strong>negativo</strong> no líquido projetado
                indica <strong>saldo credor</strong>: créditos de compras elegíveis superam o tributo na saída —
                posição típica a tratar com seu contador (compensação / ressarcimento conforme regras vigentes).
              </p>
            </div>
          </div>
        )}
        {companyRegime === "entidade_imune" && (
          <div
            className="flex animate-in fade-in-0 slide-in-from-top-2 items-start gap-3 rounded-xl border border-slate-200 border-l-4 border-l-slate-400 bg-slate-50/50 p-4 duration-300 dark:border-slate-700 dark:border-l-slate-500 dark:bg-slate-900/25"
            role="note"
          >
            <div className="shrink-0 rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <HeartHandshake className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Imunidade de saída (sem créditos no modelo)
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200/90">
                O TribIA trata a <strong>projeção</strong> como{" "}
                <strong>CBS+IBS zero sobre a receita informada</strong> (ilustrativo para doações, anuidades
                etc., sem modelar imunidade integral no regime atual). <strong>Não há apropriação de créditos</strong>{" "}
                no cenário projetado: o imposto embutido nas compras tende a permanecer como{" "}
                <strong>custo</strong>, podendo elevar o custo operacional face a um contribuinte que compensa
                IBS/CBS na cadeia — em ordem de grandeza, até a <strong>alíquota combinada do ano</strong> da
                simulação sobre o valor das aquisições tributadas (ilustrativo). Confirme com especialista e normas
                aplicáveis ao caso.
              </p>
            </div>
          </div>
        )}
        {companyRegime === "exportadora" && (
          <div
            className="flex animate-in fade-in-0 slide-in-from-top-2 items-start gap-3 rounded-xl border border-sky-100 border-l-4 border-l-sky-500 bg-sky-50/50 p-4 duration-300 dark:border-sky-900/40 dark:border-l-sky-400 dark:bg-sky-950/20"
            role="note"
          >
            <div className="shrink-0 rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300">
              <Globe className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-sky-900 dark:text-sky-50">
                Exportação — imunidade ilustrativa na saída
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-sky-800 dark:text-sky-200/90">
                O TribIA projeta <strong>CBS+IBS zero sobre a receita de serviços</strong> (modelo ilustrativo de
                imunidade na saída), mantendo <strong>créditos nas compras elegíveis</strong> conforme o regime
                de cada fornecedor. A conta é distinta da cesta básica na narrativa de produto. Um{" "}
                <strong>líquido projetado negativo</strong> sugere posição de <strong>saldo credor</strong>{" "}
                ilustrativa — tema para alinhar com seu contador (compensação, ressarcimento ou manutenção de
                créditos conforme normas aplicáveis ao caso).
              </p>
            </div>
          </div>
        )}
        {isImobiliarioRegime(companyRegime) && (
          <div
            className="flex animate-in fade-in-0 slide-in-from-top-2 items-start gap-3 rounded-xl border border-purple-100 border-l-4 border-l-purple-500 bg-purple-50/50 p-4 duration-300 dark:border-purple-900/40 dark:border-l-purple-400 dark:bg-purple-950/25"
            role="note"
          >
            <div className="shrink-0 rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
              <Home className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-purple-900 dark:text-purple-50">
                Mecanismo de ajuste imobiliário
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-purple-700 dark:text-purple-200/90">
                A projeção aplica uma <strong>alíquota CBS+IBS efetiva reduzida</strong> conforme o perfil
                (percentual da alíquota padrão do <strong>ano da simulação</strong>) e, se informado, o{" "}
                <strong>redutor de ajuste</strong> em R$ sobre a receita agregada — modelo ilustrativo da LC
                68/2024 para viabilidade, não substitui cálculo fiscal real. Créditos nas compras seguem o regime
                de cada fornecedor.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
