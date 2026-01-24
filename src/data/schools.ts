/**
 * School definitions for EWF-ID
 * Each school has OIDC provider configuration
 */

export interface School {
	id: string;
	name: string;
	shortName: string;
	emailDomain: string;
	oidcProvider: "iserv" | "moodle";
	defaultRole: "student" | "teacher";
}

export const schools: Record<string, School> = {
	athenaeum: {
		id: "athenaeum",
		name: "Gymnasium Athenaeum Stade",
		shortName: "Athenaeum",
		emailDomain: "athenetz.de",
		oidcProvider: "iserv",
		defaultRole: "student",
	},
	vlg: {
		id: "vlg",
		name: "Vincent Lübeck Gymnasium",
		shortName: "VLG",
		emailDomain: "vlg-stade.de",
		oidcProvider: "moodle",
		defaultRole: "student",
	},
	igs: {
		id: "igs",
		name: "Integrierte Gesamtschule Stade",
		shortName: "IGS",
		emailDomain: "igs-stade.net",
		oidcProvider: "iserv",
		defaultRole: "student",
	},
	ewf: {
		id: "ewf",
		name: "Erstwähler Forum",
		shortName: "EWF",
		emailDomain: "ewf-stade.de",
		oidcProvider: "iserv", // Internal
		defaultRole: "teacher", // EWF staff are at least teachers
	},
};

/**
 * Map email domain to school
 */
export function getSchoolFromEmail(email: string): School | null {
	const domain = email.split("@")[1]?.toLowerCase();
	if (!domain) return null;

	for (const school of Object.values(schools)) {
		if (school.emailDomain === domain) {
			return school;
		}
	}
	return null;
}

/**
 * Validate if email domain is allowed
 */
export function isAllowedEmailDomain(email: string): boolean {
	return getSchoolFromEmail(email) !== null;
}

/**
 * Get all allowed email domains
 */
export function getAllowedEmailDomains(): string[] {
	return Object.values(schools).map((s) => s.emailDomain);
}
