# 卡片列表页面开发约定

本规则适用于使用卡片网格布局展示列表数据的页面（如智能体、提示词、知识库等），与 `table-page-conventions.mdr` 互补。

## 核心原则

### 1. 统一的参数管理

与表格页面一致，使用单一的 `listParams` 状态管理所有请求参数，不要将 `keyword`、`currentPage`、`pageSize`、`activeTab` 等分散管理。

```typescript
// ✅ 正确：统一管理
const [listParams, setListParams] = useState<ListParams & { page: number; page_size: number }>({
    page: 1,
    page_size: 10,
    keyword: '',
    source: 'all'
});

// ❌ 错误：状态分散
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [keyword, setKeyword] = useState('');
const [activeTab, setActiveTab] = useState('all');
```

### 2. 数据请求封装

使用 `useCallback` 封装请求函数，依赖 `listParams` 自动触发。

```typescript
// 列表数据状态
const [loading, setLoading] = useState(false);
const [dataSource, setDataSource] = useState<ItemType[]>([]);
const [pagination, setPagination] = useState<PaginationData>();

const getData = useCallback(
    async (params: ListParams & { page: number; page_size: number }) => {
        setLoading(true);
        try {
            const res = await listApi(params);
            const result = res?.result?.[0];
            if (result) {
                const { data, pagination: pag } = result;
                setDataSource(data);
                setPagination(pag);

                // 最后一页数据都被删除后，将页码更新为前一页
                if (data.length === 0 && pag.page > 1) {
                    setPagination({ ...pag, page: pag.page - 1 });
                    setListParams((prev) => ({ ...prev, page: pag.page - 1 }));
                }
            } else {
                setDataSource([]);
            }
        } catch (error) {
            console.error('获取列表失败:', error);
        } finally {
            setLoading(false);
        }
    },
    [listParams]
);

// 监听 listParams 变化自动请求
useEffect(() => {
    getData(listParams);
}, [getData, listParams]);
```

### 3. 操作后刷新数据

删除、编辑、复制等操作成功后，**不要直接调用 `getData`**，通过更新 `listParams` 触发。

```typescript
// ✅ 正确
const handleDelete = async (id: number) => {
    await deleteApi({ id });
    message.success('删除成功');
    setListParams((prev) => ({ ...prev }));
    fetchTabCounts(); // 如果有 tab 计数需要刷新
};

// ❌ 错误：直接调用
const handleDelete = async (id: number) => {
    await deleteApi({ id });
    fetchList(currentPage, pageSize, keyword, getStatusFromTab(activeTab));
};
```

### 4. Tab 切换

Tab 状态通过 `listParams` 中的对应字段管理，切换时重置页码。

```typescript
const handleTabChange = (key: string) => {
    setListParams((prev) => ({
        ...prev,
        source: key,
        page: 1
    }));
};

// JSX - activeKey 从 listParams 派生
<Tabs
    activeKey={listParams.source}
    onChange={handleTabChange}
    items={tabItems}
/>
```

> **注意**：不要用独立的 `activeTab` 状态，否则需要额外处理同步问题。

### 5. 搜索输入

使用 ahooks 的 `useThrottleFn`（推荐 500ms）实现节流，与表格页面保持一致。

```typescript
import { useThrottleFn } from 'ahooks';

const { run: handleSearch } = useThrottleFn(
    (value: string) => {
        setListParams((prev) => ({
            ...prev,
            keyword: value.trim(),
            page: 1
        }));
    },
    { wait: 500 }
);

// JSX
<Input
    placeholder="搜索..."
    allowClear
    suffix={<Icons.Search />}
    onChange={(e) => handleSearch(e.target.value)}
/>
```

### 6. 分页处理

卡片列表使用独立的 `Pagination` 组件，分页配置必须完整。

```typescript
<Pagination
    align="end"
    current={pagination?.page}
    pageSize={pagination?.page_size}
    total={pagination?.total}
    showSizeChanger
    showQuickJumper
    showTotal={(total) => `共${total}条`}
    onChange={(page, pageSize) => {
        setListParams((prev) => ({
            ...prev,
            page,
            page_size: pageSize
        }));
    }}
/>
```

### 7. 始终使用函数式更新

```typescript
// ✅ 正确
setListParams((prev) => ({ ...prev, keyword: value, page: 1 }));

// ❌ 错误：闭包中可能是旧值
setListParams({ ...listParams, keyword: value, page: 1 });
```

## Tab 计数

很多卡片页面需要在 Tab 标签上显示各分类的数量。Tab 计数应独立管理，与列表数据解耦。

```typescript
const [tabCounts, setTabCounts] = useState<Record<string, number>>({
    all: 0, standard: 0, derived: 0, custom: 0
});

const fetchTabCounts = useCallback(async () => {
    try {
        const res = await groupCountApi();
        const counts: Record<string, number> = {};
        for (const item of res?.result || []) {
            counts[item.key] = item.count;
        }
        setTabCounts((prev) => ({ ...prev, ...counts }));
    } catch (error) {
        console.error('获取计数失败:', error);
    }
}, []);

// 初始化时获取
useEffect(() => {
    fetchTabCounts();
}, []);

// 增删操作后刷新计数
const handleDelete = async (id: number) => {
    await deleteApi({ id });
    message.success('删除成功');
    setListParams((prev) => ({ ...prev }));
    fetchTabCounts();
};
```

