/**
 * Unit tests for permissions utilities
 * SPEC.md Phase 9 - Task 9.2: Unit Testing
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock environment before importing modules that use it
vi.mock('#env', () => ({
  default: {
    NODE_ENV: 'test',
    HOST_URL: 'http://localhost:3000',
    BETTER_AUTH_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    AXIOM_TOKEN: undefined,
    AXIOM_DATASET: undefined,
  },
}));

// Mock auth to avoid database connection
vi.mock('#auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Now import after mocks
import { hasRole } from '~/lib/api-auth';

describe('hasRole', () => {
  it('should return false when userRole is null', () => {
    expect(hasRole(null, 'user')).toBe(false);
    expect(hasRole(null, 'admin')).toBe(false);
  });

  it('should return true when user has exact role', () => {
    expect(hasRole('user', 'user')).toBe(true);
    expect(hasRole('admin', 'admin')).toBe(true);
    expect(hasRole('team', 'team')).toBe(true);
  });

  it('should return true when user has higher role', () => {
    expect(hasRole('admin', 'user')).toBe(true);
    expect(hasRole('admin', 'team')).toBe(true);
    expect(hasRole('team', 'user')).toBe(true);
    expect(hasRole('teacher', 'student')).toBe(true);
    expect(hasRole('student', 'user')).toBe(true);
  });

  it('should return false when user has lower role', () => {
    expect(hasRole('user', 'admin')).toBe(false);
    expect(hasRole('user', 'team')).toBe(false);
    expect(hasRole('team', 'admin')).toBe(false);
    expect(hasRole('student', 'teacher')).toBe(false);
  });

  it('should handle role hierarchy correctly', () => {
    // Role hierarchy: user → student → teacher → team → admin
    const roles = ['user', 'student', 'teacher', 'team', 'admin'];
    
    for (let i = 0; i < roles.length; i++) {
      for (let j = 0; j < roles.length; j++) {
        const userRole = roles[i];
        const requiredRole = roles[j];
        const expected = i >= j;
        expect(hasRole(userRole, requiredRole)).toBe(expected);
      }
    }
  });
});
