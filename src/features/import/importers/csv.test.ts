import { describe, expect, it } from "vitest"
import { csvImporter } from "./csv"

describe("csvImporter.parse", () => {
  it("aceita cabeçalho em português (descricao,valor)", async () => {
    const result = await csvImporter.parse("descricao,valor\nAWS,500.00\nGitHub,50.00")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.draft.expenses).toHaveLength(2)
    expect(result.draft.expenses?.[0]).toMatchObject({ description: "AWS", amount: "500.00" })
    expect(result.draft.expenses?.[1]).toMatchObject({ description: "GitHub", amount: "50.00" })
  })

  it("aceita cabeçalho em inglês (description,amount) e variação de caixa (DESCRIPTION)", async () => {
    const result = await csvImporter.parse("DESCRIPTION,amount\nCloud hosting,1200.00")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.draft.expenses?.[0]).toMatchObject({ description: "Cloud hosting", amount: "1200.00" })
  })

  it("cada linha ganha um id próprio (makeLineId, não índice)", async () => {
    const result = await csvImporter.parse("descricao,valor\nAWS,500.00\nGitHub,50.00")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const [a, b] = result.draft.expenses ?? []
    expect(a.id).not.toBe("0")
    expect(a.id).not.toBe(b.id)
  })

  it("sem coluna de valor, amount vira '0' (bug-for-bug preservado do upload-zone original)", async () => {
    const result = await csvImporter.parse("descricao\nAWS")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.draft.expenses?.[0].amount).toBe("0")
  })

  it("sem coluna de descrição, falha com mensagem citando as colunas detectadas", async () => {
    const result = await csvImporter.parse("valor\n100")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain("Coluna de descrição não encontrada")
    expect(result.error).toContain("valor")
  })

  it("filtra linhas sem descrição", async () => {
    const result = await csvImporter.parse("descricao,valor\n,100\nAWS,50")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.draft.expenses).toHaveLength(1)
    expect(result.draft.expenses?.[0].description).toBe("AWS")
  })

  it("arquivo sem nenhuma linha válida falha com mensagem dedicada", async () => {
    const result = await csvImporter.parse("descricao,valor\n,100")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("Nenhuma linha válida encontrada no arquivo.")
  })

  it("linhas em branco são ignoradas (skipEmptyLines)", async () => {
    const result = await csvImporter.parse("descricao,valor\nAWS,500.00\n\nGitHub,50.00\n")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.draft.expenses).toHaveLength(2)
  })

  it("id do metadata declara csv, aceita .csv/.txt e traz uma dica de formato", () => {
    expect(csvImporter.id).toBe("csv")
    expect(csvImporter.accepts).toEqual([".csv", ".txt"])
    expect(csvImporter.formatHint).toBeTruthy()
  })
})
