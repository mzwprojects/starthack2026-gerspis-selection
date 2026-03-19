"""
Monte Carlo simulation engine – ported from simulation.js.
Returns the full simulation result in one call.
"""
import math
import random
from typing import Optional

from sqlmodel import Session, select
from app.models import Asset, Event, Tip, Question, Decision


def gaussian_random(mean: float, std_dev: float) -> float:
    u = 0.0
    v = 0.0
    while u == 0:
        u = random.random()
    while v == 0:
        v = random.random()
    z = math.sqrt(-2.0 * math.log(u)) * math.cos(2.0 * math.pi * v)
    return mean + z * std_dev


def run_simulation(
    session: Session,
    years: int,
    total_budget: float,
    allocation: dict,
) -> dict:
    """
    Run the full market simulation.
    allocation: { asset_id: percentage, ... } – must sum to ~100.
    """
    # Load data from DB
    assets_list = session.exec(select(Asset)).all()
    events_list = session.exec(select(Event)).all()
    tips_list = session.exec(select(Tip)).all()
    questions_list = session.exec(select(Question)).all()
    decisions_list = session.exec(select(Decision)).all()

    asset_map = {a.id: a for a in assets_list}

    # Build portfolio
    portfolio = {}
    total_pct = 0.0
    for asset_id, pct in allocation.items():
        pct = float(pct)
        if pct > 0 and asset_id in asset_map:
            a = asset_map[asset_id]
            amount = total_budget * (pct / 100.0)
            portfolio[asset_id] = {
                "asset": a,
                "percentage": pct,
                "amount": amount,
                "history": [amount],
            }
            total_pct += pct

    if total_pct < 99 or total_pct > 101:
        return {"error": f"Allocation must sum to 100%. Current: {total_pct}%"}

    # Pick market events ~ every 5 years
    shuffled_events = list(events_list)
    random.shuffle(shuffled_events)
    event_years = {}
    event_idx = 0
    for y in range(5, years + 1, 5):
        if event_idx < len(shuffled_events):
            event_years[y] = shuffled_events[event_idx]
            event_idx += 1

    # Pre-generate yearly interactive events
    shuffled_tips = list(tips_list)
    random.shuffle(shuffled_tips)
    shuffled_questions = list(questions_list)
    random.shuffle(shuffled_questions)
    shuffled_decisions = list(decisions_list)
    random.shuffle(shuffled_decisions)
    tip_idx = q_idx = d_idx = 0

    yearly_interactions: dict = {}
    for y in range(1, years + 1):
        roll = random.random()
        if roll < 0.33 and tip_idx < len(shuffled_tips):
            t = shuffled_tips[tip_idx]
            tip_idx += 1
            yearly_interactions[y] = {
                "type": "tip",
                "data": {"id": t.id, "icon": t.icon, "title": t.title, "text": t.text},
            }
        elif roll < 0.66 and q_idx < len(shuffled_questions):
            q = shuffled_questions[q_idx]
            q_idx += 1
            yearly_interactions[y] = {
                "type": "quiz",
                "data": {
                    "id": q.id,
                    "question": q.question,
                    "options": q.options,
                    "correct": q.correct,
                    "explanation": q.explanation,
                },
            }
        elif d_idx < len(shuffled_decisions):
            d = shuffled_decisions[d_idx]
            d_idx += 1
            yearly_interactions[y] = {
                "type": "decision",
                "data": {
                    "id": d.id,
                    "title": d.title,
                    "icon": d.icon,
                    "description": d.description,
                    "options": d.options,
                    "lesson": d.lesson,
                },
            }
        elif tip_idx < len(shuffled_tips):
            t = shuffled_tips[tip_idx]
            tip_idx += 1
            yearly_interactions[y] = {
                "type": "tip",
                "data": {"id": t.id, "icon": t.icon, "title": t.title, "text": t.text},
            }
        elif q_idx < len(shuffled_questions):
            q = shuffled_questions[q_idx]
            q_idx += 1
            yearly_interactions[y] = {
                "type": "quiz",
                "data": {
                    "id": q.id,
                    "question": q.question,
                    "options": q.options,
                    "correct": q.correct,
                    "explanation": q.explanation,
                },
            }
        else:
            # Fallback: random tip
            t = random.choice(tips_list)
            yearly_interactions[y] = {
                "type": "tip",
                "data": {"id": t.id, "icon": t.icon, "title": t.title, "text": t.text},
            }

    # ── Simulate year by year ─────────────────────────────────────────
    yearly_data = []
    total_portfolio_history = [total_budget]
    saver_amount = total_budget
    saver_history = [total_budget]
    saver_rate = 0.005

    trader_amount = total_budget
    trader_history = [total_budget]
    trader_fee_rate = 0.02
    inflation_rate = 0.02
    panic_sells = 0
    triggered_events = []

    for year in range(1, years + 1):
        year_event = event_years.get(year)
        total_value = 0.0
        year_returns = {}

        for asset_id, pos in portfolio.items():
            asset = pos["asset"]
            year_return = gaussian_random(asset.avg_return, asset.volatility)

            if year_event:
                impact = (year_event.impacts or {}).get(asset.category, 0)
                year_return += impact

            year_return = max(year_return, -0.60)
            year_return = min(year_return, 1.50)

            pos["amount"] = pos["amount"] * (1 + year_return)
            pos["amount"] = max(pos["amount"], 0)
            pos["history"].append(pos["amount"])
            year_returns[asset_id] = year_return
            total_value += pos["amount"]

        # Saver benchmark
        saver_amount *= 1 + saver_rate
        saver_history.append(saver_amount)

        # Trader benchmark
        trader_return = gaussian_random(0.06, 0.28)
        if year_event:
            trader_return -= 0.15
        trader_return = max(trader_return, -0.60)
        trader_return = min(trader_return, 1.50)
        trader_amount = trader_amount * (1 + trader_return) * (1 - trader_fee_rate)
        trader_amount = max(trader_amount, 0)
        trader_history.append(trader_amount)

        previous_total = total_portfolio_history[-1]
        year_change = (total_value - previous_total) / previous_total if previous_total else 0
        if year_change < -0.15:
            panic_sells += 1

        total_portfolio_history.append(total_value)

        if year_event:
            triggered_events.append({
                "year": year,
                "id": year_event.id,
                "title": year_event.title,
                "description": year_event.description,
                "lesson": year_event.lesson,
                "icon": year_event.icon,
                "impacts": year_event.impacts,
            })

        interaction = yearly_interactions.get(year)

        event_data = None
        if year_event:
            event_data = {
                "title": year_event.title,
                "icon": year_event.icon,
                "description": year_event.description,
                "lesson": year_event.lesson,
            }

        yearly_data.append({
            "year": year,
            "totalValue": round(total_value),
            "yearReturn": year_change,
            "event": event_data,
            "interaction": interaction,
            "assetReturns": year_returns,
        })

    # ── Final stats ───────────────────────────────────────────────────
    final_value = total_portfolio_history[-1]
    total_return = final_value - total_budget
    total_return_pct = (total_return / total_budget) * 100

    unique_categories = set(pos["asset"].category for pos in portfolio.values())
    diversification_score = min(
        100,
        round((len(unique_categories) / 5) * 60 + (len(portfolio) / 6) * 40),
    )

    cagr = (final_value / total_budget) ** (1 / years) - 1 if years > 0 else 0
    annualized_return_pct = round(cagr * 1000) / 10

    yearly_returns_list = [y["yearReturn"] for y in yearly_data]
    avg_ret = sum(yearly_returns_list) / len(yearly_returns_list) if yearly_returns_list else 0
    variance = sum((r - avg_ret) ** 2 for r in yearly_returns_list) / len(yearly_returns_list) if yearly_returns_list else 0
    vol = math.sqrt(variance)
    volatility_pct = round(vol * 1000) / 10

    risk_free_rate = 0.005
    excess_return = cagr - risk_free_rate
    sharpe_ratio = round((excess_return / vol) * 100) / 100 if vol > 0 else 0

    if sharpe_ratio >= 0.8:
        risk_return_grade = "A"
    elif sharpe_ratio >= 0.5:
        risk_return_grade = "B"
    elif sharpe_ratio >= 0.2:
        risk_return_grade = "C"
    elif sharpe_ratio >= 0:
        risk_return_grade = "D"
    else:
        risk_return_grade = "F"

    weighted_risk = sum(
        pos["asset"].volatility * pos["percentage"] / 100 for pos in portfolio.values()
    )
    if weighted_risk > 0.25:
        risk_level = "Aggressive"
    elif weighted_risk > 0.15:
        risk_level = "Moderate"
    else:
        risk_level = "Conservative"

    # Investor score
    investor_score = 0
    if total_return > 0:
        investor_score += 15
    if total_return_pct > 20:
        investor_score += 5
    investor_score += round(diversification_score * 0.30)
    investor_score += max(0, min(30, round(sharpe_ratio * 30)))
    investor_score += max(0, 20 - panic_sells * 6)
    investor_score = min(100, max(0, investor_score))

    cost_of_fear = round(abs(total_return) * 0.15 * panic_sells)

    lessons = []
    if total_return > 0:
        lessons.append({"icon": "📊", "text": "Markets go up and down — that's normal, not failure."})
    lessons.append({"icon": "⏰", "text": "Time in the market beats timing the market."})
    if len(unique_categories) >= 3:
        lessons.append({"icon": "🎯", "text": "Diversification reduces your risk without killing returns."})
    if panic_sells > 0:
        lessons.append({"icon": "💪", "text": "Staying invested during crashes is the hardest — and smartest — move."})
    if total_return > saver_amount - total_budget:
        lessons.append({"icon": "🚀", "text": "Investing beats saving — your money works harder for you."})
    if sharpe_ratio < 0.3 and weighted_risk > 0.2:
        lessons.append({"icon": "⚠️", "text": "Taking more risk didn't pay off here. A balanced portfolio often performs better risk-adjusted."})

    return {
        "summary": {
            "investorScore": investor_score,
            "finalValue": round(final_value),
            "totalReturn": round(total_return),
            "totalReturnPct": round(total_return_pct * 10) / 10,
            "saverFinalValue": round(saver_amount),
            "saverInflationLoss": round(total_budget * (1 - 1 / ((1 + inflation_rate) ** years))),
            "costOfFear": cost_of_fear,
            "panicSells": panic_sells,
            "diversificationScore": diversification_score,
            "lessons": lessons,
            "annualizedReturnPct": annualized_return_pct,
            "volatilityPct": volatility_pct,
            "sharpeRatio": sharpe_ratio,
            "riskReturnGrade": risk_return_grade,
            "riskLevel": risk_level,
        },
        "yearlyData": yearly_data,
        "portfolioHistory": [round(v) for v in total_portfolio_history],
        "saverHistory": [round(v) for v in saver_history],
        "traderHistory": [round(v) for v in trader_history],
        "assetHistories": {
            aid: {
                "name": pos["asset"].name,
                "icon": pos["asset"].icon,
                "category": pos["asset"].category,
                "history": [round(v) for v in pos["history"]],
                "percentage": pos["percentage"],
            }
            for aid, pos in portfolio.items()
        },
        "triggeredEvents": triggered_events,
        "years": years,
        "totalBudget": total_budget,
    }
