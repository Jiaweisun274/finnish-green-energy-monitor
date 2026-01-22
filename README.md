# 🇫🇮 Finnish Green Energy & Clean Tech Market Monitor

A full-stack analytics application tracking valuation anomalies and growth drivers in Finland's key renewable energy companies.

![Dashboard Preview](docs/screenshots/overview.png)

[![Status](https://img.shields.io/badge/Status-Portfolio_Ready-success)]()
[![Stack](https://img.shields.io/badge/Stack-React_|_Python_Flask-blue)]()
[![Demo](https://img.shields.io/badge/Demo-Live_on_Vercel-black)](https://finnish-green-energy-monitor.vercel.app/)

## Project Overview

This application serves as a strategic analytics tool designed to bridge the gap between raw financial data and executive decision-making. Unlike static reports, this interactive dashboard provides a real-time view of how the market prices mature industrial players versus high-growth disruptors within the Finnish renewable energy sector.

The project simulates a real-world Strategy Consulting engagement, moving beyond simple data visualization to offer specific investment insights.

## Executive Summary & Insights

Current market data reveals a distinct bifurcation in the Finnish Clean Tech sector. Mature heavyweights like **Fortum** and **Valmet** are currently trading at historical discounts, effectively acting as defensive yield plays with EV/EBITDA multiples significantly below the sector average.

Conversely, growth-stage entrants like **Kempower** command significant premiums, pricing in aggressive future market share despite current profitability volatility. Structural headwinds are also visible, with **Neste** facing margin compression due to rising feedstock costs in the renewable diesel market, while **Wärtsilä** has successfully pivoted towards higher-margin service revenues.

*Full detailed analysis is available in the [docs/executive_summary.md](docs/executive_summary.md).*

## Technical Architecture

Built on a modern full-stack architecture, the application utilizes a React frontend for responsive data visualization, powered by Recharts and Tailwind CSS to ensure a professional, clean UI.

The backend relies on a Python Flask server that orchestrates a robust ETL pipeline. This pipeline leverages Pandas and yfinance to extract, clean, and normalize real-time market data. A key engineering challenge was ensuring data reliability; the system implements automatic retry logic, caching mechanisms, and concurrency handling to resolve common API rate limits and Windows file locking issues.

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

## How to Run Locally

This application is designed to be flexible. It can run in Snapshot Mode (Frontend only) for quick reviews, or Live Mode (Full Stack) for real-time data fetching.

### Prerequisites
* Node.js (v16+)
* Python (v3.9+)

### 1. Start the Dashboard (Frontend)
Navigate to the dashboard directory and install dependencies. This will launch the application in Snapshot Mode by default.

```bash
cd dashboard
npm install
npm run dev
```

### 2. Enable Live Data (Optional Backend)
To enable the "Run Pipeline" feature, open a separate terminal to start the Python API server. This allows the dashboard to fetch fresh data from Yahoo Finance.

```bash
cd pipeline
pip install -r requirements.txt
python api.py
```

## Methodology

Financial metrics are calculated with strict adherence. Valuation multiples rely on TTM (Trailing Twelve Months) financials, and companies with negative earnings are explicitly classified as "Loss-making / NM" to preserve the integrity of sector averages. Growth metrics, such as the 3-Year CAGR, are derived from adjusted close prices to account for dividend reinvestment.

## License
MIT License. Created for portfolio demonstration purposes.