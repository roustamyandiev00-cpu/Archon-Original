export type DocumentType = 'proforma' | 'invoice';

export type DocumentStatus =
  | 'draft'
  | 'sent'
  | 'review'
  | 'accepted'
  | 'paid'
  | 'cancelled'
  | 'merged'
  | 'archived';

export interface DocumentLine {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  total?: number;
}

export interface Document {
  id?: number;
  company_id: string;
  customer_id?: number | null;
  reference_number?: string | null;
  document_type: DocumentType;
  status: DocumentStatus;
  date?: string; // ISO date
  due_date?: string | null;
  subtotal?: number;
  tax?: number;
  total?: number;
  quarter?: number | null;
  period_start?: string | null;
  period_end?: string | null;
  lines?: DocumentLine[];
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}
