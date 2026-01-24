/**
 * Permission definitions for all EWF applications
 * Based on INTEGRATED_APPS.md
 * Format: app:resource:action
 */

export interface PermissionDefinition {
  scope: string;
  name: string;
  description: string;
  appId: string;
  requiredRole?: string[]; // Minimum role(s) required
  dangerous?: boolean; // Requires extra confirmation
}

/**
 * All permissions organized by application
 */
export const permissions: PermissionDefinition[] = [
  // ============================================================================
  // SCHEDULE (schedule.ewf-stade.de)
  // ============================================================================
  {
    scope: "schedule:access",
    name: "Access Schedule",
    description: "View the schedule application",
    appId: "schedule",
    requiredRole: ["student"],
  },
  {
    scope: "schedule:event:view",
    name: "View Events",
    description: "View all published events",
    appId: "schedule",
    requiredRole: ["student"],
  },
  {
    scope: "schedule:event:view:draft",
    name: "View Draft Events",
    description: "View unpublished events",
    appId: "schedule",
    requiredRole: ["team"],
  },
  {
    scope: "schedule:event:create",
    name: "Create Events",
    description: "Create new events",
    appId: "schedule",
    requiredRole: ["team"],
  },
  {
    scope: "schedule:event:edit",
    name: "Edit Events",
    description: "Edit existing events",
    appId: "schedule",
    requiredRole: ["team"],
  },
  {
    scope: "schedule:event:edit:any",
    name: "Edit Any Event",
    description: "Edit events created by others",
    appId: "schedule",
    requiredRole: ["team"],
  },
  {
    scope: "schedule:event:delete",
    name: "Delete Events",
    description: "Delete own events",
    appId: "schedule",
    requiredRole: ["team"],
    dangerous: true,
  },
  {
    scope: "schedule:event:delete:any",
    name: "Delete Any Event",
    description: "Delete any event",
    appId: "schedule",
    requiredRole: ["admin"],
    dangerous: true,
  },
  {
    scope: "schedule:event:publish",
    name: "Publish Events",
    description: "Publish events (make visible to students)",
    appId: "schedule",
    requiredRole: ["team"],
  },
  {
    scope: "schedule:event:unpublish",
    name: "Unpublish Events",
    description: "Unpublish events",
    appId: "schedule",
    requiredRole: ["team"],
  },
  {
    scope: "schedule:rsvp:create",
    name: "RSVP to Events",
    description: "Register for events",
    appId: "schedule",
    requiredRole: ["student"],
  },
  {
    scope: "schedule:rsvp:cancel",
    name: "Cancel RSVP",
    description: "Cancel own RSVP",
    appId: "schedule",
    requiredRole: ["student"],
  },
  {
    scope: "schedule:rsvp:manage",
    name: "Manage RSVPs",
    description: "View and manage all RSVPs",
    appId: "schedule",
    requiredRole: ["team"],
  },
  {
    scope: "schedule:location:manage",
    name: "Manage Locations",
    description: "Add/edit/delete locations",
    appId: "schedule",
    requiredRole: ["team"],
  },
  {
    scope: "schedule:category:manage",
    name: "Manage Categories",
    description: "Add/edit/delete event categories",
    appId: "schedule",
    requiredRole: ["team"],
  },
  {
    scope: "schedule:analytics:view",
    name: "View Analytics",
    description: "View event analytics and statistics",
    appId: "schedule",
    requiredRole: ["team"],
  },
  {
    scope: "schedule:export",
    name: "Export Data",
    description: "Export schedule data",
    appId: "schedule",
    requiredRole: ["team"],
  },

  // ============================================================================
  // VOTE (vote.ewf-stade.de)
  // ============================================================================
  {
    scope: "vote:access",
    name: "Access Voting",
    description: "Access the voting application",
    appId: "vote",
    requiredRole: ["student"],
  },
  {
    scope: "vote:ballot:view",
    name: "View Ballots",
    description: "View active ballots",
    appId: "vote",
    requiredRole: ["student"],
  },
  {
    scope: "vote:ballot:view:closed",
    name: "View Closed Ballots",
    description: "View results of closed ballots",
    appId: "vote",
    requiredRole: ["student"],
  },
  {
    scope: "vote:ballot:cast",
    name: "Cast Vote",
    description: "Submit a vote",
    appId: "vote",
    requiredRole: ["student"],
  },
  {
    scope: "vote:ballot:verify",
    name: "Verify Vote",
    description: "Verify own vote was counted",
    appId: "vote",
    requiredRole: ["student"],
  },
  {
    scope: "vote:ballot:create",
    name: "Create Ballot",
    description: "Create new ballots/polls",
    appId: "vote",
    requiredRole: ["team"],
  },
  {
    scope: "vote:ballot:edit",
    name: "Edit Ballot",
    description: "Edit ballot (before opening)",
    appId: "vote",
    requiredRole: ["team"],
  },
  {
    scope: "vote:ballot:delete",
    name: "Delete Ballot",
    description: "Delete ballot",
    appId: "vote",
    requiredRole: ["team"],
    dangerous: true,
  },
  {
    scope: "vote:ballot:open",
    name: "Open Ballot",
    description: "Open ballot for voting",
    appId: "vote",
    requiredRole: ["team"],
  },
  {
    scope: "vote:ballot:close",
    name: "Close Ballot",
    description: "Close ballot and finalize results",
    appId: "vote",
    requiredRole: ["team"],
  },
  {
    scope: "vote:results:view",
    name: "View Results",
    description: "View live/final results",
    appId: "vote",
    requiredRole: ["team"],
  },
  {
    scope: "vote:results:export",
    name: "Export Results",
    description: "Export results and analytics",
    appId: "vote",
    requiredRole: ["team"],
  },
  {
    scope: "vote:audit:view",
    name: "View Audit Log",
    description: "View voting audit trail",
    appId: "vote",
    requiredRole: ["admin"],
  },
  {
    scope: "vote:moderate",
    name: "Moderate Votes",
    description: "Invalidate fraudulent votes",
    appId: "vote",
    requiredRole: ["admin"],
    dangerous: true,
  },

  // ============================================================================
  // LIVE (live.ewf-stade.de)
  // ============================================================================
  {
    scope: "live:access",
    name: "Access Live",
    description: "Access the live interaction app",
    appId: "live",
    requiredRole: ["student"],
  },
  {
    scope: "live:event:view",
    name: "View Live Event",
    description: "View live event stream",
    appId: "live",
    requiredRole: ["student"],
  },
  {
    scope: "live:question:submit",
    name: "Submit Question",
    description: "Submit questions during Q&A",
    appId: "live",
    requiredRole: ["student"],
  },
  {
    scope: "live:vote:submit",
    name: "Submit Vote",
    description: "Vote in live polls",
    appId: "live",
    requiredRole: ["student"],
  },
  {
    scope: "live:reaction:send",
    name: "Send Reaction",
    description: "Send emoji reactions",
    appId: "live",
    requiredRole: ["student"],
  },
  {
    scope: "live:chat:send",
    name: "Send Chat",
    description: "Send chat messages (if enabled)",
    appId: "live",
    requiredRole: ["student"],
  },
  {
    scope: "live:event:create",
    name: "Create Live Event",
    description: "Create new live event session",
    appId: "live",
    requiredRole: ["team"],
  },
  {
    scope: "live:event:start",
    name: "Start Event",
    description: "Start live event",
    appId: "live",
    requiredRole: ["team"],
  },
  {
    scope: "live:event:stop",
    name: "Stop Event",
    description: "Stop live event",
    appId: "live",
    requiredRole: ["team"],
  },
  {
    scope: "live:event:manage",
    name: "Manage Event",
    description: "Configure event settings",
    appId: "live",
    requiredRole: ["team"],
  },
  {
    scope: "live:question:moderate",
    name: "Moderate Questions",
    description: "Approve/reject questions",
    appId: "live",
    requiredRole: ["team"],
  },
  {
    scope: "live:question:highlight",
    name: "Highlight Question",
    description: "Feature question on screen",
    appId: "live",
    requiredRole: ["team"],
  },
  {
    scope: "live:poll:create",
    name: "Create Poll",
    description: "Create instant polls",
    appId: "live",
    requiredRole: ["team"],
  },
  {
    scope: "live:poll:close",
    name: "Close Poll",
    description: "Close poll and show results",
    appId: "live",
    requiredRole: ["team"],
  },
  {
    scope: "live:chat:moderate",
    name: "Moderate Chat",
    description: "Delete messages, timeout users",
    appId: "live",
    requiredRole: ["team"],
  },
  {
    scope: "live:analytics:view",
    name: "View Analytics",
    description: "View engagement analytics",
    appId: "live",
    requiredRole: ["team"],
  },
  {
    scope: "live:export",
    name: "Export Data",
    description: "Export questions, polls, analytics",
    appId: "live",
    requiredRole: ["team"],
  },

  // ============================================================================
  // SCREENS (screens.ewf-stade.de)
  // ============================================================================
  {
    scope: "screens:access",
    name: "Access Screens",
    description: "Access the screens management app",
    appId: "screens",
    requiredRole: ["team"],
  },
  {
    scope: "screens:view",
    name: "View Screens",
    description: "View current screen content",
    appId: "screens",
    requiredRole: ["team"],
  },
  {
    scope: "screens:manage",
    name: "Manage Screens",
    description: "Control screen content",
    appId: "screens",
    requiredRole: ["team"],
  },
  {
    scope: "screens:content:upload",
    name: "Upload Content",
    description: "Upload slides, images, videos",
    appId: "screens",
    requiredRole: ["team"],
  },
  {
    scope: "screens:content:edit",
    name: "Edit Content",
    description: "Edit/delete uploaded content",
    appId: "screens",
    requiredRole: ["team"],
  },
  {
    scope: "screens:content:delete",
    name: "Delete Content",
    description: "Delete content",
    appId: "screens",
    requiredRole: ["team"],
    dangerous: true,
  },
  {
    scope: "screens:playlist:create",
    name: "Create Playlist",
    description: "Create content playlists",
    appId: "screens",
    requiredRole: ["team"],
  },
  {
    scope: "screens:playlist:edit",
    name: "Edit Playlist",
    description: "Edit existing playlists",
    appId: "screens",
    requiredRole: ["team"],
  },
  {
    scope: "screens:playlist:activate",
    name: "Activate Playlist",
    description: "Set active playlist for screens",
    appId: "screens",
    requiredRole: ["team"],
  },
  {
    scope: "screens:emergency",
    name: "Emergency Override",
    description: "Show emergency message on all screens",
    appId: "screens",
    requiredRole: ["team"],
    dangerous: true,
  },
  {
    scope: "screens:display:control",
    name: "Display Control",
    description: "Control individual displays",
    appId: "screens",
    requiredRole: ["team"],
  },
  {
    scope: "screens:display:configure",
    name: "Configure Displays",
    description: "Configure display settings",
    appId: "screens",
    requiredRole: ["admin"],
  },

  // ============================================================================
  // INFO (info.ewf-stade.de)
  // ============================================================================
  {
    scope: "info:view",
    name: "View Info Site",
    description: "View public information",
    appId: "info",
  },
  {
    scope: "info:content:edit",
    name: "Edit Content",
    description: "Edit website content",
    appId: "info",
    requiredRole: ["team"],
  },
  {
    scope: "info:content:publish",
    name: "Publish Content",
    description: "Publish content changes",
    appId: "info",
    requiredRole: ["team"],
  },
  {
    scope: "info:page:create",
    name: "Create Page",
    description: "Create new pages",
    appId: "info",
    requiredRole: ["team"],
  },
  {
    scope: "info:page:delete",
    name: "Delete Page",
    description: "Delete pages",
    appId: "info",
    requiredRole: ["admin"],
    dangerous: true,
  },
  {
    scope: "info:media:upload",
    name: "Upload Media",
    description: "Upload images/videos",
    appId: "info",
    requiredRole: ["team"],
  },
  {
    scope: "info:media:delete",
    name: "Delete Media",
    description: "Delete media files",
    appId: "info",
    requiredRole: ["team"],
    dangerous: true,
  },
  {
    scope: "info:analytics:view",
    name: "View Analytics",
    description: "View site analytics",
    appId: "info",
    requiredRole: ["team"],
  },

  // ============================================================================
  // ADMIN (admin.ewf-stade.de)
  // ============================================================================
  {
    scope: "admin:access",
    name: "Access Admin Panel",
    description: "Access the admin dashboard",
    appId: "admin",
    requiredRole: ["admin"],
  },
  {
    scope: "admin:users:view",
    name: "View Users",
    description: "View user list and details",
    appId: "admin",
    requiredRole: ["admin"],
  },
  {
    scope: "admin:users:edit",
    name: "Edit Users",
    description: "Edit user information",
    appId: "admin",
    requiredRole: ["admin"],
  },
  {
    scope: "admin:users:delete",
    name: "Delete Users",
    description: "Delete user accounts",
    appId: "admin",
    requiredRole: ["admin"],
    dangerous: true,
  },
  {
    scope: "admin:users:impersonate",
    name: "Impersonate Users",
    description: "Sign in as another user",
    appId: "admin",
    requiredRole: ["admin"],
    dangerous: true,
  },
  {
    scope: "admin:roles:manage",
    name: "Manage Roles",
    description: "Create/edit/delete roles",
    appId: "admin",
    requiredRole: ["admin"],
    dangerous: true,
  },
  {
    scope: "admin:permissions:manage",
    name: "Manage Permissions",
    description: "Assign/revoke permissions",
    appId: "admin",
    requiredRole: ["admin"],
    dangerous: true,
  },
  {
    scope: "admin:apps:view",
    name: "View Applications",
    description: "View all connected apps",
    appId: "admin",
    requiredRole: ["admin"],
  },
  {
    scope: "admin:apps:configure",
    name: "Configure Applications",
    description: "Configure app settings",
    appId: "admin",
    requiredRole: ["admin"],
  },
  {
    scope: "admin:analytics:view",
    name: "View Analytics",
    description: "View system-wide analytics",
    appId: "admin",
    requiredRole: ["admin"],
  },
  {
    scope: "admin:audit:view",
    name: "View Audit Logs",
    description: "View all audit logs",
    appId: "admin",
    requiredRole: ["admin"],
  },
  {
    scope: "admin:system:configure",
    name: "System Configuration",
    description: "Configure system settings",
    appId: "admin",
    requiredRole: ["admin"],
    dangerous: true,
  },

  // ============================================================================
  // PROFILE (profile.ewf-stade.de / account management)
  // ============================================================================
  {
    scope: "profile:view",
    name: "View Profile",
    description: "View own profile",
    appId: "profile",
    requiredRole: ["student"],
  },
  {
    scope: "profile:edit",
    name: "Edit Profile",
    description: "Edit own profile information",
    appId: "profile",
    requiredRole: ["student"],
  },
  {
    scope: "profile:picture:upload",
    name: "Upload Picture",
    description: "Upload profile picture",
    appId: "profile",
    requiredRole: ["student"],
  },
  {
    scope: "profile:security:view",
    name: "View Security Settings",
    description: "View security settings",
    appId: "profile",
    requiredRole: ["student"],
  },
  {
    scope: "profile:security:edit",
    name: "Edit Security Settings",
    description: "Change password, enable 2FA",
    appId: "profile",
    requiredRole: ["student"],
  },
  {
    scope: "profile:apps:view",
    name: "View Connected Apps",
    description: "View apps with access to account",
    appId: "profile",
    requiredRole: ["student"],
  },
  {
    scope: "profile:apps:revoke",
    name: "Revoke App Access",
    description: "Revoke app authorization",
    appId: "profile",
    requiredRole: ["student"],
  },
  {
    scope: "profile:data:export",
    name: "Export Data",
    description: "Request GDPR data export",
    appId: "profile",
    requiredRole: ["student"],
  },
  {
    scope: "profile:account:delete",
    name: "Delete Account",
    description: "Request account deletion",
    appId: "profile",
    requiredRole: ["student"],
  },
];

