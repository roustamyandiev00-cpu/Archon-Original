export type ImportEntity = "customers" | "offertes" | "facturen" | "leads";

export type CrmPreset =
  | "generic"
  | "teamleader"
  | "hubspot"
  | "pipedrive"
  | "billit"
  | "exact"
  | "salesforce";

export type ImportField = {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
};

export type ParsedImportFile = {
  headers: string[];
  rows: Record<string, string>[];
  format: "csv" | "json" | "tsv";
};

export type ImportMapping = Record<string, string | null>;

export type ImportPreviewRow = {
  index: number;
  values: Record<string, string>;
  valid: boolean;
  issues: string[];
};

export type ImportResult = {
  ok: true;
  imported: number;
  skipped: number;
  errors: string[];
  createdCustomers?: number;
};
