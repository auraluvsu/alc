import type { Module } from '../types'

export const n04: Module = {
  n: 4,
  title: 'Convolutional Neural Networks',
  tour: '7–8 · CNNs · Modern CNNs',
  summary: 'Convolutions as sliding pattern detectors, padding, stride and pooling, the path from LeNet to ResNet, and 1-D convolutions for time series and order-book data.',
  topics: ['Convolutions', 'Padding, stride & pooling', 'LeNet to ResNet', '1-D convolutions for sequences'],
  cpp23: ['`torch.compile` and channels-last memory format (`x.to(memory_format=torch.channels_last)`) give large CNN speed-ups on modern GPUs.'],
  lessons: [
    {
      id: 'conv',
      title: 'Convolutions',
      blocks: [
        { kind: 'analogy', text: "A convolution is a small stencil slid across an image. At each position it multiplies the stencil by the pixels underneath and adds them up: a high score means \"the pattern I'm looking for is here\". The same stencil is used everywhere, so a cat's ear is recognised in any corner, and it needs only a handful of weights instead of one per pixel." },
        { kind: 'code', code: `import torch
from torch import nn
import torch.nn.functional as F

img = torch.zeros(1, 1, 6, 6); img[..., :, 3:] = 1.0     # left half dark, right half bright
edge = torch.tensor([[[[-1.0, 1.0]]]])                     # a 1×2 "vertical edge" stencil
F.conv2d(img, edge)[0, 0]                                  # 1s only in the column where dark meets bright

conv = nn.Conv2d(in_channels=3, out_channels=16, kernel_size=3)   # 16 learned stencils over RGB
conv.weight.shape                                          # torch.Size([16, 3, 3, 3]): 432 weights + 16 biases
conv(torch.randn(8, 3, 32, 32)).shape                      # torch.Size([8, 16, 30, 30])

nn.Linear(3 * 32 * 32, 16 * 30 * 30).weight.numel()        # ≈ 44 million for a dense equivalent` },
        { kind: 'check', q: 'Why does a convolution need far fewer parameters than a dense layer?', options: ['It uses smaller floats', 'The same small kernel is shared across all positions', 'It skips pixels', 'It has no bias'], answer: 1, hint: 'One stencil, slid everywhere.', explain: 'Weight sharing plus local connectivity.' },
      ],
    },
    {
      id: 'padding',
      title: 'Padding, stride & pooling',
      blocks: [
        { kind: 'analogy', text: "Padding adds a border so the stencil can sit over the edges and the output keeps its size. Stride makes the stencil jump several pixels at a time, shrinking the output. Pooling summarises each small patch by its maximum or average, like reading the headline instead of every word: the network keeps \"there's an edge around here\" and drops the exact pixel." },
        { kind: 'code', code: `x = torch.randn(1, 3, 32, 32)
nn.Conv2d(3, 8, 3, padding=1)(x).shape             # [1, 8, 32, 32]: "same" size
nn.Conv2d(3, 8, 3, padding="same")(x).shape        # same thing, explicit
nn.Conv2d(3, 8, 3, stride=2, padding=1)(x).shape   # [1, 8, 16, 16]: halved
nn.MaxPool2d(2)(x).shape                           # [1, 3, 16, 16]
nn.AdaptiveAvgPool2d(1)(x).shape                   # [1, 3, 1, 1]: global average per channel

# Output size: floor((n + 2·padding − kernel) / stride) + 1` },
        { kind: 'check', q: 'Input 32×32, kernel 5, padding 0, stride 1. Output size?', options: ['32', '30', '28', '27'], answer: 2, hint: '(32 − 5)/1 + 1.', explain: 'Use padding=2 to keep 32.' },
      ],
    },
    {
      id: 'arch',
      title: 'LeNet to ResNet',
      blocks: [
        { kind: 'analogy', text: "CNN history is a story of going deeper without the signal dying. LeNet (1998) read postcodes with two conv layers. AlexNet (2012) scaled up on GPUs. VGG stacked small 3×3 blocks. ResNet (2015) added the residual bypass from module 3 and reached 152 layers. Each stage of a modern CNN halves the spatial size and doubles the channels: less *where*, more *what*." },
        { kind: 'code', code: `class ResBlock(nn.Module):
    def __init__(self, c_in, c_out, stride=1):
        super().__init__()
        self.body = nn.Sequential(
            nn.Conv2d(c_in, c_out, 3, stride, 1, bias=False), nn.BatchNorm2d(c_out), nn.ReLU(),
            nn.Conv2d(c_out, c_out, 3, 1, 1, bias=False), nn.BatchNorm2d(c_out))
        self.skip = (nn.Identity() if stride == 1 and c_in == c_out else
                     nn.Sequential(nn.Conv2d(c_in, c_out, 1, stride, bias=False), nn.BatchNorm2d(c_out)))
    def forward(self, x):
        return torch.relu(self.body(x) + self.skip(x))

tiny_resnet = nn.Sequential(
    nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(),
    ResBlock(32, 32), ResBlock(32, 64, stride=2), ResBlock(64, 128, stride=2),
    nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(128, 10))
tiny_resnet(torch.randn(4, 3, 32, 32)).shape      # torch.Size([4, 10])

# In practice: torchvision.models.resnet18(weights="DEFAULT") and fine-tune (module 7)` },
        { kind: 'check', q: 'Why does the skip path sometimes need a 1×1 convolution?', options: ['Speed', 'To match shape when stride or channel count changes', 'For non-linearity', 'To add parameters'], answer: 1, hint: 'You can only add tensors of the same shape.', explain: 'Otherwise it\'s the identity.' },
      ],
    },
    {
      id: 'conv1d',
      title: '1-D convolutions for sequences',
      blocks: [
        { kind: 'analogy', text: "Slide the stencil along time instead of across an image and you get a pattern detector for sequences: \"three rising bars then a volume spike\". Stacking 1-D convolutions with increasing *dilation* (gaps in the stencil) lets the network see far back in time cheaply. That's a temporal convolutional network (TCN), a strong, fast alternative to RNNs." },
        { kind: 'code', code: `class CausalConv1d(nn.Conv1d):
    """Pads only on the left so output at time t never sees inputs after t."""
    def __init__(self, c_in, c_out, k, dilation=1):
        super().__init__(c_in, c_out, k, dilation=dilation)
        self.left = (k - 1) * dilation
    def forward(self, x):
        return super().forward(F.pad(x, (self.left, 0)))

tcn = nn.Sequential(
    CausalConv1d(5, 32, 3, dilation=1), nn.ReLU(),     # 5 inputs: OHLC returns + volume
    CausalConv1d(32, 32, 3, dilation=2), nn.ReLU(),
    CausalConv1d(32, 32, 3, dilation=4), nn.ReLU(),
    CausalConv1d(32, 1, 1))
x = torch.randn(16, 5, 100)                            # (batch, channels, time)
tcn(x).shape                                           # torch.Size([16, 1, 100]): one output per step
# receptive field = 1 + (3-1)·(1+2+4) = 15 time steps

x2 = x.clone(); x2[..., 60:] = 0                       # change the FUTURE (t ≥ 60)…
torch.allclose(tcn(x)[..., :60], tcn(x2)[..., :60])    # …outputs before t=60 are unchanged: True` },
        { kind: 'pitfall', text: '`nn.Conv1d(..., padding="same")` pads on both sides, so the output at time t sees inputs from t+1 onwards: look-ahead built into the architecture. For forecasting, always use causal (left-only) padding, and test it as above.' },
        { kind: 'check', q: 'What makes a convolution "causal"?', options: ['Dilation', 'Padding only on the left, so outputs never see future inputs', 'Stride 1', 'A ReLU'], answer: 1, hint: 'Time flows one way.', explain: 'Test it by perturbing future inputs.' },
      ],
    },
  ],
  quiz: [
    { q: 'A convolution kernel is…', options: ['Applied once', 'Slid across the input with shared weights', 'A dense layer', 'A pooling op'], answer: 1, explain: 'Weight sharing.' },
    { q: 'padding=1 with a 3×3 kernel, stride 1…', options: ['Shrinks by 2', 'Keeps spatial size', 'Doubles size', 'Halves size'], answer: 1, explain: '"Same" padding.' },
    { q: 'Stride 2 roughly…', options: ['Doubles size', 'Halves spatial size', 'Keeps size', 'Removes channels'], answer: 1, explain: 'Downsampling.' },
    { q: 'Max pooling keeps…', options: ['The average', 'The largest value in each window', 'All values', 'The first value'], answer: 1, explain: 'Local invariance.' },
    { q: 'Modern CNN stages typically…', options: ['Keep size and channels', 'Halve spatial size and double channels', 'Double size', 'Remove channels'], answer: 1, explain: 'Less where, more what.' },
    { q: 'ResNet\'s key idea is…', options: ['Bigger kernels', 'Residual (skip) connections', 'No BatchNorm', 'Recurrent layers'], answer: 1, explain: 'Trainable very deep nets.' },
    { q: 'Dilated 1-D convolutions…', options: ['Increase the receptive field cheaply', 'Use future data', 'Reduce channels', 'Remove padding'], answer: 0, explain: 'Gaps in the kernel.' },
    { q: 'padding="same" in Conv1d for forecasting…', options: ['Is safe', 'Leaks future inputs into each output', 'Is required', 'Removes bias'], answer: 1, explain: 'Use causal padding.' },
  ],
}
