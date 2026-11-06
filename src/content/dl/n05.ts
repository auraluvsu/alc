import type { Module } from '../types'

export const n05: Module = {
  n: 5,
  title: 'Recurrent Neural Networks',
  tour: '9–10 · RNNs · Modern RNNs',
  summary: 'Modelling sequences with a hidden state, backpropagation through time and why plain RNNs forget, LSTMs and GRUs, encoder–decoder models, and where recurrent and state-space models stand now that transformers dominate.',
  topics: ['Sequence modelling', 'RNNs & BPTT', 'LSTM & GRU', 'Encoder–decoder', 'State-space models'],
  cpp23: ['State-space models (S4, Mamba) revived recurrence: transformer-like quality with linear-time inference.'],
  lessons: [
    {
      id: 'seq',
      title: 'Sequence modelling',
      blocks: [
        { kind: 'analogy', text: "Reading a sentence, you don't start from scratch at each word: you carry a running summary of what came before. A recurrent network does the same. It reads one step at a time and updates a hidden state, a fixed-size memory of everything so far, which it combines with each new input." },
        { kind: 'code', code: `import torch
from torch import nn

def make_windows(series: torch.Tensor, lookback: int):
    """(T,) series → (N, lookback, 1) inputs and (N,) next-step targets."""
    X = series.unfold(0, lookback, 1)[:-1].unsqueeze(-1)
    y = series[lookback:]
    return X, y

t = torch.arange(0, 400, dtype=torch.float32)
series = torch.sin(t * 0.1) + 0.1 * torch.randn(400)
X, y = make_windows(series, lookback=30)
X.shape, y.shape                         # (torch.Size([370, 30, 1]), torch.Size([370]))` },
        { kind: 'check', q: 'What does an RNN\'s hidden state hold?', options: ['The weights', 'A fixed-size summary of the sequence so far', 'The whole sequence', 'The target'], answer: 1, hint: 'A running summary.', explain: 'Its size doesn\'t grow with sequence length.' },
      ],
    },
    {
      id: 'rnn',
      title: 'RNNs & backpropagation through time',
      blocks: [
        { kind: 'analogy', text: "Training an RNN unrolls it into a very deep network, one layer per time step, all sharing the same weights. The gradient for step 1 must travel back through every later step, multiplied by roughly the same matrix each time: like a rumour passed down a line of 100 people, it either fades to nothing (vanishing) or becomes a wild exaggeration (exploding)." },
        { kind: 'code', code: `rnn = nn.RNN(input_size=1, hidden_size=32, batch_first=True)
out, h = rnn(X[:4])
out.shape, h.shape            # (4, 30, 32): state at every step; (1, 4, 32): final state

# The update at each step, written out:
#   h_t = tanh(W_x · x_t + W_h · h_{t-1} + b)

# How much does the final output depend on the FIRST input?
x = X[:1].clone().requires_grad_(True)
out, _ = rnn(x)
out[0, -1].sum().backward()
x.grad[0, :, 0].abs()[[0, 15, 29]]     # far smaller for early steps than recent ones` },
        { kind: 'list', items: [
          '**Exploding gradients**: fix with `clip_grad_norm_` (module 2 standard).',
          '**Vanishing gradients**: plain RNNs struggle to learn dependencies more than a few dozen steps back. LSTMs and GRUs were designed to fix this.',
        ] },
        { kind: 'check', q: 'Why do plain RNNs struggle with long-range dependencies?', options: ['Too few parameters', 'Gradients shrink as they pass back through many time steps', 'They can\'t see the past', 'They use ReLU'], answer: 1, hint: 'The rumour fades.', explain: 'Repeated multiplication by the same Jacobian.' },
      ],
    },
    {
      id: 'lstm',
      title: 'LSTM & GRU',
      blocks: [
        { kind: 'analogy', text: "An LSTM adds a separate conveyor belt (the cell state) that runs through time with only small, deliberate edits, controlled by gates: a *forget* gate decides what to drop, an *input* gate what to write, an *output* gate what to reveal. Information can ride the belt for hundreds of steps untouched. A GRU is a slimmer two-gate version that often works as well." },
        { kind: 'code', code: `class Forecaster(nn.Module):
    def __init__(self, n_in=1, hidden=64, layers=2, dropout=0.1):
        super().__init__()
        self.lstm = nn.LSTM(n_in, hidden, num_layers=layers, batch_first=True, dropout=dropout)
        self.head = nn.Linear(hidden, 1)
    def forward(self, x):
        out, (h, c) = self.lstm(x)          # LSTM returns hidden AND cell state
        return self.head(out[:, -1]).squeeze(-1)   # predict from the last step

model = Forecaster()
opt = torch.optim.AdamW(model.parameters(), lr=3e-3)
split = 300
for epoch in range(60):
    model.train(); opt.zero_grad()
    loss = nn.functional.mse_loss(model(X[:split]), y[:split])
    loss.backward(); nn.utils.clip_grad_norm_(model.parameters(), 1.0); opt.step()
model.eval()
with torch.no_grad():
    test_mse = nn.functional.mse_loss(model(X[split:]), y[split:]).item()   # ≈ 0.02; the noise floor is 0.01

nn.GRU(1, 64, batch_first=True)         # drop-in alternative: out, h = gru(x)` },
        { kind: 'check', q: 'What does the LSTM forget gate control?', options: ['The output', 'How much of the previous cell state to keep', 'The learning rate', 'The input size'], answer: 1, hint: 'What to drop from the belt.', explain: 'Near 1 → remember, near 0 → forget.' },
      ],
    },
    {
      id: 'seq2seq',
      title: 'Encoder–decoder',
      blocks: [
        { kind: 'analogy', text: "To turn one sequence into another of different length (a sentence into another language, or the last 60 bars into the next 10), an encoder reads the input into a summary and a decoder writes the output one step at a time from that summary. Squeezing a long input into one fixed vector is the bottleneck that attention (module 6) removed." },
        { kind: 'code', code: `class Seq2Seq(nn.Module):
    def __init__(self, hidden=64, horizon=10):
        super().__init__()
        self.enc = nn.GRU(1, hidden, batch_first=True)
        self.dec = nn.GRU(1, hidden, batch_first=True)
        self.out = nn.Linear(hidden, 1)
        self.horizon = horizon
    def forward(self, x):
        _, h = self.enc(x)                    # summary of the past
        step = x[:, -1:, :]                   # start from the last observed value
        preds = []
        for _ in range(self.horizon):         # autoregressive decoding
            o, h = self.dec(step, h)
            step = self.out(o)
            preds.append(step)
        return torch.cat(preds, dim=1).squeeze(-1)

Seq2Seq()(X[:8]).shape                         # torch.Size([8, 10]): ten steps ahead` },
        { kind: 'check', q: 'What limits a basic encoder–decoder on long inputs?', options: ['Too many layers', 'The whole input must fit into one fixed-size state', 'GRUs can\'t decode', 'No loss function'], answer: 1, hint: 'The bottleneck.', explain: 'Attention lets the decoder look back at every input step.' },
      ],
    },
    {
      id: 'ssm',
      title: 'RNNs today & state-space models',
      blocks: [
        { kind: 'analogy', text: "Transformers won because they process a whole sequence in parallel during training, while RNNs must go one step at a time. But at inference an RNN has a big advantage for streaming data: each new tick costs the same small, constant amount of work, with no growing history to re-read. State-space models such as Mamba aim for both: parallel training and constant-cost recurrent inference." },
        { kind: 'list', items: [
          '**Transformers**: best quality on large data; cost grows with context length; parallel training.',
          '**LSTM/GRU**: still strong on small and medium time-series problems, and ideal for streaming inference in C++ (a few small matrix-vector products per tick).',
          '**TCNs** (module 4): parallel, simple, fixed look-back.',
          '**State-space models** (S4, Mamba): linear-time, long contexts, constant-cost updates. An active research area.',
          'For tabular financial features, gradient-boosted trees (ML course) often beat all of them. Try the simple baseline first.',
        ] },
        { kind: 'check', q: 'Why are RNNs attractive for tick-by-tick live inference?', options: ['Higher accuracy', 'Each new observation costs constant work: update the state and predict', 'They need no training', 'They\'re parallel'], answer: 1, hint: 'No growing history to re-read.', explain: 'A transformer re-attends over the whole context.' },
      ],
    },
  ],
  quiz: [
    { q: 'An RNN processes a sequence…', options: ['All at once', 'One step at a time, updating a hidden state', 'Backwards only', 'Randomly'], answer: 1, explain: 'Recurrence.' },
    { q: 'BPTT stands for…', options: ['Batch processing through time', 'Backpropagation through time', 'Binary pattern training', 'Best predictor through time'], answer: 1, explain: 'Unrolled network.' },
    { q: 'Exploding gradients are fixed with…', options: ['Dropout', 'Gradient clipping', 'More layers', 'Sigmoid'], answer: 1, explain: 'clip_grad_norm_.' },
    { q: 'LSTMs mitigate vanishing gradients via…', options: ['ReLU', 'A gated cell state', 'Bigger batches', 'Convolutions'], answer: 1, explain: 'The conveyor belt.' },
    { q: 'nn.LSTM returns…', options: ['Output only', 'Output and (hidden, cell) states', 'Loss', 'Gradients'], answer: 1, explain: 'GRU returns output and hidden.' },
    { q: 'GRU vs LSTM…', options: ['GRU has more gates', 'GRU is a simpler two-gate variant', 'Identical', 'GRU has no state'], answer: 1, explain: 'Often comparable.' },
    { q: 'Autoregressive decoding feeds…', options: ['Targets always', 'Each prediction back in as the next input', 'Random noise', 'The encoder output only'], answer: 1, explain: 'One step at a time.' },
    { q: 'State-space models like Mamba aim for…', options: ['Quadratic attention', 'Parallel training with constant-cost recurrent inference', 'No training', 'Images only'], answer: 1, explain: 'Linear-time sequences.' },
  ],
}
