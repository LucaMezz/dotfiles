import app from "ags/gtk4/app";
import Astal from "gi://Astal?version=4.0";
import AstalWp from "gi://AstalWp?version=0.1";
import AstalBluetooth from "gi://AstalBluetooth";
import AstalMpris from "gi://AstalMpris";
import Notifd from "gi://AstalNotifd";
import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Pango from "gi://Pango";
import { Variable } from "../utils/Variable";
import CalendarWidget, { buildDayView } from "./Calendar";

// ── Network helpers ────────────────────────────────────────────────────────────

type WifiBackend = "nmcli" | "iwctl";

interface WifiNetwork {
  name: string;
  connected: boolean;
  security: string;
  signal: string;
}

function stripAnsi(str: string): string {
  return str.replace(/\[[0-9;]*m/g, "");
}

function netExecSync(cmd: string): string {
  try {
    const [ok, out] = GLib.spawn_command_line_sync(cmd);
    if (ok && out) return stripAnsi(new TextDecoder().decode(out).trim());
  } catch (_) {}
  return "";
}

async function netExecAsync(cmd: string): Promise<string> {
  try {
    const launcher = new Gio.SubprocessLauncher({
      flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
    });
    const proc = launcher.spawnv(GLib.shell_parse_argv(cmd)[1]);
    return new Promise((resolve, reject) => {
      proc.communicate_utf8_async(null, null, (p, res) => {
        try {
          const [, stdout] = p!.communicate_utf8_finish(res);
          resolve(stdout ? stripAnsi(stdout.trim()) : "");
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (_) {
    return "";
  }
}

function wifiDetectBackend(): WifiBackend {
  try {
    const [ok, out] = GLib.spawn_command_line_sync("which nmcli");
    if (ok && out && new TextDecoder().decode(out).trim()) {
      const state = netExecSync("nmcli -t -f STATE general");
      if (state && state !== "unmanaged") return "nmcli";
    }
  } catch (_) {}
  return "iwctl";
}

function nmcliGetDevice(): string {
  for (const line of netExecSync("nmcli -t -f DEVICE,TYPE device").split("\n")) {
    const [device, type] = line.split(":");
    if (type?.trim() === "wifi") return device.trim();
  }
  return "";
}

async function nmcliScanAndList(device: string): Promise<WifiNetwork[]> {
  await netExecAsync(`nmcli device wifi rescan ifname ${device}`).catch(() => {});
  await new Promise((r) =>
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => { r(null); return GLib.SOURCE_REMOVE; }),
  );
  const out = await netExecAsync("nmcli -t -f IN-USE,SSID,SECURITY,SIGNAL device wifi list");
  const seen = new Map<string, WifiNetwork>();
  for (const line of out.split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split(":");
    if (parts.length < 4) continue;
    const connected = parts[0].trim() === "*";
    const name = parts[1].trim();
    const security = parts[2].trim() || "open";
    const signal = parts[3].trim();
    if (!name) continue;
    const existing = seen.get(name);
    if (!existing || Number(signal) > Number(existing.signal))
      seen.set(name, { name, connected, security, signal });
  }
  return [...seen.values()].sort(
    (a, b) => Number(b.connected) - Number(a.connected) || Number(b.signal) - Number(a.signal),
  );
}

async function nmcliConnect(device: string, network: WifiNetwork, password?: string) {
  if (password)
    await netExecAsync(`nmcli device wifi connect "${network.name}" password "${password}" ifname ${device}`);
  else await netExecAsync(`nmcli connection up "${network.name}"`);
}

async function nmcliDisconnect(device: string) {
  await netExecAsync(`nmcli device disconnect ${device}`);
}

function iwctlGetDevice(): string {
  for (const line of netExecSync("iwctl device list").split("\n")) {
    if (!line.includes("station")) continue;
    for (const part of line.trim().split(/\s+/))
      if (/^(wlan|wlp|wlo)\w*/.test(part)) return part;
  }
  return "wlan0";
}

async function iwctlScanAndList(device: string): Promise<WifiNetwork[]> {
  await netExecAsync(`iwctl station ${device} scan`);
  await new Promise((r) =>
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => { r(null); return GLib.SOURCE_REMOVE; }),
  );
  const out = await netExecAsync(`iwctl station ${device} get-networks`);
  const networks: WifiNetwork[] = [];
  for (const line of out.split("\n")) {
    if (line.includes("Network name") || line.includes("----") || !line.trim()) continue;
    const connected = line.trim().startsWith(">");
    const clean = line.replace(/>/g, "").trim();
    const parts = clean.split(/\s{2,}/);
    if (parts.length >= 2)
      networks.push({ name: parts[0].trim(), connected, security: parts[1]?.trim() || "unknown", signal: parts[2]?.trim() || "****" });
  }
  return networks.sort((a, b) => Number(b.connected) - Number(a.connected));
}

async function iwctlConnect(device: string, network: WifiNetwork, password?: string) {
  const cmd = password
    ? `iwctl station ${device} connect "${network.name}" --passphrase "${password}"`
    : `iwctl station ${device} connect "${network.name}"`;
  await netExecAsync(cmd);
}

async function iwctlDisconnect(device: string) {
  await netExecAsync(`iwctl station ${device} disconnect`);
}

function buildWifiPanel(): Gtk.Widget {
  const backend = wifiDetectBackend();
  const device = backend === "nmcli" ? nmcliGetDevice() : iwctlGetDevice();
  const networks = new Variable<WifiNetwork[]>([]);
  const isScanning = new Variable(false);
  const expandedNetwork = new Variable<string>("");

  const refresh = async () => {
    if (isScanning.get()) return;
    isScanning.set(true);
    try {
      networks.set(backend === "nmcli" ? await nmcliScanAndList(device) : await iwctlScanAndList(device));
    } catch (_) {}
    isScanning.set(false);
  };

  const handleConnect = async (network: WifiNetwork, password?: string) => {
    expandedNetwork.set("");
    try {
      backend === "nmcli" ? await nmcliConnect(device, network, password) : await iwctlConnect(device, network, password);
    } catch (_) {}
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => { refresh(); return GLib.SOURCE_REMOVE; });
  };

  const handleDisconnect = async () => {
    try {
      backend === "nmcli" ? await nmcliDisconnect(device) : await iwctlDisconnect(device);
    } catch (_) {}
    refresh();
  };

  const handleClick = (network: WifiNetwork) => {
    if (network.connected) handleDisconnect();
    else if (["open", "--", ""].includes(network.security)) handleConnect(network);
    else expandedNetwork.set(expandedNetwork.get() === network.name ? "" : network.name);
  };

  const header = new Gtk.Box({ spacing: 8, marginBottom: 6 });
  const titleLbl = new Gtk.Label({ label: "Wi-Fi", xalign: 0, hexpand: true, cssClasses: ["qs-panel-title"] });
  const spinner = new Gtk.Spinner();
  spinner.set_visible(false);
  const scanUnsub = isScanning.subscribe((s) => { spinner.set_visible(s); s ? spinner.start() : spinner.stop(); });
  const refreshBtn = new Gtk.Button({ iconName: "view-refresh-symbolic", cssClasses: ["cal-nav-btn"] });
  const refreshSensUnsub = isScanning.subscribe((s) => refreshBtn.set_sensitive(!s));
  refreshBtn.connect("clicked", () => refresh());
  header.append(titleLbl);
  header.append(spinner);
  header.append(refreshBtn);

  const listBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4 });

  const makeNetworkItem = (network: WifiNetwork): Gtk.Widget => {
    const container = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 10 });
    row.append(new Gtk.Image({ iconName: network.connected ? "network-wireless-connected-symbolic" : "network-wireless-symbolic" }));
    const nameLbl = new Gtk.Label({ label: network.name, hexpand: true, xalign: 0 });
    if (network.connected) nameLbl.add_css_class("connected-label");
    row.append(nameLbl);
    if (network.connected)
      row.append(new Gtk.Label({ label: "CONNECTED", cssClasses: ["connected-status-pill"] }));
    row.append(new Gtk.Label({ label: network.signal, cssClasses: ["dim-label"], tooltipText: network.security }));
    const btn = new Gtk.Button({ child: row, cssClasses: network.connected ? ["network-item", "connected"] : ["network-item"] });
    const clickId = btn.connect("clicked", () => handleClick(network));
    container.append(btn);
    let subUnsub: (() => void) | null = null;
    if (!["open", "--", ""].includes(network.security) && !network.connected) {
      const pwBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, marginTop: 6 });
      const pwEntry = new Gtk.Entry({ placeholderText: "Password", visibility: false, hexpand: true });
      const connBtn = new Gtk.Button({ label: "Connect", cssClasses: ["cal-dlg-save"] });
      const cancelBtn = new Gtk.Button({ label: "Cancel" });
      const doConnect = () => { if (pwEntry.text) handleConnect(network, pwEntry.text); };
      pwEntry.connect("activate", doConnect);
      connBtn.connect("clicked", doConnect);
      cancelBtn.connect("clicked", () => expandedNetwork.set(""));
      pwBox.append(pwEntry);
      pwBox.append(connBtn);
      pwBox.append(cancelBtn);
      const revealer = new Gtk.Revealer({ child: pwBox, transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN });
      subUnsub = expandedNetwork.subscribe((e) => { revealer.reveal_child = e === network.name; });
      container.append(revealer);
    }
    container.connect("destroy", () => { if (subUnsub) subUnsub(); btn.disconnect(clickId); });
    return container;
  };

  const netUnsub = networks.subscribe((list) => {
    let ch: Gtk.Widget | null = listBox.get_first_child();
    while (ch) { const n = ch.get_next_sibling(); listBox.remove(ch); ch = n; }
    list.forEach((n) => listBox.append(makeNetworkItem(n)));
  });

  const root = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4 });
  root.append(header);
  root.append(listBox);
  root.connect("destroy", () => { scanUnsub(); refreshSensUnsub(); netUnsub(); });
  refresh();
  return root;
}

