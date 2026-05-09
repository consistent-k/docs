---
description: ESLint、Prettier 和 Git 提交规范
alwaysApply: true
---

# 代码风格规则

## ESLint 配置

本项目使用 ESLint 9 的扁平配置格式（Flat Config），配置文件为 [eslint.config.js](mdr:eslint.config.js)。

### 配置包和扩展

- `@eslint/js` - JavaScript 推荐规则
- `typescript-eslint` - TypeScript 支持和推荐规则
- `eslint-plugin-react` - React 规则（`react/no-unknown-property: error`）
- `eslint-plugin-react-hooks` - React Hooks 规则（flat config）
- `eslint-plugin-react-refresh` - React Refresh 支持（Vite）
- `eslint-plugin-import` - Import 排序和规则
- `eslint-plugin-unused-imports` - 未使用导入检测
- `eslint-plugin-prettier` - Prettier 集成

### 关键规则

#### TypeScript 相关
- `@typescript-eslint/no-explicit-any: off` - 允许使用 any 类型
- `@typescript-eslint/ban-ts-comment: off` - 允许使用 @ts-ignore 等注释

#### React 相关
- `react/no-unknown-property: error` - 禁止未知的 JSX 属性
- `react-hooks/exhaustive-deps: off` - 关闭依赖项检查
- `react-hooks/set-state-in-effect: off` - 允许在 useEffect 中使用 setState

#### 代码质量
- `no-unused-vars: error` - 禁止未使用的变量（仅检查本地变量 `vars: 'local'`，不检查函数参数 `args: 'none'`）
- `unused-imports/no-unused-imports: warn` - 警告未使用的导入

### Import 顺序规则

导入语句必须按以下顺序排列，**组间需空行分隔**（`newlines-between: 'always'`）：

1. **builtin** - Node.js 内置模块（如 `path`, `fs`）
2. **external** - 第三方依赖（npm 包）
4. **internal/parent/sibling/index** - 项目内部模块（`@/` 别名导入）
5. **unknown** - 未分类的导入

同组内按字母顺序排列（不区分大小写，`alphabetize: { order: 'asc', caseInsensitive: true }`）。

#### 示例

```typescript
// 正确的导入顺序
import path from 'path';

import React, { useState } from 'react';
import { Button, Form } from 'antd';
import { useRequest } from 'ahooks';

import { AppContext } from '@/context/app';
import { useAppContext } from '@/hooks/useAppContext';
import createStyles from '@/utils/createStyles';

// 错误的导入顺序（缺少空行，顺序混乱）
import React from 'react';
import createStyles from '@/utils/createStyles';
import { Button } from 'antd';
import path from 'path';
```

## Prettier 配置

参考 [.prettierrc](mdr:.prettierrc)：

- **引号**: 单引号 (`singleQuote: true`)
- **尾逗号**: 无 (`trailingComma: 'none'`)
- **行宽**: 120 字符 (`printWidth: 120`)
- **缩进**: 4 空格 (`tabWidth: 4`)
- **换行符**: LF (`endOfLine: 'lf'`)
- **Prose 换行**: never (`proseWrap: 'never'`)

## Git 提交规范

### Commitizen 配置

使用 [conventional-changelog](mdr:commitlint.config.cjs) 规范（注意文件为 `.cjs` 后缀，因为项目 `"type": "module"`）：

```bash
pnpm commit  # 使用交互式提交（git-cz）
```

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

常用 type：
- feat: 新功能
- fix: 修复bug
- docs: 文档变更
- style: 代码格式（不影响代码运行）
- refactor: 重构
- perf: 性能优化
- test: 测试相关
- chore: 构建过程或辅助工具变更
