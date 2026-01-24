/**
 * Role definitions for EWF-ID
 * Based on INTEGRATED_APPS.md role hierarchy
 */

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  hierarchy: number; // Higher number = more privileges
  inheritsFrom?: string[]; // Roles this role inherits permissions from
}

export const roles: Record<string, RoleDefinition> = {
  student: {
    id: "student",
    name: "Student (Schüler)",
    description: "Basic access to public events, voting, and participation features",
    hierarchy: 1,
  },
  teacher: {
    id: "teacher",
    name: "Teacher (Lehrer)",
    description: "School-specific permissions, student oversight, event participation",
    hierarchy: 2,
    inheritsFrom: ["student"],
  },
  team: {
    id: "team",
    name: "Team Member",
    description: "Access to team-specific applications, event management, content moderation",
    hierarchy: 3,
    inheritsFrom: ["teacher"],
  },
  admin: {
    id: "admin",
    name: "Administrator",
    description: "Full system access, user management, impersonation, system configuration",
    hierarchy: 4,
    inheritsFrom: ["team"],
  },
};

/**
 * Check if a role has specific permission through hierarchy
 */
export function roleHasPermission(
  userRoles: string[],
  permission: string
): boolean {
  // Admins have all permissions
  if (userRoles.includes("admin")) {
    return true;
  }

  // Check if any of the user's roles have the required permission
  // This is a placeholder - actual permission checking will be done in the permission service
  return false;
}

/**
 * Get all roles a user has including inherited roles
 */
export function expandRoles(userRoles: string[]): string[] {
  const expanded = new Set<string>(userRoles);

  for (const roleId of userRoles) {
    const role = roles[roleId];
    if (role?.inheritsFrom) {
      for (const inheritedRole of role.inheritsFrom) {
        expanded.add(inheritedRole);
      }
    }
  }

  return Array.from(expanded);
}

/**
 * Check if a user has a specific role (including inherited roles)
 */
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  const expandedRoles = expandRoles(userRoles);
  return expandedRoles.includes(requiredRole);
}

/**
 * Get the highest role in the hierarchy
 */
export function getHighestRole(userRoles: string[]): RoleDefinition | null {
  let highest: RoleDefinition | null = null;

  for (const roleId of userRoles) {
    const role = roles[roleId];
    if (role && (!highest || role.hierarchy > highest.hierarchy)) {
      highest = role;
    }
  }

  return highest;
}
