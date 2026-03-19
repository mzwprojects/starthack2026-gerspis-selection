"""
Parse real market CSVs and compute annualized returns + volatility for each asset.
Used to calibrate the Monte Carlo simulation with real-world parameters.
"""
import csv
import math
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"


def _parse_number(s: str) -> float | None:
    """Parse a number string that may have commas, spaces, or be #N/A."""
    s = s.strip()
    if not s or s == "#N/A":
        return None
    s = s.replace(",", "").replace(" ", "")
    try:
        return float(s)
    except ValueError:
        return None


def _load_csv(filename: str) -> list[list[str]]:
    """Load a CSV file from the data directory."""
    filepath = DATA_DIR / filename
    with open(filepath, encoding="utf-8") as f:
        return list(csv.reader(f))


def _compute_annual_returns(prices: list[float]) -> list[float]:
    """
    Given a list of daily prices, compute approximate annual returns.
    Group by ~252 trading days per year.
    """
    if len(prices) < 252:
        return []
    annual_returns = []
    i = 0
    while i + 252 <= len(prices):
        start = prices[i]
        end = prices[i + 251]
        if start > 0:
            annual_returns.append((end - start) / start)
        i += 252
    return annual_returns


def _stats_from_prices(prices: list[float]) -> dict:
    """Compute annualized avg return and volatility from daily prices."""
    if len(prices) < 20:
        return {"avg_return": 0.0, "volatility": 0.0, "total_return": 0.0, "years": 0}

    # Daily log returns
    daily_returns = []
    for i in range(1, len(prices)):
        if prices[i - 1] > 0 and prices[i] > 0:
            daily_returns.append(math.log(prices[i] / prices[i - 1]))

    if not daily_returns:
        return {"avg_return": 0.0, "volatility": 0.0, "total_return": 0.0, "years": 0}

    # Annualize (252 trading days)
    avg_daily = sum(daily_returns) / len(daily_returns)
    var_daily = sum((r - avg_daily) ** 2 for r in daily_returns) / len(daily_returns)
    std_daily = math.sqrt(var_daily)

    avg_annual = avg_daily * 252
    vol_annual = std_daily * math.sqrt(252)

    years = len(daily_returns) / 252
    total_return = (prices[-1] - prices[0]) / prices[0] if prices[0] > 0 else 0

    return {
        "avg_return": round(avg_annual, 4),
        "volatility": round(vol_annual, 4),
        "total_return": round(total_return, 4),
        "years": round(years, 1),
    }


def _extract_prices(rows: list[list[str]], col_idx: int, data_start: int = 1) -> list[float]:
    """Extract valid price series from a column, skipping #N/A."""
    prices = []
    for row in rows[data_start:]:
        if col_idx < len(row):
            val = _parse_number(row[col_idx])
            if val is not None and val > 0:
                prices.append(val)
    return prices


