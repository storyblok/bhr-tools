import { z } from "zod";

export class BHR {
	apiKey: string;
	companyDomain: string;
	headers: Headers;
	baseUrl: string;

	constructor(apiKey: string, companyDomain: string) {
		this.apiKey = apiKey;
		this.companyDomain = companyDomain;
		this.headers = new Headers({
			"Content-Type": "application/json",
			accept: "application/json",
			authorization: `Basic ${Buffer.from(`${apiKey}:x`).toString("base64")}`,
		});
		this.baseUrl = `https://api.bamboohr.com/api/gateway.php/${companyDomain}`;
	}
	/**
	 * Get a custom report
	 * @param fields array of fields to include in the report
	 * @param schema zod schema for the employees array.
	 * @returns Fully typed report
	 */
	async getCustomReport<T extends z.ZodTypeAny>(fields: string[], schema?: T) {
		const employeeSchema = schema ?? z.unknown();
		const res = await fetch(`${this.baseUrl}/v1/reports/custom?format=json`, {
			body: JSON.stringify({ fields }),
			headers: this.headers,
			method: "POST",
		});
		const report = reportSchema
			.extend({ employees: employeeSchema.array() })
			.parse(await res.json());
		return report;
	}

	/**
	 * Get a standard report
	 *
	 * Does not work for reportIds that are negative.
	 *
	 * @param reportId The ID of the report.
	 * @param schema zod schema for the employees array.
	 * @returns Fully typed report
	 */
	async getReport<T extends z.ZodTypeAny>(
		reportId: string | number,
		schema: T,
	) {
		const res = await fetch(
			`${this.baseUrl}/v1/reports/${reportId}?format=json`,
			{
				method: "GET",
				headers: this.headers,
			},
		);
		const report = reportSchema
			.extend({ employees: schema.array() })
			.parse(await res.json());
		return report;
	}

	/**
	 * Get the changed rows of a table since a certain date.
	 *
	 * @param tableName The table name.
	 * @param schema zod schema for the columns.
	 * @param since Results will be limited to just the employees that have changed since the time you provide.
	 * Operates on an employee-last-changed-timestamp, which means that a change in ANY field in the
	 * employee record will cause ALL of that employees table rows to show up
	 * @returns typed table
	 */
	async getTable<T extends z.ZodTypeAny>(
		tableName: string,
		since: Date,
		schema: T,
	) {
		const tableSchema = z.object({
			table: z.string(),
			employees: z.record(
				z.string(),
				z.object({
					lastChanged: z.coerce.date(),
					rows: z.array(schema),
				}),
			),
		});

		const res = await fetch(
			`${this.baseUrl}/v1/employees/changed/tables/${tableName}?since=${since
				.toISOString()
				.replace(/\.[0-9]{3}/, "")}&format=json`,
			{
				method: "GET",
				headers: this.headers,
			},
		);
		const table = tableSchema.parse(await res.json());
		return table;
	}
}

const reportSchema = z.object({
	title: z.string(),
	fields: z.array(
		z.object({
			id: z.coerce.string(),
			name: z.string(),
		}),
	),
	employees: z.array(z.unknown()),
});

export const bhrDate = z
	.string()
	.transform((dateString) =>
		dateString === "0000-00-00" ? null : z.coerce.date().parse(dateString),
	);
