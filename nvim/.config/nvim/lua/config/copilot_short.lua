-- Keep Copilot suggestions short: one line and a few terms, not whole proofs.
--
-- copilot.lua has no option for suggestion length, so this wraps the API call
-- that fetches completions and trims each one before it is shown or accepted.
local M = {}

-- Longest suggestion, in characters typed after the cursor.
M.max_chars = 30
-- If set, show only this many whitespace-separated words instead.
M.words = nil

-- Characters a suggestion may end on (kept), and before which it may end.
local END_AFTER = "[%$%},;%)]"
local END_BEFORE = "%s"

--- Trim the text after the cursor to one line and at most `max` characters,
--- ending at a natural break when it has to be cut.
---@param new string
---@param max integer
---@return string
function M.trim(new, max)
	new = new:match("^[^\n]*")
	if M.words then
		-- Leading whitespace, then `words` runs of non-whitespace.
		local out = new:match("^%s*") or ""
		local rest = new:sub(#out + 1)
		for _ = 1, M.words do
			local word, gap = rest:match("^(%S+)(%s*)")
			if not word then
				break
			end
			out = out .. word
			rest = rest:sub(#word + 1)
			if _ < M.words then
				out, rest = out .. gap, rest:sub(#gap + 1)
			end
		end
		return out
	end
	if #new <= max then
		return new
	end
	local cut = new:sub(1, max)
	for i = #cut, 1, -1 do
		local ch = cut:sub(i, i)
		if ch:match(END_AFTER) then
			return cut:sub(1, i)
		elseif ch:match(END_BEFORE) and i > 1 then
			return cut:sub(1, i - 1)
		end
	end
	return cut
end

--- Shorten one completion in place. `text` replaces the line from
--- `range.start.character`, so the part after the cursor starts at
--- `position.character` (both in UTF-16 units).
function M.shorten(completion)
	local text = completion.text or ""
	local start = completion.range and completion.range.start.character or 0
	local cursor = completion.position and completion.position.character or start
	local ok, offset = pcall(vim.str_byteindex, text, "utf-16", cursor - start, false)
	offset = ok and offset or (cursor - start)
	local prefix, new = text:sub(1, offset), text:sub(offset + 1)
	local short = M.trim(new, M.max_chars)
	completion.text = prefix .. short
	completion.displayText = short
end

local function wrap(callback)
	return function(err, data, ...)
		if not err and data and data.completions then
			for _, completion in ipairs(data.completions) do
				M.shorten(completion)
			end
		end
		return callback(err, data, ...)
	end
end

function M.setup(opts)
	M.max_chars = (opts and opts.max_chars) or M.max_chars
	M.words = opts and opts.words or M.words
	local api = require("copilot.api")
	for _, name in ipairs({ "get_completions", "get_completions_cycling" }) do
		local original = api[name]
		api[name] = function(client, params, callback)
			return original(client, params, wrap(callback))
		end
	end
end

return M
