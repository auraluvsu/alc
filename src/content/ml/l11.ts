import type { Module } from '../types'

export const l11: Module = {
  n: 11,
  title: 'ML for Trading',
  tour: 'Added · Trading',
  summary: 'Turning prices into a supervised learning problem: fixed-horizon and triple-barrier labels, meta-labelling, sample weights for overlapping outcomes, feature importance on financial features, and sizing bets from predicted probabilities.',
  topics: ['Labelling', 'Triple-barrier method', 'Meta-labelling', 'Sample uniqueness', 'Feature importance', 'Bet sizing'],
  cpp23: ['Not from Géron: follows López de Prado, *Advances in Financial Machine Learning*, chapters 3–4, 8 and 10.'],
  lessons: [
    {
      id: 'labels',
      title: 'Labelling: fixed horizons',
      blocks: [
        { kind: 'analogy', text: "Before a model can learn, you must decide what a \"right answer\" was. The obvious label is \"did the price go up over the next N days?\". It's simple, but it ignores the path: a trade that fell 15% before recovering to +1% gets the same label as a smooth +1%, though you'd have been stopped out of the first one." },
        { kind: 'code', code: `import numpy as np, pandas as pd

rng = np.random.default_rng(0)
px = pd.Series(2000 * np.exp(rng.normal(0.0002, 0.01, 1500).cumsum()),
               index=pd.bdate_range("2021-01-01", periods=1500))

h = 10
fwd = px.shift(-h) / px - 1                        # forward 10-day return
vol = px.pct_change().rolling(50).std() * np.sqrt(h)   # expected 10-day move size
label = np.sign(fwd).where(fwd.abs() > 0.5 * vol, 0)   # ±1, or 0 when the move is too small to matter
label.value_counts()` },
        { kind: 'list', items: [
          'Scale thresholds by **volatility**, not fixed percentages: 1% is a big move for a bond and a dull day for crypto.',
          'A dead zone (label 0) stops the model wasting effort on moves too small to trade after costs.',
          'Sampling on **events** (a CUSUM filter on returns, or a volume or volatility threshold) beats sampling every day, since most days carry no information.',
        ] },
        { kind: 'check', q: 'Why scale label thresholds by recent volatility?', options: ['Style', 'A fixed % threshold means different things in calm and volatile periods', 'Speed', 'Required'], answer: 1, hint: '1% in a bond vs in bitcoin.', explain: 'It keeps labels comparable across regimes.' },
      ],
    },
    {
      id: 'barrier',
      title: 'The triple-barrier method',
      blocks: [
        { kind: 'analogy', text: "The triple-barrier label mimics an actual trade. From the entry point draw three barriers: a profit-take above, a stop-loss below, and a time limit to the right. Whichever the price touches first decides the label: +1 for profit-take, −1 for stop-loss, and the sign of the return (or 0) if time runs out." },
        { kind: 'code', code: `def triple_barrier(px: pd.Series, vol: pd.Series, pt=1.0, sl=1.0, max_hold=10) -> pd.Series:
    out = pd.Series(np.nan, index=px.index)
    p = px.to_numpy(); v = vol.to_numpy()
    for i in range(len(p) - 1):
        if np.isnan(v[i]):
            continue
        upper, lower = p[i] * (1 + pt * v[i]), p[i] * (1 - sl * v[i])
        path = p[i + 1 : i + 1 + max_hold]
        hit_up = np.argmax(path >= upper) if (path >= upper).any() else np.inf
        hit_dn = np.argmax(path <= lower) if (path <= lower).any() else np.inf
        if hit_up == hit_dn == np.inf:
            out.iloc[i] = np.sign(path[-1] / p[i] - 1)     # vertical barrier
        else:
            out.iloc[i] = 1 if hit_up < hit_dn else -1
    return out

daily_vol = px.pct_change().rolling(50).std()
tb = triple_barrier(px, daily_vol * np.sqrt(10))
tb.value_counts()` },
        { kind: 'check', q: 'Price hits the stop-loss on day 3 and would have hit the profit-take on day 8. The label is…', options: ['+1', '−1', '0', 'NaN'], answer: 1, hint: 'Whichever barrier is touched first.', explain: 'Path-dependent, like a real trade.' },
      ],
    },
    {
      id: 'meta',
      title: 'Meta-labelling',
      blocks: [
        { kind: 'analogy', text: "Meta-labelling splits the job in two. A primary model (a simple rule, or a discretionary trader) decides the *side*: long or short. A secondary ML model learns only *whether to act* on each primary signal, and how confidently. It's an analyst with a sceptical risk manager who filters out the ideas likely to fail." },
        { kind: 'code', code: `from sklearn.ensemble import RandomForestClassifier

ma_fast, ma_slow = px.rolling(20).mean(), px.rolling(50).mean()
side = np.sign(ma_fast - ma_slow)                       # primary model: trend direction

# Meta-label: did following the primary side over the barrier window make money?
meta = ((side * tb) > 0).astype(int)                    # 1 = take the trade, 0 = skip

feats = pd.DataFrame({
    "vol": daily_vol, "mom5": px.pct_change(5), "dist_ma": px / ma_slow - 1, "side": side,
}).dropna()
data = feats.join(meta.rename("meta")).dropna()
# Fit with purged / walk-forward CV from module 10, never shuffled K-fold:
# clf = RandomForestClassifier(min_samples_leaf=50, class_weight="balanced").fit(...)
# P(take) = clf.predict_proba(X_new)[:, 1]` },
        { kind: 'list', items: [
          'The primary model can be high-recall (catch every opportunity); the meta-model improves precision.',
          'Secondary models can use information the primary rule ignores (volatility, spreads, news flow).',
          'Its probabilities feed directly into position sizing.',
        ] },
        { kind: 'check', q: 'In meta-labelling, what does the secondary model predict?', options: ['Long or short', 'Whether to act on the primary signal (and how confidently)', 'Price levels', 'Volatility'], answer: 1, hint: 'The sceptical risk manager.', explain: 'Side comes from the primary model.' },
      ],
    },
    {
      id: 'uniqueness',
      title: 'Sample uniqueness & weights',
      blocks: [
        { kind: 'analogy', text: "If ten overlapping labels all cover the same crash week, the model sees that week ten times and treats it as ten independent lessons. Uniqueness weighting tells the model how much genuinely new information each sample carries, so a busy period doesn't drown out quiet ones." },
        { kind: 'code', code: `def avg_uniqueness(starts: np.ndarray, ends: np.ndarray, n: int) -> np.ndarray:
    """Average uniqueness of each label over its lifespan [start, end]."""
    conc = np.zeros(n)                                  # how many labels are "alive" at each time
    for s, e in zip(starts, ends):
        conc[s : e + 1] += 1
    return np.array([(1 / conc[s : e + 1]).mean() for s, e in zip(starts, ends)])

starts = np.arange(0, 100)
ends = np.minimum(starts + 9, 99)                      # 10-day labels sampled daily
w = avg_uniqueness(starts, ends, 100)
w[50]                                                  # ≈ 0.1: each label is ~90% shared with others
# model.fit(X, y, sample_weight=w)   and bootstrap with probabilities ∝ uniqueness ("sequential bootstrap")` },
        { kind: 'check', q: 'Daily samples with 10-day overlapping labels have average uniqueness of roughly…', options: ['1', '0.5', '0.1', '0'], answer: 2, hint: 'Ten labels alive at once.', explain: 'Your 1,000 samples hold about 100 samples\' worth of information.' },
      ],
    },
    {
      id: 'sizing',
      title: 'Feature importance & bet sizing',
      blocks: [
        { kind: 'analogy', text: "A probability isn't a position. If the meta-model says 55%, that's a tilt, not a conviction; 80% deserves more risk. Bet sizing maps probability to position size, and feature importance (done properly) tells you which inputs earned that confidence." },
        { kind: 'code', code: `from scipy.stats import norm

def bet_size(p: np.ndarray, side: np.ndarray, n_classes: int = 2) -> np.ndarray:
    """López de Prado: convert P(correct) into a size in [-1, 1] via a z-test against 1/n_classes."""
    z = (p - 1 / n_classes) / np.sqrt(p * (1 - p))
    return side * (2 * norm.cdf(z) - 1)

p = np.array([0.50, 0.55, 0.65, 0.80, 0.95])
bet_size(p, side=np.ones(5)).round(2)       # [0.   0.08 0.25 0.55 0.96]: grows with confidence

# Feature importance on financial data (see module 7):
#  • MDA (permutation importance) on PURGED out-of-sample folds, not in-sample MDI
#  • cluster correlated features and permute clusters together
#  • compare with importances on shuffled labels: anything not above that baseline is noise` },
        { kind: 'pitfall', text: 'Discretise and cap sizes in practice (e.g. steps of 0.1, maximum 1) and average sizes across overlapping active bets, otherwise positions jitter daily and turnover costs swallow the edge.' },
        { kind: 'check', q: 'With this sizing function, what size does p = 0.5 give?', options: ['1', '0.5', '0', '-1'], answer: 2, hint: 'No better than a coin flip.', explain: 'No edge, no bet.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the main weakness of fixed-horizon labels?', options: ['Too slow', 'They ignore the path, e.g. hitting a stop-loss along the way', 'They need volatility', 'They are biased upward'], answer: 1, explain: 'Triple barrier fixes this.' },
    { q: 'The three barriers are…', options: ['Open, high, low', 'Profit-take, stop-loss, time limit', 'Buy, sell, hold', 'Mean, std, skew'], answer: 1, explain: 'First touch decides.' },
    { q: 'Barrier widths are usually set by…', options: ['Fixed %', 'Recent volatility', 'Price level', 'Volume'], answer: 1, explain: 'Comparable across regimes.' },
    { q: 'In meta-labelling the primary model decides…', options: ['Size', 'Side (direction)', 'Whether to trade', 'Features'], answer: 1, explain: 'The secondary decides whether.' },
    { q: 'Meta-labelling mainly improves…', options: ['Recall', 'Precision', 'Latency', 'Data size'], answer: 1, explain: 'It filters false positives.' },
    { q: 'Uniqueness weights correct for…', options: ['Class imbalance', 'Overlapping labels sharing information', 'Missing data', 'Scaling'], answer: 1, explain: 'Pass as sample_weight.' },
    { q: 'Which feature importance is safer for financial data?', options: ['In-sample MDI', 'Permutation (MDA) on purged out-of-sample folds', 'Coefficient size', 'Correlation with price'], answer: 1, explain: 'Plus clustering correlated features.' },
    { q: 'Bet sizing maps…', options: ['Price to size', 'Predicted probability to position size', 'Volatility to stop', 'Volume to spread'], answer: 1, explain: 'Confidence → risk.' },
  ],
}
