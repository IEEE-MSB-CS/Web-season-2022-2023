
## Level 1: Git Basics

```bash
git diff # show "unstaged" differences since last commit
git diff --staged # view staged differences

git checkout -- sample.txt # blow away all changes sinces last commit

```

HEAD referes to  the last coomit on the current branch we're on.

#### Git configuration

```sh
git --version
git config --global user.name "MrBomberx"
git config --global user.email "mrbomberboy123@gmail.com"
git config --global color.ui auto
git config --get user.name
git config --global core.editor "nano"
git config user.name => get also user.name
git config --list
```

---------------------------------------

#### getting help

```sh
git <verb> --help
git help <verb>
man git-<command>
    -> man git-log
```

-------------------------------------

#### logging or searching

```sh
git log
git log -n 10 => limit the number of commit message to be shown
git log --until=2020-12-12
git log --since=2030-12-12
git log --author="yousef"
git log --grep="Initial"
```

-----------------------------------------------

#### Staging Area

* Adding

```bash
git add --all or -a
git add *.txt # add text files in the "current" directory.
git add "*.txt" # add all the text files in the whole project. 
git add docs/*.txt 
```

* Reverting (removing from staging)

```bash
git reset HEAD <file> # to unstage
  git reset HEAD sample.txt
```

#### Committing Area

#### commit

* Delete a commit
* restore deleted commit

* Undoing a commit

```bash
git reset --soft HEAD^ # Reset into staging, move the commit one before "HEAD"
git status # you will see that file is moved to the staging. and the commit has been "deleted or no" IDK yet

git reset --hard HEAD^ # undo last commit and blow and all the changes
git reset --hard HEAD^^ # undo last two commits and all changes
```

* Adding to the last commit

```bash
git add sample.txt
git commit --amend -m 'new message or' # add to the last commit with a new message overwritting the original one., whatever in the staging area will be added to that commit
git commit -a -m 'messages' # add all tracked files to commit area directly. but if there's untracked files, it will not be added.

```

## Level 2: Staging and Remotes

#### Working with Remote

* Git doesn't take care of access control: it doesn't specifiy for example who has the right to access this repo or not.
you need a hosted or self-manages solutions (Github, BitBucket, Gitorious, gitoisis)

```sh
git remote add <remote_name> <remote_url>
git remote -v # show remote repositories
git push -u <remote_name> <local_branch>
git pull
git remote rm <name>
# -u (for not specifiying everytime the name of the branch nor the remote)
```

#### Having Multiple remote

```sh
heroku create
git remote -v
git push heroku master # this triggers deployement pipeline 
```

Don't do those commands after you've already pushed!

```sh
git reset --soft HEAD^
git commit --amend -m 'New message'
git reset --hard HEAD^
git reset --hard HEAD^^
```

** Password Caching

## Level 3: Cloning & Branching

```sh
git clone <remote_url> [<name>]
```

Here's what clone does:

1. Downloads the entire repo into a new git-real directroy
2. adds the 'origin' remote, pointing it the clone URL
3. check out the initial branch (likely master or main) and sets the head

* Switching to branch

1. create the branch
2. switch to it

```sh
git branch cat
git checkout cat
```

we can do it one step

```sh
git checkout -b cat
```

```sh
git log # got the commits done in the current branch only
```

* Merging

```sh
git checkout master
git merget cat
```

what's fast-forward?

* Deleting

```sh
git branch -d <B_name>

```

6-cloning (Downloading) repo on your local:
git clone <url> <where to put>
    git clone ../remoterepo . //that's means you can clone local repo sa well
7-viewing info about remote repos:
git remote -v
git branch -a
8-pushing changes to remote repo:
8-1: (commiting it locally first)
 after changing some code or whatever in your file, do the same thing above
git diff
git status
git add -A
git commit -m "Modified line number #36 on index.html"
8-2 Then push (committing it remotley) before actually doing this you should first create on github repo called "origin" or anything you wnat or you can do this manually from the CLI
git remote add  origin htttps://github.com/MrBomber0x001/origin.git

git pull origin master
git push origin master

**common workflow:
===common scenario===
let's assume you have a repo project of website, you wan't to have two differennt style of this website, and each version has it's unique functionalities
you can do this by make branch for every style, so you can work seperatley on a branch without corrputing the other one
1-create a branch for a desire feature:
git branch <name>
git branch //to know the branches you have
git checkout <name> //for switching to this branch
//then pushing the branch to the remote repo
git push -u origin <nameofbranch>
2-merging branches:
git branch --merged //to show the merged
git merge <nameofbranch>
//then push the changes to the master branch
3-deleting branch:
git branch -d <nameofbranch> //deleting it from the local repo
//then we can delete it from the remote repo or just leave it there
git push origin --delete <branchname>

