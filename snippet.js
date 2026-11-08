// Join Notify as a SideQuest/Altspace Creator SDK snippet.
//
//   <bs-snippet name="notify" title="Join Notify" single="true"
//     script="https://join-notify.firer.at/snippet.js"></bs-snippet>
//
// Shows Altspace's native toast ("<name> joined") when another player joins the space.
//
// JavaScript can't raise the native toast, but Visual Scripting can. So this script loads a tiny kit
// (an asset bundle holding one prefab with a Visual Scripting graph) and spawns it. The graph does the
// rest: On User Joined -> skip yourself -> Add Toast Message.
//
// The bundles sit next to this file in bundles/<platform>/jointoast. Set bundle-base on the element
// to load them from somewhere else.
(() => {
  const SNIPPET_NAME = 'notify';
  const BUNDLE_FILE = 'jointoast';
  // The app caches kit bundles by URL, so bump this whenever the bundles are rebuilt.
  const BUNDLE_VERSION = '1';
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

  const spawn = async (el) => {
    // One graph per world: a second copy would show every toast twice.
    if (spawned) return;
    spawned = true;
    try {
      const urls = bundleUrls(el);
      const obj = new BS.GameObject({ name: 'JoinNotify' });
      await obj.Async();
      await obj.AddComponent(new BS.AssetBundle(urls));
      // "*" = the first prefab in the AssetBundle on this same object.
      await obj.AddComponent(new BS.KitItem({ path: '*' }));
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
