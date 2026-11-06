import type { Module } from '../types'

export const n07: Module = {
  n: 7,
  title: 'Pretraining, Fine-tuning & LLMs',
  tour: '15–16 · NLP: Pretraining · Applications',
  summary: 'Why pretrain on huge unlabelled data and then adapt: embeddings, encoder (BERT-style) vs decoder (GPT-style) objectives, full fine-tuning vs parameter-efficient LoRA, and turning financial text into features without fooling yourself.',
  topics: ['Embeddings', 'Pretraining objectives', 'Transfer learning', 'Fine-tuning & LoRA', 'Text as a signal'],
  cpp23: ['Hugging Face `transformers`, `peft` (LoRA) and `datasets` are the standard toolkit; `torch.compile` and bf16 make fine-tuning on one GPU practical.'],
  lessons: [
    {
      id: 'embeddings',
      title: 'Embeddings',
      blocks: [
        { kind: 'analogy', text: "An embedding places each token (a word, a ticker, a sector) at a point in space, learned so that things used in similar ways end up near each other. It's a lookup table of learned vectors: row 17 is the vector for token 17. Distances and directions in that space then carry meaning." },
        { kind: 'code', code: `import torch
from torch import nn
import torch.nn.functional as F

emb = nn.Embedding(num_embeddings=5000, embedding_dim=32)   # 5,000 tickers → 32-d vectors
ids = torch.tensor([17, 42, 17])
emb(ids).shape                       # torch.Size([3, 32]): rows of the table
torch.equal(emb(ids)[0], emb.weight[17])   # True: it's just indexing

def cosine(a, b): return F.cosine_similarity(a, b, dim=-1)
# After training (e.g. on co-movement or co-occurrence), similar assets sit close together:
# cosine(emb(XOM), emb(CVX)) > cosine(emb(XOM), emb(AAPL))` },
        { kind: 'check', q: 'An nn.Embedding layer is mathematically equivalent to…', options: ['A convolution', 'Indexing rows of a learned matrix (one-hot × weight)', 'Attention', 'A softmax'], answer: 1, hint: 'A lookup table.', explain: 'Rows are trained like any other weight.' },
      ],
    },
    {
      id: 'pretrain',
      title: 'Pretraining objectives',
      blocks: [
        { kind: 'analogy', text: "Labelled data is scarce; raw text is nearly free. Pretraining invents a task the text labels for itself. BERT-style encoders play fill-in-the-blank: mask 15% of words and guess them from both sides, which makes them good readers and classifiers. GPT-style decoders play next-word prediction, which makes them good writers. Either way, the model absorbs grammar, facts and some reasoning along the way." },
        { kind: 'code', code: `# Next-token prediction (decoder / GPT-style), the loss in one line:
vocab, T, B = 1000, 8, 2
tokens = torch.randint(0, vocab, (B, T + 1))
inputs, targets = tokens[:, :-1], tokens[:, 1:]          # predict token t+1 from tokens ≤ t
logits = torch.randn(B, T, vocab)                        # stand-in for model(inputs) with a causal mask
loss = F.cross_entropy(logits.reshape(-1, vocab), targets.reshape(-1))

# Masked-token prediction (encoder / BERT-style):
mask = torch.rand(B, T) < 0.15
corrupted = inputs.masked_fill(mask, 0)                  # 0 = [MASK] token id
# loss only on masked positions: F.cross_entropy(logits[mask], inputs[mask])` },
        { kind: 'check', q: 'Which objective trains GPT-style models?', options: ['Masked-token prediction', 'Next-token prediction with a causal mask', 'Classification', 'Contrastive images'], answer: 1, hint: 'They write left to right.', explain: 'BERT uses masked-token prediction.' },
      ],
    },
    {
      id: 'transfer',
      title: 'Transfer learning',
      blocks: [
        { kind: 'analogy', text: "A pretrained model is an experienced hire. Instead of teaching someone to read from scratch, you hand a fluent reader your domain's documents and a little feedback. Three levels of effort: use its features as-is (feature extraction), retrain only the final layer (linear probe), or adjust everything gently (full fine-tuning)." },
        { kind: 'code', code: `# Typical Hugging Face workflow (needs: pip install transformers)
# from transformers import AutoTokenizer, AutoModel, AutoModelForSequenceClassification
# tok = AutoTokenizer.from_pretrained("ProsusAI/finbert")
# enc = AutoModel.from_pretrained("ProsusAI/finbert")
# batch = tok(["Gold rallies as yields fall", "Miner cuts guidance"], padding=True, return_tensors="pt")
# with torch.no_grad():
#     feats = enc(**batch).last_hidden_state[:, 0]       # [CLS] vector per headline → features

# Linear probe in plain PyTorch: freeze the body, train only a head
class Probe(nn.Module):
    def __init__(self, body: nn.Module, d: int, n_classes: int):
        super().__init__()
        self.body = body.requires_grad_(False)          # frozen
        self.head = nn.Linear(d, n_classes)
    def forward(self, x):
        with torch.no_grad():
            h = self.body(x)
        return self.head(h)` },
        { kind: 'check', q: 'You have 2,000 labelled headlines. The safest starting point is…', options: ['Train a transformer from scratch', 'Use a pretrained model\'s features with a small classifier (or a light fine-tune)', 'Use a CNN on characters', 'Skip validation'], answer: 1, hint: 'Hire the experienced reader.', explain: 'From-scratch training needs vastly more data.' },
      ],
    },
    {
      id: 'lora',
      title: 'Fine-tuning & LoRA',
      blocks: [
        { kind: 'analogy', text: "Full fine-tuning repaints the whole house: every weight changes and you need memory for all their gradients and optimiser states. LoRA leaves the house as it is and adds thin removable panels: for each big weight matrix W it learns a low-rank update B·A with only a few thousand parameters. Train the panels, keep the house, and swap panels per task." },
        { kind: 'code', code: `class LoRALinear(nn.Module):
    """y = W x + (alpha/r) · B A x, with W frozen and only A, B trained."""
    def __init__(self, base: nn.Linear, r: int = 8, alpha: int = 16):
        super().__init__()
        self.base = base.requires_grad_(False)
        self.A = nn.Parameter(torch.randn(r, base.in_features) * 0.01)
        self.B = nn.Parameter(torch.zeros(base.out_features, r))       # zero → starts identical to base
        self.scale = alpha / r
    def forward(self, x):
        return self.base(x) + (x @ self.A.T @ self.B.T) * self.scale

base = nn.Linear(4096, 4096)
lora = LoRALinear(base, r=8)
full = sum(p.numel() for p in base.parameters())
trainable = sum(p.numel() for p in lora.parameters() if p.requires_grad)
full, trainable, trainable / full          # 16.8M vs 65.5k: ≈ 0.4% of the parameters
# In practice: peft.LoraConfig(r=8, lora_alpha=16, target_modules=["q_proj", "v_proj"])` },
        { kind: 'check', q: 'Why is B initialised to zero in LoRA?', options: ['Speed', 'So the adapted model starts exactly equal to the pretrained one', 'To prevent training', 'For sparsity'], answer: 1, hint: 'B·A = 0 at the start.', explain: 'Training then moves away from the base gently.' },
      ],
    },
    {
      id: 'text',
      title: 'Text as a trading signal',
      blocks: [
        { kind: 'analogy', text: "News, filings and earnings calls are a huge source of information, and of leakage. The question isn't \"is this headline positive?\" but \"could I have known this, at this time, and did prices already reflect it?\". Timestamps, model knowledge cut-offs and look-ahead in the language model itself all matter." },
        { kind: 'list', items: [
          '**Timestamp everything** to the second, in UTC, and only use text published before the decision time. Many "news" datasets are stamped with dates, not times.',
          '**LLM look-ahead**: a model pretrained on 2026 text "knows" how 2022 turned out. Backtesting with it on 2022 headlines leaks the future. Use models whose training cut-off precedes the test period, or treat results with heavy suspicion.',
          '**Sentiment ≠ surprise**: "record profits" is useless if the market expected more. Combine text signals with expectations (analyst consensus, implied moves).',
          '**Cheap first**: embeddings plus a linear model or gradient boosting usually beat elaborate fine-tuning on small labelled sets, and are far easier to validate.',
        ] },
        { kind: 'check', q: 'Why is backtesting with a recent LLM on old headlines risky?', options: ['Tokenisation changed', 'The model\'s pretraining data may include what happened next', 'It\'s slow', 'Old text is shorter'], answer: 1, hint: 'What did the model read during pretraining?', explain: 'Knowledge cut-off must precede the test period.' },
      ],
    },
  ],
  quiz: [
    { q: 'nn.Embedding maps…', options: ['Floats to ints', 'Integer IDs to learned vectors', 'Images to text', 'Vectors to labels'], answer: 1, explain: 'A lookup table.' },
    { q: 'BERT-style pretraining uses…', options: ['Next-token prediction', 'Masked-token prediction', 'Reinforcement learning', 'Clustering'], answer: 1, explain: 'Bidirectional context.' },
    { q: 'GPT-style models are…', options: ['Encoders', 'Causal decoders', 'CNNs', 'RNNs'], answer: 1, explain: 'Left-to-right generation.' },
    { q: 'A linear probe trains…', options: ['All weights', 'Only a new output layer on frozen features', 'Embeddings only', 'Nothing'], answer: 1, explain: 'Cheapest adaptation.' },
    { q: 'LoRA trains…', options: ['The full weight matrices', 'Small low-rank update matrices', 'Biases only', 'LayerNorm only'], answer: 1, explain: 'Base weights stay frozen.' },
    { q: 'LoRA\'s main benefit is…', options: ['Higher accuracy always', 'Far fewer trainable parameters and less memory', 'No data needed', 'Faster inference only'], answer: 1, explain: 'Swappable adapters per task.' },
    { q: 'A key leakage risk with LLMs in backtests is…', options: ['Tokenisers', 'Pretraining data from after the test period', 'GPU memory', 'Batch size'], answer: 1, explain: 'Check the knowledge cut-off.' },
    { q: 'Sentiment alone often fails because…', options: ['Text is noisy', 'Prices react to surprise relative to expectations', 'Models are small', 'News is rare'], answer: 1, explain: 'Combine with expectations.' },
  ],
}
