import type { Module } from '../types'

export const n08: Module = {
  n: 8,
  title: 'Generative Models',
  tour: '20 · Generative Adversarial Networks (and beyond)',
  summary: 'Models that learn to produce new data: autoencoders for compression and anomaly detection, variational autoencoders, generative adversarial networks, diffusion models in outline, and generating synthetic market data for stress-testing strategies.',
  topics: ['Autoencoders', 'Variational autoencoders', 'GANs', 'Diffusion in outline', 'Synthetic market data'],
  cpp23: ['Diffusion and flow-matching models have largely replaced GANs for images; GANs and VAEs remain common for tabular and time-series synthesis.'],
  lessons: [
    {
      id: 'ae',
      title: 'Autoencoders',
      blocks: [
        { kind: 'analogy', text: "An autoencoder learns to pass data through a narrow letterbox and rebuild it on the other side. To succeed, it must learn a compact description of what normal data looks like. Things it reconstructs badly are things it has never seen the like of, which makes reconstruction error a handy anomaly score." },
        { kind: 'code', code: `import torch
from torch import nn
import torch.nn.functional as F
torch.manual_seed(0)

# 20 correlated features driven by 3 hidden factors
F_true = torch.randn(5000, 3)
X = F_true @ torch.randn(3, 20) + 0.1 * torch.randn(5000, 20)

ae = nn.Sequential(nn.Linear(20, 16), nn.GELU(), nn.Linear(16, 3),     # encoder → 3-d code
                   nn.Linear(3, 16), nn.GELU(), nn.Linear(16, 20))     # decoder
opt = torch.optim.AdamW(ae.parameters(), lr=3e-3)
for step in range(2000):
    idx = torch.randint(0, 4000, (256,))
    loss = F.mse_loss(ae(X[idx]), X[idx])
    opt.zero_grad(); loss.backward(); opt.step()

with torch.no_grad():
    err_normal = ((ae(X[4000:]) - X[4000:]) ** 2).mean(1)
    weird = torch.randn(10, 20) * 3                     # doesn't follow the factor structure
    err_weird = ((ae(weird) - weird) ** 2).mean(1)
err_normal.mean(), err_weird.mean()                     # anomalies reconstruct far worse` },
        { kind: 'check', q: 'Why does reconstruction error flag anomalies?', options: ['Anomalies are labelled', 'The model only learned to rebuild data like its training set', 'Anomalies are larger', 'It uses a classifier'], answer: 1, hint: 'The letterbox only fits familiar shapes.', explain: 'Train on normal data only.' },
      ],
    },
    {
      id: 'vae',
      title: 'Variational autoencoders',
      blocks: [
        { kind: 'analogy', text: "A plain autoencoder's code space has gaps: pick a random point and the decoder produces nonsense. A VAE makes the encoder output a small *cloud* (a mean and a spread) instead of a point, and gently pulls all the clouds towards one standard bell curve. The space fills in smoothly, so sampling from the bell curve and decoding produces new, plausible data." },
        { kind: 'code', code: `class VAE(nn.Module):
    def __init__(self, d=20, z=3):
        super().__init__()
        self.enc = nn.Sequential(nn.Linear(d, 32), nn.GELU())
        self.mu, self.logvar = nn.Linear(32, z), nn.Linear(32, z)
        self.dec = nn.Sequential(nn.Linear(z, 32), nn.GELU(), nn.Linear(32, d))
    def forward(self, x):
        h = self.enc(x)
        mu, logvar = self.mu(h), self.logvar(h)
        z = mu + torch.randn_like(mu) * (0.5 * logvar).exp()      # reparameterisation trick
        return self.dec(z), mu, logvar

def vae_loss(x, recon, mu, logvar, beta=1.0):
    rec = F.mse_loss(recon, x, reduction="sum") / len(x)
    kl = -0.5 * (1 + logvar - mu ** 2 - logvar.exp()).sum() / len(x)   # pull towards N(0, I)
    return rec + beta * kl

vae = VAE()
recon, mu, logvar = vae(X[:64]); vae_loss(X[:64], recon, mu, logvar).backward()
new_samples = vae.dec(torch.randn(100, 3))                      # generate after training` },
        { kind: 'check', q: 'What does the reparameterisation trick allow?', options: ['Larger batches', 'Backpropagating through random sampling', 'Skipping the decoder', 'Discrete codes'], answer: 1, hint: 'z = μ + σ·ε.', explain: 'The randomness moves into ε, which needs no gradient.' },
      ],
    },
    {
      id: 'gan',
      title: 'GANs',
      blocks: [
        { kind: 'analogy', text: "A GAN is a forger and a detective locked in a room. The generator forges samples from random noise; the discriminator tries to tell forgeries from real data. Each improves by beating the other until the forgeries are good enough that the detective is reduced to guessing. Brilliant when it works, and notoriously unstable to train." },
        { kind: 'code', code: `G = nn.Sequential(nn.Linear(8, 64), nn.GELU(), nn.Linear(64, 20))                 # noise → sample
D = nn.Sequential(nn.Linear(20, 64), nn.LeakyReLU(0.2), nn.Linear(64, 1))          # sample → real?
opt_g = torch.optim.Adam(G.parameters(), lr=2e-4, betas=(0.5, 0.999))
opt_d = torch.optim.Adam(D.parameters(), lr=2e-4, betas=(0.5, 0.999))
bce = nn.BCEWithLogitsLoss()

for step in range(200):
    real = X[torch.randint(0, 4000, (128,))]
    fake = G(torch.randn(128, 8))
    # 1) detective: label real 1, fake 0
    d_loss = bce(D(real), torch.ones(128, 1)) + bce(D(fake.detach()), torch.zeros(128, 1))
    opt_d.zero_grad(); d_loss.backward(); opt_d.step()
    # 2) forger: make the detective say 1 on fakes
    g_loss = bce(D(fake), torch.ones(128, 1))
    opt_g.zero_grad(); g_loss.backward(); opt_g.step()` },
        { kind: 'pitfall', text: '**Mode collapse**: the generator finds one forgery that fools the detective and produces only that, such as calm markets and never crashes. Check generated data against real data across many statistics, not just a few samples by eye.' },
        { kind: 'check', q: 'Why is `fake.detach()` used in the discriminator step?', options: ['Speed only', 'So the discriminator\'s loss doesn\'t update the generator', 'To stop dropout', 'Required by BCE'], answer: 1, hint: 'Each player updates their own weights.', explain: 'The generator gets its own step afterwards.' },
      ],
    },
    {
      id: 'diffusion',
      title: 'Diffusion in outline',
      blocks: [
        { kind: 'analogy', text: "Diffusion models learn to un-smudge. Take real data and add noise in many small steps until it's pure static; train a network to predict and remove the noise at each step. To generate, start from static and repeatedly denoise. It's slower to sample than a GAN but far more stable to train, and it's behind today's best image, audio and video generators." },
        { kind: 'code', code: `# Training step (DDPM-style), conceptually:
T = 1000
betas = torch.linspace(1e-4, 0.02, T)
alpha_bar = torch.cumprod(1 - betas, dim=0)

x0 = X[:128]
t = torch.randint(0, T, (128,))
noise = torch.randn_like(x0)
xt = alpha_bar[t].sqrt()[:, None] * x0 + (1 - alpha_bar[t]).sqrt()[:, None] * noise   # noised data
# loss = F.mse_loss(denoiser(xt, t), noise)     ← the network learns to predict the noise
# Sampling runs t = T-1 … 0, removing a little predicted noise each step.` },
        { kind: 'check', q: 'What does a diffusion model\'s network learn to predict during training?', options: ['The class', 'The noise that was added at step t', 'The next token', 'The discriminator score'], answer: 1, hint: 'Un-smudging.', explain: 'Subtracting predicted noise step by step generates data.' },
      ],
    },
    {
      id: 'synthetic',
      title: 'Synthetic market data',
      blocks: [
        { kind: 'analogy', text: "History happened once. Synthetic data offers alternative histories that look statistically like the real one, so you can see how a strategy might behave in markets that rhymed rather than repeated. The danger is that the generator smooths away exactly the rare, ugly events you most need to test against." },
        { kind: 'list', items: [
          '**Validate the stylised facts**: fat tails (kurtosis), volatility clustering (autocorrelation of |returns|), no autocorrelation in raw returns, leverage effect, cross-asset correlations that rise in sell-offs.',
          '**Simple first**: block bootstrap of real returns and GARCH-type models preserve many stylised facts with almost no risk of nonsense.',
          '**Use for stress and robustness**, not to manufacture an edge: a strategy that only works on synthetic data hasn\'t been shown to work.',
          '**Train generators on the training period only**, or the synthetic data carries the test period\'s information.',
        ] },
        { kind: 'code', code: `import numpy as np

def block_bootstrap(returns: np.ndarray, n: int, block: int = 20, seed: int = 0) -> np.ndarray:
    """Resample contiguous blocks, preserving short-range dependence like volatility clustering."""
    rng = np.random.default_rng(seed)
    starts = rng.integers(0, len(returns) - block, size=n // block + 1)
    return np.concatenate([returns[s : s + block] for s in starts])[:n]

def stylised_facts(r: np.ndarray) -> dict:
    ac = lambda x, k: np.corrcoef(x[:-k], x[k:])[0, 1]
    return {"kurtosis": float(((r - r.mean()) ** 4).mean() / r.var() ** 2 - 3),
            "acf_ret_1": float(ac(r, 1)), "acf_abs_1": float(ac(np.abs(r), 1))}
# Compare stylised_facts(real) with stylised_facts(synthetic) before trusting any generator` },
        { kind: 'check', q: 'Which property should synthetic returns reproduce?', options: ['Strong autocorrelation of raw returns', 'Fat tails and volatility clustering', 'Normally distributed returns', 'Constant volatility'], answer: 1, hint: 'Stylised facts of real markets.', explain: 'Raw returns have little autocorrelation; absolute returns have a lot.' },
      ],
    },
  ],
  quiz: [
    { q: 'An autoencoder is trained to…', options: ['Classify', 'Reconstruct its input through a bottleneck', 'Generate labels', 'Cluster'], answer: 1, explain: 'Compression.' },
    { q: 'Reconstruction error can detect…', options: ['Labels', 'Anomalies unlike the training data', 'Overfitting only', 'Class imbalance'], answer: 1, explain: 'Train on normal data.' },
    { q: 'A VAE encoder outputs…', options: ['A single point', 'A mean and variance (a distribution)', 'A class', 'Noise only'], answer: 1, explain: 'Sampled with the reparameterisation trick.' },
    { q: 'The KL term in a VAE…', options: ['Measures reconstruction', 'Pulls latent distributions toward a standard normal', 'Adds dropout', 'Is optional always'], answer: 1, explain: 'Makes sampling meaningful.' },
    { q: 'In a GAN the discriminator…', options: ['Generates data', 'Distinguishes real from generated samples', 'Encodes data', 'Adds noise'], answer: 1, explain: 'The detective.' },
    { q: 'Mode collapse means…', options: ['Training diverges', 'The generator produces only a narrow set of outputs', 'The discriminator wins', 'Too many modes'], answer: 1, explain: 'Check diversity.' },
    { q: 'Diffusion models generate by…', options: ['One forward pass', 'Iteratively denoising from pure noise', 'Sampling a VAE', 'Adversarial training'], answer: 1, explain: 'Many small steps.' },
    { q: 'A simple, robust baseline for synthetic returns is…', options: ['A GAN', 'Block bootstrap or GARCH', 'Gaussian noise', 'Linear trend'], answer: 1, explain: 'Preserves stylised facts.' },
  ],
}
