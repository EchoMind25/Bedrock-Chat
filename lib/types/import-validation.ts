/**
 * Types for the import validation system.
 *
 * Used by the /api/import/validate route and the ValidationResults UI component.
 */

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  type: string;
}

export interface ValidationSummary {
  categories: number;
  channels: { text: number; voice: number; announcement: number };
  roles: number;
  family_safe: boolean;
  source: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary | null;
  sanitized: boolean;
  sanitize_changes: string[];
}
