#!/usr/bin/env bash
#
# setup-mac-control.sh — preflight check for Claude Code's screen + browser control on macOS.
#
#   ./scripts/setup-mac-control.sh          # check everything, print what's missing
#   ./scripts/setup-mac-control.sh --open   # also open the extension install page
#
# WHY THIS EXISTS
#
# Two Muscat Bay skills — `sync-grafana-water` and `sync-aitable-stp` — drive a
# real Chrome window to pull readings out of NEC Oman Grafana and AITable. They
# call `mcp__computer-use__open_application` and `mcp__Claude_in_Chrome__*`.
# Both of those tool families are BUILT INTO Claude Code; neither is a plugin or
# an npm package. They are off by default and each needs a one-time local setup
# that cannot be committed to a repo (the toggles live in ~/.claude.json and in
# macOS's own privacy database). This script checks every precondition that CAN
# be checked from a shell and tells you exactly which manual step is left.
#
# It is read-only. Nothing here changes settings, grants permissions, or installs
# software — with `--open` it will open a Chrome Web Store URL, and that is all.
#
# Exit 0 = every automatic check passed. Exit 1 = something blocking is missing.

set -uo pipefail

CHROME_EXT_ID="fcoeoabgfenejglbffodgkkbkcdhcgfn"
CHROME_EXT_URL="https://chromewebstore.google.com/detail/claude/${CHROME_EXT_ID}"
NATIVE_HOST="com.anthropic.claude_code_browser_extension.json"
# Chrome integration refuses API-key auth cleanly from this version on.
MIN_CLAUDE_VERSION="2.1.216"
# The extension version Claude Code requires.
MIN_EXT_VERSION="1.0.36"

OPEN_STORE=0
[ "${1:-}" = "--open" ] && OPEN_STORE=1

if [ -t 1 ]; then
  BOLD=$(printf '\033[1m'); DIM=$(printf '\033[2m'); RESET=$(printf '\033[0m')
  GREEN=$(printf '\033[32m'); YELLOW=$(printf '\033[33m'); RED=$(printf '\033[31m')
else
  BOLD=""; DIM=""; RESET=""; GREEN=""; YELLOW=""; RED=""
fi

FAILURES=0
TODO_FILE=$(mktemp "${TMPDIR:-/tmp}/mb-mac-control.XXXXXX")
trap 'rm -f "$TODO_FILE"' EXIT

