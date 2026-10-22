-- Roblox projects are detected by the presence of a Rojo project file
-- (the same `default.project.json` already used below as
-- `rojo_project_file`) -- when it's missing, this is treated as a
-- "standard" (non-Roblox) Luau embedding instead, e.g. fig-engine, and
-- fig-engine's own globals (crates/engine/fig-engine.d.luau) are loaded
-- in place of Roblox's.
local is_roblox = vim.uv.fs_stat(vim.fn.getcwd() .. "/default.project.json") ~= nil

return {
	"lopi-py/luau-lsp.nvim",
	dependencies = {
		"nvim-lua/plenary.nvim",
	},
	ft = "luau",
	config = function()
		if is_roblox then
			require("luau-lsp").setup({
				platform = {
					type = "roblox",
				},

				types = {
					definition_files = {
						testez = vim.fn.stdpath("config") .. "/types/testez.d.luau",
					},
				},

				sourcemap = {
					enabled = true,
					autogenerate = false,
					sourcemap_file = "sourcemap.json",
					rojo_project_file = "default.project.json",
				},

				plugin = {
					enabled = true,
					host = "0.0.0.0",
					port = 3667,
				},
			})

			-- With autogenerate = false the server reads the sourcemap once at startup
			-- and relies on workspace/didChangeConfiguration to re-read it when the
			-- file changes. dev.sh owns the rojo process, so we watch the file here
			-- and push the notification ourselves.
			local sourcemap_path = vim.fn.getcwd() .. "/sourcemap.json"
			local watcher = vim.uv.new_fs_event()
			local debounce = nil

			watcher:start(sourcemap_path, {}, function(err, _filename, _events)
				if err then
					return
				end
				if debounce then
					debounce:stop()
					debounce:close()
				end
				debounce = vim.uv.new_timer()
				debounce:start(150, 0, function()
					debounce:close()
					debounce = nil
					vim.schedule(function()
						for _, client in ipairs(vim.lsp.get_clients({ name = "luau-lsp" })) do
							client.notify("workspace/didChangeConfiguration", { settings = {} })
						end
					end)
				end)
			end)

			vim.api.nvim_create_autocmd("VimLeavePre", {
				callback = function()
					if debounce then
						debounce:stop()
						debounce:close()
					end
					watcher:stop()
					watcher:close()
				end,
			})
		else
			require("luau-lsp").setup({
				platform = {
					type = "standard",
				},

				types = {
					definition_files = {
						["fig-engine"] = vim.fn.getcwd() .. "/crates/engine/fig-engine.d.luau",
					},
				},

				sourcemap = {
					enabled = false,
				},

				plugin = {
					enabled = false,
				},
			})
		end
	end,
}
