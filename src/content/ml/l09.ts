import type { Module } from '../types'

export const l09: Module = {
  n: 9,
  title: 'Unsupervised Learning',
  tour: '9 · Unsupervised Learning Techniques',
  summary: 'Finding structure without labels: k-means and choosing k, density-based clustering with DBSCAN and HDBSCAN, Gaussian mixture models, and two finance applications, market regimes and anomaly detection.',
  topics: ['k-means', 'Choosing k', 'DBSCAN & HDBSCAN', 'Gaussian mixtures & regimes', 'Anomaly detection'],
  cpp23: ['`HDBSCAN` is built into scikit-learn (1.3).', '`KMeans(n_init="auto")` is the default (1.4).'],
  lessons: [
    {
      id: 'kmeans',
      title: 'k-means',
      blocks: [
        { kind: 'analogy', text: "k-means is opening k shops in a town to minimise how far customers walk. Start with shops in random places; each customer goes to the nearest shop; move each shop to the centre of its customers; repeat until nothing moves. The result depends on the starting spots, so it's run several times and the best layout kept." },
        { kind: 'code', code: `import numpy as np
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs
from sklearn.preprocessing import StandardScaler

X, true = make_blobs(n_samples=1500, centers=4, cluster_std=1.2, random_state=0)
km = KMeans(n_clusters=4, n_init="auto", random_state=0).fit(X)
km.cluster_centers_          # the shop locations
km.labels_[:10]              # each point's cluster
km.inertia_                  # sum of squared distances to the nearest centre
km.predict([[0, 0]])         # assign new points` },
        { kind: 'list', items: [
          'k-means assumes round, similarly sized clusters. Elongated or nested shapes break it.',
          'It works on distances, so **scale features** first.',
          '`MiniBatchKMeans` handles millions of points.',
        ] },
        { kind: 'check', q: 'k-means minimises…', options: ['Number of clusters', 'Within-cluster sum of squared distances (inertia)', 'Cluster count variance', 'Labels error'], answer: 1, hint: 'How far customers walk.', explain: 'It finds a local minimum; several initialisations help.' },
      ],
    },
    {
      id: 'choosek',
      title: 'Choosing k',
      blocks: [
        { kind: 'analogy', text: "Inertia always falls as you add shops: one per customer gives zero walking. The elbow method looks for the point where extra shops stop helping much. The silhouette score asks each customer: am I much closer to my own shop than to the next nearest one? Averaged, values near 1 mean clear-cut clusters." },
        { kind: 'code', code: `from sklearn.metrics import silhouette_score

for k in range(2, 8):
    km = KMeans(n_clusters=k, n_init="auto", random_state=0).fit(X)
    print(k, round(km.inertia_), round(silhouette_score(X, km.labels_), 3))
# k=2: 0.437, k=3: 0.434, k=4: 0.454, k=5: 0.406 …
# Inertia keeps falling; silhouette peaks at the true k (4 here)` },
        { kind: 'check', q: 'Why can\'t you choose k by minimising inertia?', options: ['It\'s slow', 'Inertia always decreases as k grows', 'It\'s random', 'It ignores scale'], answer: 1, hint: 'One shop per customer.', explain: 'Use the elbow, silhouette, or a domain reason.' },
      ],
    },
    {
      id: 'dbscan',
      title: 'DBSCAN & HDBSCAN',
      blocks: [
        { kind: 'analogy', text: "Density-based clustering finds crowds rather than shops. A point with enough neighbours nearby is in a crowd; crowds that touch merge; people standing alone are labelled noise. Clusters can be any shape, and you don't choose how many there are." },
        { kind: 'code', code: `from sklearn.cluster import DBSCAN, HDBSCAN
from sklearn.datasets import make_moons

Xm, _ = make_moons(n_samples=600, noise=0.06, random_state=0)
KMeans(n_clusters=2, n_init="auto", random_state=0).fit_predict(Xm)   # cuts both moons in half
db = DBSCAN(eps=0.2, min_samples=5).fit(Xm)
set(db.labels_)                       # {0, 1} plus -1 for any noise points
hdb = HDBSCAN(min_cluster_size=20).fit(Xm)   # no eps to tune; copes with varying density
(hdb.labels_ == -1).sum()             # points judged to be noise` },
        { kind: 'check', q: 'What does label −1 mean in DBSCAN?', options: ['Cluster 0', 'Noise: not in any dense region', 'Error', 'Unassigned yet'], answer: 1, hint: 'People standing alone.', explain: 'Useful for spotting outliers.' },
      ],
    },
    {
      id: 'gmm',
      title: 'Gaussian mixtures & market regimes',
      blocks: [
        { kind: 'analogy', text: "A Gaussian mixture assumes the data comes from several overlapping bell curves and works out the shape, size and weight of each, giving every point a *probability* of belonging to each one. Applied to daily returns, two components often separate into a calm regime (small moves, slight positive drift) and a stressed one (large moves): a soft, probabilistic regime label." },
        { kind: 'code', code: `from sklearn.mixture import GaussianMixture

rng = np.random.default_rng(0)
calm = rng.normal(0.0005, 0.007, 1500)
stress = rng.normal(-0.001, 0.025, 300)
r = np.r_[calm[:750], stress[:150], calm[750:], stress[150:]].reshape(-1, 1)

gm = GaussianMixture(n_components=2, random_state=0).fit(r)
gm.means_.ravel(), np.sqrt(gm.covariances_.ravel())   # one low-vol, one high-vol component
gm.weights_                                           # ≈ [0.80, 0.20] (true 0.83 / 0.17)
p_stress = gm.predict_proba(r)[:, np.argmax(gm.covariances_.ravel())]   # P(stress) each day
gm.bic(r)                                             # compare 1, 2, 3 components with BIC` },
        { kind: 'pitfall', text: 'A GMM fitted on the full history labels each day using parameters estimated from the future. For trading, fit on past data only (expanding or rolling window), and remember a GMM ignores time order entirely: hidden Markov models add "regimes persist" (e.g. `hmmlearn`).' },
        { kind: 'check', q: 'What does a GMM give that k-means doesn\'t?', options: ['Faster training', 'Soft, probabilistic membership and per-cluster shapes', 'Labels', 'No assumptions'], answer: 1, hint: 'Overlapping bell curves.', explain: 'predict_proba returns membership probabilities.' },
      ],
    },
    {
      id: 'anomaly',
      title: 'Anomaly detection',
      blocks: [
        { kind: 'analogy', text: "Anomaly detection learns what normal looks like and flags whatever doesn't fit: a bad tick, a fat-finger order, a broken data feed, a fraudulent transaction. Isolation Forest does it by asking how many random cuts it takes to isolate a point. Odd points are isolated in very few cuts." },
        { kind: 'code', code: `from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor

normal = rng.normal(0, 1, (2000, 3))                   # e.g. scaled order size, price deviation, latency
odd = rng.normal(0, 1, (20, 3)) * 6                    # a few extreme orders
Xa = np.r_[normal, odd]

iso = IsolationForest(contamination=0.01, random_state=0).fit(Xa)
flags = iso.predict(Xa) == -1                          # -1 = anomaly
flags[-20:].mean(), flags[:-20].mean()                 # most planted anomalies caught, few false alarms
iso.score_samples(Xa[:3])                              # lower = more anomalous

LocalOutlierFactor(n_neighbors=20).fit_predict(Xa)     # density-based alternative` },
        { kind: 'check', q: 'Why are anomalies isolated in fewer random cuts?', options: ['They are labelled', 'They sit far from dense regions, so a random split separates them quickly', 'They have NaN', 'They have more features'], answer: 1, hint: 'A lone house vs a terrace.', explain: 'Shorter average path length = more anomalous.' },
      ],
    },
  ],
  quiz: [
    { q: 'k-means needs you to choose…', options: ['eps', 'The number of clusters k', 'A target', 'Nothing'], answer: 1, explain: 'DBSCAN/HDBSCAN don\'t.' },
    { q: 'k-means struggles with…', options: ['Round clusters', 'Elongated or nested shapes', 'Scaled data', 'Many points'], answer: 1, explain: 'It assumes round clusters.' },
    { q: 'A silhouette score near 1 means…', options: ['Bad clustering', 'Points are much closer to their own cluster than others', 'One cluster', 'Noise'], answer: 1, explain: 'Range −1 to 1.' },
    { q: 'DBSCAN clusters are defined by…', options: ['Centroids', 'Density of neighbouring points', 'Labels', 'Variance'], answer: 1, explain: 'Any shape.' },
    { q: 'Main advantage of HDBSCAN over DBSCAN?', options: ['Speed only', 'No eps to tune; handles varying density', 'Needs k', 'Uses labels'], answer: 1, explain: 'Built into sklearn 1.3+.' },
    { q: 'A GMM provides…', options: ['Hard labels only', 'Membership probabilities', 'Regression', 'Distances'], answer: 1, explain: 'Soft clustering.' },
    { q: 'Which criterion helps choose the number of GMM components?', options: ['Accuracy', 'BIC/AIC', 'Inertia only', 'R²'], answer: 1, explain: 'Penalises complexity.' },
    { q: 'IsolationForest labels anomalies as…', options: ['1', '-1', '0', 'NaN'], answer: 1, explain: 'And 1 for normal.' },
  ],
}
