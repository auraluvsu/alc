import type { DictEntry } from '../types'

export const DL_DICT: DictEntry[] = [
  // ---------- Building blocks ----------
  { term: 'Tensor', cat: 'Building blocks', module: 1, desc: 'An n-dimensional array that can live on an accelerator and record operations for autograd.', syntax: `torch.randn(64, 20, device=device)` },
  { term: 'nn.Module', cat: 'Building blocks', module: 1, desc: 'Base class for layers and models; registers parameters and sub-modules assigned as attributes.', syntax: `class Net(nn.Module):
    def __init__(self): super().__init__(); self.fc = nn.Linear(20, 1)
    def forward(self, x): return self.fc(x)` },
  { term: 'nn.Linear', cat: 'Building blocks', module: 1, desc: 'Fully connected layer: `y = x Wᵀ + b`.', syntax: `nn.Linear(in_features, out_features)` },
  { term: 'nn.Sequential', cat: 'Building blocks', module: 2, desc: 'Chains modules in order.', syntax: `nn.Sequential(nn.Linear(20, 64), nn.ReLU(), nn.Linear(64, 1))` },
  { term: 'Logits', cat: 'Building blocks', module: 1, desc: 'Raw, unnormalised class scores; softmax turns them into probabilities.', syntax: `logits = net(x); probs = logits.softmax(dim=1)` },
  // ---------- Activations ----------
  { term: 'ReLU', cat: 'Activations', module: 2, desc: '`max(0, x)`. The default hidden activation for MLPs.', syntax: `nn.ReLU(); torch.relu(x)` },
  { term: 'GELU / SiLU', cat: 'Activations', module: 2, desc: 'Smooth ReLU-like activations standard in transformers.', syntax: `nn.GELU(); nn.SiLU()` },
  { term: 'Sigmoid / tanh', cat: 'Activations', module: 2, desc: 'Squashing functions; saturate, causing vanishing gradients in deep stacks.', syntax: `torch.sigmoid(x); torch.tanh(x)` },
  { term: 'Softmax', cat: 'Activations', module: 1, desc: 'Exponentiate and normalise so outputs sum to 1.', syntax: `torch.softmax(logits, dim=1)` },
  // ---------- Training ----------
  { term: 'Minibatch SGD', cat: 'Training', module: 1, desc: 'Update parameters using gradients estimated on a random subset of the data.', syntax: `for xb, yb in DataLoader(ds, batch_size=64, shuffle=True): ...` },
  { term: 'Epoch', cat: 'Training', module: 1, desc: 'One full pass over the training data.', syntax: `for epoch in range(n_epochs): ...` },
  { term: 'Learning rate', cat: 'Training', module: 1, desc: 'Step size of each update; the most important hyperparameter.', syntax: `torch.optim.AdamW(params, lr=1e-3)` },
  { term: 'Cross-entropy', cat: 'Training', module: 1, desc: '−log p(true class). Takes logits; numerically stable inside PyTorch.', syntax: `nn.CrossEntropyLoss()(logits, labels)` },
  { term: 'train() / eval()', cat: 'Training', module: 2, desc: 'Switch Dropout and BatchNorm between training and inference behaviour.', syntax: `net.train(); ...; net.eval()` },
  // ---------- Regularisation ----------
  { term: 'Weight decay', cat: 'Regularisation', module: 2, desc: 'Penalise large weights; AdamW applies it decoupled from the gradient.', syntax: `torch.optim.AdamW(params, lr=1e-3, weight_decay=1e-2)` },
  { term: 'Dropout', cat: 'Regularisation', module: 2, desc: 'Randomly zero a fraction of activations in training; survivors scaled by 1/(1−p).', syntax: `nn.Dropout(p=0.2)` },
  { term: 'Early stopping', cat: 'Regularisation', module: 2, desc: 'Stop when validation loss stops improving; keep the best checkpoint.', syntax: `if val < best: torch.save(net.state_dict(), "best.pt")` },
  // ---------- Stability ----------
  { term: 'Vanishing / exploding gradients', cat: 'Stability', module: 2, desc: 'Gradients shrink or grow geometrically through many layers.', syntax: `torch.nn.utils.clip_grad_norm_(net.parameters(), 1.0)` },
  { term: 'Kaiming / Xavier init', cat: 'Stability', module: 2, desc: 'Weight scales chosen to keep activation variance stable (Kaiming for ReLU, Xavier for tanh).', syntax: `nn.init.kaiming_normal_(layer.weight, nonlinearity="relu")` },
]
