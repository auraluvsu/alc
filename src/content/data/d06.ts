import type { Module } from '../types'

export const d06: Module = {
  n: 6,
  title: 'Plotting & Visualisation',
  tour: '9 · Plotting and Visualization',
  summary: 'matplotlib\'s figure-and-axes model, quick plots straight from pandas, seaborn for statistical charts, and the standard finance charts: equity curves, drawdowns, return distributions, rolling statistics and correlation heatmaps.',
  topics: ['Figures & axes', 'Plotting from pandas', 'seaborn', 'Financial charts', 'Making charts honest'],
  cpp23: ['matplotlib 3.10 is current; the object-oriented `fig, ax = plt.subplots()` style is the one to learn.'],
  lessons: [
    {
      id: 'figax',
      title: 'Figures & axes',
      blocks: [
        { kind: 'analogy', text: "A matplotlib **figure** is the sheet of paper; each **axes** is one chart drawn on it, with its own x and y axis. `plt.subplots` hands you both, and you then call methods on the axes you want to draw on. Writing `ax.plot(...)` rather than `plt.plot(...)` means you always know which chart you're changing." },
        { kind: 'code', code: `import matplotlib.pyplot as plt
import numpy as np, pandas as pd

rng = np.random.default_rng(0)
px = pd.Series(2385 * np.exp(np.cumsum(rng.normal(0, 0.01, 252))),
               index=pd.bdate_range("2026-01-01", periods=252), name="XAU")

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 6), sharex=True,
                               gridspec_kw={"height_ratios": [3, 1]})
ax1.plot(px.index, px, lw=1.2, label="XAU")
ax1.plot(px.index, px.rolling(50).mean(), lw=1, ls="--", label="SMA 50")
ax1.set(title="Gold, 2026", ylabel="USD/oz")
ax1.legend(loc="upper left"); ax1.grid(alpha=0.3)

ax2.bar(px.index, px.pct_change(), width=1, color="grey")
ax2.set_ylabel("daily ret")
fig.tight_layout()
fig.savefig("xau.png", dpi=150)` },
        { kind: 'check', q: 'Why prefer `ax.plot` over `plt.plot`?', options: ['It is faster', 'It targets a specific axes explicitly, which matters with several subplots', 'plt.plot is deprecated', 'It adds a legend'], answer: 1, hint: 'Which chart are you drawing on?', explain: '`plt.*` acts on the "current" axes, which is easy to lose track of.' },
      ],
    },
    {
      id: 'pandas',
      title: 'Plotting from pandas',
      blocks: [
        { kind: 'analogy', text: "Every Series and DataFrame has a `.plot` attribute that calls matplotlib with sensible defaults: index on the x axis, one line per column, a legend from column names. Perfect for a quick look; switch to explicit axes when the chart is going in a report." },
        { kind: 'code', code: `prices = pd.DataFrame({"XAU": px, "XAG": px * 0.012 * np.exp(rng.normal(0, 0.02, 252).cumsum())})
rets = prices.pct_change().dropna()

(prices / prices.iloc[0]).plot(title="Rebased to 1")      # compare assets on one scale
rets.plot.hist(bins=60, alpha=0.6)                         # return distributions
rets.plot.scatter(x="XAU", y="XAG", s=5)                   # co-movement
rets["XAU"].rolling(21).std().mul(np.sqrt(252)).plot(title="21-day realised vol")

ax = prices.plot(secondary_y="XAG")                        # two y axes
prices.plot(subplots=True, layout=(2, 1), figsize=(8, 5))` },
        { kind: 'check', q: 'Why rebase prices (divide by the first value) before plotting several assets?', options: ['Required by pandas', 'So assets with very different price levels can be compared on one scale', 'To remove NaN', 'For log scale'], answer: 1, hint: '$2,385 vs $28.', explain: 'A rebased line shows cumulative growth.' },
      ],
    },
    {
      id: 'seaborn',
      title: 'seaborn for statistical charts',
      blocks: [
        { kind: 'analogy', text: "seaborn sits on top of matplotlib the way pandas sits on NumPy: you describe the data and the relationship (\"distribution of returns by year\", \"regression of asset on market\"), and it handles the grouping, colours and confidence bands." },
        { kind: 'code', code: `import seaborn as sns

long = rets.reset_index(names="date").melt(id_vars="date", var_name="sym", value_name="ret")
sns.histplot(data=long, x="ret", hue="sym", kde=True, stat="density")
sns.boxplot(data=long.assign(month=long["date"].dt.month), x="month", y="ret")
sns.regplot(data=rets, x="XAU", y="XAG", scatter_kws={"s": 5})   # beta at a glance
sns.heatmap(rets.corr(), annot=True, fmt=".2f", vmin=-1, vmax=1, cmap="vlag")` },
        { kind: 'list', items: [
          'seaborn prefers **long** (tidy) data: one row per observation, with columns for the variables you map to x, y and hue (module 5).',
          'For a correlation heatmap, always fix `vmin=-1, vmax=1` with a diverging palette, so colour means the same thing on every chart.',
        ] },
        { kind: 'check', q: 'Which data layout does seaborn work best with?', options: ['Wide', 'Long/tidy', 'MultiIndex columns', 'NumPy arrays only'], answer: 1, hint: 'hue= needs a column to group by.', explain: 'Melt wide frames first.' },
      ],
    },
    {
      id: 'finance',
      title: 'The standard finance charts',
      blocks: [
        { kind: 'analogy', text: "A strategy report has a standard set of photographs: the equity curve (where did the money go), the underwater chart (how deep and long were the losses), the return distribution (how fat are the tails) and rolling statistics (is the edge stable or did it vanish in 2024?)." },
        { kind: 'code', code: `strat = rets["XAU"]                                  # stand-in for strategy returns
equity = (1 + strat).cumprod()
drawdown = equity / equity.cummax() - 1

fig, axes = plt.subplots(3, 1, figsize=(10, 8), sharex=True)
equity.plot(ax=axes[0], title="Equity curve", logy=True)        # log scale for long histories
axes[1].fill_between(drawdown.index, drawdown, 0, color="tab:red", alpha=0.4)
axes[1].set_title(f"Drawdown (max {drawdown.min():.1%})")
roll_sharpe = strat.rolling(63).mean() / strat.rolling(63).std() * np.sqrt(252)
roll_sharpe.plot(ax=axes[2], title="Rolling 3-month Sharpe"); axes[2].axhline(0, color="k", lw=0.5)
fig.tight_layout()` },
        { kind: 'check', q: 'Why plot long equity curves on a log scale?', options: ['Looks nicer', 'Equal percentage moves look equal, so early and late periods are comparable', 'Hides losses', 'Required'], answer: 1, hint: '+10% from 100 vs +10% from 10,000.', explain: 'On a linear scale early returns look flat.' },
      ],
    },
    {
      id: 'honest',
      title: 'Making charts honest',
      blocks: [
        { kind: 'analogy', text: "A chart is an argument. The same data can look calm or terrifying depending on axis limits, scale and what's left out. The test of an honest chart: would the reader draw the same conclusion from the underlying numbers?" },
        { kind: 'list', items: [
          '**Start bar charts at zero.** Truncated bars exaggerate differences.',
          '**Show the benchmark** next to the strategy. An equity curve alone hides whether you just bought beta.',
          '**Mark in-sample vs out-of-sample** periods on backtest charts (`ax.axvspan`).',
          '**Label units and annualisation** (daily vs annualised vol, % vs bp).',
          '**Avoid dual y-axes** unless necessary: they make any two series look correlated.',
          '**Use colour-blind-safe palettes** (`tab10`, `viridis`) and never colour alone to carry meaning.',
        ] },
        { kind: 'code', code: `ax = equity.plot(label="Strategy")
(1 + rets["XAG"]).cumprod().plot(ax=ax, label="Benchmark", alpha=0.7)
ax.axvspan(pd.Timestamp("2026-09-01"), equity.index[-1], color="grey", alpha=0.15, label="Out of sample")
ax.legend()` },
        { kind: 'check', q: 'Your backtest chart shows only the strategy\'s equity curve. What\'s the most important thing missing?', options: ['A title', 'A benchmark to compare against', 'Grid lines', 'A logo'], answer: 1, hint: 'Did it beat just holding the asset?', explain: 'Without a benchmark, "up and to the right" means little.' },
      ],
    },
  ],
  quiz: [
    { q: 'In matplotlib, an Axes is…', options: ['The whole window', 'One plot area with its own axes', 'A tick label', 'A colour map'], answer: 1, explain: 'A figure holds one or more axes.' },
    { q: 'What does `plt.subplots(2, 1, sharex=True)` give you?', options: ['One axes', 'A figure and two vertically stacked axes sharing the x axis', 'Two figures', 'A grid of 2×2'], answer: 1, explain: 'Handy for price + volume.' },
    { q: 'DataFrame.plot() puts what on the x axis?', options: ['The first column', 'The index', 'Row numbers always', 'Nothing'], answer: 1, explain: 'Each column becomes a line.' },
    { q: 'Which seaborn function draws a correlation heatmap?', options: ['sns.corrplot', 'sns.heatmap', 'sns.matrix', 'sns.pairplot'], answer: 1, explain: 'Pass df.corr().' },
    { q: 'An underwater (drawdown) chart shows…', options: ['Returns', 'Equity / running peak − 1', 'Volume', 'Volatility'], answer: 1, explain: 'Depth and length of losses.' },
    { q: 'Why fix vmin/vmax in correlation heatmaps?', options: ['Speed', 'So colours mean the same correlation across charts', 'Required', 'Smaller files'], answer: 1, explain: 'Use -1 and 1.' },
    { q: 'Truncating a bar chart\'s y axis…', options: ['Is always fine', 'Exaggerates differences', 'Hides NaN', 'Is required for money'], answer: 1, explain: 'Start bars at zero.' },
    { q: 'How do you shade the out-of-sample period?', options: ['ax.fill', 'ax.axvspan', 'ax.text', 'ax.hlines'], answer: 1, explain: 'A vertical band.' },
  ],
}
