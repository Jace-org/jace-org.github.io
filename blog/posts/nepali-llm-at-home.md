# Training a Nepali language model at home

I have been building a language model for Nepali on my own hardware. No cloud, no rented GPUs. Just one machine in my homelab with an AMD AI Pro 32GB card. Here are the notes so far.

## Why do this at home

Two reasons. First, cost. Renting a big GPU by the hour adds up fast when you are experimenting and most runs are throwaway. Second, control. The data stays on my machine, and I can stop and restart whenever I want without watching a meter.

## The hardware

- One AMD AI Pro GPU with 32GB of memory
- A normal desktop board and CPU around it
- Plenty of fast local storage for datasets and checkpoints

32GB is enough to fine tune models in the small to mid size range if you are careful with batch size and use memory saving tricks. It is not enough to train a large model from scratch, and that is fine. The goal is a useful Nepali model, not a record.

## Working with an AMD card

Most tutorials assume an Nvidia card. Getting the AMD stack working took some patience: the right driver, the right runtime, and library versions that agree with each other. Once it was set up it has been stable. The lesson was to pin every version and write the setup down so I can rebuild it.

## Data

Good Nepali text is the hard part. I pulled together news text, public articles and other open sources, then spent real time cleaning it: fixing encoding, removing near duplicates, and dropping machine translated junk that would teach the model bad habits.

## Where it is now

The model can hold a basic conversation in Nepali and handle simple tasks. It still makes mistakes with less common words and long questions. Next steps are a bigger and cleaner dataset, and a proper set of test prompts so I can measure changes instead of guessing.
