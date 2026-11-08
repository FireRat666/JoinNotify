// Join Notify as a SideQuest/Altspace Creator SDK snippet.
//
//   <bs-snippet name="notify" title="Join Notify" single="true"
//     script="https://join-notify.firer.at/snippet.js"></bs-snippet>
//
// Shows Altspace's native toast when another player joins (or leaves) the space.
//
// JavaScript can't raise the native toast, but Visual Scripting can. So this script loads a tiny kit
// (an asset bundle holding one prefab with a Visual Scripting graph) and spawns it. This script decides
// who and what to announce, and sends each notification to the graph with SendToVisualScripting.
//
// Settings (attributes on the element, all optional):
//   join-message   Text for joins, {name} is the player's name.          Default "{name} joined"
//   leave-message  Text for leaves.                                       Default "{name} left"
//   notify-leaves  "true" to announce leaves too.                         Default false
//   duration       Seconds each notification stays up (whole seconds).   Default 5
//   color          Notification colour, "#rrggbb".                        Default "#2a2a2a"
//   cooldown       Seconds after the space loads before announcing,
//                  so the players already there aren't announced.         Default 10
//   admins-only    "true" so only space admins get notifications.         Default false
//   join-sound     URL of a .mp3, .wav or .ogg to play with joins.
//                  Blank for no sound.                                    Default ping.ogg next to this file
//   leave-sound    The same for leaves.                                   Default ping.ogg next to this file
//   sound-volume   0 to 1.                                                Default 0.5
//   bundle-base    Folder URL of the kit bundles.                         Default bundles/ next to this file
(() => {
  const SNIPPET_NAME = 'notify';
  const BUNDLE_FILE = 'jointoast';
  // The app caches kit bundles by URL, so bump this whenever the bundles are rebuilt.
  const BUNDLE_VERSION = '2';
  const DEFAULT_COLOR = '#2a2a2a';
  const DEFAULT_SOUND = 'ping.ogg'; // next to this file
  // Return IDs the kit's graph listens for.
  const MESSAGE_ID = 'join-notify';
  const DURATION_ID = 'join-notify-duration';
  const COLOR_ID = 'join-notify-color';
  const LOG = 'Join Notify (snippet)';

  const thisScript = document.currentScript;
  let spawned = false;

  const bundleUrls = (el) => {
    const scriptUrl = el.getAttribute('script') || (thisScript && thisScript.src) || location.href;
    const custom = (el.getAttribute('bundle-base') || '').trim();
    const base = new URL(custom || 'bundles/', new URL(scriptUrl, location.href));
    if (!base.pathname.endsWith('/')) base.pathname += '/';
    const url = (platform) => new URL(`${platform}/${BUNDLE_FILE}?v=${BUNDLE_VERSION}`, base).href;
    return {
      windowsUrl: url('windows'),
      androidUrl: url('android'),
      linuxUrl: url('linux'),
      osxUrl: url('osx'),
      isScene: false,
    };
  };

  const readSettings = (el) => {
    const str = (name, fallback) => {
      const value = (el.getAttribute(name) || '').trim();
      return value === '' ? fallback : value;
    };
    const num = (name, fallback) => {
      const value = parseFloat(str(name, ''));
      return Number.isFinite(value) && value >= 0 ? value : fallback;
    };
    const bool = (name, fallback) => {
      const value = str(name, '').toLowerCase();
      return value === '' ? fallback : value === 'true';
    };
    let color = str('color', DEFAULT_COLOR);
    if (!color.startsWith('#')) color = '#' + color;
    if (!/^#[0-9a-f]{6}$/i.test(color)) color = DEFAULT_COLOR;
    const scriptUrl = new URL(el.getAttribute('script') || (thisScript && thisScript.src) || location.href, location.href);
    // Left out: the default sound. Present but blank: no sound.
    const sound = (name) => {
      const value = el.getAttribute(name);
      if (value === null) return new URL(DEFAULT_SOUND, scriptUrl).href;
      return value.trim() === '' ? '' : new URL(value.trim(), scriptUrl).href;
    };
    return {
      joinMessage: str('join-message', '{name} joined'),
      leaveMessage: str('leave-message', '{name} left'),
      notifyLeaves: bool('notify-leaves', false),
      duration: Math.max(1, Math.round(num('duration', 5))),
      color,
      cooldown: num('cooldown', 10),
      adminsOnly: bool('admins-only', false),
      joinSound: sound('join-sound'),
      leaveSound: sound('leave-sound'),
      soundVolume: Math.min(1, num('sound-volume', 0.5)),
    };
  };

  const spawn = async (el) => {
    // One graph per world: a second copy would show every toast twice.
    if (spawned) return;
    spawned = true;
    const scene = BS.Scene.GetInstance();
    const settings = readSettings(el);

    // Nothing is announced until the cooldown after the space loads has passed.
    let readyAt = Infinity;
    scene.On('unity-loaded', () => {
      readyAt = performance.now() + settings.cooldown * 1000;
    });

    let audio = null;
    const notify = async (template, sound, user) => {
      if (!user || user.isLocal || performance.now() < readyAt) return;
      if (settings.adminsOnly && !(scene.localUser && scene.localUser.isSpaceAdmin)) return;
      // Quotes and backslashes would come through JSON escaped, so leave them out.
      const name = String(user.name || 'Someone');
      const message = template.split('{name}').join(name).replace(/["\\]/g, '');
      await scene.SendToVisualScripting(DURATION_ID, settings.duration);
      await scene.SendToVisualScripting(COLOR_ID, settings.color);
      await scene.SendToVisualScripting(MESSAGE_ID, message);
      if (audio && sound) audio.PlayOneShotFromUrl(sound).catch((e) => console.warn(`${LOG}: sound failed`, e));
    };
    scene.On('user-joined', (e) => notify(settings.joinMessage, settings.joinSound, e.detail));
    scene.On('user-left', (e) => {
      if (settings.notifyLeaves) notify(settings.leaveMessage, settings.leaveSound, e.detail);
    });

    try {
      const urls = bundleUrls(el);
      const obj = new BS.GameObject({ name: 'JoinNotify' });
      await obj.Async();
      await obj.AddComponent(new BS.AssetBundle(urls));
      // "*" = the first prefab in the AssetBundle on this same object.
      await obj.AddComponent(new BS.KitItem({ path: '*' }));
      if (settings.joinSound || settings.leaveSound) {
        // 2D, so it sounds the same wherever you stand.
        audio = await obj.AddComponent(new BS.AudioSource({ volume: settings.soundVolume, spatialBlend: 0, playOnAwake: false }));
      }
      console.log(`${LOG}: loading kit (bundle v${BUNDLE_VERSION})`);
    } catch (e) {
      console.error(`${LOG}: failed to start`, e);
    }
  };

  const scan = () => {
    const el = document.querySelector(`bs-snippet[name="${SNIPPET_NAME}"]`);
    if (el) spawn(el);
  };

  window.addEventListener('bs-loaded', () => {
    scan();
    // Placements added later, e.g. with document.createElement('bs-snippet').
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  });
})();
