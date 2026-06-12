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
    end,
    keys = {
      { "<C-\\>", "<cmd>ToggleTerm<CR>", desc = "Toggle terminal" },
    }
  },
}