// ── Bluetooth helpers ──────────────────────────────────────────────────────────

function buildBluetoothPanel(): Gtk.Widget {
  const bt = AstalBluetooth.get_default();
  const devices = new Variable<AstalBluetooth.Device[]>([]);
  const isScanning = new Variable(bt.adapter?.discovering ?? false);
  const isPowered = new Variable(bt.adapter?.powered ?? false);
  const btSigs: number[] = [];
  const adSigs: number[] = [];
  let scanTimeout: number | null = null;
  const MAC_RE = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

  const sync = () => {
    const all = bt.get_devices() ?? [];
    const filtered = all.filter((d) => {
      if (d.paired) return true;
      const name = d.alias || d.name;
      if (!name || !name.trim() || MAC_RE.test(name)) return false;
      if (name.includes("LE-") && !d.paired) return false;
      return true;
    });
    filtered.sort((a, b) => {
      if (a.connected !== b.connected) return a.connected ? -1 : 1;
      if (a.paired !== b.paired) return a.paired ? -1 : 1;
      return (a.alias || "").localeCompare(b.alias || "");
    });
    devices.set(filtered);
  };

  btSigs.push(bt.connect("device-added", sync));
  btSigs.push(bt.connect("device-removed", sync));

  const setupAdapter = () => {
    if (!bt.adapter) return;
    isPowered.set(bt.adapter.powered);
    isScanning.set(bt.adapter.discovering);
    adSigs.forEach((id) => { try { bt.adapter?.disconnect(id); } catch (_) {} });
    adSigs.length = 0;
    adSigs.push(bt.adapter.connect("notify::powered", () => isPowered.set(bt.adapter.powered)));
    adSigs.push(bt.adapter.connect("notify::discovering", () => isScanning.set(bt.adapter.discovering)));
  };
  setupAdapter();
  sync();
  btSigs.push(bt.connect("notify::adapter", setupAdapter));

  const createDeviceRow = (dev: AstalBluetooth.Device): Gtk.Box => {
    const row = new Gtk.Box({ spacing: 10, cssClasses: ["bt-row"] });
    const devSigs: number[] = [];
    const updateConnected = () => { if (dev.connected) row.add_css_class("bt-connected"); else row.remove_css_class("bt-connected"); };
    devSigs.push(dev.connect("notify::connected", updateConnected));
    updateConnected();
    row.append(new Gtk.Image({ iconName: (dev.icon_name || "bluetooth") + "-symbolic" }));
    const nameLbl = new Gtk.Label({ label: dev.alias || dev.name || "Unknown", xalign: 0, cssClasses: ["bt-device-name"] });
    const pill = new Gtk.Label({ label: "CONNECTED", cssClasses: ["bt-status-pill"] });
    const nameRow = new Gtk.Box({ spacing: 6 });
    nameRow.append(nameLbl);
    nameRow.append(pill);
    const updatePill = () => { pill.set_visible(dev.connected); if (dev.connected) nameLbl.add_css_class("bt-label-active"); else nameLbl.remove_css_class("bt-label-active"); };
    devSigs.push(dev.connect("notify::connected", updatePill));
    updatePill();
    const info = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, hexpand: true, valign: Gtk.Align.CENTER });
    info.append(nameRow);
    row.append(info);
    if (dev.paired) {
      const forgetBtn = new Gtk.Button({ iconName: "edit-delete-symbolic", cssClasses: ["bt-icon-btn", "bt-danger"], valign: Gtk.Align.CENTER });
      devSigs.push(forgetBtn.connect("clicked", () => bt.adapter?.remove_device(dev)));
      row.append(forgetBtn);
    }
    const connBtn = new Gtk.Button({ label: dev.connected ? "Disconnect" : "Connect", cssClasses: ["bt-connect-btn"], valign: Gtk.Align.CENTER });
    devSigs.push(dev.connect("notify::connected", () => { connBtn.label = dev.connected ? "Disconnect" : "Connect"; }));
    devSigs.push(connBtn.connect("clicked", () => {
      if (dev.connected) { dev.disconnect_device(() => sync()); }
      else { if (!dev.paired) dev.pair(); dev.set_trusted(true); dev.connect_device(() => sync()); }
    }));
    row.append(connBtn);
    row.connect("destroy", () => { devSigs.forEach((id) => { try { dev.disconnect(id); } catch (_) {} }); });
    return row;
  };

  const header = new Gtk.Box({ spacing: 8, marginBottom: 6 });
  const titleLbl = new Gtk.Label({ label: "Bluetooth", xalign: 0, cssClasses: ["qs-panel-title"] });
  const powerSwitch = new Gtk.Switch({ valign: Gtk.Align.CENTER });
  const pwrUnsub = isPowered.subscribe((p) => powerSwitch.set_active(p));
  const pwrId = powerSwitch.connect("state-set", (_: Gtk.Switch, state: boolean) => { bt.adapter?.set_powered(state); return true; });
  const spinner = new Gtk.Spinner();
  spinner.set_visible(false);
  const scanUnsub = isScanning.subscribe((s) => { spinner.set_visible(s); s ? spinner.start() : spinner.stop(); });
  const scanBtn = new Gtk.Button({ iconName: "view-refresh-symbolic", cssClasses: ["cal-nav-btn"] });
  const scanSensUnsub = isScanning.subscribe((s) => scanBtn.set_sensitive(!s));
  scanBtn.connect("clicked", () => {
    if (!bt.adapter) return;
    if (scanTimeout !== null) GLib.source_remove(scanTimeout);
    bt.adapter.start_discovery();
    scanTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10000, () => { bt.adapter?.stop_discovery(); scanTimeout = null; return GLib.SOURCE_REMOVE; });
  });
  header.append(titleLbl);
  header.append(new Gtk.Box({ hexpand: true }));
  header.append(powerSwitch);
  header.append(spinner);
  header.append(scanBtn);

  const listBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4 });
  const devUnsub = devices.subscribe((list) => {
    let ch: Gtk.Widget | null = listBox.get_first_child();
    while (ch) { const n = ch.get_next_sibling(); listBox.remove(ch); ch = n; }
    const paired = list.filter((d) => d.paired);
    const available = list.filter((d) => !d.paired);
    if (paired.length > 0) {
      listBox.append(new Gtk.Label({ label: "Paired", xalign: 0, cssClasses: ["qs-panel-section"], marginBottom: 4 }));
      paired.forEach((d) => listBox.append(createDeviceRow(d)));
    }
    if (available.length > 0) {
      listBox.append(new Gtk.Label({ label: "Available", xalign: 0, cssClasses: ["qs-panel-section"], marginTop: 10, marginBottom: 4 }));
      available.forEach((d) => listBox.append(createDeviceRow(d)));
    }
  });

  const root = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4 });
  root.append(header);
  root.append(listBox);
  root.connect("destroy", () => {
    if (scanTimeout !== null) GLib.source_remove(scanTimeout);
    btSigs.forEach((id) => { try { bt.disconnect(id); } catch (_) {} });
    adSigs.forEach((id) => { try { bt.adapter?.disconnect(id); } catch (_) {} });
    pwrUnsub(); scanUnsub(); scanSensUnsub(); devUnsub();
    powerSwitch.disconnect(pwrId);
  });
  return root;
}

