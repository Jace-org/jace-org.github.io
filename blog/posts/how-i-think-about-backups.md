# How I Think About Backups After Designing My Own Infrastructure

I used to think a nightly copy was a backup. Then I designed a setup I actually had to trust, and my definition changed. This is the model I use now.

## Tiers, not one copy

- Primary server: the live data
- Secondary server: a second machine that pulls copies on a schedule
- NAS: bulk and medium-term storage, larger and cheaper per gigabyte
- Off-site or older data: history kept somewhere the live machines cannot touch

Each tier answers a different failure. One disk dies. One server dies. One bad deploy. One account gets compromised.

## Rules I follow

- The backup target pulls. The source cannot write into it. If a compromised server can delete its own backups, they were never backups.
- Keep history, not just the latest copy. Corruption often gets copied for days before anyone notices.
- A backup you have never restored is a guess. Test the restore, not just the schedule.
- Alert on missing backups. A silent job that quietly stopped a week ago is the usual way people find out too late.

## Recovery is the real metric

The numbers that matter are how long it takes to get back to working, and how much data you lose along the way. I try to know both for each machine before I need them. If the answer is "I am not sure", that is the next thing to fix.

## What this looks like day to day

Nightly pulls to the secondary and the NAS. Older snapshots retained on a schedule so I can go back weeks, not just to last night. A small check that shouts if any of it did not run. Nothing clever. The value is in it being boring and tested.

## The mindset shift

I stopped asking "is it backed up" and started asking "what happens when this exact machine is gone". That question forces the tiers, the pull model, the retained history and the restore test to fall out on their own.
