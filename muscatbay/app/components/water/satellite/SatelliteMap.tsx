"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/mb-button";
import {
  parseLocations,
  type ConsumptionMeter,
  type MeterLocation,
} from "./consumptionModel";

export function SatelliteMap({
  meters,
  zone,
  selected,
  date,
  onLocations,
  onZone,
  onMeter,
  onUnavailable,
}: {
  meters: ConsumptionMeter[];
  zone: string;
  selected: string;
  date: string;
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
  const latest = useRef({ meters, zone, selected, date });
  const callbacks = useRef({ onLocations, onZone, onMeter, onUnavailable });
  const syncTheme = useCallback(() => {
    const element = frame.current;
    const embedded = element?.contentDocument;
    if (!element || !embedded?.documentElement) return;
    // The renderer is same-origin; share the app's resolved theme and loaded font.
    const theme = getComputedStyle(element);
    for (const token of [
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
    document.fonts?.forEach((font) => embedded.fonts.add(font));
  }, []);
  useEffect(() => {
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    syncTheme();
    document.fonts?.addEventListener("loadingdone", syncTheme);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", syncTheme);
    };
  }, [syncTheme]);
  useEffect(() => {
    callbacks.current = { onLocations, onZone, onMeter, onUnavailable };
  }, [onLocations, onZone, onMeter, onUnavailable]);
  useEffect(() => {
    latest.current = { meters, zone, selected, date };
    if (ready.current)
      frame.current?.contentWindow?.postMessage(
        { type: "satviz:update", payload: latest.current },
        location.origin,
      );
  }, [meters, zone, selected, date]);
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
        if (message.status === "ready" || message.status === "error")
          window.clearTimeout(timer);
        setFailed(message.status === "error");
        callbacks.current.onUnavailable(message.status === "error");
        setStatus(message.message);
      } else if (
        message.type === "satviz:select-zone" &&
        typeof message.zone === "string"
      ) {
        if (latest.current.meters.some((m) => m.zone === message.zone))
          callbacks.current.onZone(message.zone);
      } else if (
        message.type === "satviz:select-meter" &&
        typeof message.account === "string"
      ) {
        if (latest.current.meters.some((m) => m.account === message.account))
          callbacks.current.onMeter(message.account);
      }
    };
    window.addEventListener("message", receive);
    const observer = new ResizeObserver(() =>
      frame.current?.contentWindow?.postMessage(
        { type: "satviz:resize" },
        location.origin,
      ),
    );
    if (frame.current) observer.observe(frame.current);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", receive);
      observer.disconnect();
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
    <div className="min-w-0 space-y-2">
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
      <iframe
        style={{ height: "70svh", minHeight: 360, maxHeight: 720 }}
        onLoad={() => {
          syncTheme();
          frame.current?.contentWindow?.postMessage(
            { type: "satviz:hello" },
            location.origin,
          );
        }}
        key={attempt}
        ref={frame}
        src="/satellite/consumption.html"
        title="Water consumption satellite map"
        className={`${failed ? "hidden" : "block"} w-full rounded-b-card border-0`}
      />
    </div>
  );
}
