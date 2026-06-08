import { Astal, Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
import app from "ags/gtk4/app"

const TRANSITION_MS = 250

let _inner = null
let _clip = null
let _closeTimer = 0

function cancelClose() {
    if (_closeTimer) {
        GLib.source_remove(_closeTimer)
        _closeTimer = 0
    }
}

function open() {
    cancelClose()
    _clip.set_size_request(300, -1)
    _inner.add_css_class("visible")
}

function close() {
    _inner.remove_css_class("visible")
    // Shrink the window back to strip-only after the slide animation finishes
    _closeTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, TRANSITION_MS + 20, () => {
        _clip.set_size_request(0, -1)
        _closeTimer = 0
        return GLib.SOURCE_REMOVE
    })
}

export function toggleSidebar() {
    if (!_inner || !_clip) return
    if (_inner.has_css_class("visible")) {
        close()
    } else {
        open()
    }
}

export default function Sidebar() {
    const title = new Gtk.Label({ label: "Dashboard", hexpand: true, xalign: 0 })
    title.add_css_class("sidebar-title")

    const header = new Gtk.Box({ spacing: 0 })
    header.add_css_class("sidebar-header")
    header.append(title)

    const content = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
    content.add_css_class("sidebar-content")
    content.set_vexpand(true)

    const inner = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
    inner.add_css_class("sidebar")
    inner.append(header)
    inner.append(content)

    const clip = new Gtk.Box()
    clip.add_css_class("sidebar-clip")
    clip.append(inner)

    const strip = new Gtk.Box()
    strip.add_css_class("sidebar-strip")

    // [strip (4px, left edge)] [clip (expands to 300px when open, 0 when closed)]
    const container = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL })
    container.append(strip)
    container.append(clip)

    const win = new Astal.Window({
        application: app,
        name: "sidebar",
        anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.BOTTOM,
        exclusivity: Astal.Exclusivity.NORMAL,
        visible: true,
    })

    const motion = new Gtk.EventControllerMotion()
    win.add_controller(motion)
    motion.connect("enter", open)
    motion.connect("leave", close)

    _inner = inner
    _clip = clip
    win.set_child(container)
    return win
}
