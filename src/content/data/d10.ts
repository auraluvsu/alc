import type { Module } from '../types'

export const d10: Module = {
  n: 10,
  title: 'Financial Data Analysis',
  tour: 'Added · Finance',
  summary: 'The core quantitative toolkit in pandas: simple vs log returns and compounding, volatility, Sharpe, drawdowns and VaR, beta and factor regressions, event studies, and a first backtest with costs that you can actually trust.',
  topics: ['Returns: simple vs log', 'Risk measures', 'Beta & factor regressions', 'Event studies', 'A first honest backtest'],
  cpp23: ['Not from the book: this module collects the finance material spread across McKinney\'s earlier editions and standard quant practice.'],
  lessons: [
    {
      id: 'returns',
      title: 'Returns: simple vs log',
      blocks: [
        { kind: 'analogy', text: "Simple returns are what your account statement shows: +10% then −10% leaves you at 99, not 100. Log returns are the same moves measured on a scale where they add up over time. Use simple returns to combine assets in a portfolio on one day (they add across assets); use log returns to add up one asset's returns over time." },
        { kind: 'code', code: `import pandas as pd, numpy as np

px = pd.Series([100.0, 110.0, 99.0])
simple = px.pct_change()          # NaN, 0.10, -0.10
log = np.log(px).diff()           # NaN, 0.0953, -0.1054

(1 + simple).prod() - 1           # -0.01: compound simple returns by multiplying
np.exp(log.sum()) - 1             # -0.01: or sum log returns then exponentiate
simple.sum()                      # 0.0: WRONG for compounding

w = pd.Series({"XAU": 0.6, "XAG": 0.4})
day = pd.Series({"XAU": 0.01, "XAG": -0.02})
(w * day).sum()                   # -0.002: portfolio return uses SIMPLE returns

# Annualising
mu_ann = simple.mean() * 252                 # arithmetic, approximate
cagr = (1 + simple).prod() ** (252 / simple.count()) - 1   # geometric` },
        { kind: 'check', q: 'You hold a 60/40 portfolio for one day. Which returns combine across the two assets correctly?', options: ['Log returns', 'Simple returns', 'Either', 'Neither'], answer: 1, hint: 'Which ones add across assets?', explain: 'Log returns add across time, not across assets.' },
      ],
    },
    {
      id: 'risk',
      title: 'Risk measures',
      blocks: [
        { kind: 'analogy', text: "Volatility measures how bumpy the ride is; drawdown measures the worst fall from a peak, which is what actually makes people abandon a strategy; VaR and expected shortfall describe how bad a bad day gets. No single number tells the whole story, so report several." },
        { kind: 'code', code: `rng = np.random.default_rng(0)
r = pd.Series(rng.standard_t(4, 1000) * 0.008 + 0.0003, index=pd.bdate_range("2023-01-02", periods=1000))

vol = r.std() * np.sqrt(252)
sharpe = r.mean() / r.std() * np.sqrt(252)              # assuming zero risk-free rate
downside = r[r < 0].std() * np.sqrt(252)
sortino = r.mean() * 252 / downside

equity = (1 + r).cumprod()
dd = equity / equity.cummax() - 1
max_dd = dd.min()
calmar = ((1 + r).prod() ** (252 / len(r)) - 1) / abs(max_dd)

var95 = r.quantile(0.05)                 # historical 1-day VaR (a negative return)
es95 = r[r <= var95].mean()              # expected shortfall: average of the worst 5%
r.skew(), r.kurt()                       # fat tails show up as excess kurtosis > 0` },
        { kind: 'list', items: [
          '`× √252` annualisation assumes returns are independent from day to day. With autocorrelation (smoothed or illiquid assets), it understates risk.',
          'A Sharpe estimated on one year of daily data has a standard error of roughly 1. A backtest Sharpe of 1.5 from one year is weak evidence.',
          'Expected shortfall is more informative than VaR because it says how bad the tail is, not just where it starts.',
        ] },
        { kind: 'check', q: 'What does expected shortfall add over VaR?', options: ['Nothing', 'The average loss beyond the VaR threshold, not just the threshold', 'Volatility', 'Upside risk'], answer: 1, hint: 'Where the tail starts vs how deep it goes.', explain: 'Regulators moved from VaR to ES for that reason.' },
      ],
    },
    {
      id: 'beta',
      title: 'Beta & factor regressions',
      blocks: [
        { kind: 'analogy', text: "Beta asks how much of your return is just the market carrying you. A fund up 20% in a year the market rose 25%, with a beta of 1.2, actually lost to a leveraged index tracker. Regressing returns on factors splits performance into \"rode known waves\" (betas) and \"something else\" (alpha)." },
        { kind: 'code', code: `import statsmodels.formula.api as smf

mkt = pd.Series(rng.normal(0.0004, 0.01, 1000), index=r.index)
fund = 0.0001 + 1.2 * mkt + rng.normal(0, 0.005, 1000)
df = pd.DataFrame({"fund": fund, "mkt": mkt})

beta = df["fund"].cov(df["mkt"]) / df["mkt"].var()        # ≈ 1.2
res = smf.ols("fund ~ mkt", df).fit(cov_type="HAC", cov_kwds={"maxlags": 5})
res.params["Intercept"] * 252, res.tvalues["Intercept"]  # annual alpha and its t-stat

rolling_beta = df["fund"].rolling(126).cov(df["mkt"]) / df["mkt"].rolling(126).var()
hedged = df["fund"] - beta * df["mkt"]                    # market-neutral residual
hedged.corr(df["mkt"])                                    # ≈ 0` },
        { kind: 'check', q: 'A strategy returned 18% while the market returned 15%, with beta 1.3. Rough alpha?', options: ['+3%', '−1.5%', '+18%', '0%'], answer: 1, hint: '18 − 1.3 × 15 (ignoring the risk-free rate).', explain: 'Leverage on the market explained more than all of it.' },
      ],
    },
    {
      id: 'events',
      title: 'Event studies',
      blocks: [
        { kind: 'analogy', text: "An event study lines up many occurrences of the same kind of event (earnings, rate decisions, index additions) on a common clock, day 0 being the event, and averages what happened around it. Individual stories are noise; the average path shows whether the event systematically moves prices." },
        { kind: 'code', code: `def event_study(rets: pd.Series, events: list[pd.Timestamp], before=5, after=10):
    """Average abnormal-return path around events (rets assumed already market-adjusted)."""
    pos = rets.index.get_indexer(events)                  # integer positions of event days
    paths = []
    for p in pos[pos >= 0]:
        if p - before < 0 or p + after >= len(rets): continue
        window = rets.iloc[p - before : p + after + 1].to_numpy()
        paths.append(window)
    m = pd.DataFrame(paths, columns=range(-before, after + 1))
    return m.mean(), m.cumsum(axis=1).mean(), len(m)

events = list(r.index[[100, 250, 400, 600, 800]])
avg, car, n = event_study(hedged, events)
car.plot(title=f"Cumulative abnormal return, n={n}")     # flat on random data, as it should be` },
        { kind: 'pitfall', text: 'Event dates must be known before day 0 in real time. Earnings announced after the close belong to the next trading day, and a news timestamp in New York may be the following day in London.' },
        { kind: 'check', q: 'Why use market-adjusted (abnormal) returns in an event study?', options: ['Smaller numbers', 'To remove market-wide moves that happened on the same days', 'Required by pandas', 'To annualise'], answer: 1, hint: 'Did the stock move, or did everything move?', explain: 'Otherwise a market rally looks like an event effect.' },
      ],
    },
    {
      id: 'backtest',
      title: 'A first honest backtest',
      blocks: [
        { kind: 'analogy', text: "A backtest is a flight simulator for a strategy. It's only useful if the simulator is strict: no information from the future, realistic costs for every trade, and no retakes until the landing looks good. A lenient simulator produces pilots who crash on day one." },
        { kind: 'code', code: `def backtest(px: pd.Series, fast=20, slow=100, cost_bp=2.0) -> pd.DataFrame:
    ret = px.pct_change()
    pos = np.sign(px.rolling(fast).mean() - px.rolling(slow).mean())   # decided at the close
    pos = pos.shift(1).fillna(0)                   # traded from the next day: no look-ahead
    turnover = pos.diff().abs().fillna(0)          # 2.0 when flipping long ↔ short
    strat = pos * ret - turnover * cost_bp / 1e4   # costs every time the position changes
    return pd.DataFrame({"ret": ret, "pos": pos, "strat": strat}).dropna()

px = pd.Series(2000 * np.exp(rng.normal(0.0002, 0.01, 2000).cumsum()),
               index=pd.bdate_range("2019-01-01", periods=2000))
bt = backtest(px)
sr = bt["strat"].mean() / bt["strat"].std() * np.sqrt(252)
bh = bt["ret"].mean() / bt["ret"].std() * np.sqrt(252)
trades = (bt["pos"].diff().abs() > 0).sum()
sr, bh, trades` },
        { kind: 'list', items: [
          '**Shift signals** before applying them. **Charge costs** on turnover (spread + commission + slippage).',
          '**Compare with buy-and-hold** and with the same strategy on shuffled or random data.',
          '**Pick parameters on one period, judge on another.** Trying 50 (fast, slow) pairs and reporting the best is overfitting (Machine Learning course, module 10).',
          '**Survivorship**: backtest on the universe as it was, including delisted names (module 12).',
        ] },
        { kind: 'check', q: 'Which line prevents look-ahead bias in this backtest?', options: ['pct_change()', 'pos.shift(1)', 'turnover * cost', 'dropna()'], answer: 1, hint: 'Decide at the close, trade the next day.', explain: 'Without it the strategy trades on prices it hasn\'t seen yet.' },
      ],
    },
  ],
  quiz: [
    { q: 'Which returns add up over time?', options: ['Simple', 'Log', 'Both', 'Neither'], answer: 1, explain: 'Simple returns compound multiplicatively.' },
    { q: 'Which returns add across assets in a portfolio?', options: ['Simple', 'Log', 'Both', 'Neither'], answer: 0, explain: 'Weighted sum of simple returns.' },
    { q: 'Max drawdown is…', options: ['The worst daily return', 'The largest fall from a running peak', 'Volatility', 'VaR'], answer: 1, explain: 'equity / cummax − 1, minimum.' },
    { q: 'Historical 95% one-day VaR is…', options: ['The mean', 'The 5th percentile of daily returns', 'Max loss', 'Volatility × 2'], answer: 1, explain: 'A negative number for losses.' },
    { q: 'Beta is estimated as…', options: ['corr(r, m)', 'cov(r, m) / var(m)', 'mean(r) / mean(m)', 'std(r) / std(m)'], answer: 1, explain: 'The OLS slope.' },
    { q: 'An event study aligns…', options: ['Calendar dates', 'Returns relative to each event day', 'Prices', 'Volumes'], answer: 1, explain: 'Day 0 = the event.' },
    { q: 'Why charge costs on turnover?', options: ['Required by law', 'Every position change costs spread and fees, which can erase small edges', 'For plotting', 'It doesn\'t matter'], answer: 1, explain: 'High-turnover strategies suffer most.' },
    { q: 'A one-year daily backtest Sharpe of 1.5 is…', options: ['Conclusive', 'Weak evidence: its standard error is about 1', 'Impossible', 'Guaranteed out of sample'], answer: 1, explain: 'Sharpe estimates are noisy.' },
  ],
}
