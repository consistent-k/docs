# 表格页面开发约定

本规则适用于带有数据表格、筛选、分页等功能的页面组件开发。

## 核心原则

### 1. 统一的参数管理

使用单一的 `tableParams` 状态管理所有请求参数，避免状态分散。

```typescript
// ✅ 正确：统一管理
const [tableParams, setTableParams] = useState<QueryParams & { page: number; page_size: number }>({
    page: 1,
    page_size: 10,
    query: '',
    start_date: dayjs().subtract(7, 'day').valueOf(),
    end_date: dayjs().valueOf()
});

// ❌ 错误：状态分散
const [searchText, setSearchText] = useState<string>('');
const [filterParams, setFilterParams] = useState<QueryParams>({});
const [pagination, setPagination] = useState({...});
```

### 2. 数据请求封装

使用 `useCallback` 封装数据请求函数，依赖 `tableParams` 自动触发请求。

```typescript
// getData 函数定义
const getData = useCallback(
    async (params: QueryParams & { page: number; page_size: number }) => {
        setLoading(true);
        try {
            const res = await getDataApi(params);
            const result = res?.result?.[0];
            if (result) {
                const { data, pagination: pag } = result;
                setDataSource(data);
                setPagination(pag);

                // 最后一页数据都被删除后，要将页码更新为前一页
                if (data.length === 0 && pag.page > 1) {
                    setPagination({ ...pag, page: pag.page - 1 });
                    setTableParams((prev) => ({ ...prev, page: pag.page - 1 }));
                }
            } else {
                setDataSource([]);
            }
        } catch (error) {
            console.error('获取数据失败:', error);
        } finally {
            setLoading(false);
        }
    },
    [tableParams]
);

// 监听 tableParams 变化自动请求数据
useEffect(() => {
    getData(tableParams);
}, [getData, tableParams]);
```

### 3. 操作后刷新数据

删除、编辑、导入等操作成功后，**不要直接调用 `getData`**，而是通过更新 `tableParams` 触发 `useEffect` 自动请求。

```typescript
// ✅ 正确：通过 setTableParams 触发刷新
const handleDelete = async (id: number) => {
    await deleteApi({ id });
    message.success('删除成功');
    setTableParams((prev) => ({ ...prev }));
};

const handleSubmit = async () => {
    await submitApi(values);
    message.success('提交成功');
    // 提交后回到第一页
    setTableParams((prev) => ({ ...prev, page: 1 }));
};

// ❌ 错误：直接调用 getData
const handleDelete = async (id: number) => {
    await deleteApi({ id });
    getData(tableParams); // 绕过了 useEffect 统一管理
};
```

### 4. 日期范围管理

日期范围单独管理，使用 `useRef` 避免初始化时的重复请求。

```typescript
// 日期范围状态（独立管理）
const [dateRange, setDateRange] = useState<any>([
    dayjs().subtract(7, 'day'),
    dayjs()
]);

// 标记是否是初始挂载
const isInitialMount = useRef(true);

// 监听 dateRange 变化，同步更新 tableParams
useEffect(() => {
    // 初始挂载时跳过，避免重复请求
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }

    setTableParams((prev) => ({
        ...prev,
        start_date: dateRange[0].valueOf(),
        end_date: dateRange[1].valueOf(),
        page: 1 // 日期变化时重置页码
    }));
}, [dateRange]);
```

### 5. 搜索输入优化

使用 ahooks 的 `useThrottleFn`（推荐 500ms）实现节流，并用 `trim` 去除空格。`useThrottleFn` 会在组件卸载时自动取消定时器，无需手动 cleanup。

```typescript
import { useThrottleFn } from 'ahooks';

const { run: handleSearch } = useThrottleFn(
    (value: string) => {
        setTableParams((prev) => ({
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

需要防抖（debounce）场景时，使用 `useDebounceFn`，用法与 `useThrottleFn` 完全对称：

```typescript
import { useDebounceFn } from 'ahooks';

const { run: handleSearch } = useDebounceFn(
    (value: string) => {
        setTableParams((prev) => ({
            ...prev,
            keyword: value.trim(),
            page: 1
        }));
    },
    { wait: 500 }
);
```

> **注意：** 不要在 JSX 的 `onChange` 中直接写 `throttle/debounce(() => {...}, 500)`，每次渲染会创建新函数导致节流/防抖失效。

### 6. 表格筛选处理

使用 `isArray` 验证筛选参数，正确处理表格列的筛选器。

```typescript
import { isArray } from 'lodash';

const handleTableChange: TableProps<DataItem>['onChange'] = (_pagination, filters) => {
    const newParams: QueryParams & { page: number; page_size: number } = {
        ...tableParams,
        page: _pagination.current || 1,
        page_size: _pagination.pageSize || 10
    };

    // 科室筛选
    if (filters.department && isArray(filters.department)) {
        newParams.department = filters.department;
    }

    // 单据筛选
    if (filters.model && isArray(filters.model)) {
        newParams.document = filters.model;
    }

    setTableParams(newParams);
};
```

当列使用了 `filters` 时，必须同时设置 `filteredValue` 使筛选状态受控，保持与 `tableParams` 同步：

```typescript
{
    title: '状态',
    dataIndex: 'status',
    filters: [
        { text: '启用', value: 1 },
        { text: '停用', value: 0 }
    ],
    // ✅ filteredValue 从 tableParams 派生，切换 tab/重置时自动清空
    filteredValue: tableParams.status != null ? [tableParams.status] : []
}
```

### 7. 查询和重置按钮

提供独立的查询按钮（主色调）和重置按钮（文本样式）。

```typescript
// 查询按钮点击事件
const handleQuery = () => {
    setTableParams((prev) => ({ ...prev, page: 1 }));
};

