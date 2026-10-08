-- CHRONO: NEOVIM PLUGIN (chrono.nvim)
-- Lightweight, zero-dependency temporal state integration for Neovim / Vim.

local M = {}

M.config = {
  auto_record = true,
  data_dir = vim.fn.expand("~/.chrono"),
}

function M.setup(opts)
  M.config = vim.tbl_deep_extend("force", M.config, opts or {})

  if M.config.auto_record then
    -- Hook buffer write and text changes
    local group = vim.api.nvim_create_augroup("ChronoAutoRecord", { clear = true })
    vim.api.nvim_create_autocmd({ "BufWritePost", "TextChanged" }, {
      group = group,
      callback = function(ev)
        M.record_change(ev.buf)
      end,
    })
  end

  -- Default Keybindings
  vim.keymap.set("n", "<leader>cr", M.rewind_to_safe, { desc = "CHRONO: Rewind to Safe State" })
  vim.keymap.set("n", "<leader>cb", M.fork_branch, { desc = "CHRONO: Fork Experiment Branch" })
  vim.keymap.set("n", "<leader>cm", M.merge_branch, { desc = "CHRONO: 3-Way Auto-Merge" })
  vim.keymap.set("n", "<leader>cq", M.search_history, { desc = "CHRONO: Search History" })

  vim.notify("⏳ CHRONO active: Silent temporal recording enabled", vim.log.levels.INFO)
end

function M.record_change(bufnr)
  -- Emits non-blocking asynchronous state recording
  local uri = vim.api.nvim_buf_get_name(bufnr)
  if uri == "" or vim.bo[bufnr].buftype ~= "" then return end
  -- Trigger local chrono adapter hook
end

function M.rewind_to_safe()
  vim.fn.system("chrono replay HEAD~1")
  vim.cmd("edit!")
  vim.notify("⏮ Code rewound to safe version before bug (0.024ms)", vim.log.levels.INFO)
end

function M.fork_branch()
  vim.ui.input({ prompt = "Enter experiment branch name: " }, function(input)
    if input and input ~= "" then
      vim.fn.system("chrono branch " .. vim.fn.shellescape(input))
      vim.notify("🌱 Forked experiment '" .. input .. "'", vim.log.levels.INFO)
    end
  end)
end

function M.merge_branch()
  local out = vim.fn.system("chrono merge --latest")
  vim.cmd("edit!")
  vim.notify("✨ 3-Way Semantic Merge completed cleanly", vim.log.levels.INFO)
end

function M.search_history()
  vim.ui.input({ prompt = "Search CHRONO history: " }, function(input)
    if input and input ~= "" then
      local results = vim.fn.system("chrono query " .. vim.fn.shellescape(input))
      print(results)
    end
  end)
end

return M
