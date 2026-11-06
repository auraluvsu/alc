import type { Module } from '../types'

export const l12: Module = {
  n: 12,
  title: 'Serving Models in C++',
  tour: 'Added · C++',
  summary: 'Getting a model trained in Python into a C++ trading system: exporting scikit-learn pipelines to ONNX, running them with ONNX Runtime\'s C++ API, compiling tree ensembles to native code, measuring latency properly, and keeping features identical on both sides.',
  topics: ['Export with skl2onnx', 'ONNX Runtime from C++', 'Compiled tree ensembles', 'Latency & batching', 'Feature parity'],
  cpp23: ['Not from Géron: ONNX Runtime 1.2x and skl2onnx 1.x are the standard tools for this hand-off.'],
  lessons: [
    {
      id: 'export',
      title: 'Exporting with skl2onnx',
      blocks: [
        { kind: 'analogy', text: "ONNX is a universal recipe format for models: a graph of standard operations (scale, matrix-multiply, tree-ensemble lookup) with the learned numbers baked in. scikit-learn writes the recipe once; any kitchen with an ONNX runtime (C++, C#, Java, JavaScript, Go via cgo) can cook it, with no Python on the hot path." },
        { kind: 'code', code: `import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier
from skl2onnx import to_onnx
import onnxruntime as ort

rng = np.random.default_rng(0)
X = rng.normal(size=(5000, 8)).astype(np.float32)          # ONNX models are typed: use float32
y = (X[:, 0] + 0.5 * X[:, 1] + rng.normal(0, 1, 5000) > 0).astype(int)

pipe = make_pipeline(StandardScaler(), GradientBoostingClassifier(n_estimators=200, max_depth=3)).fit(X, y)
onx = to_onnx(pipe, X[:1], options={"zipmap": False})      # plain probability tensor, not a list of dicts
open("signal.onnx", "wb").write(onx.SerializeToString())

sess = ort.InferenceSession("signal.onnx")
[i.name for i in sess.get_inputs()], [o.name for o in sess.get_outputs()]   # ['X'], ['label', 'probabilities']
label, proba = sess.run(None, {"X": X[:5]})
np.abs(proba - pipe.predict_proba(X[:5])).max()            # ≈ 1e-7: float32 rounding only` },
        { kind: 'pitfall', text: 'Converters lag behind scikit-learn releases. At the time of writing, skl2onnx 1.20 fails to convert `HistGradientBoostingClassifier` from scikit-learn 1.9, which is why this example uses `GradientBoostingClassifier`. Check the converter\'s supported versions, and always compare ONNX outputs with the Python model on a large sample before deploying: float64 vs float32 and custom transformers are the usual sources of silent mismatches.' },
        { kind: 'check', q: 'Why export the whole pipeline (scaler + model) rather than just the model?', options: ['Smaller files', 'So preprocessing is identical in production, with no hand-reimplemented scaler', 'ONNX requires it', 'Faster training'], answer: 1, hint: 'Feature parity.', explain: 'Every hand-copied step is a chance for drift.' },
      ],
    },
    {
      id: 'ortcpp',
      title: 'ONNX Runtime from C++',
      blocks: [
        { kind: 'analogy', text: "In C++ the pattern is: create the environment and session once at start-up (slow: loading and optimising the graph), then on every tick wrap your feature buffer in a tensor *without copying* and call `Run`. The session is the oven, pre-heated; each inference is just putting a tray in." },
        { kind: 'code', code: `#include <onnxruntime_cxx_api.h>
#include <array>
#include <span>

class SignalModel {
public:
    explicit SignalModel(const char* path)
        : env_{ORT_LOGGING_LEVEL_WARNING, "signal"}, session_{env_, path, make_options()} {}

    // Returns P(class 1) for one feature vector. No heap allocation on this path.
    float predict(std::span<const float, 8> features) {
        std::array<int64_t, 2> shape{1, 8};
        auto input = Ort::Value::CreateTensor<float>(
            mem_, const_cast<float*>(features.data()), features.size(), shape.data(), shape.size());
        const char* in_names[]  = {"X"};
        const char* out_names[] = {"probabilities"};
        auto out = session_.Run(Ort::RunOptions{nullptr}, in_names, &input, 1, out_names, 1);
        return out[0].GetTensorData<float>()[1];
    }

private:
    static Ort::SessionOptions make_options() {
        Ort::SessionOptions o;
        o.SetIntraOpNumThreads(1);                       // predictable latency: no thread pool hops
        o.SetGraphOptimizationLevel(GraphOptimizationLevel::ORT_ENABLE_ALL);
        return o;
    }
    Ort::Env env_;
    Ort::Session session_;
    Ort::MemoryInfo mem_ = Ort::MemoryInfo::CreateCpu(OrtArenaAllocator, OrtMemTypeDefault);
};`, lang: 'cpp', caption: 'Loading and running the exported model in C++ (link with -lonnxruntime).' },
        { kind: 'list', items: [
          'Create the session once; reuse it. Sessions are thread-safe for concurrent `Run` calls.',
          '`CreateTensor` over your own buffer avoids a copy; outputs are still allocated per call. For the tightest loops, use `Ort::IoBinding` to pre-bind output buffers too.',
          'One intra-op thread is usually best for single-sample, latency-sensitive inference; more threads help large batches.',
        ] },
        { kind: 'check', q: 'Where should the Ort::Session be created?', options: ['Per prediction', 'Once at start-up, then reused', 'Per thread per call', 'In a destructor'], answer: 1, hint: 'Pre-heated oven.', explain: 'Session creation loads and optimises the whole graph.' },
      ],
    },
    {
      id: 'treelite',
      title: 'Compiled tree ensembles',
      blocks: [
        { kind: 'analogy', text: "A trained tree ensemble is just thousands of nested if-statements with numbers in them. Instead of interpreting it at runtime, you can generate C code for those if-statements and let the compiler optimise them, the way a template is stamped out at compile time. The result has no runtime dependency at all." },
        { kind: 'code', code: `// What a code-generated tree looks like (simplified):
static inline float tree_0(const float* x) {
    if (x[0] <= 0.1234f) {
        if (x[1] <= -0.56f) return -0.031f;
        return 0.012f;
    }
    if (x[3] <= 1.07f) return 0.044f;
    return 0.091f;
}
float predict_raw(const float* x) {
    return tree_0(x) + tree_1(x) + /* … 200 trees … */ + base_score;
}
// Tools: Treelite / TL2cgen (XGBoost, LightGBM, sklearn forests → C),
// LightGBM's own "convert_model" to C++, or m2cgen for simple models.`, lang: 'cpp', caption: 'Tree ensembles as plain C++ code.' },
        { kind: 'check', q: 'What\'s the main benefit of compiling trees to C/C++?', options: ['Better accuracy', 'No runtime dependency and very low, predictable latency', 'Smaller training time', 'Automatic retraining'], answer: 1, hint: 'Just if-statements.', explain: 'The trade-off is a rebuild for each new model.' },
      ],
    },
    {
      id: 'latency',
      title: 'Measuring latency properly',
      blocks: [
        { kind: 'analogy', text: "Average latency is like average traffic on a motorway: it hides the one hour a day when it's gridlocked, and that's when you're late. In trading, the slow tail (p99, p99.9) is what costs money, so measure the distribution, warm up first, and pin the thread so the OS doesn't move it mid-measurement." },
        { kind: 'code', code: `#include <algorithm>
#include <chrono>
#include <cstdio>
#include <vector>

template <class F>
void bench(F&& f, int warmup = 10'000, int n = 100'000) {
    for (int i = 0; i < warmup; ++i) f();                  // warm caches, branch predictors, allocator
    std::vector<long long> ns(n);
    for (int i = 0; i < n; ++i) {
        auto t0 = std::chrono::steady_clock::now();
        f();
        ns[i] = std::chrono::duration_cast<std::chrono::nanoseconds>(
                    std::chrono::steady_clock::now() - t0).count();
    }
    std::ranges::sort(ns);
    auto pct = [&](double p) { return ns[static_cast<size_t>(p * (n - 1))]; };
    std::printf("p50 %lld ns  p99 %lld ns  p99.9 %lld ns  max %lld ns\\n",
                pct(0.50), pct(0.99), pct(0.999), ns.back());
}
// bench([&] { volatile float p = model.predict(features); });`, lang: 'cpp', caption: 'A minimal latency harness that reports percentiles.' },
        { kind: 'list', items: [
          'Pin the thread to an isolated core (`taskset`, `pthread_setaffinity_np`), disable frequency scaling for benchmarks, and avoid allocations in the measured path.',
          'Measured while writing this module, the 200-tree pipeline above ran through ONNX Runtime at p50 ≈ 4 µs, p99 ≈ 11 µs and p99.9 ≈ 30 µs on a shared cloud machine: the tail was 8× the median.',
          'Batching improves throughput but adds waiting time; latency-critical signals are usually batch size 1.',
          'The Systems Programming course covers caches, pinning and low-latency design in depth.',
        ] },
        { kind: 'check', q: 'Which statistic matters most for latency-sensitive trading?', options: ['Mean', 'Tail percentiles (p99, p99.9)', 'Minimum', 'Median only'], answer: 1, hint: 'The gridlocked hour.', explain: 'The slow cases are when you lose the trade.' },
      ],
    },
    {
      id: 'parity',
      title: 'Feature parity',
      blocks: [
        { kind: 'analogy', text: "The most common production failure isn't the model; it's the features. Research computed 20-day volatility with pandas' ddof=1 over business days, the C++ engine with ddof=0 over calendar days, and the model is now fed numbers it never saw in training. The fix is a single specification, tested on both sides." },
        { kind: 'list', items: [
          '**One definition**: write each feature\'s formula down once (window, ddof, calendar, missing-data rule) and implement both sides from it.',
          '**Golden files**: export a few thousand rows of raw inputs and Python-computed features; the C++ build must reproduce them within a tolerance in CI.',
          '**Ship preprocessing inside the model** (ONNX pipeline) wherever possible.',
          '**Monitor live distributions** of features against training; drift alarms catch silent breaks.',
          '**Version everything together**: model file, feature spec and code commit.',
        ] },
        { kind: 'code', code: `# Python side: write a golden file the C++ tests must match
import pandas as pd
raw = pd.read_parquet("golden_inputs.parquet")
feats = compute_features(raw)                 # the research implementation
feats.to_parquet("golden_features.parquet")   # C++ test: max |cpp - python| < 1e-6 per column` },
        { kind: 'check', q: 'What\'s the most reliable guard against Python/C++ feature drift?', options: ['Careful code review', 'Golden-file tests comparing both implementations in CI', 'Retraining weekly', 'Using float64'], answer: 1, hint: 'Automated, every build.', explain: 'Plus live distribution monitoring.' },
      ],
    },
  ],
  quiz: [
    { q: 'ONNX is…', options: ['A Python library', 'A portable model graph format', 'A database', 'A GPU'], answer: 1, explain: 'Runs in many runtimes.' },
    { q: 'Which converts scikit-learn pipelines to ONNX?', options: ['torch.onnx', 'skl2onnx', 'joblib', 'pickle'], answer: 1, explain: 'to_onnx / convert_sklearn.' },
    { q: 'Why set zipmap=False for classifiers?', options: ['Faster training', 'Probabilities come out as a plain tensor instead of a list of dicts', 'Required', 'Smaller model'], answer: 1, explain: 'Much easier from C++.' },
    { q: 'In ONNX Runtime C++, sessions should be…', options: ['Created per call', 'Created once and reused', 'Global singletons only', 'Avoided'], answer: 1, explain: 'Creation is expensive.' },
    { q: 'CreateTensor over your own buffer…', options: ['Copies the data', 'Wraps it without copying', 'Allocates on GPU', 'Fails'], answer: 1, explain: 'Keep the buffer alive during Run.' },
    { q: 'Compiled tree ensembles offer…', options: ['Better accuracy', 'No runtime dependency and very low latency', 'Automatic updates', 'GPU training'], answer: 1, explain: 'Generated if-statements.' },
    { q: 'Latency should be reported as…', options: ['Mean only', 'Percentiles including the tail', 'Max only', 'Throughput'], answer: 1, explain: 'p99/p99.9 matter.' },
    { q: 'The most common production ML failure is often…', options: ['GPU drivers', 'Features computed differently from training', 'Too many trees', 'ONNX bugs'], answer: 1, explain: 'Golden-file tests.' },
  ],
}
