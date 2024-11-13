# Git
> Git 是一个开源的分布式版本控制系统，由 Linus Torvalds 于 2005 年创建，用于有效、高速地处理从小到大的项目版本管理。Git 是目前世界上最流行的版本控制系统，被广泛用于软件开发中，以跟踪代码变更、协调多人协作开发、管理软件发布等。

## 安装Git
```bash
brew install git
```

## 配置

### 用户名 & 邮箱
```bash
git config --global user.name "你的用户名"

git config --global user.email "你的邮箱地址"
```

### 生成SSH公钥
```bash
ssh-keygen -t rsa
```

### 查看SSH公钥
```bash
cat ~/.ssh/id_rsa.pub
```

## 常用命令

### git stash

git stash 命令用于临时保存当前工作区的改动，这样你就可以在不提交改动的情况下切换到其他分支。

以下是一些常用的 git stash 命令：

```bash
# 将当前的改动保存到一个新的 stash 中，你可以提供一个可选的消息来描述这个 stash
git stash save "message"

# 列出所有的 stash
git stash list

# 应用最近的 stash 到当前工作区，但不会从 stash 列表中删除这个 stash
git stash apply

# 应用最近的 stash 到当前工作区，并从 stash 列表中删除这个 stash
git stash pop

# 删除指定的 stash
git stash drop stash@{n}

# 删除所有的 stash
git stash clear

```


### git rebase

git rebase 命令用于将一系列提交应用到另一个基点上，它是 Git 中用于整理提交以使其更清晰的主要工具之一。

以下是一些常用的 git rebase 命令：

```bash
# 将当前分支的提交应用到 <base> 分支上。这将使得当前分支的提交看起来像是在 <base> 分支的最新提交之后进行的
git rebase <base>

# 以交互方式进行 rebase。这将打开一个 UI，让你可以选择要如何处理每个提交（包括丢弃、修改提交信息、合并等）
git rebase -i <base>

# 在解决完 rebase 过程中的冲突后，使用此命令继续 rebase 进程
git rebase --continue

# 如果你想放弃当前的 rebase 进程，可以使用此命令
git rebase --abort
```
