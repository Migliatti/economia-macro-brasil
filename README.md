# Bússola Macroeconômica · Brasil

Monitor dos principais indicadores macroeconômicos brasileiros — **Selic**, **CDI**,
**IPCA** e **câmbio (USD/BRL PTAX)** — com séries históricas, calendário do Copom e
contexto de política monetária. Construído para funcionar como "bússola" do
investidor: os números estão aqui, a análise é sua.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** com tema dark em estilo terminal financeiro + glassmorphism
- **Recharts** para séries históricas e sparklines
- **API pública do Banco Central** ([SGS](https://www3.bcb.gov.br/sgspub/)) como fonte única dos dados
- Deploy pensado para **Vercel** (revalidação incremental a cada 1h)

## Indicadores e fontes

| Indicador | Série SGS | Frequência |
| --------- | --------- | ---------- |
| Selic Meta | 432 | Diária |
| CDI (DI-Over anualizada) | 12 | Diária |
| IPCA mensal | 433 | Mensal |
| PTAX venda (USD/BRL) | 1 | Diária |

Calendário do Copom: publicado em `src/lib/copom.ts` conforme divulgação
oficial do BC. As decisões (taxa vigente e variação) são derivadas da própria
série 432, evitando dados hardcoded que possam ficar defasados.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Estrutura

```
src/
  app/
    page.tsx             # dashboard (server component, fetch no servidor)
    api/series/[key]/    # rota que serve séries históricas ao chart
  components/
    Header.tsx           # cabeçalho com indicador "live"
    IndicatorCard.tsx    # card com valor, variação e sparkline
    HistoricalChart.tsx  # chart com seletor de indicador e período
    CopomPanel.tsx       # próxima reunião + histórico de decisões
    Sparkline.tsx
  lib/
    bcb.ts               # client da API SGS
    indicators.ts        # metadados dos indicadores
    copom.ts             # calendário Copom
    format.ts            # formatadores pt-BR
    utils.ts
```

## Notas de implementação

- A API do BCB limita `/dados/ultimos/N` a N ≤ 20 — o client sempre usa
  janela de datas (`dataInicial`/`dataFinal`) para funcionar em qualquer período.
- Fetch no servidor com `next: { revalidate: 3600 }` — uma chamada por hora
  para o BCB, independentemente do tráfego.
- Todos os gráficos renderizam com `isAnimationActive={false}` para evitar
  reflow em re-render.

## Disclaimer

Ferramenta de monitoramento para estudo. Não constitui recomendação de
investimento.
