/**
 * Unit tests for analytics utilities
 * SPEC.md Phase 9 - Task 9.2: Unit Testing
 */
import { describe, it, expect, vi } from 'vitest';

// Mock environment before importing modules that use it
vi.mock('#env', () => ({
  default: {
    NODE_ENV: 'test',
    HOST_URL: 'http://localhost:3000',
    POSTHOG_KEY: undefined,
    POSTHOG_HOST: 'https://eu.posthog.com',
  },
}));

import { AnalyticsEvents } from '~/lib/analytics';

describe('AnalyticsEvents', () => {
  it('should have authentication events', () => {
    expect(AnalyticsEvents.USER_REGISTERED).toBe('user_registered');
    expect(AnalyticsEvents.USER_SIGNED_IN).toBe('user_signed_in');
    expect(AnalyticsEvents.USER_SIGNED_OUT).toBe('user_signed_out');
    expect(AnalyticsEvents.EMAIL_VERIFIED).toBe('email_verified');
  });

  it('should have 2FA events', () => {
    expect(AnalyticsEvents.TWO_FA_ENABLED).toBe('2fa_enabled');
    expect(AnalyticsEvents.TWO_FA_DISABLED).toBe('2fa_disabled');
  });

  it('should have passkey events', () => {
    expect(AnalyticsEvents.PASSKEY_REGISTERED).toBe('passkey_registered');
    expect(AnalyticsEvents.PASSKEY_REMOVED).toBe('passkey_removed');
  });

  it('should have GDPR events', () => {
    expect(AnalyticsEvents.DATA_EXPORT_REQUESTED).toBe('data_export_requested');
    expect(AnalyticsEvents.DATA_EXPORT_DOWNLOADED).toBe('data_export_downloaded');
    expect(AnalyticsEvents.ACCOUNT_DELETION_REQUESTED).toBe('account_deletion_requested');
    expect(AnalyticsEvents.ACCOUNT_DELETION_COMPLETED).toBe('account_deletion_completed');
  });

  it('should have admin events', () => {
    expect(AnalyticsEvents.ADMIN_USER_CREATED).toBe('admin_user_created');
    expect(AnalyticsEvents.ADMIN_USER_DELETED).toBe('admin_user_deleted');
    expect(AnalyticsEvents.ADMIN_USER_SUSPENDED).toBe('admin_user_suspended');
  });

  it('should have OIDC events', () => {
    expect(AnalyticsEvents.OIDC_AUTHORIZATION_REQUEST).toBe('oidc_authorization_request');
    expect(AnalyticsEvents.OIDC_TOKEN_ISSUED).toBe('oidc_token_issued');
  });

  it('should have all required event names as string values', () => {
    const eventNames = Object.values(AnalyticsEvents);
    for (const name of eventNames) {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    }
  });
});
