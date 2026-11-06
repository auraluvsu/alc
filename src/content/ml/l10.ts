import type { Module } from '../types'

export const l10: Module = {
  n: 10,
  title: 'Validation for Financial Time Series',
  tour: 'Added · Validation',
  summary: 'Why standard cross-validation lies on market data, and what to do instead: a taxonomy of leakage, purged k-fold with an embargo, walk-forward testing, combinatorial purged CV, and correcting for the number of strategies you tried with the deflated Sharpe ratio.',
  topics: ['Leakage taxonomy', 'Purged k-fold & embargo', 'Walk-forward testing', 'Combinatorial purged CV', 'Backtest overfitting'],
  cpp23: ['Not from Géron: this module follows Marcos López de Prado, *Advances in Financial Machine Learning* (2018), chapters 7, 11–12 and 14.'],
  lessons: [
    {
      id: 'leakage',
      title: 'A taxonomy of leakage',
      blocks: [
        { kind: 'analogy', text: "Leakage is an exam where the answers are printed faintly on the back of the paper. The student scores brilliantly and learns nothing. In finance the answers leak through many routes, most of them invisible unless you go looking." },
        { kind: 'list', items: [
          '**Look-ahead in features**: centred windows, `bfill`, full-sample scaling or winsorising, restated fundamentals joined on period end.',
          '**Overlapping labels**: a 21-day forward return on day t overlaps the labels of days t+1 … t+20. Random K-fold puts neighbours on both sides of the split.',
          '**Serial correlation in features**: today\'s features look like yesterday\'s, so a model can "recognise" a test day from its training neighbours.',
          '**Selection**: universe chosen with hindsight (survivors), parameters chosen on the test period, the test set consulted repeatedly.',
          '**Preprocessing outside the fold**: scalers, PCA, feature selection fitted on all the data.',
        ] },
        { kind: 'code', code: `import numpy as np, pandas as pd
from sklearn.model_selection import KFold, cross_val_score
from sklearn.ensemble import RandomForestRegressor

# Pure noise, but with overlapping 20-day labels and slow-moving features
rng = np.random.default_rng(0)
n = 2000
ret = rng.normal(0, 0.01, n)
y = pd.Series(ret).rolling(20).sum().shift(-20).to_numpy()            # forward 20-day return
X = np.c_[pd.Series(rng.normal(size=n)).rolling(50).mean(),           # persistent "features"
          pd.Series(rng.normal(size=n)).rolling(50).mean()]
ok = ~np.isnan(y) & ~np.isnan(X).any(axis=1)
X, y = X[ok], y[ok]

rf = RandomForestRegressor(n_estimators=200, min_samples_leaf=5, n_jobs=-1, random_state=0)
cross_val_score(rf, X, y, cv=KFold(5, shuffle=True, random_state=0)).mean()   # ≈ +0.04: "skill" on pure noise
cross_val_score(rf, X, y, cv=KFold(5, shuffle=False)).mean()                  # ≈ −0.53: the truth` },
        { kind: 'check', q: 'The data is pure noise, yet shuffled K-fold shows positive R². Why?', options: ['Random forests find hidden signal', 'Neighbouring days with near-identical features and overlapping labels sit on both sides of the split', 'R² is wrong', 'Too few trees'], answer: 1, hint: 'Answers on the back of the paper.', explain: 'The model memorises neighbours rather than learning anything.' },
      ],
    },
    {
      id: 'purged',
      title: 'Purged k-fold & embargo',
      blocks: [
        { kind: 'analogy', text: "Purging removes from the training set any observation whose label period overlaps the test period: if a training label looks 20 days ahead into the test window, it's thrown out. The embargo adds a buffer after each test block too, because features calculated just after the test window can still carry its information backwards." },
        { kind: 'code', code: `def purged_kfold(n: int, n_splits: int, horizon: int, embargo: int):
    """Yield (train, test) index arrays: contiguous test blocks, purged and embargoed."""
    idx = np.arange(n)
    for test in np.array_split(idx, n_splits):
        start, end = test[0], test[-1]
        keep = (idx + horizon < start) | (idx > end + embargo)   # label window must not touch test
        yield idx[keep], test

splits = list(purged_kfold(len(y), n_splits=5, horizon=20, embargo=20))
cross_val_score(rf, X, y, cv=splits).mean()        # ≈ −0.53: no fake skill

tr, te = splits[2]
te.min() - tr[tr < te.min()].max(), tr[tr > te.max()].min() - te.max()   # gaps of 21 either side` },
        { kind: 'list', items: [
          'Purge length = label horizon (here 20 days). Embargo is typically about 1% of the sample, or the feature look-back.',
          'scikit-learn\'s `TimeSeriesSplit(gap=…)` purges on one side only, because training always precedes testing.',
          'Packages like `mlfinpy` / `mlfinlab` implement purged and combinatorial CV directly.',
        ] },
        { kind: 'check', q: 'Why purge training rows just before a test block?', options: ['To save time', 'Their labels look forward into the test period', 'They are outliers', 'Required by sklearn'], answer: 1, hint: 'A 20-day label from day t covers t+1…t+20.', explain: 'The embargo handles the rows just after.' },
      ],
    },
    {
      id: 'walkforward',
      title: 'Walk-forward testing',
      blocks: [
        { kind: 'analogy', text: "Walk-forward replays history as it happened: train on everything up to January, trade February; retrain up to February, trade March; and so on. It is the closest simulation of live deployment, including how often you'd retrain. Its weakness is that it tests only one path through history." },
        { kind: 'code', code: `def walk_forward(X, y, model, train_min=500, step=60, horizon=20):
    preds = np.full(len(y), np.nan)
    for start in range(train_min, len(y), step):
        tr = np.arange(0, start - horizon)                # purge: labels end before the test block
        te = np.arange(start, min(start + step, len(y)))
        model.fit(X[tr], y[tr])
        preds[te] = model.predict(X[te])
    return preds

p = walk_forward(X, y, rf)
mask = ~np.isnan(p)
np.corrcoef(p[mask], y[mask])[0, 1]     # ≈ −0.1: no out-of-sample skill on noise, as it should be` },
        { kind: 'check', q: 'What is walk-forward testing\'s main limitation?', options: ['It leaks', 'It evaluates a single historical path, so results depend on that path', 'It can\'t retrain', 'It needs labels'], answer: 1, hint: 'History only happened once.', explain: 'Combinatorial purged CV generates many paths.' },
      ],
    },
    {
      id: 'cpcv',
      title: 'Combinatorial purged CV',
      blocks: [
        { kind: 'analogy', text: "Instead of one walk through history, CPCV splits time into N blocks and tests on every combination of k of them, training on the rest (purged and embargoed). Stitching the test predictions together yields many different backtest paths, so you get a *distribution* of Sharpe ratios rather than a single, possibly lucky, number." },
        { kind: 'code', code: `from itertools import combinations
from math import comb

N, k = 6, 2
groups = np.array_split(np.arange(len(y)), N)
combos = list(combinations(range(N), k))
len(combos), comb(N, k) * k // N        # 15 train/test splits, 5 complete backtest paths

for test_groups in combos[:2]:
    test = np.concatenate([groups[g] for g in test_groups])
    # train = all other groups, minus purge/embargo around each test group…
    ...` },
        { kind: 'check', q: 'With N=6 groups and k=2 test groups, how many train/test splits does CPCV make?', options: ['6', '12', '15', '36'], answer: 2, hint: 'C(6, 2).', explain: 'They combine into 5 full backtest paths.' },
      ],
    },
    {
      id: 'overfitting',
      title: 'Backtest overfitting',
      blocks: [
        { kind: 'analogy', text: "Toss 1,000 coins ten times each and one will probably land heads ten times running. It isn't a magic coin. Try 1,000 strategy variants on the same history and the best will show a superb Sharpe ratio by luck alone. The deflated Sharpe ratio asks: how good would the best of N tries look if none of them worked?" },
        { kind: 'code', code: `from scipy.stats import norm

def expected_max_sharpe(n_trials: int, sr_std: float) -> float:
    """Approximate expected maximum Sharpe of n_trials skill-less strategies (Bailey & López de Prado)."""
    g = 0.5772156649                                   # Euler–Mascheroni constant
    return sr_std * ((1 - g) * norm.ppf(1 - 1 / n_trials) + g * norm.ppf(1 - 1 / (n_trials * np.e)))

# Sharpe estimated from T years of daily data has std ≈ 1/sqrt(T) (annualised, roughly)
T = 5
for n_trials in (1, 10, 100, 1000):
    print(n_trials, round(expected_max_sharpe(max(n_trials, 2), 1 / np.sqrt(T)), 2))
# 0.23 (2 trials), 0.70 (10), 1.13 (100), 1.46 (1000):
# a Sharpe of 1.4 from the best of 1,000 is just luck` },
        { kind: 'list', items: [
          '**Log every trial**: parameters, features, models. The number of trials is part of the result.',
          '**Report the deflated Sharpe**, or at least compare the winner with the expected maximum under no skill.',
          '**Keep a final untouched period** and use it once.',
        ] },
        { kind: 'check', q: 'You tested 500 variants and the best has a 5-year Sharpe of 1.2. What\'s the honest reading?', options: ['Strong evidence', 'Roughly what the best of 500 skill-less strategies would show', 'Too low to matter', 'Leakage'], answer: 1, hint: 'Best of 1,000 coins.', explain: 'Without accounting for trials, 1.2 is indistinguishable from luck.' },
      ],
    },
  ],
  quiz: [
    { q: 'Why does shuffled K-fold mislead on daily financial data?', options: ['It\'s slow', 'Autocorrelated features and overlapping labels leak across folds', 'It needs more folds', 'It ignores scaling'], answer: 1, explain: 'Neighbours land on both sides.' },
    { q: 'Purging removes…', options: ['Outliers', 'Training rows whose labels overlap the test period', 'Test rows', 'Features'], answer: 1, explain: 'Based on the label horizon.' },
    { q: 'The embargo removes…', options: ['Rows before the test set', 'Rows just after the test set', 'Random rows', 'Nothing'], answer: 1, explain: 'Information can leak backwards through features.' },
    { q: 'Walk-forward testing…', options: ['Uses future data', 'Retrains on the past and tests on the next period, repeatedly', 'Is random', 'Uses one split'], answer: 1, explain: 'Closest to live trading.' },
    { q: 'CPCV produces…', options: ['One backtest', 'Many backtest paths and a distribution of results', 'Feature importances', 'Labels'], answer: 1, explain: 'Less dependent on one path.' },
    { q: 'The deflated Sharpe ratio adjusts for…', options: ['Costs', 'The number of trials and non-normal returns', 'Leverage', 'Inflation'], answer: 1, explain: 'Multiple testing.' },
    { q: 'The expected maximum Sharpe of N useless strategies…', options: ['Is 0', 'Grows with N', 'Shrinks with N', 'Is 1'], answer: 1, explain: 'Selection bias.' },
    { q: 'What should you record for every backtest?', options: ['Only the winner', 'Every trial, so the count is known', 'Nothing', 'The final Sharpe'], answer: 1, explain: 'The trial count is part of the result.' },
  ],
}