// ── Shell helpers ──────────────────────────────────────────────────────────────

function exec(cmd: string): string {
  try {
    const [ok, out] = GLib.spawn_command_line_sync(cmd);
    if (ok) return new TextDecoder().decode(out).trim();
  } catch (_) {}
  return "";
}

async function execAsync(cmd: string): Promise<string> {
  const launcher = new Gio.SubprocessLauncher({
    flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
  });
  const proc = launcher.spawnv(GLib.shell_parse_argv(cmd)[1]);
  return new Promise((resolve) => {
    proc.communicate_utf8_async(null, null, (_p, res) => {
      const [, stdout] = proc.communicate_utf8_finish(res);
      resolve(stdout ? stdout.trim() : "");
    });
  });
}

// ── Notification image helper ──────────────────────────────────────────────────

function makeNotifImageBox(src: string): Gtk.Box {
  const url = src.startsWith("file://") ? src : src.startsWith("/") ? `file://${src}` : src;
  const box = new Gtk.Box();
  box.set_css_classes(["notification-image-wrapper"]);
  box.set_size_request(56, 56);
  box.set_hexpand(false);
  box.set_vexpand(false);
  box.set_halign(Gtk.Align.CENTER);
  box.set_valign(Gtk.Align.CENTER);
  const p = new Gtk.CssProvider();
  p.load_from_data(`* { background-image:url('${url}'); background-size:cover; background-position:center; border-radius:6px; }`, -1);
  box.get_style_context().add_provider(p, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
  return box;
}

// ── Audio panel ────────────────────────────────────────────────────────────────

const wp = AstalWp.get_default();

function buildAudioPanel(): Gtk.Widget {
  const root = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 14, cssClasses: ["qs-dropdown-panel"] });

  const makeVolumeRow = (
    iconName: string,
    getVol: () => number,
    setVol: (v: number) => void,
    onSignal: (cb: () => void) => () => void,
    muted?: () => boolean,
    toggleMute?: () => void,
  ): Gtk.Box => {
    const row = new Gtk.Box({ spacing: 10 });
    if (toggleMute) {
      const muteBtn = new Gtk.Button({ cssClasses: ["cal-nav-btn"] });
      const setMuteIcon = () => {
        muteBtn.set_child(new Gtk.Image({ iconName: muted!() ? "audio-volume-muted-symbolic" : iconName }));
      };
      setMuteIcon();
      muteBtn.connect("clicked", toggleMute);
      const unsub = onSignal(setMuteIcon);
      muteBtn.connect("destroy", unsub);
      row.append(muteBtn);
    } else {
      row.append(new Gtk.Image({ iconName }));
    }
    const slider = new Gtk.Scale({
      orientation: Gtk.Orientation.HORIZONTAL,
      adjustment: new Gtk.Adjustment({ lower: 0, upper: 1, stepIncrement: 0.02, pageIncrement: 0.1, value: getVol() }),
      drawValue: false,
      hexpand: true,
    });
    slider.add_css_class("audio-vol-slider");
    let fromSignal = false;
    const unsub = onSignal(() => { fromSignal = true; slider.get_adjustment().set_value(getVol()); fromSignal = false; });
    slider.connect("value-changed", () => { if (!fromSignal) setVol(slider.get_value()); });
    slider.connect("destroy", unsub);
    const pctLbl = new Gtk.Label({ label: `${Math.round(getVol() * 100)}%`, cssClasses: ["audio-vol-pct"], widthRequest: 38, xalign: 1 });
    const pctUnsub = onSignal(() => { pctLbl.label = `${Math.round(getVol() * 100)}%`; });
    pctLbl.connect("destroy", pctUnsub);
    row.append(slider);
    row.append(pctLbl);
    return row;
  };

  const makeDevicePicker = (
    getDevices: () => AstalWp.Endpoint[],
    getDefault: () => AstalWp.Endpoint | null,
    setDefault: (ep: AstalWp.Endpoint) => void,
    onAudioSignal: (cb: () => void) => () => void,
  ): Gtk.Box => {
    const row = new Gtk.Box({ spacing: 8, marginTop: 2 });
    const store = Gtk.StringList.new([]);
    const drop = new Gtk.DropDown({ model: store, hexpand: true, cssClasses: ["audio-device-drop"] });
    let devices: AstalWp.Endpoint[] = [];
    let suppressSignal = false;
    const refresh = () => {
      devices = getDevices();
      const def = getDefault();
      while (store.get_n_items() > 0) store.remove(0);
      devices.forEach((d) => store.append(d.description || d.name || "Unknown"));
      const idx = def ? devices.findIndex((d) => d === def) : -1;
      suppressSignal = true;
      drop.set_selected(idx >= 0 ? idx : 0);
      suppressSignal = false;
    };
    const unsub = onAudioSignal(refresh);
    refresh();
    drop.connect("notify::selected", () => {
      if (suppressSignal) return;
      const d = devices[drop.get_selected()];
      if (d) setDefault(d);
    });
    drop.connect("destroy", unsub);
    row.append(new Gtk.Image({ iconName: "audio-card-symbolic", cssClasses: ["audio-device-icon"] }));
    row.append(drop);
    return row;
  };

  const onAudio = (cb: () => void): (() => void) => {
    const ids: number[] = [];
    if (wp?.audio) {
      ids.push(wp.audio.connect("notify::default-speaker", cb));
      ids.push(wp.audio.connect("notify::default-microphone", cb));
      ids.push(wp.audio.connect("speaker-added", cb));
      ids.push(wp.audio.connect("speaker-removed", cb));
      ids.push(wp.audio.connect("microphone-added", cb));
      ids.push(wp.audio.connect("microphone-removed", cb));
      ids.push(wp.audio.connect("stream-added", cb));
      ids.push(wp.audio.connect("stream-removed", cb));
    }
    return () => ids.forEach((id) => { try { wp?.audio?.disconnect(id); } catch (_) {} });
  };

  const onSpeaker = (cb: () => void): (() => void) => {
    let id: number | null = null;
    const attach = () => { if (wp?.audio?.defaultSpeaker) id = wp.audio.defaultSpeaker.connect("notify::volume", cb); };
    attach();
    const sigId = wp?.audio?.connect("notify::default-speaker", () => {
      if (id !== null) { try { wp.audio?.defaultSpeaker?.disconnect(id); } catch (_) {} }
      attach(); cb();
    });
    return () => {
      if (id !== null) { try { wp?.audio?.defaultSpeaker?.disconnect(id); } catch (_) {} }
      if (sigId != null) { try { wp?.audio?.disconnect(sigId); } catch (_) {} }
    };
  };

  const onMic = (cb: () => void): (() => void) => {
    let id: number | null = null;
    const attach = () => { if (wp?.audio?.defaultMicrophone) id = wp.audio.defaultMicrophone.connect("notify::volume", cb); };
    attach();
    const sigId = wp?.audio?.connect("notify::default-microphone", () => {
      if (id !== null) { try { wp.audio?.defaultMicrophone?.disconnect(id); } catch (_) {} }
      attach(); cb();
    });
    return () => {
      if (id !== null) { try { wp?.audio?.defaultMicrophone?.disconnect(id); } catch (_) {} }
      if (sigId != null) { try { wp?.audio?.disconnect(sigId); } catch (_) {} }
    };
  };

  root.append(new Gtk.Label({ label: "Output", xalign: 0, cssClasses: ["qs-panel-section"], marginBottom: 4 }));
  root.append(makeVolumeRow(
    "audio-speakers-symbolic",
    () => wp?.audio?.defaultSpeaker?.volume ?? 0,
    (v) => { if (wp?.audio?.defaultSpeaker) wp.audio.defaultSpeaker.volume = v; },
    onSpeaker,
    () => wp?.audio?.defaultSpeaker?.mute ?? false,
    () => { if (wp?.audio?.defaultSpeaker) wp.audio.defaultSpeaker.mute = !wp.audio.defaultSpeaker.mute; },
  ));
  root.append(makeDevicePicker(
    () => (wp?.audio?.get_speakers() ?? []) as AstalWp.Endpoint[],
    () => wp?.audio?.defaultSpeaker ?? null,
    (ep) => { (ep as any).set_is_default(true); },
    onAudio,
  ));

  root.append(new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL, marginTop: 4, marginBottom: 4 }));
  root.append(new Gtk.Label({ label: "Input", xalign: 0, cssClasses: ["qs-panel-section"], marginBottom: 4 }));
  root.append(makeVolumeRow(
    "audio-input-microphone-symbolic",
    () => wp?.audio?.defaultMicrophone?.volume ?? 0,
    (v) => { if (wp?.audio?.defaultMicrophone) wp.audio.defaultMicrophone.volume = v; },
    onMic,
    () => wp?.audio?.defaultMicrophone?.mute ?? false,
    () => { if (wp?.audio?.defaultMicrophone) wp.audio.defaultMicrophone.mute = !wp.audio.defaultMicrophone.mute; },
  ));
  root.append(makeDevicePicker(
    () => (wp?.audio?.get_microphones() ?? []) as AstalWp.Endpoint[],
    () => wp?.audio?.defaultMicrophone ?? null,
    (ep) => { (ep as any).set_is_default(true); },
    onAudio,
  ));

  root.append(new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL, marginTop: 4, marginBottom: 4 }));
  root.append(new Gtk.Label({ label: "Apps", xalign: 0, cssClasses: ["qs-panel-section"], marginBottom: 4 }));

  const appsBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10 });
  root.append(appsBox);

  const renderApps = () => {
    let ch: Gtk.Widget | null = appsBox.get_first_child();
    while (ch) { const n = ch.get_next_sibling(); appsBox.remove(ch); ch = n; }
    const streams: AstalWp.Stream[] = (wp?.audio?.get_streams() ?? []) as AstalWp.Stream[];
    if (!streams.length) {
      appsBox.append(new Gtk.Label({ label: "No active streams", xalign: 0, cssClasses: ["cal-empty"] }));
      return;
    }
    streams.forEach((stream) => {
      const name = (stream as any).name || (stream as any).app_name || "Unknown";
      const icon = (stream as any).icon || (stream as any).app_icon || "application-x-executable-symbolic";
      const appRow = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 6 });
      const labelRow = new Gtk.Box({ spacing: 8 });
      const appIcon = new Gtk.Image({ iconName: icon, cssClasses: ["audio-app-icon"] });
      const appName = new Gtk.Label({ label: name, xalign: 0, hexpand: true, cssClasses: ["audio-app-name"] });
      appName.set_ellipsize(3);
      const appPct = new Gtk.Label({ label: `${Math.round(((stream as any).volume ?? 0) * 100)}%`, cssClasses: ["audio-vol-pct"], widthRequest: 38, xalign: 1 });
      const mutBtn = new Gtk.Button({ cssClasses: ["cal-nav-btn"] });
      const setMutIcon = () => {
        mutBtn.set_child(new Gtk.Image({ iconName: (stream as any).mute ? "audio-volume-muted-symbolic" : "audio-volume-medium-symbolic" }));
      };
      setMutIcon();
      mutBtn.connect("clicked", () => { (stream as any).mute = !(stream as any).mute; });
      const volIds: number[] = [];
      volIds.push(stream.connect("notify::volume", () => { appPct.label = `${Math.round(((stream as any).volume ?? 0) * 100)}%`; }));
      volIds.push(stream.connect("notify::mute", setMutIcon));
      labelRow.append(appIcon);
      labelRow.append(appName);
      labelRow.append(appPct);
      labelRow.append(mutBtn);
      const appSlider = new Gtk.Scale({
        orientation: Gtk.Orientation.HORIZONTAL,
        adjustment: new Gtk.Adjustment({ lower: 0, upper: 1.5, stepIncrement: 0.02, pageIncrement: 0.1, value: (stream as any).volume ?? 0 }),
        drawValue: false,
        hexpand: true,
      });
      appSlider.add_css_class("audio-vol-slider");
      let fromStreamSignal = false;
      volIds.push(stream.connect("notify::volume", () => { fromStreamSignal = true; appSlider.get_adjustment().set_value((stream as any).volume ?? 0); fromStreamSignal = false; }));
      appSlider.connect("value-changed", () => { if (!fromStreamSignal) (stream as any).volume = appSlider.get_value(); });
      appSlider.connect("destroy", () => { volIds.forEach((id) => { try { stream.disconnect(id); } catch (_) {} }); });
      appRow.append(labelRow);
      appRow.append(appSlider);
      appsBox.append(appRow);
    });
  };

  const appUnsub = onAudio(renderApps);
  renderApps();
  appsBox.connect("destroy", appUnsub);
  return root;
}

