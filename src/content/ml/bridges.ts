import type { LangId } from '../../course'

// "Coming from another language" notes for the Machine Learning course.
export const ML_BRIDGES: Record<number, Partial<Record<LangId, string>>> = {
  1: {
    cpp: 'scikit-learn\'s heavy lifting is C, C++ and Cython underneath (liblinear, libsvm, the tree code). In production quant systems, models trained in Python are often run from C++ (module 12).',
    ts: 'The estimator API is a uniform interface: every model implements the same `fit`/`predict` contract, much like an interface that many classes implement.',
    go: 'Like a common interface (`Fit(X, y)`, `Predict(X)`) satisfied by many types. Go\'s ML ecosystem is thin; Go services usually call models trained in Python.',
    java: 'Like an `Estimator` interface with many implementations. Smile and Tribuo are the closest Java libraries; Spark MLlib copies this exact API shape.',
  },
  2: {
    cpp: 'A Pipeline is function composition with state: each stage stores parameters learned in `fit`. In C++ you\'d write the same transforms by hand and must reproduce them exactly at inference time.',
    ts: 'Like composing middleware: each step transforms the data and passes it on; `fit` configures the whole chain once.',
    go: 'Like a chain of `io.Reader` wrappers, except each link also learns parameters during fit.',
    java: 'Spark ML\'s `Pipeline` and `Transformer`/`Estimator` copied this design directly.',
  },
  3: { cpp: 'Classifiers output scores; the threshold is a business decision you implement in the serving code.', ts: 'Precision/recall trade-offs are the same as tuning a spam filter.', go: 'Same maths; Go code usually just applies a threshold to served scores.', java: 'Smile and Tribuo provide the same metrics.' },
  4: { cpp: 'The normal equation is a linear solve: Eigen\'s `ldlt()` or `colPivHouseholderQr()` does the same job.', ts: 'Gradient descent is a loop of small updates, the same in any language.', go: 'gonum/mat can solve least squares directly.', java: 'Apache Commons Math has OLS regression.' },
  5: { cpp: 'scikit-learn\'s SVC wraps libsvm, which is C++.', ts: 'No mainstream JS SVM library; train in Python.', go: 'Rarely used from Go.', java: 'LIBSVM has an official Java port.' },
  6: { cpp: 'A fitted tree is a nest of if/else thresholds, trivial to compile to C++ for microsecond inference.', ts: 'A tree is just nested conditionals: easy to export to JS.', go: 'Same: export the thresholds and evaluate with a loop.', java: 'Same: PMML or code generation is common.' },
  7: { cpp: 'XGBoost and LightGBM are C++ libraries with Python wrappers; their C APIs are used directly in low-latency systems.', ts: 'Trained boosted trees can run in JS via ONNX Runtime Web.', go: 'leaves (pure Go) can load LightGBM/XGBoost models.', java: 'XGBoost4J and LightGBM have JVM bindings.' },
  8: { cpp: 'PCA is an eigendecomposition or SVD: Eigen\'s `SelfAdjointEigenSolver` or `JacobiSVD`.', ts: 'ml-pca exists for JS.', go: 'gonum/stat has PCA.', java: 'Smile and Commons Math have PCA.' },
  9: { cpp: 'k-means is a short loop; mlpack (C++) has fast clustering.', ts: 'Clustering is available in ml.js.', go: 'Small k-means implementations exist; most work happens in Python.', java: 'Smile and ELKI cover clustering.' },
  10: { cpp: 'Validation design is language-independent; the C++ backtester must use exactly the same split logic and timestamps.', ts: 'Same principles; no direct tooling.', go: 'Same principles; no direct tooling.', java: 'Same principles; no direct tooling.' },
  11: { cpp: 'Labelling and bet sizing are often reimplemented in C++ so research and live trading agree.', ts: 'Not language-specific.', go: 'Not language-specific.', java: 'Not language-specific.' },
  12: { cpp: 'This module is C++ on purpose: ONNX Runtime\'s C++ API, Treelite-compiled trees, and how to keep features identical between Python research and the C++ engine.', ts: 'onnxruntime-node/web loads the same ONNX files.', go: 'onnxruntime has Go bindings via cgo.', java: 'ONNX Runtime has official Java bindings.' },
}
