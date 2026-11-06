import type { Module } from '../types'

export const n10: Module = {
  n: 10,
  title: 'Deep Learning for Financial Time Series',
  tour: 'Added · Finance',
  summary: 'Applying everything so far to markets without fooling yourself: framing targets and normalising features, honest train/validation/test splits in time, models for limit-order-book data, forecasting volatility, and why a linear baseline should always be in the room.',
  topics: ['Framing targets & features', 'Normalisation without leakage', 'Order-book models', 'Volatility forecasting', 'Honest evaluation'],
  cpp23: ['Not from d2l: draws on DeepLOB (Zhang, Zohren & Roberts, 2019) and standard quant practice.'],
  lessons: [
    {
      id: 'framing',
      title: 'Framing targets & features',
      blocks: [
        { kind: 'analogy', text: "A neural net will learn whatever you ask, including the wrong question. \"Predict tomorrow's price\" mostly teaches it to copy today's price (prices are nearly a random walk), giving an impressive-looking chart and no edge. Ask instead for something stationary and tradable: next-period return, sign, or volatility, scaled by recent risk." },
        { kind: 'code', code: `import numpy as np, pandas as pd, torch

rng = np.random.default_rng(0)
px = pd.Series(2000 * np.exp(rng.normal(0, 0.01, 3000).cumsum()))
ret = np.log(px).diff()

# A naive "price model" that just repeats yesterday looks great on price-level error…
naive = px.shift(1)
r2_price = 1 - ((px - naive) ** 2).mean() / ((px - px.mean()) ** 2).mean()   # ≈ 0.999!
# …but has zero information about returns. Always evaluate in return space.

vol = ret.rolling(50).std()
target = (ret.shift(-1) / vol).clip(-5, 5)              # next return in units of recent risk
features = pd.DataFrame({f"r_{k}": ret.shift(k) / vol for k in range(0, 20)})   # last 20 scaled returns` },
        { kind: 'pitfall', text: 'High R² on prices is meaningless: any model that outputs roughly yesterday\'s price gets R² ≈ 0.999. Evaluate return forecasts, compare against "predict zero", and measure decisions (P&L after costs), not curve fits.' },
        { kind: 'check', q: 'A model predicting next-day gold prices reports R² = 0.998. What should you conclude?', options: ['Great model', 'Nothing yet: copying yesterday\'s price achieves that', 'Leakage', 'Overfitting'], answer: 1, hint: 'Random walks are very persistent.', explain: 'Evaluate on returns instead.' },
      ],
    },
    {
      id: 'normalise',
      title: 'Normalisation without leakage',
      blocks: [
        { kind: 'analogy', text: "Networks want inputs on a sensible scale, but a z-score computed over the whole history tells each day what the future's mean and volatility turned out to be. Normalise with information available at the time: rolling statistics, or statistics from the training period only, applied forward." },
        { kind: 'code', code: `n = len(features)
train_end, val_end = int(n * 0.6), int(n * 0.8)
gap = 50                                                   # ≥ longest look-back / label horizon

data = pd.concat([features, target.rename("y")], axis=1).dropna()
tr = data.iloc[:train_end - gap]
va = data.iloc[train_end : val_end - gap]
te = data.iloc[val_end:]

mu, sd = tr.drop(columns="y").mean(), tr.drop(columns="y").std()   # TRAINING statistics only
def prep(df):
    X = torch.tensor(((df.drop(columns="y") - mu) / sd).to_numpy(), dtype=torch.float32)
    y = torch.tensor(df["y"].to_numpy(), dtype=torch.float32)
    return X, y
(X_tr, y_tr), (X_va, y_va), (X_te, y_te) = prep(tr), prep(va), prep(te)` },
        { kind: 'check', q: 'Where should the normalisation mean and std come from?', options: ['The whole dataset', 'The training period only (or rolling past windows)', 'The test set', 'Each batch'], answer: 1, hint: 'What did you know at the time?', explain: 'Full-sample statistics leak the future.' },
      ],
    },
    {
      id: 'lob',
      title: 'Order-book models',
      blocks: [
        { kind: 'analogy', text: "A limit order book is a snapshot of waiting buy and sell orders at each price level. Stack snapshots over time and you get an image: price levels on one axis, time on the other. DeepLOB treats it exactly like that: convolutions spot local shapes (imbalances between bid and ask, thinning levels), and an LSTM tracks how they evolve over the last hundred updates." },
        { kind: 'code', code: `from torch import nn

class DeepLOBLite(nn.Module):
    """Input: (batch, 1, T=100, 40) = 10 levels × (bid px, bid size, ask px, ask size) over 100 events."""
    def __init__(self, n_classes=3):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 16, (1, 2), stride=(1, 2)), nn.LeakyReLU(0.01),    # pair price with size
            nn.Conv2d(16, 16, (4, 1), padding="same"), nn.LeakyReLU(0.01),  # short time patterns
            nn.Conv2d(16, 16, (1, 2), stride=(1, 2)), nn.LeakyReLU(0.01),   # pair bid with ask
            nn.Conv2d(16, 16, (1, 10)), nn.LeakyReLU(0.01),                 # across all 10 levels
        )
        self.lstm = nn.LSTM(16, 64, batch_first=True)
        self.head = nn.Linear(64, n_classes)                                # mid-price down / flat / up
    def forward(self, x):
        h = self.conv(x).squeeze(-1).transpose(1, 2)    # (batch, T, 16)
        out, _ = self.lstm(h)
        return self.head(out[:, -1])

DeepLOBLite()(torch.randn(8, 1, 100, 40)).shape        # torch.Size([8, 3])` },
        { kind: 'pitfall', text: 'The `padding="same"` time convolution above looks 2 events into the future at each step. That\'s acceptable here only because just the final step\'s output is used and the input window ends at the decision time. Anything that emits per-step predictions must use causal padding (module 4).' },
        { kind: 'check', q: 'Why do order-book models often predict mid-price *direction* over a short horizon rather than price?', options: ['Easier to code', 'It\'s stationary, directly tradable, and avoids the random-walk trap', 'Prices aren\'t available', 'Regression is impossible'], answer: 1, hint: 'Lesson 1.', explain: 'With a dead zone for "flat".' },
      ],
    },
    {
      id: 'vol',
      title: 'Volatility forecasting',
      blocks: [
        { kind: 'analogy', text: "Returns are close to unpredictable; volatility is not. Turbulent days cluster together, so recent volatility forecasts near-future volatility well. That makes volatility the friendliest target in finance, and a classic benchmark (HAR: daily, weekly and monthly averages of realised volatility) is very hard to beat." },
        { kind: 'code', code: `rv = ret.abs()                                         # crude daily realised-vol proxy
har = pd.DataFrame({
    "d": rv,                                           # yesterday
    "w": rv.rolling(5).mean(),                         # last week
    "m": rv.rolling(22).mean(),                        # last month
    "y": rv.shift(-1),                                 # target: tomorrow
}).dropna()

from sklearn.linear_model import LinearRegression
split = int(len(har) * 0.7)
lin = LinearRegression().fit(har.iloc[:split, :3], har["y"].iloc[:split])
lin.score(har.iloc[split:, :3], har["y"].iloc[split:])   # the HAR baseline any neural net must beat
# Here the simulated returns have constant volatility, so R² ≈ 0. On real markets,
# where volatility clusters, HAR typically explains a substantial share of next-day realised variance.` },
        { kind: 'check', q: 'Why is volatility more forecastable than returns?', options: ['It\'s always positive', 'It clusters: high-vol days tend to follow high-vol days', 'It\'s smoother by definition', 'Exchanges publish it'], answer: 1, hint: 'Turbulence clusters.', explain: 'Returns have almost no autocorrelation; |returns| have a lot.' },
      ],
    },
    {
      id: 'evaluate',
      title: 'Honest evaluation',
      blocks: [
        { kind: 'analogy', text: "Deep learning gives you a thousand knobs, and every knob turned while watching the validation score is another coin toss in the backtest-overfitting lottery (ML course module 10). The defence is boring discipline: strong simple baselines, time-ordered splits with gaps, a test period touched once, and judging by money after costs." },
        { kind: 'code', code: `def train_mlp(X_tr, y_tr, X_va, y_va, epochs=200):
    model = nn.Sequential(nn.Linear(X_tr.shape[1], 32), nn.GELU(), nn.Dropout(0.2), nn.Linear(32, 1))
    opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)
    best, state = float("inf"), None
    for _ in range(epochs):
        model.train(); opt.zero_grad()
        nn.functional.mse_loss(model(X_tr).squeeze(-1), y_tr).backward(); opt.step()
        model.eval()
        with torch.no_grad():
            v = nn.functional.mse_loss(model(X_va).squeeze(-1), y_va).item()
        if v < best: best, state = v, {k: t.clone() for k, t in model.state_dict().items()}
    model.load_state_dict(state)
    return model

mlp = train_mlp(X_tr, y_tr, X_va, y_va)
with torch.no_grad():
    mse_mlp = nn.functional.mse_loss(mlp(X_te).squeeze(-1), y_te).item()
mse_zero = (y_te ** 2).mean().item()                  # "predict zero" baseline
mse_mlp / mse_zero                                     # ≥ 1 on these random-walk prices: no edge, correctly` },
        { kind: 'list', items: [
          'Always report the **"predict zero"** and **linear** baselines alongside the network.',
          'Convert forecasts to **positions**, then measure Sharpe and drawdown **after costs**.',
          'Retrain on a **walk-forward** schedule and check stability across years, not one lucky window.',
          'Prefer the simplest model whose out-of-sample P&L is indistinguishable from the best one.',
        ] },
        { kind: 'check', q: 'Your network\'s test MSE is 0.99× the "predict zero" MSE. What next?', options: ['Deploy at full size', 'Check significance, costs and stability; a 1% improvement is easily noise', 'Add layers', 'Ignore the baseline'], answer: 1, hint: 'Small edges need strong evidence.', explain: 'Then size cautiously if it survives.' },
      ],
    },
  ],
  quiz: [
    { q: 'Why not train networks to predict price levels?', options: ['Too slow', 'Copying yesterday\'s price scores a high R² with no edge', 'Prices are discrete', 'Not allowed'], answer: 1, explain: 'Use returns or volatility.' },
    { q: 'Scaling targets by recent volatility…', options: ['Leaks the future', 'Makes targets comparable across calm and turbulent periods', 'Removes signal', 'Is unnecessary'], answer: 1, explain: 'If the vol uses past data only.' },
    { q: 'Normalisation statistics should come from…', options: ['All data', 'Training data or past windows', 'The test set', 'Random samples'], answer: 1, explain: 'No look-ahead.' },
    { q: 'DeepLOB combines…', options: ['Trees and SVMs', 'Convolutions over the order book and an LSTM over time', 'Transformers only', 'GANs'], answer: 1, explain: 'Spatial then temporal.' },
    { q: 'Which target is most forecastable?', options: ['Next-day return sign', 'Next-day volatility', 'Next-day price level change', 'Earnings surprise'], answer: 1, explain: 'Volatility clusters.' },
    { q: 'HAR uses…', options: ['Order books', 'Daily, weekly and monthly realised volatility averages', 'News', 'Prices'], answer: 1, explain: 'A strong linear baseline.' },
    { q: 'The final judge of a trading model is…', options: ['Training loss', 'Out-of-sample P&L after costs', 'R² on prices', 'Number of layers'], answer: 1, explain: 'Decisions, not curve fits.' },
    { q: 'Each hyperparameter tried on validation data…', options: ['Is free', 'Adds to multiple-testing risk', 'Improves the test score', 'Reduces variance'], answer: 1, explain: 'Count your trials.' },
  ],
}