/**
 * Default permissions for each role
 * These are automatically assigned when a user gets a role
 */
export const defaultPermissionsByRole: Record<string, string[]> = {
  student: [
    // Schedule
    "schedule:access",
    "schedule:event:view",
    "schedule:rsvp:create",
    "schedule:rsvp:cancel",
    // Vote
    "vote:access",
    "vote:ballot:view",
    "vote:ballot:view:closed",
    "vote:ballot:cast",
    "vote:ballot:verify",
    // Live
    "live:access",
    "live:event:view",
    "live:question:submit",
    "live:vote:submit",
    "live:reaction:send",
    "live:chat:send",
    // Info
    "info:view",
    // Profile
    "profile:view",
    "profile:edit",
    "profile:picture:upload",
    "profile:security:view",
    "profile:security:edit",
    "profile:apps:view",
    "profile:apps:revoke",
    "profile:data:export",
    "profile:account:delete",
  ],
  teacher: [
    // Inherits all student permissions + additional
    "schedule:event:view:draft",
    "schedule:rsvp:manage",
    "schedule:analytics:view",
    "vote:results:view",
    "live:analytics:view",
    "screens:access",
    "screens:view",
  ],
  team: [
    // Inherits all teacher permissions + additional
    "schedule:event:create",
    "schedule:event:edit",
    "schedule:event:publish",
    "schedule:event:unpublish",
    "schedule:location:manage",
    "schedule:category:manage",
    "schedule:export",
    "vote:ballot:create",
    "vote:ballot:edit",
    "vote:ballot:delete",
    "vote:ballot:open",
    "vote:ballot:close",
    "vote:results:export",
    "live:event:create",
    "live:event:start",
    "live:event:stop",
    "live:event:manage",
    "live:question:moderate",
    "live:question:highlight",
    "live:poll:create",
    "live:poll:close",
    "live:chat:moderate",
    "live:export",
    "screens:manage",
    "screens:content:upload",
    "screens:content:edit",
    "screens:content:delete",
    "screens:playlist:create",
    "screens:playlist:edit",
    "screens:playlist:activate",
    "screens:emergency",
    "screens:display:control",
    "info:content:edit",
    "info:content:publish",
    "info:page:create",
    "info:media:upload",
    "info:media:delete",
    "info:analytics:view",
  ],
  admin: [
    // Admins get wildcard - all permissions
    // Specific dangerous permissions
    "schedule:event:delete:any",
    "vote:audit:view",
    "vote:moderate",
    "screens:display:configure",
    "info:page:delete",
    "admin:access",
    "admin:users:view",
    "admin:users:edit",
    "admin:users:delete",
    "admin:users:impersonate",
    "admin:roles:manage",
    "admin:permissions:manage",
    "admin:apps:view",
    "admin:apps:configure",
    "admin:analytics:view",
    "admin:audit:view",
    "admin:system:configure",
  ],
};

/**
 * Get permissions by app ID
 */
export function getPermissionsByApp(appId: string): PermissionDefinition[] {
  return permissions.filter((p) => p.appId === appId);
}

/**
 * Get permission by scope
 */
export function getPermissionByScope(scope: string): PermissionDefinition | undefined {
  return permissions.find((p) => p.scope === scope);
}

/**
 * Get all app IDs
 */
export function getAllAppIds(): string[] {
  const appIds = new Set<string>();
  for (const permission of permissions) {
    appIds.add(permission.appId);
  }
  return Array.from(appIds).sort();
}
