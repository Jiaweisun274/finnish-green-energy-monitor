import pytest
import pandas as pd
import numpy as np
from data_pipeline import calculate_cagr, get_performance_metrics


def test_cagr_calculation():
    assert calculate_cagr(100, 121, 2) == pytest.approx(0.10, 0.01)
    
    assert calculate_cagr(100, 81, 2) == pytest.approx(-0.10, 0.01)
    
    # Edge cases
    assert calculate_cagr(0, 100, 2) is None
    assert calculate_cagr(100, 120, 0) is None
    assert calculate_cagr(None, 100, 2) is None

def test_performance_metrics_robustness():
    dates = pd.date_range(start='2023-01-01', periods=10)
    df = pd.DataFrame({
        'A': np.linspace(100, 110, 10),
        'B': [100, np.nan, 102, 103, np.nan, 105, 106, 107, 108, 109]
    }, index=dates)
    
    metrics = get_performance_metrics(df)

    assert len(metrics) == 2
    assert metrics[metrics['Ticker'] == 'A']['Price'].iloc[0] == 110.0
    assert metrics[metrics['Ticker'] == 'B']['Price'].iloc[0] == 109.0