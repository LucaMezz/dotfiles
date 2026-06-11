import app from "ags/gtk4/app";
import Astal from "gi://Astal?version=4.0";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import GdkPixbuf from "gi://GdkPixbuf";
import Mpris from "gi://AstalMpris";
import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import { Variable } from "../utils/Variable";

const POPUP_DURATION_MS = 4000;
const ART_SIZE = 72;

// ── Album art helpers ──────────────────────────────────────────────────────────

function artCachePath(url: string): string {
  const hash = GLib.compute_checksum_for_string(GLib.ChecksumType.MD5, url, -1) ?? "unknown";
  return `/tmp/ags-art-${hash}`;
}

function applyPixbuf(path: string, picture: Gtk.Picture): void {
  try {
    const pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(path, ART_SIZE, ART_SIZE, false);
    if (pixbuf) picture.set_paintable(Gdk.Texture.new_for_pixbuf(pixbuf));
    else picture.set_paintable(null);
  } catch (_) {
    picture.set_paintable(null);
  }
}

// currentUrl is a mutable ref so callbacks can detect stale downloads.
function loadArtwork(rawArt: string, currentUrl: { v: string }, picture: Gtk.Picture): void {
  currentUrl.v = rawArt;
  if (!rawArt) { picture.set_paintable(null); return; }

  // Local file (AstalMpris cached copy).
  if (rawArt.startsWith("/") || rawArt.startsWith("file://")) {
    applyPixbuf(rawArt.startsWith("file://") ? rawArt.slice(7) : rawArt, picture);
    return;
  }

  // Remote URL — download via curl then apply.
  const dest = artCachePath(rawArt);
  if (GLib.file_test(dest, GLib.FileTest.EXISTS)) {
    applyPixbuf(dest, picture);
    return;
  }

  try {
    const proc = Gio.Subprocess.new(
      ["curl", "-sL", "--max-time", "8", "-o", dest, rawArt],
      Gio.SubprocessFlags.NONE,
    );
    proc.wait_async(null, (_p: any, res: any) => {
      try {
        proc.wait_finish(res);
        if (currentUrl.v === rawArt && GLib.file_test(dest, GLib.FileTest.EXISTS))
          applyPixbuf(dest, picture);
      } catch (_) {}
    });
  } catch (_) {}
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MusicPopup({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  const mpris = Mpris.get_default();

  const title  = new Variable("No media playing");
  const artist = new Variable("");
  const isPlaying = new Variable(false);

  let playerSignals: number[] = [];
  let currentPlayer: Mpris.Player | null = null;
  let timeoutId: number | null = null;
  let popupWindow: any = null;
  const currentUrl = { v: "" };

  // ── Picture widget ────────────────────────────────────────────────────────

  const picture = new Gtk.Picture();
  picture.set_size_request(ART_SIZE, ART_SIZE);
  picture.set_content_fit(Gtk.ContentFit.COVER);
  picture.set_hexpand(true);
  picture.set_vexpand(true);

  // Clip box applies border-radius + overflow:hidden to round the art.
  const artClip = new Gtk.Box();
  artClip.set_overflow(Gtk.Overflow.HIDDEN);
  artClip.set_css_classes(["media-art", "album-art-clip"]);
  artClip.set_size_request(ART_SIZE, ART_SIZE);
  artClip.set_hexpand(false);
  artClip.set_vexpand(false);
  artClip.set_halign(Gtk.Align.START);
  artClip.set_valign(Gtk.Align.CENTER);
  artClip.append(picture);

  // ── Popup timer ───────────────────────────────────────────────────────────

  const showPopup = () => {
    if (!popupWindow) return;
    popupWindow.set_visible(true);
    if (timeoutId !== null) GLib.source_remove(timeoutId);
    timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, POPUP_DURATION_MS, () => {
      if (popupWindow) popupWindow.set_visible(false);
      timeoutId = null;
      return GLib.SOURCE_REMOVE;
    });
  };

  // ── Player tracking ───────────────────────────────────────────────────────

  const disconnectPlayer = () => {
    if (currentPlayer) {
      playerSignals.forEach((id) => { try { currentPlayer!.disconnect(id); } catch (_) {} });
      playerSignals = [];
      currentPlayer = null;
    }
  };

  const updatePlayer = () => {
    const player = mpris.get_players()[0] ?? null;

    if (!player) {
      disconnectPlayer();
      title.set("No media playing");
      artist.set("");
      isPlaying.set(false);
      picture.set_paintable(null);
      if (popupWindow) popupWindow.set_visible(false);
      if (timeoutId !== null) { GLib.source_remove(timeoutId); timeoutId = null; }
      return;
    }

    if (player === currentPlayer) return;
    disconnectPlayer();
    currentPlayer = player;

    const syncTrack = () => {
      title.set(player.title || "Unknown");
      artist.set(player.artist || "");
      // cover_art = local cached path (empty if AstalMpris caching fails)
      // art_url   = raw MPRIS value (HTTPS URL from Spotify etc.)
      const art = (player as any).coverArt || (player as any).cover_art
               || (player as any).artUrl   || (player as any).art_url || "";
      loadArtwork(art, currentUrl, picture);
      showPopup();
    };

    const syncState = () => {
      isPlaying.set(player.playbackStatus === Mpris.PlaybackStatus.PLAYING);
    };

    syncTrack();
    syncState();

    playerSignals.push(player.connect("notify::title",        syncTrack));
    playerSignals.push(player.connect("notify::artist",       syncTrack));
    playerSignals.push(player.connect("notify::cover-art",    syncTrack));
    playerSignals.push(player.connect("notify::playback-status", syncState));
  };

  mpris.connect("notify::players", updatePlayer);

  // ── Labels ────────────────────────────────────────────────────────────────

  const titleLabel = (<label cssClasses={["media-title"]} ellipsize={3} maxWidthChars={28} xalign={0} label={title.get()} />) as any;
  title.subscribe((t) => { titleLabel.label = t; });

  const artistLabel = (<label cssClasses={["media-artist"]} ellipsize={3} maxWidthChars={28} xalign={0} label={artist.get()} />) as any;
  artist.subscribe((a) => { artistLabel.label = a; });

  const playIcon = (<image iconName={isPlaying.get() ? "media-playback-pause-symbolic" : "media-playback-start-symbolic"} pixelSize={15} />) as any;
  isPlaying.subscribe((p) => { playIcon.set_from_icon_name(p ? "media-playback-pause-symbolic" : "media-playback-start-symbolic"); });

  // ── Window ────────────────────────────────────────────────────────────────

  const window = (
    <window
      visible={false}
      name={`music-popup-${gdkmonitor.connector}`}
      namespace="music-popup"
      gdkmonitor={gdkmonitor}
      anchor={Astal.WindowAnchor.BOTTOM}
      exclusivity={Astal.Exclusivity.IGNORE}
      application={app}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.NONE}
      cssClasses={["music-popup-window"]}
      $={(self) => {
        self.connect("destroy", () => {
          disconnectPlayer();
          if (timeoutId !== null) GLib.source_remove(timeoutId);
        });
      }}
    >
      <box cssClasses={["music-popup-content"]} spacing={12}>
        {artClip}
        <box orientation={Gtk.Orientation.VERTICAL} spacing={4} vexpand hexpand>
          {titleLabel}
          {artistLabel}
          <box cssClasses={["music-popup-controls"]} spacing={6} marginTop={6}>
            <button cssClasses={["media-ctrl-btn"]} onClicked={() => mpris.get_players()[0]?.previous()}>
              <image iconName="media-skip-backward-symbolic" pixelSize={13} />
            </button>
            <button cssClasses={["media-ctrl-btn", "play-pause"]} onClicked={() => mpris.get_players()[0]?.play_pause()}>
              {playIcon}
            </button>
            <button cssClasses={["media-ctrl-btn"]} onClicked={() => mpris.get_players()[0]?.next()}>
              <image iconName="media-skip-forward-symbolic" pixelSize={13} />
            </button>
          </box>
        </box>
      </box>
    </window>
  ) as any;

  popupWindow = window;
  updatePlayer();
  return window;
}
