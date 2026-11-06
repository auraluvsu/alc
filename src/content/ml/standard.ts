import type { StdEntry } from '../standard'

// The scikit-learn tools worth knowing by heart.
export const ML_STANDARD: StdEntry[] = [
  {
    name: 'Pipeline / make_pipeline', header: 'sklearn.pipeline', cat: 'Composition', module: 2,
    summary: 'Chain preprocessing and a model into one estimator.',
    what: 'Each step but the last must be a transformer. `fit` fits every step on the training data in order; `predict` transforms and predicts. Cross-validation then refits everything per fold, which prevents leakage.',
    code: `pipe = make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), Ridge(alpha=1.0))
pipe.fit(X_train, y_train)
pipe.predict(X_test)`,
    when: 'Always, as soon as there is more than one step.',
  },
  {
    name: 'ColumnTransformer', header: 'sklearn.compose', cat: 'Composition', module: 2,
    summary: 'Different preprocessing for different columns.',
    what: 'Takes `(name, transformer, columns)` triples and concatenates their outputs. `remainder="passthrough"` keeps unlisted columns.',
    code: `pre = ColumnTransformer([
    ("num", StandardScaler(), ["mom", "vol"]),
    ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["sector"]),
])`,
    when: 'Mixed numeric and categorical data from a DataFrame.',
  },
  {
    name: 'StandardScaler', header: 'sklearn.preprocessing', cat: 'Preprocessing', module: 2,
    summary: 'Zero mean, unit variance per feature.',
    what: 'Learns `mean_` and `scale_` in `fit`, applies them in `transform`. `RobustScaler` uses median and IQR instead, which suits fat-tailed financial features.',
    code: `sc = StandardScaler().fit(X_train)
X_tr, X_te = sc.transform(X_train), sc.transform(X_test)`,
    when: 'Linear models, SVMs, k-NN, PCA and neural nets.',
  },
  {
    name: 'OneHotEncoder / TargetEncoder', header: 'sklearn.preprocessing', cat: 'Preprocessing', module: 2, since: 'TargetEncoder 1.3',
    summary: 'Turn categories into numbers.',
    what: 'One-hot makes a 0/1 column per category. `TargetEncoder` replaces each category with a cross-fitted mean target, which suits high-cardinality columns (tickers, industries).',
    code: `OneHotEncoder(handle_unknown="ignore", min_frequency=20)
TargetEncoder(target_type="continuous")`,
    when: 'Sectors, exchanges, ratings, any categorical feature.',
  },
  {
    name: 'SimpleImputer', header: 'sklearn.impute', cat: 'Preprocessing', module: 2,
    summary: 'Fill missing values.',
    what: 'Replaces NaN with the mean, median, most frequent value or a constant learned on training data. `add_indicator=True` adds "was missing" flags.',
    code: `SimpleImputer(strategy="median", add_indicator=True)`,
    when: 'Before any model that can\'t handle NaN (HistGradientBoosting can).',
  },
  {
    name: 'train_test_split', header: 'sklearn.model_selection', cat: 'Validation', module: 2,
    summary: 'One random train/test split.',
    what: 'Splits arrays or frames randomly. `stratify=y` keeps class balance; `shuffle=False` keeps order (but prefer an explicit date cut for time series).',
    code: `X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)`,
    when: 'i.i.d. data only: customers, documents, images.',
  },
  {
    name: 'TimeSeriesSplit', header: 'sklearn.model_selection', cat: 'Validation', module: 2,
    summary: 'Cross-validation folds that respect time.',
    what: 'Expanding training windows, each followed by a validation window. `gap=` drops rows between them; `max_train_size=` makes a rolling window.',
    code: `tscv = TimeSeriesSplit(n_splits=5, gap=21, max_train_size=756)
cross_val_score(pipe, X, y, cv=tscv)`,
    when: 'Any time-ordered data. Module 10 adds purging and embargo.',
  },
  {
    name: 'cross_val_score / cross_validate', header: 'sklearn.model_selection', cat: 'Validation', module: 2,
    summary: 'Estimate performance across folds.',
    what: '`cross_val_score` returns one score per fold. `cross_validate` returns several metrics plus fit times, and can return the fitted estimators.',
    code: `res = cross_validate(pipe, X, y, cv=tscv,
                     scoring=["neg_root_mean_squared_error", "r2"], return_train_score=True)`,
    when: 'Comparing models; always look at the spread as well as the mean.',
  },
  {
    name: 'RandomizedSearchCV / GridSearchCV', header: 'sklearn.model_selection', cat: 'Tuning', module: 2,
    summary: 'Hyperparameter search with cross-validation.',
    what: 'Tries parameter combinations, cross-validates each, and refits the best on all training data (`best_estimator_`). Randomized search samples from distributions.',
    code: `search = RandomizedSearchCV(pipe, {"est__alpha": loguniform(1e-4, 1e2)},
                            n_iter=50, cv=tscv, n_jobs=-1)
search.fit(X, y); search.best_params_`,
    when: 'Tuning any model; keep the trial count for multiple-testing adjustments.',
  },
  {
    name: 'Ridge / Lasso / ElasticNet', header: 'sklearn.linear_model', cat: 'Models', module: 4,
    summary: 'Regularised linear regression.',
    what: 'Ridge (L2) shrinks coefficients; Lasso (L1) sets some to zero; ElasticNet mixes both. `RidgeCV` and `LassoCV` choose alpha by cross-validation.',
    code: `RidgeCV(alphas=np.logspace(-3, 3, 13)).fit(X, y).alpha_`,
    when: 'Strong baselines for return prediction and factor models.',
  },
  {
    name: 'HistGradientBoosting', header: 'sklearn.ensemble', cat: 'Models', module: 7,
    summary: 'Fast gradient-boosted trees, scikit-learn\'s LightGBM-style model.',
    what: 'Bins features into histograms for speed, handles NaN natively, supports categorical features, early stopping and monotonic constraints.',
    code: `HistGradientBoostingRegressor(learning_rate=0.05, max_depth=4,
    early_stopping=True, categorical_features="from_dtype")`,
    when: 'The default for tabular data with more than a few thousand rows.',
  },
  {
    name: 'metrics', header: 'sklearn.metrics', cat: 'Evaluation', module: 3,
    summary: 'Scores for regression and classification.',
    what: 'Regression: `root_mean_squared_error`, `mean_absolute_error`, `r2_score`. Classification: `accuracy_score`, `precision_recall_fscore_support`, `roc_auc_score`, `log_loss`, `confusion_matrix`.',
    code: `root_mean_squared_error(y, pred)
roc_auc_score(y, proba[:, 1]); log_loss(y, proba)`,
    when: 'Match the metric to the decision the model feeds.',
  },
  {
    name: 'joblib.dump / skops', header: 'joblib / skops.io', cat: 'Persistence', module: 2,
    summary: 'Save and load fitted models.',
    what: 'joblib pickles the estimator (only load files you trust). `skops.io` uses a safer format that checks types on load. ONNX (module 12) exports to other runtimes.',
    code: `joblib.dump(pipe, "model.joblib"); pipe = joblib.load("model.joblib")`,
    when: 'Saving models between research and production.',
  },
]
