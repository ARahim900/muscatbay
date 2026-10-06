import SwiftUI
import WidgetKit

// Muscat Bay — Home Screen water widget.
//
// Shows the Water → Daily figures for the latest recorded day, fetched from
// https://www.muscatbay.work/api/widget/water with the per-device key the app
// stores in the shared App Group when it pairs. Figures are computed on the
// server with the Daily page's own functions; this file only displays them.
// Missing readings are never filled: a partly read day says so.
//
// Spec: docs/superpowers/specs/2026-10-06-ios-home-widget-design.md

enum Shared {
    static let appGroup = "group.work.muscatbay.app"
    static let keyName = "widgetKey"
    static let rejectedName = "widgetKeyRejected"
    static let cacheName = "widgetCache"
    static let feed = URL(string: "https://www.muscatbay.work/api/widget/water")!
    static let openDaily = URL(string: "muscatbayshell://water/daily")!
    static let refresh: TimeInterval = 30 * 60

    static var defaults: UserDefaults? { UserDefaults(suiteName: appGroup) }
}

// MARK: - Feed model

struct ZoneLoss: Codable, Equatable {
    let name: String
    let lossM3: Double
    let lossPct: Double?
    let severity: String
}

struct WaterSummary: Codable, Equatable {
    let date: String
    let supplyM3: Double
    let lossM3: Double
    let lossPct: Double?
    let severity: String
    let worstZone: ZoneLoss?
    let metersRead: Int
    let metersTotal: Int
    let partial: Bool
}

struct FeedResponse: Codable {
    let summary: WaterSummary?
}

/// The last summary that arrived, kept so a dropped connection shows the
/// previous figures with their time instead of an empty widget.
struct CachedSummary: Codable {
    let summary: WaterSummary?
    let fetchedAt: Date
}

enum WidgetState: Equatable {
    /// No key yet, or the server refused it.
    case notConnected
    /// Connected, but no month holds a reading yet.
    case noReadings
    case ready(WaterSummary, fetchedAt: Date, stale: Bool)
}

struct WaterEntry: TimelineEntry {
    let date: Date
    let state: WidgetState
}

// MARK: - Timeline

struct WaterProvider: TimelineProvider {
    func placeholder(in context: Context) -> WaterEntry {
        WaterEntry(date: .now, state: .notConnected)
    }

    func getSnapshot(in context: Context, completion: @escaping (WaterEntry) -> Void) {
        // The widget gallery shows the last real figures, never sample numbers.
        completion(WaterEntry(date: .now, state: cachedState(stale: false) ?? .notConnected))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WaterEntry>) -> Void) {
        Task {
            let state = await loadState()
            let next = Date.now.addingTimeInterval(Shared.refresh)
            completion(Timeline(entries: [WaterEntry(date: .now, state: state)], policy: .after(next)))
        }
    }

    private func cachedState(stale: Bool) -> WidgetState? {
        guard
            let data = Shared.defaults?.data(forKey: Shared.cacheName),
            let cached = try? JSONDecoder().decode(CachedSummary.self, from: data)
        else { return nil }
        guard let summary = cached.summary else { return .noReadings }
        return .ready(summary, fetchedAt: cached.fetchedAt, stale: stale)
    }

    private func loadState() async -> WidgetState {
        guard
            let defaults = Shared.defaults,
            let key = defaults.string(forKey: Shared.keyName),
            defaults.string(forKey: Shared.rejectedName) != "1"
        else { return .notConnected }

        var request = URLRequest(url: Shared.feed, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 20)
        request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            if status == 401 {
                // The key was revoked or its owner lost access: the app pairs
                // again on its next launch.
                defaults.set("1", forKey: Shared.rejectedName)
                defaults.removeObject(forKey: Shared.cacheName)
                return .notConnected
            }
            guard status == 200 else { return cachedState(stale: true) ?? .notConnected }
            let feed = try JSONDecoder().decode(FeedResponse.self, from: data)
            let cached = CachedSummary(summary: feed.summary, fetchedAt: .now)
            if let encoded = try? JSONEncoder().encode(cached) {
                defaults.set(encoded, forKey: Shared.cacheName)
            }
            guard let summary = feed.summary else { return .noReadings }
            return .ready(summary, fetchedAt: cached.fetchedAt, stale: false)
        } catch {
            return cachedState(stale: true) ?? .notConnected
        }
    }
}

