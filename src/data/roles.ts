/**
 * Role definitions for EWF-ID
 * Implements hierarchical RBAC as per SPEC.md §4.5
 */

export type RoleId = "admin" | "team" | "teacher" | "student";

export interface Role {
	id: RoleId;
	name: string;
	nameDE: string;
	description: string;
	descriptionDE: string;
	level: number; // Higher = more privileges
	inheritsFrom: RoleId | null;
}

/**
 * Role hierarchy:
 * Admin (level 4) > Team (level 3) > Teacher (level 2) > Student (level 1)
 */
export const roles: Record<RoleId, Role> = {
	student: {
		id: "student",
		name: "Student",
		nameDE: "Schüler",
		description: "Basic access to public events",
		descriptionDE: "Grundlegender Zugang zu öffentlichen Veranstaltungen",
		level: 1,
		inheritsFrom: null,
	},
	teacher: {
		id: "teacher",
		name: "Teacher",
		nameDE: "Lehrer",
		description: "School-specific permissions and student oversight",
		descriptionDE: "Schulspezifische Berechtigungen und Schüleraufsicht",
		level: 2,
		inheritsFrom: "student",
	},
	team: {
		id: "team",
		name: "Team Member",
		nameDE: "Teammitglied",
		description: "Access to team-specific applications and event management",
		descriptionDE: "Zugang zu Team-Anwendungen und Veranstaltungsmanagement",
		level: 3,
		inheritsFrom: "teacher",
	},
	admin: {
		id: "admin",
		name: "Administrator",
		nameDE: "Administrator",
		description: "Full system access and user management",
		descriptionDE: "Vollständiger Systemzugang und Benutzerverwaltung",
		level: 4,
		inheritsFrom: "team",
	},
};

/**
 * Get role by ID
 */
export function getRole(roleId: RoleId): Role {
	return roles[roleId];
}

/**
 * Check if a role has at least the minimum required level
 */
export function hasMinimumRole(userRole: RoleId, requiredRole: RoleId): boolean {
	return roles[userRole].level >= roles[requiredRole].level;
}

/**
 * Get all roles that a user with the given role has access to (via inheritance)
 */
export function getInheritedRoles(roleId: RoleId): RoleId[] {
	const result: RoleId[] = [roleId];
	let current = roles[roleId];

	while (current.inheritsFrom) {
		result.push(current.inheritsFrom);
		current = roles[current.inheritsFrom];
	}

	return result;
}

/**
 * Get all role IDs
 */
export function getAllRoleIds(): RoleId[] {
	return Object.keys(roles) as RoleId[];
}
