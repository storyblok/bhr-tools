---
'bhr-tools': major
---

revert not requiring schema as it broke proper type inferrence

The previous attempt at making the schema parameter optional resulted in return types being unioned with `unknown`.

Before:

```js
const report = await bhr.getReport('id', z.object({ id: z.string() }));
report.employees;
//     ^ unknown[] | { id: string }[]
```

After:

```js
const report = await bhr.getReport('id', z.object({ id: z.string() }));
report.employees;
//     ^ { id: string }[]
```

## Migration

If using `getReport` `getCustomReport` or `getTable` without passing a schema, pass in `z.unknown()` manually.

Before:

```js
const report = await bhr.getReport('id');
```

After:

```js
const report = await bhr.getReport('id', z.unknown());
```
