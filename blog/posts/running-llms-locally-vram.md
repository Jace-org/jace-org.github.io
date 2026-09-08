# Running Large Language Models Locally: What VRAM Actually Means

People ask why a 14B model runs fine on my card but a 70B one will not, and whether "70B" is supposed to mean "70GB". It does not. Here is how the numbers actually work.

## Parameters are not gigabytes

A parameter is one number the model learned during training. Model size is quoted as a count: 7B, 14B, 70B. What that count costs in memory depends on how many bytes each number takes up.

- Full precision (FP32): 4 bytes per parameter
- Half precision (FP16 or BF16): 2 bytes per parameter
- 4-bit quantized: about 0.5 bytes per parameter

So a 14B model is roughly 28GB at FP16, or about 8GB at 4-bit. Same model, very different footprint.

## Quantization

Quantization stores each weight in fewer bits. 4-bit is the common sweet spot: the model gets about four times smaller and runs faster, and for most tasks the quality drop is small enough that you have to look for it. Go much below 4-bit and it starts to show. This is the main reason a 32GB card can run a model that on paper looks far too big.

## Why 70B still does not fit

Weights are only part of the bill. You also pay for:

- The KV cache, which grows with context length. Long prompts cost real memory.
- Activations during the forward pass
- Overhead from the runtime itself

A 70B model at 4-bit is around 35 to 40GB of weights alone, before any context. That is why it will not sit on a 32GB card without splitting across devices or offloading layers to system RAM, which is much slower than the GPU.

## Rules of thumb I use

- 4-bit memory needed, in GB, is roughly the parameter count in billions divided by two, then add headroom for context
- Leave a few GB free. A model that only just fits will fall back to CPU or crash on a long prompt.
- If it does not fit, move to a smaller model before you drop below 4-bit

## What this means in practice

On a 32GB card I run mid-size models comfortably at 4-bit with a decent context window, and I can keep two smaller models resident at once. The trick is not chasing the biggest number. It is matching the model to the memory you have, and knowing where that memory actually goes.
