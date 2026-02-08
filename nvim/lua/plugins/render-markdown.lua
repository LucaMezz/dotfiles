return {
  {
    "MeanderingProgrammer/render-markdown.nvim",
    dependencies = {
      "nvim-treesitter/nvim-treesitter",
      "nvim-tree/nvim-web-devicons",
    },
    ft = { "markdown", "codecompanion" },
    config = function()
      require("render-markdown").setup({
        file_types = { "markdown", "codecompanion" },
      })

      -- IMPORTANT: manually enable for CodeCompanion buffers
      vim.api.nvim_create_autocmd("FileType", {
        pattern = "codecompanion",
        callback = function()
          require("render-markdown").enable()
        end,
      })
    end,
  },
}
