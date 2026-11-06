import type { LangId } from '../../course'

// "Coming from another language" notes for the Deep Learning course.
export const DL_BRIDGES: Record<number, Partial<Record<LangId, string>>> = {
  1: {
    cpp: 'LibTorch exposes this same API in C++: `torch::nn::Linear`, `torch::optim::SGD`, autograd included. PyTorch itself is a C++ core (ATen) with Python on top.',
    ts: 'TensorFlow.js offers the same building blocks (dense layers, SGD, softmax) in the browser, but research and training happen in PyTorch.',
    go: 'Gorgonia implements tensors and autodiff in Go, but production Go systems usually call exported models through ONNX Runtime.',
    java: 'DJL (Deep Java Library) can train and run PyTorch models from Java.',
  },
  2: {
    cpp: 'An MLP forward pass is a few GEMMs and element-wise ops, easy to hand-write with Eigen for tiny latency-critical models, which some HFT shops do.',
    ts: 'The same MLP in TensorFlow.js is `tf.sequential` with dense layers.',
    go: 'A small exported MLP can be evaluated in pure Go with a few matrix multiplies.',
    java: 'DJL and Deeplearning4j both build MLPs with a similar layer API.',
  },
  3: { cpp: 'Custom layers in LibTorch use `torch::nn::Module` with `register_parameter`, mirroring Python.', ts: 'Like composing classes; TF.js has custom layers too.', go: 'Not applicable beyond Gorgonia.', java: 'DJL supports custom blocks.' },
  4: { cpp: 'cuDNN, the convolution engine underneath, is a C++/CUDA library.', ts: 'TF.js runs CNNs in the browser via WebGL/WebGPU.', go: 'Inference via ONNX Runtime.', java: 'DJL runs CNNs on the JVM.' },
  5: { cpp: 'An RNN step is a small loop of matrix-vector products: easy to run step by step in C++ for streaming data.', ts: 'TF.js has LSTM and GRU layers.', go: 'Streaming inference via ONNX Runtime.', java: 'DJL and DL4J have recurrent layers.' },
  6: { cpp: 'Fused attention kernels (FlashAttention) are CUDA C++; this is where much modern performance work happens.', ts: 'transformers.js runs transformer models in JS.', go: 'Usually served via an inference server.', java: 'DJL can serve Hugging Face transformers.' },
  7: { cpp: 'llama.cpp is a C++ inference engine for LLMs, a good example of hand-optimised deployment.', ts: 'transformers.js and WebLLM run small models in the browser.', go: 'Ollama (written in Go) serves LLMs locally.', java: 'LangChain4j and DJL cover LLM use from Java.' },
  8: { cpp: 'Generative models are almost always trained in Python; sampling can be deployed to C++.', ts: 'Inference only, via ONNX or TF.js.', go: 'Inference only.', java: 'Inference only.' },
  9: { cpp: 'NCCL (C++) does the collective communication behind DDP and FSDP.', ts: 'Not applicable.', go: 'Not applicable.', java: 'Not applicable.' },
  10: { cpp: 'Latency-critical feature computation for these models usually lives in C++ next to the market-data feed.', ts: 'Not applicable.', go: 'Go is common for the surrounding data services.', java: 'Java is common in the surrounding trading infrastructure.' },
  11: { cpp: 'This module is C++ on purpose: AOTInductor packages, ONNX Runtime\'s C++ API and LibTorch, with latency measurement.', ts: 'onnxruntime-web/node load the same exported files.', go: 'onnxruntime via cgo, or a gRPC model server.', java: 'ONNX Runtime Java or DJL.' },
  12: { cpp: 'Market simulators for RL training are often written in C++ for speed and exposed to Python with pybind11.', ts: 'Not applicable.', go: 'Simulators can be written in Go and called over RPC.', java: 'Simulators in Java can be bridged similarly.' },
}