// 重置按钮点击事件
const handleReset = () => {
    setDateRange([dayjs().subtract(7, 'day'), dayjs()]);
    setTableParams((prev) => ({
        ...prev,
        page: 1,
        page_size: 10,
        query: ''
    }));
};

// JSX
<Button className="query-btn" onClick={handleQuery} type="primary">
    查询
</Button>
<Button className="reset-btn" onClick={handleReset} type="text">
    重置
</Button>
```

### 8. 分页处理

统一的分页配置，必须包含 `showTotal`。

```typescript
// 表格视图分页
<Table
    pagination={{
        current: pagination?.page,
        pageSize: pagination?.page_size,
        total: pagination?.total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共${total}条`,
    }}
    onChange={handleTableChange}
/>

// 网格视图分页（独立 Pagination 组件）
<Pagination
    align="end"
    current={pagination?.page}
    pageSize={pagination?.page_size}
    total={pagination?.total}
    showSizeChanger
    showQuickJumper
    showTotal={(total) => `共${total}条`}
    onChange={(page, pageSize) => {
        setTableParams((prev) => ({
            ...prev,
            page,
            page_size: pageSize
        }));
    }}
/>
```

### 9. 始终使用函数式更新

更新 `tableParams` 时必须使用 `setTableParams((prev) => ({ ...prev, ... }))`，避免闭包中捕获旧值。

```typescript
// ✅ 正确：函数式更新，始终基于最新状态
setTableParams((prev) => ({ ...prev, keyword: value, page: 1 }));

// ❌ 错误：直接引用 tableParams，在异步回调/闭包中可能是旧值
setTableParams({ ...tableParams, keyword: value, page: 1 });
```

## 组件化架构

### 何时拆分视图组件

- **不需要拆分**：页面只有单一表格视图，逻辑简单（如 tasks、dictionary）
- **建议拆分**：页面同时包含表格视图和卡片视图，或表格列配置复杂且超过 100 行

拆分时的目录结构：

```
src/pages/your-module/
├── components/
│   ├── TableView/
│   │   ├── index.tsx      # 表格视图组件
│   │   ├── styles.ts      # 表格视图样式
│   │   └── columns.tsx    # 表格列配置
│   └── GridView/
│       ├── index.tsx      # 卡片视图组件
│       └── styles.ts      # 卡片视图样式
├── index.tsx              # 主页面组件
└── styles.ts              # 页面级样式
```

### 样式拆分原则

1. **页面级样式** (`styles.ts`)：页面容器、Header 区域、搜索框等通用控件
2. **视图组件样式** (`components/*/styles.ts`)：表格/卡片特定样式
3. **样式隔离**：每个组件独立维护，使用 `cx` 应用样式类，表格样式使用 `prefixCls` 变量而非硬编码

## 关键注意事项

### 1. 避免重复请求

- 使用 `useRef` 标记初始挂载，避免日期范围初始化时触发额外请求
- `useCallback` 的依赖项只包含 `tableParams`，避免循环依赖

### 2. 状态同步

- 筛选、查询、日期变化时，统一通过更新 `tableParams` 触发请求
- **禁止**直接调用 `getData`，让 `useEffect` 自动触发
- 操作后刷新使用 `setTableParams((prev) => ({ ...prev }))`

### 3. 页码处理

- 筛选、查询、日期变化时重置到第1页
- 最后一页数据删除后自动回退到前一页

### 4. 类型定义

查询参数应复用 services 层已定义的类型，分页信息类型统一为：

```typescript
// 分页信息类型（定义在 services 层）
interface Pagination {
    page: number;
    page_size: number;
    page_count: number;
    total: number;
}
```

## 常见问题

### Q1: 为什么不直接在 onChange 中调用 getData？

**A**: 通过统一的 `tableParams` 状态管理，让 `useEffect` 自动触发请求，代码更清晰，状态更可控。

### Q2: 为什么日期范围要单独管理？

**A**: 日期选择器需要受控组件，单独管理便于组件交互，通过 `useEffect` 同步到 `tableParams` 保证数据请求的一致性。

### Q3: 搜索防抖/节流的延迟时间应该设置多少？

**A**: 推荐 500ms。节流（`useThrottleFn`）适合搜索框，在用户输入期间也能定期反馈结果；防抖（`useDebounceFn`）适合提交类操作，仅在停止输入后触发一次。均使用 ahooks 提供的 Hook，自动处理组件卸载时的 cleanup。

### Q4: 什么时候应该重置到第1页？

**A**: 筛选条件变化、查询、日期变化时都应重置到第1页；仅分页变化（翻页、改变每页条数）时保持当前操作的页码。

### Q5: 操作后如何刷新列表？

**A**: 使用 `setTableParams((prev) => ({ ...prev }))` 触发引用变化，`useEffect` 会自动重新请求。不要直接调用 `getData`。
