import GLib from "gi://GLib"
import app from "ags/gtk4/app"
import Sidebar, { toggleSidebar } from "./windows/sidebar.js"

const configDir = GLib.get_user_config_dir()

app.start({
    css: `${configDir}/ags/style.css`,
    requestHandler(request, response) {
        if (request[0] === "toggle-sidebar") {
            toggleSidebar()
            return response("ok")
        }
        response("unknown request")
    },
    main() {
        Sidebar()
    },
})
