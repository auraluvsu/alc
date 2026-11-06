import type { Module } from '../types'

export const n09: Module = {
  n: 9,
  title: 'Training at Scale',
  tour: '13 · Computational Performance',
  summary: 'Making training fast and fitting bigger models: where the time actually goes, mixed precision, torch.compile, profiling, keeping the GPU fed with data, gradient accumulation and checkpointing, and multi-GPU training with DDP and FSDP.',
  topics: ['Where the time goes', 'Mixed precision', 'torch.compile', 'Profiling & data pipelines', 'Memory tricks', 'DDP & FSDP'],
  cpp23: ['FSDP2 (`torch.distributed.fsdp.fully_shard`) is the recommended sharded data-parallel API.', '`torch.compile` regional compilation and CUDA graphs reduce Python overhead further.'],
  lessons: [
    {
      id: 'time',
      title: 'Where the time goes',
      blocks: [
        { kind: 'analogy', text: "A GPU is a factory with thousands of workers and a narrow loading dock. Training is slow for one of three reasons: the workers have too little to do (small, many separate operations: *overhead-bound*), they're waiting at the dock for materials (*memory-bound*: moving data costs more than computing on it), or they're genuinely busy (*compute-bound*, the good kind). Each has a different cure." },
        { kind: 'list', items: [
          '**Overhead-bound**: thousands of tiny kernel launches from Python. Cure: bigger batches, `torch.compile`, CUDA graphs.',
          '**Memory-bound**: element-wise ops (activations, norms, adds) read and write every value once. Cure: fusion (`torch.compile`), lower precision.',
          '**Compute-bound**: big matrix multiplies. Cure: lower precision (bf16/fp8 on tensor cores), better hardware.',
          '**Input-bound**: the GPU waits for the DataLoader. Cure: more workers, pinned memory, pre-processed data.',
        ] },
        { kind: 'check', q: 'GPU utilisation is 30% and the profiler shows long gaps between kernels. Likely cause?', options: ['Compute-bound', 'Overhead- or input-bound: the GPU is waiting', 'Too much memory', 'Learning rate too high'], answer: 1, hint: 'Idle workers.', explain: 'Check the DataLoader and Python overhead first.' },
      ],
    },
    {
      id: 'amp',
      title: 'Mixed precision',
      blocks: [
        { kind: 'analogy', text: "Not every calculation needs full precision. bfloat16 keeps float32's range (so no overflow worries) with fewer significant digits, and modern GPUs multiply it several times faster while using half the memory. Autocast runs the heavy matrix maths in bf16 and keeps precision-sensitive operations (reductions, softmax, losses) in float32." },
        { kind: 'code', code: `import torch
from torch import nn

device = torch.accelerator.current_accelerator() if torch.accelerator.is_available() else torch.device("cpu")
model = nn.Sequential(nn.Linear(512, 2048), nn.GELU(), nn.Linear(2048, 1)).to(device)
opt = torch.optim.AdamW(model.parameters(), lr=3e-4)
x, y = torch.randn(256, 512, device=device), torch.randn(256, 1, device=device)

with torch.autocast(device_type=device.type, dtype=torch.bfloat16):
    pred = model(x)                          # linear layers run in bf16
    loss = nn.functional.mse_loss(pred.float(), y)
loss.backward(); opt.step(); opt.zero_grad()

# float16 (older GPUs) has a tiny range, so it needs loss scaling to avoid underflow:
scaler = torch.amp.GradScaler(device.type, enabled=(device.type == "cuda"))
# scaler.scale(loss).backward(); scaler.step(opt); scaler.update()` },
        { kind: 'check', q: 'Why does bf16 rarely need loss scaling, unlike fp16?', options: ['It\'s more precise', 'It has the same exponent range as float32', 'It\'s slower', 'It\'s integer'], answer: 1, hint: 'Range vs precision.', explain: 'fp16 gradients underflow without scaling.' },
      ],
    },
    {
      id: 'compile',
      title: 'torch.compile & profiling',
      blocks: [
        { kind: 'analogy', text: "Eager PyTorch is an interpreter reading your recipe line by line. `torch.compile` reads the whole recipe first, merges steps that touch the same ingredients (kernel fusion), and generates optimised code. The first run pays to compile; later runs are faster. The profiler tells you where time really goes before you guess." },
        { kind: 'code', code: `compiled = torch.compile(model)          # mode="max-autotune" tries harder; "reduce-overhead" uses CUDA graphs
out = compiled(x)                        # first call compiles (seconds), later calls are fast

from torch.profiler import profile, ProfilerActivity
acts = [ProfilerActivity.CPU] + ([ProfilerActivity.CUDA] if device.type == "cuda" else [])
with profile(activities=acts, record_shapes=True) as prof:
    for _ in range(10):
        model(x).sum().backward()
print(prof.key_averages().table(sort_by="self_cpu_time_total", row_limit=8))
# prof.export_chrome_trace("trace.json")   → open in Perfetto for a timeline` },
        { kind: 'pitfall', text: 'Data-dependent Python control flow and changing input shapes cause recompilations ("graph breaks"). Watch for them with `TORCH_LOGS=recompiles`, pad batches to a few fixed sizes, or mark dimensions as dynamic.' },
        { kind: 'check', q: 'What is kernel fusion?', options: ['Merging models', 'Combining several operations into one GPU kernel to avoid extra memory trips', 'Using two GPUs', 'Quantisation'], answer: 1, hint: 'Steps that touch the same ingredients.', explain: 'Big wins for memory-bound element-wise ops.' },
      ],
    },
    {
      id: 'memory',
      title: 'Data pipelines & memory tricks',
      blocks: [
        { kind: 'analogy', text: "When the model doesn't fit, trade time for memory. Gradient accumulation runs several small batches and adds up their gradients before one update: a big batch in instalments. Activation checkpointing throws away intermediate results during the forward pass and recomputes them during backward: re-cooking a sauce rather than keeping every pot on the stove." },
        { kind: 'code', code: `from torch.utils.data import DataLoader, TensorDataset
from torch.utils.checkpoint import checkpoint

ds = TensorDataset(torch.randn(10_000, 512), torch.randn(10_000, 1))
dl = DataLoader(ds, batch_size=64, shuffle=True, num_workers=4,
                pin_memory=(device.type == "cuda"), persistent_workers=True, prefetch_factor=4)

accum = 4                                 # effective batch = 64 × 4 = 256
for i, (xb, yb) in enumerate(dl):
    xb, yb = xb.to(device, non_blocking=True), yb.to(device, non_blocking=True)
    loss = nn.functional.mse_loss(model(xb), yb) / accum      # scale so gradients average
    loss.backward()
    if (i + 1) % accum == 0:
        opt.step(); opt.zero_grad(set_to_none=True)
    if i == 15: break

block = nn.Sequential(nn.Linear(512, 512), nn.GELU(), nn.Linear(512, 512))
h = checkpoint(block, torch.randn(8, 512, requires_grad=True), use_reentrant=False)   # recompute in backward` },
        { kind: 'check', q: 'With gradient accumulation over 4 steps, why divide the loss by 4?', options: ['Speed', 'So the summed gradients equal the average over the effective batch', 'To lower the LR permanently', 'Required by DataLoader'], answer: 1, hint: 'A big batch in instalments.', explain: 'Otherwise gradients are 4× too large.' },
      ],
    },
    {
      id: 'distributed',
      title: 'DDP & FSDP',
      blocks: [
        { kind: 'analogy', text: "Data parallelism (DDP) gives every GPU a full copy of the model and a different slice of each batch; after backward they average gradients so all copies stay identical: several chefs following the same recipe on different tables. When the model itself is too big for one GPU, FSDP shards parameters, gradients and optimiser state across GPUs and gathers each layer only when it's needed." },
        { kind: 'code', code: `# train.py — launch with:  torchrun --nproc_per_node=4 train.py
import os, torch, torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data.distributed import DistributedSampler

def main():
    dist.init_process_group("nccl")                   # "gloo" on CPU
    rank = int(os.environ["LOCAL_RANK"])
    torch.cuda.set_device(rank)
    model = DDP(build_model().cuda(rank), device_ids=[rank])
    sampler = DistributedSampler(dataset)             # each rank sees a different shard
    dl = DataLoader(dataset, batch_size=64, sampler=sampler)
    for epoch in range(epochs):
        sampler.set_epoch(epoch)                      # reshuffle differently each epoch
        for xb, yb in dl:
            ...                                       # normal loop; DDP all-reduces gradients in backward
    dist.destroy_process_group()

# FSDP2 for models that don't fit on one GPU:
# from torch.distributed.fsdp import fully_shard
# for block in model.blocks: fully_shard(block)
# fully_shard(model)` },
        { kind: 'check', q: 'What does DDP synchronise between GPUs each step?', options: ['Inputs', 'Gradients (averaged with all-reduce)', 'Losses only', 'Nothing'], answer: 1, hint: 'Keep all copies identical.', explain: 'FSDP additionally shards parameters and optimiser state.' },
      ],
    },
  ],
  quiz: [
    { q: 'Element-wise operations like GELU are usually…', options: ['Compute-bound', 'Memory-bound', 'Overhead-free', 'Input-bound'], answer: 1, explain: 'Fusion helps.' },
    { q: 'bf16 vs fp16: bf16 has…', options: ['More precision', 'float32\'s exponent range', 'No speed benefit', 'Integer values'], answer: 1, explain: 'Rarely needs loss scaling.' },
    { q: 'Autocast keeps which ops in float32?', options: ['Matrix multiplies', 'Precision-sensitive ones like reductions and losses', 'All ops', 'None'], answer: 1, explain: 'Matmuls run in low precision.' },
    { q: 'torch.compile\'s first call…', options: ['Is fastest', 'Pays a compilation cost', 'Skips backward', 'Uses CPU only'], answer: 1, explain: 'Later calls are faster.' },
    { q: 'Gradient accumulation emulates…', options: ['Smaller models', 'A larger batch with less memory', 'Faster GPUs', 'Dropout'], answer: 1, explain: 'Step every k batches.' },
    { q: 'Activation checkpointing trades…', options: ['Accuracy for speed', 'Compute for memory', 'Memory for accuracy', 'Nothing'], answer: 1, explain: 'Recompute in backward.' },
    { q: 'DistributedSampler ensures…', options: ['Identical batches on all GPUs', 'Each process sees a different shard of data', 'Sorted data', 'No shuffling'], answer: 1, explain: 'Call set_epoch each epoch.' },
    { q: 'FSDP shards…', options: ['Only data', 'Parameters, gradients and optimiser state', 'Only the loss', 'Nothing'], answer: 1, explain: 'For models too big for one GPU.' },
  ],
}
