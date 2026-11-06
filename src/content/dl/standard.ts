import type { StdEntry } from '../standard'

// The PyTorch APIs worth knowing by heart.
export const DL_STANDARD: StdEntry[] = [
  {
    name: 'torch.tensor / randn / zeros', header: 'torch', cat: 'Tensors', module: 1,
    summary: 'Create tensors.',
    what: '`torch.tensor(data)` copies data; `randn`, `zeros`, `ones`, `arange`, `linspace` build new ones. Pass `device=` and `dtype=` at creation to avoid extra copies.',
    code: `x = torch.randn(64, 20, device=device)
w = torch.zeros(20, requires_grad=True)
idx = torch.arange(10)`,
    when: 'Synthetic data, parameters, indices.',
  },
  {
    name: '.to(device) / torch.accelerator', header: 'torch', cat: 'Tensors', module: 1,
    summary: 'Move tensors and models between CPU and accelerators.',
    what: '`torch.accelerator` detects the available accelerator (CUDA, MPS, XPU…). `.to(device)` moves a tensor or every parameter of a module.',
    code: `device = torch.accelerator.current_accelerator() if torch.accelerator.is_available() else torch.device("cpu")
net.to(device); xb = xb.to(device, non_blocking=True)`,
    when: 'At the start of every script, and for every batch.',
  },
  {
    name: 'nn.Linear / nn.Sequential', header: 'torch.nn', cat: 'Layers', module: 1,
    summary: 'The basic building blocks.',
    what: '`nn.Linear(d_in, d_out)` is a dense layer. `nn.Sequential` chains modules; index into it like a list.',
    code: `net = nn.Sequential(nn.Linear(20, 64), nn.ReLU(), nn.Linear(64, 1))
net[0].weight.shape   # torch.Size([64, 20])`,
    when: 'MLPs and the heads of larger models.',
  },
  {
    name: 'nn.Dropout / nn.LayerNorm', header: 'torch.nn', cat: 'Layers', module: 2,
    summary: 'Regularisation and normalisation layers.',
    what: 'Dropout zeroes activations randomly in training mode. LayerNorm normalises each sample\'s features; BatchNorm normalises each feature across the batch.',
    code: `nn.Sequential(nn.Linear(64, 64), nn.LayerNorm(64), nn.GELU(), nn.Dropout(0.1))`,
    when: 'Deeper networks; LayerNorm is standard in transformers.',
  },
  {
    name: 'nn.CrossEntropyLoss / MSELoss', header: 'torch.nn', cat: 'Losses', module: 1,
    summary: 'The two losses you\'ll use most.',
    what: 'CrossEntropyLoss takes logits `(N, K)` and integer labels `(N,)`. MSELoss compares same-shaped tensors. `HuberLoss` is a robust middle ground.',
    code: `nn.CrossEntropyLoss(label_smoothing=0.05)(logits, y)
nn.MSELoss()(pred.squeeze(-1), target)`,
    when: 'Classification and regression respectively.',
  },
  {
    name: 'torch.optim.AdamW / SGD', header: 'torch.optim', cat: 'Optimisation', module: 2,
    summary: 'Update parameters from gradients.',
    what: '`zero_grad()` clears gradients, `step()` applies an update. AdamW is the usual default; SGD with momentum remains strong for CNNs.',
    code: `opt = torch.optim.AdamW(net.parameters(), lr=3e-4, weight_decay=1e-2)
opt.zero_grad(); loss.backward(); opt.step()`,
    when: 'Every training loop.',
  },
  {
    name: 'lr_scheduler', header: 'torch.optim', cat: 'Optimisation', module: 3,
    summary: 'Change the learning rate during training.',
    what: 'Cosine annealing, one-cycle, step decay and linear warm-up. Call `sched.step()` per epoch or per batch as each scheduler expects.',
    code: `sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=1e-3, total_steps=len(dl) * epochs)
# per batch: opt.step(); sched.step()`,
    when: 'Almost always improves on a constant learning rate.',
  },
  {
    name: 'Dataset / DataLoader', header: 'torch.utils.data', cat: 'Data', module: 1,
    summary: 'Feed minibatches.',
    what: 'A Dataset implements `__len__` and `__getitem__`; a DataLoader batches, shuffles and loads in parallel workers. `TensorDataset` wraps existing tensors.',
    code: `dl = DataLoader(TensorDataset(X, y), batch_size=256, shuffle=True,
                num_workers=4, pin_memory=True)`,
    when: 'Every training and evaluation loop.',
  },
  {
    name: 'torch.no_grad / inference_mode', header: 'torch', cat: 'Autograd', module: 1,
    summary: 'Turn off graph recording.',
    what: 'Use for evaluation and inference: less memory, faster. `inference_mode` is stricter and faster still.',
    code: `@torch.inference_mode()
def predict(x): return net.eval()(x)`,
    when: 'Validation, inference, parameter updates written by hand.',
  },
  {
    name: 'nn.init', header: 'torch.nn.init', cat: 'Stability', module: 2,
    summary: 'Initialise weights deliberately.',
    what: '`kaiming_normal_`, `xavier_uniform_`, `zeros_`, `orthogonal_` and others modify a tensor in place.',
    code: `def init(m):
    if isinstance(m, nn.Linear):
        nn.init.kaiming_normal_(m.weight, nonlinearity="relu"); nn.init.zeros_(m.bias)
net.apply(init)`,
    when: 'Custom architectures or when training is unstable.',
  },
  {
    name: 'clip_grad_norm_', header: 'torch.nn.utils', cat: 'Stability', module: 2,
    summary: 'Cap the size of the gradient.',
    what: 'Rescales all gradients so their combined norm is at most a threshold. Call it between `backward()` and `step()`.',
    code: `loss.backward()
torch.nn.utils.clip_grad_norm_(net.parameters(), max_norm=1.0)
opt.step()`,
    when: 'RNNs, transformers, and any loss with occasional huge spikes (fat-tailed returns).',
  },
  {
    name: 'state_dict / torch.save', header: 'torch', cat: 'Persistence', module: 2,
    summary: 'Checkpoint models and optimisers.',
    what: '`state_dict()` is a dict of tensors. Save it with `torch.save`, restore with `load_state_dict`. `torch.load` uses `weights_only=True` by default.',
    code: `torch.save({"model": net.state_dict(), "opt": opt.state_dict(), "epoch": epoch}, "ckpt.pt")
ckpt = torch.load("ckpt.pt"); net.load_state_dict(ckpt["model"])`,
    when: 'Early stopping, resuming, sharing weights.',
  },
  {
    name: 'torch.compile / torch.export', header: 'torch', cat: 'Performance & deployment', module: 9,
    summary: 'Speed up in Python; export for C++.',
    what: '`torch.compile` JIT-compiles the model for faster execution. `torch.export` captures a full graph for AOTInductor, ONNX or other runtimes.',
    code: `fast = torch.compile(net)
ep = torch.export.export(net.eval(), (torch.randn(1, 20),))
torch.onnx.export(net, (torch.randn(1, 20),), "net.onnx", dynamo=True)`,
    when: 'Training speed-ups, and moving models into production C++.',
  },
]
