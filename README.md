# Join Notify

Shows Altspace's native notification ("Alex joined") when another player joins the space, and optionally when they leave. You don't get one for yourself, or for the people already there when you arrive.

## How it works

JavaScript can't raise the native notification, but Visual Scripting can (the **Add Toast Message** node). So `snippet.js` loads a tiny kit (an asset bundle holding one prefab) and spawns it with `BS.AssetBundle` + `BS.KitItem("*")`.

`snippet.js` decides who and what to announce, and sends each notification to the kit's graph with `scene.SendToVisualScripting`. The graph only shows it:

```
On BS Callback "join-notify-duration" -> String To Float -> duration variable
On BS Callback "join-notify-color"    -> TryParseHtmlString -> color variable
On BS Callback "join-notify"          -> Add Toast Message (message, duration, color)
```

The graph only uses nodes on the app's allow list (checked with the SDK's Visual Scripting validator).

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

## Settings

All optional, as attributes on the element.

| Attribute | Default | What it does |
|-----------|---------|--------------|
| `join-message` | `{name} joined` | Text for joins. `{name}` is the player's name. |
| `leave-message` | `{name} left` | Text for leaves. |
| `notify-leaves` | `false` | `true` to announce leaves too. |
| `duration` | `5` | Seconds each notification stays up (whole seconds). |
| `color` | `#2a2a2a` | Notification colour, `#rrggbb`. |
| `cooldown` | `10` | Seconds after the space loads before anything is announced, so the people already there aren't. |
| `admins-only` | `false` | `true` so only space admins (owner, moderators) get notifications. |
| `join-sound` | `ping.ogg` | URL of a `.mp3`, `.wav` or `.ogg` to play with join notifications. Blank for no sound. |
| `leave-sound` | `ping.ogg` | The same for leave notifications. |
| `sound-volume` | `0.5` | 0 to 1. |
| `bundle-base` | `bundles/` next to the script | Folder URL to load the kit from instead. |

Quotes and backslashes are left out of messages.

## Rebuilding the kit

The builder lives in the Unity project `6.3-URP-Aspace-02` at `Assets/JoinToast/Editor/JoinToastBuilder.cs`:

1. **Tools > Join Toast > Build Prefab** makes `Assets/JoinToast/JoinToast.prefab`.
2. **Tools > Join Toast > Build Bundles** writes `Builds/JoinToast/<platform>/jointoast`.
3. Copy those into `bundles/` here, and bump `BUNDLE_VERSION` in `snippet.js`. The app caches bundles by URL, so without a new version players keep the old one.

Toasts don't show in Play mode. Instead the builder logs `[JoinToast] Toast requested: ...` to the Console, and **Tools > Join Toast > Test: Send Notification** sends one through the graph.
