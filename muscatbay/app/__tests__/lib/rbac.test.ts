import { describe, it, expect } from 'vitest';
import {
    ROLE_MODULES,
    MODULE_ROUTE,
    canAccessModule,
    canAccessRoute,
    normalizeRole,
    resolveModuleFromPathname,
    type Role,
    type ModuleKey,
} from '@/lib/rbac';

const ALL_ROLES: Role[] = ['admin', 'manager', 'operator', 'contractor', 'viewer'];
const ALL_MODULES = Object.keys(MODULE_ROUTE) as ModuleKey[];

/**
 * Regression cover for the 2026-07-28 incident.
 *
 * A colleague signed up, landed on the `viewer` default — which is also the
 * `profiles.role` column default, so it is what EVERY new sign-up gets — and
 * could reach only Water, Electricity and STP. The Modules sheet showed 3 of 8
 * entries, and the dashboard coverage rail still linked to the 5 hidden ones,
 * so tapping a card hit the route guard and bounced back to the dashboard. It
 * was reported as the app crashing and restarting.
 *
 * The owner's decision (2026-07-29) is that all users may view all sections.
 * These tests hold that, and hold the invariant that made the bug possible:
 * every module a navigation surface can offer must be one the guard admits.
 */
describe('ROLE_MODULES — every role sees every module', () => {
    it.each(ALL_ROLES)('%s can access all %i modules', (role) => {
        for (const mod of ALL_MODULES) {
            expect(
                canAccessModule(role, mod),
                `${role} should be able to open "${mod}"`
            ).toBe(true);
        }
    });

    it('grants viewer the five modules that were hidden on 2026-07-28', () => {
        // The exact set the colleague could not reach.
        for (const mod of ['contractors', 'hvac', 'assets', 'pest-control', 'firefighting'] as ModuleKey[]) {
            expect(canAccessModule('viewer', mod)).toBe(true);
        }
    });

    it('lists every module for every role, with no duplicates', () => {
        for (const role of ALL_ROLES) {
            const modules = ROLE_MODULES[role];
            expect(new Set(modules).size).toBe(modules.length);
            expect([...modules].sort()).toEqual([...ALL_MODULES].sort());
        }
    });
});

describe('canAccessRoute — navigation surfaces and the route guard agree', () => {
    it('admits every role to every module route', () => {
        for (const role of ALL_ROLES) {
            for (const route of Object.values(MODULE_ROUTE)) {
                expect(canAccessRoute(role, route), `${role} → ${route}`).toBe(true);
            }
        }
    });

    it('admits nested module routes, not just the index', () => {
        // /firefighting/quotes must resolve to the firefighting module, or the
        // guard would treat a real sub-page as unscoped.
        expect(resolveModuleFromPathname('/firefighting/quotes')).toBe('firefighting');
        expect(canAccessRoute('viewer', '/firefighting/quotes')).toBe(true);
    });

    it('leaves non-module routes unscoped', () => {
        for (const path of ['/login', '/auth/callback', '/privacy', '/terms']) {
            expect(resolveModuleFromPathname(path)).toBeNull();
            expect(canAccessRoute('viewer', path)).toBe(true);
        }
    });
});

describe('normalizeRole — safe by default', () => {
    it('passes through the five known roles', () => {
        for (const role of ALL_ROLES) {
            expect(normalizeRole(role)).toBe(role);
            expect(normalizeRole(role.toUpperCase())).toBe(role);
        }
    });

    it('falls back to viewer for absent or unrecognised values', () => {
        expect(normalizeRole(null)).toBe('viewer');
        expect(normalizeRole(undefined)).toBe('viewer');
        expect(normalizeRole('')).toBe('viewer');
        expect(normalizeRole('superuser')).toBe('viewer');
    });

    it('grandfathers the legacy "user" value to admin', () => {
        expect(normalizeRole('user')).toBe('admin');
    });

    it('never leaves a signed-in account without a usable app', () => {
        // The failure mode behind the incident: an unknown role resolves to
        // viewer, so viewer must never be a dead end.
        expect(ROLE_MODULES[normalizeRole('something-nobody-configured')].length)
            .toBe(ALL_MODULES.length);
    });
});
