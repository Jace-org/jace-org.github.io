# Designing a Cybersecurity AI Agent Pipeline

One big agent told to "do security analysis" produces confident mush. Splitting the work into a pipeline of narrow agents, with evidence passed between them, works much better. Here is the design I have landed on.

## Stages

1. Collect: gather raw material, scan output, logs, configs, target information, from real sources and tools
2. Normalize: turn all of it into a consistent structured form the later stages can reason over
3. Analyze: specialized agents each look at one thing, misconfigurations, exposed services, known CVEs, and flag candidates
4. Fact-check: a separate stage verifies each candidate against a database, a reproduction, or the actual system
5. Summarize: turn what survived verification into a report, with evidence attached

## Specialized agents beat one generalist

Each analysis agent gets a narrow job, a small prompt, and only the context it needs. That means:

- Less drift and less invention
- Failures are easy to locate
- I can improve one stage without disturbing the rest

## Evidence is the currency

Nothing moves between stages as an assertion. It moves as a claim plus its evidence: the log line, the tool output, the database record. The summarize stage is not allowed to include anything that arrived without evidence.

## The fact-check stage is not optional

This is the stage that makes the rest safe. It assumes every candidate finding is wrong until a lookup, a reproduction, or a check against the real system says otherwise. Ideally it uses different tools, and sometimes a different model, than the stage that produced the finding.

## Humans in the loop

A person reviews the verified findings before anything is delivered. The pipeline's job is to get from noise to a short, evidence-backed list quickly. The judgement about severity, scope and what to do stays with a human.

## Why bother

Done this way, the agents do the tedious wide-net work, the verification stage catches the confident nonsense, and I spend my time on the part that needs a person. That is the only division of labour with AI in security that I actually trust.