def compute_all_stats() -> dict:
    """
    Parse all CSV files and return a dict of asset stats:
    { "asset_key": { "name": ..., "avg_return": ..., "volatility": ..., ... } }
    """
    stats = {}

    # ── Equity Indices ──
    try:
        rows = _load_csv("Market_Data - Equity Indices.csv")
        headers = rows[0]
        index_names = {
            1: ("smi", "SMI"),
            2: ("eurostoxx50", "Euro Stoxx 50"),
            3: ("dowjones", "Dow Jones"),
            4: ("nikkei", "Nikkei 225"),
            5: ("dax", "DAX"),
        }
        for col, (key, name) in index_names.items():
            prices = _extract_prices(rows, col)
            if prices:
                s = _stats_from_prices(prices)
                s["name"] = name
                s["category"] = "Equity Index"
                stats[key] = s
    except Exception as e:
        print(f"Warning: Could not parse Equity Indices: {e}")

    # ── SMI Single Stocks ──
    try:
        rows = _load_csv("Market_Data - SMI_Single Stocks.csv")
        companies = rows[0][1:]  # First row = company names
        tickers = rows[1][1:]    # Second row = tickers
        for i, (company, ticker) in enumerate(zip(companies, tickers)):
            col_idx = i + 1
            prices = _extract_prices(rows, col_idx, data_start=2)
            if prices and len(prices) > 252:
                s = _stats_from_prices(prices)
                s["name"] = company
                s["ticker"] = ticker
                s["category"] = "Single Stock"
                s["market"] = "SMI"
                key = ticker.lower().replace("-", "_")
                stats[key] = s
    except Exception as e:
        print(f"Warning: Could not parse SMI Stocks: {e}")

    # ── DJIA Single Stocks ──
    try:
        rows = _load_csv("Market_Data - DJIA_Single Stocks.csv")
        companies = rows[0][1:]
        tickers = rows[1][1:]
        for i, (company, ticker) in enumerate(zip(companies, tickers)):
            col_idx = i + 1
            prices = _extract_prices(rows, col_idx, data_start=2)
            if prices and len(prices) > 252:
                s = _stats_from_prices(prices)
                s["name"] = company
                s["ticker"] = ticker
                s["category"] = "Single Stock"
                s["market"] = "DJIA"
                key = ticker.lower().replace("-", "_")
                stats[key] = s
    except Exception as e:
        print(f"Warning: Could not parse DJIA Stocks: {e}")

    # ── Bonds ──
    try:
        rows = _load_csv("Market_Data - Bonds.csv")
        # Col 1: Swiss Bond AAA-BBB (Total Return Index)
        prices = _extract_prices(rows, 1)
        if prices:
            s = _stats_from_prices(prices)
            s["name"] = "Swiss Bonds"
            s["category"] = "Bonds"
            stats["swiss_bonds"] = s

        # Col 2: Bloomberg Global Aggregate
        prices = _extract_prices(rows, 2)
        if prices:
            s = _stats_from_prices(prices)
            s["name"] = "Global Bond Index"
            s["category"] = "Bonds"
            stats["global_bonds"] = s
    except Exception as e:
        print(f"Warning: Could not parse Bonds: {e}")

    # ── Gold ──
    try:
        rows = _load_csv("Market_Data - Gold.csv")
        # Col 2: Gold in CHF
        prices = _extract_prices(rows, 2)
        if prices:
            s = _stats_from_prices(prices)
            s["name"] = "Gold"
            s["category"] = "Commodity"
            stats["gold"] = s
    except Exception as e:
        print(f"Warning: Could not parse Gold: {e}")

    # ── FX ──
    try:
        rows = _load_csv("Market_Data - FX.csv")
        # Col 1: USDCHF
        prices = _extract_prices(rows, 1)
        if prices:
            s = _stats_from_prices(prices)
            s["name"] = "USD/CHF"
            s["category"] = "Currency"
            stats["usdchf"] = s

        # Col 2: EURCHF
        prices = _extract_prices(rows, 2)
        if prices:
            s = _stats_from_prices(prices)
            s["name"] = "EUR/CHF"
            s["category"] = "Currency"
            stats["eurchf"] = s
    except Exception as e:
        print(f"Warning: Could not parse FX: {e}")

    return stats


if __name__ == "__main__":
    """Run standalone to see computed stats."""
    all_stats = compute_all_stats()
    print(f"\n{'='*80}")
    print(f"{'Asset':<30} {'Avg Return':>12} {'Volatility':>12} {'Total Ret':>12} {'Years':>6}")
    print(f"{'='*80}")
    for key, s in sorted(all_stats.items(), key=lambda x: x[1].get("category", "")):
        cat = s.get("category", "")
        name = s.get("name", key)
        print(f"[{cat}] {name:<25} {s['avg_return']:>11.2%} {s['volatility']:>11.2%} {s['total_return']:>11.2%} {s['years']:>5.0f}")
