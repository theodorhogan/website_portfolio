# Data files: notes for the website

Written by the data pipeline (`C:\dev\terminal-data`, `.\run weekly`); do not edit these files by hand. The full contract
is section 6.4 of `C:\dev\terminal-data\PLAN.md`, and section 6.2 there describes how each panel uses the data. This
file sums up the conventions and what changed in **v1.1 (28 Nov 2026)**, with the reasons.

## Conventions

- ISO dates (`YYYY-MM-DD`). Every file is cut at the bulletin Friday it was built for: nothing is dated after it.
- Weekly rows are dated on the week's last US trading day: the Friday, or the Thursday when Friday is a market holiday.
- The site's lookup rule applies everywhere: the last point on or before the active date, if no more than 21 days old.
- **A blank cell means "no value", never 0.**
- **NA rows (v1.1).** Some weekly series have a row for every Friday from 2026-01-02, with a blank value in the weeks
  without data. Under the lookup rule that blank row is the week's point, so show **NA** for that week. Do not fall
  back to an older value.
  - `index-pe.csv`: SPX, NDX, IJR, DAX, STOXX600, AEX, NIKKEI.
  - `series.csv`: `UX` (uranium). Its value and source are both blank.

  *Why:* the owner decided not to backfill these histories. A consistent weekly row makes "no data" explicit.
- **No display rounding (v1.1).** Values come as precise as the source gives them; round in the site.
  - Computed values (% changes, P/E, probabilities) keep 12 significant digits.
  - The only cuts remove binary-float noise:
    - Yahoo prices to 7 significant digits (Yahoo sends single precision);
    - futures to 4 decimals (they trade in 0.0025 steps);
    - FRED spreads × 100 to 6 decimals.

  *Why:* rounding is a front-end decision (owner).
- `source` columns and `status.json` are for auditing, not for display.

## Files

| File | Layout | Notes |
|---|---|---|
| `instruments.csv` | `ticker,name,group,section,region,order,added,removed` | One row per column of `closes-daily.csv`. A stock is listed in a week only if `added` ≤ that week < `removed` |
| `closes-daily.csv` | `date,<TICKER>,...` | Daily closes from 2024-01-01. MSCI and R2000 only on weekly capture dates |
| `index-ohlc.csv` | `date,ticker,open,high,low,close` | SPX, NDX, STOXX600 from 2015. open/high/low blank on a few old bars |
| `treasury-nominal.csv`, `treasury-real.csv` | `date,<tenor>,...` | Daily from 2022, percent |
| `series.csv` | `date,key,value,source` | One number per date: spreads in bp from 27 Nov 2023, rates in %, Fed liquidity in $bn, Bund, Gilt, `UX` (NA rows) |
| `zq.csv` | `date,contract,price,source` | Fed funds futures, weekly, 13 contracts per snapshot. Prices as stored, see below |
| `index-pe.csv` | `date,ticker,forwardPe` | Weekly, one row per index per week from 2026-01-02; blank = NA |
| `fedwatch.json` | `{"weeks": [...]}` | Next FOMC meeting per week, see below |
| `econ-us.json` | `{"region", "indicators", "gdpnow"}` | Every value with its publication and revision dates |
| `earnings.json` | `{"weeks": [...]}` | Season figures and comment per week, from the LSEG reports |
| `earnings-calendar.json` | `{"weeks": [{"week", "rows"}]}` | Companies reporting in the week after each bulletin Friday |
| `status.json` | `{"generated", "datasets"}` | Freshness per file; `held` lists what kept last week's value |

## What changed in v1.1, and why

- **`fedwatch.json`: `hike50` and `cut50`.** Each week now has five probabilities that add up to 1:
  `hike50, hike25, hold, cut25, cut50`. A move priced between one and two 25bp steps is split between them, as CME
  does: 13 Nov 2026 prices +27bp, which is 91.5% +25bp and 8.5% +50bp. All five are null only if more than two steps
  are priced. `projections` is null where the Fed has not said yet (2027 meetings).
  *Why:* 13 Nov could not be shown with three outcomes (owner).
- **`econ-us.json`: `releases`.** Each quarter of `gdp_growth` and of the six `gdp_contribution` indicators lists every
  release that covered it, unchanged ones included. In an active week, count the releases on or before it:
  1 = advance estimate, 2 = second, 3 = third, more = revised. Example for 2026Q2: 30 Jul, 26 Aug, 30 Sep. The
  26 Aug estimate did not change the value, so `prints` alone cannot tell.
  *Why:* the GDP panel's "first/second/third estimate" label (owner).
- **`earnings-calendar.json`: `source` per row and S&P 500 only.** Rows are `lseg` or `nasdaq`.
  - For S&P 500 companies, the date, time, estimate and year-ago EPS come from the LSEG report; the number of
    estimates and the market cap come from Nasdaq.
  - After the watchlist companies, only S&P 500 companies are added, largest first, up to 14 rows.
  - *Why:* LSEG covers the S&P 500 better, and the site spec asks for the largest S&P names (owner).
- **`zq.csv`: 13 contracts in every snapshot.** The 14 snapshots of 1 Jan to 27 Mar 2026 had only 12. The contract
  12 months out is filled from Yahoo's daily close (the CME settlement, not the 17:00 last), with source `yahoo`.
  *Why:* the Cuts panel's last quarter needs 13 contracts (owner: imperfect, but consistent).
- **Futures prices.** On the 27 Nov 2026 half day, five deferred contracts from FactSet differ from Yahoo by 2–3 ticks.
  FactSet's price is used: the owner considers it the better source.

## Known limits (accepted by the owner)

- **Forward P/E** of NDX, IJR, DAX, AEX and Nikkei starts with the pipeline (27 Nov 2026), and the STOXX 600 has none
  in January 2026. Those weeks are NA rows.
- **Uranium** starts 20 Nov 2026; earlier weeks are NA rows.
- **`earnings.json` before 20 Nov 2026** carries only `fwd4qEps`, backed out of the old site's P/E (good to about
  0.1), plus the STOXX 600 P/E. Every other field is null, with `source.title` = `backfill`.
- **The four FactSet surveys** (ISM manufacturing, ISM services, Conference Board confidence, Leading Index) begin
  with their first capture, on 25 Nov 2026. So the 27 Nov 2026 bulletin shows all their months as new.
- **The Sep–Dec 2025 bulletins** have no rows in the FactSet-only series (futures, MSCI World, Russell 2000, Bund,
  Gilt, P/E).
- **Old futures weeks:** 6 Nov, 18 and 25 Sep, and 16 Oct 2026 hold a settlement or intraday price. The owner kept them.