pass() { printf '  %s✓%s %s\n' "$GREEN" "$RESET" "$1"; }
warn() { printf '  %s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
fail() { printf '  %s✗%s %s\n' "$RED" "$RESET" "$1"; FAILURES=$((FAILURES + 1)); }
info() { printf '    %s%s%s\n' "$DIM" "$1" "$RESET"; }
head2() { printf '\n%s%s%s\n' "$BOLD" "$1" "$RESET"; }
todo() { printf '%s\n' "$1" >>"$TODO_FILE"; }

# version_ge A B -> true when dotted-numeric A >= B. Portable: BSD sort has no
# dependable -V, so compare field by field in awk.
version_ge() {
  awk -v a="$1" -v b="$2" '
    BEGIN {
      na = split(a, x, "."); nb = split(b, y, ".");
      n = (na > nb ? na : nb);
      for (i = 1; i <= n; i++) {
        u = (i <= na ? x[i] + 0 : 0); v = (i <= nb ? y[i] + 0 : 0);
        if (u > v) { exit 0 }
        if (u < v) { exit 1 }
      }
      exit 0
    }'
}

printf '%sClaude Code — screen and browser control preflight%s\n' "$BOLD" "$RESET"

# ---------------------------------------------------------------------------
# 1. Platform
# ---------------------------------------------------------------------------
head2 "1. Platform"
if [ "$(uname -s)" != "Darwin" ]; then
  fail "This machine is $(uname -s), not macOS."
  info "Computer use in the CLI is macOS-only. On Windows use the Claude desktop app instead."
  printf '\n%sStopping — the remaining checks only mean something on a Mac.%s\n' "$BOLD" "$RESET"
  exit 1
fi
pass "macOS $(sw_vers -productVersion 2>/dev/null || echo '(version unknown)')"

# ---------------------------------------------------------------------------
# 2. Claude Code
# ---------------------------------------------------------------------------
head2 "2. Claude Code"
if ! command -v claude >/dev/null 2>&1; then
  fail "\`claude\` is not on your PATH."
  info "Install it: https://code.claude.com/docs/en/quickstart"
  todo "Install Claude Code, then re-run this script."
else
  CLAUDE_VERSION=$(claude --version 2>/dev/null | awk '{print $1}')
  if [ -z "$CLAUDE_VERSION" ]; then
    warn "Claude Code is installed but did not report a version."
  elif version_ge "$CLAUDE_VERSION" "$MIN_CLAUDE_VERSION"; then
    pass "Claude Code $CLAUDE_VERSION (>= $MIN_CLAUDE_VERSION)"
  else
    fail "Claude Code $CLAUDE_VERSION is older than $MIN_CLAUDE_VERSION."
    todo "Update Claude Code — older builds mishandle Chrome auth."
  fi
fi

# ---------------------------------------------------------------------------
# 3. Authentication mode
# ---------------------------------------------------------------------------
# Chrome integration stays off for API-key and setup-token sessions: the browser
# extension cannot authenticate with those credentials. Computer use is likewise
# claude.ai-only. An exported key in your shell profile silently disables both.
head2 "3. Authentication"
KEY_SET=0
for var in ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN CLAUDE_CODE_OAUTH_TOKEN; do
  eval "value=\${$var:-}"
  if [ -n "$value" ]; then
    fail "$var is set in this shell."
    KEY_SET=1
  fi
done
if [ "$KEY_SET" -eq 1 ]; then
  info "Chrome integration and computer use both require signing in with /login."
  info "With a key or long-lived token exported, Claude Code keeps them off even with --chrome."
  todo "Unset the API key/token (check ~/.zshrc), then run: claude  →  /login"
else
  pass "No API key or long-lived token exported — /login credentials can be used."
fi
info "Plan check is manual: run /status inside Claude Code. Computer use needs Pro or Max"
info "(not Team or Enterprise); Chrome needs any direct Anthropic plan."

# ---------------------------------------------------------------------------
# 4. Browser, extension, native messaging host
# ---------------------------------------------------------------------------
# Fields: label | .app path | Application Support dir
BROWSERS=$(cat <<'EOF'
Google Chrome|/Applications/Google Chrome.app|Google/Chrome
Microsoft Edge|/Applications/Microsoft Edge.app|Microsoft Edge
Brave|/Applications/Brave Browser.app|BraveSoftware/Brave-Browser
Vivaldi|/Applications/Vivaldi.app|Vivaldi
Arc|/Applications/Arc.app|Arc/User Data
EOF
)

head2 "4. Browser and the Claude in Chrome extension"
SUPPORT_ROOT="$HOME/Library/Application Support"
FOUND_BROWSER=0
FOUND_EXTENSION=0
FOUND_HOST=0

while IFS='|' read -r label app_path support_dir; do
  [ -d "$app_path" ] || continue
  FOUND_BROWSER=1
  pass "$label is installed"

  profile_root="$SUPPORT_ROOT/$support_dir"

  # The extension unpacks to <profile>/Extensions/<id>/<version>_<build>/.
  ext_version=""
  while IFS= read -r ext_dir; do
    [ -n "$ext_dir" ] || continue
    candidate=$(ls -1 "$ext_dir" 2>/dev/null | sed 's/_.*$//' | sort -n -t. -k1,1 -k2,2 -k3,3 | tail -1)
    [ -n "$candidate" ] && ext_version="$candidate"
  done <<EOF
$(find "$profile_root" -maxdepth 3 -type d -name "$CHROME_EXT_ID" 2>/dev/null)
EOF

  if [ -n "$ext_version" ]; then
    if version_ge "$ext_version" "$MIN_EXT_VERSION"; then
      pass "  Claude extension $ext_version (>= $MIN_EXT_VERSION)"
    else
      warn "  Claude extension $ext_version is older than $MIN_EXT_VERSION"
      todo "Update the Claude extension in $label (chrome://extensions → Update)."
    fi
    FOUND_EXTENSION=1
  else
    warn "  Claude extension not found in $label"
  fi

  # Claude Code writes this manifest the first time Chrome integration is enabled.
  # Chrome only reads it at startup, so a fresh install needs a browser restart.
  if [ -f "$profile_root/NativeMessagingHosts/$NATIVE_HOST" ]; then
    pass "  Native messaging host registered"
    FOUND_HOST=1
  else
    warn "  Native messaging host not registered for $label"
  fi
done <<EOF
$BROWSERS
EOF

if [ "$FOUND_BROWSER" -eq 0 ]; then
  fail "No supported Chromium browser found in /Applications."
  info "Chrome, Edge, Brave, Vivaldi and Arc all work. Chrome is the one the sync skills assume."
  todo "Install Google Chrome: https://www.google.com/chrome/"
fi

if [ "$FOUND_BROWSER" -eq 1 ] && [ "$FOUND_EXTENSION" -eq 0 ]; then
  fail "The Claude in Chrome extension is not installed in any browser."
  info "$CHROME_EXT_URL"
  todo "Install the Claude in Chrome extension, then restart Chrome."
  if [ "$OPEN_STORE" -eq 1 ]; then
    info "Opening the Chrome Web Store page…"
    open "$CHROME_EXT_URL" >/dev/null 2>&1 || warn "Could not open the browser automatically."
  else
    info "Re-run with --open to open that page for you."
  fi
fi

if [ "$FOUND_EXTENSION" -eq 1 ] && [ "$FOUND_HOST" -eq 0 ]; then
  warn "Extension present but Claude Code has never registered its messaging host."
  todo "Run: claude --chrome   (this writes the host file), then restart Chrome."
fi

# ---------------------------------------------------------------------------
# 5. Steps only you can do
# ---------------------------------------------------------------------------
# Accessibility and Screen Recording live in macOS's TCC database, which is
# deliberately unreadable by other processes — no script can honestly report
# their state. Claude Code prompts for both the first time it needs the screen.
head2 "5. Manual steps (no script can do these for you)"
cat <<'MANUAL'
  a. Screen control — start Claude Code in this repo, run /mcp, select
     computer-use, choose Enable. The choice sticks per project.
     macOS then asks for Accessibility (click, type, scroll) and Screen
     Recording (see the screen) the first time Claude uses them. Grant both;
     Screen Recording usually needs Claude Code restarted afterwards.

  b. Browser control — run /chrome and pick "Enabled by default", or start
     sessions with `claude --chrome`. Ready when /chrome shows
     "Status: Enabled" and "Extension: Installed".

  c. Verify end to end — ask Claude: "open Chrome and tell me the page title".
MANUAL

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
head2 "Summary"
if [ -s "$TODO_FILE" ]; then
  printf '  Before the sync skills will run, do this:\n\n'
  n=1
  while IFS= read -r line; do
    printf '   %d. %s\n' "$n" "$line"
    n=$((n + 1))
  done <"$TODO_FILE"
  printf '\n  Then the manual steps in section 5.\n'
else
  printf '  %sEvery automatic check passed.%s Finish the manual steps in section 5 if you\n' "$GREEN" "$RESET"
  printf '  have not already, then `sync water data` should drive Chrome on its own.\n'
fi

printf '\n  Full walkthrough: docs/mac-control-setup.md\n'

[ "$FAILURES" -eq 0 ]
