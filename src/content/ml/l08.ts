import type { Module } from '../types'

export const l08: Module = {
  n: 8,
  title: 'Dimensionality Reduction',
  tour: '8 · Dimensionality Reduction',
  summary: 'Why high-dimensional data is hard, principal component analysis and explained variance, PCA on yield curves and stock returns (statistical factor models), and non-linear methods for visualisation.',
  topics: ['The curse of dimensionality', 'PCA', 'Yield-curve PCA', 'Statistical factor models', 'Manifold learning'],
  cpp23: ['PCA supports the Array API (1.2+), so it can run on GPU arrays (CuPy, PyTorch) with `sklearn.set_config(array_api_dispatch=True)`.'],
  lessons: [
    {
      id: 'curse',
      title: 'The curse of dimensionality',
      blocks: [
        { kind: 'analogy', text: "In one dimension, 100 points cover a line well. To cover a square as densely you need 10,000; a cube, a million. With 500 stocks or 200 features, your data is a handful of dust in a vast empty room: every point is far from every other, and \"nearest neighbour\" barely means anything." },
        { kind: 'code', code: `import numpy as np
rng = np.random.default_rng(0)

for d in (2, 10, 100, 1000):
    pts = rng.random((500, d))
    dist = np.linalg.norm(pts[1:] - pts[0], axis=1)     # distances from one point to the rest
    print(d, round(dist.min() / dist.max(), 3))         # 0.015, 0.302, 0.734, 0.903 → heading for 1
# In high dimensions all points are roughly equally far apart` },
        { kind: 'p', text: 'Covariance estimation suffers the same way. With 500 assets you must estimate about 125,000 covariances, but with three years of daily data you have only 756 observations per asset. The sample covariance matrix is then mostly noise, which is why dimensionality reduction and shrinkage are standard in portfolio construction.' },
        { kind: 'check', q: 'Why is k-nearest-neighbours weak in very high dimensions?', options: ['It\'s slow', 'Distances concentrate: nearest and farthest points become almost equally far', 'It can\'t handle floats', 'It needs labels'], answer: 1, hint: 'Dust in an empty room.', explain: 'Reduce dimensions first.' },
      ],
    },
    {
      id: 'pca',
      title: 'PCA',
      blocks: [
        { kind: 'analogy', text: "PCA finds the directions in which your data varies most. Picture a cloud of points shaped like a rugby ball: the first principal component runs along its length, the second across its width, and so on. Keep the first few and you've kept most of the shape with far fewer numbers, like describing a ball by its length and width alone." },
        { kind: 'code', code: `from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

# 10 observed features driven by 2 hidden factors plus noise
F = rng.normal(size=(1000, 2))
loadings = rng.normal(size=(2, 10))
Xp = F @ loadings + 0.3 * rng.normal(size=(1000, 10))

pca = PCA().fit(StandardScaler().fit_transform(Xp))
pca.explained_variance_ratio_.round(3)        # [0.551, 0.349, 0.04, …]: two components ≈ 90%
np.cumsum(pca.explained_variance_ratio_)[:3]

PCA(n_components=0.95)                        # keep enough components for 95% of variance
reducer = make_pipeline(StandardScaler(), PCA(n_components=2))
Z = reducer.fit_transform(Xp)                 # 1000 × 2` },
        { kind: 'pitfall', text: 'PCA is driven by variance, so unscaled features with big numbers (volume in shares, prices in dollars) dominate the first components purely because of their units. Standardise first, unless all features share units (like returns).' },
        { kind: 'check', q: 'What does `explained_variance_ratio_[0]` tell you?', options: ['The first feature\'s variance', 'The share of total variance captured by the first component', 'The noise level', 'Correlation'], answer: 1, hint: 'The rugby ball\'s length.', explain: 'Ratios sum to 1 across all components.' },
      ],
    },
    {
      id: 'yield',
      title: 'Yield-curve PCA',
      blocks: [
        { kind: 'analogy', text: "Daily changes across ten bond maturities look like ten separate series, but they move together in just three characteristic ways. PCA finds them: **level** (all yields up or down together), **slope** (short and long ends moving in opposite directions) and **curvature** (the middle moving against both ends). Together they explain well over 95% of daily moves." },
        { kind: 'code', code: `maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
n = 2000
level = rng.normal(0, 0.06, n)[:, None] * np.ones(10)
slope = rng.normal(0, 0.03, n)[:, None] * (np.log(maturities) - np.log(maturities).mean())
curve = rng.normal(0, 0.015, n)[:, None] * -(np.log(maturities) - np.log(5)) ** 2
dy = level + slope + curve + rng.normal(0, 0.005, (n, 10))      # daily yield changes, %

pca = PCA(n_components=3).fit(dy)          # same units (yield changes): no scaling needed
pca.explained_variance_ratio_.round(3)     # [0.645, 0.288, 0.065]: three components ≈ 99.8%
pca.components_.round(2)
# PC1: all loadings the same sign → level
# PC2: negative at the short end, positive at the long end (or vice versa) → slope
# PC3: ends one sign, middle the other → curvature` },
        { kind: 'p', text: 'Rates desks hedge in exactly these terms: a "level-neutral, slope-neutral" portfolio is built so its exposure to PC1 and PC2 is zero. The real US Treasury curve shows the same three shapes.' },
        { kind: 'check', q: 'A component whose loadings all share the same sign represents…', options: ['Slope', 'Level (parallel shifts)', 'Curvature', 'Noise'], answer: 1, hint: 'Everything moves together.', explain: 'Usually the largest component.' },
      ],
    },
    {
      id: 'factors',
      title: 'Statistical factor models',
      blocks: [
        { kind: 'analogy', text: "Applied to a panel of stock returns, the first principal component is almost always \"the market\": everything moving together. The next few often line up with sectors or styles. Treating the top K components as factors gives a risk model with K × assets loadings instead of a noisy full covariance matrix." },
        { kind: 'code', code: `n_days, n_assets, k = 756, 100, 3
mkt = rng.normal(0.0003, 0.01, n_days)
betas = rng.normal(1, 0.3, n_assets)
sector = rng.integers(0, 4, n_assets)
sector_ret = rng.normal(0, 0.006, (n_days, 4))
R = mkt[:, None] * betas + sector_ret[:, sector] + rng.normal(0, 0.015, (n_days, n_assets))

pca = PCA(n_components=k).fit(R)
pca.explained_variance_ratio_                     # PC1 largest: the market
np.corrcoef(pca.transform(R)[:, 0], mkt)[0, 1]    # |corr| close to 1

# Factor covariance: B Σ_f Bᵀ + D (diagonal idiosyncratic risk)
B = pca.components_.T * np.sqrt(pca.explained_variance_)    # loadings (assets × k)
resid = R - pca.inverse_transform(pca.transform(R))
cov_model = B @ B.T + np.diag(resid.var(axis=0))` },
        { kind: 'check', q: 'The first principal component of a broad equity return panel usually corresponds to…', options: ['Momentum', 'The market factor', 'Size', 'Noise'], answer: 1, hint: 'What moves everything together?', explain: 'Its sign is arbitrary, so the correlation may be negative.' },
      ],
    },
    {
      id: 'manifold',
      title: 'Manifold learning',
      blocks: [
        { kind: 'analogy', text: "PCA can only find flat directions. Some data lies on a curved surface, like a rolled-up carpet. Manifold methods such as t-SNE and UMAP try to unroll it so neighbours stay neighbours. They make striking 2-D pictures but distort global distances, so use them for looking, not for features." },
        { kind: 'code', code: `from sklearn.manifold import TSNE
from sklearn.datasets import make_swiss_roll

Xs, t = make_swiss_roll(n_samples=1500, noise=0.2, random_state=0)
emb_pca = PCA(n_components=2).fit_transform(Xs)                      # squashes the roll flat
emb_tsne = TSNE(n_components=2, perplexity=30, random_state=0).fit_transform(Xs)   # unrolls locally
# umap-learn: umap.UMAP(n_neighbors=15).fit_transform(X)  (faster, has transform() for new data)` },
        { kind: 'list', items: [
          't-SNE has no `transform` for new data, so it can\'t be part of a predictive pipeline.',
          'Cluster sizes and distances between clusters in a t-SNE plot are not meaningful.',
          'For a feature pipeline, prefer PCA (or an autoencoder, Deep Learning module 8).',
        ] },
        { kind: 'check', q: 'Can t-SNE embeddings be used as model features for new data?', options: ['Yes, directly', 'Not easily: t-SNE has no transform for unseen points', 'Only with scaling', 'Only for regression'], answer: 1, hint: 'Check the API.', explain: 'Use it to look, not to build features.' },
      ],
    },
  ],
  quiz: [
    { q: 'The curse of dimensionality implies…', options: ['More features always help', 'Data becomes sparse and distances less meaningful', 'Faster training', 'Lower variance'], answer: 1, explain: 'Exponentially more data needed.' },
    { q: 'PCA components are ordered by…', options: ['Feature index', 'Variance explained', 'Correlation with y', 'Random'], answer: 1, explain: 'Largest first.' },
    { q: 'PCA is unsupervised: it uses…', options: ['y', 'Only X', 'Both', 'Neither'], answer: 1, explain: 'High variance ≠ predictive.' },
    { q: 'Why standardise before PCA on mixed units?', options: ['Speed', 'Otherwise large-unit features dominate', 'Required', 'To remove NaN'], answer: 1, explain: 'Unless units are shared.' },
    { q: 'The three classic yield-curve components are…', options: ['Open, high, low', 'Level, slope, curvature', 'Trend, season, noise', 'Beta, alpha, gamma'], answer: 1, explain: 'Explain most daily moves.' },
    { q: 'PC1 of stock returns is usually…', options: ['A sector', 'The market', 'Noise', 'Momentum'], answer: 1, explain: 'Everything co-moves.' },
    { q: 'A factor risk model replaces the covariance matrix with…', options: ['The identity', 'B Σ_f Bᵀ + diagonal idiosyncratic risk', 'Correlations only', 'A tree'], answer: 1, explain: 'Far fewer parameters.' },
    { q: 't-SNE is best used for…', options: ['Production features', 'Visualisation', 'Regression', 'Scaling'], answer: 1, explain: 'It distorts global structure.' },
  ],
}
