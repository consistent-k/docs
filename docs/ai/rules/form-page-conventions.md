# 新建/编辑表单页面开发约定

本规则适用于包含新建或编辑表单的页面，涵盖 **Modal 弹窗表单** 和 **独立路由表单页** 两种模式，与 `card-list-page-conventions.mdr`、`table-page-conventions.mdr` 互补。

## 核心原则

### 1. 表单状态统一由 Form 实例管理

所有表单字段的值必须由 antd `Form.useForm()` 统一管理，禁止为每个字段单独 `useState`。

```typescript
// ✅ 正确：Form 实例统一管理
const [form] = Form.useForm();

// 提交时一次性获取所有值
const values = await form.validateFields();
await addApi(values);

// ❌ 错误：每个字段一个 useState
const [name, setName] = useState('');
const [sceneId, setSceneId] = useState<number>();
const [content, setContent] = useState('');

// 提交时手动拼装
await addApi({ name, scene_id: sceneId, content });
```

**例外情况**：以下场景允许使用独立 `useState`，但应尽量控制数量：

- 非表单字段的 UI 状态
- 需要复杂交互的子组件状态

### 2. 新建/编辑模式判断

#### Modal 弹窗表单

使用 `editingItem` 状态区分新建和编辑模式，`null` 为新建，非 `null` 为编辑。

```typescript
const [modalOpen, setModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState<ItemType | null>(null);

// 打开新建
const handleOpenCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
};

// 打开编辑
const handleEdit = (item: ItemType) => {
    setEditingItem(item);
    form.setFieldsValue({
        name: item.name,
        // ...
    });
    setModalOpen(true);
};
```

如果编辑时需要从 API 获取详情（列表数据不完整），使用 `editingId` 代替 `editingItem`：

```typescript
const [editingId, setEditingId] = useState<number | null>(null);

const handleEdit = async (id: number) => {
    setEditingId(id);
    const res = await detailApi({ id });
    const detail = res?.result?.[0];
    if (detail) {
        form.setFieldsValue({ ... });
        setModalOpen(true);
    }
};
```

#### 独立路由表单页

通过 URL 参数判断模式，使用 `useSearchParams` 获取编辑 ID。

```typescript
const [searchParams] = useSearchParams();
const editId = searchParams.get('id');

// 列表页跳转编辑
navigate('/xxx/create?id=${item.id}');

// 初始化加载
useEffect(() => {
    if (editId) {
        loadDetail(Number(editId));
    }
}, [editId]);
```

### 3. 表单提交：新建与编辑分支

提交时根据模式调用不同 API，共用同一个提交函数。

#### Modal 弹窗表单

```typescript
const handleSubmit = async () => {
    try {
        const values = await form.validateFields();
        if (editingItem) {
            await editApi({ id: editingItem.id, ...values });
            message.success('编辑成功');
        } else {
            await addApi(values);
            message.success('新建成功');
        }
        setModalOpen(false);
        form.resetFields();
        setEditingItem(null);
        // 刷新列表
        setListParams((prev) => ({ ...prev }));
    } catch (error) {
        console.error('提交失败:', error);
    }
};
```

#### 独立路由表单页

```typescript
const [entityId, setEntityId] = useState<number | null>(editId ? Number(editId) : null);

const handleSave = async (status: number = 1): Promise<number | null> => {
    try {
        const values = await form.validateFields();
        if (!entityId) {
            const res = await addApi({ ...values, status });
            const newId = res?.result?.[0]?.id || null;
            if (newId) setEntityId(newId);
            return newId;
        } else {
            await editApi({ id: entityId, ...values });
            return entityId;
        }
    } catch (error) {
        console.error('保存失败:', error);
        return null;
    }
};
```

### 4. 表单验证

统一使用 `form.validateFields()` 进行验证，禁止手动 `if` 检查字段值。

```typescript
// ✅ 正确：声明式规则 + validateFields
<Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
    <Input placeholder="请输入名称" />
</Form.Item>

const handleSubmit = async () => {
    const values = await form.validateFields(); // 验证不通过会抛错，被 catch 捕获
    await addApi(values);
};

// ❌ 错误：手动检查
if (!name) {
    message.warning('请输入名称');
    return;
}
```

### 5. Modal 关闭与表单重置

关闭弹窗时必须重置表单和编辑状态，防止数据残留。

```typescript
const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingItem(null);
};

// Modal 配置
<Modal
    title={editingItem ? '编辑XXX' : '新建XXX'}
    open={modalOpen}
    onCancel={handleModalCancel}
    onOk={handleSubmit}
    destroyOnHidden
>
    <Form form={form} layout="horizontal" labelCol={{ span: 5 }}>
        ...
    </Form>
</Modal>
```

> **注意**：始终添加 `destroyOnHidden`，确保弹窗关闭后销毁内部组件状态。

### 6. 编辑模式数据回填

#### 简单场景：列表数据直接回填

