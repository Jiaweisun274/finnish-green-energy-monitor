import yfinance as yf
import pandas as pd
import numpy as np
import logging
import shutil
import os
import platform
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple

LOG_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger(__name__)

TICKERS = ['NESTE.HE', 'FORTUM.HE', 'WRT1V.HE', 'KEMPOWR.HE', 'VALMT.HE']

def clear_yfinance_cache():
    """
    Cross-platform safe cache clearing for yfinance.
    """
    try:
        if platform.system() == 'Windows':
            cache_dir = os.path.join(os.environ.get('LOCALAPPDATA'), 'py-yfinance')
        else:
            cache_dir = os.path.join(os.path.expanduser('~'), '.cache', 'py-yfinance')
            
        if os.path.exists(cache_dir):
            shutil.rmtree(cache_dir)
            logger.info(f"Cleared yfinance cache at: {cache_dir}")
    except Exception as e:
        logger.warning(f"Could not clear cache (non-critical): {e}")

def calculate_cagr(start_price: float, end_price: float, years: float) -> Optional[float]:
    """Calculates Compound Annual Growth Rate safely."""
    if not start_price or start_price <= 0 or not years or years <= 0:
        return None
    return (end_price / start_price) ** (1 / years) - 1

def fetch_price_history(tickers: List[str], years: int = 1) -> pd.DataFrame:
    """
    Fetches adjusted close prices with Retry Logic.
    Returns a wide-format DataFrame (Index=Date, Columns=Tickers).
    """
    start_date = (datetime.now() - timedelta(days=years*365)).strftime('%Y-%m-%d')
    logger.info(f"Fetching price history from {start_date}...")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            clear_yfinance_cache()

            data = yf.download(
                tickers, 
                start=start_date, 
                group_by='ticker', 
                auto_adjust=True, 
                ignore_tz=True, 
                threads=False
            )
            
            prices = pd.DataFrame()
            
            if len(tickers) == 1:
                 prices[tickers[0]] = data['Close']
            else:
                for ticker in tickers:
                    try:
                        if isinstance(data.columns, pd.MultiIndex):
                             if ticker in data.columns.levels[0]:
                                prices[ticker] = data[ticker]['Close']
                        elif ticker in data.columns:
                            prices[ticker] = data[ticker]
                    except Exception as e:
                        logger.warning(f"Could not extract price for {ticker}: {e}")
                        continue
            
            if prices.empty:
                raise ValueError("Received empty price data from Yahoo Finance")

            if not prices.empty:
                prices.ffill(inplace=True)
                prices.dropna(how='all', inplace=True)
                
                cutoff_date = pd.Timestamp.now() - pd.DateOffset(years=1)
                prices = prices[prices.index >= cutoff_date]
            
            return prices
            
        except Exception as e:
            logger.warning(f"Attempt {attempt+1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                logger.error(f"Failed to download price data after {max_retries} attempts.")
                return pd.DataFrame()

def get_performance_metrics(price_df: pd.DataFrame) -> pd.DataFrame:
    """Calculates 1Y Return and 3Y CAGR."""
    metrics = []
    if price_df.empty: 
        return pd.DataFrame()

    for ticker in price_df.columns:
        series = price_df[ticker].dropna()
        if series.empty: 
            continue
            
        current = series.iloc[-1]
        
        # 1. 1-Year Return
        try:
            idx_1y = -252 if len(series) >= 252 else 0
            price_1y = series.iloc[idx_1y]
            ret_1y = (current - price_1y) / price_1y if price_1y > 0 else None
        except: 
            ret_1y = None
            
        # 2. CAGR
        try:
            days = (series.index[-1] - series.index[0]).days
            years_hist = days / 365.25
            cagr = calculate_cagr(series.iloc[0], current, years_hist) if years_hist > 0.5 else None
        except: 
            cagr = None

        metrics.append({
            'Ticker': ticker,
            'Price': round(current, 2),
            '1Y Return': round(ret_1y * 100, 2) if ret_1y is not None else None,
            '3Y CAGR': round(cagr * 100, 2) if cagr is not None else None
        })
        
    return pd.DataFrame(metrics)

def fetch_fundamentals(tickers: List[str]) -> pd.DataFrame:
    """Fetches key valuation ratios with safe fallbacks."""
    logger.info("Fetching fundamental data...")
    data = []
    
    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            mkt_cap = info.get('marketCap')
            revenue = info.get('totalRevenue')
            ebitda = info.get('ebitda')

            ebitda_margin = None
            if ebitda is not None and revenue is not None and revenue > 0:
                ebitda_margin = (ebitda / revenue) * 100
            elif info.get('profitMargins') is not None:
                ebitda_margin = info.get('profitMargins') * 100

            data.append({
                'Ticker': ticker,
                'Company': info.get('shortName', ticker),
                'Sector': info.get('sector', 'Industrials'),
                'Market Cap (B)': round(mkt_cap / 1e9, 2) if mkt_cap else None,
                'PE Ratio': info.get('trailingPE'),
                'EV/EBITDA': info.get('enterpriseToEbitda'),
                'EBITDA Margin': round(ebitda_margin, 1) if ebitda_margin is not None else None,
                'Rev Growth': round(info.get('revenueGrowth', 0) * 100, 1) if info.get('revenueGrowth') else None
            })
        except Exception as e: 
            logger.warning(f"Error fetching fundamentals for {ticker}: {e}")
            data.append({'Ticker': ticker, 'Company': ticker})
            
    return pd.DataFrame(data)

def run_pipeline() -> Tuple[List[Dict], List[Dict]]:
    """
    Main execution function.
    Returns: (Fundamentals List, History List)
    """
    logger.info("Starting Pipeline Execution...")
    
    # 1. Fetch History
    full_history = fetch_price_history(TICKERS, years=3)
    
    # 2. Calculate Metrics
    perf_df = get_performance_metrics(full_history)
    
    # 3. Fetch Fundamentals
    fund_df = fetch_fundamentals(TICKERS)
    
    if not fund_df.empty:
        if not perf_df.empty:
            final_df = pd.merge(fund_df, perf_df, on='Ticker', how='left')
        else:
            final_df = fund_df

        final_df = final_df.replace({np.nan: None})
        
        history_records = []
        if not full_history.empty:
            try:
                chart_history = full_history[full_history.index >= (datetime.now() - timedelta(days=365))]
                chart_history = chart_history.reset_index()
                
                if 'Date' in chart_history.columns:
                    chart_history['Date'] = chart_history['Date'].dt.strftime('%Y-%m-%d')
                    history_records = chart_history.to_dict(orient='records')
                else:
                    logger.warning("Date column missing after reset_index")
            except Exception as e:
                logger.error(f"Error processing chart history: {e}")
        else:
            logger.warning("Full history DataFrame is empty, skipping chart data.")

        public_dir = os.path.join('..', 'dashboard', 'public')
        os.makedirs(public_dir, exist_ok=True)
        
        fund_json = os.path.join(public_dir, 'latest_fundamentals.json')
        final_df.to_json(fund_json, orient='records')
        
        hist_json = os.path.join(public_dir, 'latest_history.json')
        pd.DataFrame(history_records).to_json(hist_json, orient='records')
        
        logger.info(f"Data exported to: {public_dir}")
        return final_df.to_dict(orient='records'), history_records
    else:
        logger.error("Pipeline failed: Empty data.")
        return [], []

if __name__ == "__main__":
    run_pipeline()