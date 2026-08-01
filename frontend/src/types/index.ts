export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
  storage_used_bytes: number;
  document_count: number;
  created_at: string;
}

export type DocumentCategory =
  | 'Blood Report'
  | 'Prescription'
  | 'X-Ray / Scan'
  | 'Lab Report'
  | 'Discharge Summary'
  | 'Doctor Note'
  | 'Medical Bill'
  | 'Other';

export interface MedicalEntity {
  text: string;
  category: string;
  confidence: number;
  explanation?: string;
  normal_range?: string;
  status?: string;
}

export interface OCRData {
  extracted_text: string;
  confidence: number;
  page_count: number;
  processed_at: string;
}

export interface AISummaryData {
  overview: string;
  key_findings: string[];
  abnormal_values: { parameter: string; value: string; meaning: string }[];
  medications_mentioned: { name: string; purpose: string }[];
  patient_actions: string[];
  questions_for_doctor: string[];
  medical_disclaimer: string;
}

export interface Document {
  id: string;
  owner_id: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  category: DocumentCategory;
  tags: string[];
  is_favorite: boolean;
  blob_url: string;
  uploaded_at: string;
  ocr_data?: OCRData;
  entities: MedicalEntity[];
  ai_summary?: AISummaryData;
  indexed_in_search: boolean;
}

export type ConsentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' | 'EXPIRED';

export interface AccessRequest {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  patient_id: string;
  patient_email: string;
  document_id?: string;
  document_name?: string;
  reason: string;
  status: ConsentStatus;
  duration_hours: number;
  created_at: string;
  approved_at?: string;
  expires_at?: string;
  revoked_at?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performed_by_id: string;
  performed_by_name: string;
  performed_by_role: string;
  target_patient_id: string;
  document_id?: string;
  document_name?: string;
  reason?: string;
  ip_address: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface SourceCitation {
  document_id: string;
  document_name: string;
  category: string;
  snippet: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations: SourceCitation[];
}

export interface ReportComparisonResponse {
  document_1: Document;
  document_2: Document;
  diff_summary: string;
  improved_metrics: string[];
  worsened_metrics: string[];
  stable_metrics: string[];
  recommendations: string[];
  medical_disclaimer: string;
}

export interface PlatformMetrics {
  platform_status: string;
  total_users: number;
  patients_count: number;
  admins_count: number;
  total_documents_indexed: number;
  total_storage_used_bytes: number;
  total_storage_used_mb: number;
  pending_consent_requests: number;
  active_approved_consent_requests: number;
  total_security_audit_events: number;
  azure_services_status: Record<string, string>;
}
