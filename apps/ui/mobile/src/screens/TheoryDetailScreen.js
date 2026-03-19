import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, Platform
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadows } from '../theme';

// Comprehensive theory content for each topic
const THEORY_CONTENT = {
  compound: {
    icon: '📈',
    title: 'Compound Interest',
    subtitle: 'The eighth wonder of the world',
    sections: [
      {
        heading: 'What is Compound Interest?',
        text: 'Compound interest is the process of earning interest on both your initial investment (principal) and on the interest that has already been earned. Unlike simple interest, which only calculates interest on the principal, compound interest creates a snowball effect where your money grows exponentially over time.',
      },
      {
        heading: 'The Math Behind It',
        text: 'The formula is: A = P × (1 + r)ⁿ, where A is the final amount, P is the principal, r is the annual return rate, and n is the number of years. For example, CHF 10,000 at 7% annual return:\n\n• After 10 years: CHF 19,672\n• After 20 years: CHF 38,697\n• After 30 years: CHF 76,123\n• After 40 years: CHF 149,745\n\nNotice how the growth accelerates — the last 10 years (30→40) add more than the first 30 years combined!',
      },
      {
        heading: 'The Rule of 72',
        text: 'A quick way to estimate how long it takes to double your money: divide 72 by your annual return rate.\n\n• At 7% return: 72 ÷ 7 ≈ 10.3 years to double\n• At 10% return: 72 ÷ 10 ≈ 7.2 years to double\n• At 2% (savings account): 72 ÷ 2 = 36 years to double\n\nThis is why investing at 7% is so much more powerful than saving at 2%.',
      },
      {
        heading: 'Why Starting Early Matters',
        text: 'Consider two investors:\n\n• Anna starts investing CHF 200/month at age 25 and stops at 35 (10 years, CHF 24,000 invested)\n• Ben starts investing CHF 200/month at age 35 and continues until 65 (30 years, CHF 72,000 invested)\n\nAt 7% annual return, Anna ends up with more money at 65 than Ben — despite investing only a third as much! This is because Anna\'s money had 40 years to compound, while Ben\'s had only 30.',
      },
      {
        heading: 'Real-World Impact',
        text: 'Warren Buffett, one of the world\'s most successful investors, made 99% of his wealth after age 50. His net worth at age 30 was about $1 million. By 56, it was $1.4 billion. By 90, over $100 billion. The same principle works for everyday investors — the key is to start early and stay consistent.',
      },
      {
        heading: 'Key Takeaway',
        text: 'Time is your greatest asset in investing. Even small amounts invested early can outperform large amounts invested later. The best time to start investing was yesterday — the second best time is today.',
      },
    ],
  },
  diversification: {
    icon: '🎯',
    title: 'Diversification',
    subtitle: "Don't put all your eggs in one basket",
    sections: [
      {
        heading: 'What is Diversification?',
        text: 'Diversification is the practice of spreading your investments across different types of assets to reduce risk. The idea is simple: if one investment loses value, others may gain, cushioning the overall impact on your portfolio.',
      },
      {
        heading: 'Types of Diversification',
        text: '1. Asset Class Diversification: Mix stocks, bonds, commodities, real estate, and cash\n\n2. Geographic Diversification: Invest in different countries and regions (Switzerland, USA, Europe, Asia)\n\n3. Sector Diversification: Spread across industries (technology, healthcare, finance, energy)\n\n4. Time Diversification: Invest at regular intervals (dollar-cost averaging) rather than all at once',
      },
      {
        heading: 'How It Reduces Risk',
        text: 'Different assets react differently to economic events:\n\n• During the 2008 financial crisis, stocks fell 50% but gold rose 25%\n• During COVID-19 (2020), tech stocks soared while travel stocks crashed\n• When interest rates rise, bonds fall but bank stocks often rise\n\nBy holding a mix of assets, your portfolio becomes more stable. Academic research shows diversification can reduce portfolio risk by 30-50% without significantly reducing expected returns.',
      },
      {
        heading: 'The Correlation Factor',
        text: 'The key to effective diversification is choosing assets that are not correlated — meaning they don\'t all move in the same direction at the same time.\n\n• Stocks and bonds: Often negatively correlated\n• Gold and stocks: Low correlation\n• US stocks and Swiss stocks: Moderately correlated\n• Bitcoin and stocks: Increasingly correlated in crises',
      },
      {
        heading: 'Common Mistakes',
        text: '• Over-Diversification: Owning 50 similar stocks doesn\'t add much diversification\n• Home Bias: Swiss investors often put 60%+ in Swiss stocks, missing global opportunities\n• Ignoring Bonds: Young investors often skip bonds, but even 10-20% can significantly reduce volatility\n• Thinking Crypto = Diversification: Crypto has become increasingly correlated with tech stocks',
      },
      {
        heading: 'Key Takeaway',
        text: 'A well-diversified portfolio is the closest thing to a "free lunch" in investing. It allows you to capture market returns while sleeping better at night. Aim for at least 3-4 different asset classes across multiple regions.',
      },
    ],
  },
  riskreturn: {
    icon: '⚖️',
    title: 'Risk vs. Return',
    subtitle: 'Understanding the fundamental tradeoff',
    sections: [
      {
        heading: 'The Risk-Return Principle',
        text: 'In investing, risk and return are fundamentally linked. To earn higher potential returns, you must accept higher risk. There is no such thing as a high-return, no-risk investment — and anyone who promises otherwise is either lying or doesn\'t understand finance.',
      },
      {
        heading: 'Risk Spectrum',
        text: 'From lowest to highest risk and return:\n\n1. Savings Account (0.5-1% return, ~0% risk)\n2. Government Bonds (2-3% return, very low risk)\n3. Corporate Bonds (3-5% return, low-medium risk)\n4. Blue-Chip Stocks (7-10% return, medium risk)\n5. Small-Cap Stocks (10-12% return, high risk)\n6. Emerging Markets (8-15% return, high risk)\n7. Cryptocurrency (potentially 40%+ return, very high risk)',
      },
      {
        heading: 'What is "Risk" in Investing?',
        text: 'Risk is typically measured by volatility — how much an investment\'s value fluctuates. A stock with 30% annual volatility might swing ±30% in a typical year.\n\n• Low volatility (5-10%): Bonds, savings\n• Medium volatility (15-20%): Stock indices (SMI, S&P 500)\n• High volatility (25-35%): Individual stocks\n• Very high volatility (60%+): Cryptocurrency',
      },
      {
        heading: 'The Sharpe Ratio',
        text: 'The Sharpe Ratio measures risk-adjusted return: how much excess return you earn per unit of risk.\n\nFormula: (Portfolio Return - Risk-Free Rate) / Portfolio Volatility\n\n• Sharpe > 1.0: Excellent risk-adjusted returns\n• Sharpe 0.5-1.0: Good\n• Sharpe 0.0-0.5: Below average\n• Sharpe < 0: Taking risk without adequate compensation\n\nA portfolio earning 8% with 10% volatility has a better Sharpe ratio than one earning 12% with 25% volatility.',
      },
      {
        heading: 'Your Risk Tolerance',
        text: 'Your ideal risk level depends on:\n\n• Time Horizon: Longer = more risk acceptable\n• Financial Situation: Emergency fund first, then invest\n• Sleep Test: Can you sleep if your portfolio drops 30%?\n• Age: Young investors can take more risk (decades to recover)\n\nA common rule of thumb: Hold your age as a percentage in bonds (e.g., age 25 = 25% bonds, 75% stocks).',
      },
      {
        heading: 'Key Takeaway',
        text: 'Don\'t chase returns blindly — always consider the risk you\'re taking to earn them. The goal isn\'t maximum return; it\'s the best return for an acceptable level of risk. Smart investing is about managing risk, not eliminating it.',
      },
    ],
  },
  timeinmarket: {
    icon: '⏰',
    title: 'Time in the Market',
    subtitle: 'Why patience always wins',
    sections: [
      {
        heading: 'Time in the Market vs. Timing the Market',
        text: '"Time in the market beats timing the market" is one of the most proven principles in investing. It means that staying invested consistently over long periods produces better results than trying to predict when to buy and sell.',
      },
      {
        heading: 'The Cost of Missing the Best Days',
        text: 'Research from JP Morgan on the S&P 500 (1999-2019):\n\n• Fully invested: 6.06% annual return\n• Missed 10 best days: 2.44% annual return\n• Missed 20 best days: 0.08% annual return\n• Missed 30 best days: -1.95% annual return\n\n$10,000 invested in 1999 became $32,421 if you stayed invested. Missing just the 10 best days turned it into $16,180 — losing almost half the gains!',
      },
      {
        heading: 'Why Timing Doesn\'t Work',
        text: '• The best days often occur right after the worst days (during recovery)\n• Professional fund managers fail to consistently time the market — 90%+ underperform index funds over 15+ years\n• In 2020, the market crashed 34% in March but recovered to new highs by August — those who sold in March missed an enormous rally\n• Emotional decisions (panic selling, FOMO buying) consistently lead to buying high and selling low',
      },
      {
        heading: 'Historical Perspective',
        text: 'Despite wars, pandemics, financial crises, and recessions:\n\n• The S&P 500 has never lost money over any 20-year rolling period in its history\n• The SMI has returned approximately 7% annually over the past 30 years\n• Every single market crash in history has been followed by a recovery to new highs\n• The 2008 crisis saw a 50% drop — by 2013, markets had fully recovered and went on to triple in the next decade',
      },
      {
        heading: 'The Power of Staying Invested',
        text: 'Consider CHF 10,000 invested in 1990:\n\n• Kept in savings (1% avg): CHF 13,809 in 2024\n• Invested in SMI (7% avg): CHF 97,339 in 2024\n• Invested in S&P 500 (10% avg): CHF 289,002 in 2024\n\nThe investor who stayed invested earned 7x to 21x more than the saver — without doing anything other than waiting.',
      },
      {
        heading: 'Key Takeaway',
        text: 'Invest regularly, stay the course, and ignore short-term noise. The market will have bad days, bad months, and even bad years. But over decades, it has consistently rewarded patient investors. Your greatest edge is time and consistency.',
      },
    ],
  },
  dca: {
    icon: '💰',
    title: 'Dollar-Cost Averaging',
    subtitle: 'Invest regularly, regardless of market conditions',
    sections: [
      {
        heading: 'What is Dollar-Cost Averaging?',
        text: 'Dollar-Cost Averaging (DCA) is an investment strategy where you invest a fixed amount of money at regular intervals (e.g., CHF 500 per month), regardless of what the market is doing. You buy more shares when prices are low and fewer shares when prices are high.',
      },
      {
        heading: 'How It Works',
        text: 'Example: Investing CHF 300/month in an ETF:\n\n• January: Price CHF 100, buy 3 shares\n• February: Price CHF 75 (market drops), buy 4 shares\n• March: Price CHF 60 (crash!), buy 5 shares\n• April: Price CHF 80 (recovery), buy 3.75 shares\n• May: Price CHF 100 (full recovery), buy 3 shares\n\nTotal invested: CHF 1,500\nTotal shares: 18.75\nAverage cost per share: CHF 80\nCurrent value at CHF 100/share: CHF 1,875\nProfit: CHF 375 (25%!)\n\nYou profited because DCA automatically bought more shares when they were cheap.',
      },
      {
        heading: 'DCA vs. Lump Sum',
        text: 'Academic studies show that lump sum investing (investing everything at once) slightly outperforms DCA about 65% of the time, because markets trend upward.\n\nHowever, DCA offers significant psychological advantages:\n• Reduces regret of investing everything at a peak\n• Smooths out volatility in your purchase prices\n• Builds disciplined investing habits\n• Makes investing accessible with smaller amounts\n• Especially beneficial in volatile or uncertain markets',
      },
      {
        heading: 'Practical Implementation',
        text: 'How to set up DCA:\n\n1. Choose a fixed monthly amount (e.g., CHF 200-500)\n2. Set a fixed day (e.g., 1st of every month)\n3. Choose your investments (e.g., diversified ETF)\n4. Set up automatic transfers if possible\n5. Don\'t look at daily prices — check quarterly at most\n\nMost Swiss brokers and robo-advisors support automatic DCA plans.',
      },
      {
        heading: 'Common Mistakes',
        text: '• Stopping during downturns: This is the worst time to stop — you should be excited to buy cheap!\n• Investing inconsistently: The key is regularity, not amount\n• Over-trading: DCA works best with simple, diversified investments\n• Checking too frequently: Daily price-checking leads to emotional decisions',
      },
      {
        heading: 'Key Takeaway',
        text: 'DCA is the simplest, most stress-free way to build wealth over time. It removes the need to "time the market" and turns investing into a simple monthly habit — like paying rent or a subscription. Start small, stay consistent, and let time do the work.',
      },
    ],
  },
  inflation: {
    icon: '🔥',
    title: 'Inflation: The Silent Tax',
    subtitle: 'Why doing nothing costs you money',
    sections: [
      {
        heading: 'What is Inflation?',
        text: 'Inflation is the gradual increase in prices of goods and services over time. When inflation is 2%, something that costs CHF 100 today will cost CHF 102 next year. This means your money buys less and less over time if it just sits in a bank account.',
      },
      {
        heading: 'The Impact on Cash',
        text: 'At 2% annual inflation (Switzerland\'s typical rate):\n\n• CHF 10,000 today = CHF 8,171 in purchasing power after 10 years\n• CHF 10,000 today = CHF 6,676 in purchasing power after 20 years\n• CHF 10,000 today = CHF 5,456 in purchasing power after 30 years\n\nYou still have CHF 10,000 in your account, but it buys almost half as much! This is why inflation is called the "silent tax" — it erodes your wealth without you noticing.',
      },
      {
        heading: 'Why Savings Accounts Lose Money',
        text: 'Most Swiss savings accounts pay 0.5-1.0% interest. With 2% inflation:\n\n• Real return = Nominal return - Inflation\n• Real return = 1.0% - 2.0% = -1.0%\n\nYou\'re actually losing 1% of purchasing power every year! Over 20 years, your CHF 10,000 in a savings account might nominally grow to CHF 12,202, but in real purchasing power, it\'s only worth CHF 9,982. You\'ve lost money just by "saving."',
      },
      {
        heading: 'How Investments Beat Inflation',
        text: 'Historical real returns (after inflation):\n\n• Savings account: -0.5% to -1.5% per year\n• Government bonds: +0.5% to +1.5% per year\n• Stock market (global): +5% to +7% per year\n• Gold: +2% to +3% per year\n• Real estate: +2% to +4% per year\n\nStocks have been the most reliable long-term inflation hedge, consistently delivering positive real returns over any 20+ year period.',
      },
      {
        heading: 'Hyperinflation: The Extreme Case',
        text: 'While Switzerland has very stable, low inflation, some countries have experienced hyperinflation:\n\n• Germany (1923): Prices doubled every 3.7 days\n• Zimbabwe (2008): 79.6 billion % monthly inflation\n• Venezuela (2018): Over 1,000,000% annual inflation\n• Turkey (2022): Over 80% annual inflation\n\nThese extreme cases show why diversifying globally and holding real assets (stocks, gold, real estate) protects against monetary instability.',
      },
      {
        heading: 'Key Takeaway',
        text: 'Keeping all your money in cash or savings is not "safe" — it guarantees you\'ll lose purchasing power every year. The real risk is not investing. Even conservative investments like bonds and diversified stock indices protect your wealth from the erosion of inflation. The first step is understanding that your "safe" savings account is actually costing you money.',
      },
    ],
  },
};

