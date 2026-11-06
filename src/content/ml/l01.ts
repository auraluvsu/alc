import type { Module } from '../types'

export const l01: Module = {
  n: 1,
  title: 'The Machine Learning Landscape',
  tour: '1 · The Machine Learning Landscape',
  summary: 'What machine learning is and isn\'t, the main kinds of learning, the fit/predict workflow, why models overfit, and why markets are an unusually hard place to apply any of it.',
  topics: ['What ML is', 'Kinds of learning', 'The scikit-learn API', 'Overfitting & underfitting', 'Testing & validation', 'Why finance is hard'],
  cpp23: [
    'This course targets scikit-learn 1.9. The book (Géron, 3rd ed.) uses 1.0–1.2.',
    'Every transformer can output pandas or Polars frames with `set_output(transform="pandas")` (1.2) / `"polars"` (1.4).',
    '`root_mean_squared_error` replaces `mean_squared_error(squared=False)` (1.4).',
  ],
  lessons: [
    {
      id: 'what',
      title: 'What machine learning is',
      blocks: [
        { kind: 'analogy', text: "Ordinary programming is writing the recipe yourself. Machine learning is giving a trainee chef a thousand plates of food along with their scores, and letting them work out the recipe. You still choose the kitchen, the ingredients and how plates are scored; the model only fills in the numbers." },
        { kind: 'p', text: 'A model is a function with adjustable parameters, `ŷ = f(x; θ)`. **Training** chooses θ to minimise a loss on examples you already know the answers to. **Inference** applies the fitted function to new inputs. Everything else in this course is a variation on what f looks like, which loss you use and how you check that the result generalises.' },
        { kind: 'list', items: [
          'Use ML when the rules are too complex to write down (images, text), keep changing, or are hidden in lots of data.',
          'Don\'t use it when a clear rule or a formula exists. A lookup table or a linear model you understand beats a black box you don\'t.',
          'In quant work, ML is usually one component: feature construction, signal combination, regime detection or execution, inside a system with risk limits.',
        ] },
        { kind: 'check', q: 'What does "training" a model mean?', options: ['Writing its rules by hand', 'Choosing its parameters to minimise a loss on known examples', 'Running it on new data', 'Collecting data'], answer: 1, hint: 'Who fills in θ?', explain: 'Inference is applying the fitted model to new inputs.' },
      ],
    },
    {
      id: 'kinds',
      title: 'Kinds of learning',
      blocks: [
        { kind: 'analogy', text: "Supervised learning is studying with an answer key. Unsupervised learning is sorting a box of unlabelled photos into piles that look alike. Reinforcement learning is learning to play a game by being told only the final score. Most practical ML, including most signal research, is the first kind." },
        { kind: 'list', items: [
          '**Supervised**: labelled examples. *Regression* predicts a number (next-week return, realised volatility); *classification* predicts a category (up/down, default/no default).',
          '**Unsupervised**: no labels. Clustering (market regimes, similar stocks), dimensionality reduction (PCA on yield curves), anomaly detection (bad ticks, fraud).',
          '**Self-supervised**: labels made from the data itself, such as predicting the next token. It\'s how large language models pretrain (Deep Learning course).',
          '**Reinforcement**: an agent acts and receives rewards, as in optimal execution and market making.',
          '**Batch vs online**: retrain on all data periodically, or update incrementally as data arrives (`partial_fit`).',
        ] },
        { kind: 'check', q: 'Predicting tomorrow\'s realised volatility from past returns is…', options: ['Classification', 'Regression', 'Clustering', 'Reinforcement learning'], answer: 1, hint: 'Is the target a number or a category?', explain: 'A continuous target makes it regression. Predicting "high vs low vol regime" would be classification.' },
      ],
    },
    {
      id: 'api',
      title: 'The scikit-learn API',
      blocks: [
        { kind: 'analogy', text: "scikit-learn is a set of appliances that all use the same plug. Every model has `fit` (learn from data) and `predict` (use what it learned); every preprocessor has `fit` and `transform`. Because the plugs match, you can swap a linear model for a random forest in one line, or chain steps into a pipeline." },
        { kind: 'code', code: `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import root_mean_squared_error

rng = np.random.default_rng(0)
X = rng.normal(size=(500, 3))                     # 500 samples × 3 features
y = 0.5 * X[:, 0] - 0.2 * X[:, 1] + rng.normal(scale=0.1, size=500)

model = LinearRegression()        # 1. choose a model (hyperparameters go here)
model.fit(X[:400], y[:400])       # 2. learn parameters from training data
pred = model.predict(X[400:])     # 3. predict on unseen data
model.coef_, model.intercept_     # ≈ [0.5, -0.2, 0.0], ≈ 0.0: learned attributes end in _
root_mean_squared_error(y[400:], pred)   # ≈ 0.1: the noise level` },
        { kind: 'list', items: [
          '`X` is 2-D (samples × features), `y` is 1-D. A single feature still needs shape `(n, 1)`.',
          'Hyperparameters are set in the constructor; learned parameters appear after `fit` with a trailing underscore.',
          'Swapping models is one line: `from sklearn.ensemble import RandomForestRegressor; model = RandomForestRegressor()`.',
        ] },
        { kind: 'check', q: 'Where do learned parameters appear in scikit-learn?', options: ['Constructor arguments', 'Attributes ending in an underscore, after fit', 'The return value of predict', 'A separate params file'], answer: 1, hint: '`coef_`, `intercept_`…', explain: 'Constructor arguments are hyperparameters; fitted values end in `_`.' },
      ],
    },
    {
      id: 'fit',
      title: 'Overfitting & underfitting',
      blocks: [
        { kind: 'analogy', text: "Overfitting is the student who memorised last year's paper word for word: perfect on that paper, lost on a new one. Underfitting is the student who learned only \"the answer is usually C\". You want the one who learned the method. A model's job is to capture the signal and ignore the noise, and with enough parameters it can memorise both." },
        { kind: 'code', code: `from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline

rng = np.random.default_rng(0)
x = rng.uniform(-1, 1, 60).reshape(-1, 1)
y = np.sin(3 * x).ravel() + rng.normal(scale=0.3, size=60)
x_tr, y_tr, x_te, y_te = x[:30], y[:30], x[30:], y[30:]

for degree in (1, 5, 25):
    m = make_pipeline(PolynomialFeatures(degree), LinearRegression()).fit(x_tr, y_tr)
    print(degree, m.score(x_tr, y_tr), m.score(x_te, y_te))   # R² train vs test
# 1:  0.45 train, 0.47 test: underfits (a straight line through a wave)
# 5:  0.84 train, 0.88 test: about right
# 25: 0.93 train, 0.55 test: overfits (it bends to chase the noise)` },
        { kind: 'list', items: [
          'Fix **underfitting** with a more flexible model, better features or less regularisation.',
          'Fix **overfitting** with more data, a simpler model, regularisation, or fewer, better features.',
          'The gap between training and test score is your overfitting gauge. Watch it, not just the test score.',
        ] },
        { kind: 'check', q: 'Training R² is 0.98 and test R² is 0.10. What\'s wrong?', options: ['Underfitting', 'Overfitting', 'A perfect model', 'Not enough features'], answer: 1, hint: 'Look at the gap.', explain: 'The model memorised the training set. Simplify, regularise or get more data.' },
      ],
    },
    {
      id: 'finance',
      title: 'Testing, and why finance is hard',
      blocks: [
        { kind: 'analogy', text: "Most ML datasets are like photos of cats: the next cat will look like the last thousand. Markets are like a poker table where the other players read your strategy and change theirs. The signal is faint, the rules drift, and every time you test an idea on the same history you use up a little of its honesty." },
        { kind: 'list', items: [
          '**Hold out a test set** and touch it once, at the very end. Tune on a separate validation set or with cross-validation.',
          '**Low signal-to-noise**: a daily-return model with an R² of 0.01 can be valuable; 0.3 almost certainly means a bug or leakage.',
          '**Non-stationarity**: relationships change across regimes, so a model trained on 2015–2019 may not describe 2026.',
          '**Leakage**: features that secretly contain the future (restated fundamentals, centred rolling windows, random splits of time series). Module 10 is entirely about this.',
          '**Multiple testing**: try 200 strategies and the best one looks great by luck alone. Count your trials.',
        ] },
        { kind: 'pitfall', text: 'The most common bug in financial ML is a random `train_test_split` on time-ordered data. Overlapping windows and autocorrelation let information leak from test into train, and the backtest looks brilliant until it trades.' },
        { kind: 'check', q: 'Your daily-return classifier has 75% test accuracy. Your first thought should be…', options: ['Deploy it', 'Look for leakage: that\'s implausibly high', 'Add more features', 'Train longer'], answer: 1, hint: 'How strong are real signals in daily returns?', explain: 'Genuine daily edges are usually a few points above 50%. Check splits, feature timing and label construction.' },
      ],
    },
  ],
  quiz: [
    { q: 'Which is a supervised task?', options: ['Clustering stocks', 'Predicting default from labelled loan histories', 'PCA on yields', 'Finding outliers without labels'], answer: 1, explain: 'It has labelled targets.' },
    { q: 'What is the scikit-learn estimator workflow?', options: ['train → run', 'fit → predict (or transform)', 'compile → execute', 'load → save'], answer: 1, explain: 'Uniform across all estimators.' },
    { q: 'What shape must X have for one feature?', options: ['(n,)', '(n, 1)', '(1, n)', 'Any'], answer: 1, explain: 'Use `reshape(-1, 1)`.' },
    { q: 'High train score and low test score indicates…', options: ['Underfitting', 'Overfitting', 'Leakage only', 'Nothing'], answer: 1, explain: 'The model memorised noise.' },
    { q: 'Which helps against overfitting?', options: ['More parameters', 'Regularisation and more data', 'Testing on training data', 'Removing the test set'], answer: 1, explain: 'Simplify or constrain the model.' },
    { q: 'When should you use the test set?', options: ['For tuning hyperparameters', 'Once, at the end', 'Every epoch', 'Never'], answer: 1, explain: 'Tune with validation data or cross-validation.' },
    { q: 'Why is a random split dangerous for market data?', options: ['It is slow', 'Future information leaks into training', 'It changes the dtype', 'It is not allowed'], answer: 1, explain: 'Split by time.' },
    { q: 'What replaced `mean_squared_error(squared=False)`?', options: ['rmse()', 'root_mean_squared_error', 'mse_root', 'sqrt_error'], answer: 1, explain: 'Added in scikit-learn 1.4.' },
  ],
}
