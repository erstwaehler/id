/**
 * Permission definitions for EWF-ID
 * Format: app:resource:action
 * See INTEGRATED_APPS.md for full documentation
 */

import type { RoleId } from "./roles";
import { hasMinimumRole } from "./roles";

export interface Permission {
	scope: string;
	name: string;
	nameDE: string;
	description: string;
	descriptionDE: string;
	requiredRole: RoleId;
	dangerous?: boolean;
}

/**
 * All permissions grouped by application
 */
export const permissions: Record<string, Permission[]> = {
	// Schedule application permissions
	schedule: [
		{
			scope: "schedule:access",
			name: "Access Schedule",
			nameDE: "Terminplan öffnen",
			description: "View the schedule application",
			descriptionDE: "Terminplan-Anwendung öffnen",
			requiredRole: "student",
		},
		{
			scope: "schedule:event:view",
			name: "View Events",
			nameDE: "Termine ansehen",
			description: "View all published events",
			descriptionDE: "Alle veröffentlichten Termine ansehen",
			requiredRole: "student",
		},
		{
			scope: "schedule:event:view:draft",
			name: "View Draft Events",
			nameDE: "Entwürfe ansehen",
			description: "View unpublished events",
			descriptionDE: "Unveröffentlichte Termine ansehen",
			requiredRole: "team",
		},
		{
			scope: "schedule:event:create",
			name: "Create Events",
			nameDE: "Termine erstellen",
			description: "Create new events",
			descriptionDE: "Neue Termine erstellen",
			requiredRole: "team",
		},
		{
			scope: "schedule:event:edit",
			name: "Edit Events",
			nameDE: "Termine bearbeiten",
			description: "Edit existing events",
			descriptionDE: "Bestehende Termine bearbeiten",
			requiredRole: "team",
		},
		{
			scope: "schedule:event:delete",
			name: "Delete Events",
			nameDE: "Termine löschen",
			description: "Delete own events",
			descriptionDE: "Eigene Termine löschen",
			requiredRole: "team",
		},
		{
			scope: "schedule:event:delete:any",
			name: "Delete Any Event",
			nameDE: "Alle Termine löschen",
			description: "Delete any event",
			descriptionDE: "Jeden Termin löschen",
			requiredRole: "admin",
			dangerous: true,
		},
		{
			scope: "schedule:event:publish",
			name: "Publish Events",
			nameDE: "Termine veröffentlichen",
			description: "Publish events",
			descriptionDE: "Termine veröffentlichen",
			requiredRole: "team",
		},
		{
			scope: "schedule:rsvp:create",
			name: "RSVP to Events",
			nameDE: "Für Termine anmelden",
			description: "Register for events",
			descriptionDE: "Für Veranstaltungen registrieren",
			requiredRole: "student",
		},
		{
			scope: "schedule:rsvp:manage",
			name: "Manage RSVPs",
			nameDE: "Anmeldungen verwalten",
			description: "View and manage all RSVPs",
			descriptionDE: "Alle Anmeldungen ansehen und verwalten",
			requiredRole: "team",
		},
	],

	// Vote application permissions
	vote: [
		{
			scope: "vote:access",
			name: "Access Voting",
			nameDE: "Abstimmung öffnen",
			description: "Access the voting application",
			descriptionDE: "Abstimmungs-Anwendung öffnen",
			requiredRole: "student",
		},
		{
			scope: "vote:ballot:view",
			name: "View Ballots",
			nameDE: "Wahlen ansehen",
			description: "View active ballots",
			descriptionDE: "Aktive Wahlen ansehen",
			requiredRole: "student",
		},
		{
			scope: "vote:ballot:cast",
			name: "Cast Vote",
			nameDE: "Abstimmen",
			description: "Submit a vote",
			descriptionDE: "Eine Stimme abgeben",
			requiredRole: "student",
		},
		{
			scope: "vote:ballot:create",
			name: "Create Ballot",
			nameDE: "Wahl erstellen",
			description: "Create new ballots/polls",
			descriptionDE: "Neue Wahlen/Umfragen erstellen",
			requiredRole: "team",
		},
		{
			scope: "vote:results:view",
			name: "View Results",
			nameDE: "Ergebnisse ansehen",
			description: "View live/final results",
			descriptionDE: "Live-/Endergebnisse ansehen",
			requiredRole: "team",
		},
		{
			scope: "vote:audit:view",
			name: "View Audit Log",
			nameDE: "Prüfprotokoll ansehen",
			description: "View voting audit trail",
			descriptionDE: "Abstimmungs-Prüfprotokoll ansehen",
			requiredRole: "admin",
		},
	],

	// Live application permissions
	live: [
		{
			scope: "live:access",
			name: "Access Live",
			nameDE: "Live öffnen",
			description: "Access the live interaction app",
			descriptionDE: "Live-Interaktions-App öffnen",
			requiredRole: "student",
		},
		{
			scope: "live:question:submit",
			name: "Submit Question",
			nameDE: "Frage stellen",
			description: "Submit questions during Q&A",
			descriptionDE: "Fragen während Q&A stellen",
			requiredRole: "student",
		},
		{
			scope: "live:vote:submit",
			name: "Submit Vote",
			nameDE: "Abstimmen",
			description: "Vote in live polls",
			descriptionDE: "In Live-Umfragen abstimmen",
			requiredRole: "student",
		},
		{
			scope: "live:event:manage",
			name: "Manage Event",
			nameDE: "Event verwalten",
			description: "Configure event settings",
			descriptionDE: "Event-Einstellungen konfigurieren",
			requiredRole: "team",
		},
		{
			scope: "live:question:moderate",
			name: "Moderate Questions",
			nameDE: "Fragen moderieren",
			description: "Approve/reject questions",
			descriptionDE: "Fragen genehmigen/ablehnen",
			requiredRole: "team",
		},
	],

	// Screens application permissions
	screens: [
		{
			scope: "screens:access",
			name: "Access Screens",
			nameDE: "Bildschirme öffnen",
			description: "Access the screens management app",
			descriptionDE: "Bildschirmverwaltungs-App öffnen",
			requiredRole: "team",
		},
		{
			scope: "screens:manage",
			name: "Manage Screens",
			nameDE: "Bildschirme verwalten",
			description: "Control screen content",
			descriptionDE: "Bildschirminhalte steuern",
			requiredRole: "team",
		},
		{
			scope: "screens:emergency",
			name: "Emergency Override",
			nameDE: "Notfall-Überschreibung",
			description: "Show emergency message on all screens",
			descriptionDE: "Notfallmeldung auf allen Bildschirmen anzeigen",
			requiredRole: "team",
			dangerous: true,
		},
	],

	// Admin permissions
	admin: [
		{
			scope: "admin:access",
			name: "Access Admin Panel",
			nameDE: "Admin-Panel öffnen",
			description: "Access the admin dashboard",
			descriptionDE: "Admin-Dashboard öffnen",
			requiredRole: "admin",
		},
		{
			scope: "admin:users:view",
			name: "View Users",
			nameDE: "Benutzer ansehen",
			description: "View user list and details",
			descriptionDE: "Benutzerliste und -details ansehen",
			requiredRole: "admin",
		},
		{
			scope: "admin:users:edit",
			name: "Edit Users",
			nameDE: "Benutzer bearbeiten",
			description: "Edit user information",
			descriptionDE: "Benutzerinformationen bearbeiten",
			requiredRole: "admin",
		},
		{
			scope: "admin:users:delete",
			name: "Delete Users",
			nameDE: "Benutzer löschen",
			description: "Delete user accounts",
			descriptionDE: "Benutzerkonten löschen",
			requiredRole: "admin",
			dangerous: true,
		},
		{
			scope: "admin:users:impersonate",
			name: "Impersonate Users",
			nameDE: "Benutzer imitieren",
			description: "Sign in as another user",
			descriptionDE: "Als anderer Benutzer anmelden",
			requiredRole: "admin",
			dangerous: true,
		},
		{
			scope: "admin:roles:manage",
			name: "Manage Roles",
			nameDE: "Rollen verwalten",
			description: "Create/edit/delete roles",
			descriptionDE: "Rollen erstellen/bearbeiten/löschen",
			requiredRole: "admin",
		},
		{
			scope: "admin:audit:view",
			name: "View Audit Logs",
			nameDE: "Prüfprotokolle ansehen",
			description: "View all audit logs",
			descriptionDE: "Alle Prüfprotokolle ansehen",
			requiredRole: "admin",
		},
	],

	// Profile permissions (all users have these)
	profile: [
		{
			scope: "profile:view",
			name: "View Profile",
			nameDE: "Profil ansehen",
			description: "View own profile",
			descriptionDE: "Eigenes Profil ansehen",
			requiredRole: "student",
		},
		{
			scope: "profile:edit",
			name: "Edit Profile",
			nameDE: "Profil bearbeiten",
			description: "Edit own profile information",
			descriptionDE: "Eigene Profilinformationen bearbeiten",
			requiredRole: "student",
		},
		{
			scope: "profile:security:edit",
			name: "Edit Security Settings",
			nameDE: "Sicherheitseinstellungen bearbeiten",
			description: "Change password, enable 2FA",
			descriptionDE: "Passwort ändern, 2FA aktivieren",
			requiredRole: "student",
		},
		{
			scope: "profile:data:export",
			name: "Export Data",
			nameDE: "Daten exportieren",
			description: "Request GDPR data export",
			descriptionDE: "DSGVO-Datenexport anfordern",
			requiredRole: "student",
		},
		{
			scope: "profile:account:delete",
			name: "Delete Account",
			nameDE: "Konto löschen",
			description: "Request account deletion",
			descriptionDE: "Kontolöschung anfordern",
			requiredRole: "student",
		},
	],
};

/**
 * Get all permissions as a flat array
 */
export function getAllPermissions(): Permission[] {
	return Object.values(permissions).flat();
}

/**
 * Get permission by scope
 */
export function getPermission(scope: string): Permission | undefined {
	return getAllPermissions().find((p) => p.scope === scope);
}

/**
 * Get all permission scopes
 */
export function getAllPermissionScopes(): string[] {
	return getAllPermissions().map((p) => p.scope);
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissionsForRole(roleId: RoleId): string[] {
	return getAllPermissions()
		.filter((p) => hasMinimumRole(roleId, p.requiredRole))
		.map((p) => p.scope);
}

/**
 * Check if a user with given role can have a permission
 */
export function canHavePermission(
	userRole: RoleId,
	permissionScope: string,
): boolean {
	const permission = getPermission(permissionScope);
	if (!permission) return false;
	return hasMinimumRole(userRole, permission.requiredRole);
}
