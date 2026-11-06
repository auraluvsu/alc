import type { Module } from '../types'

export const n11: Module = {
  n: 11,
  title: 'Deployment: Export, ONNX & LibTorch',
  tour: 'Added · C++',
  summary: 'Moving a trained PyTorch model into a C++ system: capturing the graph with torch.export, compiling it ahead of time with AOTInductor, exporting to ONNX for ONNX Runtime, using LibTorch directly, and shrinking latency with quantisation and careful engineering.',
  topics: ['torch.export', 'AOTInductor in C++', 'ONNX Runtime', 'LibTorch', 'Quantisation & latency'],
  cpp23: ['TorchScript is in maintenance mode; `torch.export` is the supported path.', '`torch.onnx.export(..., dynamo=True)` uses torch.export under the hood (default since 2.9).'],
  lessons: [
    {
      id: 'export',
      title: 'torch.export',
      blocks: [
        { kind: 'analogy', text: "Eager PyTorch is a chef improvising in Python. `torch.export` films one complete run and writes down every operation as a fixed recipe card (an `ExportedProgram`): no Python, no surprises, every shape and type stated. Anything that can't be written down (data-dependent Python branches) has to be rewritten so it can." },
        { kind: 'code', code: `import torch
from torch import nn
from torch.export import export, Dim

class Signal(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(20, 64), nn.GELU(), nn.Linear(64, 1))
    def forward(self, x):
        return torch.sigmoid(self.net(x)).squeeze(-1)

model = Signal().eval()
example = (torch.randn(4, 20),)
batch = Dim("batch", min=1, max=1024)                     # allow any batch size in this range
ep = export(model, example, dynamic_shapes={"x": {0: batch}})
print(ep.graph_module.code)                               # the captured graph, as plain ATen ops
torch.export.save(ep, "signal.pt2")
reloaded = torch.export.load("signal.pt2").module()
x7 = torch.randn(7, 20)
torch.allclose(reloaded(x7), model(x7))                   # True, with a batch size it never saw` },
        { kind: 'check', q: 'Why declare `Dim("batch")`?', options: ['For training', 'Without it the exported graph is specialised to the example\'s exact batch size', 'To use GPUs', 'Required for ONNX only'], answer: 1, hint: 'The recipe card states every shape.', explain: 'Mark dimensions that vary at runtime as dynamic.' },
      ],
    },
    {
      id: 'aoti',
      title: 'AOTInductor in C++',
      blocks: [
        { kind: 'analogy', text: "AOTInductor takes the recipe card and compiles it into a native shared library ahead of time, the same optimising compiler `torch.compile` uses, but with the result packaged as a file. Your C++ program loads the package and calls it like a function, without a Python interpreter anywhere in the process." },
        { kind: 'code', code: `# Python: compile the exported program into a deployable package
path = torch._inductor.aoti_compile_and_package(ep, package_path="signal_aoti.pt2")

# Test from Python before handing over to C++:
runner = torch._inductor.aoti_load_package(path)
runner(torch.randn(3, 20))` },
        { kind: 'code', code: `#include <torch/csrc/inductor/aoti_package/model_package_loader.h>
#include <torch/torch.h>
#include <iostream>

int main() {
    torch::NoGradGuard no_grad;
    torch::inductor::AOTIModelPackageLoader loader("signal_aoti.pt2");   // load once at start-up
    std::vector<torch::Tensor> inputs{torch::randn({3, 20})};
    std::vector<torch::Tensor> outputs = loader.run(inputs);
    std::cout << outputs[0] << '\\n';                                     // 3 probabilities
}
// Build against LibTorch with C++20 or later (required since PyTorch 2.x headers):
// CMake: find_package(Torch); target_link_libraries(app "\${TORCH_LIBRARIES}")`, lang: 'cpp', caption: 'Running an AOTInductor package from C++.' },
        { kind: 'check', q: 'What does AOTInductor produce?', options: ['A Python pickle', 'A compiled native package that C++ can load and run', 'An ONNX file', 'A TorchScript module'], answer: 1, hint: 'Ahead-of-time compilation.', explain: 'Requires the LibTorch runtime libraries.' },
      ],
    },
    {
      id: 'onnx',
      title: 'ONNX export & ONNX Runtime',
      blocks: [
        { kind: 'analogy', text: "ONNX is the neutral exchange format: export once and run with ONNX Runtime from C++, C#, Java, JavaScript or Go, with optional TensorRT or other accelerators underneath, and without shipping LibTorch at all. It's the same hand-off the Machine Learning course uses for scikit-learn models, so one C++ inference layer can serve both." },
        { kind: 'code', code: `# pip install onnx onnxscript onnxruntime
onnx_prog = torch.onnx.export(model, example, dynamo=True,
                              dynamic_shapes={"x": {0: batch}})
onnx_prog.save("signal.onnx")

import onnxruntime as ort, numpy as np
sess = ort.InferenceSession("signal.onnx")
x = np.random.randn(5, 20).astype(np.float32)
onnx_out = sess.run(None, {sess.get_inputs()[0].name: x})[0]
np.abs(onnx_out - model(torch.from_numpy(x)).detach().numpy()).max()   # ≈ 3e-8` },
        { kind: 'p', text: 'The C++ side is identical to ML module 12: create one `Ort::Session` at start-up, wrap your feature buffer with `Ort::Value::CreateTensor` and call `Run`. Choose ONNX when you want a small, framework-neutral runtime; choose AOTInductor/LibTorch when you need PyTorch-specific ops or want the same compiler as training.' },
        { kind: 'check', q: 'Main advantage of ONNX Runtime over LibTorch for deployment?', options: ['Training support', 'A smaller, framework-neutral runtime used across languages', 'Better accuracy', 'Automatic retraining'], answer: 1, hint: 'Export once, run anywhere.', explain: 'And one inference layer for sklearn and PyTorch models.' },
      ],
    },
    {
      id: 'libtorch',
      title: 'LibTorch',
      blocks: [
        { kind: 'analogy', text: "LibTorch is PyTorch's C++ API itself: the same tensors, autograd and `nn` modules, written in C++. It's the right tool when the model must be built, trained or fine-tuned inside a C++ application. It's heavy (hundreds of MB of libraries), so for pure inference an exported artefact is usually lighter." },
        { kind: 'code', code: `#include <torch/torch.h>

struct SignalNet : torch::nn::Module {
    torch::nn::Linear fc1{nullptr}, fc2{nullptr};
    SignalNet() {
        fc1 = register_module("fc1", torch::nn::Linear(20, 64));
        fc2 = register_module("fc2", torch::nn::Linear(64, 1));
    }
    torch::Tensor forward(torch::Tensor x) {
        return torch::sigmoid(fc2(torch::gelu(fc1(x)))).squeeze(-1);
    }
};

int main() {
    auto net = std::make_shared<SignalNet>();
    torch::optim::AdamW opt(net->parameters(), torch::optim::AdamWOptions(1e-3));
    auto x = torch::randn({256, 20});
    auto y = (x.select(1, 0) > 0).to(torch::kFloat);
    for (int step = 0; step < 200; ++step) {
        opt.zero_grad();
        auto loss = torch::binary_cross_entropy(net->forward(x), y);
        loss.backward();
        opt.step();
    }
}`, lang: 'cpp', caption: 'Training a small model entirely in C++ with LibTorch.' },
        { kind: 'check', q: 'When is LibTorch (rather than an exported artefact) the right choice?', options: ['Always', 'When the C++ application itself must build or train models', 'For browsers', 'For smallest binaries'], answer: 1, hint: 'Heavy, but complete.', explain: 'For inference only, export is lighter.' },
      ],
    },
    {
      id: 'quant',
      title: 'Quantisation & latency',
      blocks: [
        { kind: 'analogy', text: "Quantisation stores weights (and sometimes activations) as 8-bit integers instead of 32-bit floats: a quarter of the memory and faster arithmetic, at the cost of a little precision. For small latency-critical models, though, the big wins usually come from engineering: no allocations, a pinned thread, batch size 1, warm caches, and measuring the tail rather than the average." },
        { kind: 'code', code: `# Dynamic int8 quantisation of Linear layers (CPU inference)
from torch.ao.quantization import quantize_dynamic
q_model = quantize_dynamic(model, {nn.Linear}, dtype=torch.qint8)
x = torch.randn(1, 20)
(model(x) - q_model(x)).abs().max()          # small difference

import time
def p50_us(m, x, n=5000):
    with torch.inference_mode():
        for _ in range(500): m(x)
        ts = []
        for _ in range(n):
            t0 = time.perf_counter_ns(); m(x); ts.append(time.perf_counter_ns() - t0)
    return sorted(ts)[n // 2] / 1e3
p50_us(model, x), p50_us(q_model, x)         # ≈ (23, 51) µs: the int8 version is SLOWER at this size` },
        { kind: 'list', items: [
          'For a tiny MLP, Python call overhead (microseconds) dwarfs the arithmetic (nanoseconds), and quantising adds conversion work. Measured while writing this module, the int8 model took about twice as long. Moving inference to C++ matters far more.',
          'Quantisation pays off for larger models and memory-bound inference; always re-validate accuracy, ideally P&L, afterwards.',
          'The Systems Programming course covers pinning, cache behaviour and allocation-free hot paths.',
        ] },
        { kind: 'check', q: 'For a 2-layer MLP called once per tick, the biggest latency win is usually…', options: ['int8 quantisation', 'Removing Python from the hot path (C++ inference, no allocations)', 'A bigger GPU', 'More threads'], answer: 1, hint: 'Where does the time actually go?', explain: 'Overhead, not arithmetic, dominates tiny models.' },
      ],
    },
  ],
  quiz: [
    { q: 'torch.export produces…', options: ['A pickle', 'An ExportedProgram: a full graph of ATen ops', 'ONNX', 'C++ source'], answer: 1, explain: 'No Python needed to describe it.' },
    { q: 'Data-dependent Python branches in forward…', options: ['Export fine', 'Must be rewritten (e.g. with torch.cond) to export', 'Are ignored', 'Speed things up'], answer: 1, explain: 'The graph must be fixed.' },
    { q: 'AOTInductor packages are loaded in C++ with…', options: ['torch::jit::load', 'AOTIModelPackageLoader', 'Ort::Session', 'dlopen only'], answer: 1, explain: 'From LibTorch.' },
    { q: 'TorchScript today is…', options: ['Recommended', 'In maintenance mode', 'Removed in 2.0', 'Required for ONNX'], answer: 1, explain: 'Use torch.export.' },
    { q: 'torch.onnx.export(dynamo=True) …', options: ['Uses TorchScript tracing', 'Uses torch.export under the hood', 'Requires a GPU', 'Exports weights only'], answer: 1, explain: 'The modern exporter.' },
    { q: 'LibTorch is…', options: ['A Python package', 'PyTorch\'s C++ API with tensors, autograd and nn', 'An ONNX runtime', 'A GPU driver'], answer: 1, explain: 'Heavy but complete.' },
    { q: 'Dynamic int8 quantisation targets…', options: ['Convolutions only', 'Linear (and LSTM) weights', 'Embeddings only', 'Losses'], answer: 1, explain: 'Activations quantised on the fly.' },
    { q: 'For tiny models, latency is dominated by…', options: ['FLOPs', 'Call overhead (Python, allocation, dispatch)', 'Disk', 'Training'], answer: 1, explain: 'Move to C++.' },
  ],
}
