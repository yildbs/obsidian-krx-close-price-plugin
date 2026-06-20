# KRX Close Price

Obsidian plugin for looking up raw KRX close prices and market caps from the current note's frontmatter.

## Usage

Add `asset_name` and `symbol` to a company analysis note.

```yaml
---
asset_name: 휴메딕스
symbol: "200670"
---
```

`symbol` may be a YAML number, a six-digit short code, or a KRX-style `A` prefixed code such as `A005930`.

Select the ribbon icon or run the command **특정 날짜 종가 및 시가총액 조회**, enter your KRX Open API key, choose a date, and select **조회**. The plugin stores the API key locally for the next lookup, shows the close price and market cap, copies the result to the clipboard automatically, and also provides a **복사** button.

## Settings

- **가격 데이터 제공자**: KRX Open API.
- **캐시 비우기**: Clears saved close price lookup results.

## Data Source

The plugin uses KRX Data Marketplace OPEN API stock daily trading endpoints:

- `stk_bydd_trd`: 유가증권 일별매매정보
- `ksq_bydd_trd`: 코스닥 일별매매정보
- `knx_bydd_trd`: 코넥스 일별매매정보

Close price is read from `TDD_CLSPRC` and treated as raw, not adjusted, close price. Market cap is read from `MKTCAP` and displayed in units of 100 million KRW.

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```
