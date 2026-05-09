---
description: 样式开发约定
globs: "**/*.{tsx,ts}"
alwaysApply: false
---

# 样式开发约定

## 必须使用自定义 createStyles

**禁止直接从 antd-style 导入 createStyles**。

### 正确用法

```typescript
import createStyles from '@/utils/createStyles';

const useStyles = createStyles(({ css, token, prefixCls }) => {
    return css({
        // 样式定义
    });
});
```

### 错误用法

```typescript
// 禁止这样做
import { createStyles } from 'antd-style';
```

## createStyles 实例配置

项目使用统一配置的 createStyles 实例 [src/utils/createStyles/index.ts](mdr:src/utils/createStyles/index.ts)：

```typescript
const { createStyles } = createInstance<any>({
    key: 'ihu-css',
    hashPriority: 'high'
});
```

## 样式写法规范

### 标准写法：css 函数 + 嵌套选择器（推荐）

使用 `css({})` 函数配合 `&.根类名` + `& .子类名` 的嵌套结构，以 BEM 风格组织类名，组件名作为前缀。

```typescript
const useStyles = createStyles(({ css, token }) => {
    return css({
        '&.my-component': {
            width: '100%',
            height: '100%',

            '& .my-component-header': {
                fontSize: 20,
                fontWeight: 600,
                color: token.colorText
            },

            '& .my-component-body': {
                padding: 16,
                background: token.colorBgContainer,

                '& .my-component-item': {
                    borderRadius: 8,
                    '&:not(:last-child)': {
                        marginBottom: 12
                    },
                    '&:hover': {
                        background: token.colorBgTextHover
                    }
                }
            }
        }
    });
});
```

### 访问 token 和 prefixCls

```typescript
const useStyles = createStyles(({ css, token, prefixCls }) => {
    return css({
        '&.my-component': {
            color: token.colorPrimary,
            [`.${prefixCls}-input`]: {
                borderRadius: token.borderRadius
            }
        }
    });
});
```

## 组件中使用样式

根元素通过 `cx` 将语义化类名与 CSS-in-JS 生成的哈希类名合并，子元素直接使用语义化字符串 className。

```typescript
const MyComponent = () => {
    const { cx, styles } = useStyles();

    return (
        <div className={cx('my-component', styles.toString())}>
            <div className="my-component-header">标题</div>
            <div className="my-component-body">
                <div className="my-component-item">内容</div>
            </div>
        </div>
    );
};
```

## 主题配置

全局主题通过 [src/theme/index.tsx](mdr:src/theme/index.tsx) 的 `BaseThemeProvider` 组件提供：

- 字体: `"PingFang SC", "Microsoft YaHei", SimHei`
- 基础字号: `14px`
- hashPriority: `'high'`
- 使用 `legacyLogicalPropertiesTransformer` 兼容旧浏览器逻辑属性
- ConfigProvider 关闭了 wave 动画、关闭按钮自动插入空格
- locale 设为 `zhCN`
- antd `App` 全局 message 配置：`top: 70`、`duration: 3`、`maxCount: 1`
- 基础 token 覆盖：`Button.textHoverBg: 'transparent'`