// MARK: - Brand

extension Color {
    /// A colour that follows light/dark mode.
    init(light: UInt32, dark: UInt32) {
        self.init(uiColor: UIColor { traits in
            let hex = traits.userInterfaceStyle == .dark ? dark : light
            return UIColor(
                red: CGFloat((hex >> 16) & 0xFF) / 255,
                green: CGFloat((hex >> 8) & 0xFF) / 255,
                blue: CGFloat(hex & 0xFF) / 255,
                alpha: 1
            )
        })
    }

    static let mbHeading = Color(light: 0x4E4456, dark: 0xA4C5BB)
    static let mbText = Color(light: 0x0A0A0A, dark: 0xF7F8F9)
    static let mbMuted = Color(light: 0x454545, dark: 0xE5E7EB)
    static let mbCard = Color(light: 0xFFFFFF, dark: 0x16141B)

    /// Daily severity bands, as the Daily page colours them.
    static func severity(_ value: String) -> Color {
        switch value {
        case "good": return Color(light: 0x84B59F, dark: 0x84B59F)
        case "moderate": return Color(light: 0xE8C064, dark: 0xE8C064)
        case "high", "critical": return Color(light: 0xD67A7A, dark: 0xD67A7A)
        case "check": return Color(light: 0x6B9AC4, dark: 0x6B9AC4)
        default: return Color(light: 0x6B7280, dark: 0x6B7280)
        }
    }
}

enum Format {
    static func volume(_ m3: Double) -> String {
        m3.formatted(.number.precision(.fractionLength(0)).grouping(.automatic)) + " m³"
    }

    static func percent(_ value: Double?) -> String {
        guard let value else { return "—" }
        return value.formatted(.number.precision(.fractionLength(1))) + "%"
    }

    /// "2026-10-05" → "5 Oct" (or "Mon 5 Oct" with the weekday).
    static func day(_ iso: String, weekday: Bool = false) -> String {
        let parser = DateFormatter()
        parser.calendar = Calendar(identifier: .gregorian)
        parser.locale = Locale(identifier: "en_GB_POSIX")
        parser.dateFormat = "yyyy-MM-dd"
        guard let date = parser.date(from: iso) else { return iso }
        let output = DateFormatter()
        output.locale = Locale(identifier: "en_GB")
        output.dateFormat = weekday ? "EEE d MMM" : "d MMM"
        return output.string(from: date)
    }

    static func time(_ date: Date) -> String {
        date.formatted(date: .omitted, time: .shortened)
    }

    static func severityLabel(_ value: String) -> String {
        switch value {
        case "good": return "Good"
        case "moderate": return "Moderate"
        case "high": return "High"
        case "critical": return "Critical"
        case "check": return "Check meters"
        default: return "No data"
        }
    }
}

// MARK: - Views

struct SeverityDot: View {
    let severity: String
    var body: some View {
        Circle()
            .fill(Color.severity(severity))
            .frame(width: 10, height: 10)
            .accessibilityHidden(true)
    }
}

/// Partial / meters read, or the time of the last figures when offline.
struct FootLine: View {
    let summary: WaterSummary
    let fetchedAt: Date
    let stale: Bool
    var body: some View {
        Group {
            if stale {
                Text("As of \(Format.time(fetchedAt))")
            } else if summary.partial {
                Text("Partial · \(summary.metersRead)/\(summary.metersTotal)")
            } else {
                Text("All \(summary.metersTotal) read")
            }
        }
        .font(.system(size: 14))
        .foregroundStyle(Color.mbMuted)
        .lineLimit(1)
        .minimumScaleFactor(0.85)
    }
}

struct HeadLine: View {
    let summary: WaterSummary
    let weekday: Bool
    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text("Water")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color.mbHeading)
                .widgetAccentable()
            Spacer(minLength: 4)
            Text(Format.day(summary.date, weekday: weekday))
                .font(.system(size: 14))
                .foregroundStyle(Color.mbMuted)
        }
        .lineLimit(1)
    }
}

