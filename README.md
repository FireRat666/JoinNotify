# Join Notify

Shows Altspace's native notification ("Alex joined") when another player joins the space, and optionally when they leave. You don't get one for yourself, or for the people already there when you arrive.

Includes options to show randomly generated funny join messages in the notification toasts and optionally speak them aloud via TTS (`https://speak.firer.at`). Every player in the space sees and hears the exact same message when someone joins.

## How it works

JavaScript can't raise the native notification, but Visual Scripting can (the **Add Toast Message** node). So `snippet.js` loads a tiny kit (an asset bundle holding one prefab) and spawns it with `BS.AssetBundle` + `BS.KitItem("*")`.

`snippet.js` decides who and what to announce, and sends each notification to the kit's graph with `scene.SendToVisualScripting`. The graph only shows it:

```
On BS Callback "join-notify-duration" -> String To Float -> duration variable
On BS Callback "join-notify-color"    -> TryParseHtmlString -> color variable
On BS Callback "join-notify"          -> Add Toast Message (message, duration, color)
```

The graph only uses nodes on the app's allow list (checked with the SDK's Visual Scripting validator).

When funny messages are enabled (`funny-messages="true"`), the script deterministically selects a message from a clean list of over 80 funny messages (or your custom list) using an FNV-1a hash of the player's info, session, room state, and a synchronized 5-minute time bucket (`Math.floor(Date.now() / 300000)`).
- **Varied across visits:** Messages vary continuously across the day, different visits, and reconnects.
- **Synchronized in space:** Because all clients calculate the same hash for that join, **every player in the room sees (and hears) the exact same message**.
- **No minute-edge drift:** The 5-minute window virtually eliminates the boundary race condition that would happen with a 1-minute bucket across different device clocks.

## Files

| Path | What it is |
|------|------------|
| `snippet.js` | Loads the kit and sends the notifications. Host it next to `bundles/`. |
| `snippet.html` | The `<bs-snippet>` element to paste into `Assets/WebRoot/index.html`. |
| `ping.ogg` | The default notification sound. |
| `bundles/<platform>/jointoast` | The kit, built for windows, android, linux and osx. |

## Add it to a world

Paste into `Assets/WebRoot/index.html`, between the snippet section comments:

```html
<bs-snippet name="notify" title="Join Notify" single="true"
  script="https://join-notify.firer.at/snippet.js"></bs-snippet>
```

### Examples

**Funny Toasts Only (with standard ping sound, no voice):**
```html
<bs-snippet name="notify" title="Join Notify" single="true"
  script="https://join-notify.firer.at/snippet.js"
  funny-messages="true">
</bs-snippet>
```

**Funny Toasts + Spoken TTS Voice:**
```html
<bs-snippet name="notify" title="Join Notify" single="true"
  script="https://join-notify.firer.at/snippet.js"
  funny-messages="true"
  speak-joins="true">
</bs-snippet>
```

**Standard Toasts + Spoken TTS Voice:**
```html
<bs-snippet name="notify" title="Join Notify" single="true"
  script="https://join-notify.firer.at/snippet.js"
  speak-joins="true">
</bs-snippet>
```

## Settings

All optional, as simple attributes on the `<bs-snippet>` element.

| Attribute | Default | What it does |
|-----------|---------|--------------|
| `funny-messages` | `false` | `true` to display randomly chosen funny join messages in toasts instead of `{name} joined`. Synchronized so all players see the same message. |
| `speak-joins` | `false` | `true` to speak the join message out loud via TTS (`https://speak.firer.at`) instead of playing `join-sound`. |
| `join-sound` | `ping.ogg` | URL of a `.mp3`, `.wav` or `.ogg` sound to play when someone joins. Leave blank for silent. |
| `join-message` | `{name} joined` | Standard toast text used when `funny-messages` is `false`. `{name}` is replaced by the player's name. |
| `notify-leaves` | `false` | `true` to announce when players leave too. |
| `funny-leaves` | `false` | `true` to display funny departure messages in toasts. Synchronized across all players. |
| `speak-leaves` | `false` | `true` to speak leave messages out loud via TTS. |
| `leave-sound` | `ping.ogg` | Sound to play when someone leaves. Leave blank for silent. |
| `leave-message` | `{name} left` | Standard toast text used when `funny-leaves` is `false`. |
| `duration` | `5` | Seconds each notification stays up (whole seconds). |
| `color` | `#2a2a2a` | Notification colour, `#rrggbb`. |
| `cooldown` | `10` | Seconds after the space loads before anything is announced, so people already in the room aren't spammed. |
| `admins-only` | `false` | `true` so only space admins (owner, moderators) get notifications. |
| `sound-volume` | `0.5` | Sound effect / voice volume, 0 to 1. |
| `join-messages` | Clean built-in list | Optional custom join message templates separated by `\|` or a JSON string array. Supports `{name}` or `<user>`. |
| `bundle-base` | `bundles/` next to the script | Folder URL to load the kit from instead. |

Quotes and backslashes are left out of messages.

## Rebuilding the kit

The builder lives in the Unity project `6.3-URP-Aspace-02` at `Assets/JoinToast/Editor/JoinToastBuilder.cs`:

1. **Tools > Join Toast > Build Prefab** makes `Assets/JoinToast/JoinToast.prefab`.
2. **Tools > Join Toast > Build Bundles** writes `Builds/JoinToast/<platform>/jointoast`.
3. Copy those into `bundles/` here, and bump `BUNDLE_VERSION` in `snippet.js`. The app caches bundles by URL, so without a new version players keep the old one.

Toasts don't show in Play mode. Instead the builder logs `[JoinToast] Toast requested: ...` to the Console, and **Tools > Join Toast > Test: Send Notification** sends one through the graph.
