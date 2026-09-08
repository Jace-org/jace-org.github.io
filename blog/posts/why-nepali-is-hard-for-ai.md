# Why Nepali Is Still a Hard Language for AI Models

English models feel close to solved. Nepali still does not. I have spent a lot of time running Nepali text through LLMs, and the gap comes down to a few concrete things, not anything mysterious about the language.

## There is not enough data

Models learn from scale. English has trillions of words of clean, varied text on the open web. Nepali has a small fraction of that, and a lot of what exists is low quality:

- News copy that repeats the same handful of phrasings
- Machine translated pages that teach the model broken grammar
- Text with broken encoding, or romanized Nepali mixed in with Devanagari

Cleaning it is most of the work, and once it is clean there is far less left than you hoped for.

## Tokenization works against it

Most tokenizers were built and tuned around English. They chop Devanagari into many small pieces, so a Nepali sentence uses two to four times more tokens than the same sentence in English. That has real effects:

- Shorter usable context for the same token budget
- Slower generation
- More points where the model can lose the thread of a long sentence

Some newer tokenizers handle Indic scripts better, but plenty of deployed models still do not.

## Quality is uneven

A large model can usually produce grammatical Nepali on common topics. It slips on:

- Less common vocabulary and technical terms
- Long or multi-part questions
- Formal versus spoken register
- Numbers, dates and honorifics

It also tends to fall back to English sentence structure translated word by word, which reads wrong to a native speaker even when every individual word is valid.

## What actually helps

- Fine tuning on cleaned native Nepali text, not translated text
- A tokenizer that does not shred the script
- Keeping the model in Nepali end to end instead of translating in and back out
- Real test prompts written by someone who speaks the language, so changes can be measured instead of guessed at

## Where this leaves us

Nepali is not hard because of anything about the language itself. It is hard because the data is thin, the tooling was built for English, and evaluation is still manual. All three are fixable with effort, which is most of why I keep working on it.
