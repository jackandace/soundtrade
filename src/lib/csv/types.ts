export type JobType = "shopify_csv" | "split_csv";

export type ProductRow = {
  rowNumber: number;
  handle: string;
  sku_base: string;
  product_name: string | null;
  maker: string | null;
  category_l1: string | null;
  category_l2: string | null;
  category_l3: string | null;
  description_short: string | null;
  description_long: string | null;
  body_html: string | null;
  msrp: number | null;
  msrp_incl_tax: number | null;
  status: string | null;
  tags: string | null;
  seo_title: string | null;
  seo_description: string | null;
  catalog_year: string | null;
};

export type VariantRow = {
  rowNumber: number;
  handle: string;
  variant_sku: string;
  variant_name: string | null;
  msrp_variant: number | null;
  stock_status: string | null;
  stock_qty: number | null;
  sort_order: number | null;
};

export type SpecRow = {
  rowNumber: number;
  handle: string;
  spec_key: string;
  spec_label: string | null;
  spec_value: string | null;
  spec_group: string | null;
  sort_order: number | null;
  is_filterable: boolean | null;
};

export type ValidationIssue = {
  severity: "error" | "warning" | "info";
  code: string;
  rowNumber: number | null;
  fieldName: string | null;
  fieldValue: string | null;
  message: string;
  suggestion: string | null;
  handle: string | null;
};

export type ParsedImport = {
  jobType: JobType;
  products: ProductRow[];
  variants: VariantRow[];
  specs: SpecRow[];
  schemaIssues: ValidationIssue[];
};
