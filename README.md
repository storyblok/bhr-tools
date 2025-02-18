# BambooHR

This is an unofficial library that wraps the BambooHR® API.
The focus is on providing type safe reports and table contents using [zod](https://zod.dev).

## Installation

Install the package with:

```sh
npm i bhr-tools
```

## Usage

The package needs to be configured with your account's apiKey and company domain.
Find instructions on how to find/create them in the [official documentation](https://documentation.bamboohr.com/docs/getting-started).

```js
import { BHR, bhrDate } from 'bhr-tools';
import { z } from 'zod'; // zod is used to validate and parse responses

const bhr = new BHR('apiKey', 'companyDomain');

const report = await bhr.getCustomReport(
  ['id', 'jobTitle', 'terminationDate'],
  z.object({
    id: z.string(),
    jobTitle: z.string().nullable(),
    terminationDate: bhrDate.nullable(), // coerce BambooHR's date strings into date objects
  })
);

console.log(report.employees);
//          ^ fully typed now
```

If no schema is provided to the provided functions, the return value will be typed as `unknown` for you to validate yourself.

### Standard Reports

```js
const report = await bhr.getReport(
  42, // report with id 42
  z.object({
    id: z.string(),
    jobTitle: z.string().nullable(),
  })
);
```

### Custom Reports

```js
const report = await bhr.getCustomReport(
  ['id', 'jobTitle'],
  z.object({
    id: z.string(),
    jobTitle: z.string().nullable(),
  })
);
```

### Tables

```js
const report = await bhr.getTable(
  'compensation',
  z.object({
    id: z.string(),
    employeeId: z.string(),
    type: z.string(),
    rate: z.object({
      currency: z.string(),
      value: z.coerce.number(),
    }),
  })
);
```

### Dates

In situations where the API may return dates in the format `0000-00-00`, the exported `bhrDate` zod schema can be used for your schemas.

```js
import { BHR, bhrDate } from 'bhr-tools';
import { z } from 'zod';

const bhr = new BHR('apiKey', 'companyDomain');

const report = await bhr.getCustomReport(
  ['id', 'terminationDate'],
  z.object({
    id: z.string(),
    terminationDate: bhrDate.nullable(), // coerce BambooHR's date strings into date objects
  })
);
```

## Development

### Build

Clone the repository and run

```sh
pnpm i
pnpm build
```

### Changesets

When issuing a PR, add a changeset describing what was changed and what kind of change it is.

```sh
pnpm changeset
```

## Legal

BambooHR® is a registered trademark of Bamboo HR LLC. This package is not affiliated or endorsed by BambooHR.
