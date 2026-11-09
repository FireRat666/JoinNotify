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
//   funny-messages "true" to show randomly selected funny join messages in toasts. Default false
//   speak-joins    "true" to speak join announcements aloud via TTS.             Default false
//   join-sound     URL of a .mp3, .wav or .ogg to play with joins. Blank for none. Default ping.ogg next to this file
//   join-message   Text for joins when funny-messages is false.                   Default "{name} joined"
//   notify-leaves  "true" to announce leaves too.                                 Default false
//   funny-leaves   "true" to use funny leave messages.                           Default false
//   speak-leaves   "true" to speak leave announcements aloud via TTS.            Default false
//   leave-message  Text for leaves when funny-leaves is false.                    Default "{name} left"
//   leave-sound    URL of sound to play with leaves. Blank for none.              Default ping.ogg next to this file
//   duration       Seconds each notification stays up (whole seconds).           Default 5
//   color          Notification colour, "#rrggbb".                                Default "#2a2a2a"
//   cooldown       Seconds after space loads before announcing (avoids spam).    Default 10
//   admins-only    "true" so only space admins get notifications.                 Default false
//   sound-volume   0 to 1.                                                        Default 0.5
//   join-messages  Optional custom list of templates separated by "|" or JSON.   Default built-in funny list
//   bundle-base    Folder URL of the kit bundles.                                 Default bundles/ next to this file
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

  const DEFAULT_JOIN_MESSAGES = [
    // VR / Altspace & Gaming banter
    "Look who finally loaded in! It's {name}. Everybody act natural!",
    "Attention in the space: {name} has spawned. Please pretend we were doing something productive.",
    "Brace yourselves, {name} just fell through the ceiling.",
    "Warning: {name} has entered the room. Hide the snacks and guard the spawn point.",
    "Well, well, well, if it isn't {name}. We were just talking about you!",
    "Hold onto your headsets, {name} just materialized into the room.",
    "Welcome to the space, {name}! Please keep your hands, arms, and tracking controllers inside the vehicle at all times.",
    "Look alive, avatars! {name} has arrived to carry the conversation.",
    "Alert! {name} just clipped through reality and straight into our world.",
    "What the hell, {name}! You broke everything, it was working just a second ago!",
    "Hey everyone, look! {name} finally figured out how to put their headset on!",
    "Welcome, {name}! We're never letting you leave. Quick, lock the airlocks!",
    "Welcome to the simulation, {name}. Please try not to crash the server this time.",
    "Is it a bird? Is it a plane? No, it's {name} dropping in with zero spatial awareness!",
    "Clear the floor, people! {name} has arrived and the party can officially begin.",
    "Welcome, {name}! Don't mind the chaos, we're making it up as we go.",
    "Incoming transmission: {name} has landed. Prepare for high-octane banter!",
    "Attention all units: {name} is on site. Repeat, {name} is on site.",
    "Welcome aboard, {name}! Fasten your seatbelt, it's going to be a bumpy ride.",
    "Hold up, is that {name}? Someone pinch me, I must be lagging!",
    "Ladies and gentlemen, {name} has entered the room! Autographs will be signed later.",
    "Did someone order a legend? Because {name} just got delivered!",
    "Welcome, {name}! Your presence has increased the cool factor in here by at least ten percent.",
    "Stop the press! {name} has graced us with their virtual presence.",
    "Attention everyone: {name} is here. Look busy!",
    "Spawn point secured! {name} has touched down without losing tracking.",
    "Welcome to the madhouse, {name}! Grab a seat and try to stay sane.",
    "Look who crawled out of the lobby! It's {name}!",
    "Red alert! {name} is in the building. Lock up the valuables!",
    "Welcome, {name}! We hope you brought snacks, because we're starving.",
    "Can someone check the thermostat? {name} just walked in and things got hot.",
    "Well, look what the cat dragged in! Welcome, {name}!",
    "Look alive, people! {name} just showed up to lower our collective frame rate.",
    "Welcome to the party, {name}! We saved the best seat in the house for you.",
    "Hey {name}! We hope you brought your sense of humor.",

    // Sci-Fi / Space / Cyberpunk
    "All hands on deck! {name} has just docked at the space station.",
    "Set phasers to friendly! {name} has beamed aboard.",
    "Quantum portal engaged. {name} has emerged from a parallel dimension!",
    "Hold your thrusters! {name} just made a textbook hyperspace jump into our sector.",
    "Greetings, traveler! {name} has touched down on our digital mothership.",
    "Alert! {name} has bypassed the firewall and breached the mainframe.",
    "Wake up, {name}! You took the red pill and entered the matrix.",
    "Houston, we have a solution: {name} has joined the mission!",
    "Shields down! {name} has landed in our quadrant.",
    "Attention crew: {name} has arrived on the bridge. Engage!",
    "Prepare for warp speed! {name} has just entered the hangar bay.",
    "Warning: planetary anomaly detected. Oh wait, it's just {name}.",
    "Initiating welcoming sequence for {name}. Commencing celebratory beeps.",
    "Welcome, cyborg {name}! Your neural link has successfully established connection.",
    "Welcome aboard the Starship, {name}! Ready to explore strange new worlds.",

    // Fantasy / Adventure / RPG
    "Hark! A wild {name} has appeared!",
    "By Merlin's beard! {name} has stepped into our magical realm.",
    "The prophecy is fulfilled! {name} has arrived to save the day.",
    "Roll for initiative, everyone! {name} just walked into the tavern.",
    "Make way! {name} has entered the grand hall with an inventory full of loot.",
    "The gates have opened, and {name} has joined the fellowship.",
    "Sound the trumpets! {name} has entered the kingdom.",
    "Hold onto your wands, {name} just cast a teleportation spell right into our room!",
    "A new challenger approaches: welcome to the arena, {name}!",
    "Your dragon has landed, {name}. Let the epic quest begin!",
    "Greetings, noble adventurer! {name} has crossed into uncharted lands.",
    "Wands at the ready, {name}! Your presence adds a touch of wizardry.",

    // Western / Frontier
    "Well, if it ain't my favorite outlaw! Howdy, {name}!",
    "Howdy, partner! {name} just kicked open the saloon doors.",
    "Yeehaw! {name} just rode into town with the wind at their back.",
    "Hold your horses, folks! {name} has arrived in the territory.",
    "Good day to ya, buckaroo! Welcome to our neck of the woods, {name}.",
    "Saddle up, {name}! There's a new sheriff in town.",

    // Pop Culture & Dramatic Entrances
    "Cue the dramatic orchestral music! {name} has stepped into the spotlight.",
    "Dunder Mifflin's newest employee, {name}, has just clocked in.",
    "Central Perk just got a whole lot livelier! Welcome, {name}!",
    "Great Scott! {name} just hit eighty-eight miles per hour and arrived right here.",
    "Here's {name}! Grab your popcorn, the show is starting.",
    "Welcome to the Batcave, {name}! Gotham's finest has arrived.",
    "Stop the show! {name} just made their superstar entrance on the red carpet.",
    "Lights, camera, action! {name} has taken the stage.",
    "Welcome, {name}! You've officially entered the hall of legends."
  ];

  const DEFAULT_LEAVE_MESSAGES = [
    "{name} has left the building. Elvis would be proud.",
    "{name} vanished into thin air! Probably fell out of the world.",
    "Goodbye, {name}! We'll try to carry on without you.",
    "{name} has disconnected. The peace and quiet is overwhelming.",
    "Farewell, {name}! Until our avatars cross paths again.",
    "{name} just rage quit reality. See you next time!",
    "And just like that, {name} disappeared into the digital sunset."
  ];

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

    // Simple true/false options for showing funny messages
    const funnyMessages = bool('funny-messages', false) || bool('funny-toasts', false) || bool('random-messages', false) || bool('random-toasts', false);
    const funnyLeaves = bool('funny-leaves', false) || bool('random-leaves', false);

    // Simple true/false options for speaking messages via TTS
    const rawJoinSound = (el.getAttribute('join-sound') || '').trim();
    const isJoinTtsKeyword = ['tts', 'speak', 'voice'].includes(rawJoinSound.toLowerCase());
    const speakJoins = bool('speak-joins', false) || bool('speak-messages', false) || bool('tts-joins', false) || bool('tts', false) || isJoinTtsKeyword;

    const rawLeaveSound = (el.getAttribute('leave-sound') || '').trim();
    const isLeaveTtsKeyword = ['tts', 'speak', 'voice'].includes(rawLeaveSound.toLowerCase());
    const speakLeaves = bool('speak-leaves', false) || isLeaveTtsKeyword;

    // Normal audio file URLs
    const sound = (name, isTts) => {
      const value = el.getAttribute(name);
      if (value === null) return new URL(DEFAULT_SOUND, scriptUrl).href;
      const trimmed = value.trim();
      if (trimmed === '' || isTts) return '';
      return new URL(trimmed, scriptUrl).href;
    };

    let customJoinMessages = null;
    const rawJoinMessages = str('join-messages', '');
    if (rawJoinMessages) {
      if (rawJoinMessages.startsWith('[')) {
        try {
          const parsed = JSON.parse(rawJoinMessages);
          if (Array.isArray(parsed) && parsed.length > 0) customJoinMessages = parsed;
        } catch (_) {}
      }
      if (!customJoinMessages) {
        const parts = rawJoinMessages.split(/\||\n/).map((s) => s.trim()).filter(Boolean);
        if (parts.length > 0) customJoinMessages = parts;
      }
    }

    return {
      funnyMessages,
      funnyLeaves,
      speakJoins,
      speakLeaves,
      joinMessage: str('join-message', '{name} joined'),
      leaveMessage: str('leave-message', '{name} left'),
      notifyLeaves: bool('notify-leaves', false),
      duration: Math.max(1, Math.round(num('duration', 5))),
      color,
      cooldown: num('cooldown', 10),
      adminsOnly: bool('admins-only', false),
      customJoinMessages,
      joinSound: sound('join-sound', isJoinTtsKeyword),
      leaveSound: sound('leave-sound', isLeaveTtsKeyword),
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

    const format = (template, name) => {
      return String(template).replace(/\{name\}|<user>|\{user\}/gi, name);
    };

    // FNV-1a 32-bit hash so all clients calculate the exact same seed & pick the exact same message
    const hashString = (str) => {
      let hash = 2166136261;
      for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    };

    // Deterministic selection based on joining user, session, room state, and synchronized time bucket
    const getDeterministicJoinMessage = (user, name) => {
      const list = settings.customJoinMessages || DEFAULT_JOIN_MESSAGES;
      // 5-minute time bucket (300,000 ms) ensures messages change frequently throughout the day
      // and across visits, while virtually eliminating the boundary race condition of a 1-minute window across devices.
      const timeBucket = Math.floor(Date.now() / (5 * 60 * 1000));
      const roomCount = (scene.users && Object.keys(scene.users).length) || 1;
      const seed = `${user.id != null ? user.id : ''}:${user.uid || ''}:${name}:${roomCount}:${timeBucket}`;
      const index = hashString(seed) % list.length;
      return format(list[index], name);
    };

    const getDeterministicLeaveMessage = (user, name) => {
      const timeBucket = Math.floor(Date.now() / (5 * 60 * 1000));
      const roomCount = (scene.users && Object.keys(scene.users).length) || 1;
      const seed = `${user.id != null ? user.id : ''}:${user.uid || ''}:${name}:${roomCount}:${timeBucket}`;
      const index = hashString(seed) % DEFAULT_LEAVE_MESSAGES.length;
      return format(DEFAULT_LEAVE_MESSAGES[index], name);
    };

    const ttsUrl = (text) => `https://speak.firer.at/?text=${encodeURIComponent(text)}#.mp3`;

    let audio = null;
    let isPlayingAudio = false;
    const audioQueue = [];

    const playAudio = async (url, isSpeech) => {
      if (!audio || !url) return;
      if (!isSpeech) {
        audio.PlayOneShotFromUrl(url).catch((e) => console.warn(`${LOG}: sound failed`, e));
        return;
      }
      audioQueue.push(url);
      if (isPlayingAudio) return;
      isPlayingAudio = true;
      while (audioQueue.length > 0) {
        const nextUrl = audioQueue.shift();
        try {
          await audio.PlayOneShotFromUrl(nextUrl);
          // Wait briefly for speech audio to play before starting next queued message
          await new Promise((resolve) => setTimeout(resolve, 4500));
        } catch (e) {
          console.warn(`${LOG}: speech failed`, e);
        }
      }
      isPlayingAudio = false;
    };

    const notify = async (user, isJoin) => {
      if (!user || user.isLocal || performance.now() < readyAt) return;
      if (settings.adminsOnly && !(scene.localUser && scene.localUser.isSpaceAdmin)) return;

      const name = String(user.name || 'Someone');
      const isFunny = isJoin ? settings.funnyMessages : settings.funnyLeaves;
      const isSpeak = isJoin ? settings.speakJoins : settings.speakLeaves;
      const template = isJoin ? settings.joinMessage : settings.leaveMessage;
      const soundFile = isJoin ? settings.joinSound : settings.leaveSound;

      // Deterministically select the message so everyone in the room gets the exact same text
      let messageText;
      if (isFunny) {
        messageText = isJoin ? getDeterministicJoinMessage(user, name) : getDeterministicLeaveMessage(user, name);
      } else {
        messageText = format(template, name);
      }

      // Safe toast message (quotes and backslashes would come through JSON escaped)
      const safeToast = messageText.replace(/["\\]/g, '');

      await scene.SendToVisualScripting(DURATION_ID, settings.duration);
      await scene.SendToVisualScripting(COLOR_ID, settings.color);
      await scene.SendToVisualScripting(MESSAGE_ID, safeToast);

      if (audio) {
        if (isSpeak) {
          playAudio(ttsUrl(messageText), true);
        } else if (soundFile) {
          playAudio(soundFile, false);
        }
      }
    };

    scene.On('user-joined', (e) => notify(e.detail, true));
    scene.On('user-left', (e) => {
      if (settings.notifyLeaves) notify(e.detail, false);
    });

    try {
      const urls = bundleUrls(el);
      const obj = new BS.GameObject({ name: 'JoinNotify' });
      await obj.Async();
      await obj.AddComponent(new BS.AssetBundle(urls));
      // "*" = the first prefab in the AssetBundle on this same object.
      await obj.AddComponent(new BS.KitItem({ path: '*' }));
      if (settings.joinSound || settings.leaveSound || settings.speakJoins || settings.speakLeaves) {
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
