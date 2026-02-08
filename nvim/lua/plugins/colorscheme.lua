return {
  {
    "everviolet/nvim",
    name = "evergarden",
    config = function()
      require("evergarden").setup({
        theme = {
          variant = "fall", -- winter | fall | spring | summer
          accent = "green",
        },
        editor = {
          -- transparent_background = true, -- enable transparency
          override_terminal = true,
        },
      })

      vim.cmd("colorscheme evergarden")
    end,
  },
}
