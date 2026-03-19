// Investment asset definitions with realistic return/volatility parameters
const assets = [
  // Equity Indices
  {
    id: "smi",
    name: "SMI",
    fullName: "Swiss Market Index",
    category: "Equity Index",
    icon: "🇨🇭",
    avgReturn: 0.07,       // 7% annual
    volatility: 0.16,      // 16% std dev
    description: "Top 20 Swiss companies including Nestlé, Novartis, and Roche.",
    infoText: "The Swiss Market Index (SMI) is Switzerland's most important stock index. It tracks the 20 largest and most liquid companies listed on the SIX Swiss Exchange. Key holdings include Nestlé (food & beverages), Novartis and Roche (pharmaceuticals), Zurich Insurance, and UBS. The SMI covers about 80% of Swiss market capitalization. It's known for stability due to its heavy weighting in defensive sectors like healthcare and consumer staples. Founded in 1988, it has delivered an average annual return of around 7% historically."
  },
  {
    id: "eurostoxx50",
    name: "Euro Stoxx 50",
    fullName: "Euro Stoxx 50 Index",
    category: "Equity Index",
    icon: "🇪🇺",
    avgReturn: 0.065,
    volatility: 0.18,
    description: "50 leading Eurozone blue-chip companies.",
    infoText: "The Euro Stoxx 50 is a stock index of Eurozone stocks covering 50 of the largest and most liquid companies across 8 Eurozone countries. Major companies include LVMH (luxury goods), ASML (semiconductor equipment), TotalEnergies (energy), SAP (software), and Siemens (industrial). The index provides broad exposure to the European economy and is one of the most widely tracked benchmarks in Europe. It was introduced in 1998 alongside the launch of the Euro currency."
  },
  {
    id: "dowjones",
    name: "Dow Jones",
    fullName: "Dow Jones Industrial Average",
    category: "Equity Index",
    icon: "🇺🇸",
    avgReturn: 0.08,
    volatility: 0.17,
    description: "30 major US industrial companies including Apple and Microsoft.",
    infoText: "The Dow Jones Industrial Average (DJIA) is one of the oldest and most well-known stock market indices in the world, created by Charles Dow in 1896. It tracks 30 large, publicly owned blue-chip companies in the United States including Apple, Microsoft, Goldman Sachs, Walmart, and Boeing. Unlike most indices, the Dow is price-weighted rather than market-cap weighted. It has historically returned about 8% annually and is often seen as a barometer of the overall US economy."
  },
  // Single Stocks
  {
    id: "apple",
    name: "Apple",
    fullName: "Apple Inc. (AAPL)",
    category: "Single Stock",
    icon: "🍎",
    avgReturn: 0.15,
    volatility: 0.30,
    description: "World's most valuable tech company.",
    infoText: "Apple Inc. is an American multinational technology company headquartered in Cupertino, California. Founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in 1976, Apple designs, develops, and sells consumer electronics (iPhone, iPad, Mac, Apple Watch), software (iOS, macOS), and services (App Store, Apple Music, iCloud). As of 2024, Apple is one of the world's most valuable companies with a market capitalization exceeding $3 trillion. It's known for high profit margins and strong brand loyalty. Apple stock is highly volatile but has delivered exceptional long-term returns."
  },
  {
    id: "nestle",
    name: "Nestlé",
    fullName: "Nestlé S.A.",
    category: "Single Stock",
    icon: "🍫",
    avgReturn: 0.06,
    volatility: 0.14,
    description: "Swiss food and beverage giant — a defensive stock.",
    infoText: "Nestlé S.A. is the world's largest food and beverage company, headquartered in Vevey, Switzerland. Founded in 1866, it produces a vast range of products including Nescafé, KitKat, Maggi, Perrier, Purina pet food, and Gerber baby food. Nestlé operates in 188 countries and employs over 270,000 people. It's considered a 'defensive stock' because people continue buying food and beverages regardless of economic conditions, making its earnings relatively stable. The company has a long history of consistent dividend payments."
  },
  // Bonds
  {
    id: "bonds",
    name: "Bond Index",
    fullName: "Global Aggregate Bond Index",
    category: "Bonds",
    icon: "📄",
    avgReturn: 0.03,
    volatility: 0.05,
    description: "A mix of government and corporate bonds — low risk, low return.",
    infoText: "A Bond Index (like the Bloomberg Global Aggregate) tracks a broad portfolio of government and corporate bonds from around the world. Bonds are essentially loans you give to governments or companies — they pay you interest (the 'coupon') and return your money at maturity. Bonds are considered safer than stocks because bondholders get paid before shareholders if a company goes bankrupt. However, bond returns are typically lower. They serve as a stabilizer in a portfolio, reducing overall volatility. Central bank interest rate decisions strongly influence bond prices."
  },
  // Currencies
  {
    id: "usdchf",
    name: "USD/CHF",
    fullName: "US Dollar to Swiss Franc",
    category: "Currency",
    icon: "💵",
    avgReturn: -0.01,
    volatility: 0.08,
    description: "Exchange rate between US Dollar and Swiss Franc.",
    infoText: "USD/CHF represents the exchange rate between the US Dollar and the Swiss Franc. Currency investing (forex trading) involves speculating on whether one currency will strengthen or weaken relative to another. The Swiss Franc is considered a 'safe haven' currency, meaning it tends to strengthen during global crises. Historically, the USD has gradually weakened against the CHF due to Switzerland's lower inflation and strong economy. Currency investments are complex and influenced by interest rate differentials, trade balances, and geopolitical events."
  },
  {
    id: "eurchf",
    name: "EUR/CHF",
    fullName: "Euro to Swiss Franc",
    category: "Currency",
    icon: "💶",
    avgReturn: -0.015,
    volatility: 0.06,
    description: "Exchange rate between Euro and Swiss Franc.",
    infoText: "EUR/CHF represents the exchange rate between the Euro and the Swiss Franc. This is one of the most important currency pairs for Swiss investors because Switzerland's largest trading partner is the Eurozone. The Swiss National Bank (SNB) has historically intervened to prevent the Franc from becoming too strong against the Euro, most famously maintaining a 1.20 floor from 2011 to 2015. The Euro has generally weakened vs. the CHF over time, making this pair typically negative-returning for long-term holders."
  },
  // Commodities
  {
    id: "gold",
    name: "Gold",
    fullName: "Gold (XAU)",
    category: "Commodity",
    icon: "🥇",
    avgReturn: 0.05,
    volatility: 0.15,
    description: "Classic safe-haven asset that often rises during crises.",
    infoText: "Gold (chemical symbol Au) has been used as a store of value for thousands of years. As an investment, gold serves several purposes: it acts as a hedge against inflation (when money loses value, gold tends to rise), a safe haven during economic crises, and a portfolio diversifier. Gold can be invested in physically (bars, coins), through ETFs, or via mining company stocks. Its price is influenced by interest rates, USD strength, geopolitical tensions, and central bank buying. Gold doesn't produce income (no dividends/interest), so returns come purely from price appreciation."
  },
  // Crypto
  {
    id: "btc",
    name: "Bitcoin",
    fullName: "Bitcoin (BTC)",
    category: "Crypto",
    icon: "₿",
    avgReturn: 0.40,
    volatility: 0.70,
    description: "The original cryptocurrency — extremely volatile but high growth potential.",
    infoText: "Bitcoin is the first and most well-known cryptocurrency, created in 2009 by the pseudonymous Satoshi Nakamoto. It operates on a decentralized blockchain network with a fixed supply of 21 million coins. Bitcoin is often called 'digital gold' and is used as both a payment system and store of value. Its price is extremely volatile — it has experienced multiple 80%+ crashes and 1000%+ rallies. Key events affecting price include 'halving' events (every ~4 years reducing new supply), regulatory developments, and institutional adoption. Bitcoin is considered a very high-risk, high-reward investment."
  },
  {
    id: "eth",
    name: "Ethereum",
    fullName: "Ethereum (ETH)",
    category: "Crypto",
    icon: "⟠",
    avgReturn: 0.35,
    volatility: 0.75,
    description: "Smart contract platform — second largest crypto by market cap.",
    infoText: "Ethereum is the second-largest cryptocurrency by market capitalization, created by Vitalik Buterin in 2015. Unlike Bitcoin, Ethereum is a programmable blockchain that supports 'smart contracts' — self-executing programs that enable decentralized applications (dApps), DeFi (decentralized finance), and NFTs. In 2022, Ethereum transitioned from Proof-of-Work to Proof-of-Stake ('The Merge'), reducing its energy consumption by ~99%. ETH is used to pay transaction fees ('gas') on the network. Like Bitcoin, it's extremely volatile but has strong growth potential due to its technological utility."
  }
];

module.exports = assets;
