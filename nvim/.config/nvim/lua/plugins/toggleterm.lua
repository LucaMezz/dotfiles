return {
  {
    "akinsho/toggleterm.nvim",
    version = "*",
    config = function()
      require("toggleterm").setup{
        -- default config: open terminal with <C-\\>
        open_mapping = [[<C-_>]],
        direction = "horizontal",
        shade_terminals = true,
        persist_mode = true,
      }

      local Terminal = require("toggleterm.terminal").Terminal
      local bacon = Terminal:new({
        cmd = "bacon",
        direction = "vertical",
        hidden = true,
        on_open = function()
          vim.cmd("startinsert")
        end,
      })

      vim.keymap.set("n", "<leader>tb", function()
        bacon:toggle(math.floor(vim.o.columns * 0.4), "vertical")
      end, { desc = "Toggle bacon", silent = true })
    end,
    keys = {
      { "<C-/>", "<cmd>ToggleTerm<CR>", desc = "Toggle terminal", mode = { "n", "t" } },
      { "<leader>tb", desc = "Toggle bacon" },
    }
  },
}