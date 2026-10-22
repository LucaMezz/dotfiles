return {
  "akinsho/bufferline.nvim",
  version = "*",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  event = "VeryLazy",
  opts = function()
    return {
      options = {
        diagnostics = "nvim_lsp",
        always_show_bufferline = true,
      },
      highlights = require("catppuccin.special.bufferline").get_theme()(),
    }
  end,
  keys = {
    { "<S-l>", "<cmd>BufferLineCycleNext<CR>", desc = "Next buffer" },
    { "<S-h>", "<cmd>BufferLineCyclePrev<CR>", desc = "Previous buffer" },
    { "<leader>bp", "<cmd>BufferLinePick<CR>", desc = "Pick buffer" },
    { "<leader>bc", "<cmd>bdelete<CR>", desc = "Close buffer" },
    { "<leader>bo", "<cmd>BufferLineCloseOthers<CR>", desc = "Close other buffers" },
  },
}
