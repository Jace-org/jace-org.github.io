# LLM Hallucinations in Cybersecurity: Why Verification Matters

A language model that makes something up in a poem is a curiosity. One that makes something up in a vulnerability assessment is a liability. This is why I treat every model claim in security work as unverified until it is not.

## What hallucination looks like here

- CVE numbers that do not exist, or that exist but describe something else entirely
- Version numbers, config keys and command flags that are plausible but wrong
- A described vulnerability in code that is not actually there
- Citations to advisories or docs that were never written

The tone is the real problem. All of this comes out with the same confidence as correct output.

## Why it is worse in security

- The claims are specific and technical, so they look exactly like the kind of thing a model would know
- A wrong CVE or a missed real issue changes what gets fixed and what gets ignored
- Reports get read by people who were not in the room, and they take the content at face value
- A false finding wastes time. A fabricated all-clear is dangerous.

## Verification, concretely

- Check every CVE against a real database, not the model's memory
- Confirm versions and config details against the actual system
- Reproduce any claimed vulnerability before it goes in a report
- Follow every citation to the real source
- Prefer tools over recall for anything that has to be true

## Architecture, not good intentions

You do not fix this by asking the model to be careful. You fix it by building the workflow so claims must be backed:

- Retrieval from a trusted local corpus
- Tool calls for lookups and checks
- A separate pass, sometimes a separate model, whose only job is to challenge claims
- A human who reads the evidence

## The rule I keep

If a finding cannot be traced to a source or reproduced, it is not a finding yet. The model is allowed to suggest. It is not allowed to assert.