// ── User header ────────────────────────────────────────────────────────────────

function buildUserHeader(gdkmonitor: Gdk.Monitor, getWin: () => Astal.Window): Gtk.Widget {
  const username = GLib.get_user_name();
  const hostname = GLib.get_host_name();

  const getUptime = (): string => {
    try {
      const [ok, content] = GLib.file_get_contents("/proc/uptime");
      if (ok) {
        const secs = Math.floor(Number(new TextDecoder().decode(content).split(" ")[0]));
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      }
    } catch (_) {}
    return "";
  };

  const uptimeLbl = new Gtk.Label({ label: `up ${getUptime()}`, cssClasses: ["user-uptime"], xalign: 0 });
  const uptimeTimerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 60000, () => {
    uptimeLbl.label = `up ${getUptime()}`;
    return true;
  });

  const root = new Gtk.Box({ spacing: 10 });

  const avatar = new Gtk.Box({ cssClasses: ["user-avatar-box"], valign: Gtk.Align.CENTER });
  avatar.append(new Gtk.Image({ iconName: "user-info-symbolic", pixelSize: 18 }));

  const info = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 2, hexpand: true, valign: Gtk.Align.CENTER });
  info.append(new Gtk.Label({ label: `${username}@${hostname}`, xalign: 0, cssClasses: ["user-hostname"] }));
  info.append(uptimeLbl);

  const settingsBtn = new Gtk.Button({
    cssClasses: ["sidebar-close-btn"],
    tooltipText: "Settings",
    valign: Gtk.Align.CENTER,
    child: new Gtk.Image({ iconName: "emblem-system-symbolic" }),
  });
  settingsBtn.connect("clicked", () => {
    app.toggle_window(`settings-window-${gdkmonitor.connector}`);
    getWin().hide();
  });

  const closeBtn = new Gtk.Button({
    cssClasses: ["sidebar-close-btn"],
    tooltipText: "Close",
    valign: Gtk.Align.CENTER,
    child: new Gtk.Image({ iconName: "window-close-symbolic" }),
  });
  closeBtn.connect("clicked", () => getWin().hide());

  root.append(avatar);
  root.append(info);
  root.append(settingsBtn);
  root.append(closeBtn);
  root.connect("destroy", () => GLib.source_remove(uptimeTimerId));
  return root;
}

