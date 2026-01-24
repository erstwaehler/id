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
	"schedule:access": true,
	"schedule:event:view": true,
	"schedule:rsvp:create": true,
	"vote:access": true,
	"vote:ballot:view": true,
	"vote:ballot:cast": true,
	"live:access": true,
	"live:question:submit": true,
	"live:vote:submit": true,
	"profile:view": true,
	"profile:edit": true,
	"profile:security:edit": true,
	"profile:data:export": true,
	"profile:account:delete": true,
});

// Teacher role - inherits student + additional permissions
export const teacher = ac.newRole({
	...student.statements,
	"schedule:event:view:draft": true,
	"schedule:rsvp:manage": true,
	"vote:results:view": true,
});

// Team role - inherits teacher + event management
export const team = ac.newRole({
	...teacher.statements,
	oidcp_role: true,
	"schedule:event:create": true,
	"schedule:event:edit": true,
	"schedule:event:delete": true,
	"schedule:event:publish": true,
	"live:event:manage": true,
	"live:question:moderate": true,
	"screens:access": true,
	"screens:manage": true,
	"screens:emergency": true,
});

// Admin role - full access
export const admin = ac.newRole({
	...adminAc.statements,
	...team.statements,
	"schedule:event:delete:any": true,
	"vote:audit:view": true,
	"admin:access": true,
	"admin:users:view": true,
	"admin:users:edit": true,
	"admin:users:delete": true,
	"admin:users:impersonate": true,
	"admin:roles:manage": true,
	"admin:audit:view": true,
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
