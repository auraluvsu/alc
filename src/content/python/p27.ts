import type { Module } from '../types'

export const p27: Module = {
  n: 27,
  title: 'PyTorch: Tensors & Autograd',
  tour: 'Added · PyTorch tensors',
  summary: 'Tensors as NumPy arrays that can live on a GPU and remember how they were computed; devices and dtypes; automatic differentiation; and fitting a model by gradient descent from scratch.',
  topics: ['Tensors vs ndarrays', 'Devices & dtypes', 'Autograd', 'Gradient descent by hand', 'No-grad & detach'],
  cpp23: [
    'This module targets PyTorch 2.15. The `torch.accelerator` API gives device-agnostic code for CUDA, Apple MPS, Intel XPU and others.',
    '`torch.compile` (2.0+) JIT-compiles models for large speed-ups with one line.',
    '`torch.export` is the recommended way to save models for deployment; TorchScript is in maintenance mode.',
  ],
  lessons: [
    {
      id: 'tensors',
      title: 'Tensors vs NumPy arrays',
      blocks: [
        { kind: 'analogy', text: "A tensor is a NumPy array with two extra powers. It can be moved onto a GPU (a factory floor with thousands of small workers instead of a few skilled ones), and it can keep a receipt of every operation that produced it, so PyTorch can later work backwards through the receipts to find gradients." },
        { kind: 'code', code: `import torch
import numpy as np

t = torch.tensor([[1.0, 2.0], [3.0, 4.0]])
t.shape, t.dtype, t.device          # (torch.Size([2, 2]), torch.float32, device(type='cpu'))
torch.zeros(3, 4); torch.ones(5); torch.arange(6).reshape(2, 3)
torch.randn(252, 4)                 # standard normal (float32 by default, unlike NumPy's float64)

t @ t.T; t * 2; t.sum(dim=0); t.mean(); t[:, 0]   # same ideas as NumPy: dim= instead of axis=

a = np.arange(3.0)
x = torch.from_numpy(a)             # shares memory with the NumPy array (CPU)
a[0] = 99
x[0]                                # tensor(99., dtype=torch.float64)
x.numpy()                           # back to NumPy, also sharing memory` },
        { kind: 'list', items: [
          'Indexing, slicing (views), broadcasting and most function names carry straight over from NumPy.',
          'Default float dtype is **float32**, which is what GPUs are fast at. NumPy defaults to float64, so mixing them silently changes precision.',
          '`torch.from_numpy` and `.numpy()` share memory on the CPU; `torch.tensor(a)` always copies.',
        ] },
        { kind: 'check', q: 'What is the default dtype of `torch.randn(3)`?', options: ['float64', 'float32', 'float16', 'int64'], answer: 1, hint: 'What are GPUs fastest at?', explain: 'PyTorch defaults to float32; NumPy defaults to float64.' },
      ],
    },
    {
      id: 'devices',
      title: 'Devices & dtypes',
      blocks: [
        { kind: 'analogy', text: "Every tensor lives in one building: the CPU or an accelerator (a CUDA GPU, Apple's MPS, and so on). An operation can only combine tensors in the same building. Moving data between buildings is a lorry trip (a PCIe copy), so you load the lorry once, do all the work over there, and only bring back the answer." },
        { kind: 'code', code: `device = torch.accelerator.current_accelerator() if torch.accelerator.is_available() else torch.device("cpu")
# (older code: device = "cuda" if torch.cuda.is_available() else "cpu")

x = torch.randn(10_000, 512, device=device)    # create directly on the device
w = torch.randn(512, 64).to(device)            # or move an existing tensor
y = x @ w                                      # runs on the accelerator
y_cpu = y.cpu()                                # bring results back
# x @ torch.randn(512, 64)                     # RuntimeError: tensors on different devices

half = x.to(torch.bfloat16)                    # low precision: faster, less memory
with torch.autocast(device_type=device.type, dtype=torch.bfloat16):
    y = x @ w                                  # mixed precision for the heavy maths` },
        { kind: 'list', items: [
          'GPU operations are **asynchronous**: Python queues them and moves on. Timing needs `torch.accelerator.synchronize()`, and `.item()` / `.cpu()` force a wait.',
          'Small tensors are often faster on the CPU: the GPU only pays off when there is enough parallel work to hide the transfer and launch overhead.',
          '`bfloat16` keeps float32\'s range with less precision, which is the usual choice for training on modern hardware.',
        ] },
        { kind: 'check', q: 'You add a CPU tensor to a GPU tensor. What happens?', options: ['PyTorch copies automatically', 'RuntimeError: expected all tensors to be on the same device', 'The result is on the CPU', 'It silently returns zeros'], answer: 1, hint: 'Same building rule.', explain: 'Move one of them with `.to(device)` first. PyTorch never moves data between devices implicitly.' },
      ],
    },
    {
      id: 'autograd',
      title: 'Autograd',
      blocks: [
        { kind: 'analogy', text: "Autograd is a receipt printer attached to every calculation. Mark a tensor with `requires_grad=True`, and every operation using it prints a receipt linking result to inputs. Call `.backward()` on the final number, and PyTorch walks the receipts in reverse, applying the chain rule at each step, to compute how much each input influenced the result." },
        { kind: 'stepper', title: 'Step through: a tiny computation graph', code: [
          'w = torch.tensor(2.0, requires_grad=True)',
          'x = torch.tensor(3.0)',
          'y = w * x          # 6',
          'loss = (y - 10) ** 2   # 16',
          'loss.backward()',
          'print(w.grad)',
        ], steps: [
          { line: 1, note: '`w` is a parameter we want gradients for.', memory: [{ name: 'w', value: '2.0 (requires_grad)' }] },
          { line: 2, note: '`x` is data, so no gradient is needed.', memory: [{ name: 'w', value: '2.0 (requires_grad)' }, { name: 'x', value: '3.0' }] },
          { line: 3, note: 'The multiply records a receipt: y = w·x, with grad_fn=MulBackward.', memory: [{ name: 'y', value: '6.0', note: 'grad_fn = MulBackward0', kind: 'ptr' }] },
          { line: 4, note: 'Another receipt: loss = (y−10)².', memory: [{ name: 'loss', value: '16.0', note: 'grad_fn = PowBackward0', kind: 'ptr' }] },
          { line: 5, note: 'Walk backwards: d(loss)/dy = 2(y−10) = −8; dy/dw = x = 3; so d(loss)/dw = −8 × 3 = −24.', memory: [{ name: 'dloss/dy', value: '-8.0' }, { name: 'dy/dw', value: '3.0' }] },
          { line: 6, note: 'Prints `tensor(-24.)`. The gradient says: increase w and the loss falls.', memory: [{ name: 'w.grad', value: '-24.0', kind: 'heap' }] },
        ] },
        { kind: 'code', code: `x = torch.linspace(-2, 2, 5, requires_grad=True)
y = (x ** 3).sum()
y.backward()
x.grad                    # 3x²: tensor([12., 3., 0., 3., 12.])` },
        { kind: 'pitfall', text: '**Gradients accumulate.** Each `.backward()` *adds* into `.grad`. In a training loop you must reset them every step (`optimizer.zero_grad()` or `w.grad = None`), or each update uses the sum of all previous gradients.' },
        { kind: 'check', q: 'For loss = (w·x − 10)² with w = 2, x = 3, what is d(loss)/dw?', options: ['-8', '-24', '16', '6'], answer: 1, hint: 'Chain rule: d(loss)/dy × dy/dw.', explain: '2(6 − 10) × 3 = −24.' },
      ],
    },
    {
      id: 'gd',
      title: 'Gradient descent by hand',
      blocks: [
        { kind: 'analogy', text: "Training is walking downhill in fog. You can't see the valley floor (the best parameters), but you can feel the slope under your feet (the gradient). Take a small step downhill (the learning rate), feel again, repeat. Too big a step and you overshoot the valley; too small and you're there all night." },
        { kind: 'code', code: `# Estimate beta: asset return = alpha + beta * market return + noise
torch.manual_seed(0)
mkt = torch.randn(500)                              # daily market returns, in %
asset = 0.02 + 1.3 * mkt + torch.randn(500) * 0.4   # true alpha 0.02%, beta 1.3

alpha = torch.zeros(1, requires_grad=True)
beta = torch.zeros(1, requires_grad=True)
lr = 0.1

for step in range(500):
    pred = alpha + beta * mkt
    loss = ((pred - asset) ** 2).mean()          # mean squared error
    loss.backward()                              # fills alpha.grad, beta.grad
    with torch.no_grad():                        # update WITHOUT recording receipts
        alpha -= lr * alpha.grad
        beta  -= lr * beta.grad
    alpha.grad = None; beta.grad = None          # reset for the next step

beta.item()                                      # ≈ 1.3` },
        { kind: 'p', text: "That loop is all of deep learning in miniature: **forward** (predict), **loss**, **backward** (gradients), **step** (update), **zero** (reset). Module 28 replaces each hand-written part with PyTorch's building blocks, and the Deep Learning course scales the idea up to networks with millions of parameters." },
        { kind: 'check', q: 'Why is the parameter update wrapped in `torch.no_grad()`?', options: ['To make it faster only', 'So the update itself isn\'t recorded in the graph and doesn\'t affect future gradients', 'It is required syntax', 'To move to the GPU'], answer: 1, hint: 'Does the update step need a receipt?', explain: 'Updates are bookkeeping, not part of the model. Recording them would corrupt the graph (and in-place ops on leaf tensors that require grad aren\'t allowed otherwise).' },
      ],
    },
    {
      id: 'nograd',
      title: 'no_grad, detach & inference',
      blocks: [
        { kind: 'analogy', text: "Receipts cost paper. When you're only using the model (predicting, evaluating) rather than training it, switch the printer off. `torch.no_grad()` turns it off for a block; `.detach()` tears a single tensor away from its receipt history." },
        { kind: 'code', code: `with torch.no_grad():               # evaluation: no graph, less memory, faster
    preds = model(x_test)

@torch.inference_mode()              # stricter and faster still, for pure inference
def predict(x): return model(x)

h = encoder(x).detach()             # keep the values, drop the history
h.requires_grad                      # False

loss.item()                          # a Python float, for logging (forces a device sync)
# losses.append(loss)                # BUG: keeps every graph alive → memory grows
losses.append(loss.item())` },
        { kind: 'pitfall', text: 'Appending `loss` (the tensor) to a list for logging keeps every iteration\'s whole computation graph alive, a classic memory leak. Log `loss.item()` or `loss.detach()` instead.' },
        { kind: 'check', q: 'What does `.detach()` return?', options: ['A copy on the CPU', 'A tensor sharing the same data but cut off from the computation graph', 'The gradient', 'A NumPy array'], answer: 1, hint: 'Same values, no receipts.', explain: 'It shares storage (no copy); gradients won\'t flow through it.' },
      ],
    },
  ],
  quiz: [
    { q: 'What do tensors add over NumPy arrays?', options: ['Nothing', 'Accelerator (GPU) support and automatic differentiation', 'String support', 'Labelled axes'], answer: 1, explain: 'The array API is otherwise very similar.' },
    { q: 'Does `torch.from_numpy(a)` copy the data?', options: ['Yes', 'No: it shares memory with a', 'Only for floats', 'Only on GPU'], answer: 1, explain: '`torch.tensor(a)` copies.' },
    { q: 'Adding tensors on different devices…', options: ['Works automatically', 'Raises a RuntimeError', 'Moves both to CPU', 'Returns None'], answer: 1, explain: 'Use `.to(device)` explicitly.' },
    { q: 'What does `loss.backward()` do?', options: ['Undoes the last step', 'Computes gradients of loss w.r.t. every tensor with requires_grad', 'Updates the weights', 'Resets gradients'], answer: 1, explain: 'An optimiser performs the update.' },
    { q: 'Why reset `.grad` each training step?', options: ['Memory only', 'Gradients accumulate across backward() calls', 'Required by CUDA', 'To change the learning rate'], answer: 1, explain: '`optimizer.zero_grad()` does it.' },
    { q: 'What does `torch.no_grad()` do?', options: ['Deletes gradients', 'Disables graph recording in its block', 'Freezes the model forever', 'Moves to CPU'], answer: 1, explain: 'Use it for evaluation and parameter updates.' },
    { q: 'Logging `losses.append(loss)` in a loop causes…', options: ['Nothing', 'Growing memory: each graph is kept alive', 'An error', 'Faster training'], answer: 1, explain: 'Append `loss.item()`.' },
    { q: 'What is the recommended device-agnostic API in recent PyTorch?', options: ['torch.gpu', 'torch.accelerator', 'torch.cuda only', 'torch.device_auto'], answer: 1, explain: 'It covers CUDA, MPS, XPU and others.' },
  ],
}
