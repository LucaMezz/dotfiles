return {
  "xiyaowong/transparent.nvim",
  config = function()
    require("transparent").setup({
      -- Table of default highlight groups to make transparent
      groups = {
        "Normal",
        "NormalNC",
        "Comment",
        "Constant",
        "Special",
        "Identifier",
        "Statement",
        "PreProc",
        "Type",
        "Underlined",
        "Todo",
        "String",
        "Function",
        "Conditional",
        "Repeat",
        "Operator",
        "Structure",
        "LineNr",
        "NonText",
        "SignColumn",
        "CursorLine",
        "CursorLineNr",
        "StatusLine",
        "StatusLineNC",
        "EndOfBuffer",
      },
      -- Additional groups that should be cleared (optional)
      extra_groups = {
        "NormalFloat",
        "FloatBorder",
        "NeoTreeNormal",
        "NeoTreeNormalNC",
        "NeoTreeWinSeparator",
        "NeoTreeFloatNormal",
        "NeoTreeFloatBorder",
        "NeoTreeFloatTitle",
      },
      -- Groups to exclude from being transparent
      exclude_groups = {},
      -- Optional: Code to execute after the highlight groups are cleared
      on_clear = function()
        -- You can put any extra logic here after the background is cleared
      end,
    })

    require("transparent").clear_prefix("NeoTree")
  end,
}
