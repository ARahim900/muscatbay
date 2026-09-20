"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/mb-button";
import {
  parseLocations,
  type ConsumptionMeter,
  type MeterLocation,
} from "./consumptionModel";
import type { ZoneLoss } from "./zoneBalance";

const NO_LOSSES: ZoneLoss[] = [];

export function SatelliteMap({
  meters,
  zone,
  selected,
  date,
  zones = [],
  zoneLosses = NO_LOSSES,
  summary = "",
  children,
  onLocations,
  onZone,
  onMeter,
  onUnavailable,
  onVillaLink,
}: {
  meters: ConsumptionMeter[];
  zone: string;
  selected: string;
  date: string;
  /** Every zone the operator can switch to — drawn as one-tap chips on the map. */
  zones?: { id: string; name: string }[];
  /** Bulk − L3 per zone, written on the overview's zone markers. */
  zoneLosses?: ZoneLoss[];
  /** One status line, shown above the map in full screen (the card header is hidden there). */
  summary?: string;
  /** The meter sheet — drawn over the map in full screen only. */
  children?: ReactNode;
  /** The selected villa's house connection, in words ("" when there is none). */
  onVillaLink?: (text: string) => void;
  onLocations: (locations: MeterLocation[]) => void;
  onZone: (zone: string) => void;
  onMeter: (account: string) => void;
  onUnavailable: (unavailable: boolean) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Preparing satellite imagery…");
  const [failed, setFailed] = useState(false);
  // Full screen is where the map is operated on a phone: one finger moves it,
  // because there is no page underneath left to scroll.
  const [full, setFull] = useState(false);
  const latest = useRef({ meters, zone, selected, date, zones, zoneLosses });
  const callbacks = useRef({
    onLocations,
    onZone,
    onMeter,
    onUnavailable,
    onVillaLink,
  });
  const warnedAboutFontSync = useRef(false);
  const syncTheme = useCallback(() => {
    const element = frame.current;
    const embedded = element?.contentDocument;
    if (!element || !embedded?.documentElement) return;
    const theme = getComputedStyle(element);
    for (const token of [
      "--status-normal",
      "--status-warning",
      "--status-danger",
      "--status-missing",
      "--color-success",
      "--color-warning",
      "--color-danger",
      "--color-bg",
      "--color-card",
      "--color-component",
      "--color-line",
      "--color-fg",
      "--color-muted",
      "--color-primary",
      "--color-accent",
      "--radius-control",
      "--shadow-card",
    ]) {
      embedded.documentElement.style.setProperty(
        token,
        theme.getPropertyValue(token),
      );
    }
    embedded.documentElement.style.setProperty("--map-font", theme.fontFamily);
    embedded.documentElement.style.colorScheme = theme.colorScheme;
    embedded.documentElement.classList.toggle(
      "dark",
      document.documentElement.classList.contains("dark"),
    );
    const sourceFonts = (
      document as Document & { fonts?: Partial<FontFaceSet> }
    ).fonts;
    const targetFonts = (
      embedded as Document & { fonts?: Partial<FontFaceSet> }
    ).fonts;
    if (
      typeof sourceFonts?.forEach === "function" &&
      typeof targetFonts?.add === "function"
    ) {
      try {
        sourceFonts.forEach((font) => targetFonts.add?.(font));
      } catch (error: unknown) {
        if (!warnedAboutFontSync.current) {
          warnedAboutFontSync.current = true;
          console.warn("Satellite map font synchronisation was skipped.", error);
        }
      }
    }
  }, []);
  useEffect(() => {
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    syncTheme();
    const fonts = (
      document as Document & { fonts?: Partial<FontFaceSet> }
    ).fonts;
    if (typeof fonts?.addEventListener === "function") {
      fonts.addEventListener("loadingdone", syncTheme);
    }
    return () => {
      observer.disconnect();
      if (typeof fonts?.removeEventListener === "function") {
        fonts.removeEventListener("loadingdone", syncTheme);
      }
    };
  }, [syncTheme]);
  useEffect(() => {
    callbacks.current = {
      onLocations,
      onZone,
      onMeter,
      onUnavailable,
      onVillaLink,
    };
  }, [onLocations, onZone, onMeter, onUnavailable, onVillaLink]);
  useEffect(() => {
    latest.current = { meters, zone, selected, date, zones, zoneLosses };
    if (ready.current)
      frame.current?.contentWindow?.postMessage(
        { type: "satviz:update", payload: latest.current },
        location.origin,
      );
  }, [meters, zone, selected, date, zones, zoneLosses]);
  useEffect(() => {
    frame.current?.contentWindow?.postMessage(
      { type: "satviz:mode", full },
      location.origin,
    );
    if (!full) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [full]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFailed(true);
      callbacks.current.onUnavailable(true);
      setStatus("Map startup timed out. The meter table remains available.");
    }, 20000);
    const receive = (event: MessageEvent<unknown>) => {
      if (
        event.origin !== location.origin ||
        event.source !== frame.current?.contentWindow ||
        !event.data ||
        typeof event.data !== "object"
      )
        return;
      const message = event.data as Record<string, unknown>;
      if (message.type === "satviz:ready") {
        ready.current = true;
        callbacks.current.onLocations(parseLocations(message.locations));
        frame.current?.contentWindow?.postMessage(
          { type: "satviz:data", payload: latest.current },
          location.origin,
        );
      } else if (
        message.type === "satviz:status" &&
        typeof message.message === "string"
      ) {
        if (
          message.status === "ready" ||
          message.status === "degraded" ||
          message.status === "error"
        )
          window.clearTimeout(timer);
        setFailed(message.status === "error");
        callbacks.current.onUnavailable(message.status === "error");
        setStatus(message.message);
      } else if (
        message.type === "satviz:select-zone" &&
        typeof message.zone === "string"
      ) {
        if (
          message.zone === "" ||
          latest.current.zones.some((z) => z.id === message.zone) ||
          latest.current.meters.some((m) => m.zone === message.zone)
        )
          callbacks.current.onZone(message.zone);
      } else if (
        message.type === "satviz:select-meter" &&
        typeof message.account === "string"
      ) {
        if (latest.current.meters.some((m) => m.account === message.account))
          callbacks.current.onMeter(message.account);
      } else if (
        message.type === "satviz:villa-link" &&
        typeof message.text === "string"
      ) {
        callbacks.current.onVillaLink?.(message.text.slice(0, 200));
      }
    };
    window.addEventListener("message", receive);
    const sendResize = () =>
      frame.current?.contentWindow?.postMessage(
        { type: "satviz:resize" },
        location.origin,
      );
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(sendResize);
    if (observer && frame.current) {
      observer.observe(frame.current);
    } else {
      window.addEventListener("resize", sendResize);
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", receive);
      window.removeEventListener("resize", sendResize);
      observer?.disconnect();
      ready.current = false;
    };
  }, [attempt]);
  const retry = () => {
    ready.current = false;
    setFailed(false);
    callbacks.current.onUnavailable(false);
    setStatus("Retrying satellite imagery…");
    setAttempt((a) => a + 1);
  };
  return (
    <div
      className={
        full
          ? // viewport-fit=cover: keep the map clear of the notch and the home bar
            "fixed inset-0 z-[150] flex min-w-0 flex-col bg-bg pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          : "relative min-w-0 space-y-2"
      }
    >
      {status && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-control border border-line bg-component p-3 text-body text-muted"
        >
          <p>{status}</p>
          {failed && (
            <>
              <a
                href="#satellite-meter-list"
                className="min-h-11 content-center underline focus-visible:outline-3 focus-visible:outline-accent"
              >
                Use meter table
              </a>
              <Button onClick={retry}>Retry map</Button>
            </>
          )}
        </div>
      )}
      {full && summary && (
        <p className="truncate border-b border-line bg-card px-3 py-2 text-caption tabular-nums text-fg">
          {summary}
        </p>
      )}
      {/* Everything drawn over the map is placed against the map itself, so the
          status line and the full-screen strip above never shift it. */}
      <div className={`relative min-h-0 ${full ? "flex flex-1 flex-col" : ""}`}>
        {!failed && (
          // Full screen on a phone: the meter sheet owns the bottom edge, so the
          // buttons move under the zone strip while a meter is open.
          <div
            className={`absolute left-3 z-20 flex flex-wrap gap-2 ${selected && full ? "max-sm:top-17 sm:bottom-3" : "bottom-3"}`}
          >
            <Button
              onClick={() =>
                frame.current?.contentWindow?.postMessage(
                  { type: "satviz:focus" },
                  location.origin,
                )
              }
            >
              {selected ? "Refocus meter" : "Fit zone"}
            </Button>
            <Button
              icon={full ? Minimize2 : Maximize2}
              aria-pressed={full}
              onClick={() => setFull((value) => !value)}
            >
              {full ? "Close full screen" : "Full screen"}
            </Button>
          </div>
        )}
        {!failed && !full && (
          // On a touch screen the embedded map would fight the page for the
          // finger, so the first tap opens it full screen instead.
          <button
            type="button"
            onClick={() => setFull(true)}
            className="absolute inset-0 z-10 hidden items-end justify-center pb-16 focus-visible:outline-3 focus-visible:outline-accent pointer-coarse:flex"
          >
            <span className="rounded-control border border-line bg-card px-3 py-2 text-label text-fg shadow-card">
              Tap to open the map
            </span>
          </button>
        )}
        <iframe
          style={
            full
              ? { height: "100%", flex: 1 }
              : { height: "70svh", minHeight: 360, maxHeight: 720 }
          }
          onLoad={() => {
            syncTheme();
            frame.current?.contentWindow?.postMessage(
              { type: "satviz:mode", full },
              location.origin,
            );
            frame.current?.contentWindow?.postMessage(
              { type: "satviz:hello" },
              location.origin,
            );
          }}
          key={attempt}
          ref={frame}
          src="/satellite/consumption.html?v=24"
          title="Water consumption satellite map"
          className={`${failed ? "hidden" : "block"} w-full border-0 ${full ? "" : "rounded-b-card"}`}
        />
        {/* Embedded, the page's own panels carry the details; the sheet is for
            full screen, where those panels are out of view. */}
        {!failed && full && children}
      </div>
    </div>
  );
}
