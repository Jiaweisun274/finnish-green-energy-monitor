# 📊 Data Dictionary & Methodology

This document outlines the definitions, calculation logic, and data sources used in the **Finnish Green Energy Dashboard**.

## 1. Data Sources

* **Primary Source:** Yahoo Finance API (`yfinance`).
* **Frequency:** On-demand (user-triggered pipeline).
* **Scope:** Helsinki Stock Exchange (.HE) listed companies.

## 2. Financial Metrics

### Valuation Metrics

| Metric | Definition | Logic / Formula | Why we use it |
| :--- | :--- | :--- | :--- |
| **Market Cap** | Total market value of equity. | `Price * Outstanding Shares` | Size classification. |
| **P/E Ratio** | Price-to-Earnings Ratio. | `Price / EPS (TTM)` | Standard relative valuation. **Note:** Excluded if EPS is negative. |
| **EV/EBITDA** | Enterprise Value to EBITDA. | `(Market Cap + Debt - Cash) / EBITDA` | Best for capital-intensive industries (Energy) as it ignores debt structure. |

### Performance Metrics

| Metric | Definition | Logic / Formula | Why we use it |
| :--- | :--- | :--- | :--- |
| **1Y Return** | 1-Year Total Return. | `(Current Price - Price_1Y_Ago) / Price_1Y_Ago` | Short-term momentum signal. |
| **3Y CAGR** | Compound Annual Growth Rate. | `(End_Price / Start_Price)^(1/3) - 1` | Smoothed long-term trend, filtering out noise. |
| **EBITDA Margin** | Operational Profitability. | `EBITDA / Total Revenue` | Measures core business efficiency before interest/taxes. |

## 3. Data Handling Rules (Business Logic)

1.  **Missing Data:** If a metric (e.g., P/E) is missing or `NaN` from the source, it is displayed as `N/A` or `-` rather than `0` to avoid skewing averages.
2.  **Negative Multiples:** Companies with negative Earnings or EBITDA are classified as **"Loss-making / NM"** (Not Meaningful) instead of "Undervalued".
3.  **Currency:** All monetary values are converted to **EUR (€)** if not already.
4.  **Timezone:** Historical data uses adjusted close prices to account for dividends and splits.

## 4. Known Limitations

* **Delayed Data:** Free API feeds typically have a 15-minute delay.
* **TTM Lag:** Fundamental ratios are based on Trailing Twelve Months (TTM) and may lag by one quarter until financial reports are filed.