export default function TheoryDetailScreen({ navigation, route }) {
  const { topicId } = route.params;
  const topic = THEORY_CONTENT[topicId];

  if (!topic) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 48, marginBottom: spacing.md }}>❓</Text>
        <Text style={{ fontSize: fontSize.lg, color: colors.textPrimary }}>Topic not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={{ fontSize: 36, marginRight: spacing.sm }}>{topic.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{topic.title}</Text>
            <Text style={styles.headerSub}>{topic.subtitle}</Text>
          </View>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl * 2 }} showsVerticalScrollIndicator={false}>
        {topic.sections.map((section, i) => (
          <View key={i} style={styles.sectionCard}>
            <View style={styles.sectionNumberBadge}>
              <Text style={styles.sectionNumber}>{i + 1}</Text>
            </View>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionText}>{section.text}</Text>
          </View>
        ))}
        <View style={styles.bottomCard}>
          <Text style={{ fontSize: 28, marginBottom: spacing.sm }}>🎓</Text>
          <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs }}>
            Knowledge is Power
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
            Understanding these concepts puts you ahead of 90% of investors who make decisions based on emotions rather than knowledge.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  backText: { color: colors.textOnDark, fontSize: fontSize.md, marginBottom: spacing.md },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textOnDark },
  headerSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  sectionNumberBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionNumber: { fontSize: fontSize.sm, fontWeight: '800', color: colors.primary },
  sectionHeading: {
    fontSize: fontSize.lg, fontWeight: '700',
    color: colors.textPrimary, marginBottom: spacing.sm,
  },
  sectionText: {
    fontSize: fontSize.sm, color: colors.textSecondary,
    lineHeight: 22,
  },
  bottomCard: {
    backgroundColor: colors.accent + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
});
