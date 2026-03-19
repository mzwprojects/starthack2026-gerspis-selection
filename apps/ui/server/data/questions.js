// 40 investment education quiz questions
const questions = [
  {
    id: 1,
    question: "What does 'diversification' mean in investing?",
    options: ["Buying only one stock", "Spreading investments across different assets", "Investing all money at once", "Only investing in gold"],
    correct: 1,
    explanation: "Diversification means spreading your investments across different asset classes to reduce risk."
  },
  {
    id: 2,
    question: "What is the main benefit of long-term investing?",
    options: ["Quick profits", "Compound interest over time", "Avoiding all risk", "Tax evasion"],
    correct: 1,
    explanation: "Long-term investing allows compound interest to grow your wealth significantly over time."
  },
  {
    id: 3,
    question: "What is a stock market index?",
    options: ["A single company's stock price", "A basket of stocks representing a market segment", "A type of bond", "A savings account"],
    correct: 1,
    explanation: "An index like the SMI or Dow Jones tracks the performance of a group of stocks."
  },
  {
    id: 4,
    question: "What does 'volatility' refer to in finance?",
    options: ["The guaranteed return on investment", "The degree of price fluctuation", "The total value of a portfolio", "The interest rate of a bond"],
    correct: 1,
    explanation: "Volatility measures how much the price of an asset moves up and down over time."
  },
  {
    id: 5,
    question: "What is a bond?",
    options: ["Ownership in a company", "A loan you give to a government or company", "A type of cryptocurrency", "A share of profits"],
    correct: 1,
    explanation: "A bond is a fixed-income investment where you lend money and receive interest payments."
  },
  {
    id: 6,
    question: "What is the typical relationship between risk and return?",
    options: ["Higher risk = lower return", "Higher risk = higher potential return", "No relationship exists", "Lower risk = higher return"],
    correct: 1,
    explanation: "Generally, higher risk investments offer higher potential returns to compensate for the increased risk."
  },
  {
    id: 7,
    question: "What is an ETF?",
    options: ["A type of bank account", "A fund that tracks an index and trades like a stock", "A government bond", "A cryptocurrency exchange"],
    correct: 1,
    explanation: "An ETF (Exchange-Traded Fund) allows you to invest in many assets at once, like an index."
  },
  {
    id: 8,
    question: "What is inflation?",
    options: ["Stock prices going up", "The general increase in prices over time", "Interest rates dropping", "Currency getting stronger"],
    correct: 1,
    explanation: "Inflation erodes purchasing power — your money buys less over time if it just sits in a savings account."
  },
  {
    id: 9,
    question: "What is a 'bear market'?",
    options: ["A market that only sells animal products", "A market declining by 20% or more", "A very active trading day", "A market with only bonds"],
    correct: 1,
    explanation: "A bear market is when prices fall 20% or more from recent highs, often accompanied by pessimism."
  },
  {
    id: 10,
    question: "What is a 'bull market'?",
    options: ["A market with rising prices and optimism", "A market crash", "A market for commodities only", "A market that never changes"],
    correct: 0,
    explanation: "A bull market is characterized by rising prices, investor confidence, and economic growth."
  },
  {
    id: 11,
    question: "What is 'compound interest'?",
    options: ["Interest charged on loans only", "Earning interest on your interest", "A fixed rate that never changes", "Interest paid only once"],
    correct: 1,
    explanation: "Compound interest means you earn returns not just on your original investment, but also on accumulated gains."
  },
  {
    id: 12,
    question: "Why is 'time in the market' better than 'timing the market'?",
    options: ["Because day trading is illegal", "Because missing the best days dramatically reduces returns", "Because markets always go up", "Because brokers charge less"],
    correct: 1,
    explanation: "Studies show that missing just the 10 best trading days over 20 years can cut returns by more than half."
  },
  {
    id: 13,
    question: "What is a savings plan (Sparplan)?",
    options: ["A one-time large investment", "Regular automatic investments of a fixed amount", "A loan repayment plan", "A tax return strategy"],
    correct: 1,
    explanation: "A savings plan lets you invest small amounts regularly, benefiting from dollar-cost averaging."
  },
  {
    id: 14,
    question: "What is 'dollar-cost averaging'?",
    options: ["Always buying at the lowest price", "Investing the same amount at regular intervals", "Only investing in USD", "Buying currencies for profit"],
    correct: 1,
    explanation: "Dollar-cost averaging reduces risk by buying more shares when prices are low and fewer when prices are high."
  },
  {
    id: 15,
    question: "What is a dividend?",
    options: ["A fee for trading stocks", "A portion of company profits paid to shareholders", "The price of a stock", "A type of bond interest"],
    correct: 1,
    explanation: "Dividends are regular payments companies make to shareholders from their profits."
  },
  {
    id: 16,
    question: "What is the SMI?",
    options: ["A Swiss cryptocurrency", "The Swiss Market Index of the 20 largest Swiss companies", "A Swiss bank", "A type of investment fund"],
    correct: 1,
    explanation: "The SMI (Swiss Market Index) tracks the 20 most significant stocks on the Swiss stock exchange."
  },
  {
    id: 17,
    question: "What is the safest traditional asset class?",
    options: ["Stocks", "Cryptocurrencies", "Government bonds", "Options"],
    correct: 2,
    explanation: "Government bonds from stable countries are considered the safest because they're backed by the government."
  },
  {
    id: 18,
    question: "Why might gold be included in a portfolio?",
    options: ["It always increases in value", "It often acts as a hedge during market crises", "It pays high dividends", "It has zero risk"],
    correct: 1,
    explanation: "Gold is considered a 'safe haven' that often retains value during economic uncertainty."
  },
  {
    id: 19,
    question: "What is a 'panic sell'?",
    options: ["Selling when prices are at their peak", "Selling out of fear during a market drop", "Selling to buy a better stock", "A planned exit strategy"],
    correct: 1,
    explanation: "Panic selling locks in losses and is often the worst time to sell. Markets usually recover over time."
  },
  {
    id: 20,
    question: "What is an asset class?",
    options: ["A type of classroom", "A category of investments with similar characteristics", "A single specific stock", "A trading platform"],
    correct: 1,
    explanation: "Asset classes include stocks, bonds, real estate, commodities, and cash — each with different risk/return profiles."
  },
  {
    id: 21,
    question: "What does 'risk profile' mean?",
    options: ["Your credit score", "Your personal tolerance for investment risk", "The risk of a single stock", "A bank's rating"],
    correct: 1,
    explanation: "Your risk profile determines what mix of investments is appropriate for your goals and comfort level."
  },
  {
    id: 22,
    question: "What happens to bond prices when interest rates rise?",
    options: ["They go up", "They go down", "They stay the same", "They become worthless"],
    correct: 1,
    explanation: "Bond prices fall when interest rates rise because new bonds offer better returns, making existing ones less attractive."
  },
  {
    id: 23,
    question: "What is the Dow Jones Industrial Average?",
    options: ["A European stock index", "An index of 30 major US companies", "A type of mutual fund", "A cryptocurrency index"],
    correct: 1,
    explanation: "The Dow Jones tracks 30 large, publicly-owned companies trading on the NYSE and NASDAQ."
  },
  {
    id: 24,
    question: "What percentage of actively managed funds beat the market long-term?",
    options: ["About 90%", "About 50%", "Less than 20%", "100%"],
    correct: 2,
    explanation: "Studies consistently show that most active fund managers fail to beat their benchmark index over long periods."
  },
  {
    id: 25,
    question: "What is the 'Rule of 72'?",
    options: ["You need 72 stocks for diversification", "Divide 72 by the return rate to estimate doubling time", "Invest for at least 72 months", "Never invest more than 72% in stocks"],
    correct: 1,
    explanation: "At 8% annual return, your money doubles in roughly 72/8 = 9 years."
  },
  {
    id: 26,
    question: "What is a stock market crash?",
    options: ["A normal daily price change", "A sudden dramatic decline in stock prices", "When a stock exchange closes", "When a company goes public"],
    correct: 1,
    explanation: "Crashes are sudden drops often driven by panic, but historically markets have always recovered."
  },
  {
    id: 27,
    question: "What is the Euro Stoxx 50?",
    options: ["50 random European stocks", "An index of 50 leading Eurozone companies", "A European currency", "A type of European bond"],
    correct: 1,
    explanation: "The Euro Stoxx 50 represents the 50 largest and most liquid stocks in the Eurozone."
  },
  {
    id: 28,
    question: "Why is starting to invest early important?",
    options: ["Because stocks are cheaper for young people", "Because compound interest has more time to work", "Because you get special youth discounts", "Because markets are less volatile for beginners"],
    correct: 1,
    explanation: "Starting early gives compound interest decades to multiply your wealth — even small amounts grow significantly."
  },
  {
    id: 29,
    question: "What is the difference between saving and investing?",
    options: ["There is no difference", "Saving preserves capital; investing aims to grow it", "Investing is only for rich people", "Saving gives higher returns"],
    correct: 1,
    explanation: "Saving keeps money safe but inflation erodes it. Investing grows wealth but comes with some risk."
  },
  {
    id: 30,
    question: "What is market capitalization?",
    options: ["The daily trading volume", "The total value of a company's shares", "The profit a company makes", "The number of employees"],
    correct: 1,
    explanation: "Market cap = share price × total shares outstanding. It indicates the company's size."
  },
  {
    id: 31,
    question: "What is Bitcoin (BTC)?",
    options: ["A government-backed currency", "A decentralized digital cryptocurrency", "A type of stock", "A savings account"],
    correct: 1,
    explanation: "Bitcoin is a digital, decentralized currency — highly volatile but increasingly seen as an alternative asset."
  },
  {
    id: 32,
    question: "What is the typical long-term annual return of the stock market?",
    options: ["About 1-2%", "About 7-10%", "About 25-30%", "About 50%"],
    correct: 1,
    explanation: "Historically, broad stock market indices have returned roughly 7-10% annually over long periods."
  },
  {
    id: 33,
    question: "What is a portfolio?",
    options: ["A single stock holding", "A collection of different investments", "A bank account", "A trading strategy"],
    correct: 1,
    explanation: "A portfolio is your mix of investments across different asset classes, designed to match your risk profile."
  },
  {
    id: 34,
    question: "What is the biggest risk of NOT investing?",
    options: ["Owing taxes", "Losing money to inflation over time", "Getting scammed", "Missing dividend payments"],
    correct: 1,
    explanation: "With inflation at ~2% per year, money in a savings account loses purchasing power over time."
  },
  {
    id: 35,
    question: "What is the CHF?",
    options: ["A cryptocurrency", "The Swiss Franc, Switzerland's currency", "A stock market index", "A type of fund"],
    correct: 1,
    explanation: "CHF (Confoederatio Helvetica Franc) is the Swiss national currency, known as a safe-haven currency."
  },
  {
    id: 36,
    question: "What is a mutual fund?",
    options: ["A savings account at a bank", "A pool of money from many investors managed professionally", "A type of insurance", "A government program"],
    correct: 1,
    explanation: "Mutual funds pool money from many investors to buy a diversified portfolio of stocks, bonds, or other assets."
  },
  {
    id: 37,
    question: "What should you do during a market crash?",
    options: ["Panic sell everything immediately", "Stay calm and stay invested if your strategy is sound", "Invest all your savings at once", "Close your brokerage account"],
    correct: 1,
    explanation: "History shows that staying invested during crashes leads to recovery. Panic selling locks in losses."
  },
  {
    id: 38,
    question: "What is the main advantage of an ETF over a single stock?",
    options: ["ETFs always make money", "ETFs provide instant diversification", "ETFs have no fees", "ETFs are guaranteed by the government"],
    correct: 1,
    explanation: "By holding many stocks at once, ETFs reduce the risk of any single company tanking your portfolio."
  },
  {
    id: 39,
    question: "What is 'rebalancing' a portfolio?",
    options: ["Selling all investments", "Adjusting your asset mix back to your target allocation", "Adding more money to your account", "Changing your broker"],
    correct: 1,
    explanation: "Rebalancing keeps your portfolio aligned with your risk profile as different assets grow at different rates."
  },
  {
    id: 40,
    question: "How much money do you need to start investing?",
    options: ["At least CHF 10,000", "At least CHF 1,000", "You can start with as little as CHF 1 via savings plans", "You need at least CHF 100,000"],
    correct: 2,
    explanation: "Many platforms allow you to start investing with as little as CHF 1 per month through savings plans."
  }
];

module.exports = questions;
