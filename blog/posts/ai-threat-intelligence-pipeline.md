# Building an AI-Powered Threat Intelligence Pipeline

Threat intel is a firehose of feeds, advisories, blog posts and reports, most of it not relevant to you. I built a pipeline to turn that stream into a short, useful summary. The AI part is one stage, not the whole thing.

## The stages

1. Collect: pull from feeds, advisory sources, vendor bulletins and a few blogs, on a schedule
2. Normalize: parse everything into one structured format, dedupe near-identical items, drop obvious noise
3. Analyze: score each item for relevance to the systems and software I actually run
4. Enrich: attach related CVEs, affected versions, known exploitation status, links to primary sources
5. Summarize: produce a short digest, most important first, each item traceable back to its source

## Where the model helps

- Normalizing messy prose into structured fields
- Judging relevance against a description of my environment
- Writing the digest so it is actually readable

Everything factual in the enrich stage comes from lookups, not the model. A CVE's details come from a database. Exploitation status comes from a real source. The model arranges and explains. It does not supply the facts.

## Keeping it trustworthy

- Every item in the digest links to its primary source
- CVE and version data is pulled from authoritative databases, then shown, not paraphrased from memory
- If relevance scoring is unsure, the item stays in rather than being dropped silently
- I read the sources for anything I am going to act on

## Why it is worth building

The value is not the AI. It is going from hundreds of items a week down to a handful that matter to my stack, with the reasoning and the sources attached. The model makes the reading and sorting faster. The pipeline structure is what keeps it from confidently telling me something false.
