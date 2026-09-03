# Git quick reference

The commands I actually use, grouped by what I am trying to do.

## Branching

    git switch -c feature/name      # create and switch to a new branch
    git switch main                 # go back to main
    git branch -d feature/name      # delete a merged branch
    git branch -D feature/name      # force delete an unmerged branch

## Seeing what changed

    git status                      # what is staged and what is not
    git diff                        # unstaged changes
    git diff --staged               # staged changes
    git log --oneline --graph -20   # recent history, compact

## Undoing things

    git restore file.txt            # throw away unstaged changes to a file
    git restore --staged file.txt   # unstage a file, keep the changes
    git commit --amend              # fix the last commit message or contents
    git revert <hash>               # make a new commit that undoes an old one
    git reset --hard <hash>         # move the branch back, discard everything after

## Stash

    git stash                       # shelve current changes
    git stash pop                   # bring them back
    git stash list                  # see what is shelved

## Rebase and tidy history

    git rebase main                 # replay this branch on top of main
    git rebase --continue           # after fixing a conflict
    git rebase --abort              # give up and go back

## Remotes

    git remote -v                   # list remotes
    git fetch --all --prune         # update refs, drop deleted branches
    git push -u origin feature/name # push a branch and track it

## Cleanup

    git clean -nd                   # preview untracked files that would be removed
    git clean -fd                   # actually remove them