// ── Quick toggles ──────────────────────────────────────────────────────────────

function buildQuickToggles(): Gtk.Widget {
  const notifd = Notifd.get_default();
  const row = new Gtk.Box({ spacing: 8 });

  const dndBtn = new Gtk.Button({ cssClasses: ["dnd-toggle"] });
  const dndInner = new Gtk.Box({ spacing: 6 });
  const dndIcon = new Gtk.Image({ iconName: "notifications-disabled-symbolic" });
  const dndLbl = new Gtk.Label({ label: "Do Not Disturb" });
  dndInner.append(dndIcon);
  dndInner.append(dndLbl);
  dndBtn.set_child(dndInner);

  const updateDnd = () => {
    if ((notifd as any).silenced) dndBtn.add_css_class("active");
    else dndBtn.remove_css_class("active");
  };
  updateDnd();
  const dndSigId = notifd.connect("notify::silenced", updateDnd);
  dndBtn.connect("clicked", () => { (notifd as any).silenced = !(notifd as any).silenced; });
  dndBtn.connect("destroy", () => notifd.disconnect(dndSigId));

  row.append(dndBtn);
  return row;
}

// ── Media player ───────────────────────────────────────────────────────────────

function buildMediaSection(): Gtk.Widget {
  const mpris = AstalMpris.get_default();
  const root = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
  root.set_visible(false);

  const card = new Gtk.Box({ spacing: 12, cssClasses: ["media-section"], marginBottom: 6 });

  const artBox = new Gtk.Box({ cssClasses: ["media-art"], halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
  artBox.set_size_request(60, 60);
  const artFallback = new Gtk.Image({ iconName: "audio-x-generic-symbolic", pixelSize: 24 });
  artBox.append(artFallback);

  const info = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 2, hexpand: true, valign: Gtk.Align.CENTER });
  const sourceLbl = new Gtk.Label({ xalign: 0, cssClasses: ["media-source"] });
  const titleLbl = new Gtk.Label({ xalign: 0, cssClasses: ["media-title"], ellipsize: Pango.EllipsizeMode.END, maxWidthChars: 22 });
  const artistLbl = new Gtk.Label({ xalign: 0, cssClasses: ["media-artist"], ellipsize: Pango.EllipsizeMode.END, maxWidthChars: 26 });
  info.append(sourceLbl);
  info.append(titleLbl);
  info.append(artistLbl);

  const controls = new Gtk.Box({ spacing: 4, valign: Gtk.Align.CENTER });
  const prevBtn = new Gtk.Button({ cssClasses: ["media-ctrl-btn"], child: new Gtk.Image({ iconName: "media-skip-backward-symbolic", pixelSize: 14 }) });
  const playBtn = new Gtk.Button({ cssClasses: ["media-ctrl-btn", "play-pause"], child: new Gtk.Image({ iconName: "media-playback-start-symbolic", pixelSize: 16 }) });
  const nextBtn = new Gtk.Button({ cssClasses: ["media-ctrl-btn"], child: new Gtk.Image({ iconName: "media-skip-forward-symbolic", pixelSize: 14 }) });
  controls.append(prevBtn);
  controls.append(playBtn);
  controls.append(nextBtn);

  card.append(artBox);
  card.append(info);
  card.append(controls);
  root.append(card);

  let currentPlayer: any = null;
  const playerSigs: number[] = [];
  let artProvider: Gtk.CssProvider | null = null;

  const clearPlayer = () => {
    playerSigs.forEach((id) => { try { currentPlayer?.disconnect(id); } catch (_) {} });
    playerSigs.length = 0;
    currentPlayer = null;
    root.set_visible(false);
  };

  const attachPlayer = (player: any) => {
    if (currentPlayer === player) return;
    clearPlayer();
    currentPlayer = player;

    const update = () => {
      const title = player.title || "";
      const artist = player.artist || "";
      if (!title && !artist) { root.set_visible(false); return; }
      root.set_visible(true);
      titleLbl.label = title || "Unknown";
      artistLbl.label = artist || "";
      sourceLbl.label = (player.identity || "Media").toUpperCase().slice(0, 14);

      const isPlaying = player.playback_status === AstalMpris.PlaybackStatus.playing;
      playBtn.set_child(new Gtk.Image({
        iconName: isPlaying ? "media-playback-pause-symbolic" : "media-playback-start-symbolic",
        pixelSize: 16,
      }));

      const art: string = player.cover_art || "";
      if (art && art.trim()) {
        if (artProvider) {
          try { artBox.get_style_context().remove_provider(artProvider); } catch (_) {}
        }
        artProvider = new Gtk.CssProvider();
        const url = art.startsWith("/") ? `file://${art}` : art;
        artProvider.load_from_data(`* { background-image:url('${url}'); background-size:cover; background-position:center; }`, -1);
        artBox.get_style_context().add_provider(artProvider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        artFallback.set_visible(false);
      } else {
        if (artProvider) {
          try { artBox.get_style_context().remove_provider(artProvider); } catch (_) {}
          artProvider = null;
        }
        artFallback.set_visible(true);
      }
    };

    playerSigs.push(player.connect("notify::title", update));
    playerSigs.push(player.connect("notify::artist", update));
    playerSigs.push(player.connect("notify::cover-art", update));
    playerSigs.push(player.connect("notify::playback-status", update));

    const prevId = prevBtn.connect("clicked", () => { try { player.previous(); } catch (_) {} });
    const playId = playBtn.connect("clicked", () => { try { player.play_pause(); } catch (_) {} });
    const nextId = nextBtn.connect("clicked", () => { try { player.next(); } catch (_) {} });
    playerSigs.push(prevId);
    playerSigs.push(playId);
    playerSigs.push(nextId);

    update();
  };

  const refreshPlayers = () => {
    const players: any[] = mpris.get_players() ?? [];
    const active = players.find((p) => p.playback_status === AstalMpris.PlaybackStatus.playing)
      || players.find((p) => p.playback_status === AstalMpris.PlaybackStatus.paused)
      || players[0];
    if (active) attachPlayer(active);
    else clearPlayer();
  };

  const mprisSigs: number[] = [];
  mprisSigs.push(mpris.connect("player-added", refreshPlayers));
  mprisSigs.push(mpris.connect("player-removed", refreshPlayers));
  refreshPlayers();

  root.connect("destroy", () => {
    clearPlayer();
    mprisSigs.forEach((id) => { try { mpris.disconnect(id); } catch (_) {} });
  });
  return root;
}

// ── Docker status ──────────────────────────────────────────────────────────────

interface DockerContainer {
  id: string;
  name: string;
  status: string;
  image: string;
  running: boolean;
}

function buildDockerSection(): Gtk.Widget {
  const containers = new Variable<DockerContainer[]>([]);
  const isLoading = new Variable(false);

  const parseDocker = async (): Promise<DockerContainer[]> => {
    try {
      const out = await netExecAsync(`docker ps --all --format {{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}`);
      if (!out.trim()) return [];
      return out.split("\n").filter((l) => l.trim()).map((line) => {
        const parts = line.split("|");
        const status = parts[2]?.trim() || "";
        return {
          id: parts[0]?.trim() || "",
          name: parts[1]?.trim() || "unknown",
          status,
          image: parts[3]?.trim() || "",
          running: status.toLowerCase().startsWith("up"),
        };
      });
    } catch (_) {
      return [];
    }
  };

  const refresh = async () => {
    if (isLoading.get()) return;
    isLoading.set(true);
    containers.set(await parseDocker());
    isLoading.set(false);
  };

  const header = new Gtk.Box({ spacing: 8, marginBottom: 6 });
  header.append(new Gtk.Label({ label: "Containers", xalign: 0, hexpand: true, cssClasses: ["qs-panel-title"] }));
  const spinner = new Gtk.Spinner();
  spinner.set_visible(false);
  const spinUnsub = isLoading.subscribe((v) => { spinner.set_visible(v); v ? spinner.start() : spinner.stop(); });
  header.append(spinner);
  const refreshBtn = new Gtk.Button({ iconName: "view-refresh-symbolic", cssClasses: ["cal-nav-btn"], tooltipText: "Refresh" });
  refreshBtn.connect("clicked", () => refresh());
  header.append(refreshBtn);

  const listBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 3 });

  const makeRow = (c: DockerContainer): Gtk.Widget => {
    const row = new Gtk.Box({ spacing: 8, cssClasses: ["docker-container-row"] });

    const statusDot = new Gtk.Label({ label: "●", cssClasses: [c.running ? "docker-running" : "docker-stopped"] });

    const nameCol = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 1, hexpand: true });
    const nameLbl = new Gtk.Label({ label: c.name, xalign: 0, cssClasses: ["docker-name"], ellipsize: Pango.EllipsizeMode.END, maxWidthChars: 18 });
    const imageLbl = new Gtk.Label({
      label: c.image.includes(":") ? c.image.split(":")[0] : c.image,
      xalign: 0,
      cssClasses: ["docker-image"],
      ellipsize: Pango.EllipsizeMode.END,
      maxWidthChars: 22,
    });
    nameCol.append(nameLbl);
    nameCol.append(imageLbl);

    const actionBtn = new Gtk.Button({
      label: c.running ? "Stop" : "Start",
      cssClasses: ["bt-connect-btn"],
      valign: Gtk.Align.CENTER,
    });
    actionBtn.connect("clicked", async () => {
      actionBtn.set_sensitive(false);
      const cmd = c.running ? `docker stop ${c.id}` : `docker start ${c.id}`;
      await netExecAsync(cmd).catch((_) => {});
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => { refresh(); return GLib.SOURCE_REMOVE; });
    });

    row.append(statusDot);
    row.append(nameCol);
    row.append(actionBtn);
    return row;
  };

  const listUnsub = containers.subscribe((list) => {
    let ch: Gtk.Widget | null = listBox.get_first_child();
    while (ch) { const n = ch.get_next_sibling(); listBox.remove(ch); ch = n; }
    if (!list.length) {
      listBox.append(new Gtk.Label({ label: "No containers", xalign: 0, cssClasses: ["cal-empty"] }));
      return;
    }
    list.forEach((c) => listBox.append(makeRow(c)));
  });

  const autoTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 15000, () => { refresh(); return true; });

  const root = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4 });
  root.append(header);
  root.append(listBox);
  root.connect("destroy", () => { spinUnsub(); listUnsub(); GLib.source_remove(autoTimer); });
  refresh();
  return root;
}