**generating SSH key for authentication with Github:
1-searching for existing SSH key:
=> ls ~/.ssh/id_rsa.pub (this is the file where your ssh key are stored)
you can check those too:
id_rsa.pub
id_ecdsa.pub
id_ed25519.pub

2-creating SSH key:
-ssh-keygen -C mrbomberboy123@gmail.com (this will create ssh key for this provided email
-you can locate your ssh in the directory listed above ".ssh/-----"
-you can use the generated ssh key with any ssh agents

--------------------

3-testing SSH key:
ssh -T git@github.com (this will add github.com as known server and authenticate it)

--------------------

cat ~/.gitconfig
git config --system <option> ==> for the system users (ALL)
git config --global <option> ==> for the current user

-----

**Writing commit messages:
-use "present tense" not "past tense", you are labeling what the commit not what you as-the creator-were doing, e.g:
"fixes bug", "fix bug" not "fixed bug"
-can develop shorthand for your organization:
"[css,js]"
"[bugfix:]"
"[#454543-]"

-Be clear and descriptive:
    -"Fix typo" => Bad
    -"Add missing > in project section HTML" => Good
    -"update login code" => Bad
    -"change user authentication to use Blowfish" => Good
-in log commit message:
    -describe what the problem "is" and what the fix is to solve this bug.

------------

-----------

Git architecutre:
-git generates checksum for each change set:
    -checksum algorithm convert data into simple number
    -same data alwatys equals the same checksum, changing the data changes the checksum
-git use SHA-1 hash algorithm:
 40 character hexadeciaml

HEAD:
git refernces a pointer called HEAD, it's main job is to point to a specific commit in our repo, as we making new commits the HEAD pointer is going to change to move to a new commit
HEAD point to the parent of the next commit,
it points to the place where we're going to start recording next commits
it's the place where we left off in our repo for the things we've commited
HEAD is pointing at the last commit of the current branch

cd .git
cat HEAD
cd refs
cd head
cat master

--------

git diff --staged
git diff contact.html
or the best
git diff --color-words contact.html  
--

removing:

if you deleted file and you want to remove tracking
git rm file-to-be-deleted.txt => this will go into staging area and we can commit this deletion

----

renaming and moving:
--> you've here two option, either to rename it yourslef, or to use git to rename it for you (this step will shorten the journey)
when you rename a file, git recognize that you maybe actually delete it
so you add the newly renamed file and git rm the orignal file , let's say we've file called "first_file.txt" and we're going to change it to "primary_file.txt"
mv first_file.txt primary_file.txt
git add primary_file.txt
git rm first_file.txt
git status => you will notice that git actually compared the two file and recognized that you just rename it

git mv second_file.txt secondary_file.txt
git status => it recogoized it fastly

-------

git commit -am (add to the staging area and then add it to repo, all in one big move ) -> but there are two main caveat or drawbacks:
1-if you want to exclude one file from adding it, you can't
2-it does not include your new files or deleted files
git commit -am "your commit message here"

------

# Undoing changes

git checkout:
a thing about checkout is that it's used for more than just one purpose, it also used for working with [branches]
what checkout does is get to the respo and get the [names] thing I gave you and make my working directory look like that, to demonstrate the [named] thing alittle bit
let's  say we have a working directroy called "resources" and I want to revert some changes on this directory
git checkout resources
but we may have a branch with this name, and in this case git can't tell what we need to do, but actually it will revert the branch not th directory
so it's a good practice when we trying not checkout a branch is use [double dasy  --] followed by the name, this will make git know you want to stay on the same branch
git checkout -- index.html

# Unstaging files

git reset HEAD resources.html

# Amending commit: (a little bit trickier)

<https://learngitbranching.js.org/>
<https://wildlyinaccurate.com/a-hackers-guide-to-git/>

**FROM Udacity**

pull vs fetch

-> pull : pulls the changes made to the remote repo, and merge it with local branch

-> fetch: fetches the changes made to the remote repo, and don't merge untill you tell it to merge, Git fetch is used to retrieve commits from a remote repository's branch but it *does not* automatically merge the local branch with the remote tracking branch after those commits have been received.

![](C:\Users\ncm\AppData\Roaming\marktext\images\2022-03-16-08-28-38-image.png)

so our local branch "master" is still pointing to "e" `HEAD` will pointig to `e`

we need to do a merge to apply changes

```bash
git merge origin/master
```

now `HEAD` will be pointing to `8` as well as origin/master

**When to use Fetch!**

let's say we have a commit on remote repo, and commit on local repo,

echo one doesn't know yet about one another changes

and

```bash
git pull origina master
```

will not help

![](C:\Users\ncm\AppData\Roaming\marktext\images\2022-03-16-08-54-28-image.png)

```bash
git fetch origin master
# then
git merge origin/master
# then we can upload the chages made from the local repo to the remote one
```

![](C:\Users\ncm\AppData\Roaming\marktext\images\2022-03-16-08-54-17-image.png)

```bash
git push origin master
```

![](C:\Users\ncm\AppData\Roaming\marktext\images\2022-03-16-08-58-46-image.png)

This concept of "forking" is also different from "cloning". When you clone a repository, you get an identical copy of the repository. But cloning happens on your *local* machine and you clone a *remote* repository. When you fork a repository, a new duplicate copy of the *remote* repository is created. This new copy is *also a remote* repository, but it now belongs to you.

`git log` is the common command you'll use when working with a team o see changes made!

```git
git shortlog -s -n
git log --all --decorate --all --graph --oneline
git log --author=meska
git show <commit number>
git log --grep="word to seach for"
```

# Udacity Git Commit Message Style Guide

## Commit Messages

### Message Structure

A commit message consists of three distinct parts separated by a blank line: the title, an optional body and an optional footer. The layout looks like this:

```
type: subject

body

footer
```

The title consists of the type of the message and subject.

### The Type

The type is contained within the title and can be one of these types:

* *feat:* a new feature
* *fix:* a bug fix
* *docs:* changes to documentation
* *style:* formatting, missing semi colons, etc; no code change
* *refactor:* refactoring production code
* *test:* adding tests, refactoring test; no production code change
* *chore:* updating build tasks, package manager configs, etc; no production code change

### The Subject

Subjects should be no greater than 50 characters, should begin with a capital letter and do not end with a period.

Use an imperative tone to describe what a commit does, rather than what it did. For example, use change; not changed or changes.

### The Body

Not all commits are complex enough to warrant a body, therefore it is optional and only used when a commit requires a bit of explanation and context. Use the body to explain the what and why of a commit, not the how.

When writing a body, the blank line between the title and the body is required and you should limit the length of each line to no more than 72 characters.

### The Footer

The footer is optional and is used to reference issue tracker IDs.

### Example Commit Message

> feat: Summarize changes in around 50 characters or less  
>
> More detailed explanatory text, if necessary. Wrap it to about 72 characters or so. In some contexts, the first line is treated as the subject of the commit and the rest of the text as the body. The blank line separating the summary from the body is critical (unless you omit the body entirely); various tools like `log`, `shortlog` and `rebase` can get confused if you run the two together.  
>
> Explain the problem that this commit is solving. Focus on why you are making this change as opposed to how (the code explains that). Are there side effects or other unintuitive consequences of this change? Here's the place to explain them.  
>
> Further paragraphs come after blank lines.
>
> * Bullet points are okay, too
> * Typically a hyphen `-` or asterisk `*` is used for the bullet, preceded by a single space, with blank lines in between, but conventions vary here  

> If you use an issue tracker, put references to them at the bottom, like this:  
> Resolves: #123  
> See also: #456, #789

git clone --bare <url>
git config --bool core.bare false
git reset --hard
git checkout -b <new_branch>

----------------------------

# introduction

## history

* SCSS 1972, closed source, free with unix
* revision control system (RCS)
  -1982 open source
  both are used to track one single file
* CVS concurrent version system (CVS)
  (first remote repo)
* Apache Subversion (SVN)
  2000, open source -> watching the whole directroy, and other non test file

  CVS had a hrd time if you renamed a file

BitKeeper SCM 2000, open source, propritry (Distrubuted version control);
community version 2002 -> 2005
2005 no longer free
github 2008
linux

## Version control?

* two differnet people working on the same file. (merging);
* timecapsule: log of time

## Repository location: central vs distribute s

-one central repository (one server); -> server may goes down.

* complete copy of the repo: work offline,

## Level 3 Branching and cloning

## Git internals

* Two tree and three tree architecure;
  Two tree
  we call them trees, because they represent a file structure

## Technical Questions

* Rebase vs Merge vs Squash
