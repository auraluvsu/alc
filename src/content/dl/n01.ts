import type { Module } from '../types'

export const n01: Module = {
  n: 1,
  title: 'Linear Neural Networks',
  tour: '3–4 · Linear Neural Networks',
  summary: 'The smallest neural networks: linear regression as a single layer, minibatch stochastic gradient descent, the concise PyTorch version, and softmax regression for classification with cross-entropy loss.',
  topics: ['A neuron is a regression', 'Minibatch SGD', 'The concise version', 'Softmax regression', 'Cross-entropy'],
  cpp23: [
    'This course follows Dive into Deep Learning (d2l.ai) with PyTorch 2.15. It assumes Python modules 27–28 (tensors, autograd and the training loop).',
    '`torch.compile` and `torch.accelerator` replace much of the book\'s device and speed boilerplate.',
  ],
  lessons: [
    {
      id: 'neuron',
      title: 'A neuron is a regression',
      blocks: [
        { kind: 'analogy', text: "A single artificial neuron is a mixing desk: each input has a fader (a weight), the faders' outputs are summed, and a master offset (the bias) is added. Linear regression is exactly one such desk. Deep learning is many desks wired into each other, with a little non-linear twist between them." },
        { kind: 'p', text: 'For inputs `x ∈ ℝᵈ`, a linear layer computes `ŷ = xᵀw + b`. For a minibatch `X` of shape `(n, d)` that is `ŷ = Xw + b`, one matrix multiply. With squared loss `½(ŷ − y)²`, the gradients are simple: `∂L/∂w = Xᵀ(ŷ − y)/n` and `∂L/∂b = mean(ŷ − y)`. Autograd computes them for you, but it helps to know they\'re nothing more mysterious than this.' },
        { kind: 'code', code: `import torch
torch.manual_seed(0)

# Synthetic factor model: returns = X @ true_w + b + noise
true_w, true_b = torch.tensor([0.8, -0.3, 0.5]), 0.1
X = torch.randn(1000, 3)
y = X @ true_w + true_b + 0.1 * torch.randn(1000)

w = torch.zeros(3, requires_grad=True)
b = torch.zeros(1, requires_grad=True)
def net(X): return X @ w + b                 # one linear layer
def loss(yhat, y): return ((yhat - y) ** 2 / 2).mean()` },
        { kind: 'check', q: 'A linear layer with 3 inputs and 1 output has how many parameters?', options: ['3', '4', '6', '1'], answer: 1, hint: 'Weights plus the bias.', explain: 'Three weights and one bias.' },
      ],
    },
    {
      id: 'sgd',
      title: 'Minibatch stochastic gradient descent',
      blocks: [
        { kind: 'analogy', text: "Full-batch gradient descent polls every voter before each step: accurate but slow. Pure SGD asks one random voter: fast but erratic. Minibatch SGD asks a random focus group of 32 to 512, which is nearly as reliable as the full poll and lets the GPU process the whole group in one go." },
        { kind: 'code', code: `def batches(X, y, size):
    idx = torch.randperm(len(X))                 # reshuffle every epoch
    for i in range(0, len(X), size):
        j = idx[i:i + size]
        yield X[j], y[j]

lr, epochs = 0.1, 5
for epoch in range(epochs):
    for Xb, yb in batches(X, y, 32):
        l = loss(net(Xb), yb)
        l.backward()
        with torch.no_grad():
            w -= lr * w.grad; b -= lr * b.grad
            w.grad.zero_(); b.grad.zero_()
    with torch.no_grad():
        print(epoch, loss(net(X), y).item())     # falls towards 0.005 (noise² / 2)

w, b      # ≈ [0.8, -0.3, 0.5], ≈ 0.1` },
        { kind: 'list', items: [
          '**Batch size** trades noise for throughput. Bigger batches give smoother gradients and better hardware use but can generalise slightly worse.',
          '**Learning rate** is the most important hyperparameter. Too high diverges; too low crawls.',
          '**Epoch** = one pass over the data. Reshuffle every epoch so batches differ.',
        ] },
        { kind: 'check', q: 'Why do we reshuffle the data each epoch?', options: ['To save memory', 'So minibatches differ and gradient noise isn\'t correlated across epochs', 'Required by autograd', 'To make it deterministic'], answer: 1, hint: 'Same focus groups every time?', explain: 'For time series, shuffle samples within the training period only, never across the train/test boundary.' },
      ],
    },
    {
      id: 'concise',
      title: 'The concise version',
      blocks: [
        { kind: 'analogy', text: "Having built the engine from parts once, you now buy it assembled. `nn.Linear` holds the weight and bias, `nn.MSELoss` is the loss, `torch.optim.SGD` performs the update and `DataLoader` deals out the minibatches. Same engine, fewer chances to wire it wrong." },
        { kind: 'code', code: `from torch import nn
from torch.utils.data import TensorDataset, DataLoader

net = nn.Linear(3, 1)
loss_fn = nn.MSELoss()
opt = torch.optim.SGD(net.parameters(), lr=0.1)
dl = DataLoader(TensorDataset(X, y.unsqueeze(1)), batch_size=32, shuffle=True)

for epoch in range(5):
    for Xb, yb in dl:
        opt.zero_grad()
        loss_fn(net(Xb), yb).backward()
        opt.step()

net.weight.data, net.bias.data      # ≈ [[0.8, -0.3, 0.5]], ≈ [0.1]` },
        { kind: 'pitfall', text: 'Shape mismatches broadcast silently. `nn.Linear(3, 1)` outputs `(n, 1)`; subtracting a target of shape `(n,)` gives an `(n, n)` matrix, and the loss is wrong without any error. Match shapes explicitly (`y.unsqueeze(1)` or `out.squeeze(-1)`). Recent PyTorch warns about this in `MSELoss`, but not in hand-written losses.' },
        { kind: 'check', q: 'Prediction has shape (32, 1) and the target (32,). What does `pred - target` produce?', options: ['(32,)', '(32, 1)', '(32, 32), silently', 'An error'], answer: 2, hint: 'Broadcasting from Python module 25.', explain: '(32,1) and (32,) broadcast to (32,32). Always check shapes.' },
      ],
    },
    {
      id: 'softmax',
      title: 'Softmax regression',
      blocks: [
        { kind: 'analogy', text: "For classification, the network gives each class a raw score (a logit). Softmax turns scores into a probability for each class by exponentiating and normalising, like converting each horse's betting \"strength\" into odds that sum to 100%. The biggest score still wins, but now you also know by how much." },
        { kind: 'code', code: `logits = torch.tensor([[2.0, 1.0, -1.0]])        # e.g. down / flat / up
probs = torch.softmax(logits, dim=1)              # tensor([[0.7054, 0.2595, 0.0351]])
probs.sum()                                        # 1.0

# Softmax regression: one linear layer with K outputs
K, d = 3, 10
net = nn.Linear(d, K)
loss_fn = nn.CrossEntropyLoss()                    # takes LOGITS and integer class labels
Xb, yb = torch.randn(64, d), torch.randint(0, K, (64,))
loss = loss_fn(net(Xb), yb)
pred_class = net(Xb).argmax(dim=1)` },
        { kind: 'p', text: '**Cross-entropy** is `−log p(true class)`: the surprise at the right answer. Confidently wrong predictions are punished heavily (−log 0.01 ≈ 4.6), which is exactly the behaviour you want from a probability model, and why it\'s preferred to accuracy as a training objective.' },
        { kind: 'pitfall', text: 'Computing `torch.log(torch.softmax(z))` yourself overflows for large logits. `CrossEntropyLoss` uses the log-sum-exp trick internally. Feed it raw logits, never softmax outputs.' },
        { kind: 'check', q: 'The model gives the true class probability 0.01. Roughly what is the cross-entropy loss?', options: ['0.01', '0.99', '4.6', '100'], answer: 2, hint: '−ln(0.01).', explain: 'ln(100) ≈ 4.6. A probability of 0.5 would cost only 0.69.' },
      ],
    },
    {
      id: 'eval',
      title: 'Evaluating classifiers honestly',
      blocks: [
        { kind: 'analogy', text: "Accuracy is the headline; log-loss is the full story. Two forecasters can both be right 55% of the time, but the one who said \"90% sure\" on the days they were wrong is far more dangerous to size positions on." },
        { kind: 'code', code: `@torch.no_grad()
def evaluate(net, dl):
    net.eval()
    n, correct, total_loss = 0, 0, 0.0
    for Xb, yb in dl:
        logits = net(Xb)
        total_loss += nn.functional.cross_entropy(logits, yb, reduction="sum").item()
        correct += (logits.argmax(1) == yb).sum().item()
        n += len(yb)
    return total_loss / n, correct / n            # mean log-loss, accuracy

# Baseline: always predict the class frequencies of the training set
p = torch.bincount(y_train, minlength=K).float() / len(y_train)
baseline_logloss = -(torch.log(p[y_test])).mean()` },
        { kind: 'list', items: [
          'Compare against the class-frequency baseline. In directional return prediction it is surprisingly hard to beat.',
          'Check **calibration**: when the model says 70%, is it right about 70% of the time? Poor calibration ruins position sizing.',
          'For trading, the final judge is the P&L of decisions made from predictions, after costs. That comes in the finance modules.',
        ] },
        { kind: 'check', q: 'Why prefer log-loss to accuracy for comparing probabilistic classifiers?', options: ['It is faster', 'It rewards well-calibrated confidence and punishes confident mistakes', 'It is always lower', 'Accuracy can\'t be computed'], answer: 1, hint: 'The 90%-sure forecaster.', explain: 'Accuracy ignores confidence; log-loss doesn\'t.' },
      ],
    },
  ],
  quiz: [
    { q: 'A single linear layer with squared loss is…', options: ['A CNN', 'Linear regression', 'A decision tree', 'k-means'], answer: 1, explain: 'One layer, no activation.' },
    { q: 'Minibatch SGD estimates the gradient from…', options: ['All data', 'A random subset each step', 'One fixed sample', 'The test set'], answer: 1, explain: 'A compromise between noise and cost.' },
    { q: 'What is an epoch?', options: ['One gradient step', 'One pass over the training data', 'One minibatch', 'One second'], answer: 1, explain: 'Many steps per epoch.' },
    { q: '`nn.Linear(3, 1)` outputs shape…', options: ['(n,)', '(n, 1)', '(1, n)', '(3, 1)'], answer: 1, explain: 'Squeeze or match targets explicitly.' },
    { q: 'Softmax turns logits into…', options: ['Labels', 'Probabilities summing to 1', 'Gradients', 'Log-probabilities'], answer: 1, explain: 'Exponentiate and normalise.' },
    { q: 'What should CrossEntropyLoss receive?', options: ['Softmax probabilities', 'Raw logits and integer labels', 'One-hot probabilities', 'Log-softmax only'], answer: 1, explain: 'It applies log-softmax stably inside.' },
    { q: 'Cross-entropy for true-class probability p is…', options: ['p', '1 − p', '−log p', 'p²'], answer: 2, explain: 'The surprise at the right answer.' },
    { q: 'Which baseline should a directional classifier beat?', options: ['Random weights', 'Predicting training class frequencies', 'Always 100%', 'None'], answer: 1, explain: 'It is often hard to beat in markets.' },
  ],
}
