import "server-only";
import type {
  LeaseTemplateWithProperty,
  LeaseStayType,
  CommuterStatus,
} from "@/lib/types";
import type { ApplicationWithRefs } from "@/lib/services/applications";

// ---------------------------------------------------------------------------
// Types for matching results
// ---------------------------------------------------------------------------

export type MatchStatus =
  | "matched"           // Single ready template matched
  | "multiple_matches"  // Multiple ready templates match
  | "no_match"          // No ready templates match
  | "needs_setup";      // Matching template exists but needs field setup

export interface TemplateMatch {
  template: LeaseTemplateWithProperty;
  score: number;
  matchReasons: string[];
}

export interface ApplicantMatchResult {
  application: ApplicationWithRefs;
  status: MatchStatus;
  matches: TemplateMatch[];
  bestMatch: TemplateMatch | null;
  needsSetupTemplates: LeaseTemplateWithProperty[];
}

// ---------------------------------------------------------------------------
// Commuter status to stay type mapping
// ---------------------------------------------------------------------------

const COMMUTER_TO_STAY_TYPE: Partial<Record<CommuterStatus, LeaseStayType[]>> = {
  travel_nurse: ["travel_nurse_housing", "midterm", "short_term"],
  airline_crew: ["crash_pad", "short_term", "bed_rental"],
  student: ["student_housing", "yearly", "midterm"],
  local_resident: ["month_to_month", "yearly", "room_rental"],
  contract_worker: ["midterm", "short_term", "month_to_month"],
  out_of_state_commuter: ["crash_pad", "short_term", "bed_rental"],
  weekly_commuter: ["crash_pad", "short_term", "bed_rental"],
  temporary_relocation: ["midterm", "short_term", "month_to_month"],
  other: ["month_to_month", "room_rental"],
};

// ---------------------------------------------------------------------------
// Length of stay text parsing
// ---------------------------------------------------------------------------

function parseStayTypeFromLength(lengthOfStay: string | null): LeaseStayType[] {
  if (!lengthOfStay) return [];

  const lower = lengthOfStay.toLowerCase();
  const types: LeaseStayType[] = [];

  // Check for specific patterns
  if (/week|1-2 weeks|few days/i.test(lower)) {
    types.push("short_term", "crash_pad", "bed_rental");
  } else if (/1\s*-?\s*3\s*months?|short/i.test(lower)) {
    types.push("short_term", "midterm");
  } else if (/3\s*-?\s*6\s*months?|midterm|medium/i.test(lower)) {
    types.push("midterm");
  } else if (/6\s*-?\s*12\s*months?|year/i.test(lower)) {
    types.push("yearly", "month_to_month");
  } else if (/month\s*to\s*month|ongoing|indefinite/i.test(lower)) {
    types.push("month_to_month");
  } else if (/long\s*term/i.test(lower)) {
    types.push("yearly", "month_to_month");
  }

  return types;
}

// ---------------------------------------------------------------------------
// Property type to stay type mapping
// ---------------------------------------------------------------------------

