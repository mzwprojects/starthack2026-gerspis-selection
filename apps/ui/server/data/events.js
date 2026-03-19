// Historical market events with impacts on different asset classes
// impact values are multipliers applied to returns (-0.3 = 30% additional loss)
const events = [
  {
    id: 1,
    year: 2000,
    title: "Dot-Com Bubble Burst",
    description: "The internet stock bubble bursts. Tech stocks crash by over 75%. Investors who panicked lost everything.",
    lesson: "Hype-driven investing is dangerous. Diversification protects you.",
    icon: "💻",
    impacts: {
      "Equity Index": -0.25,
      "Single Stock": -0.35,
      "Bonds": 0.05,
      "Currency": 0.0,
      "Commodity": 0.05,
      "Crypto": 0.0
    }
  },
  {
    id: 2,
    year: 2001,
    title: "9/11 Attacks",
    description: "Terrorist attacks in New York shake the world economy. Markets plunge in the short term but recover.",
    lesson: "Even after the worst events, markets have always recovered.",
    icon: "🏢",
    impacts: {
      "Equity Index": -0.15,
      "Single Stock": -0.20,
      "Bonds": 0.03,
      "Currency": -0.02,
      "Commodity": 0.10,
      "Crypto": 0.0
    }
  },
  {
    id: 3,
    year: 2008,
    title: "Global Financial Crisis",
    description: "Banks collapse worldwide. The S&P 500 loses over 50%. Governments bail out the financial system.",
    lesson: "Even the worst crash in modern history was followed by a 10-year bull market.",
    icon: "🏦",
    impacts: {
      "Equity Index": -0.40,
      "Single Stock": -0.45,
      "Bonds": 0.02,
      "Currency": -0.05,
      "Commodity": -0.10,
      "Crypto": 0.0
    }
  },
  {
    id: 4,
    year: 2011,
    title: "European Debt Crisis",
    description: "Greece, Spain, and Italy face debt problems. The Euro weakens and European stocks suffer.",
    lesson: "Regional crises can affect your portfolio — global diversification helps.",
    icon: "🇪🇺",
    impacts: {
      "Equity Index": -0.15,
      "Single Stock": -0.10,
      "Bonds": -0.05,
      "Currency": -0.08,
      "Commodity": 0.10,
      "Crypto": 0.05
    }
  },
  {
    id: 5,
    year: 2015,
    title: "Swiss Franc Shock (SNB)",
    description: "The Swiss National Bank removes the EUR/CHF floor. The franc surges 20% in minutes. Swiss exporters suffer.",
    lesson: "Currency risk is real. Central bank decisions can cause sudden moves.",
    icon: "🇨🇭",
    impacts: {
      "Equity Index": -0.10,
      "Single Stock": -0.12,
      "Bonds": 0.02,
      "Currency": -0.15,
      "Commodity": 0.05,
      "Crypto": 0.0
    }
  },
  {
    id: 6,
    year: 2017,
    title: "Bitcoin Mania",
    description: "Bitcoin surges from $1,000 to nearly $20,000, then crashes 80%. Many retail investors lose their savings.",
    lesson: "Speculative assets can surge — but chasing hype is not investing.",
    icon: "🚀",
    impacts: {
      "Equity Index": 0.05,
      "Single Stock": 0.05,
      "Bonds": 0.0,
      "Currency": 0.0,
      "Commodity": 0.0,
      "Crypto": 0.80
    }
  },
  {
    id: 7,
    year: 2020,
    title: "COVID-19 Pandemic",
    description: "Global lockdowns trigger the fastest market crash in history (-34% in 23 days), followed by an equally fast recovery.",
    lesson: "Those who stayed invested recovered in months. Those who panic-sold missed the rebound.",
    icon: "🦠",
    impacts: {
      "Equity Index": -0.20,
      "Single Stock": -0.25,
      "Bonds": 0.03,
      "Currency": -0.03,
      "Commodity": 0.15,
      "Crypto": 0.30
    }
  },
  {
    id: 8,
    year: 2022,
    title: "Interest Rate Shock",
    description: "Central banks raise rates aggressively to fight inflation. Both stocks and bonds fall simultaneously — a rare double hit.",
    lesson: "Inflation and rising rates can hurt even 'safe' bonds. Stay diversified.",
    icon: "📈",
    impacts: {
      "Equity Index": -0.18,
      "Single Stock": -0.20,
      "Bonds": -0.15,
      "Currency": 0.05,
      "Commodity": 0.08,
      "Crypto": -0.50
    }
  },
  {
    id: 9,
    year: 2023,
    title: "AI Boom",
    description: "Artificial intelligence drives a massive tech rally. Nvidia and the 'Magnificent 7' tech stocks surge over 100%.",
    lesson: "Innovation creates new opportunities — but don't overconcentrate in one sector.",
    icon: "🤖",
    impacts: {
      "Equity Index": 0.15,
      "Single Stock": 0.25,
      "Bonds": 0.02,
      "Currency": 0.0,
      "Commodity": 0.0,
      "Crypto": 0.20
    }
  },
  {
    id: 10,
    year: 2024,
    title: "Global Recovery Rally",
    description: "Markets hit all-time highs as inflation cools and central banks signal rate cuts. Optimism returns.",
    lesson: "After every storm, the sun shines again. Long-term investors are rewarded.",
    icon: "☀️",
    impacts: {
      "Equity Index": 0.12,
      "Single Stock": 0.15,
      "Bonds": 0.05,
      "Currency": 0.02,
      "Commodity": 0.05,
      "Crypto": 0.40
    }
  }
];

module.exports = events;
