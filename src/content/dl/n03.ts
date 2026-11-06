import type { Module } from '../types'

export const n03: Module = {
  n: 3,
  title: 'Builders\' Guide & Optimisation',
  tour: '6, 12 · Builders\' Guide · Optimization',
  summary: 'Building blocks for real networks: custom modules and parameter management, normalisation layers, residual connections, optimisers from SGD with momentum to AdamW, and learning-rate schedules with warm-up.',
  topics: ['Custom modules', 'Parameter management', 'Normalisation layers', 'Residual connections', 'Momentum, Adam & AdamW', 'LR schedules & warm-up'],
  cpp23: ['`torch.compile` for fused, faster training steps.', '`nn.RMSNorm` (2.4) is built in, as used by most modern LLMs.'],
  lessons: [
    {
      id: 'custom',
      title: 'Custom modules',
      blocks: [
        { kind: 'analogy', text: "`nn.Sequential` is a straight pipe. Real architectures branch, merge, skip and reuse parts, so you write the plumbing yourself in `forward`, which is ordinary Python: loops, ifs and function calls all work, and autograd follows whatever path the data actually took." },
        { kind: 'code', code: `import torch
from torch import nn

class GatedBlock(nn.Module):
    """y = x + gate(x) * transform(x): a small custom block."""
    def __init__(self, d: int):
        super().__init__()
        self.transform = nn.Linear(d, d)
        self.gate = nn.Linear(d, d)
        self.scale = nn.Parameter(torch.ones(d))       # a learnable tensor of your own
        self.register_buffer("calls", torch.zeros(()))  # saved state that is NOT trained

    def forward(self, x):
        self.calls += 1
        return x + torch.sigmoid(self.gate(x)) * self.transform(x) * self.scale

blk = GatedBlock(16)
blk(torch.randn(4, 16)).shape            # torch.Size([4, 16])
[n for n, _ in blk.named_parameters()]   # transform.weight/bias, gate.weight/bias, scale
list(blk.state_dict())                   # parameters AND the 'calls' buffer` },
        { kind: 'check', q: 'What is `register_buffer` for?', options: ['Trainable weights', 'State that should be saved and moved with the module but not trained', 'Caching outputs', 'Gradients'], answer: 1, hint: 'Running statistics in BatchNorm are an example.', explain: 'Buffers appear in state_dict and follow .to(device).' },
      ],
    },
    {
      id: 'params',
      title: 'Parameter management',
      blocks: [
        { kind: 'analogy', text: "Every module keeps an inventory of its parameters, nested like folders. You can list them, freeze some (fine-tuning only the head), tie two layers to the same weights, or initialise a whole family of layers in one sweep with `apply`." },
        { kind: 'code', code: `net = nn.Sequential(nn.Linear(10, 64), nn.ReLU(), GatedBlock(64), nn.Linear(64, 1))
sum(p.numel() for p in net.parameters() if p.requires_grad)

for p in net[0].parameters():          # freeze the first layer
    p.requires_grad_(False)

def init_weights(m):
    if isinstance(m, nn.Linear):
        nn.init.kaiming_normal_(m.weight, nonlinearity="relu")
        nn.init.zeros_(m.bias)
net.apply(init_weights)                  # visits every sub-module recursively

shared = nn.Linear(8, 8)
tied = nn.Sequential(shared, nn.ReLU(), shared)     # the same weights used twice
tied[0].weight is tied[2].weight                     # True; gradients from both uses add up` },
        { kind: 'check', q: 'How do you freeze a layer so it isn\'t trained?', options: ['Delete it', 'Set requires_grad=False on its parameters', 'Call eval()', 'Use no_grad in __init__'], answer: 1, hint: 'Gradients aren\'t computed for it.', explain: 'eval() changes layer behaviour, not trainability.' },
      ],
    },
    {
      id: 'norm',
      title: 'Normalisation layers',
      blocks: [
        { kind: 'analogy', text: "Deep networks are long chains where each layer's input distribution keeps shifting as earlier layers learn. Normalisation layers re-centre and re-scale activations at each stage, like an audio engineer keeping every channel at a sensible level, so later layers get a stable signal and higher learning rates become safe." },
        { kind: 'code', code: `x = torch.randn(32, 64) * 5 + 3          # batch of 32, 64 features, badly scaled

bn = nn.BatchNorm1d(64)                    # normalise each FEATURE across the batch
ln = nn.LayerNorm(64)                      # normalise each SAMPLE across its features
rms = nn.RMSNorm(64)                       # LayerNorm without mean-centring (LLMs)

bn(x).mean(0).abs().max(), bn(x).std(0).mean()     # ≈ 0 and ≈ 1 per feature
ln(x).mean(1).abs().max(), ln(x).std(1).mean()     # ≈ 0 and ≈ 1 per sample

bn.eval()          # BatchNorm then uses running statistics gathered in training` },
        { kind: 'list', items: [
          '**BatchNorm**: CNNs with decent batch sizes. Its behaviour differs between train and eval, and it misbehaves with tiny batches.',
          '**LayerNorm / RMSNorm**: transformers and RNNs; works per sample, so batch size doesn\'t matter.',
          'For financial time series, BatchNorm statistics mix different days in one batch; LayerNorm is usually the safer default.',
        ] },
        { kind: 'check', q: 'Which normalisation is independent of batch size?', options: ['BatchNorm', 'LayerNorm', 'Both', 'Neither'], answer: 1, hint: 'Per sample vs per feature across samples.', explain: 'That\'s why transformers use LayerNorm/RMSNorm.' },
      ],
    },
    {
      id: 'residual',
      title: 'Residual connections',
      blocks: [
        { kind: 'analogy', text: "A residual connection adds a bypass lane around a block: output = x + block(x). The block only has to learn a *correction* to its input rather than a whole new representation, and gradients can travel straight down the bypass. This is what made 100-plus-layer networks trainable (ResNet, 2015), and every transformer uses it." },
        { kind: 'code', code: `class ResidualMLP(nn.Module):
    def __init__(self, d: int, depth: int, residual: bool):
        super().__init__()
        self.blocks = nn.ModuleList(
            nn.Sequential(nn.Linear(d, d), nn.Tanh()) for _ in range(depth))
        self.residual = residual
    def forward(self, x):
        for b in self.blocks:
            x = x + b(x) if self.residual else b(x)
        return x

for residual in (False, True):
    torch.manual_seed(0)
    net = ResidualMLP(32, depth=50, residual=residual)
    x = torch.randn(16, 32, requires_grad=True)
    net(x).sum().backward()
    print(residual, x.grad.norm().item())
# False ≈ 9e-12: the gradient has vanished after 50 layers
# True  ≈ 278:   it arrives intact through the bypass lanes` },
        { kind: 'check', q: 'Why do residual connections help very deep networks train?', options: ['Fewer parameters', 'Gradients flow directly through the identity path', 'They remove non-linearity', 'They normalise inputs'], answer: 1, hint: 'The bypass lane.', explain: 'Each block learns a small correction.' },
      ],
    },
    {
      id: 'optim',
      title: 'Optimisers & learning-rate schedules',
      blocks: [
        { kind: 'analogy', text: "Plain SGD is a walker who only feels the slope underfoot. Momentum gives them inertia, like a ball rolling downhill, so they speed through flat stretches and don't rattle side to side in narrow valleys. Adam also gives every parameter its own step size, scaled by how noisy its recent gradients were. The schedule decides how big steps are over time: warm up gently, then decay." },
        { kind: 'code', code: `model = nn.Sequential(nn.Linear(20, 128), nn.GELU(), nn.Linear(128, 1))

sgd = torch.optim.SGD(model.parameters(), lr=0.05, momentum=0.9, nesterov=True)
adamw = torch.optim.AdamW(model.parameters(), lr=3e-4, betas=(0.9, 0.999), weight_decay=0.01)

total_steps, warmup = 10_000, 500
sched = torch.optim.lr_scheduler.SequentialLR(adamw, [
    torch.optim.lr_scheduler.LinearLR(adamw, start_factor=0.01, total_iters=warmup),
    torch.optim.lr_scheduler.CosineAnnealingLR(adamw, T_max=total_steps - warmup),
], milestones=[warmup])

lrs = []
for step in range(total_steps):
    adamw.step(); sched.step()            # (real loop: zero_grad, backward, step, then sched.step)
    lrs.append(sched.get_last_lr()[0])
lrs[0], max(lrs), lrs[-1]                 # tiny → 3e-4 at the end of warm-up → ≈ 0` },
        { kind: 'list', items: [
          '**AdamW** with warm-up and cosine decay is the default for transformers and most new work.',
          '**SGD + momentum** with step or cosine decay is still competitive for CNNs, and often generalises slightly better.',
          '**Warm-up** prevents Adam\'s early, poorly estimated step sizes from wrecking the initial weights.',
          'Find a learning rate quickly with an **LR range test**: increase it exponentially over a few hundred steps and pick a value a bit below where the loss starts to blow up.',
        ] },
        { kind: 'check', q: 'What does learning-rate warm-up do?', options: ['Starts with a large LR', 'Starts small and increases over the first steps', 'Freezes layers', 'Adds momentum'], answer: 1, hint: 'Gentle start.', explain: 'Adam\'s second-moment estimates are unreliable at first.' },
      ],
    },
  ],
  quiz: [
    { q: 'nn.Parameter is…', options: ['A constant', 'A tensor registered as a trainable parameter of a module', 'A hyperparameter', 'A buffer'], answer: 1, explain: 'Appears in parameters().' },
    { q: 'module.apply(fn) …', options: ['Runs forward', 'Calls fn on every sub-module recursively', 'Freezes layers', 'Compiles'], answer: 1, explain: 'Handy for initialisation.' },
    { q: 'BatchNorm normalises…', options: ['Each sample across features', 'Each feature across the batch', 'Gradients', 'Weights'], answer: 1, explain: 'LayerNorm is per sample.' },
    { q: 'Which norm do most LLMs use?', options: ['BatchNorm', 'RMSNorm / LayerNorm', 'GroupNorm', 'None'], answer: 1, explain: 'Batch-size independent.' },
    { q: 'A residual block computes…', options: ['f(x)', 'x + f(x)', 'x · f(x)', 'f(f(x))'], answer: 1, explain: 'Identity shortcut.' },
    { q: 'Momentum in SGD…', options: ['Increases batch size', 'Accumulates a velocity from past gradients', 'Adds noise', 'Removes the LR'], answer: 1, explain: 'Smooths and speeds up descent.' },
    { q: 'Adam adapts…', options: ['Batch size', 'A per-parameter step size from gradient moment estimates', 'Network depth', 'Activation functions'], answer: 1, explain: 'First and second moments.' },
    { q: 'A common modern schedule is…', options: ['Constant LR', 'Linear warm-up then cosine decay', 'Random LR', 'Increasing LR forever'], answer: 1, explain: 'Especially for transformers.' },
  ],
}
