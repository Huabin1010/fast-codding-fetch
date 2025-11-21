---
trigger: always_on
---

使用server action

2. **标准 CRUD 模块结构**

   ```
   /app/admin/{module}/
     ├── page.tsx          # DataViewProvider + DataViewTable
     ├── actions.ts        # create, update, remove, getList (使用工厂函数)
     ├── columns.tsx       # createColumnHelper + 列定义
     ├── schema.ts         # Zod schemas + 类型推断
     ├── create-form.tsx   # ServerActionForm
     └── update-form.tsx   # ServerActionForm
   ```