function getStayTypesFromPropertyType(propertyType: string | null): LeaseStayType[] {
  switch (propertyType) {
    case "crash_pad":
      return ["crash_pad", "short_term", "bed_rental"];
    case "co_living":
      return ["month_to_month", "room_rental", "midterm"];
    case "midterm":
      return ["midterm", "short_term"];
    case "room_rental":
      return ["room_rental", "month_to_month", "yearly"];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Matching logic
// ---------------------------------------------------------------------------

function calculateMatchScore(
  application: ApplicationWithRefs,
  template: LeaseTemplateWithProperty
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Property match (highest priority: 100 points)
  if (template.property_id && application.property_id === template.property_id) {
    score += 100;
    reasons.push("Property match");
  }

  // 2. Stay type match from commuter status (50 points)
  if (application.commuter_status) {
    const inferredStayTypes = COMMUTER_TO_STAY_TYPE[application.commuter_status] ?? [];
    if (inferredStayTypes.includes(template.stay_type)) {
      score += 50;
      reasons.push(`Commuter type (${application.commuter_status}) matches template stay type`);
    }
  }

  // 3. Stay type match from length of stay text (40 points)
  const lengthStayTypes = parseStayTypeFromLength(application.length_of_stay);
  if (lengthStayTypes.includes(template.stay_type)) {
    score += 40;
    reasons.push(`Length of stay matches template stay type`);
  }

  // 4. Generic template (no property_id) is a weak match (10 points)
  if (!template.property_id) {
    score += 10;
    reasons.push("Generic template (all properties)");
  }

  // 5. Category-based bonus for commuter types (20 points)
  if (application.commuter_status === "travel_nurse" &&
      template.lease_category === "travel_nurse_housing_agreement") {
    score += 20;
    reasons.push("Travel nurse category match");
  }
  if (application.commuter_status === "airline_crew" &&
      template.lease_category === "crash_pad_agreement") {
    score += 20;
    reasons.push("Airline crew / crash pad category match");
  }
  if (application.commuter_status === "student" &&
      template.lease_category === "student_housing_agreement") {
    score += 20;
    reasons.push("Student housing category match");
  }

  return { score, reasons };
}

/**
 * Match a single application against available templates.
 */
export function matchApplicationToTemplates(
  application: ApplicationWithRefs,
  templates: LeaseTemplateWithProperty[]
): ApplicantMatchResult {
  // Separate ready templates from needs_setup templates
  const readyTemplates = templates.filter((t) => t.status === "ready");
  const needsSetupTemplates = templates.filter((t) => t.status === "needs_setup");

  // Calculate scores for all ready templates
  const matches: TemplateMatch[] = readyTemplates
    .map((template) => {
      const { score, reasons } = calculateMatchScore(application, template);
      return { template, score, matchReasons: reasons };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  // Determine status and best match
  let status: MatchStatus;
  let bestMatch: TemplateMatch | null = null;

  if (matches.length === 0) {
    // Check if there are needs_setup templates that would match
    const potentialSetupMatches = needsSetupTemplates.filter((t) => {
      const { score } = calculateMatchScore(application, t);
      return score > 0;
    });

    if (potentialSetupMatches.length > 0) {
      status = "needs_setup";
    } else {
      status = "no_match";
    }
  } else if (matches.length === 1) {
    status = "matched";
    bestMatch = matches[0];
  } else {
    // Multiple matches - check if one is clearly better
    const topScore = matches[0].score;
    const sameScoreCount = matches.filter((m) => m.score === topScore).length;

    if (sameScoreCount === 1) {
      // One clear winner
      status = "matched";
      bestMatch = matches[0];
    } else {
      // Multiple templates with same top score
      status = "multiple_matches";
      bestMatch = matches[0]; // Still show the first as default
    }
  }

  // Find needs_setup templates that would be relevant for this application
  const relevantNeedsSetup = needsSetupTemplates.filter((t) => {
    const { score } = calculateMatchScore(application, t);
    return score > 0;
  });

  return {
    application,
    status,
    matches,
    bestMatch,
    needsSetupTemplates: relevantNeedsSetup,
  };
}

/**
 * Match all applications against available templates.
 */
export function matchAllApplicationsToTemplates(
  applications: ApplicationWithRefs[],
  templates: LeaseTemplateWithProperty[]
): ApplicantMatchResult[] {
  return applications.map((app) => matchApplicationToTemplates(app, templates));
}

// ---------------------------------------------------------------------------
// Helper to get inferred stay type for display
// ---------------------------------------------------------------------------

export function getInferredStayType(application: ApplicationWithRefs): string | null {
  // Try commuter status first
  if (application.commuter_status) {
    const stayTypes = COMMUTER_TO_STAY_TYPE[application.commuter_status];
    if (stayTypes && stayTypes.length > 0) {
      return stayTypes[0];
    }
  }

  // Try length of stay
  const lengthTypes = parseStayTypeFromLength(application.length_of_stay);
  if (lengthTypes.length > 0) {
    return lengthTypes[0];
  }

  return null;
}