// ── Dev shortcuts ──────────────────────────────────────────────────────────────

function buildDevShortcuts(): Gtk.Widget {
  const shortcuts: { label: string; icon: string; cmd: string }[] = [
    { label: "Terminal", icon: "utilities-terminal-symbolic", cmd: "kitty" },
    { label: "Editor", icon: "text-editor-symbolic", cmd: "kitty -e nvim" },
    { label: "Browser", icon: "web-browser-symbolic", cmd: "chromium" },
    { label: "Git", icon: "system-software-update-symbolic", cmd: "kitty -e lazygit" },
    { label: "Files", icon: "system-file-manager-symbolic", cmd: "kitty -e yazi" },
    { label: "Claude", icon: "starred-symbolic", cmd: "kitty -e /home/luca/.local/bin/claude" },
  ];

  const grid = new Gtk.Grid({ columnSpacing: 8, rowSpacing: 8, columnHomogeneous: true });

  shortcuts.forEach(({ label, icon, cmd }, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const inner = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 5, halign: Gtk.Align.CENTER });
    inner.append(new Gtk.Image({ iconName: icon, pixelSize: 20 }));
    inner.append(new Gtk.Label({ label }));
    const btn = new Gtk.Button({ child: inner, cssClasses: ["dev-grid-btn"], hexpand: true });
    btn.connect("clicked", () => GLib.spawn_command_line_async(cmd));
    grid.attach(btn, col, row, 1, 1);
  });

  return grid;
}

