import type { Module } from '../types'

export const n06: Module = {
  n: 6,
  title: 'Attention & Transformers',
  tour: '11 · Attention Mechanisms and Transformers',
  summary: 'Attention as a soft, learned lookup: queries, keys and values, scaled dot-product and multi-head attention, positional information, causal masking, and the transformer block that underlies modern language and sequence models.',
  topics: ['Attention as soft lookup', 'Scaled dot-product attention', 'Multi-head attention', 'Positions & masking', 'The transformer block'],
  cpp23: ['`F.scaled_dot_product_attention` dispatches to fused FlashAttention-style kernels.', 'Rotary position embeddings (RoPE) are now the usual choice in LLMs.'],
  lessons: [
    {
      id: 'lookup',
      title: 'Attention as a soft lookup',
      blocks: [
        { kind: 'analogy', text: "A Python dict lookup is hard: one key matches exactly and you get its value. Attention is a soft lookup: your query is compared with *every* key, each comparison becomes a weight, and you get a weighted blend of all the values. \"How much is today like each past day, and what happened after the similar ones?\"" },
        { kind: 'code', code: `import torch, math
import torch.nn.functional as F

keys   = torch.tensor([[1.0, 0.0], [0.0, 1.0], [0.7, 0.7]])   # three stored items
values = torch.tensor([[10.0], [20.0], [30.0]])
query  = torch.tensor([[1.0, 0.1]])                            # most similar to key 0

scores = query @ keys.T                     # similarity with each key
weights = scores.softmax(dim=-1)            # sums to 1
weights                                     # [0.45, 0.18, 0.36]: key 0 most, key 1 least
weights @ values                            # ≈ 19.1: a blend of all three values, not a single pick` },
        { kind: 'check', q: 'What does attention return?', options: ['The single best-matching value', 'A weighted average of all values, weighted by query–key similarity', 'The keys', 'A class label'], answer: 1, hint: 'Soft, not hard, lookup.', explain: 'Weights come from a softmax over similarities.' },
      ],
    },
    {
      id: 'sdpa',
      title: 'Scaled dot-product attention',
      blocks: [
        { kind: 'analogy', text: "In self-attention, every position in a sequence produces its own query, key and value by multiplying its embedding by three learned matrices. Each position then looks up every other position. Dividing scores by √d keeps the softmax from becoming a hard max when vectors are long, which would starve the gradients." },
        { kind: 'code', code: `def attention(Q, K, V, mask=None):
    d = Q.shape[-1]
    scores = Q @ K.transpose(-2, -1) / math.sqrt(d)      # (…, T_q, T_k)
    if mask is not None:
        scores = scores.masked_fill(~mask, float("-inf"))
    return scores.softmax(dim=-1) @ V

B, T, d = 2, 5, 16
x = torch.randn(B, T, d)
Wq, Wk, Wv = (torch.randn(d, d) / math.sqrt(d) for _ in range(3))
out = attention(x @ Wq, x @ Wk, x @ Wv)
out.shape                                                  # torch.Size([2, 5, 16])

ref = F.scaled_dot_product_attention(x @ Wq, x @ Wk, x @ Wv)   # fused, memory-efficient kernel
torch.allclose(out, ref, atol=1e-5)                            # True` },
        { kind: 'p', text: 'Attention compares every position with every other, so cost grows with the **square** of sequence length: 10× more context means about 100× more attention work. FlashAttention-style kernels (used by `scaled_dot_product_attention`) avoid storing the full T×T matrix, which makes long contexts practical but doesn\'t change the quadratic compute.' },
        { kind: 'check', q: 'Why divide the scores by √d?', options: ['Speed', 'Large dot products saturate the softmax, making gradients tiny', 'To normalise values', 'Tradition only'], answer: 1, hint: 'Hard max vs soft max.', explain: 'Keeps score variance around 1.' },
      ],
    },
    {
      id: 'multihead',
      title: 'Multi-head attention',
      blocks: [
        { kind: 'analogy', text: "One attention head can only ask one kind of question at a time. Multi-head attention runs several smaller heads in parallel, each with its own Q, K and V projections: one might track recent volatility, another the same weekday last week, another the level relative to a moving average. Their answers are concatenated and mixed." },
        { kind: 'code', code: `from torch import nn

mha = nn.MultiheadAttention(embed_dim=64, num_heads=8, batch_first=True)   # 8 heads × 8 dims each
x = torch.randn(4, 30, 64)                                                  # (batch, time, features)
out, weights = mha(x, x, x)                                                 # self-attention
out.shape, weights.shape          # (torch.Size([4, 30, 64]), torch.Size([4, 30, 30]))
weights[0].sum(-1)[:3]            # each row sums to 1 (weights averaged over heads)` },
        { kind: 'check', q: 'With embed_dim=64 and 8 heads, how wide is each head?', options: ['64', '8', '512', '1'], answer: 1, hint: 'The model width is split across heads.', explain: 'Total compute is similar to one 64-wide head.' },
      ],
    },
    {
      id: 'positions',
      title: 'Positions & causal masking',
      blocks: [
        { kind: 'analogy', text: "Attention by itself treats the sequence as a bag: shuffle the inputs and each output is just shuffled the same way. To know that Monday came before Tuesday, positions must be injected, by adding a position signal to each embedding or rotating queries and keys by position (RoPE). For forecasting and text generation, a causal mask also blindfolds each position to everything after it." },
        { kind: 'code', code: `T = 6
causal = torch.tril(torch.ones(T, T, dtype=torch.bool))   # position t may see 0..t only
causal.int()
# [[1,0,0,0,0,0],
#  [1,1,0,0,0,0], ...]

q = k = v = torch.randn(1, T, 16)
out_causal = F.scaled_dot_product_attention(q, k, v, is_causal=True)
v2 = v.clone(); v2[:, 4:] = 0                                   # change the future
torch.allclose(out_causal[:, :4], F.scaled_dot_product_attention(q, k, v2, is_causal=True)[:, :4])  # True

def sinusoidal(T, d):
    pos = torch.arange(T)[:, None]; i = torch.arange(0, d, 2)
    pe = torch.zeros(T, d)
    pe[:, 0::2] = torch.sin(pos / 10000 ** (i / d)); pe[:, 1::2] = torch.cos(pos / 10000 ** (i / d))
    return pe
x_with_pos = torch.randn(1, T, 16) + sinusoidal(T, 16)` },
        { kind: 'check', q: 'What does a causal mask prevent?', options: ['Overfitting', 'Positions attending to later positions', 'Long sequences', 'Multiple heads'], answer: 1, hint: 'Blindfold to the future.', explain: 'Essential for forecasting and generation.' },
      ],
    },
    {
      id: 'block',
      title: 'The transformer block',
      blocks: [
        { kind: 'analogy', text: "A transformer block has two rooms: an attention room where each position gathers information from the others, and a feed-forward room where each position thinks about what it gathered on its own. Both rooms have a residual bypass and normalisation at the door. Stack a dozen blocks and you have a transformer." },
        { kind: 'code', code: `class Block(nn.Module):
    def __init__(self, d=64, heads=4, mlp=4, dropout=0.1):
        super().__init__()
        self.ln1, self.ln2 = nn.LayerNorm(d), nn.LayerNorm(d)
        self.attn = nn.MultiheadAttention(d, heads, dropout=dropout, batch_first=True)
        self.ff = nn.Sequential(nn.Linear(d, mlp * d), nn.GELU(), nn.Linear(mlp * d, d), nn.Dropout(dropout))
    def forward(self, x, causal=True):
        T = x.shape[1]
        mask = torch.triu(torch.ones(T, T, dtype=torch.bool), 1) if causal else None   # True = blocked
        h = self.ln1(x)
        x = x + self.attn(h, h, h, attn_mask=mask, need_weights=False)[0]     # pre-norm + residual
        return x + self.ff(self.ln2(x))

class TinyTransformer(nn.Module):
    def __init__(self, n_in=5, d=64, depth=4, max_len=256):
        super().__init__()
        self.inp = nn.Linear(n_in, d)
        self.pos = nn.Parameter(torch.zeros(1, max_len, d))   # learned positions
        self.blocks = nn.ModuleList(Block(d) for _ in range(depth))
        self.head = nn.Linear(d, 1)
    def forward(self, x):
        h = self.inp(x) + self.pos[:, : x.shape[1]]
        for b in self.blocks: h = b(h)
        return self.head(h).squeeze(-1)        # a prediction at every time step

TinyTransformer()(torch.randn(8, 60, 5)).shape     # torch.Size([8, 60])

# Built in: nn.TransformerEncoderLayer(d_model=64, nhead=4, batch_first=True, norm_first=True)` },
        { kind: 'pitfall', text: '`nn.MultiheadAttention`\'s boolean `attn_mask` uses **True = not allowed**, the opposite of `scaled_dot_product_attention`\'s boolean mask (True = allowed). Mixing them up silently lets every position see the future. Prefer `is_causal=True`, and test with a "change the future" check as above.' },
        { kind: 'check', q: 'Which two sub-layers make up a transformer block?', options: ['Conv and pooling', 'Self-attention and a position-wise feed-forward MLP', 'LSTM and attention', 'Two attention layers only'], answer: 1, hint: 'Two rooms.', explain: 'Each wrapped in a residual connection with normalisation.' },
      ],
    },
  ],
  quiz: [
    { q: 'Attention weights come from…', options: ['Random init', 'A softmax over query–key similarities', 'Labels', 'Positions only'], answer: 1, explain: 'Then blend values.' },
    { q: 'In self-attention, Q, K and V come from…', options: ['Different datasets', 'The same sequence, via three learned projections', 'Labels', 'Fixed tables'], answer: 1, explain: 'x @ Wq, x @ Wk, x @ Wv.' },
    { q: 'Attention cost grows with sequence length…', options: ['Linearly', 'Quadratically', 'Logarithmically', 'Not at all'], answer: 1, explain: 'T × T comparisons.' },
    { q: 'Multi-head attention…', options: ['Uses one big head', 'Runs several smaller heads in parallel and concatenates them', 'Needs RNNs', 'Removes softmax'], answer: 1, explain: 'Different relationships per head.' },
    { q: 'Without positional information, attention is…', options: ['Causal', 'Order-agnostic (permutation-equivariant)', 'Recurrent', 'Convolutional'], answer: 1, explain: 'Add positions.' },
    { q: 'A causal mask lets position t attend to…', options: ['All positions', 'Positions 0..t only', 'Positions after t', 'Itself only'], answer: 1, explain: 'No peeking ahead.' },
    { q: 'In nn.MultiheadAttention a True in a boolean attn_mask means…', options: ['Allowed', 'Not allowed', 'Ignored', 'Doubled'], answer: 1, explain: 'Opposite of SDPA\'s convention.' },
    { q: 'Pre-norm transformers apply LayerNorm…', options: ['After the residual add', 'Before each sub-layer, inside the residual branch', 'Only at the end', 'Never'], answer: 1, explain: 'More stable for deep stacks.' },
  ],
}
