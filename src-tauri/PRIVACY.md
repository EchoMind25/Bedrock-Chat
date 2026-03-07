# Bedrock Chat Desktop — Privacy Architecture

This document details every system permission the Tauri desktop client requests,
what data stays local, and what may be transmitted over the network.

---

## System Permissions Requested

| Permission | Justification | Data Impact |
|---|---|---|
| `core:window:allow-start-dragging` | Enables window repositioning via drag regions | Local only — no data |
| `core:window:allow-set-title` | Updates window title to show current channel | Local only — no data |
| `core:window:allow-minimize` | Programmatic minimize (tray hide) | Local only — no data |
| `core:window:allow-maximize` | Programmatic maximize/restore | Local only — no data |
| `core:window:allow-close` | Programmatic close for tray behavior | Local only — no data |
| `core:window:allow-show` | Show window from tray / after DOM ready | Local only — no data |
| `core:window:allow-hide` | Hide window to tray | Local only — no data |
| `notification:allow-request-permission` | Prompt user for notification access | Local only — OS prompt |
| `notification:allow-notify` | Native OS notifications for messages/calls | Local only — displayed on device |
| `shell:allow-open` | Open URLs in default browser (OAuth, links) | Opens browser — URL visible to browser |

### Permissions NOT Granted (Deny by Default)

The following Tauri capabilities are **explicitly denied** and will not function:

- **File System (`fs`)** — No file read/write access. Chat attachments use Supabase storage via HTTPS, not local filesystem APIs.
- **Process (`process`)** — No ability to spawn or kill system processes.
- **OS Info (`os`)** — No access to OS version, architecture, or hostname.
- **Clipboard (`clipboard`)** — Not granted. Clipboard access uses standard web APIs within the webview, not Tauri's native clipboard plugin.
- **Global Shortcuts** — Not registered. No system-wide hotkeys.
- **HTTP Client** — All network requests go through the webview's standard fetch API with CSP enforcement, not Tauri's HTTP plugin.

---

## Data Flow: Local vs. Transmitted

### Stays Local (Never Leaves Device)

| Data | Purpose |
|---|---|
| Window position/size | User preference |
| Tray icon state | UI state |
| Process list (activity detection) | Game matching — raw list never transmitted |
| Notification permission state | OS-level setting |
| Auto-updater version check response | Cached locally |
| Auth tokens in webview storage | Supabase session tokens in IndexedDB/localStorage |

### Transmitted Over Network

| Data | Destination | Purpose | Encryption |
|---|---|---|---|
| Supabase auth tokens | `*.supabase.co` | Authentication | TLS 1.3 |
| Chat messages | `*.supabase.co` | Realtime messaging | TLS 1.3 + Row-Level Security |
| Voice/video streams | `*.livekit.cloud` | Voice channels | TLS 1.3 + SRTP |
| Matched game name only | `*.supabase.co` | Activity status | TLS 1.3 |
| App version + platform | `releases.bedrockchat.com` | Update check | TLS 1.3 |

---

## Data Minimization: Process Enumeration

The activity detection module (`src/activity.rs`) follows strict data minimization:

1. **Filename only**: `ProcessInfo.exe_filename` contains only the executable filename (e.g., `minecraft.exe`), never the full path. Full paths may reveal username, directory structure, or installed software inventory.

2. **No arguments**: Process command-line arguments are never captured. Arguments frequently contain tokens, API keys, file paths, URLs, and other sensitive data.

3. **Local matching only**: The raw process list is matched against a local game allowlist on the device. Only the matched game name (e.g., "Minecraft") is transmitted as the user's activity status — the process list itself never leaves the device.

4. **No PID transmission**: Process IDs are used internally for deduplication only and are never transmitted.

---

## GDPR Article 25 — Data Protection by Design and by Default

This application implements data protection by design through:

- **Deny-by-default permissions**: Tauri capabilities start with zero access and explicitly grant only what is needed.
- **Minimal data collection**: Process enumeration strips paths and arguments before any processing.
- **Local-first processing**: Game matching happens on-device; only the result (game name) is shared.
- **No telemetry**: The desktop client does not collect analytics, crash reports, or usage telemetry beyond what the web application already collects with user consent.
- **Transparent security policy**: CSP headers restrict all network communication to known first-party endpoints.

---

## COPPA Compliance Note

For users under 13 years of age covered by COPPA (Children's Online Privacy Protection Act):

- **Activity detection is disabled by default** for all users under 13.
- Parental **opt-in is required** within Family Account settings before any activity data (even the matched game name) is shared with the server.
- Parents can revoke activity sharing at any time from the Family Dashboard.
- The monitoring level set by parents in Family Account settings controls what data is visible to family members. See `lib/family/monitoring.ts` for level definitions.

---

## Content Security Policy

The CSP applied to the Tauri webview restricts all resource loading:

```
default-src 'self';
connect-src 'self' https://*.supabase.co wss://*.supabase.co
            https://*.livekit.cloud wss://*.livekit.cloud
            https://releases.bedrockchat.com;
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://*.supabase.co;
font-src 'self' data:;
media-src 'self' blob:;
worker-src 'self' blob:
```

This prevents:
- Loading scripts from external CDNs
- Connecting to unauthorized APIs
- Exfiltrating data to third-party domains
- XSS via injected external resources
