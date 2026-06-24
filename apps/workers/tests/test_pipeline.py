"""
Tests for the analysis pipeline — normaliser + detector + summariser.
Uses realistic Ess Gee Group sample data.
"""
import pytest
import sys
sys.path.insert(0, '/home/claude/reportiq/apps/workers/src')

from analysis.normaliser import DataNormaliser
from analysis.anomaly.detector import AnomalyDetector

# ── Sample data (sell-out report) ─────────────────────────────────────────────

SELL_OUT_DATA = [
    {'Date': '2024-06-17', 'Brand': 'Adidas', 'Store Name': 'Rohini Mall',  'SKU Code': 'AD-UB22-BLK-8', 'Revenue (INR)': 182000, 'Units Sold': 14, 'Return Units': 0},
    {'Date': '2024-06-17', 'Brand': 'Reebok', 'Store Name': 'Pitampura',    'SKU Code': 'RB-CLS-WHT-6',  'Revenue (INR)': 64000,  'Units Sold': 8,  'Return Units': 1},
    {'Date': '2024-06-17', 'Brand': 'Adidas', 'Store Name': 'Lajpat Nagar', 'SKU Code': 'AD-STN-WHT-9',  'Revenue (INR)': 45000,  'Units Sold': 5,  'Return Units': 2},
]

PRIOR_SELL_OUT_DATA = [
    {'Date': '2024-06-10', 'Brand': 'Adidas', 'Store Name': 'Rohini Mall',  'SKU Code': 'AD-UB22-BLK-8', 'Revenue (INR)': 220000, 'Units Sold': 18, 'Return Units': 0},
    {'Date': '2024-06-10', 'Brand': 'Reebok', 'Store Name': 'Pitampura',    'SKU Code': 'RB-CLS-WHT-6',  'Revenue (INR)': 60000,  'Units Sold': 7,  'Return Units': 0},
    {'Date': '2024-06-10', 'Brand': 'Adidas', 'Store Name': 'Lajpat Nagar', 'SKU Code': 'AD-STN-WHT-9',  'Revenue (INR)': 90000,  'Units Sold': 10, 'Return Units': 0},
]

SCHEMA = {
    'columns': [
        {'originalName': 'Date',          'mappedName': 'date',         'dataType': 'date',   'role': 'date'},
        {'originalName': 'Brand',         'mappedName': 'brand',        'dataType': 'text',   'role': 'dimension'},
        {'originalName': 'Store Name',    'mappedName': 'store_name',   'dataType': 'text',   'role': 'dimension'},
        {'originalName': 'SKU Code',      'mappedName': 'sku_code',     'dataType': 'text',   'role': 'id'},
        {'originalName': 'Revenue (INR)', 'mappedName': 'revenue',      'dataType': 'number', 'role': 'metric'},
        {'originalName': 'Units Sold',    'mappedName': 'units_sold',   'dataType': 'number', 'role': 'metric'},
        {'originalName': 'Return Units',  'mappedName': 'return_units', 'dataType': 'number', 'role': 'metric'},
    ],
    'dateColumn':    'Date',
    'primaryMetric': 'Revenue (INR)',
}

THRESHOLDS = { 'dropAlertPct': 15, 'spikeAlertPct': 30, 'missingDataHrs': 24 }


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_normaliser_basic():
    normaliser = DataNormaliser()
    result = normaliser.normalise(
        raw_data       = SELL_OUT_DATA,
        report_id      = 'test-001',
        report_name    = 'Sell-out Test',
        report_type    = 'sell_out',
        connector_type = 'google_sheets',
        source_ref     = 'Sheet1',
        schema         = SCHEMA,
    )
    assert result.row_count == 3
    assert result.primary_metric == 'revenue'
    assert result.date_column == 'date'
    assert 'revenue' in result.df.columns
    assert 'brand' in result.df.columns
    print("✅ normaliser_basic passed")


def test_normaliser_currency_strip():
    """Normaliser should strip ₹ and commas from numeric columns."""
    data = [{'Date': '2024-06-17', 'Brand': 'Test', 'Store Name': 'S1', 'SKU Code': 'X',
             'Revenue (INR)': '₹1,82,000', 'Units Sold': '14', 'Return Units': '0'}]
    normaliser = DataNormaliser()
    result = normaliser.normalise(data, 'test-002', 'Test', 'sell_out', 'excel', 'file.xlsx', SCHEMA)
    assert result.df['revenue'].iloc[0] == 182000.0
    print("✅ normaliser_currency_strip passed")


