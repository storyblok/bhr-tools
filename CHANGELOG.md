# bhr-tools

## 2.1.0

### Minor Changes

- 7af43b5: Add option to report functions to get future-dated employees (`onlyCurrent`)

## 2.0.0

### Major Changes

- 6d8605f: revert not requiring schema as it broke proper type inferrence

  The previous attempt at making the schema parameter optional resulted in return types being unioned with `unknown`.

  Before:

  ```js
  const report = await bhr.getReport("id", z.object({ id: z.string() }));
  report.employees;
  //     ^ unknown[] | { id: string }[]
  ```

  After:

  ```js
  const report = await bhr.getReport("id", z.object({ id: z.string() }));
  report.employees;
  //     ^ { id: string }[]
  ```

  ## Migration

  If using `getReport` `getCustomReport` or `getTable` without passing a schema, pass in `z.unknown()` manually.

  Before:

  ```js
  const report = await bhr.getReport("id");
  ```

  After:

  ```js
  const report = await bhr.getReport("id", z.unknown());
  ```

### Patch Changes

- c7a8e82: Add missing release script
- 965b55b: Add full documentation to README.