## 卡片网格布局

### 网格结构

使用 antd `Row` / `Col` 实现响应式卡片网格，外层用 `<Spin>` 包裹卡片滚动区以展示加载状态。

```tsx
<Spin
    spinning={loading}
    styles={{
        root: {
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
        },
        container: {
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
        }
    }}
>
    <div className="xxx-cards-scroll">
        {dataSource.length > 0 ? (
            <Row gutter={[16, 16]}>
                {dataSource.map((item) => (
                    <Col key={item.id} xs={24} md={12} xl={8}>
                        <CardComponent item={item} />
                    </Col>
                ))}
            </Row>
        ) : (
            !loading && <Empty description="暂无数据" style={{ padding: '40px 0' }} />
        )}
    </div>
</Spin>

<div className="xxx-pagination">
    <Pagination ... />
</div>
```

> **注意**：`Spin` 通过 `styles.root` 和 `styles.container` 两个属性同时设置 `flex: 1` + `flexDirection: column`，确保加载遮罩层（`.ant-spin-container`）能正确撑满剩余高度，避免遮罩高度塌陷问题。**不要**使用已废弃的 `wrapperClassName` 属性。

### 页面整体结构

```tsx
<PageCardLayout className={cx('xxx-page', styles.toString())}>
    {/* 1. 工具栏：Tab + 操作按钮 + 搜索 */}
    <div className="xxx-toolbar">
        <div className="xxx-toolbar-left">
            <Tabs ... />
        </div>
        <div className="xxx-toolbar-right">
            <Button type="primary" icon={<PlusOutlined />}>新建</Button>
            <Input ... />
        </div>
    </div>

    {/* 2. Spin 包裹卡片网格区（可滚动） */}
    <Spin spinning={loading} styles={{ root: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }, container: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } }}>
        <div className="xxx-cards-scroll">
            <Row gutter={[16, 16]}> ... </Row>
        </div>
    </Spin>

    {/* 3. 分页 */}
    <div className="xxx-pagination">
        <Pagination ... />
    </div>

    {/* 4. 弹窗（新建/编辑） */}
    <Modal ... />
</PageCardLayout>
```

### 样式约定

工具栏使用统一的 flex 布局：

```typescript
'.xxx-toolbar': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,

    '&-right': {
        display: 'flex',
        alignItems: 'center',
        gap: 12
    }
}
```

卡片滚动区和分页区的布局（`Spin` 本身的 flex 布局通过 `styles` prop 内联设置，无需额外 CSS 类）：

```typescript
'.xxx-cards-scroll': {
    flex: 1,
    overflow: 'auto'
},

'.xxx-pagination': {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'flex-end'
}
```

## 关键注意事项

### 1. 避免重复请求

- `useCallback` 的依赖项只包含 `listParams`
- 不要在初始化 `useEffect` 中手动传参调用 `fetchList(1, pageSize, '', 'all')`，让 `listParams` 的初始值自动触发即可

### 2. 状态同步

- Tab 切换、搜索、分页变化，统一通过更新 `listParams` 触发请求
- **禁止**直接调用 `getData` 或手动传参调用 `fetchList(page, size, keyword, status)`
- 操作后刷新使用 `setListParams((prev) => ({ ...prev }))`

### 3. 页码处理

- Tab 切换、搜索变化时重置到第 1 页
- 分页变化时保持用户操作的页码
- 最后一页数据删除后自动回退到前一页

### 4. 与表格页面的区别

| 维度 | 表格页面 | 卡片列表页面 |
|---|---|---|
| 状态变量名 | `tableParams` | `listParams` |
| 分页组件 | Table 内置 pagination | 独立 Pagination 组件 |
| 列筛选 | `handleTableChange` 处理 filters | 无列筛选，通过 Tab / 搜索筛选 |
| 数据展示 | `<Table>` | `<Row>` + `<Col>` + 卡片组件 |
| 空状态 | Table 自带空状态 | 需要手动判断渲染 `<Empty>` |

## 常见问题

### Q1: Tab 状态应该放在 listParams 里还是单独管理？

**A**: 放在 `listParams` 里。Tab 本质是一个筛选条件，放在 `listParams` 中可以避免 Tab 切换时忘记同步请求参数。

### Q2: 初始化时需要手动调用 fetchList 吗？

**A**: 不需要。`listParams` 的初始值会在组件挂载时通过 `useEffect` → `getData` 自动触发首次请求。

### Q3: Tab 计数为什么不从列表接口获取？

**A**: 列表接口返回的是当前筛选条件下的 total，不是各 Tab 的总数。Tab 计数需要独立接口或多次请求获取。

### Q4: 卡片组件应该抽取为独立组件吗？

**A**: 如果卡片渲染逻辑超过 30 行或需要复用，建议抽取为独立组件并通过 props 传入回调函数。简单卡片可以用 `renderCard` 函数在页面内定义。