// ── AI launcher ────────────────────────────────────────────────────────────────

function buildAISection(): Gtk.Widget {
  const root = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 8 });

  const promptEntry = new Gtk.Entry({ placeholderText: "Ask Claude something…", hexpand: true });

  const launchInner = new Gtk.Box({ spacing: 8, halign: Gtk.Align.CENTER });
  launchInner.append(new Gtk.Image({ iconName: "starred-symbolic", pixelSize: 14 }));
  launchInner.append(new Gtk.Label({ label: "Launch Claude" }));
  const launchBtn = new Gtk.Button({ child: launchInner, cssClasses: ["cal-dlg-save"], hexpand: true });

  const launch = () => {
    const prompt = promptEntry.text.trim();
    const escaped = prompt.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const cmd = prompt
      ? `kitty -e bash -c '/home/luca/.local/bin/claude "${escaped}"; read'`
      : `kitty -e /home/luca/.local/bin/claude`;
    GLib.spawn_command_line_async(cmd);
    promptEntry.set_text("");
  };

  launchBtn.connect("clicked", launch);
  promptEntry.connect("activate", launch);

  root.append(promptEntry);
  root.append(launchBtn);
  return root;
}

// ── Notification center ────────────────────────────────────────────────────────

function buildNotificationCenter(): Gtk.Widget {
  const notifd = Notifd.get_default();

  const root = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10, cssClasses: ["notification-section"] });

  const hdr = new Gtk.Box({ spacing: 12 });
  hdr.append(new Gtk.Label({ label: "Notifications", halign: Gtk.Align.START, hexpand: true, cssClasses: ["notification-title"] }));
  const clearBtn = new Gtk.Button({ cssClasses: ["clear-all"] });
  clearBtn.set_child(new Gtk.Label({ label: "Clear All" }));
  clearBtn.connect("clicked", () => notifd.get_notifications()?.forEach((n) => n.dismiss()));
  hdr.append(clearBtn);
  root.append(hdr);

  const sw = new Gtk.ScrolledWindow({ maxContentHeight: 220, cssClasses: ["notification-list"] });
  const listBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 6 });

  const render = () => {
    let ch = listBox.get_first_child();
    while (ch) { const n = ch.get_next_sibling(); listBox.remove(ch); ch = n; }
    const list = notifd.get_notifications();
    if (!list?.length) {
      const empty = new Gtk.Box({ cssClasses: ["no-notifications"] });
      empty.append(new Gtk.Label({ label: "No notifications" }));
      listBox.append(empty);
      return;
    }
    list.forEach((notif) => {
      const item = new Gtk.Box({ cssClasses: ["notification-item"], orientation: Gtk.Orientation.HORIZONTAL, spacing: 10 });
      if (notif.image) item.append(makeNotifImageBox(notif.image));
      const contentBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 3, hexpand: true });
      const titleRow = new Gtk.Box({ spacing: 6 });
      const summary = new Gtk.Label({ label: notif.summary, halign: Gtk.Align.START, hexpand: true, cssClasses: ["notification-summary"], ellipsize: Pango.EllipsizeMode.END, maxWidthChars: 22 });
      const closeBtn = new Gtk.Button({ cssClasses: ["dismiss-button"] });
      closeBtn.set_child(new Gtk.Label({ label: "×" }));
      closeBtn.connect("clicked", () => notif.dismiss());
      titleRow.append(summary);
      titleRow.append(closeBtn);
      contentBox.append(titleRow);
      if (notif.body) {
        const body = new Gtk.Label({ label: notif.body, halign: Gtk.Align.START, wrap: true, use_markup: true, cssClasses: ["notification-body"], ellipsize: Pango.EllipsizeMode.END, lines: 2 });
        contentBox.append(body);
      }
      item.append(contentBox);
      listBox.append(item);
    });
  };

  render();
  const id1 = notifd.connect("notified", render);
  const id2 = notifd.connect("resolved", render);
  listBox.connect("destroy", () => { notifd.disconnect(id1); notifd.disconnect(id2); });

  sw.set_child(listBox);
  root.append(sw);
  return root;
}

// ── Power row ──────────────────────────────────────────────────────────────────

