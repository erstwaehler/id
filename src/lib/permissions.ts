/**
 * EWF-ID Access Control Configuration
 * Implements SPEC.md §4.5 - Roles & Permissions
 */
import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	userAc,
} from "better-auth/plugins/admin/access";

/**
 * Custom statements for EWF-ID RBAC
 * Format: resource:action or app:resource:action
 */
const statement = {
	...defaultStatements,

	// Internal system permissions
	oidcp_role: ["team", "admin"],
	allowed_apps: [
		"ewf-id",
		"ewf-dashboard",
		"schedule",
		"vote",
		"live",
		"screens",
	],

	// Schedule app permissions
	"schedule:access": ["student", "teacher", "team", "admin"],
	"schedule:event:view": ["student", "teacher", "team", "admin"],
	"schedule:event:view:draft": ["team", "admin"],
	"schedule:event:create": ["team", "admin"],
	"schedule:event:edit": ["team", "admin"],
	"schedule:event:delete": ["team", "admin"],
	"schedule:event:delete:any": ["admin"],
	"schedule:event:publish": ["team", "admin"],
	"schedule:rsvp:create": ["student", "teacher", "team", "admin"],
	"schedule:rsvp:manage": ["team", "admin"],

	// Vote app permissions
	"vote:access": ["student", "teacher", "team", "admin"],
	"vote:ballot:view": ["student", "teacher", "team", "admin"],
	"vote:ballot:cast": ["student", "teacher", "team", "admin"],
	"vote:ballot:create": ["team", "admin"],
	"vote:results:view": ["team", "admin"],
	"vote:audit:view": ["admin"],

	// Live app permissions
	"live:access": ["student", "teacher", "team", "admin"],
	"live:question:submit": ["student", "teacher", "team", "admin"],
	"live:vote:submit": ["student", "teacher", "team", "admin"],
	"live:event:manage": ["team", "admin"],
	"live:question:moderate": ["team", "admin"],

	// Screens app permissions
	"screens:access": ["team", "admin"],
	"screens:manage": ["team", "admin"],
	"screens:emergency": ["team", "admin"],

	// Admin permissions
	"admin:access": ["admin"],
	"admin:users:view": ["admin"],
	"admin:users:edit": ["admin"],
	"admin:users:delete": ["admin"],
	"admin:users:impersonate": ["admin"],
	"admin:roles:manage": ["admin"],
	"admin:audit:view": ["admin"],

	// Profile permissions (all users)
	"profile:view": ["student", "teacher", "team", "admin"],
	"profile:edit": ["student", "teacher", "team", "admin"],
	"profile:security:edit": ["student", "teacher", "team", "admin"],
	"profile:data:export": ["student", "teacher", "team", "admin"],
	"profile:account:delete": ["student", "teacher", "team", "admin"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Role definitions with hierarchical inheritance
 * Admin > Team > Teacher > Student
 */

// Student role - base level permissions
export const student = ac.newRole({
	"schedule:access": ["student"],
	"schedule:event:view": ["student"],
	"schedule:rsvp:create": ["student"],
	"vote:access": ["student"],
	"vote:ballot:view": ["student"],
	"vote:ballot:cast": ["student"],
	"live:access": ["student"],
	"live:question:submit": ["student"],
	"live:vote:submit": ["student"],
	"profile:view": ["student"],
	"profile:edit": ["student"],
	"profile:security:edit": ["student"],
	"profile:data:export": ["student"],
	"profile:account:delete": ["student"],
});

// Teacher role - inherits student + additional permissions
export const teacher = ac.newRole({
	...student.statements,
	"schedule:event:view:draft": ["teacher"],
	"schedule:rsvp:manage": ["teacher"],
	"vote:results:view": ["teacher"],
});

// Team role - inherits teacher + event management
export const team = ac.newRole({
	...teacher.statements,
	oidcp_role: ["team"],
	"schedule:event:create": ["team"],
	"schedule:event:edit": ["team"],
	"schedule:event:delete": ["team"],
	"schedule:event:publish": ["team"],
	"live:event:manage": ["team"],
	"live:question:moderate": ["team"],
	"screens:access": ["team"],
	"screens:manage": ["team"],
	"screens:emergency": ["team"],
});

// Admin role - full access
export const admin = ac.newRole({
	...adminAc.statements,
	...team.statements,
	"schedule:event:delete:any": ["admin"],
	"vote:audit:view": ["admin"],
	"admin:access": ["admin"],
	"admin:users:view": ["admin"],
	"admin:users:edit": ["admin"],
	"admin:users:delete": ["admin"],
	"admin:users:impersonate": ["admin"],
	"admin:roles:manage": ["admin"],
	"admin:audit:view": ["admin"],
});

// User role - alias for student (Better Auth compatibility)
export const user = ac.newRole({
	...userAc.statements,
	...student.statements,
});

/**
 * Helper to check if a user has a permission
 */
export function hasPermission(
	userRole: string,
	permission: keyof typeof statement,
): boolean {
	const allowedRoles = statement[permission];
	if (!allowedRoles) return false;
	return (allowedRoles as readonly string[]).includes(userRole);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: string): string[] {
	const perms: string[] = [];
	for (const [key, allowedRoles] of Object.entries(statement)) {
		if ((allowedRoles as readonly string[]).includes(role)) {
			perms.push(key);
		}
	}
	return perms;
}
