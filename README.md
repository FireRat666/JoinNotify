# Join Notify

Shows Altspace's native notification ("Alex joined") when another player joins the space. You don't get one for yourself, or for people already there when you arrive.

## How it works

JavaScript can't raise the native notification, but Visual Scripting can (the **Add Toast Message** node). So `snippet.js` loads a tiny kit (an asset bundle holding one prefab) and spawns it with `BS.AssetBundle` + `BS.KitItem("*")`. The prefab's graph does the work:

```
On User Joined -> If (User Info.isLocal) -> false: Add Toast Message (String.Concat(name, " joined"))
```

The graph only uses nodes on the app's allow list (checked with the SDK's Visual Scripting validator).

## Files

| Path | What it is |
|------|------------|
| `snippet.js` | Loads the kit. Host it next to `bundles/`. |
| `snippet.html` | The `<bs-snippet>` element to paste into `Assets/WebRoot/index.html`. |
| `bundles/<platform>/jointoast` | The kit, built for windows, android, linux and osx. |

## Add it to a world

Paste into `Assets/WebRoot/index.html`, between the snippet section comments:

```html
<bs-snippet name="notify" title="Join Notify" single="true"
  script="https://join-notify.firer.at/snippet.js"></bs-snippet>
```

Toasts don't show in Play mode.