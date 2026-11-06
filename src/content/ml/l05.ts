import type { Module } from '../types'

export const l05: Module = {
  n: 5,
  title: 'Support Vector Machines',
  tour: '5 · Support Vector Machines',
  summary: 'Large-margin classification, soft margins and the C hyperparameter, the kernel trick for non-linear boundaries, SVM regression, and an honest view of when SVMs still make sense today.',
  topics: ['Large-margin classification', 'Soft margins', 'Kernels', 'SVM regression', 'When to use SVMs'],
  cpp23: ['Little has changed; `LinearSVC` defaults to `dual="auto"` (1.5), choosing the faster formulation for your data shape.'],
  lessons: [
    {
      id: 'margin',
      title: 'Large-margin classification',
      blocks: [
        { kind: 'analogy', text: "Many lines can separate two groups of points. An SVM picks the widest possible road between them, the line with the biggest gap to the nearest points on each side. Only those nearest points (the support vectors) decide where the road goes; everything further away could move and nothing would change." },
        { kind: 'code', code: `import numpy as np
from sklearn.svm import SVC, LinearSVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.datasets import make_blobs

X, y = make_blobs(n_samples=200, centers=2, cluster_std=1.0, random_state=6)
svm = make_pipeline(StandardScaler(), SVC(kernel="linear", C=1.0)).fit(X, y)
svm[-1].support_vectors_.shape     # only a handful of points define the boundary
svm[-1].n_support_                 # support vectors per class` },
        { kind: 'pitfall', text: 'SVMs are very sensitive to feature scales because the margin is measured in feature units. Always put a StandardScaler in front of them.' },
        { kind: 'check', q: 'Which training points determine an SVM\'s boundary?', options: ['All of them equally', 'Only the support vectors near the margin', 'The class means', 'Random samples'], answer: 1, hint: 'The edges of the road.', explain: 'That\'s why SVMs are robust to far-away points.' },
      ],
    },
    {
      id: 'soft',
      title: 'Soft margins & C',
      blocks: [
        { kind: 'analogy', text: "Real data has points on the wrong side of any road. A soft margin lets some points stand in the road or even cross it, for a fine. `C` is the size of the fine: a large C means \"almost no violations allowed\" (narrow road, risk of overfitting); a small C means \"a wide road is worth a few violations\" (more regularisation)." },
        { kind: 'code', code: `from sklearn.datasets import make_moons
X2, y2 = make_moons(n_samples=400, noise=0.35, random_state=0)        # noisy, overlapping
for C in (0.01, 1, 1000):
    m = make_pipeline(StandardScaler(), SVC(kernel="rbf", gamma=5, C=C)).fit(X2[:300], y2[:300])
    print(C, m.score(X2[:300], y2[:300]), m.score(X2[300:], y2[300:]), len(m[-1].support_))
# C=0.01:  0.88 train, 0.89 test, 300 support vectors (everything is "in the road")
# C=1:     0.88 train, 0.89 test, 166 support vectors
# C=1000:  0.97 train, 0.80 test,  97 support vectors: chasing noise` },
        { kind: 'check', q: 'An SVM overfits. Which way should you move C?', options: ['Increase', 'Decrease', 'It doesn\'t matter', 'Set it to infinity'], answer: 1, hint: 'Smaller fines, wider road.', explain: 'Small C = more regularisation.' },
      ],
    },
    {
      id: 'kernels',
      title: 'The kernel trick',
      blocks: [
        { kind: 'analogy', text: "Some groups can't be separated by a straight line on a flat sheet: a ring of points around a central cluster, say. Lift the sheet into 3-D (add a feature like distance from the centre) and a flat plane separates them easily. Kernels compute the effect of that lift without ever building the extra features, which is why it's called a trick." },
        { kind: 'code', code: `from sklearn.datasets import make_circles

Xc, yc = make_circles(n_samples=500, factor=0.4, noise=0.1, random_state=0)
linear = make_pipeline(StandardScaler(), SVC(kernel="linear")).fit(Xc, yc)
rbf = make_pipeline(StandardScaler(), SVC(kernel="rbf", gamma="scale", C=1)).fit(Xc, yc)
linear.score(Xc, yc), rbf.score(Xc, yc)      # ≈ 0.58 vs 1.0

# RBF hyperparameters: gamma = how far each point's influence reaches
#   large gamma → wiggly boundary (overfit); small gamma → smooth (underfit)
SVC(kernel="poly", degree=3, coef0=1, C=5)` },
        { kind: 'check', q: 'With the RBF kernel, increasing gamma makes the boundary…', options: ['Smoother', 'More wiggly', 'Linear', 'Unchanged'], answer: 1, hint: 'Each point\'s influence becomes more local.', explain: 'Tune gamma and C together.' },
      ],
    },
    {
      id: 'svr',
      title: 'SVM regression',
      blocks: [
        { kind: 'analogy', text: "SVM regression flips the idea: instead of the widest road with points outside it, fit a tube of width ε around a line and try to get as many points as possible *inside* it. Points within the tube cost nothing, so small errors are ignored, which makes SVR fairly robust to noise." },
        { kind: 'code', code: `from sklearn.svm import SVR, LinearSVR

rng = np.random.default_rng(0)
Xr = np.sort(rng.uniform(-3, 3, 200)).reshape(-1, 1)
yr = np.sin(Xr[:, 0]) + rng.normal(0, 0.2, 200)
svr = make_pipeline(StandardScaler(), SVR(kernel="rbf", C=10, epsilon=0.1)).fit(Xr, yr)
svr.score(Xr, yr)                        # R² ≈ 0.92
len(svr[-1].support_)                    # points on or outside the tube` },
        { kind: 'check', q: 'What does epsilon set in SVR?', options: ['Learning rate', 'The width of the no-penalty tube around predictions', 'Number of support vectors', 'Kernel degree'], answer: 1, hint: 'Errors smaller than this are free.', explain: 'Bigger epsilon → fewer support vectors.' },
      ],
    },
    {
      id: 'when',
      title: 'When to use SVMs',
      blocks: [
        { kind: 'analogy', text: "SVMs were the state of the art for tabular and text classification in the 2000s. They're still a sharp tool for small to medium datasets with many features, but kernel SVMs scale badly (training time grows between quadratically and cubically with samples), and gradient-boosted trees usually beat them on tabular data today." },
        { kind: 'list', items: [
          '**Good fit**: thousands to tens of thousands of samples, many features (text, genomics), clean margins.',
          '**Poor fit**: hundreds of thousands of rows (kernel SVM), noisy low-signal targets like returns, need for calibrated probabilities.',
          '`SVC(probability=True)` bolts on probabilities with an internal cross-validation (slow and not always consistent with `predict`). Prefer `CalibratedClassifierCV` if you need them.',
          '`LinearSVC` and `SGDClassifier(loss="hinge")` scale to millions of rows for linear problems.',
        ] },
        { kind: 'check', q: 'You have 2 million rows of tabular market features. Kernel SVM?', options: ['Ideal', 'Poor choice: training scales very badly with sample count', 'Only with probability=True', 'Only with poly kernel'], answer: 1, hint: 'Quadratic to cubic.', explain: 'Use linear models or gradient boosting.' },
      ],
    },
  ],
  quiz: [
    { q: 'An SVM maximises…', options: ['Accuracy', 'The margin between classes', 'Likelihood', 'Tree depth'], answer: 1, explain: 'The widest road.' },
    { q: 'Support vectors are…', options: ['All points', 'Points on or inside the margin that define the boundary', 'Centroids', 'Outliers removed'], answer: 1, explain: 'Others don\'t matter.' },
    { q: 'Large C means…', options: ['More regularisation', 'Fewer margin violations allowed', 'Wider margin', 'Linear kernel'], answer: 1, explain: 'Risk of overfitting.' },
    { q: 'Why scale features for SVMs?', options: ['Required syntax', 'The margin is measured in feature units', 'Faster prediction only', 'They need integers'], answer: 1, explain: 'Use StandardScaler.' },
    { q: 'The kernel trick lets SVMs…', options: ['Train faster', 'Learn non-linear boundaries without building high-dimensional features explicitly', 'Use trees', 'Skip scaling'], answer: 1, explain: 'Via kernel functions.' },
    { q: 'High gamma in an RBF SVM tends to…', options: ['Underfit', 'Overfit', 'Have no effect', 'Make it linear'], answer: 1, explain: 'Very local influence.' },
    { q: 'SVR ignores errors…', options: ['Larger than epsilon', 'Smaller than epsilon', 'Of any size', 'On support vectors'], answer: 1, explain: 'The ε-insensitive tube.' },
    { q: 'For large tabular datasets today, what usually beats kernel SVMs?', options: ['k-NN', 'Gradient-boosted trees', 'Naive Bayes', 'Polynomial regression'], answer: 1, explain: 'And scales far better.' },
  ],
}
