import type { Module } from '../types'

export const n02: Module = {
  n: 2,
  title: 'Multilayer Perceptrons',
  tour: '5 · Multilayer Perceptrons',
  summary: 'Hidden layers and activation functions, why depth needs non-linearity, overfitting and the two classic remedies (weight decay and dropout), and initialisation for stable training.',
  topics: ['Hidden layers', 'Activation functions', 'Weight decay', 'Dropout', 'Initialisation & stability'],
  cpp23: [
    'GELU and SiLU are the default activations in modern architectures; ReLU remains the simple, strong default for MLPs.',
    '`torch.optim.AdamW` implements decoupled weight decay, which is what most modern training uses.',
  ],
  lessons: [
    {
      id: 'hidden',
      title: 'Hidden layers',
      blocks: [
        { kind: 'analogy', text: "Stacking linear layers without anything between them is like stacking sheets of tinted glass: however many you add, the result is still one sheet of some tint. A non-linear activation between layers is a bend in the glass. With enough bends, you can shape it into almost any surface." },
        { kind: 'code', code: `import torch
from torch import nn

# Two linear layers with nothing between them collapse into one:
A, B = nn.Linear(10, 32), nn.Linear(32, 1)
x = torch.randn(5, 10)
W = B.weight @ A.weight; c = B.weight @ A.bias + B.bias
torch.allclose(B(A(x)), x @ W.T + c, atol=1e-6)          # True: still linear

mlp = nn.Sequential(
    nn.Linear(10, 64), nn.ReLU(),     # hidden layer 1
    nn.Linear(64, 64), nn.ReLU(),     # hidden layer 2
    nn.Linear(64, 1),                 # output: no activation for regression
)
mlp(x).shape                          # torch.Size([5, 1])` },
        { kind: 'p', text: 'The **universal approximation theorem** says one wide enough hidden layer can approximate any continuous function on a bounded region. It says nothing about how many units you need, or whether gradient descent will find them. In practice, deeper and narrower networks learn more efficiently than one enormous layer.' },
        { kind: 'check', q: 'Why is an activation function needed between layers?', options: ['Speed', 'Without it, stacked linear layers collapse into a single linear map', 'To normalise outputs', 'Autograd requires it'], answer: 1, hint: 'Tinted glass.', explain: 'The composition of linear maps is linear.' },
      ],
    },
    {
      id: 'activations',
      title: 'Activation functions',
      blocks: [
        { kind: 'analogy', text: "An activation is a valve on each neuron. Sigmoid is a dimmer that saturates: push it far either way and turning the knob does nothing, which starves the gradient. ReLU is a one-way valve: closed for negatives, wide open for positives, so gradients flow through unchanged wherever it's open." },
        { kind: 'code', code: `z = torch.linspace(-4, 4, 9, requires_grad=True)

torch.relu(z)        # max(0, z): the default for MLPs
torch.sigmoid(z)     # 1/(1+e^-z): squashes to (0, 1); output layer for binary probabilities
torch.tanh(z)        # squashes to (-1, 1)
nn.functional.gelu(z); nn.functional.silu(z)   # smooth ReLU variants used in transformers

torch.sigmoid(z).sum().backward()
z.grad               # tiny at ±4 (~0.018), largest at 0 (0.25): the vanishing-gradient problem` },
        { kind: 'list', items: [
          '**ReLU**: cheap and doesn\'t saturate for positive inputs. Units can "die" (stay at 0) if they\'re pushed negative for every input.',
          '**Sigmoid / tanh**: saturate, so gradients vanish in deep stacks. Use sigmoid for gates and binary output probabilities.',
          '**GELU / SiLU**: smooth, slightly better in large models; standard in transformers.',
        ] },
        { kind: 'check', q: 'What is the maximum gradient of the sigmoid function?', options: ['1', '0.5', '0.25', '0'], answer: 2, hint: 'σ′(z) = σ(z)(1 − σ(z)), largest at z = 0.', explain: '0.5 × 0.5 = 0.25. Multiply that over many layers and gradients shrink towards zero.' },
      ],
    },
    {
      id: 'decay',
      title: 'Overfitting & weight decay',
      blocks: [
        { kind: 'analogy', text: "Weight decay is a tax on large weights. The model can still use a big weight if the data really demands it, but every unit of size costs something, so it stops building elaborate structures just to explain noise. In finance, where noise is nearly everything, the tax is rarely optional." },
        { kind: 'code', code: `# L2 penalty, written explicitly
lam = 1e-3
loss = loss_fn(net(Xb), yb) + lam * sum((p ** 2).sum() for name, p in net.named_parameters() if "weight" in name)

# The usual way: decoupled weight decay in the optimiser (don't decay biases or norms)
decay    = [p for n, p in net.named_parameters() if p.ndim > 1]
no_decay = [p for n, p in net.named_parameters() if p.ndim <= 1]
opt = torch.optim.AdamW([{"params": decay, "weight_decay": 1e-2},
                         {"params": no_decay, "weight_decay": 0.0}], lr=1e-3)` },
        { kind: 'p', text: 'Plot training and validation loss per epoch. When validation loss starts rising while training loss keeps falling, the network has begun memorising. **Early stopping** (keep the best-validation checkpoint) is the simplest and most reliable regulariser of all.' },
        { kind: 'check', q: 'Why is `AdamW` preferred over `Adam(weight_decay=…)`?', options: ['It is faster', 'It decouples weight decay from the adaptive gradient scaling, so decay works as intended', 'It has no learning rate', 'It removes dropout'], answer: 1, hint: 'The W stands for weight decay done separately.', explain: 'In Adam, L2 added to the gradient gets rescaled per parameter; AdamW applies decay directly to the weights.' },
      ],
    },
    {
      id: 'dropout',
      title: 'Dropout',
      blocks: [
        { kind: 'analogy', text: "Dropout is randomly benching a share of the squad for every training match. No player can rely on one particular teammate always being there, so the team learns several overlapping ways to play. On match day (evaluation) everyone plays." },
        { kind: 'code', code: `drop = nn.Dropout(p=0.5)
x = torch.ones(8)

drop.train()
drop(x)          # about half zeros, survivors scaled up to 2.0 (so the expected value is unchanged)
drop.eval()
drop(x)          # all ones: dropout is off in eval mode

net = nn.Sequential(nn.Linear(20, 128), nn.ReLU(), nn.Dropout(0.2),
                    nn.Linear(128, 128), nn.ReLU(), nn.Dropout(0.2),
                    nn.Linear(128, 1))` },
        { kind: 'pitfall', text: 'Forgetting `net.eval()` before validation leaves dropout on: your validation scores become noisy and pessimistic, and live predictions become random. Forgetting `net.train()` afterwards silently disables dropout for the rest of training.' },
        { kind: 'check', q: 'With p=0.5 in training mode, what happens to the units that survive?', options: ['Unchanged', 'Scaled by 2 so the expected activation is unchanged', 'Halved', 'Set to 1'], answer: 1, hint: 'Inverted dropout.', explain: 'Scaling by 1/(1−p) during training means nothing needs to change at evaluation time.' },
      ],
    },
    {
      id: 'init',
      title: 'Initialisation & numerical stability',
      blocks: [
        { kind: 'analogy', text: "A deep network is a long chain of amplifiers. If each one multiplies the signal by 1.1, after 50 stages it's 117 times louder; at 0.9 it's down to 0.5%. Good initialisation sets each amplifier's gain so the signal, and its gradient on the way back, arrive at roughly the same volume." },
        { kind: 'code', code: `x = torch.randn(512, 256)
for name, init in [("tiny", lambda w: nn.init.normal_(w, std=0.01)),
                   ("kaiming", lambda w: nn.init.kaiming_normal_(w, nonlinearity="relu"))]:
    h = x
    for _ in range(20):
        layer = nn.Linear(256, 256, bias=False); init(layer.weight)
        h = torch.relu(layer(h))
    print(name, h.std().item())
# tiny:    ~1e-19: the signal has vanished
# kaiming: ~0.8: roughly preserved through 20 layers` },
        { kind: 'list', items: [
          '**Xavier/Glorot** initialisation suits tanh/sigmoid; **Kaiming/He** suits ReLU. PyTorch\'s default for `nn.Linear` is a Kaiming-uniform variant.',
          'Symmetry must be broken: initialising every weight to the same value makes every unit in a layer learn the same thing.',
          'Normalisation layers (BatchNorm, LayerNorm) and residual connections (module 3 onwards) make deep networks far less sensitive to initialisation.',
        ] },
        { kind: 'check', q: 'What goes wrong if every weight starts at exactly zero?', options: ['Nothing', 'All units in a layer get identical gradients and stay identical', 'It is faster', 'Gradients explode'], answer: 1, hint: 'Symmetry.', explain: 'Random initialisation breaks the symmetry so units can specialise.' },
      ],
    },
  ],
  quiz: [
    { q: 'Two linear layers with no activation are equivalent to…', options: ['A deep network', 'One linear layer', 'A ReLU', 'Nothing useful'], answer: 1, explain: 'Composition of linear maps is linear.' },
    { q: 'What is the default activation for MLP hidden layers?', options: ['Sigmoid', 'ReLU', 'Softmax', 'Identity'], answer: 1, explain: 'GELU/SiLU are common in transformers.' },
    { q: 'Why do sigmoids cause vanishing gradients?', options: ['They are slow', 'They saturate, with derivative at most 0.25', 'They are non-differentiable', 'They output negatives'], answer: 1, explain: 'Products of small derivatives shrink.' },
    { q: 'Weight decay penalises…', options: ['Large activations', 'Large weights', 'Long training', 'Big batches'], answer: 1, explain: 'An L2 penalty on parameters.' },
    { q: 'Should biases and normalisation parameters usually be decayed?', options: ['Yes', 'No: typically only weight matrices', 'Only biases', 'Only in eval'], answer: 1, explain: 'Use parameter groups.' },
    { q: 'Dropout in eval mode…', options: ['Drops half the units', 'Does nothing', 'Doubles outputs', 'Raises'], answer: 1, explain: 'Remember `net.eval()`.' },
    { q: 'Kaiming initialisation is designed for…', options: ['Sigmoid', 'ReLU', 'Softmax outputs', 'Embeddings only'], answer: 1, explain: 'Xavier suits tanh/sigmoid.' },
    { q: 'What is the simplest reliable regulariser?', options: ['Larger learning rate', 'Early stopping on validation loss', 'More layers', 'Removing the bias'], answer: 1, explain: 'Keep the best-validation checkpoint.' },
  ],
}
