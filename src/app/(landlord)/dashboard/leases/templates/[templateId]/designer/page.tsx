import { notFound } from "next/navigation";
import { getLeaseTemplate } from "@/lib/services/leaseTemplates";
import { listTemplateFields, checkTemplateReadiness } from "@/lib/services/leaseTemplateFields";
import { FieldDesigner } from "./FieldDesigner";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ templateId: string }>;
}

export default async function FieldDesignerPage({ params }: PageProps) {
  const { templateId } = await params;

  const [templateResult, fieldsResult, readinessResult] = await Promise.all([
    getLeaseTemplate(templateId),
    listTemplateFields(templateId),
    checkTemplateReadiness(templateId),
  ]);

  if (templateResult.error !== null || !templateResult.data) {
    notFound();
  }

  const template = templateResult.data;
  const fields = fieldsResult.data ?? [];
  const readiness = readinessResult.data ?? {
    ready: false,
    hasSignature: false,
    fieldCount: 0,
  };

  return (
    <FieldDesigner
      template={template}
      initialFields={fields}
      readiness={readiness}
    />
  );
}
