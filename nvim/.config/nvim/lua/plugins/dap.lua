return {
	{
		"mfussenegger/nvim-dap",
		dependencies = {
			"mfussenegger/nvim-dap-python",
			"mason-org/mason.nvim",
			{ "rcarriga/nvim-dap-ui", dependencies = { "nvim-neotest/nvim-nio" } },
		},
		config = function()
			local dap = require("dap")
			local dapui = require("dapui")

			-- Use project venv if available, fall back to system python
			local venv_python = vim.fn.getcwd() .. "/.venv/bin/python"
			local python = vim.fn.executable(venv_python) == 1 and venv_python or "python3"
			require("dap-python").setup(python)
			require("dap-python").test_runner = "pytest"

			dapui.setup()

			local mason_registry = require("mason-registry")
			local codelldb_root = mason_registry.get_package("codelldb"):get_install_path()
			local codelldb_path = codelldb_root .. "/extension/adapter/codelldb"
			local liblldb_path = codelldb_root .. "/extension/lldb/lib/liblldb.so"

			dap.adapters.codelldb = {
				type = "server",
				port = "${port}",
				executable = {
					command = codelldb_path,
					args = { "--liblldb", liblldb_path, "--port", "${port}" },
				},
			}

			dap.configurations.rust = {
				{
					name = "Launch",
					type = "codelldb",
					request = "launch",
					program = function()
						vim.notify("Building (cargo build)...", vim.log.levels.INFO)
						local build_output = vim.fn.system("cargo build")
						if vim.v.shell_error ~= 0 then
							vim.notify(build_output, vim.log.levels.ERROR, { title = "cargo build failed" })
							error("cargo build failed, aborting debug launch")
						end
						return vim.fn.input(
							"Path to executable: ",
							vim.fn.getcwd() .. "/target/debug/",
							"file"
						)
					end,
					cwd = "${workspaceFolder}",
					stopOnEntry = false,
					args = function()
						local input = vim.fn.input("Program args: ")
						return input ~= "" and vim.split(input, " ") or {}
					end,
				},
			}

			dap.adapters.coreclr = {
				type = "executable",
				command = "netcoredbg",
				args = { "--interpreter=vscode" },
			}

			dap.configurations.cs = {
				{
					type = "coreclr",
					name = "launch - netcoredbg",
					request = "launch",
					program = function()
						return vim.fn.input("Path to dll: ", vim.fn.getcwd() .. "/bin/Debug/", "file")
					end,
				},
			}

			-- Auto open/close UI with sessions
			dap.listeners.after.event_initialized["dapui"] = function() dapui.open() end
			dap.listeners.before.event_terminated["dapui"] = function() dapui.close() end
			dap.listeners.before.event_exited["dapui"] = function() dapui.close() end
		end,
		keys = {
			-- Session control
			{ "<leader>dc", function() require("dap").continue() end,   desc = "Debug: continue / start" },
			{ "<leader>dq", function() require("dap").terminate() end,  desc = "Debug: terminate" },
			{ "<leader>dl", function() require("dap").run_last() end,   desc = "Debug: run last" },

			-- Stepping
			{ "<leader>ds", function() require("dap").step_over() end,  desc = "Debug: step over" },
			{ "<leader>di", function() require("dap").step_into() end,  desc = "Debug: step into" },
			{ "<leader>do", function() require("dap").step_out() end,   desc = "Debug: step out" },

			-- Breakpoints
			{ "<leader>db", function() require("dap").toggle_breakpoint() end, desc = "Debug: toggle breakpoint" },
			{ "<leader>dB", function()
				require("dap").set_breakpoint(vim.fn.input("Condition: "))
			end, desc = "Debug: conditional breakpoint" },
			{ "<leader>dL", function()
				require("dap").set_breakpoint(nil, nil, vim.fn.input("Log message: "))
			end, desc = "Debug: log point" },

			-- UI / inspection
			{ "<leader>du", function() require("dapui").toggle() end,   desc = "Debug: toggle UI" },
			{ "<leader>de", function() require("dapui").eval(nil, { enter = true }) end,
				mode = { "n", "v" }, desc = "Debug: evaluate expression" },
			{ "<leader>dr", function() require("dap").repl.open() end,  desc = "Debug: open REPL" },
		},
	},
}
