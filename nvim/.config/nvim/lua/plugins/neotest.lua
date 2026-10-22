return {
	{
		"nvim-neotest/neotest",
		dependencies = {
			"nvim-neotest/nvim-nio",
			"nvim-lua/plenary.nvim",
			"nvim-treesitter/nvim-treesitter",
			"nvim-neotest/neotest-python",
		},
		config = function()
			require("neotest").setup({
				adapters = {
					require("neotest-python")({
						runner = "pytest",
						args = { "--no-cov" },
						pytest_discover_instances = true,
						python = function()
							local cwd = vim.fn.getcwd()
							local venv_python = cwd .. "/.venv/bin/python"
							if vim.fn.executable(venv_python) == 1 then
								return venv_python
							end
							return "python3"
						end,
					}),
				},
			})
		end,
		keys = {
			{ "<leader>ta", function() require("neotest").run.run(vim.fn.getcwd()) end,           desc = "Run all tests" },
			{ "<leader>tt", function() require("neotest").run.run() end,                          desc = "Run nearest test" },
			{ "<leader>tf", function() require("neotest").run.run(vim.fn.expand("%")) end,        desc = "Run tests in file" },
			{ "<leader>ts", function() require("neotest").summary.toggle() end,                   desc = "Toggle test summary" },
			{ "<leader>to", function() require("neotest").output_panel.toggle() end,              desc = "Toggle test output" },
			{ "<leader>tl", function() require("neotest").run.run_last() end,                     desc = "Re-run last test" },
			{ "<leader>td", function() require("neotest").run.run({ strategy = "dap" }) end,     desc = "Debug nearest test" },
		},
	},
}
