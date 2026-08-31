# Letting Claude drive your Mac and Chrome

The `sync-grafana-water` and `sync-aitable-stp` skills don't call an API — they
open a real Chrome window, log into NEC Oman Grafana or AITable with your own
session, read the table off the screen and write the rows to Supabase. To do
that they need two tool families:

| Tools the skills call | What provides them |
|---|---|
| `mcp__computer-use__open_application` | the built-in **`computer-use`** MCP server |
| `mcp__Claude_in_Chrome__*` (`tabs_context_mcp`, `find`, `form_input`, `javascript_tool`, `computer`) | the **Claude in Chrome** extension |

**Neither is a plugin, a marketplace item, or an npm package.** Both ship inside
Claude Code. They are off until you switch them on, and switching them on is a
one-time job on the Mac itself — the toggles live in `~/.claude.json` and in
macOS's privacy database, so nothing in this repo can turn them on for you.

Run the preflight first; it tells you which of the steps below you still owe:

```bash
./scripts/setup-mac-control.sh          # check
./scripts/setup-mac-control.sh --open   # check, and open the extension page
```

---

## Before you start

| Requirement | Why |
|---|---|
| **macOS** | Computer use in the CLI is macOS-only. Chrome control also works on Windows/Linux; screen control does not. |
| **Pro or Max plan** | Computer use is a research preview limited to Pro and Max — *not* Team or Enterprise. Chrome needs any direct Anthropic plan. Check with `/status`. |
| **Signed in with `/login`** | An `ANTHROPIC_API_KEY` or a `claude setup-token` token silently disables **both** features — the extension can't authenticate with those credentials, so Claude Code keeps Chrome off even when you pass `--chrome`. If you have a key exported in `~/.zshrc`, remove it. |
| **An interactive session** | Computer use won't load under `claude -p`. The sync skills must be run from a real terminal session, not a script or a cron job. |

---

## 1. Screen control (`computer-use`)

```
cd ~/path/to/muscatbay
claude
/mcp
```

Find `computer-use` in the list, select it, choose **Enable**. The choice is
stored per project, so you do this once for this repo.

The first time Claude actually reaches for the screen, macOS asks for two
permissions:

- **Accessibility** — lets Claude click, type and scroll
- **Screen Recording** — lets Claude see what's on screen

Grant both. macOS usually needs Claude Code fully quit and restarted after
Screen Recording before it takes effect.

### What to expect while it runs

- Claude asks per app, per session — approving Chrome does not approve Finder.
  Terminals and IDEs carry an "equivalent to shell access" warning, Finder a
  "can read or write any file" one.
- Your other apps are hidden while Claude works, then restored. Your terminal
  stays visible and is excluded from screenshots.
- **`Esc` from anywhere aborts immediately.** A notification says so when the
  session takes control.
- Only one Claude session can drive the machine at a time. The lock is held
  until that session *exits*, not until its task finishes — so if you get
  "Computer use is in use by another Claude session", quit the other one.

---

## 2. Browser control (Claude in Chrome)

Install the extension (v1.0.36 or newer):

<https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn>

Then start Claude Code with Chrome enabled:

```bash
claude --chrome
```

To stop typing the flag every time, run `/chrome` and pick **Enabled by
default**. `/chrome` is also the status panel — you're ready when it shows
`Status: Enabled` and `Extension: Installed`.

> Enabling Chrome by default loads the browser tools into every session, which
> costs context. If you notice sessions filling up faster, turn it back off and
> use `--chrome` only for sync runs.

Claude opens its own tab group and shares your login state, so the Grafana and
AITable sessions you're already signed into just work. When it hits a login
page or a CAPTCHA it stops and asks you to handle it.

---

## 3. Check it end to end

```
sync water data
```

That should launch Chrome unattended, land on the Grafana dashboard, and start
reading. If you'd rather test something smaller first:

```
Open Chrome, go to grafana.nec-oman.com, and tell me the page title.
```

---

## When it breaks

| Symptom | Fix |
|---|---|
| `computer-use` missing from `/mcp` | You're not on macOS, not on Pro/Max, not signed in via claude.ai, or you're in `-p` mode. |
| "Browser extension is not connected" | Restart Chrome *and* Claude Code, then `/chrome` → **Reconnect extension**. |
| Extension shows "Not detected" | Check it's enabled at `chrome://extensions`. |
| Worked earlier, dead after a long session | The extension's service worker idled out. `/chrome` → **Reconnect extension**. |
| "No tab available" | Ask Claude to open a new tab and retry. |
| Browser ignores every command | A JavaScript modal is blocking the page — dismiss it by hand, then tell Claude to continue. |
| Permission prompt keeps reappearing | Quit Claude Code completely and reopen. Confirm your terminal is listed under **System Settings → Privacy & Security → Screen Recording**. |

The native messaging host that bridges Claude Code and the extension is written
on first use to:

```
~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json
```

Chrome only reads it at startup, so if the extension isn't detected on your
first attempt, restart Chrome. Edge, Brave, Vivaldi and Arc use the same
filename under their own Application Support folder.

---

## A note on trust

Computer use runs on your real desktop, not in the Bash tool's sandbox. Claude
screens each action for prompt injection from what's on screen, but a page it
reads is untrusted input — Grafana and AITable are yours, which is exactly why
they're reasonable targets for this. Keep the approvals narrow: the sync skills
need Chrome, and nothing else.

Anthropic's guidance: <https://support.claude.com/en/articles/14128542>

## Sources

- [Use Claude Code with Chrome](https://code.claude.com/docs/en/chrome)
- [Let Claude use your computer from the CLI](https://code.claude.com/docs/en/computer-use)
