return {
  {
    "nvim-telescope/telescope.nvim",
    tag = "0.1.8",
    dependencies = {
      "nvim-lua/plenary.nvim",
    },
    keys = {
      { "<leader>sf", "<cmd>Telescope find_files<CR>", desc = "Search files" },
      { "<leader>sg", "<cmd>Telescope live_grep<CR>", desc = "Search text with ripgrep" },
      { "<leader>sb", "<cmd>Telescope buffers<CR>", desc = "Search buffers" },
      { "<leader>sh", "<cmd>Telescope help_tags<CR>", desc = "Search help" },
    },
    opts = {
      defaults = {
        file_ignore_patterns = {
          "node_modules",
          ".git/",
          "dist/",
          "build/",
        },
      },
    },
  },
}
