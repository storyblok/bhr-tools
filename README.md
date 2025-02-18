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
```

### `getCustomReport()`

Get a custom report from BambooHR.

First parameter is an array of fields to include in the report.

Second parameter zod schema for the employees array. Pass `z.unknown()` if you don't need to validate the employees array.

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
