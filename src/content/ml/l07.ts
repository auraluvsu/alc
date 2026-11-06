import type { Module } from '../types'

export const l07: Module = {
  n: 7,
  title: 'Ensembles: Forests & Boosting',
  tour: '7 · Ensemble Learning and Random Forests',
  summary: 'Combining many models: voting, bagging and random forests, out-of-bag evaluation, gradient boosting with HistGradientBoosting, XGBoost and LightGBM, stacking, and feature importance you can trust.',
  topics: ['Voting & bagging', 'Random forests', 'Gradient boosting', 'XGBoost & LightGBM', 'Stacking', 'Feature importance'],
  cpp23: [
    'Native categorical support via `categorical_features="from_dtype"` (1.4).',
    'HistGradientBoosting has early stopping on by default for more than 10,000 samples.',
  ],
  lessons: [
    {
      id: 'voting',
      title: 'Voting & bagging',
      blocks: [
        { kind: 'analogy', text: "Ask one analyst for a forecast and you get their quirks. Ask a hundred independent analysts and average, and the quirks cancel while the shared signal remains. The catch is *independent*: a hundred copies of the same analyst add nothing. Bagging manufactures independence by training each model on a different bootstrap resample of the data." },
        { kind: 'code', code: `import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import BaggingClassifier, VotingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression

X, y = make_classification(n_samples=5000, n_features=20, n_informative=6, flip_y=0.1, random_state=0)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)

tree = DecisionTreeClassifier(random_state=0).fit(X_tr, y_tr)
bag = BaggingClassifier(DecisionTreeClassifier(), n_estimators=200, oob_score=True,
                        n_jobs=-1, random_state=0).fit(X_tr, y_tr)
tree.score(X_te, y_te), bag.score(X_te, y_te), bag.oob_score_
# ≈ (0.807, 0.889, 0.881): bagging beats one deep tree by 8 points; OOB ≈ test accuracy

vote = VotingClassifier([("lr", LogisticRegression(max_iter=1000)), ("bag", bag)], voting="soft")` },
        { kind: 'p', text: 'Each bootstrap sample leaves out about 37% of the rows (`(1 − 1/n)ⁿ → 1/e`). Each tree can be scored on the rows it never saw: the **out-of-bag** estimate, a free validation score. For time series it has the same leakage problem as random CV, so don\'t trust it there.' },
        { kind: 'check', q: 'Why does averaging many trees reduce error?', options: ['Trees get deeper', 'Their individual errors are partly independent and cancel', 'It removes bias', 'It uses more features'], answer: 1, hint: 'Independent analysts.', explain: 'Bagging mostly reduces variance, not bias.' },
      ],
    },
    {
      id: 'forest',
      title: 'Random forests',
      blocks: [
        { kind: 'analogy', text: "If one feature is very strong, every bagged tree asks about it first and they all end up alike. A random forest forces diversity: at each split, a tree may only consider a random subset of the features. Some trees must find other routes, the trees become less correlated, and the average improves." },
        { kind: 'code', code: `rf = RandomForestClassifier(n_estimators=500, max_features="sqrt", min_samples_leaf=5,
                            n_jobs=-1, random_state=0).fit(X_tr, y_tr)
rf.score(X_te, y_te)

from sklearn.ensemble import ExtraTreesClassifier      # random thresholds too: even more diversity
ExtraTreesClassifier(n_estimators=500, n_jobs=-1, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)` },
        { kind: 'list', items: [
          'More trees never overfit; they just cost time. Accuracy plateaus, so stop when it does.',
          '`max_features` is the main knob: lower → more diverse, less correlated trees.',
          'Forests are a superb, low-effort baseline for tabular data and are hard to break.',
        ] },
        { kind: 'check', q: 'What does a random forest add beyond bagging?', options: ['Boosting', 'Random feature subsets at each split', 'Linear leaves', 'Pruning'], answer: 1, hint: 'De-correlating the trees.', explain: 'max_features controls the subset size.' },
      ],
    },
    {
      id: 'boosting',
      title: 'Gradient boosting',
      blocks: [
        { kind: 'analogy', text: "Bagging is a committee voting in parallel. Boosting is a relay of apprentices: each new small tree studies the mistakes the team has made so far (the residuals) and learns to correct them, with each correction scaled down by a learning rate so no single apprentice overreacts. Many weak learners in sequence become one strong one." },
        { kind: 'code', code: `from sklearn.ensemble import HistGradientBoostingClassifier

hgb = HistGradientBoostingClassifier(
    learning_rate=0.05,        # shrinkage per tree
    max_iter=1000,             # upper bound on trees…
    early_stopping=True,       # …stop when the validation score stops improving
    validation_fraction=0.1, n_iter_no_change=30,
    max_leaf_nodes=15, min_samples_leaf=40, l2_regularization=1.0,
    random_state=0,
).fit(X_tr, y_tr)
hgb.n_iter_, hgb.score(X_te, y_te)    # ≈ (199, 0.878): early stopping used 199 of 1000

# Constraints: e.g. predicted default risk must not fall as leverage rises
HistGradientBoostingClassifier(monotonic_cst={"leverage": 1}, categorical_features="from_dtype")` },
        { kind: 'p', text: '`HistGradientBoosting` bins each feature into at most 255 buckets, which makes split finding very fast; it handles NaN natively and supports categoricals. Its design follows LightGBM. For most tabular problems it\'s the first serious model to try.' },
        { kind: 'check', q: 'In boosting, each new tree is trained on…', options: ['A bootstrap sample', 'The current ensemble\'s errors (gradients of the loss)', 'Random features only', 'The test set'], answer: 1, hint: 'Relay of apprentices.', explain: 'Sequential, not parallel like bagging.' },
      ],
    },
    {
      id: 'xgb',
      title: 'XGBoost, LightGBM & stacking',
      blocks: [
        { kind: 'analogy', text: "XGBoost, LightGBM and CatBoost are specialist racing versions of the same engine: C++ cores, GPU support, more knobs, and the winners of countless tabular competitions. Stacking adds a manager: a final model learns how much to trust each base model's predictions." },
        { kind: 'code', code: `# pip install xgboost lightgbm   (both expose sklearn-compatible estimators)
# import xgboost as xgb, lightgbm as lgb
# xgb.XGBClassifier(n_estimators=2000, learning_rate=0.03, max_depth=4,
#                   subsample=0.8, colsample_bytree=0.8, early_stopping_rounds=100)
# lgb.LGBMClassifier(n_estimators=2000, learning_rate=0.03, num_leaves=31)

from sklearn.ensemble import StackingClassifier
stack = StackingClassifier(
    estimators=[("rf", rf), ("hgb", hgb), ("lr", LogisticRegression(max_iter=1000))],
    final_estimator=LogisticRegression(), cv=5, n_jobs=-1,
).fit(X_tr, y_tr)
stack.score(X_te, y_te)` },
        { kind: 'pitfall', text: 'Stacking\'s internal `cv=5` is a random K-fold. On time series, the meta-model learns from out-of-fold predictions that leaked the future. Pass a time-aware splitter, or build the stack by hand with walk-forward predictions (module 10).' },
        { kind: 'check', q: 'What does the final estimator in stacking learn from?', options: ['Raw features only', 'Out-of-fold predictions of the base models', 'The test set', 'Feature importances'], answer: 1, hint: 'The manager watches the analysts\' forecasts.', explain: 'Out-of-fold avoids training it on overfit predictions.' },
      ],
    },
    {
      id: 'importance',
      title: 'Feature importance you can trust',
      blocks: [
        { kind: 'analogy', text: "Permutation importance asks a blunt question: if I scrambled this column on the test set, breaking its link to the target, how much worse would the model get? A feature the model genuinely relies on causes a big drop; a decoration causes none. Because it's measured on held-out data, it reflects generalisation, not memorisation." },
        { kind: 'code', code: `from sklearn.inspection import permutation_importance

X_noise = np.c_[X_tr, np.random.default_rng(1).normal(size=(len(X_tr), 1))]   # add a pure-noise column
rf2 = RandomForestClassifier(n_estimators=300, n_jobs=-1, random_state=0).fit(X_noise, y_tr)
X_te_noise = np.c_[X_te, np.random.default_rng(2).normal(size=(len(X_te), 1))]

mdi = rf2.feature_importances_                        # impurity-based (biased)
perm = permutation_importance(rf2, X_te_noise, y_te, n_repeats=10, random_state=0, n_jobs=-1)
mdi[-1], perm.importances_mean[-1]                    # ≈ (0.020, 0.003): noise gets a 2% MDI share,
                                                      # but scrambling it barely matters` },
        { kind: 'list', items: [
          'Correlated features share importance under permutation (scramble one and the other fills in). Group them, or permute clusters of features together.',
          'SHAP values (the `shap` library) give per-prediction attributions and are widely used for tree models.',
          'In finance, López de Prado calls these MDI (mean decrease impurity) and MDA (mean decrease accuracy); module 11 revisits them.',
        ] },
        { kind: 'check', q: 'A pure-noise feature gets 2% impurity-based importance. Its permutation importance on test data is most likely…', options: ['Much larger', 'About zero', 'Negative and large', 'Exactly 2%'], answer: 1, hint: 'Scrambling noise doesn\'t hurt.', explain: 'That\'s why permutation importance is the safer default.' },
      ],
    },
  ],
  quiz: [
    { q: 'Bagging mainly reduces…', options: ['Bias', 'Variance', 'Training time', 'Features'], answer: 1, explain: 'Averaging noisy models.' },
    { q: 'Out-of-bag samples are…', options: ['Test data', 'Rows not drawn into a given tree\'s bootstrap sample', 'Outliers', 'Validation folds'], answer: 1, explain: 'About 37% per tree.' },
    { q: 'Random forests de-correlate trees by…', options: ['Boosting', 'Random feature subsets per split', 'Pruning', 'Scaling'], answer: 1, explain: 'max_features.' },
    { q: 'Do more trees make a random forest overfit?', options: ['Yes', 'No: performance plateaus', 'Only past 100', 'Only with deep trees'], answer: 1, explain: 'They only cost time.' },
    { q: 'Boosting trains trees…', options: ['In parallel on bootstraps', 'Sequentially, each fixing current errors', 'Randomly', 'On the test set'], answer: 1, explain: 'Gradient boosting.' },
    { q: 'What does the learning rate do in boosting?', options: ['Sets tree depth', 'Shrinks each tree\'s contribution', 'Sets sample size', 'Nothing'], answer: 1, explain: 'Smaller rate, more trees.' },
    { q: 'A known bias of impurity importance?', options: ['Favours low-cardinality features', 'Favours features with many split points, even noise', 'Always zero for noise', 'None'], answer: 1, explain: 'Use permutation importance.' },
    { q: 'Stacking\'s default internal CV on time series…', options: ['Is fine', 'Leaks future information', 'Is required', 'Is time-aware'], answer: 1, explain: 'Pass a time-aware splitter.' },
  ],
}
