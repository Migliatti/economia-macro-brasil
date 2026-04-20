# Bússola Macroeconômica · Brasil

Monitor dos principais indicadores macroeconômicos brasileiros com dados em
tempo real do Banco Central. Funciona como "bússola" para o investidor: os
números estão aqui, a análise é sua.

**[→ Demo ao vivo](https://economia-macro-brasil.vercel.app)**

---

## Indicadores

| Indicador | Série SGS | Frequência | Delta exibido |
| --------- | --------- | ---------- | ------------- |
| Selic Meta | 432 | Diária | vs 6 meses (captura o ciclo) |
| CDI (DI-Over anualizada) | 12 | Diária | vs 6 meses |
| IPCA Mensal | 433 | Mensal | vs mês anterior |
| IPCA Acumulado 12M | 13522 | Mensal | vs mês anterior |
| PTAX venda (USD/BRL) | 1 | Diária | vs dia anterior |

**Juro Real Implícito** — métrica derivada calculada em cima dos dados acima:
`Selic Meta − IPCA Acumulado 12M`. Color-coded por regime (contracionista /
neutro / acomodatício).

**Calendário Copom** — próxima reunião com countdown e histórico recente com
a taxa Selic vigente em cada data (derivada da série 432, sem hardcode).

---

## Stack

- **Next.js 16** (App Router, Server Components) + **TypeScript**
- **Tailwind CSS 4** — tema dark estilo terminal financeiro + glassmorphism
- **Recharts** — gráfico histórico interativo (5 indicadores × 4 períodos) e sparklines
- **API SGS do Banco Central** — fonte pública, sem autenticação
- **Vercel** — deploy com ISR (revalidação a cada 1h)

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Estrutura

```
src/
  app/
    page.tsx               # dashboard — fetch no servidor, zero JS extra na home
    api/series/[key]/      # proxy SGS → client; aceita ?days=N
  components/
    Header.tsx             # cabeçalho com indicador "live" e timestamp
    IndicatorCard.tsx      # card: valor atual, delta contextual, sparkline
    HistoricalChart.tsx    # chart interativo com seletor de indicador e período
    RealRateBar.tsx        # juro real implícito com classificação de regime
    CopomPanel.tsx         # próxima reunião + histórico de decisões
    Sparkline.tsx
  lib/
    bcb.ts                 # client da API SGS (date-range queries)
    indicators.ts          # metadados, unidades, referência de delta e transforms
    copom.ts               # calendário Copom 2025–2026
    format.ts              # formatadores pt-BR (moeda, %, datas)
    utils.ts
```

## Decisões de implementação

**API do BCB** — o endpoint `/dados/ultimos/N` aceita no máximo N=20.
O client sempre usa janela de datas (`dataInicial`/`dataFinal`), o que
funciona para qualquer período sem limitação.

**CDI anualizado** — a série 12 retorna a taxa *diária* (~0,054%/dia).
O client aplica `(1 + r)^252 − 1` para converter para base anual, seguindo
a convenção do mercado de renda fixa brasileiro.

**Delta por indicador** — Selic/CDI comparam vs 180 dias atrás (o ciclo de
política monetária dura meses, não horas). IPCA e câmbio usam ponto anterior.
A referência é declarada em `IndicatorMeta.delta` e funciona como config.

**Revalidação** — `next: { revalidate: 3600 }` no servidor: uma requisição
ao BCB por hora por série, independentemente do tráfego no Vercel.

**Período IPCA** — mínimo de 90 dias por fetch (garante ≥ 3 pontos mensais
no preset 30D) sem forçar janela desnecessariamente grande nos outros presets.

## Disclaimer

Ferramenta de monitoramento para fins educacionais. Não constitui recomendação
de investimento.
