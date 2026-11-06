import type { Module } from '../types'

export const d09: Module = {
  n: 9,
  title: 'From pandas to Models',
  tour: '12 · Introduction to Modeling Libraries',
  summary: 'Handing clean data to modelling libraries: turning frames into design matrices, OLS regression with statsmodels and reading its output, robust (HAC) standard errors for overlapping financial data, and the bridge into scikit-learn.',
  topics: ['Design matrices', 'statsmodels OLS', 'Robust standard errors', 'Handing off to scikit-learn'],
  cpp23: ['statsmodels 0.14 and scikit-learn 1.9 both accept pandas (and, for sklearn, Polars) frames directly and keep column names.'],
  lessons: [
    {
      id: 'design',
      title: 'Design matrices',
      blocks: [
        { kind: 'analogy', text: "A model only eats numbers arranged in a grid: one row per observation, one column per feature (X), plus a target column (y). Building that grid means turning categories into dummy columns, adding a constant column for the intercept, and dropping rows the model can't use, all without letting the future sneak in." },
        { kind: 'code', code: `import pandas as pd, numpy as np
rng = np.random.default_rng(0)
n = 500
df = pd.DataFrame({
    "mkt": rng.normal(0.0004, 0.01, n),
    "smb": rng.normal(0, 0.005, n),
    "sector": rng.choice(["tech", "energy", "fin"], n),
})
df["ret"] = 0.0002 + 1.2 * df["mkt"] + 0.4 * df["smb"] + rng.normal(0, 0.006, n)

X = pd.get_dummies(df[["mkt", "smb", "sector"]], columns=["sector"], drop_first=True, dtype=float)
X.columns.tolist()      # ['mkt', 'smb', 'sector_fin', 'sector_tech'] (energy is the baseline)
y = df["ret"]
X.to_numpy().shape      # (500, 4): what the maths actually sees` },
        { kind: 'list', items: [
          '`drop_first=True` avoids the dummy-variable trap: with an intercept, one category must be the baseline or the columns are perfectly collinear.',
          'Missing values must be handled before fitting; most models refuse NaN (HistGradientBoosting is an exception).',
          'Keep features and target aligned on the same index, and build targets with `shift(-h)` only (module 8).',
        ] },
        { kind: 'check', q: 'Why `drop_first=True` with an intercept?', options: ['Saves memory', 'Otherwise the dummies sum to the constant column: perfect collinearity', 'Sorts categories', 'Required by pandas'], answer: 1, hint: 'Dummy-variable trap.', explain: 'The dropped category becomes the baseline.' },
      ],
    },
    {
      id: 'ols',
      title: 'OLS with statsmodels',
      blocks: [
        { kind: 'analogy', text: "scikit-learn asks \"how well does this predict?\"; statsmodels asks \"what is the relationship, and how sure are we?\". For a factor regression, the question is usually the second: is that alpha real, or within the noise?" },
        { kind: 'code', code: `import statsmodels.api as sm
import statsmodels.formula.api as smf

res = sm.OLS(y, sm.add_constant(df[["mkt", "smb"]])).fit()
res.params.round(4)       # const 0.0004, mkt 1.152, smb 0.4314 (true: 0.0002, 1.2, 0.4)
res.bse                   # standard errors
res.tvalues; res.pvalues
res.rsquared              # ≈ 0.8 on this synthetic data
res.summary()             # the classic table

# Formula interface (R-style): categories handled automatically
res2 = smf.ols("ret ~ mkt + smb + C(sector)", data=df).fit()

# Alpha in annual terms, with a 95% interval
a, se = res.params["const"], res.bse["const"]
(a * 252, (a - 1.96 * se) * 252, (a + 1.96 * se) * 252)` },
        { kind: 'check', q: 'An alpha estimate has a t-statistic of 1.1. What does that suggest?', options: ['Strong evidence of skill', 'The estimate is within ordinary noise of zero', 'The model is wrong', 'Leakage'], answer: 1, hint: 'Roughly, |t| > 2 is the usual bar.', explain: 'And with many strategies tested, the bar should be higher still.' },
      ],
    },
    {
      id: 'hac',
      title: 'Robust standard errors',
      blocks: [
        { kind: 'analogy', text: "Ordinary standard errors assume every observation is a fresh, independent coin toss. Overlapping 20-day returns sampled daily share 19 days with their neighbours, like counting the same coin tosses again. The data looks like 1,000 observations but holds about 50 independent ones, so naive t-statistics come out several times too large." },
        { kind: 'code', code: `# Pure noise: a slow-moving signal and overlapping 20-day forward returns
rng = np.random.default_rng(0)
px = pd.Series(100 * np.exp(rng.normal(0, 0.01, 1000).cumsum()))
signal = pd.Series(rng.normal(size=1000)).rolling(20).mean()   # persistent, like most real signals
fwd20 = px.shift(-20) / px - 1
data = pd.DataFrame({"y": fwd20, "x": signal}).dropna()

naive = smf.ols("y ~ x", data).fit()
hac = smf.ols("y ~ x", data).fit(cov_type="HAC", cov_kwds={"maxlags": 20})   # Newey–West
hac.bse["x"] / naive.bse["x"]             # ≈ 2.8: the honest standard error is ~3× wider
naive.tvalues["x"], hac.tvalues["x"]      # ≈ (5.1, 1.8): "highly significant" noise, then not` },
        { kind: 'pitfall', text: 'Reporting ordinary OLS t-stats on overlapping returns is one of the most common ways to "find" a significant signal in pure noise. Use HAC (Newey–West) errors with lags at least the overlap length, or use non-overlapping samples.' },
        { kind: 'check', q: 'Why do overlapping returns inflate naive t-statistics?', options: ['They have bigger means', 'Neighbouring observations share most of their data, so there\'s far less independent information than rows', 'They are not normal', 'pandas bug'], answer: 1, hint: 'Counting the same coin tosses again.', explain: 'HAC errors account for the autocorrelation.' },
      ],
    },
    {
      id: 'sklearn',
      title: 'Handing off to scikit-learn',
      blocks: [
        { kind: 'analogy', text: "statsmodels is the lab for understanding relationships; scikit-learn is the factory for building predictors at scale: pipelines, cross-validation, dozens of interchangeable models. The DataFrame you've built carries straight over." },
        { kind: 'code', code: `from sklearn.linear_model import LinearRegression
from sklearn.model_selection import TimeSeriesSplit, cross_val_score

model = LinearRegression().fit(df[["mkt", "smb"]], y)
model.coef_, model.intercept_         # same point estimates as OLS
model.feature_names_in_               # ['mkt', 'smb']: names kept from the DataFrame

cross_val_score(LinearRegression(), df[["mkt", "smb"]], y,
                cv=TimeSeriesSplit(5), scoring="r2")
# The Machine Learning course picks up from here: pipelines, model choice, validation.` },
        { kind: 'check', q: 'When would you choose statsmodels over scikit-learn?', options: ['Always', 'When you need inference: standard errors, p-values, confidence intervals', 'For neural networks', 'For speed'], answer: 1, hint: 'Lab vs factory.', explain: 'scikit-learn focuses on prediction and gives no standard errors.' },
      ],
    },
  ],
  quiz: [
    { q: 'A design matrix has…', options: ['One row per feature', 'One row per observation and one column per feature', 'Only the target', 'Strings'], answer: 1, explain: 'X; y is separate.' },
    { q: 'What does sm.add_constant do?', options: ['Scales X', 'Adds an intercept column of ones', 'Removes NaN', 'Adds noise'], answer: 1, explain: 'statsmodels doesn\'t add one automatically.' },
    { q: 'In a formula, C(sector) means…', options: ['A constant', 'Treat sector as categorical', 'Centre it', 'Count'], answer: 1, explain: 'Dummies created automatically.' },
    { q: 'res.bse holds…', options: ['Coefficients', 'Standard errors', 'Residuals', 'R²'], answer: 1, explain: 'Used for t-stats.' },
    { q: 'HAC standard errors correct for…', options: ['Outliers', 'Autocorrelation and heteroskedasticity', 'Missing data', 'Small samples only'], answer: 1, explain: 'Newey–West.' },
    { q: 'Naive t-stats on overlapping returns are…', options: ['Accurate', 'Too large', 'Too small', 'Zero'], answer: 1, explain: 'Effective sample size is much smaller.' },
    { q: 'feature_names_in_ in scikit-learn records…', options: ['Nothing', 'Column names from the training DataFrame', 'Feature importance', 'dtypes'], answer: 1, explain: 'Checked again at predict time.' },
    { q: 'Which library reports p-values for regression coefficients?', options: ['scikit-learn', 'statsmodels', 'NumPy', 'matplotlib'], answer: 1, explain: 'Inference vs prediction.' },
  ],
}
