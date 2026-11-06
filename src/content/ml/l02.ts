import type { Module } from '../types'

export const l02: Module = {
  n: 2,
  title: 'An End-to-End ML Project',
  tour: '2 · End-to-End Machine Learning Project',
  summary: 'The whole workflow on one problem: frame it, split the data honestly, explore, build a preprocessing pipeline, compare models with cross-validation, tune hyperparameters and evaluate once on the test set.',
  topics: ['Framing the problem', 'Splitting the data', 'Preprocessing pipelines', 'Cross-validation', 'Hyperparameter search', 'Final evaluation & saving'],
  cpp23: [
    '`ColumnTransformer` + `Pipeline` are the backbone; `set_output(transform="pandas")` keeps column names throughout (1.2).',
    '`TargetEncoder` (1.3) for high-cardinality categoricals; `HistGradientBoosting` handles categoricals natively with `categorical_features="from_dtype"` (1.4).',
    '`TimeSeriesSplit(gap=…)` leaves a gap between train and test folds (1.0).',
  ],
  lessons: [
    {
      id: 'frame',
      title: 'Framing the problem',
      blocks: [
        { kind: 'analogy', text: "Before building, ask what the house is for. \"Predict stock returns\" is a wish, not a spec. \"Predict whether each S&P 500 stock beats the index over the next 21 trading days, using data known at today's close, to rank a long-short portfolio rebalanced monthly\" is something you can build, test and be wrong about." },
        { kind: 'list', items: [
          '**Target**: what exactly, over what horizon, measured how? (Excess return vs index, 21-day horizon, sign or magnitude.)',
          '**Decision**: how will predictions be used? Ranking needs good ordering, not calibrated probabilities; position sizing needs both.',
          '**Metric**: choose it to match the decision: RMSE for forecasts, AUC/log-loss for classifiers, and in the end Sharpe after costs.',
          '**Baseline**: what does "always predict the mean" or "last month\'s winners" score? A model must beat this to matter.',
          '**Point-in-time data**: every feature must be knowable at prediction time.',
        ] },
        { kind: 'check', q: 'Why define a baseline before modelling?', options: ['It is required by scikit-learn', 'Without one you can\'t tell whether the model adds anything', 'To save time', 'Baselines are always better'], answer: 1, hint: 'Compared with what?', explain: 'In finance the naive baseline is often very hard to beat.' },
      ],
    },
    {
      id: 'split',
      title: 'Splitting the data',
      blocks: [
        { kind: 'analogy', text: "Set aside the exam paper before you start revising, and lock it in a drawer. For ordinary data, a random sample of rows makes a fair exam. For time series the exam must come from the future: train on the past, test on what came after, with a gap so the last revision notes don't overlap the first exam question." },
        { kind: 'code', code: `import numpy as np, pandas as pd
from sklearn.model_selection import train_test_split, TimeSeriesSplit

# i.i.d. data (customers, loans): random, stratified split
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

# Time-ordered data: split by date
cut = "2024-01-01"
train, test = df.loc[:cut], df.loc[cut:]          # (drop overlap if labels look 21 days ahead)

# Cross-validation folds that respect time, with a gap = label horizon
tscv = TimeSeriesSplit(n_splits=5, gap=21)
for tr_idx, va_idx in tscv.split(X_train):
    ...                                           # train always precedes validation` },
        { kind: 'pitfall', text: 'If labels look 21 days ahead, the last 21 training rows have labels that overlap the first validation rows. Without a gap (or "purging"), the model has partly seen the answers. Module 10 builds purged k-fold and walk-forward validation properly.' },
        { kind: 'check', q: 'Which split is right for daily returns?', options: ['Random with shuffle', 'Chronological, with a gap at least as long as the label horizon', 'Stratified by sign', 'Alphabetical by ticker'], answer: 1, hint: 'The exam must come from the future.', explain: 'Random splits leak through autocorrelation and overlapping labels.' },
      ],
    },
    {
      id: 'pipeline',
      title: 'Preprocessing pipelines',
      blocks: [
        { kind: 'analogy', text: "A pipeline is a production line where every station is calibrated using only the training batch. The scaler learns its mean and spread from training data, and then applies exactly those settings to validation and test data. Calibrating a station on the test batch is leakage, and the pipeline makes it hard to do by accident." },
        { kind: 'code', code: `from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import Ridge

num = ["mom_12m", "vol_60d", "log_mcap", "book_to_price"]
cat = ["sector"]

pre = ColumnTransformer([
    ("num", Pipeline([("impute", SimpleImputer(strategy="median")),
                      ("scale", StandardScaler())]), num),
    ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat),
])
model = Pipeline([("pre", pre), ("reg", Ridge(alpha=1.0))])
model.set_output(transform="pandas")     # outputs keep column names (needs dense one-hot)

model.fit(X_train, y_train)              # every step fits on TRAINING data only
model.predict(X_test)                    # test data is only transformed` },
        { kind: 'list', items: [
          '`fit` on the pipeline calls `fit_transform` on each step, then `fit` on the final estimator.',
          '`handle_unknown="ignore"` stops a new category at prediction time (a sector the model never saw) from crashing it.',
          'Scale features for linear models, SVMs, k-NN and neural nets. Trees don\'t care.',
        ] },
        { kind: 'pitfall', text: 'Calling `StandardScaler().fit(X)` on the full dataset before splitting leaks test-set statistics into training. Put every data-dependent step inside the pipeline so cross-validation refits it per fold.' },
        { kind: 'check', q: 'Why put the scaler inside the pipeline rather than scaling X up front?', options: ['Speed', 'So it\'s fitted only on each training fold, avoiding leakage', 'It\'s required syntax', 'To keep column names'], answer: 1, hint: 'Whose mean and std does it learn?', explain: 'Cross-validation then refits the scaler on each fold\'s training part.' },
      ],
    },
    {
      id: 'cv',
      title: 'Cross-validation & model comparison',
      blocks: [
        { kind: 'analogy', text: "One validation split is one mock exam: you might get lucky. Cross-validation sits five mock exams on different chunks and averages the marks, so you also see how much the score wobbles. A model that scores 0.62 ± 0.01 is a better bet than one at 0.64 ± 0.08." },
        { kind: 'code', code: `from sklearn.model_selection import cross_val_score
from sklearn.ensemble import HistGradientBoostingRegressor

for name, est in {"ridge": Ridge(alpha=1.0),
                  "hgb": HistGradientBoostingRegressor(max_depth=3, learning_rate=0.05)}.items():
    pipe = Pipeline([("pre", pre), ("est", est)])
    scores = cross_val_score(pipe, X_train, y_train, cv=tscv,
                             scoring="neg_root_mean_squared_error")
    print(name, -scores.mean(), scores.std())

from sklearn.dummy import DummyRegressor
cross_val_score(DummyRegressor(), X_train, y_train, cv=tscv,
                scoring="neg_root_mean_squared_error")    # the baseline to beat` },
        { kind: 'p', text: "scikit-learn always *maximises* a score, so error metrics come negated (`neg_root_mean_squared_error`). Flip the sign when you report them." },
        { kind: 'check', q: 'Why are error metrics negative in `cross_val_score`?', options: ['A bug', 'Scorers are maximised, so errors are negated', 'They are log-transformed', 'Negative means good'], answer: 1, hint: 'Higher is always better for a scorer.', explain: 'Negate the mean to report RMSE.' },
      ],
    },
    {
      id: 'tune',
      title: 'Tuning, final evaluation & saving',
      blocks: [
        { kind: 'analogy', text: "Hyperparameter search is tuning a radio: try settings, listen (cross-validation), keep the clearest. The danger is tuning for so long that you start hearing music in the static. Every setting you try is another chance to fit noise, which is why the final test is listened to once." },
        { kind: 'code', code: `from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import loguniform, randint

pipe = Pipeline([("pre", pre), ("est", HistGradientBoostingRegressor())])
search = RandomizedSearchCV(
    pipe,
    {"est__learning_rate": loguniform(1e-3, 0.3),      # step__param addresses a pipeline step
     "est__max_depth": randint(2, 8),
     "est__l2_regularization": loguniform(1e-4, 10)},
    n_iter=40, cv=tscv, scoring="neg_root_mean_squared_error", random_state=0, n_jobs=-1)
search.fit(X_train, y_train)
search.best_params_, -search.best_score_

final = search.best_estimator_          # refitted on all training data
root_mean_squared_error(y_test, final.predict(X_test))   # once. Then stop.

import joblib
joblib.dump(final, "model.joblib")      # trusted files only: it's pickle underneath` },
        { kind: 'list', items: [
          '`RandomizedSearchCV` usually beats `GridSearchCV` for the same budget: it explores more distinct values of the parameters that matter.',
          'Report how many configurations you tried. In finance this is your multiple-testing count.',
          'joblib/pickle files run code when loaded. For sharing, consider `skops.io` (safer) or ONNX (portable to C++, module 12).',
        ] },
        { kind: 'pitfall', text: 'If the test score disappoints and you go back to tune more, the test set has become a validation set. Its score is no longer an honest estimate. Keep a final untouched period, or accept that your estimate is now optimistic.' },
        { kind: 'check', q: 'How do you address a pipeline step\'s hyperparameter in a search?', options: ['est.learning_rate', 'est__learning_rate', 'est-learning_rate', 'learning_rate@est'], answer: 1, hint: 'Double underscore.', explain: '`<step name>__<param>`, nesting as deep as needed.' },
      ],
    },
  ],
  quiz: [
    { q: 'What should you decide before choosing a model?', options: ['The library', 'Target, decision, metric and baseline', 'The GPU', 'The number of features'], answer: 1, explain: 'Framing comes first.' },
    { q: 'What does `stratify=y` do?', options: ['Sorts by y', 'Keeps class proportions equal in train and test', 'Removes outliers', 'Scales y'], answer: 1, explain: 'Useful for imbalanced classification with i.i.d. data.' },
    { q: 'What is `TimeSeriesSplit(gap=21)` for?', options: ['Faster splits', 'Leaving space between train and validation so overlapping labels don\'t leak', 'Monthly data only', 'Shuffling'], answer: 1, explain: 'Match the gap to the label horizon.' },
    { q: 'Where should imputers and scalers be fitted?', options: ['On all data', 'Inside a pipeline, on training folds only', 'On the test set', 'Anywhere'], answer: 1, explain: 'Otherwise statistics leak.' },
    { q: '`handle_unknown="ignore"` on OneHotEncoder…', options: ['Drops the column', 'Encodes unseen categories as all zeros instead of erroring', 'Ignores all categories', 'Speeds up fit'], answer: 1, explain: 'Robust to new categories at prediction time.' },
    { q: 'Which models need feature scaling?', options: ['Decision trees', 'Linear models, SVMs, k-NN and neural nets', 'Random forests', 'None'], answer: 1, explain: 'Trees split on thresholds, so scale doesn\'t matter.' },
    { q: 'Why prefer RandomizedSearchCV over a grid?', options: ['It is exact', 'Better coverage of important parameters for the same budget', 'It never overfits', 'It is required for pipelines'], answer: 1, explain: 'Grids waste trials on unimportant parameters.' },
    { q: 'You tuned again after seeing the test score. The test score is now…', options: ['Still unbiased', 'Optimistically biased', 'Pessimistic', 'Invalid only for trees'], answer: 1, explain: 'It has become a validation set.' },
  ],
}