function buildPowerRow(): Gtk.Widget {
  const actions: { label: string; icon: string; css: string; cmd: string }[] = [
    { label: "Lock", icon: "system-lock-screen-symbolic", css: "lock", cmd: "hyprlock" },
    { label: "Suspend", icon: "media-playback-pause-symbolic", css: "suspend", cmd: "systemctl suspend" },
    { label: "Reboot", icon: "system-reboot-symbolic", css: "reboot", cmd: "systemctl reboot" },
    { label: "Shutdown", icon: "system-shutdown-symbolic", css: "shutdown", cmd: "systemctl poweroff" },
  ];

  const row = new Gtk.Box({ spacing: 6, cssClasses: ["power-row"], homogeneous: true });

  actions.forEach(({ label, icon, css, cmd }) => {
    const inner = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 3, halign: Gtk.Align.CENTER });
    inner.append(new Gtk.Image({ iconName: icon, pixelSize: 14 }));
    inner.append(new Gtk.Label({ label, cssClasses: ["power-action-label"] }));
    const btn = new Gtk.Button({ child: inner, cssClasses: ["power-action-btn", css], hexpand: true });
    btn.connect("clicked", () => GLib.spawn_command_line_async(cmd));
    row.append(btn);
  });

  return row;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RightSidebar({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  let win: Astal.Window;
  let stack: Gtk.Stack;
  const getWin = () => win;

  const buildMainPage = (): Gtk.Widget => {
    let volumeOpen = false;
    let wifiOpen = false;
    let btOpen = false;
    let dockerOpen = false;

    let volumeRevealer: Gtk.Revealer;
    let wifiRevealer: Gtk.Revealer;
    let btRevealer: Gtk.Revealer;
    let dockerRevealer: Gtk.Revealer;
    let volumeBtn: Gtk.Button;
    let wifiBtn: Gtk.Button;
    let btBtn: Gtk.Button;
    let dockerBtn: Gtk.Button;

    const toggle = (which: "volume" | "wifi" | "bt" | "docker") => {
      volumeOpen = which === "volume" ? !volumeOpen : false;
      wifiOpen = which === "wifi" ? !wifiOpen : false;
      btOpen = which === "bt" ? !btOpen : false;
      dockerOpen = which === "docker" ? !dockerOpen : false;

      volumeRevealer.reveal_child = volumeOpen;
      wifiRevealer.reveal_child = wifiOpen;
      btRevealer.reveal_child = btOpen;
      dockerRevealer.reveal_child = dockerOpen;

      ([ [volumeBtn, volumeOpen], [wifiBtn, wifiOpen], [btBtn, btOpen], [dockerBtn, dockerOpen] ] as [Gtk.Button, boolean][])
        .forEach(([btn, open]) => { if (open) btn.add_css_class("active"); else btn.remove_css_class("active"); });
    };

    // ── Fixed top ────────────────────────────────────────────────────────────

    const top = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10, cssClasses: ["sidebar-header"] });
    top.append(buildUserHeader(gdkmonitor, getWin));
    top.append(buildQuickToggles());

    // Control buttons: Row 1 = Volume | WiFi, Row 2 = Bluetooth | Docker
    const makeCtrlBtn = (icon: string, label: string): Gtk.Button => {
      const btn = new Gtk.Button({ cssClasses: ["qs-bar-btn"], hexpand: true });
      const inner = new Gtk.Box({ spacing: 8 });
      inner.append(new Gtk.Image({ iconName: icon }));
      inner.append(Object.assign(new Gtk.Label({ label, xalign: 0, hexpand: true }), {}));
      inner.append(new Gtk.Image({ iconName: "go-down-symbolic" }));
      btn.set_child(inner);
      return btn;
    };

    volumeBtn = makeCtrlBtn("audio-volume-high-symbolic", "Volume");
    volumeBtn.connect("clicked", () => toggle("volume"));

    wifiBtn = makeCtrlBtn("network-wireless-symbolic", "Wi-Fi");
    wifiBtn.connect("clicked", () => toggle("wifi"));

    btBtn = makeCtrlBtn("bluetooth-symbolic", "Bluetooth");
    btBtn.connect("clicked", () => toggle("bt"));

    dockerBtn = makeCtrlBtn("preferences-system-symbolic", "Docker");
    dockerBtn.connect("clicked", () => toggle("docker"));

    const row1 = new Gtk.Box({ spacing: 8 });
    row1.append(volumeBtn);
    row1.append(wifiBtn);

    const row2 = new Gtk.Box({ spacing: 8 });
    row2.append(btBtn);
    row2.append(dockerBtn);

    const btnBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 8 });
    btnBox.append(row1);
    btnBox.append(row2);
    top.append(btnBox);

    // ── Scrollable content ────────────────────────────────────────────────────

    const scroll = new Gtk.ScrolledWindow({ vexpand: true, hscrollbarPolicy: Gtk.PolicyType.NEVER });
    const scrollInner = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 0, marginTop: 4 });

    const makeDropdown = (child: Gtk.Widget): Gtk.Revealer => {
      const r = new Gtk.Revealer({ transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN, transitionDuration: 200, revealChild: false, child });
      scrollInner.append(r);
      return r;
    };

    volumeRevealer = makeDropdown(buildAudioPanel());

    const wifiPanel = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, cssClasses: ["qs-dropdown-panel"] });
    wifiPanel.append(buildWifiPanel());
    wifiRevealer = makeDropdown(wifiPanel);

    const btPanel = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, cssClasses: ["qs-dropdown-panel"] });
    btPanel.append(buildBluetoothPanel());
    btRevealer = makeDropdown(btPanel);

    const dockerPanel = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, cssClasses: ["qs-dropdown-panel"] });
    dockerPanel.append(buildDockerSection());
    dockerRevealer = makeDropdown(dockerPanel);

    const sep = () => new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL, marginTop: 6, marginBottom: 6 });
    const sectionTitle = (label: string): Gtk.Box => {
      const h = new Gtk.Box({ marginBottom: 6 });
      h.append(new Gtk.Label({ label, xalign: 0, cssClasses: ["qs-panel-title"] }));
      return h;
    };

    scrollInner.append(sep());

    // Media player
    scrollInner.append(buildMediaSection());
    scrollInner.append(sep());

    // Dev shortcuts
    scrollInner.append(sectionTitle("Dev"));
    scrollInner.append(buildDevShortcuts());
    scrollInner.append(sep());

    // AI section
    scrollInner.append(sectionTitle("AI Assistant"));
    scrollInner.append(buildAISection());
    scrollInner.append(sep());

    // Notifications
    scrollInner.append(buildNotificationCenter());
    scrollInner.append(sep());

    // Calendar
    const calHdr = new Gtk.Box({ marginBottom: 4 });
    calHdr.append(new Gtk.Label({ label: "Calendar", xalign: 0, hexpand: true, cssClasses: ["cal-section-title"] }));
    scrollInner.append(calHdr);
    scrollInner.append(
      CalendarWidget(getWin, (date) => {
        const existing = stack.get_child_by_name("dayview");
        if (existing) stack.remove(existing);
        stack.add_named(buildDayView(getWin, date, () => stack.set_visible_child_name("main")), "dayview");
        stack.set_visible_child_name("dayview");
      }),
    );

    scroll.set_child(scrollInner);

    // ── Page assembly ─────────────────────────────────────────────────────────

    const page = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 0, vexpand: true });
    page.add_css_class("main-sidebar-page");
    page.append(top);
    page.append(scroll);
    page.append(buildPowerRow());
    return page;
  };

  return (
    <window
      $={(self) => {
        win = self as Astal.Window;
        const keys = new Gtk.EventControllerKey();
        keys.connect("key-pressed", (_, kv) => {
          if (kv === Gdk.KEY_Escape) {
            if (stack.visible_child_name !== "main") stack.set_visible_child_name("main");
            else self.hide();
            return Gdk.EVENT_STOP;
          }
          return Gdk.EVENT_PROPAGATE;
        });
        self.add_controller(keys);
      }}
      visible={false}
      namespace="sidebar"
      name={`RightSidebar-${gdkmonitor.connector}`}
      gdkmonitor={gdkmonitor}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.BOTTOM}
      exclusivity={Astal.Exclusivity.NORMAL}
      application={app}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.ON_DEMAND}
    >
      <box orientation={Gtk.Orientation.VERTICAL} cssClasses={["sidebar-container"]} widthRequest={400}>
        <stack
          $={(self) => {
            stack = self;
            self.add_named(buildMainPage(), "main");
            self.set_visible_child_name("main");
          }}
          vexpand
          transitionType={Gtk.StackTransitionType.SLIDE_LEFT_RIGHT}
          transitionDuration={250}
        />
      </box>
    </window>
  );
}
