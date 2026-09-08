# Building a Security Research Assistant with Local LLMs

I wanted a research helper for security work that does not send everything I look at to someone else's API. Local models are good enough for this now, if you build around their limits. Here is the shape of it.

## Why local

- Privacy: target names, findings and internal notes stay on my own hardware
- Cost: no per-token bill while I poke at it all day
- Latency: no round trip, and it keeps working offline

The tradeoff is capability. A local model is not a frontier model. The design has to account for that.

## RAG for the knowledge it does not have

The model does not reliably know specific CVEs, tool flags or advisory details. So it does not have to. I keep a local index of reference material: advisories, documentation, my own notes. The assistant retrieves the relevant pieces and answers from them. Retrieved facts beat remembered ones, and I can see the source.

## Tool calling for anything that has to be true

For anything factual I give it tools instead of trusting recall:

- Look up a CVE in a local database
- Run a scanner and parse its output
- Query the reference index
- Fetch and summarize a page

The model decides which tool to call and reads the result back. It orchestrates. It does not supply the data.

## Keeping it honest

- Every claim should trace to a retrieved document or a tool result
- If nothing was retrieved, the answer is "I do not know", not a guess
- I read the sources, not just the summary

Local models hallucinate at least as much as big ones. The architecture is what makes the output trustworthy, not the model.

## What it is good for

Fast orientation on an unfamiliar topic, pulling together scattered notes, drafting write-ups from real findings, explaining output I have not seen before. The final judgement stays mine. It is a faster way to get to the point where I can think, not a replacement for thinking.
