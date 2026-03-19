// Crisis decision scenarios based on real events from the last 20 years
// Each has 3 options with portfolio effects and educational feedback
const decisions = [
  {
    id: 1,
    title: "2008 Financial Crisis",
    icon: "🏦",
    description: "Banks are collapsing worldwide. Lehman Brothers is bankrupt. Your portfolio just lost 35%. Panic everywhere.",
    options: [
      { text: "Sell everything — too risky!", effect: -0.20, feedback: "You sold at the bottom and missed the recovery. Those who held recovered everything and more." },
      { text: "Hold and wait it out", effect: 0.0, feedback: "Correct! Those who stayed invested in 2008 experienced one of the strongest bull markets in history." },
      { text: "Buy more — stocks are cheap!", effect: 0.15, feedback: "Excellent! Buying during the crisis has historically produced the best returns." }
    ],
    lesson: "Panic selling destroys returns. Staying calm during crashes is rewarded."
  },
  {
    id: 2,
    title: "European Debt Crisis 2011",
    icon: "🇪🇺",
    description: "Greece is on the brink of bankruptcy. The Euro is shaking. European stocks are falling sharply.",
    options: [
      { text: "Dump European stocks", effect: -0.10, feedback: "The crisis was resolved and European stocks recovered. Selling was a mistake." },
      { text: "Keep portfolio unchanged", effect: 0.0, feedback: "Good decision. The ECB stabilized the market and prices recovered." },
      { text: "Shift to Swiss Franc and Gold", effect: 0.05, feedback: "Gold and CHF did rise, but long-term you miss out on equity returns." }
    ],
    lesson: "Regional crises feel dramatic but are usually resolved. Don't overreact."
  },
  {
    id: 3,
    title: "Swiss Franc Shock 2015",
    icon: "🇨🇭",
    description: "The Swiss National Bank removes the EUR/CHF floor. The Franc surges 20% in minutes. Swiss exporters are hit hard.",
    options: [
      { text: "Sell Swiss stocks immediately", effect: -0.08, feedback: "The initial panic was exaggerated. Swiss quality companies recovered quickly." },
      { text: "Wait and observe", effect: 0.0, feedback: "Right! After the shock, markets normalized. Patience paid off." },
      { text: "Buy foreign stocks (now cheaper in CHF)", effect: 0.10, feedback: "Clever! The strong Franc made foreign stocks suddenly cheaper for Swiss investors." }
    ],
    lesson: "Currency shocks are short-term. Long-term, investment quality is what matters."
  },
  {
    id: 4,
    title: "Brexit Referendum 2016",
    icon: "🇬🇧",
    description: "The UK votes to leave the EU. Markets are shocked. The Pound crashes. Uncertainty everywhere.",
    options: [
      { text: "Sell British investments", effect: -0.05, feedback: "The UK market recovered quickly. The weak Pound actually helped exporters." },
      { text: "Change nothing", effect: 0.0, feedback: "Correct. Political events cause short-term volatility but rarely change the long-term trend." },
      { text: "Shift to 'safe' government bonds", effect: -0.03, feedback: "Bonds offered protection but you would have missed the quick stock recovery." }
    ],
    lesson: "Political shocks feel dramatic but are usually irrelevant for long-term investors."
  },
  {
    id: 5,
    title: "COVID-19 Pandemic 2020",
    icon: "🦠",
    description: "Global lockdowns! The fastest crash in history: -34% in 23 days. Airports empty. The economy stops.",
    options: [
      { text: "Sell everything — it's the apocalypse!", effect: -0.25, feedback: "The recovery was the fastest ever. Those who sold in March 2020 missed +75% returns." },
      { text: "Keep my savings plan running", effect: 0.05, feedback: "Perfect! Your savings plan automatically bought cheap. Dollar-cost averaging in action!" },
      { text: "Buy more aggressively", effect: 0.20, feedback: "Fantastic decision. Those who bought in March 2020 partially doubled their investment." }
    ],
    lesson: "Even the worst pandemic couldn't stop markets permanently."
  },
  {
    id: 6,
    title: "Inflation Shock 2022",
    icon: "📈",
    description: "Inflation explodes to 8%+. Central banks aggressively raise rates. Stocks AND bonds fall simultaneously — a rare double hit!",
    options: [
      { text: "Exit stocks and hold cash", effect: -0.12, feedback: "Cash loses purchasing power massively at 8% inflation. That was a double loss." },
      { text: "Stay broadly diversified", effect: 0.0, feedback: "Right! Commodities and value stocks actually profited during inflation." },
      { text: "Shift to commodities and gold", effect: 0.08, feedback: "Smart! Real assets like gold and energy often perform well during inflation." }
    ],
    lesson: "Inflation is the saver's silent enemy. Real assets protect better than cash."
  },
  {
    id: 7,
    title: "Credit Suisse Collapse 2023",
    icon: "🏦",
    description: "Credit Suisse, one of the largest Swiss banks, is taken over by UBS. AT1 bonds become worthless. Trust crisis in the banking sector.",
    options: [
      { text: "Sell all bank stocks", effect: -0.08, feedback: "The banking sector stabilized. The panic was bigger than the actual damage." },
      { text: "Wait — only one bank affected", effect: 0.0, feedback: "Right. It was an isolated problem, not systemic risk like 2008." },
      { text: "Buy UBS stock — bargain!", effect: 0.12, feedback: "Clever! UBS acquired CS cheaply and the stock rose significantly afterward." }
    ],
    lesson: "Not every bank crisis is like 2008. Individual company problems ≠ systemic crisis."
  },
  {
    id: 8,
    title: "Crypto Crash & FTX Scandal",
    icon: "💥",
    description: "Crypto exchange FTX collapses. Bitcoin falls below $16,000. Billions in customer funds vanish. Is crypto dead?",
    options: [
      { text: "Sell all crypto", effect: -0.05, feedback: "Bitcoin later recovered to new all-time highs. Panic selling at lows is never ideal." },
      { text: "Keep a small crypto allocation (max 5%)", effect: 0.03, feedback: "Perfect! A small crypto allocation in a diversified portfolio is the smart approach." },
      { text: "Go all-in on Bitcoin — now or never!", effect: -0.15, feedback: "Too risky! Even though Bitcoin recovered, the volatility was extreme. Diversification is essential." }
    ],
    lesson: "Speculative assets belong in small doses only. Diversification protects."
  },
  {
    id: 9,
    title: "AI Boom & Nvidia Rally",
    icon: "🤖",
    description: "ChatGPT sparks an AI hype. Nvidia multiplies in value. Tech stocks dominate. Everyone's talking about AI investments. Should you jump in?",
    options: [
      { text: "Go all-in on Nvidia and tech", effect: 0.10, feedback: "Short-term gain, but concentration risk! When the bubble burst, concentrated investors lost big." },
      { text: "Hold a broad ETF (already includes tech)", effect: 0.05, feedback: "Perfect! An MSCI World ETF already includes the biggest tech companies. No overweighting needed." },
      { text: "Avoid tech — it's just hype", effect: -0.05, feedback: "AI wasn't just hype — it was a real revolution. Avoiding it entirely was too defensive." }
    ],
    lesson: "Trends can be real, but avoid concentration risk. Broad ETFs automatically participate."
  },
  {
    id: 10,
    title: "Ukraine War & Energy Crisis",
    icon: "⚡",
    description: "Russia invades Ukraine. Gas prices explode. Europe faces an energy crisis. Industrial stocks under pressure.",
    options: [
      { text: "Avoid European stocks completely", effect: -0.08, feedback: "Europe found alternatives. Many European stocks recovered faster than expected." },
      { text: "Stay diversified, add some energy", effect: 0.05, feedback: "Right! Energy companies profited from high prices. Diversification helped." },
      { text: "Invest in defense stocks", effect: 0.08, feedback: "Defense companies did surge. But ethical investing is also an important factor to consider." }
    ],
    lesson: "Geopolitical crises create winners and losers. Diversification is the best protection."
  },
  {
    id: 11,
    title: "Negative Interest Rates",
    icon: "📉",
    description: "The central bank introduces negative interest rates. You're paying the bank to hold your savings! Guaranteed losses on savings accounts.",
    options: [
      { text: "Hoard cash under the mattress", effect: -0.05, feedback: "Cash loses even more to inflation and you miss all returns." },
      { text: "Invest in dividend stocks", effect: 0.08, feedback: "Great idea! Dividend stocks offered positive real returns when rates were negative." },
      { text: "Buy real estate funds", effect: 0.06, feedback: "Smart! Low rates drove real estate prices up. A solid alternative investment." }
    ],
    lesson: "When saving costs money, investing becomes a necessity."
  },
  {
    id: 12,
    title: "GameStop & Meme Stock Frenzy",
    icon: "🎮",
    description: "Reddit users drive GameStop up 1,500%. FOMO is spreading. Should you join the 'revolution'?",
    options: [
      { text: "Jump in immediately — To the Moon! 🚀", effect: -0.15, feedback: "Most late buyers lost massive amounts. Meme stocks are not an investment strategy." },
      { text: "Watch but don't invest", effect: 0.0, feedback: "Smart! It was entertaining to watch but not a rational investment decision." },
      { text: "Put a small fun amount in (max 2%)", effect: -0.01, feedback: "Fair enough! A tiny fun bet doesn't hurt as long as the rest is seriously invested." }
    ],
    lesson: "FOMO is not an investment plan. Hype stocks are gambling, not investing."
  }
];

module.exports = decisions;
