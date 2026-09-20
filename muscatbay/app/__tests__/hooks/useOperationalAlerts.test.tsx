import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

/**
 * The alert watcher is mounted by `NotificationProvider`, which sits in the
 * root layout ABOVE the auth gate — so it runs on the login screen too. The
 * alert tables need a session, so asking without one answered 401 and logged
 * "permission denied for table water_meters" on every logged-out page load.
 */
const getWaterMetersFromSupabase = vi.fn(async () => []);
const getContractorTrackerData = vi.fn(async () => []);
const getSTPOperationsFromSupabase = vi.fn(async () => []);
const getCurrentUser = vi.fn(async (): Promise<{ id: string } | null> => null);
let authListener: ((user: { id: string } | null) => void) | null = null;
const unsubscribe = vi.fn();

vi.mock("@/lib/supabase", () => ({
    isSupabaseConfigured: () => true,
    getWaterMetersFromSupabase: () => getWaterMetersFromSupabase(),
    getContractorTrackerData: () => getContractorTrackerData(),
    getSTPOperationsFromSupabase: () => getSTPOperationsFromSupabase(),
}));
vi.mock("@/lib/auth", () => ({
    getCurrentUser: () => getCurrentUser(),
    onAuthStateChange: (callback: (user: { id: string } | null) => void) => {
        authListener = callback;
        return { data: { subscription: { unsubscribe } } };
    },
}));
vi.mock("@/hooks/useSupabaseRealtime", () => ({ useSupabaseRealtime: () => {} }));

const { useOperationalAlerts } = await import("@/hooks/useOperationalAlerts");

const render = () => renderHook(() => useOperationalAlerts(vi.fn()));

describe("useOperationalAlerts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authListener = null;
        getCurrentUser.mockResolvedValue(null);
    });

    it("reads nothing while signed out, so the login screen makes no failing queries", async () => {
        const { result } = render();
        await waitFor(() => expect(result.current.status).toBe("unavailable"));
        expect(getWaterMetersFromSupabase).not.toHaveBeenCalled();
        expect(getContractorTrackerData).not.toHaveBeenCalled();
        expect(getSTPOperationsFromSupabase).not.toHaveBeenCalled();
    });

    it("reads the sources once signed in", async () => {
        getCurrentUser.mockResolvedValue({ id: "u1" });
        render();
        await waitFor(() => expect(getWaterMetersFromSupabase).toHaveBeenCalledTimes(1));
        // A page opened already signed in must not fetch a second time when the
        // auth listener reports the session it was opened with.
        await act(async () => {
            authListener?.({ id: "u1" });
        });
        expect(getWaterMetersFromSupabase).toHaveBeenCalledTimes(1);
    });

    it("reads the sources when someone signs in on the login screen", async () => {
        const { result } = render();
        await waitFor(() => expect(result.current.status).toBe("unavailable"));
        expect(getWaterMetersFromSupabase).not.toHaveBeenCalled();
        getCurrentUser.mockResolvedValue({ id: "u1" });
        await act(async () => {
            authListener?.({ id: "u1" });
        });
        await waitFor(() => expect(getWaterMetersFromSupabase).toHaveBeenCalledTimes(1));
    });
});
