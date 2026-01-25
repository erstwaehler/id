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
  oidcp: ["team", "admin"],

  // Schedule app permissions
  schedule: [
    "access",
    "event:view",
    "event:view:draft",
    "event:create",
    "event:edit",
    "event:delete",
    "event:delete:any",
    "event:publish",
    "rsvp:create",
    "rsvp:manage",
  ],

  // Vote app permissions
  vote: [
    "access",
    "ballot:view",
    "ballot:cast",
    "ballot:create",
    "results:view",
    "audit:view",
  ],

  // Live app permissions
  live: [
    "access",
    "question:submit",
    "vote:submit",
    "event:manage",
    "question:moderate",
  ],

  // Screens app permissions
  screens: ["access", "manage", "emergency"],

  // Admin permissions
  admin: [
    "access",
    "users:view",
    "users:edit",
    "users:delete",
    "users:impersonate",
    "roles:manage",
    "audit:view",
  ],

  // Profile permissions (all users)
  profile: ["view", "edit", "security:edit", "data:export", "account:delete"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Role definitions with hierarchical inheritance
 * Admin > Team > Teacher > Student
 */

// Student role - base level permissions
export const student = ac.newRole({
  schedule: ["access", "event:view", "rsvp:create"],
  vote: ["access", "ballot:view", "ballot:cast"],
  live: ["access", "question:submit", "vote:submit"],
  profile: ["view", "edit", "security:edit", "data:export", "account:delete"],
});

// Teacher role - inherits student + additional permissions
export const teacher = ac.newRole({
  ...student.statements,
  schedule: ["event:view:draft", "rsvp:manage"],
  vote: ["results:view"],
});

// Team role - inherits teacher + event management
export const team = ac.newRole({
  ...teacher.statements,
  oidcp: ["team"],
  schedule: ["event:create", "event:edit", "event:delete", "event:publish"],
  live: ["event:manage", "question:moderate"],
  screens: ["access", "manage", "emergency"],
});

// Admin role - full access
export const admin = ac.newRole({
  ...adminAc.statements,
  ...team.statements,
  oidcp: ["admin"],
  schedule: ["event:delete:any"],
  vote: ["ballot:create"],
  live: ["event:manage", "question:moderate"],
  screens: ["access", "manage", "emergency"],
  admin: [
    "access",
    "users:view",
    "users:edit",
    "users:delete",
    "users:impersonate",
    "roles:manage",
    "audit:view",
  ],
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
