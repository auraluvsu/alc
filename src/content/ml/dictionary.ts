import type { DictEntry } from '../types'

export const ML_DICT: DictEntry[] = [
  // ---------- Concepts ----------
  { term: 'Supervised learning', cat: 'Concepts', module: 1, desc: 'Learning a mapping from inputs to known targets: regression (numbers) or classification (categories).', syntax: `model.fit(X_train, y_train); model.predict(X_new)` },
  { term: 'Unsupervised learning', cat: 'Concepts', module: 1, desc: 'Finding structure without labels: clustering, dimensionality reduction, anomaly detection.', syntax: `KMeans(n_clusters=4).fit_predict(X)` },
  { term: 'Overfitting', cat: 'Concepts', module: 1, desc: 'Fitting noise: excellent training score, poor test score. Fix with more data, simpler models or regularisation.', syntax: `model.score(X_tr, y_tr)  vs  model.score(X_te, y_te)` },
  { term: 'Hyperparameter', cat: 'Concepts', module: 1, desc: 'A setting chosen before training (depth, learning rate, alpha), passed to the constructor.', syntax: `Ridge(alpha=1.0)` },
  { term: 'Leakage', cat: 'Concepts', module: 2, desc: 'Information unavailable at prediction time reaching the model: future data, test-set statistics, overlapping labels.', syntax: `# fit scalers inside a Pipeline; split time series by date` },
  { term: 'Baseline', cat: 'Concepts', module: 2, desc: 'A trivial model (predict the mean, last value or majority class) that any real model must beat.', syntax: `DummyRegressor(strategy="mean")` },
  // ---------- API ----------
  { term: 'fit / predict / transform', cat: 'API', module: 1, desc: 'The estimator protocol. Transformers also have `fit_transform`.', syntax: `scaler.fit_transform(X_train); scaler.transform(X_test)` },
  { term: 'Trailing underscore', cat: 'API', module: 1, desc: 'Attributes learned during fit end in `_`.', syntax: `model.coef_, model.intercept_, scaler.mean_` },
  { term: 'Pipeline', cat: 'API', module: 2, desc: 'Chains transformers and a final estimator; fit/predict run every step in order.', syntax: `Pipeline([("scale", StandardScaler()), ("reg", Ridge())])` },
  { term: 'ColumnTransformer', cat: 'API', module: 2, desc: 'Applies different preprocessing to different columns.', syntax: `ColumnTransformer([("num", StandardScaler(), num), ("cat", OneHotEncoder(), cat)])` },
  { term: 'set_output', cat: 'API', module: 2, desc: 'Makes transformers return pandas (or Polars) frames with feature names.', syntax: `pipe.set_output(transform="pandas")`, since: '1.2' },
  { term: 'step__param', cat: 'API', module: 2, desc: 'Addresses a nested parameter in a pipeline for set_params or searches.', syntax: `{"est__max_depth": [3, 5]}` },
  // ---------- Validation ----------
  { term: 'train_test_split', cat: 'Validation', module: 2, desc: 'Random split for i.i.d. data; `stratify=y` preserves class balance.', syntax: `train_test_split(X, y, test_size=0.2, stratify=y)` },
  { term: 'TimeSeriesSplit', cat: 'Validation', module: 2, desc: 'Expanding-window folds where validation always follows training; `gap=` removes overlap.', syntax: `TimeSeriesSplit(n_splits=5, gap=21)` },
  { term: 'cross_val_score', cat: 'Validation', module: 2, desc: 'Fits and scores a model on each fold. Error scorers are negated.', syntax: `cross_val_score(pipe, X, y, cv=5, scoring="neg_root_mean_squared_error")` },
  { term: 'RandomizedSearchCV', cat: 'Validation', module: 2, desc: 'Samples hyperparameters from distributions and cross-validates each.', syntax: `RandomizedSearchCV(pipe, dists, n_iter=40, cv=tscv)` },
  // ---------- Metrics ----------
  { term: 'RMSE', cat: 'Metrics', module: 1, desc: 'Root mean squared error, in the target\'s units. Sensitive to outliers.', syntax: `root_mean_squared_error(y, pred)`, since: '1.4' },
  { term: 'R²', cat: 'Metrics', module: 1, desc: 'Fraction of variance explained; `estimator.score` for regressors. Tiny values can still be valuable in finance.', syntax: `r2_score(y, pred); model.score(X, y)` },
  { term: 'Precision / recall', cat: 'Metrics', module: 3, desc: 'Of predicted positives, how many were right / of actual positives, how many were found.', syntax: `precision_score(y, pred); recall_score(y, pred)` },
  { term: 'ROC AUC', cat: 'Metrics', module: 3, desc: 'Probability a random positive is ranked above a random negative. Threshold-free.', syntax: `roc_auc_score(y, model.predict_proba(X)[:, 1])` },
]
