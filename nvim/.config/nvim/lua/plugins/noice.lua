return {
  {
    "folke/noice.nvim",
    event = "VeryLazy",
    dependencies = {
      "MunifTanjim/nui.nvim",
      "rcarriga/nvim-notify"
    },
    opts = {
      lsp = {
        hover = { enabled = true, silent = false },
        signature = { enabled = true },
        progress = { enabled = true },
        message = { enabled = true }
      },
      presets = {
        bottom_search = true,    -- use a classic bottom cmdline for search
        command_palette = true,  -- position the cmdline and popupmenu together
        long_message_to_split = true,
        inc_rename = false,     -- disable for now (renamer UI)
        lsp_doc_border = true,  -- add border to hover/signature popups
      },
      messages = { enabled = true }, -- Enable message UI
      cmdline = { enabled = true },  -- modern command line UI
      views = { mini = { win_options = { winblend = 0 } } },
    },
  },
}