# Homebrew
> Homebrew 是一个流行的包管理器，主要用于macOS系统（也支持Linux），它允许用户通过简单的命令安装、更新和管理软件包。Homebrew 提供了一个中央仓库，其中包含了大量的软件包，用户可以通过命令行界面轻松地安装这些软件包。

## 官网安装
官网：[Homebrew](https://brew.sh/)


## 第三方脚本安装（推荐）
```bash
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"
```


## 常用命令

- 更新 Homebrew
> 更新 Homebrew 本身及其软件包列表
```bash
brew update
```

- 安装软件包
> 安装一个软件包，例如安装 Git：
```bash
brew install git
```

- 列出已安装的软件包
> 查看所有已安装的软件包

```bash
brew list
```

- 卸载软件包
> 卸载一个已安装的软件包

```bash
brew uninstall <formula>
```