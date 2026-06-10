return {
  {
    "nvim-neo-tree/neo-tree.nvim",
    branch = "v3.x",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-tree/nvim-web-devicons",
      "MunifTanjim/nui.nvim",
    },
    keys = {
      { "<leader>fe", "<cmd>Neotree toggle<CR>", desc = "Toggle file explorer" },
      { "<leader>ff", "<cmd>Neotree reveal<CR>", desc = "Reveal current file" },
    },
    opts = {
      filesystem = {
        use_libuv_file_watcher = true,
        filtered_items = {
          visible = true,
          hide_dotfiles = false,
          hide_gitignored = false,
        },
      },
      window = {
        width = 32,
      },
    },
  },
}
