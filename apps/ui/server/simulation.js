// Monte Carlo-style market simulation engine with yearly interactive events
const assets = require('./data/assets');
const events = require('./data/events');
const tips = require('./data/tips');
const questions = require('./data/questions');
const decisions = require('./data/decisions');

/**
 * Run a market simulation with yearly interactive events.
 * Each year, the player encounters one of: Tip, Quiz Question, or Crisis Decision.
 */
function runSimulation({ years, totalBudget, allocation }) {
  const assetMap = {};
  assets.forEach(a => { assetMap[a.id] = a; });

  // Build portfolio from allocation
  const portfolio = {};
  let totalPct = 0;
  for (const [assetId, pct] of Object.entries(allocation)) {
    if (pct > 0 && assetMap[assetId]) {
      portfolio[assetId] = {
        asset: assetMap[assetId],
        percentage: pct,
        amount: totalBudget * (pct / 100),
        history: [totalBudget * (pct / 100)]
      };
      totalPct += pct;
    }
  }

  if (totalPct < 99 || totalPct > 101) {
    return { error: `Allocation must sum to 100%. Current: ${totalPct}%` };
  }

  // Pick market events (crises) that will occur - roughly every 5 years
  const shuffledEvents = [...events].sort(() => Math.random() - 0.5);
  const eventYears = {};
  let eventIdx = 0;
  for (let y = 5; y <= years; y += 5) {
    if (eventIdx < shuffledEvents.length) {
      eventYears[y] = shuffledEvents[eventIdx];
      eventIdx++;
    }
  }

  // Pre-generate yearly interactive events (tip, quiz, or decision)
  const shuffledTips = [...tips].sort(() => Math.random() - 0.5);
  const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
  const shuffledDecisions = [...decisions].sort(() => Math.random() - 0.5);
  let tipIdx = 0, qIdx = 0, dIdx = 0;

  const yearlyInteractions = {};
  for (let y = 1; y <= years; y++) {
    // Distribute evenly: tip, quiz, decision in rotation with some randomness
    const roll = Math.random();
    if (roll < 0.33 && tipIdx < shuffledTips.length) {
      yearlyInteractions[y] = { type: 'tip', data: shuffledTips[tipIdx++] };
    } else if (roll < 0.66 && qIdx < shuffledQuestions.length) {
      yearlyInteractions[y] = { type: 'quiz', data: shuffledQuestions[qIdx++] };
    } else if (dIdx < shuffledDecisions.length) {
      yearlyInteractions[y] = { type: 'decision', data: shuffledDecisions[dIdx++] };
    } else if (tipIdx < shuffledTips.length) {
      yearlyInteractions[y] = { type: 'tip', data: shuffledTips[tipIdx++] };
    } else if (qIdx < shuffledQuestions.length) {
      yearlyInteractions[y] = { type: 'quiz', data: shuffledQuestions[qIdx++] };
    } else {
      // Fallback: recycle a random tip
      yearlyInteractions[y] = { type: 'tip', data: tips[Math.floor(Math.random() * tips.length)] };
    }
  }

  // Simulate year by year
  const yearlyData = [];
  let totalPortfolioHistory = [totalBudget];
  let saverAmount = totalBudget;
  const saverHistory = [totalBudget];
  const saverRate = 0.005;
  // Trader profile: aggressive short-term trader (higher volatility, fees, panic sells)
  let traderAmount = totalBudget;
  const traderHistory = [totalBudget];
  const traderFeeRate = 0.02; // 2% annual transaction costs from frequent trading
  const inflationRate = 0.02;
  let panicSells = 0;
  const triggeredEvents = [];

  for (let year = 1; year <= years; year++) {
    let yearEvent = eventYears[year] || null;
    let totalValue = 0;
    const yearReturns = {};

    for (const [assetId, pos] of Object.entries(portfolio)) {
      const asset = pos.asset;
      let yearReturn = gaussianRandom(asset.avgReturn, asset.volatility);
      
      if (yearEvent) {
        const impact = yearEvent.impacts[asset.category] || 0;
        yearReturn += impact;
      }

      yearReturn = Math.max(yearReturn, -0.60);
      yearReturn = Math.min(yearReturn, 1.50);

      pos.amount = pos.amount * (1 + yearReturn);
      pos.amount = Math.max(pos.amount, 0);
      pos.history.push(pos.amount);
      yearReturns[assetId] = yearReturn;
      totalValue += pos.amount;
    }

    saverAmount = saverAmount * (1 + saverRate);
    saverHistory.push(saverAmount);

    // Trader simulation: amplified volatility, fees, and panic selling tendency
    let traderReturn = gaussianRandom(0.06, 0.28); // higher vol, slightly lower mean
    if (yearEvent) {
      // Trader panics during events -> sells at bottom (-15% extra loss)
      traderReturn -= 0.15;
    }
    traderReturn = Math.max(traderReturn, -0.60);
    traderReturn = Math.min(traderReturn, 1.50);
    traderAmount = traderAmount * (1 + traderReturn) * (1 - traderFeeRate);
    traderAmount = Math.max(traderAmount, 0);
    traderHistory.push(traderAmount);

    const previousTotal = totalPortfolioHistory[totalPortfolioHistory.length - 1];
    const yearChange = (totalValue - previousTotal) / previousTotal;
    if (yearChange < -0.15) {
      panicSells++;
    }

    totalPortfolioHistory.push(totalValue);

    if (yearEvent) {
      triggeredEvents.push({ year, ...yearEvent });
    }

    // Get the interactive event for this year
    const interaction = yearlyInteractions[year] || null;

    yearlyData.push({
      year,
      totalValue: Math.round(totalValue),
      yearReturn: yearChange,
      // Market crisis event (for portfolio impact display)
      event: yearEvent ? { title: yearEvent.title, icon: yearEvent.icon, description: yearEvent.description, lesson: yearEvent.lesson } : null,
      // Interactive event (tip, quiz, or decision) — shown every year
      interaction: interaction,
      assetReturns: yearReturns
    });
  }

  // Calculate final results
  const finalValue = totalPortfolioHistory[totalPortfolioHistory.length - 1];
  const totalReturn = finalValue - totalBudget;
  const totalReturnPct = (totalReturn / totalBudget) * 100;
  
  const uniqueCategories = new Set(Object.values(portfolio).map(p => p.asset.category));
  const diversificationScore = Math.min(100, Math.round((uniqueCategories.size / 5) * 60 + (Object.keys(portfolio).length / 6) * 40));

  // --- RISK-RETURN RATIO ---
  // Calculate annualized return
  const cagr = Math.pow(finalValue / totalBudget, 1 / years) - 1;
  const annualizedReturnPct = Math.round(cagr * 1000) / 10;

  // Calculate portfolio volatility (std dev of yearly returns)
  const yearlyReturns = yearlyData.map(y => y.yearReturn);
  const avgReturn = yearlyReturns.reduce((a, b) => a + b, 0) / yearlyReturns.length;
  const variance = yearlyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / yearlyReturns.length;
  const volatility = Math.sqrt(variance);
  const volatilityPct = Math.round(volatility * 1000) / 10;

  // Risk-adjusted return (Sharpe-like: excess return over risk-free / volatility)
  const riskFreeRate = 0.005; // 0.5% savings rate
  const excessReturn = cagr - riskFreeRate;
  const sharpeRatio = volatility > 0 ? Math.round((excessReturn / volatility) * 100) / 100 : 0;

  // Risk-return grade (penalizes high risk for marginal returns)
  let riskReturnGrade;
  if (sharpeRatio >= 0.8) riskReturnGrade = 'A';
  else if (sharpeRatio >= 0.5) riskReturnGrade = 'B';
  else if (sharpeRatio >= 0.2) riskReturnGrade = 'C';
  else if (sharpeRatio >= 0) riskReturnGrade = 'D';
  else riskReturnGrade = 'F';

  // Weighted portfolio risk level (high volatility assets weighted by allocation %)
  const weightedRisk = Object.entries(portfolio).reduce((sum, [id, pos]) => {
    return sum + (pos.asset.volatility * pos.percentage / 100);
  }, 0);
  const riskLevel = weightedRisk > 0.25 ? 'Aggressive' : weightedRisk > 0.15 ? 'Moderate' : 'Conservative';

  // --- INVESTOR SCORE (risk-adjusted) ---
  let investorScore = 0;
  // Points for positive return (max 20)
  if (totalReturn > 0) investorScore += 15;
  if (totalReturnPct > 20) investorScore += 5;
  // Points for diversification (max 30)
  investorScore += Math.round(diversificationScore * 0.30);
  // Points for risk-adjusted return (max 30) — THIS is key: high risk with low return = bad
  investorScore += Math.max(0, Math.min(30, Math.round(sharpeRatio * 30)));
  // Points for not experiencing extreme drawdowns (max 20)
  investorScore += Math.max(0, 20 - panicSells * 6);

  investorScore = Math.min(100, Math.max(0, investorScore));

  const costOfFear = Math.round(Math.abs(totalReturn) * 0.15 * panicSells);

  const lessons = [];
  if (totalReturn > 0) {
    lessons.push({ icon: "📊", text: "Markets go up and down — that's normal, not failure." });
  }
  lessons.push({ icon: "⏰", text: "Time in the market beats timing the market." });
  if (uniqueCategories.size >= 3) {
    lessons.push({ icon: "🎯", text: "Diversification reduces your risk without killing returns." });
  }
  if (panicSells > 0) {
    lessons.push({ icon: "💪", text: "Staying invested during crashes is the hardest — and smartest — move." });
  }
  if (totalReturn > saverAmount - totalBudget) {
    lessons.push({ icon: "🚀", text: "Investing beats saving — your money works harder for you." });
  }
  if (sharpeRatio < 0.3 && weightedRisk > 0.2) {
    lessons.push({ icon: "⚠️", text: "Taking more risk didn't pay off here. A balanced portfolio often performs better risk-adjusted." });
  }

  return {
    summary: {
      investorScore,
      finalValue: Math.round(finalValue),
      totalReturn: Math.round(totalReturn),
      totalReturnPct: Math.round(totalReturnPct * 10) / 10,
      saverFinalValue: Math.round(saverAmount),
      saverInflationLoss: Math.round(totalBudget * (1 - 1 / Math.pow(1 + inflationRate, years))),
      costOfFear,
      panicSells,
      diversificationScore,
      lessons,
      // Risk-return metrics
      annualizedReturnPct,
      volatilityPct,
      sharpeRatio,
      riskReturnGrade,
      riskLevel
    },
    yearlyData,
    portfolioHistory: totalPortfolioHistory.map(Math.round),
    saverHistory: saverHistory.map(Math.round),
    traderHistory: traderHistory.map(Math.round),
    // Per-asset histories for individual asset chart
    assetHistories: Object.fromEntries(
      Object.entries(portfolio).map(([id, pos]) => [id, {
        name: pos.asset.name,
        icon: pos.asset.icon,
        category: pos.asset.category,
        history: pos.history.map(Math.round),
        percentage: pos.percentage,
      }])
    ),
    triggeredEvents,
    years,
    totalBudget
  };
}

function gaussianRandom(mean, stdDev) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

module.exports = { runSimulation };
