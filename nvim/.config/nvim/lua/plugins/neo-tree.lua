return {
  {
    "nvim-neo-tree/neo-tree.nvim",
    branch = "v3.x",
    lazy = false,
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-tree/nvim-web-devicons",
      "MunifTanjim/nui.nvim",
    },
    keys = {
      { "<leader>fe", "<cmd>Neotree toggle<CR>", desc = "Toggle file explorer" },
      { "<leader>ff", "<cmd>Neotree reveal<CR>", desc = "Reveal current file" },
    },
    init = function()
      vim.api.nvim_create_autocmd("VimEnter", {
        once = true,
        callback = function()
          local argv = vim.fn.argv(0)
          if argv ~= "" and vim.fn.isdirectory(argv) == 1 then
            local dir = vim.fn.fnamemodify(argv, ":p")
            local buf = vim.api.nvim_get_current_buf()
            vim.cmd("cd " .. vim.fn.fnameescape(dir))
            vim.cmd("enew")
            pcall(vim.api.nvim_buf_delete, buf, { force = true })
          end
          vim.cmd("Neotree show")
        end,
      })
    end,
    opts = {
      filesystem = {
        use_libuv_file_watcher = true,
        hijack_netrw_behavior = "open_default",
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
