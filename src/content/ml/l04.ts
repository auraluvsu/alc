import type { Module } from '../types'

export const l04: Module = {
  n: 4,
  title: 'Training Models',
  tour: '4 · Training Models',
  summary: 'What fit() actually does: the normal equation, gradient descent and its variants, polynomial features and learning curves, regularised linear models (ridge, lasso, elastic net), early stopping, and logistic and softmax regression.',
  topics: ['The normal equation', 'Gradient descent', 'Learning curves', 'Ridge, lasso & elastic net', 'Logistic & softmax regression'],
  cpp23: ['`LogisticRegression` handles multiclass as multinomial by default; the `multi_class` parameter was removed (1.7).'],
  lessons: [
    {
      id: 'normal',
      title: 'The normal equation',
      blocks: [
        { kind: 'analogy', text: "For linear regression there's a closed-form answer: one formula gives the best-fitting line directly, like solving an equation instead of guessing and checking. It's exact and fast for thousands of features, but its cost grows roughly with the cube of the feature count, which is why huge models use iterative methods instead." },
        { kind: 'code', code: `import numpy as np
rng = np.random.default_rng(42)
X = 2 * rng.random((200, 1))
y = 4 + 3 * X[:, 0] + rng.normal(0, 1, 200)

Xb = np.c_[np.ones(len(X)), X]                    # add a column of ones for the intercept
theta = np.linalg.solve(Xb.T @ Xb, Xb.T @ y)      # normal equation: (XᵀX)θ = Xᵀy
theta                                             # ≈ [3.69, 3.33]: true [4, 3], plus noise

theta_lstsq, *_ = np.linalg.lstsq(Xb, y, rcond=None)   # SVD-based: what sklearn uses, more stable
from sklearn.linear_model import LinearRegression
LinearRegression().fit(X, y).coef_` },
        { kind: 'check', q: 'Why prefer lstsq/SVD to literally inverting XᵀX?', options: ['Shorter code', 'Numerical stability, especially with correlated features', 'It\'s approximate', 'It\'s required for one feature'], answer: 1, hint: 'Correlated factors make XᵀX nearly singular.', explain: 'Never compute an explicit inverse if a solve will do.' },
      ],
    },
    {
      id: 'gd',
      title: 'Gradient descent',
      blocks: [
        { kind: 'analogy', text: "When there's no closed form, or too many features, you walk downhill instead (as in Python module 27). Batch gradient descent surveys the whole hillside before every step; stochastic GD looks at one random spot; mini-batch looks at a handful. Features on different scales make the valley a long thin canyon, so you zig-zag. Scaling the features makes it a round bowl." },
        { kind: 'code', code: `def batch_gd(Xb, y, lr=0.1, epochs=1000):
    theta = np.zeros(Xb.shape[1])
    m = len(y)
    for _ in range(epochs):
        grad = 2 / m * Xb.T @ (Xb @ theta - y)     # gradient of MSE
        theta -= lr * grad
    return theta

batch_gd(Xb, y)                                    # ≈ same as the normal equation

from sklearn.linear_model import SGDRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
sgd = make_pipeline(StandardScaler(), SGDRegressor(max_iter=1000, tol=1e-5, eta0=0.01, random_state=42))
sgd.fit(X, y)                                      # supports partial_fit for streaming data` },
        { kind: 'check', q: 'Why scale features before gradient descent?', options: ['Required syntax', 'Unscaled features make the loss surface a narrow canyon, so convergence is slow', 'It changes the solution', 'For interpretability only'], answer: 1, hint: 'Canyon vs bowl.', explain: 'The optimum is the same; getting there is much faster.' },
      ],
    },
    {
      id: 'curves',
      title: 'Polynomial features & learning curves',
      blocks: [
        { kind: 'analogy', text: "A learning curve plots performance against training-set size. If training and validation errors converge at a high level, the model is too simple: more data won't help, a richer model will. If there's a persistent gap, it's overfitting: more data or more regularisation will help." },
        { kind: 'code', code: `from sklearn.model_selection import learning_curve
from sklearn.preprocessing import PolynomialFeatures

Xq = 6 * rng.random((300, 1)) - 3
yq = 0.5 * Xq[:, 0] ** 2 + Xq[:, 0] + 2 + rng.normal(0, 1, 300)

for degree in (1, 2, 10):
    model = make_pipeline(PolynomialFeatures(degree), StandardScaler(), LinearRegression())
    sizes, tr, va = learning_curve(model, Xq, yq, cv=5, scoring="neg_root_mean_squared_error",
                                   train_sizes=np.linspace(0.1, 1, 5))
    print(degree, -tr.mean(axis=1)[-1].round(2), -va.mean(axis=1)[-1].round(2))
# 1:  both errors high and close: underfitting (a line through a parabola)
# 2:  both ≈ 1.0, the noise level: about right
# 10: training error lower than validation: some overfitting` },
        { kind: 'check', q: 'Training and validation errors are both high and nearly equal. More data will…', options: ['Fix it', 'Barely help; the model is too simple', 'Make it worse', 'Cause overfitting'], answer: 1, hint: 'Underfitting.', explain: 'Add features or capacity instead.' },
      ],
    },
    {
      id: 'regularised',
      title: 'Ridge, lasso & elastic net',
      blocks: [
        { kind: 'analogy', text: "Regularisation is a budget on coefficient size. Ridge (L2) taxes large coefficients, so it shrinks everything smoothly and copes well with correlated features. Lasso (L1) taxes each unit of size equally, which pushes weak coefficients exactly to zero: built-in feature selection. Elastic net mixes the two. Alpha sets the size of the budget." },
        { kind: 'code', code: `from sklearn.linear_model import Ridge, Lasso, ElasticNet, RidgeCV, LassoCV

n, p = 500, 50
Xf = rng.normal(size=(n, p))                      # 50 candidate factors…
beta = np.zeros(p); beta[:5] = [0.5, -0.3, 0.2, 0.2, -0.1]   # …only 5 matter
yf = Xf @ beta + rng.normal(0, 1, n)

ols = LinearRegression().fit(Xf, yf)
lasso = LassoCV(cv=5, random_state=0).fit(Xf, yf)
ridge = RidgeCV(alphas=np.logspace(-2, 3, 30)).fit(Xf, yf)

(np.abs(ols.coef_) > 1e-6).sum()      # 50: OLS uses every factor, mostly fitting noise
(np.abs(lasso.coef_) > 1e-6).sum()    # far fewer: lasso zeroes most of the noise factors
lasso.alpha_, ridge.alpha_            # chosen by cross-validation` },
        { kind: 'pitfall', text: 'Regularisation penalises coefficient size, so it depends on feature scale: a feature in basis points gets penalised differently from the same feature in decimals. Always standardise before ridge, lasso or elastic net.' },
        { kind: 'check', q: 'Which regulariser tends to set coefficients exactly to zero?', options: ['Ridge (L2)', 'Lasso (L1)', 'Both equally', 'Neither'], answer: 1, hint: 'The diamond-shaped constraint has corners on the axes.', explain: 'Ridge shrinks but rarely zeroes.' },
      ],
    },
    {
      id: 'logistic',
      title: 'Logistic & softmax regression',
      blocks: [
        { kind: 'analogy', text: "Logistic regression is linear regression with a squashing function on the end: compute a weighted score, then pass it through the sigmoid to get a probability between 0 and 1. Softmax regression does the same for several classes at once. Simple, fast, well calibrated and interpretable: the baseline every fancier classifier must beat." },
        { kind: 'code', code: `from sklearn.linear_model import LogisticRegression

Xl = rng.normal(size=(1000, 3))
logit = 0.8 * Xl[:, 0] - 0.5 * Xl[:, 1]
yl = (rng.random(1000) < 1 / (1 + np.exp(-logit))).astype(int)

lr = LogisticRegression(C=1.0).fit(Xl, yl)     # C = 1/alpha: SMALLER C = stronger regularisation
lr.coef_.round(2)                               # [[0.92, -0.47, -0.04]]: true 0.8, -0.5, 0
np.exp(lr.coef_)                                # odds ratios per unit of each feature
lr.predict_proba(Xl[:3])

LogisticRegression(penalty="l1", solver="liblinear", C=0.1)   # sparse coefficients` },
        { kind: 'check', q: 'In LogisticRegression, decreasing C does what?', options: ['Weakens regularisation', 'Strengthens regularisation', 'Changes the loss', 'Nothing'], answer: 1, hint: 'C is the inverse of alpha.', explain: 'A common source of confusion when moving from Ridge.' },
      ],
    },
  ],
  quiz: [
    { q: 'The normal equation solves…', options: ['Logistic regression', 'Linear least squares in closed form', 'Any model', 'Clustering'], answer: 1, explain: '(XᵀX)θ = Xᵀy.' },
    { q: 'Its cost grows roughly with…', options: ['Samples cubed', 'Features cubed', 'Linearly in everything', 'Constant'], answer: 1, explain: 'Linear in samples.' },
    { q: 'Mini-batch GD uses…', options: ['All data each step', 'One sample', 'A small random subset each step', 'No data'], answer: 2, explain: 'A compromise.' },
    { q: 'A persistent gap between training and validation error means…', options: ['Underfitting', 'Overfitting', 'Perfect fit', 'Data leakage only'], answer: 1, explain: 'More data or regularisation.' },
    { q: 'Ridge regression adds…', options: ['An L1 penalty', 'An L2 penalty', 'Dropout', 'A tree'], answer: 1, explain: 'Shrinks coefficients smoothly.' },
    { q: 'Why standardise before regularising?', options: ['Speed only', 'The penalty depends on coefficient scale', 'Required by sklearn', 'For plots'], answer: 1, explain: 'Otherwise units decide which features survive.' },
    { q: 'Logistic regression outputs…', options: ['Raw scores only', 'Probabilities via the sigmoid', 'Clusters', 'Ranks'], answer: 1, explain: 'Softmax for several classes.' },
    { q: 'exp(coef) in logistic regression gives…', options: ['Probabilities', 'Odds ratios', 'R²', 'p-values'], answer: 1, explain: 'Per unit change in the feature.' },
  ],
}
