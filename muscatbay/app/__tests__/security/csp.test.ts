import { describe, expect, it } from "vitest";

import { buildCsp, buildSatelliteCsp } from "@/proxy";

describe("production CSP", () => {
    it("uses a nonce and contains no unsafe script source", () => {
        const policy = buildCsp("test-nonce", false);
        const scriptSource = policy.split("; ").find((directive) => directive.startsWith("script-src"));

        expect(scriptSource).toContain("'nonce-test-nonce'");
        expect(scriptSource).toContain("'strict-dynamic'");
        expect(scriptSource).not.toContain("'unsafe-inline'");
        expect(scriptSource).not.toContain("'unsafe-eval'");
        expect(policy).not.toContain("grafana.nec-oman.com");
        expect(policy).not.toContain("*.aitable.ai");
    });

    it("allows development tooling only in development", () => {
        const policy = buildCsp("unused", true);
        expect(policy).toContain("'unsafe-eval'");
        expect(policy).toContain("http://localhost:8400");
    });

    it("uses hashes instead of unsafe inline scripts for the static satellite view", () => {
        const policy = buildSatelliteCsp();
        const scriptSource = policy.split("; ").find((directive) => directive.startsWith("script-src"));
        expect(scriptSource).toContain("'sha256-");
        expect(scriptSource).not.toContain("'unsafe-inline'");
        expect(scriptSource).not.toContain("'unsafe-eval'");
    });
});
