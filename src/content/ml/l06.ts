import type { Module } from '../types'

export const l06: Module = {
  n: 6,
  title: 'Decision Trees',
  tour: '6 · Decision Trees',
  summary: 'How a decision tree learns a sequence of yes/no questions, how CART chooses splits with Gini impurity or squared error, regularising depth and leaf size, regression trees, and why single trees are unstable, which motivates the ensembles in the next module.',
  topics: ['Training & reading a tree', 'CART & impurity', 'Regularisation', 'Regression trees', 'Instability'],
  cpp23: ['Trees handle missing values natively (1.3+): NaN goes down whichever branch fits best.', '`monotonic_cst` (1.4) forces predictions to rise or fall with a feature.'],
  lessons: [
    {
      id: 'train',
      title: 'Training & reading a tree',
      blocks: [
        { kind: 'analogy', text: "A decision tree is a game of twenty questions with your data. \"Is 20-day volatility above 30%?\" \"Yes.\" \"Is momentum negative?\" \"Yes.\" \"Then predict: risk-off day.\" Each question splits the data in two, and each leaf at the bottom makes a prediction from the training examples that ended up there." },
        { kind: 'code', code: `import numpy as np, pandas as pd
from sklearn.tree import DecisionTreeClassifier, export_text

rng = np.random.default_rng(0)
X = pd.DataFrame({"vol20": rng.uniform(0.05, 0.6, 2000), "mom": rng.normal(0, 0.1, 2000)})
risk_off = (X["vol20"] > 0.3) & (X["mom"] < 0)
y = np.where(rng.random(2000) < 0.9, risk_off, ~risk_off).astype(int)   # 10% label noise

tree = DecisionTreeClassifier(max_depth=2, random_state=0).fit(X, y)
print(export_text(tree, feature_names=list(X.columns)))
# |--- mom <= -0.00
# |   |--- vol20 <= 0.30   class: 0
# |   |--- vol20 >  0.30   class: 1     ← the hidden rule, recovered
# |--- mom >  -0.00
# |   |--- mom <= 0.18     class: 0
# |   |--- mom >  0.18     class: 0     (a useless split: both sides say 0)
tree.predict_proba(X.iloc[:3])      # class share in each sample's leaf` },
        { kind: 'list', items: [
          'Trees need **no feature scaling** and handle non-linear relationships and interactions naturally.',
          'They are **interpretable** at small depth: you can read the rules aloud to a risk committee.',
          'Splits are axis-aligned: a diagonal boundary needs a staircase of many splits.',
        ] },
        { kind: 'check', q: 'Why don\'t trees need feature scaling?', options: ['They scale internally', 'Each split is a threshold on one feature, unaffected by its units', 'They only use ranks of the target', 'They do need it'], answer: 1, hint: '"Is vol > 0.3?" works the same in % or decimals.', explain: 'Monotonic transforms of a feature don\'t change the tree.' },
      ],
    },
    {
      id: 'cart',
      title: 'CART & impurity',
      blocks: [
        { kind: 'analogy', text: "At each node, CART tries every feature and every threshold and picks the split that leaves the two children *purest*: each side as close as possible to one class. Gini impurity measures how mixed a group is: 0 for a group of one class, 0.5 for a 50/50 coin flip with two classes. It's a greedy algorithm: the best split now, with no look-ahead." },
        { kind: 'code', code: `def gini(labels):
    p = np.bincount(labels) / len(labels)
    return 1 - (p ** 2).sum()

gini(np.array([0, 0, 0, 0]))       # 0.0: pure
gini(np.array([0, 0, 1, 1]))       # 0.5: maximally mixed (two classes)
gini(np.array([0, 0, 0, 1]))       # 0.375

# Cost of a split = size-weighted impurity of the children; CART picks the minimum
def split_cost(x, y, threshold):
    left, right = y[x <= threshold], y[x > threshold]
    return (len(left) * gini(left) + len(right) * gini(right)) / len(y)

tree.tree_.impurity[:3], tree.feature_importances_   # impurity per node; total impurity reduction per feature` },
        { kind: 'pitfall', text: 'Impurity-based `feature_importances_` are biased towards features with many possible split points (continuous or high-cardinality columns), even pure noise. Use permutation importance on held-out data for anything you\'ll act on (module 7).' },
        { kind: 'check', q: 'Gini impurity of a node with 50 of class A and 50 of class B?', options: ['0', '0.25', '0.5', '1'], answer: 2, hint: '1 − (0.5² + 0.5²).', explain: 'Maximum impurity for two classes.' },
      ],
    },
    {
      id: 'regularise',
      title: 'Regularisation',
      blocks: [
        { kind: 'analogy', text: "Left alone, a tree keeps asking questions until every leaf is pure, which on noisy data means memorising individual training rows. Regularisation sets house rules for the game: at most N questions deep, and no leaf may describe fewer than K examples." },
        { kind: 'code', code: `from sklearn.model_selection import cross_val_score

for params in [{}, {"max_depth": 3}, {"min_samples_leaf": 50}, {"ccp_alpha": 0.002}]:
    t = DecisionTreeClassifier(random_state=0, **params)
    cv = cross_val_score(t, X, y, cv=5).mean()
    t.fit(X, y)
    print(params or "unrestricted", t.get_depth(), t.get_n_leaves(), round(t.score(X, y), 3), round(cv, 3))
# unrestricted       depth 35, 323 leaves, train 1.000, CV 0.817: memorised the noise
# max_depth=3        depth 3,    8 leaves, train 0.902, CV 0.900
# min_samples_leaf   depth 11,  31 leaves, train 0.902, CV 0.901
# ccp_alpha=0.002    depth 2,    3 leaves, train 0.902, CV 0.900  (0.9 = the label-noise ceiling)` },
        { kind: 'list', items: [
          '`max_depth`, `min_samples_leaf`, `min_samples_split`, `max_leaf_nodes` limit growth up front.',
          '`ccp_alpha` prunes after growing (cost-complexity pruning); `cost_complexity_pruning_path` lists candidate alphas.',
          'In finance, `min_samples_leaf` in the hundreds is normal: a leaf built from 12 days is an anecdote.',
        ] },
        { kind: 'check', q: 'An unrestricted tree scores 100% on training data. Most likely?', options: ['A perfect model', 'It memorised the training set, including noise', 'Leakage', 'A bug in sklearn'], answer: 1, hint: 'Pure leaves on noisy labels.', explain: 'Compare with cross-validated accuracy.' },
      ],
    },
    {
      id: 'regression',
      title: 'Regression trees',
      blocks: [
        { kind: 'analogy', text: "A regression tree predicts a number: the average target of the training examples in each leaf. The result is a staircase: flat within each leaf, jumping between leaves. Splits are chosen to minimise squared error instead of Gini." },
        { kind: 'code', code: `from sklearn.tree import DecisionTreeRegressor

x = np.sort(rng.uniform(0, 5, 300)).reshape(-1, 1)
target = np.sin(x[:, 0]) + rng.normal(0, 0.2, 300)

for depth in (2, 5, None):
    r = DecisionTreeRegressor(max_depth=depth, random_state=0).fit(x[::2], target[::2])
    print(depth, round(r.score(x[::2], target[::2]), 3), round(r.score(x[1::2], target[1::2]), 3))
# depth 2:    coarse staircase, underfits
# depth 5:    good on both
# None:       R² = 1.0 on train, noticeably worse on test

r.predict([[10.0]])      # outside the training range: just the last leaf's value` },
        { kind: 'pitfall', text: 'Trees cannot extrapolate. Beyond the training range they repeat the nearest leaf\'s value. If a feature or target trends (price levels, volumes), use returns or ratios instead, or a linear model for the trend.' },
        { kind: 'check', q: 'A tree trained on gold prices between $1,800 and $2,400 is asked about $3,000. It predicts…', options: ['An extrapolated value', 'Roughly the value from its highest-price leaf', 'NaN', 'An error'], answer: 1, hint: 'Staircase with no step beyond the data.', explain: 'Another reason to model returns, not levels.' },
      ],
    },
    {
      id: 'instability',
      title: 'Instability',
      blocks: [
        { kind: 'analogy', text: "Trees are like a nervous committee: change a few training rows and the first question can change, which changes everything below it. High variance makes one tree unreliable, but it's exactly what makes averaging many different trees so powerful. That's the next module." },
        { kind: 'code', code: `first_splits = []
for seed in range(5):
    idx = np.random.default_rng(seed).choice(len(X), size=len(X), replace=True)   # bootstrap sample
    t = DecisionTreeClassifier(max_depth=3, random_state=0).fit(X.iloc[idx], y[idx])
    first_splits.append((X.columns[t.tree_.feature[0]], round(t.tree_.threshold[0], 3)))
first_splits     # four resamples open with mom ≤ 0; the fifth opens with vol20 ≤ 0.302,
                 # so its entire tree below the root is different` },
        { kind: 'check', q: 'Why is a single tree\'s high variance useful for ensembles?', options: ['It isn\'t', 'Different trees make different errors, and averaging cancels much of them', 'It speeds training', 'It improves interpretability'], answer: 1, hint: 'Wisdom of crowds needs a diverse crowd.', explain: 'Bagging and random forests exploit exactly this.' },
      ],
    },
  ],
  quiz: [
    { q: 'A decision tree prediction for classification is…', options: ['A linear combination', 'The majority class (or class shares) in the leaf', 'A kernel value', 'A cluster ID'], answer: 1, explain: 'predict_proba gives the shares.' },
    { q: 'CART chooses splits…', options: ['Randomly', 'Greedily, minimising weighted child impurity', 'By looking ahead', 'By gradient descent'], answer: 1, explain: 'Best split now.' },
    { q: 'Gini impurity of a pure node is…', options: ['0', '0.5', '1', 'Undefined'], answer: 0, explain: 'Only one class.' },
    { q: 'Impurity-based feature importances are biased toward…', options: ['Binary features', 'Features with many split points', 'Categorical with 2 levels', 'Nothing'], answer: 1, explain: 'Use permutation importance.' },
    { q: 'Which hyperparameter prunes after growing?', options: ['max_depth', 'ccp_alpha', 'min_samples_leaf', 'criterion'], answer: 1, explain: 'Cost-complexity pruning.' },
    { q: 'A regression tree leaf predicts…', options: ['A line', 'The mean target of its training samples', 'The median always', 'Zero'], answer: 1, explain: 'A staircase overall.' },
    { q: 'Can trees extrapolate beyond training ranges?', options: ['Yes', 'No', 'Only regression trees', 'Only with scaling'], answer: 1, explain: 'They repeat edge leaves.' },
    { q: 'Single trees are…', options: ['Low variance', 'High variance: small data changes alter the structure', 'Always linear', 'Unbiased'], answer: 1, explain: 'Ensembles fix this.' },
  ],
}