struct LossBlock: View {
    let summary: WaterSummary
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(alignment: .center, spacing: 6) {
                SeverityDot(severity: summary.severity)
                Text(Format.percent(summary.lossPct))
                    .font(.system(size: 32, weight: .bold).monospacedDigit())
                    .foregroundStyle(Color.mbText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .widgetAccentable()
            }
            Text("Loss · \(Format.severityLabel(summary.severity))")
                .font(.system(size: 14))
                .foregroundStyle(Color.mbMuted)
                .lineLimit(1)
                .minimumScaleFactor(0.85)
        }
        .accessibilityElement(children: .combine)
    }
}

struct SmallWaterView: View {
    let summary: WaterSummary
    let fetchedAt: Date
    let stale: Bool
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HeadLine(summary: summary, weekday: false)
            Spacer(minLength: 0)
            LossBlock(summary: summary)
            Text("\(Format.volume(summary.supplyM3)) supply")
                .font(.system(size: 14, weight: .medium).monospacedDigit())
                .foregroundStyle(Color.mbText)
                .lineLimit(1)
                .minimumScaleFactor(0.85)
            FootLine(summary: summary, fetchedAt: fetchedAt, stale: stale)
        }
    }
}

struct MediumWaterView: View {
    let summary: WaterSummary
    let fetchedAt: Date
    let stale: Bool
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                HeadLine(summary: summary, weekday: true)
                Spacer(minLength: 0)
                LossBlock(summary: summary)
                Text("\(Format.volume(summary.supplyM3)) zone supply")
                    .font(.system(size: 14, weight: .medium).monospacedDigit())
                    .foregroundStyle(Color.mbText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Rectangle()
                .fill(Color(light: 0xE5E7EB, dark: 0x2A2731))
                .frame(width: 1)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 6) {
                Text("Worst zone")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.mbHeading)
                if let zone = summary.worstZone {
                    HStack(spacing: 6) {
                        SeverityDot(severity: zone.severity)
                        Text(zone.name)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Color.mbText)
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }
                    Text("\(Format.volume(zone.lossM3)) · \(Format.percent(zone.lossPct))")
                        .font(.system(size: 14).monospacedDigit())
                        .foregroundStyle(Color.mbMuted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                    Text(Format.severityLabel(zone.severity))
                        .font(.system(size: 14))
                        .foregroundStyle(Color.mbMuted)
                        .lineLimit(1)
                } else {
                    Text("No zone bulk read")
                        .font(.system(size: 14))
                        .foregroundStyle(Color.mbMuted)
                }
                Spacer(minLength: 0)
                FootLine(summary: summary, fetchedAt: fetchedAt, stale: stale)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct MessageView: View {
    let title: String
    let detail: String
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Water")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color.mbHeading)
                .widgetAccentable()
            Spacer(minLength: 0)
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Color.mbText)
            Text(detail)
                .font(.system(size: 14))
                .foregroundStyle(Color.mbMuted)
                .lineLimit(3)
                .minimumScaleFactor(0.85)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct WaterWidgetView: View {
    @Environment(\.widgetFamily) private var family
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
            if family == .systemMedium {
                MediumWaterView(summary: summary, fetchedAt: fetchedAt, stale: stale)
            } else {
                SmallWaterView(summary: summary, fetchedAt: fetchedAt, stale: stale)
            }
        }
    }
}

struct WaterWidget: Widget {
    let kind = "WaterWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WaterProvider()) { entry in
            WaterWidgetView(entry: entry)
        }
        .configurationDisplayName("Water today")
        .description("Zone supply, loss and the worst zone for the latest recorded day.")
        .supportedFamilies([.systemSmall, .systemMedium])
        // Home Screen only (owner decision). iPadOS can also offer a small
        // widget on its Lock Screen; this is the strongest exclusion iOS allows.
        .disfavoredLocations([.lockScreen], for: [.systemSmall, .systemMedium])
    }
}
