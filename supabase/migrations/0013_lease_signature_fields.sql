-- Migration: Lease Signature Fields
-- Adds columns for storing signature placements and the stamped/signed PDF path.
-- signature_fields: JSONB array of {type, page, x, y, width, height} (fractions 0-1)
-- signed_file_path: path to the PDF with signatures stamped onto it

alter table public.lease_documents
  add column if not exists signature_fields jsonb,
  add column if not exists signed_file_path text;

comment on column public.lease_documents.signature_fields is
  'Array of signature field placements: [{type: "landlord"|"tenant", page: number, x: number, y: number, width: number, height: number}]. Coordinates are fractions (0-1) of page dimensions.';

comment on column public.lease_documents.signed_file_path is
  'Path to the PDF with signatures stamped onto it (in lease-documents bucket).';
