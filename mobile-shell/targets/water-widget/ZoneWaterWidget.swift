import SwiftUI
import WidgetKit

// Muscat Bay — Large "Water by zone" Home Screen widget.
//
// All seven zones at once for the latest recorded day: each zone's bulk
// reading against the sum of its meters that were read, the loss, and how
// many meters are missing. The ring's teal share is water that reached the
// meters; the rest is the loss, in its severity colour. Unread meters are
// never filled in: a zone with missing meters says how many.
//
// Shares the feed, cache and states of WaterWidget.swift.

extension Format {
    /// Whole m³ from 100 up, at most one decimal below, no trailing zero: 139 · 87.7 · 24 · 0.3
    static func compactVolume(_ m3: Double) -> String {
        let digits = abs(m3) >= 100 ? 0 : 1
        return m3.formatted(.number.precision(.fractionLength(0...digits)).grouping(.automatic))
    }

    static func wholePercent(_ value: Double?) -> String {
        guard let value else { return "—" }
        return value.formatted(.number.precision(.fractionLength(0))) + "%"
    }
}

/// Teal = share of the bulk that reached the meters; the rest = loss.
struct ZoneRing: View {
    let zone: ZoneBalance

    private var reached: Double? {
        guard let bulk = zone.bulkM3, bulk > 0 else { return nil }
        return min(max(zone.metersM3 / bulk, 0), 1)
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(reached == nil ? Color.severity("nodata") : Color.severity(zone.severity),
                        lineWidth: 5)
            if let reached {
                Circle()
                    .trim(from: 0, to: reached)
                    .stroke(Color(light: 0xA4C5BB, dark: 0xA4C5BB), style: StrokeStyle(lineWidth: 5))
                    .rotationEffect(.degrees(-90))
                    .widgetAccentable()
            }
        }
        .frame(width: 30, height: 30)
        .accessibilityHidden(true)
    }
}

struct ZoneRow: View {
    let zone: ZoneBalance

    private var figures: String {
        let meters = Format.compactVolume(zone.metersM3)
        guard let bulk = zone.bulkM3 else { return "Bulk not read · meters \(meters) m³" }
        return "\(Format.compactVolume(bulk)) → \(meters) m³"
    }

    private var coverage: String {
        let missing = zone.metersTotal - zone.metersRead
        return missing > 0 ? "\(missing) missing" : "all \(zone.metersTotal) read"
    }

    var body: some View {
        HStack(spacing: 10) {
            ZoneRing(zone: zone)
            VStack(alignment: .leading, spacing: 1) {
                Text(zone.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.mbText)
                Text("\(figures) · \(coverage)")
                    .font(.system(size: 14).monospacedDigit())
                    .foregroundStyle(Color.mbMuted)
            }
            .lineLimit(1)
            .minimumScaleFactor(0.8)
            Spacer(minLength: 4)
            VStack(alignment: .trailing, spacing: 1) {
                Text(Format.wholePercent(zone.lossPct))
                    .font(.system(size: 16, weight: .bold).monospacedDigit())
                    .foregroundStyle(Color.mbText)
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.severity(zone.severity))
                        .frame(width: 7, height: 7)
                    Text(Format.severityLabel(zone.severity))
                        .font(.system(size: 14))
                        .foregroundStyle(Color.mbMuted)
                }
            }
            .lineLimit(1)
            .minimumScaleFactor(0.8)
        }
        .accessibilityElement(children: .combine)
    }
}

struct ZoneListView: View {
    let summary: WaterSummary
    let zones: [ZoneBalance]
    let fetchedAt: Date
    let stale: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text("Water by zone")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.mbHeading)
                    .widgetAccentable()
                Spacer(minLength: 4)
                Text(stale
                     ? "\(Format.day(summary.date)) · as of \(Format.time(fetchedAt))"
                     : Format.day(summary.date, weekday: true))
                    .font(.system(size: 14))
                    .foregroundStyle(Color.mbMuted)
            }
            .lineLimit(1)
            .padding(.bottom, 4)

            ForEach(zones) { zone in
                Divider()
                ZoneRow(zone: zone)
                    .padding(.vertical, 5)
            }
            Spacer(minLength: 0)
        }
    }
}

struct ZoneWaterWidgetView: View {
    let entry: WaterEntry

    var body: some View {
        content
            .containerBackground(for: .widget) { Color.mbCard }
            .widgetURL(Shared.openDaily)
    }

    @ViewBuilder private var content: some View {
        switch entry.state {
        case .notConnected:
            MessageView(title: "Not connected", detail: "Open Muscat Bay once to connect.")
        case .noReadings:
            MessageView(title: "No readings yet", detail: "No daily reading has been recorded.")
        case let .ready(summary, fetchedAt, stale):
            if let zones = summary.zones, !zones.isEmpty {
                ZoneListView(summary: summary, zones: zones, fetchedAt: fetchedAt, stale: stale)
            } else {
                MessageView(title: "Zone figures not available",
                            detail: "Open Muscat Bay to refresh, or try again shortly.")
            }
        }
    }
}

struct ZoneWaterWidget: Widget {
    let kind = "ZoneWaterWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WaterProvider()) { entry in
            ZoneWaterWidgetView(entry: entry)
        }
        .configurationDisplayName("Water by zone")
        .description("Bulk, meters and loss for every zone on the latest recorded day.")
        .supportedFamilies([.systemLarge])
    }
}
