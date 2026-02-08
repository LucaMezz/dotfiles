return {
  -- Copilot-CMP Plugin
  {
    "zbirenbaum/copilot-cmp",
    config = function()
      -- Setup copilot-cmp
      require("copilot_cmp").setup()

      -- Add copilot to nvim-cmp sources
      local cmp = require("cmp")
      cmp.setup({
        sources = {
          { name = "copilot", group_index = 2 },
          { name = "nvim_lsp", group_index = 2 },
          { name = "path", group_index = 2 },
          { name = "luasnip", group_index = 2 },
        },
        formatting = {
          format = require("lspkind").cmp_format({
            mode = "symbol",
            max_width = 50,
            symbol_map = { Copilot = "" },
          }),
        },
        sorting = {
          priority_weight = 2,
          comparators = {
            require("copilot_cmp.comparators").prioritize,
            -- Default comparators
            cmp.config.compare.offset,
            cmp.config.compare.exact,
            cmp.config.compare.score,
            cmp.config.compare.recently_used,
            cmp.config.compare.locality,
            cmp.config.compare.kind,
            cmp.config.compare.sort_text,
            cmp.config.compare.length,
            cmp.config.compare.order,
          },
        },
      })
    end,
    after = { "copilot.lua" },
  },

  -- Copilot Plugin (Make sure this is installed if not already)
  {
    "zbirenbaum/copilot.lua",
    config = function()
      require("copilot").setup({
        suggestion = { enabled = false },
        panel = { enabled = false },
      })
    end,
  },

  {
    "onsails/lspkind-nvim",
    config = function()
      require("lspkind").init({
        -- You can add additional customization here if needed
      })
    end,
  },
}
