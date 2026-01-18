# 🇫🇮 Finnish Green Energy & Clean Tech Market Monitor

A consulting-grade full-stack analytics application tracking valuation anomalies and growth drivers in Finland's key renewable energy companies (Neste, Fortum, Wärtsilä, Kempower, Valmet).

![Dashboard Preview](docs/screenshots/overview.png)

[![Status](https://img.shields.io/badge/Status-Portfolio_Ready-success)]()
[![Stack](https://img.shields.io/badge/Stack-React_|_Python_Flask-blue)]()
[![Demo](https://img.shields.io/badge/Demo-Live_on_Vercel-black)](https://finnish-green-energy-monitor-rz6i-o62u6bf34.vercel.app/)

## 🚀 Project Overview

This project simulates a real-world **Strategy Consulting / PE Analytics** engagement. It provides an interactive dashboard that synthesizes real-time financial data into actionable investment insights.

**Key Features:**
* **Dual-Mode Architecture:** Toggles between **Snapshot Mode** (Jan 2026 Simulation) for instant demos and **Live Mode** (Python API) for real-time analysis.
* **Robust ETL Pipeline:** Python backend with automatic retry logic, caching, and concurrency handling for reliable data extraction from Yahoo Finance.
* **Financial Rigor:** Implements correct handling of negative multiples (loss-making firms), TTM calculations, and market-cap weighted sector averages.

---

## 📊 Executive Summary (Business Insights)

> *Full analysis available in [docs/executive_summary.md](docs/executive_summary.md)*

**1. The "Two-Speed" Market**
The sector has bifurcated. **Fortum** and **Valmet** trade at historical discounts ("Value" territory, EV/EBITDA < 8x), acting as defensive yield plays. In contrast, **Kempower** commands a significant "Growth Premium" (P/E > 40x) despite profitability volatility, pricing in a winner-takes-all EV charging scenario.

**2. Profitability Squeeze**
**Neste** faces structural headwinds with EBITDA margins compressing to ~13% due to rising feedstock costs in the Renewable Diesel market. Meanwhile, **Wärtsilä** has successfully pivoted to higher-margin service revenues, reflected in its superior 1-year stock performance.

---

## 🛠️ Technical Architecture

### Tech Stack
* **Frontend:** React (Vite), TypeScript, Tailwind CSS, Recharts.
* **Backend:** Python (Flask), Pandas, yfinance.
* **Data Strategy:** Local ETL pipeline serving JSON to frontend; API endpoint for on-demand refreshes.

### Directory Structure
```text
/pipeline        # Python Backend (ETL + Flask API)
  ├── data_pipeline.py  # Core data extraction & calculation logic
  ├── api.py            # Local server for frontend interaction
  └── requirements.txt  # Python dependencies
/dashboard       # React Frontend
  ├── src/              # UI Components & Logic
  └── public/           # Stores generated JSON data
/docs            # Consulting Deliverables
  ├── executive_summary.md
  └── data_dictionary.md
```

---

## 💻 How to Run Locally

This application can run in **Snapshot Mode** (Frontend only) or **Live Mode** (Full Stack).

### Prerequisites
* Node.js (v16+)
* Python (v3.9+)

### 1. Start the Frontend (Dashboard)
```bash
cd dashboard
npm install
npm run dev
```
*Open `http://localhost:5173`. The app will load in **Snapshot Mode** by default.*

### 2. Start the Backend (Optional for Live Data)
To enable the "Run Pipeline" button and fetch real-time data:

```bash
# Open a new terminal
cd pipeline
pip install -r requirements.txt
python api.py
```
*The API server will start on `http://127.0.0.1:5000`. You can now click "Run Pipeline" in the dashboard.*

---

## 📝 Methodology & Data Dictionary

* **Valuation Multiples:** Calculated using TTM (Trailing Twelve Months) financials. Companies with negative earnings are classified as "Loss-making / NM" to preserve average integrity.
* **CAGR:** 3-Year Compound Annual Growth Rate based on adjusted close prices (dividends reinvested).
* **Sector Averages:** Market-Cap weighted averages are used for Growth and Margin KPIs to reflect the sector's true economic aggregate.

*See [docs/data_dictionary.md](docs/data_dictionary.md) for full formulas.*

## 📄 License
MIT License. Created for portfolio demonstration purposes.