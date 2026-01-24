/**
 * School definitions for EWF-ID
 * Maps schools to their OIDC providers and domains
 */

export interface School {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  oidcProvider: "iserv" | "moodle";
  logoUrl?: string;
  website?: string;
}

export const schools: Record<string, School> = {
  athenaeum: {
    id: "athenaeum",
    name: "Gymnasium Athenaeum Stade",
    shortName: "Athenaeum",
    domain: "athenetz.de",
    oidcProvider: "iserv",
    website: "https://www.gymnasium-athenaeum.de",
  },
  vlg: {
    id: "vlg",
    name: "Vincent Lübeck Gymnasium",
    shortName: "VLG",
    domain: "vlg-stade.de",
    oidcProvider: "moodle",
    website: "https://www.vlg-stade.de",
  },
  igs: {
    id: "igs",
    name: "Integrierte Gesamtschule Stade",
    shortName: "IGS",
    domain: "igs-stade.net",
    oidcProvider: "iserv",
    website: "https://www.igs-stade.de",
  },
  ewf: {
    id: "ewf",
    name: "Erstwähler Forum Stade",
    shortName: "EWF",
    domain: "ewf-stade.de",
    oidcProvider: "iserv", // Admin domain
    website: "https://www.ewf-stade.de",
  },
};

/**
 * Get school by email domain
 */
export function getSchoolByEmail(email: string): School | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  for (const school of Object.values(schools)) {
    if (domain === school.domain || domain.endsWith(`.${school.domain}`)) {
      return school;
    }
  }

  return null;
}

/**
 * Get school by ID
 */
export function getSchoolById(id: string): School | null {
  return schools[id] || null;
}

/**
 * Get default role for a school domain
 * Students get "student", @ewf-stade.de gets "admin"
 */
export function getDefaultRoleForDomain(email: string): string {
  const domain = email.split("@")[1]?.toLowerCase();
  
  if (!domain) return "student";
  
  // EWF domain gets admin role
  if (domain === "ewf-stade.de") {
    return "admin";
  }
  
  // School domains - check if it's a teacher email
  // Teachers typically have format: firstname.lastname@school.de
  // Students have format: firstname.lastname.year@school.de or similar
  // This is a heuristic and can be adjusted
  const localPart = email.split("@")[0];
  const parts = localPart.split(".");
  
  // If the email has a year/number at the end, likely a student
  if (parts.length > 2 && /\d{2,4}/.test(parts[parts.length - 1])) {
    return "student";
  }
  
  // Default to student for safety, teachers should be promoted manually
  return "student";
}
