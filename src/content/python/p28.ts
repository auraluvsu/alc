import type { Module } from '../types'

export const p28: Module = {
  n: 28,
  title: 'PyTorch: Models & Training Loops',
  tour: 'Added · PyTorch training',
  summary: 'nn.Module and layers, loss functions and optimisers, Dataset and DataLoader, the standard training loop with validation, torch.compile, and saving or exporting models for C++ deployment.',
  topics: ['nn.Module', 'Losses & optimisers', 'Dataset & DataLoader', 'The training loop', 'compile, save & export'],
  cpp23: [
    '`torch.compile(model)` (2.0+) traces and fuses operations for faster training and inference.',
    '`torch.export` produces a portable `ExportedProgram`. It feeds AOTInductor and ONNX for C++ deployment; TorchScript is in maintenance mode.',
    '`torch.load` defaults to `weights_only=True` (2.6+), so loading untrusted pickles no longer runs arbitrary code.',
  ],
  lessons: [
    {
      id: 'module',
      title: 'nn.Module: models as objects',
      blocks: [
        { kind: 'analogy', text: "An `nn.Module` is a Lego brick that knows two things: which parts it's made of (its parameters and sub-bricks) and how data flows through it (`forward`). Snap bricks into bigger bricks and the big one automatically knows about every part inside, so one call hands all the weights to the optimiser or moves them all to the GPU." },
        { kind: 'code', code: `import torch
from torch import nn

class ReturnPredictor(nn.Module):
    def __init__(self, n_features: int, hidden: int = 64):
        super().__init__()                      # required: sets up parameter tracking
        self.net = nn.Sequential(
            nn.Linear(n_features, hidden),      # weight (hidden × n_features) + bias
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden, 1),
        )

    def forward(self, x):                       # called via model(x), never model.forward(x)
        return self.net(x).squeeze(-1)

model = ReturnPredictor(n_features=20)
sum(p.numel() for p in model.parameters())     # 20*64+64 + 64*1+1 = 1409
model.to(device)                                # moves every parameter at once
model.train(); model.eval()                     # toggles Dropout/BatchNorm behaviour` },
        { kind: 'list', items: [
          'Assigning an `nn.Module` or `nn.Parameter` as an attribute registers it. A plain Python list of layers does **not**, so use `nn.ModuleList`.',
          'Call `model(x)`, not `model.forward(x)`: `__call__` runs hooks and is what `torch.compile` expects.',
          '`model.eval()` does not turn off gradients; it only switches layer behaviour. You still want `torch.no_grad()` for inference.',
        ] },
        { kind: 'check', q: 'You store layers in `self.layers = [nn.Linear(4, 4) for _ in range(3)]`. What goes wrong?', options: ['Nothing', 'The layers aren\'t registered, so their parameters are invisible to the optimiser and .to(device)', 'A syntax error', 'Training is slower'], answer: 1, hint: 'How does the module discover its parts?', explain: 'Only Module/Parameter attributes (and ModuleList/ModuleDict) are registered. Use `nn.ModuleList([...])`.' },
      ],
    },
    {
      id: 'loss-opt',
      title: 'Losses & optimisers',
      blocks: [
        { kind: 'analogy', text: "The loss function is the scoreboard: one number saying how wrong the model is. The optimiser is the coach who reads the gradients and decides how far to move each weight. Plain SGD moves straight downhill; Adam keeps a running memory of past slopes per weight, so it's like a coach who remembers which players have been consistently off and adjusts each one individually." },
        { kind: 'code', code: `loss_fn = nn.MSELoss()                 # regression (e.g. next-day return)
loss_fn = nn.HuberLoss(delta=0.01)     # robust to fat-tailed returns
loss_fn = nn.CrossEntropyLoss()        # classification: takes raw logits, NOT softmax output
loss_fn = nn.BCEWithLogitsLoss()       # binary (up/down): also takes logits

opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)
sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=50)

opt.zero_grad()        # 1. clear old gradients
loss = loss_fn(model(xb), yb)
loss.backward()        # 2. compute new ones
torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)   # optional: tame exploding gradients
opt.step()             # 3. update weights
sched.step()           # usually once per epoch` },
        { kind: 'pitfall', text: '`CrossEntropyLoss` and `BCEWithLogitsLoss` apply softmax/sigmoid internally (in a numerically stable way). Putting a `Softmax` layer at the end of your model as well squashes the outputs twice and quietly ruins training.' },
        { kind: 'check', q: 'What is the right order inside one training step?', options: ['step → backward → zero_grad', 'zero_grad → forward/loss → backward → step', 'backward → zero_grad → step', 'forward → step → backward'], answer: 1, hint: 'Clear, compute, apply.', explain: 'Clear stale gradients, compute the loss, backpropagate, then update.' },
      ],
    },
    {
      id: 'data',
      title: 'Dataset & DataLoader',
      blocks: [
        { kind: 'analogy', text: "A `Dataset` is the warehouse: ask for item *i* and it hands over one (features, label) pair. A `DataLoader` is the forklift crew that fetches items in batches, optionally shuffles them, and can use several workers so the GPU is never kept waiting for the next pallet." },
        { kind: 'code', code: `from torch.utils.data import Dataset, DataLoader, TensorDataset

class Windows(Dataset):
    """Rolling windows of past returns → next return."""
    def __init__(self, returns: torch.Tensor, lookback: int = 20):
        self.r, self.k = returns, lookback
    def __len__(self):
        return len(self.r) - self.k
    def __getitem__(self, i):
        return self.r[i : i + self.k], self.r[i + self.k]

returns = torch.randn(2000) * 0.01
split = 1600                                        # time-ordered split: past trains, future tests
train_ds = Windows(returns[:split])
val_ds   = Windows(returns[split:])

train_dl = DataLoader(train_ds, batch_size=64, shuffle=True)   # shuffling WITHIN the training period is fine
val_dl   = DataLoader(val_ds, batch_size=256)
xb, yb = next(iter(train_dl)); xb.shape             # torch.Size([64, 20])

# Data already in tensors? Skip the class:
ds = TensorDataset(X, y)` },
        { kind: 'pitfall', text: '**Never random-split time series.** `random_split` on market data lets the model train on Wednesday and test on Tuesday, which is look-ahead bias in disguise. Split by time, and leave a gap the length of your lookback window so train and test windows don\'t overlap. The Machine Learning course covers purged and walk-forward validation properly.' },
        { kind: 'check', q: 'What must a map-style `Dataset` implement?', options: ['__iter__ only', '__len__ and __getitem__', 'forward', 'collate'], answer: 1, hint: 'Sequence protocol from module 1.', explain: 'It\'s Python\'s sequence protocol, which the DataLoader uses to fetch indices.' },
      ],
    },
    {
      id: 'loop',
      title: 'The training loop',
      blocks: [
        { kind: 'analogy', text: "An epoch is one season: the team trains on every practice drill once (the training set), then plays a friendly against opponents it has never seen (the validation set). You judge the coaching by the friendly results, not the drills, and you keep the squad from the best match, not the last one." },
        { kind: 'code', code: `model = ReturnPredictor(n_features=20).to(device)
opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
loss_fn = nn.MSELoss()
best, patience, bad = float("inf"), 5, 0

for epoch in range(100):
    model.train()
    for xb, yb in train_dl:
        xb, yb = xb.to(device), yb.to(device)
        opt.zero_grad()
        loss = loss_fn(model(xb), yb)
        loss.backward()
        opt.step()

    model.eval()
    with torch.no_grad():
        val = sum(loss_fn(model(xb.to(device)), yb.to(device)).item() * len(xb)
                  for xb, yb in val_dl) / len(val_ds)

    if val < best:
        best, bad = val, 0
        torch.save(model.state_dict(), "best.pt")     # checkpoint the best model
    else:
        bad += 1
        if bad >= patience: break                     # early stopping` },
        { kind: 'p', text: "Every framework you'll meet (Lightning, Hugging Face's Trainer, fastai) is this loop with the boilerplate hidden. Write it by hand a few times first, so that when one of them misbehaves you know which of the five steps went missing." },
        { kind: 'pitfall', text: 'Random returns are mostly noise, so a model that beats "predict zero" on validation is rare and suspicious. Before celebrating, compare against that trivial baseline and check for leakage. A real signal in finance is usually tiny.' },
        { kind: 'check', q: 'Why call `model.eval()` before validation?', options: ['To disable gradients', 'To switch Dropout/BatchNorm into inference behaviour', 'To speed up the GPU', 'It\'s optional and does nothing'], answer: 1, hint: 'Which layers behave differently?', explain: 'Dropout stops dropping and BatchNorm uses running statistics. `no_grad()` is what disables gradients.' },
      ],
    },
    {
      id: 'deploy',
      title: 'compile, save & export',
      blocks: [
        { kind: 'analogy', text: "Python is the test kitchen where recipes get invented. `torch.compile` is a sous-chef who watches you cook once and then preps the same dish faster. `torch.export` writes the recipe down as a precise card that a kitchen with no Python at all, such as a C++ trading engine, can follow exactly." },
        { kind: 'code', code: `fast = torch.compile(model)            # first call compiles (slow); later calls are fast

# Save / load weights (the normal way)
torch.save(model.state_dict(), "model.pt")
model = ReturnPredictor(20); model.load_state_dict(torch.load("model.pt"))   # weights_only=True by default

# Export a whole graph for deployment
example = (torch.randn(1, 20),)
ep = torch.export.export(model.eval(), example)
torch.export.save(ep, "model.pt2")

# → ONNX for ONNX Runtime (C++, C#, Java, JS…)
torch.onnx.export(model, example, "model.onnx", dynamo=True)` },
        { kind: 'compare',
          python: 'Train and experiment in PyTorch, then `torch.export` or ONNX.',
          cpp: 'Load `model.onnx` with ONNX Runtime\'s C++ API, or an AOTInductor-compiled `.pt2` package; LibTorch is the C++ PyTorch API itself. This is how low-latency quant systems run Python-trained models.',
          ts: 'onnxruntime-web / onnxruntime-node load the same `.onnx` file in the browser or Node.',
          go: 'No first-party runtime: use onnxruntime via cgo bindings, or serve the model over gRPC from a Python/C++ service.',
          java: 'ONNX Runtime has official Java bindings; DJL (Deep Java Library) can also load PyTorch models.',
          note: 'Train in Python, deploy anywhere via an exported graph.' },
        { kind: 'pitfall', text: 'Pickling the whole model (`torch.save(model)`) ties the file to your exact class definitions and module paths. Save the `state_dict` for checkpoints, and use `torch.export`/ONNX when the model must leave Python.' },
        { kind: 'check', q: 'Your C++ execution engine needs to run a model trained in PyTorch. What is the usual route?', options: ['Rewrite it by hand in C++', 'Export to ONNX (or torch.export/AOTInductor) and load it with a C++ runtime', 'Embed a Python interpreter on every tick', 'Use pickle'], answer: 1, hint: 'A recipe card the kitchen can read.', explain: 'ONNX Runtime or AOTInductor/LibTorch run the exported graph natively, with no Python on the hot path.' },
      ],
    },
  ],
  quiz: [
    { q: 'What must every custom nn.Module call in __init__?', options: ['self.forward()', 'super().__init__()', 'torch.compile()', 'self.train()'], answer: 1, explain: 'It sets up parameter and sub-module registration.' },
    { q: 'How should you hold a variable number of layers?', options: ['A Python list', 'nn.ModuleList', 'A tuple', 'A dict'], answer: 1, explain: 'Plain lists aren\'t registered.' },
    { q: 'CrossEntropyLoss expects…', options: ['Softmax probabilities', 'Raw logits', 'One-hot labels only', 'Log probabilities from the user'], answer: 1, explain: 'It applies log-softmax internally.' },
    { q: 'What does `model.eval()` change?', options: ['Disables gradients', 'Layer behaviour such as Dropout and BatchNorm', 'The device', 'The optimiser'], answer: 1, explain: 'Pair it with `torch.no_grad()` for inference.' },
    { q: 'How should you split financial time series into train/validation?', options: ['random_split', 'By time, with a gap', 'Alphabetically', 'It doesn\'t matter'], answer: 1, explain: 'Random splits leak future information.' },
    { q: 'What does early stopping use to decide when to stop?', options: ['Training loss', 'Validation loss not improving for some epochs', 'Epoch count only', 'Learning rate'], answer: 1, explain: 'Training loss almost always keeps falling.' },
    { q: 'What is the recommended way to save checkpoints?', options: ['torch.save(model)', 'torch.save(model.state_dict())', 'pickle.dump', 'json'], answer: 1, explain: 'state_dict is portable across code changes.' },
    { q: 'Which route gets a PyTorch model into a C++ engine?', options: ['TorchScript only', 'torch.export / ONNX with a C++ runtime', 'pickle', 'Rewrite'], answer: 1, explain: 'TorchScript is in maintenance mode.' },
  ],
}