```typescript
const handleEdit = (item: ItemType) => {
    setEditingItem(item);
    form.setFieldsValue({
        name: item.name,
        status: item.status,
    });
    setModalOpen(true);
};
```

#### 复杂场景：需要 API 获取详情 + 级联加载

```typescript
const loadDetail = async (id: number) => {
    setDetailLoading(true);
    try {
        const res = await detailApi({ id });
        const detail = res?.result?.[0];
        if (detail) {
            // 1. 先加载级联选项
            await dictCascadeRef.current?.loadCascadeOptions({
                scene_id: detail.scene_id,
                question_id: detail.question_id,
                project_id: detail.project_id,
            });
            // 2. 再设置表单值
            form.setFieldsValue({
                scene_id: detail.scene_id,
                question_id: detail.question_id,
                project_id: detail.project_id,
                // ...
            });
        }
    } finally {
        setDetailLoading(false);
    }
};
```

> **关键**：对于级联组件，必须先加载选项再设置值，否则 Select 无法匹配到对应选项。

### 7. 关联数据加载

下拉选项、级联选项等关联数据在组件挂载时加载，与表单提交逻辑分离。

```typescript
// 挂载时加载下拉选项
useEffect(() => {
    loadOptions();
    if (editId) {
        loadDetail(Number(editId));
    }
}, [editId]);

const loadOptions = async () => {
    try {
        const [optionsA, optionsB] = await Promise.all([
            optionApiA({ page: 1, page_size: 100 }),
            optionApiB({ page: 1, page_size: 100 }),
        ]);
        setOptionsA(optionsA?.result?.[0]?.data || []);
        setOptionsB(optionsB?.result?.[0]?.data || []);
    } catch (error) {
        console.error('加载选项失败:', error);
    }
};
```

### 8. 加载状态管理

保持加载状态精简，只区分必要的场景。

```typescript
// ✅ 正确：按场景区分
const [detailLoading, setDetailLoading] = useState(false);  // 编辑模式加载详情
const [submitLoading, setSubmitLoading] = useState(false);   // 提交中（可选，防止重复提交）

// ❌ 错误：状态过多
const [saveLoading, setSaveLoading] = useState(false);
const [publishLoading, setPublishLoading] = useState(false);
const [deleteLoading, setDeleteLoading] = useState(false);
const [debugLoading, setDebugLoading] = useState(false);
```

Modal 弹窗表单通常不需要独立的 `submitLoading`，antd Modal 的 `onOk` 支持返回 Promise 自动管理 loading。

### 9. 条件表单字段

根据模式或分类动态显隐字段时，使用条件渲染而非 CSS 隐藏。

```typescript
// ✅ 正确：条件渲染
{!editingItem && (
    <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password />
    </Form.Item>
)}

{category === 'specialized' && (
    <Form.Item label="项目明细" name="project_detail_id" rules={[{ required: true }]}>
        <Select ... />
    </Form.Item>
)}

// ❌ 错误：CSS 隐藏（会导致隐藏字段仍参与验证）
<Form.Item style={{ display: editingItem ? 'none' : 'block' }}>
    ...
</Form.Item>
```

## 两种表单模式对比

| 维度 | Modal 弹窗表单 | 独立路由表单页 |
|---|---|---|
| 适用场景 | 字段少（< 10 个）、逻辑简单 | 字段多、布局复杂、需要多面板 |
| 模式判断 | `editingItem` 是否为 `null` | URL 参数 `?id=xxx` |
| 表单状态 | `Form.useForm()` | `Form.useForm()`（复杂场景可搭配少量 `useState`） |
| 关闭/返回 | `setModalOpen(false)` + `form.resetFields()` | `navigate('/list-page')` |
| 列表刷新 | `setListParams((prev) => ({ ...prev }))` | 返回列表页自动重新挂载 |
| 详情加载 | 列表数据直接回填 / API 获取 | API 获取 + `useEffect` 监听 `editId` |
| Loading | Modal 自带 OK 按钮 loading | `<Spin spinning={detailLoading}>` 包裹页面 |

## 常见问题

### Q1: 表单字段的值应该用 useState 还是 Form 管理？

**A**: 优先 `Form.useForm()` 管理。Form 提供了验证、重置、回填等完整能力，用 `useState` 管理字段值会导致重复维护且无法利用 `validateFields`。仅在字段不属于表单提交数据（纯 UI 控制）时才用 `useState`。

### Q2: Modal 弹窗需要 destroyOnHidden 吗？

**A**: 需要。`destroyOnHidden` 确保弹窗关闭后内部组件被销毁，避免残留状态影响下次打开。配合 `form.resetFields()` 使用效果最佳。

### Q4: 独立路由表单页何时用"保存后留在当前页"vs"保存后跳转回列表"？

**A**: 取决于业务场景。如果保存后还需要继续操作（如调试、评测），保存后更新 `entityId` 留在当前页。如果是纯粹的新建/编辑，保存成功后跳转回列表页。