def test_detector_drop_flag():
    """Detector should flag a drop when revenue falls more than dropAlertPct."""
    normaliser = DataNormaliser()
    current  = normaliser.normalise(SELL_OUT_DATA,       'r1', 'Test', 'sell_out', 'gs', 'S1', SCHEMA)
    previous = normaliser.normalise(PRIOR_SELL_OUT_DATA, 'r0', 'Test', 'sell_out', 'gs', 'S1', SCHEMA)

    detector = AnomalyDetector()
    report   = detector.detect(current, [previous], THRESHOLDS)

    # Total revenue dropped: 291000 → 182000 = ~37% drop — should be flagged
    flag_labels = [f.label for f in report.red_flags]
    assert any('drop' in l.lower() or 'revenue' in l.lower() or 'underperform' in l.lower() for l in flag_labels), \
        f"Expected a drop flag. Got: {flag_labels}"
    print(f"✅ detector_drop_flag passed — {len(report.red_flags)} red flags: {flag_labels}")


def test_detector_no_history():
    """Detector should still return stats even with no historical data."""
    normaliser = DataNormaliser()
    current  = normaliser.normalise(SELL_OUT_DATA, 'r1', 'Test', 'sell_out', 'gs', 'S1', SCHEMA)
    detector = AnomalyDetector()
    report   = detector.detect(current, [], THRESHOLDS)
    assert len(report.stats) >= 1
    print("✅ detector_no_history passed")


def test_dead_stock_detection():
    """Dead stock detector should flag SKUs idle for more than threshold days."""
    stock_data = [
        {'Date': '2024-06-17', 'Brand': 'Reebok', 'Store Name': 'Delhi', 'SKU Code': 'RB-HEX-GRY-9',
         'Stock on Hand': 340, 'Reorder Level': 50, 'Days Since Last Sale': 47},
        {'Date': '2024-06-17', 'Brand': 'Adidas', 'Store Name': 'Delhi', 'SKU Code': 'AD-UB22-BLK-8',
         'Stock on Hand': 14, 'Reorder Level': 20, 'Days Since Last Sale': 1},
    ]
    stock_schema = {
        'columns': [
            {'originalName': 'Date',                'mappedName': 'date',                 'dataType': 'date',   'role': 'date'},
            {'originalName': 'Brand',               'mappedName': 'brand',                'dataType': 'text',   'role': 'dimension'},
            {'originalName': 'Store Name',          'mappedName': 'store_name',           'dataType': 'text',   'role': 'dimension'},
            {'originalName': 'SKU Code',            'mappedName': 'sku_code',             'dataType': 'text',   'role': 'id'},
            {'originalName': 'Stock on Hand',       'mappedName': 'stock_on_hand',        'dataType': 'number', 'role': 'metric'},
            {'originalName': 'Reorder Level',       'mappedName': 'reorder_level',        'dataType': 'number', 'role': 'metric'},
            {'originalName': 'Days Since Last Sale','mappedName': 'days_since_last_sale', 'dataType': 'number', 'role': 'metric'},
        ],
        'dateColumn':    'Date',
        'primaryMetric': 'Stock on Hand',
    }
    normaliser = DataNormaliser()
    current  = normaliser.normalise(stock_data, 'r-stock', 'Stock', 'stock_inventory', 'tally', 'stock', stock_schema)
    detector = AnomalyDetector()
    report   = detector.detect(current, [], { 'dropAlertPct': 15, 'spikeAlertPct': 30, 'missingDataHrs': 24, 'deadStockDays': 30 })

    dead_labels = [f.label for f in report.red_flags if 'dead' in f.label.lower()]
    assert len(dead_labels) >= 1, f"Expected dead stock flag. Red flags: {[f.label for f in report.red_flags]}"
    assert len(report.dead_stock) >= 1
    print(f"✅ dead_stock_detection passed — {dead_labels}")


if __name__ == '__main__':
    test_normaliser_basic()
    test_normaliser_currency_strip()
    test_detector_drop_flag()
    test_detector_no_history()
    test_dead_stock_detection()
    print("\n✅ All Step 3 tests passed")
