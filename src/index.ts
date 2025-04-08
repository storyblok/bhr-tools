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
	 * @param options additional options to pass as url parameters
	 * @returns Fully typed report
	 */
	async getCustomReport<T extends z.ZodTypeAny>(
		fields: string[],
		schema: T,
		options?: { onlyCurrent: boolean },
	) {
		const params = new URLSearchParams({
			format: "json",
			onlyCurrent: (options?.onlyCurrent ?? true) ? "1" : "0",
		});
		const res = await fetch(`${this.baseUrl}/v1/reports/custom?${params}`, {
			body: JSON.stringify({ fields }),
			headers: this.headers,
			method: "POST",
		});
		const report = BHR.reportSchema
			.extend({ employees: schema.array() })
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
	 * @param options additional options to pass as url parameters
	 * @returns Fully typed report
	 */
	async getReport<T extends z.ZodTypeAny>(
		reportId: string | number,
		schema: T,
		options?: { onlyCurrent?: boolean; filterDuplicates?: boolean },
	) {
		const params = new URLSearchParams({
			format: "json",
			onlyCurrent: (options?.onlyCurrent ?? true) ? "1" : "0",
			fd: (options?.filterDuplicates ?? true) ? "yes" : "no",
		});
		const res = await fetch(
			`${this.baseUrl}/v1/reports/${reportId}?${params}`,
			{
				method: "GET",
				headers: this.headers,
			},
		);
		const report = BHR.reportSchema
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

	/**
	 * Retrieve available datasets.
	 *
	 * @returns Dataset Index
	 */
	async getDatasets() {
		const datasetIndexSchema = z
			.object({
				datasets: z.object({
					name: z.string(),
					label: z.string(),
				}),
			})
			.array();

		const res = await fetch(`${this.baseUrl}/v1/datasets`, {
			method: "GET",
			headers: this.headers,
		});
		const datasetIndex = datasetIndexSchema.parse(await res.json());
		return datasetIndex;
	}

	/**
	 * Retrieve fields available in a dataset.
	 *
	 * @param datasetName Name of the dataset, as reported by {@link getDatasets}
	 * @param page Page parameter for pagination, defaults to first page (page 1)
	 * @param pageSize Maximum number of fields returned per page. Default 500, Max 1000
	 *
	 * @returns Dataset Fields
	 */
	async getDatasetFields(
		datasetName: string,
		page?: number,
		pageSize?: number,
	) {
		const params = new URLSearchParams({});
		if (page) {
			params.append("page", page.toString());
		}
		if (pageSize) {
			params.append("page_size", pageSize.toString());
		}

		const datasetFieldIndexSchema = z.object({
			pagination: paginationSchema,
			name: z.string(),
			label: z.string(),
			fields: z
				.object({
					name: z.string(),
					label: z.string(),
					parentType: z.string(),
					parentName: z.string(),
				})
				.array(),
		});

		const res = await fetch(
			`${this.baseUrl}/v1/datasets/${datasetName}/fields?${params.toString()}`,
			{
				method: "GET",
				headers: this.headers,
			},
		);
		const datasetFields = datasetFieldIndexSchema.parse(await res.json());

		return datasetFields;
	}

	/**
	 * Get entries from a Dataset
	 *
	 * **Note**: The dataset API does not seem stable as of 2025-04-08.
	 * Especially filters, groupBy, aggregations and sortBy do not seem to be behaving as documented.
	 *
	 * @param datasetName Name of the dataset, as reported by {@link getDatasets}
	 * @param options.fields List of field names to retrieve from the dataset.
	 * @param options.aggregations Aggregations to apply to fields
	 * @param options.sortBy Sorting of result set
	 * @param options.groupBy Grouping of result set
	 * @param options.filters Result set filters
	 * @param options.pageSize Maximum number of records returned per page. Default 500, Max 1000
	 * @param options.groupBy Page parameter for pagination, defaults to first page (page 1)
	 * @param schema zod schema for the indiviual returned objects in the response `data` array.
	 * @returns typed dataset
	 */
	async getDataset<T extends z.ZodTypeAny>(
		datasetName: string,
		options: {
			fields: string[];
			aggregations?: Aggregation[];
			sortBy?: Sort[];
			filters?: Filter;
			groupBy?: Group;
			pageSize?: number;
			page?: number;
		},
		schema: T,
	) {
		const params = new URLSearchParams({});
		if (options.page) {
			params.append("page", options.page.toString());
		}
		if (options.pageSize) {
			params.append("page_size", options.pageSize.toString());
		}

		const datasetSchema = z.object({
			data: schema.array(),
			aggregations: z
				.object({
					field: z.string(),
					aggregationType: z.string(),
					all: z.number(),
				})
				.array(),
			pagination: paginationSchema,
		});

		const res = await fetch(
			`${this.baseUrl}/v1/datasets/${datasetName}?${params.toString()}`,
			{
				method: "POST",
				body: JSON.stringify(options),
				headers: this.headers,
			},
		);
		const dataset = datasetSchema.parse(await res.json());
		return dataset;
	}

	static reportSchema = z.object({
		title: z.string(),
		fields: z.array(
			z.object({
				id: z.coerce.string(),
				name: z.string(),
			}),
		),
		employees: z.array(z.unknown()),
	});
}

export const bhrDate = z
	.string()
	.transform((dateString) =>
		dateString === "0000-00-00" ? null : z.coerce.date().parse(dateString),
	);

const paginationSchema = z.object({
	total_records: z.number(),
	current_page: z.number(),
	total_pages: z.number(),
	next_page: z.string().nullable(),
	previous_page: z.string().nullable(),
});

type Aggregation = {
	field: string;
	aggregation: "count" | "sum" | "avg" | "min" | "max";
};

type Sort = {
	field: string;
	sort: "asc" | "desc";
};

type Filter = {
	match: "any" | "all";
	filters: {
		field: string;
		operator:
			| "contains"
			| "does_not_contain"
			| "equal"
			| "not_equal"
			| "empty"
			| "not_empty"
			| "lt"
			| "lte"
			| "gt"
			| "gte"
			| "last"
			| "next"
			| "range"
			| "checked"
			| "not_checked"
			| "includes"
			| "does_not_include";
		value: string;
	};
};

type Group = string[];
