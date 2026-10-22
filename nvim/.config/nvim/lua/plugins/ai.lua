-- AI assistance:
-- * copilot.lua: inline ghost-text completions (GitHub Copilot Free),
--   trimmed to a single term, up to the next whitespace
--   (see config/copilot_short.lua).
--   First use: run :Copilot auth and sign in with GitHub.
-- * claudecode.nvim: Claude Code (Pro plan) in a split, aware of the
--   current file and selection, with edits shown as diffs.
return {
	{
		"zbirenbaum/copilot.lua",
		cmd = "Copilot",
		event = "InsertEnter",
		config = function(_, opts)
			require("copilot").setup(opts)
			-- Suggest exactly one term: up to the next whitespace.
			-- For a few terms instead, use e.g. { words = 3 } or { max_chars = 30 }.
			require("config.copilot_short").setup({ words = 1 })
		end,
		opts = {
			suggestion = {
				enabled = true,
				auto_trigger = true,
				-- Don't show ghost text while the nvim-cmp menu is open.
				hide_during_completion = true,
				keymap = {
					accept = "<M-l>", -- whole suggestion
					accept_word = "<M-w>", -- just the next word
					accept_line = "<M-j>", -- just the rest of the line
					next = "<M-]>",
					prev = "<M-[>",
					dismiss = "<C-]>",
				},
			},
			panel = { enabled = false },
			filetypes = {
				tex = true,
				markdown = true,
				-- Keep secrets out of requests.
				sh = function()
					return not vim.fs.basename(vim.api.nvim_buf_get_name(0)):match("^%.env")
				end,
			},
		},
	},
	{
		"coder/claudecode.nvim",
		dependencies = { "folke/snacks.nvim" },
		config = true,
		cmd = {
			"ClaudeCode",
			"ClaudeCodeFocus",
			"ClaudeCodeSelectModel",
			"ClaudeCodeAdd",
			"ClaudeCodeSend",
			"ClaudeCodeTreeAdd",
			"ClaudeCodeDiffAccept",
			"ClaudeCodeDiffDeny",
		},
		keys = {
			{ "<leader>a", nil, desc = "AI / Claude Code" },
			{ "<leader>ac", "<cmd>ClaudeCode<cr>", desc = "Toggle Claude" },
			{ "<leader>af", "<cmd>ClaudeCodeFocus<cr>", desc = "Focus Claude" },
			{ "<leader>ar", "<cmd>ClaudeCode --resume<cr>", desc = "Resume Claude" },
			{ "<leader>aC", "<cmd>ClaudeCode --continue<cr>", desc = "Continue Claude" },
			{ "<leader>am", "<cmd>ClaudeCodeSelectModel<cr>", desc = "Select Claude model" },
			{ "<leader>ab", "<cmd>ClaudeCodeAdd %<cr>", desc = "Add current buffer" },
			{ "<leader>as", "<cmd>ClaudeCodeSend<cr>", mode = "v", desc = "Send selection to Claude" },
			{ "<leader>as", "<cmd>ClaudeCodeTreeAdd<cr>", desc = "Add file", ft = { "neo-tree" } },
			{ "<leader>aa", "<cmd>ClaudeCodeDiffAccept<cr>", desc = "Accept diff" },
			{ "<leader>ad", "<cmd>ClaudeCodeDiffDeny<cr>", desc = "Deny diff" },
		},
	},
}
