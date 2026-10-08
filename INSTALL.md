# 🚀 CHRONO Installation Guide for All IDEs

CHRONO runs silently in the background across all major code editors. Choose your editor below for a 30-second setup.

---

### 1️⃣ VS Code, Cursor & Windsurf
*(Supports VS Code, Cursor, Windsurf, VSCodium, and Positron)*

#### Quick 1-Command Install:
```powershell
# Windows
xcopy /E /I extensions\vscode "$env:USERPROFILE\.vscode\extensions\chrono-vscode"

# macOS & Linux
ln -s "$(pwd)/extensions/vscode" ~/.vscode/extensions/chrono-vscode
```
*Or search **"CHRONO"** in the VS Code Extensions Marketplace and click **Install**.*

👉 **Usage:** Click the **`[ C ]`** logo in the top-right toolbar or press <kbd>Ctrl+Shift+T</kbd> / <kbd>Cmd+Shift+T</kbd>.

---

### 2️⃣ JetBrains Suite
*(Supports IntelliJ IDEA, PyCharm, WebStorm, Android Studio, CLion, GoLand, Rider)*

1. Open your IDE **Settings** (<kbd>Ctrl+Alt+S</kbd> or <kbd>Cmd+,</kbd> on macOS).
2. Go to **Plugins** ➔ Click the ⚙️ gear icon ➔ **"Install Plugin from Disk..."**.
3. Select `adapters/jetbrains` (or search **"CHRONO"** in the JetBrains Marketplace).
4. Restart your IDE.

👉 **Usage:** Click the **CHRONO** menu in your main toolbar or press <kbd>Ctrl+Alt+Z</kbd> to rewind.

---

### 3️⃣ Neovim / Vim
*(Supports Neovim 0.8+ via lazy.nvim, packer.nvim, or native packages)*

#### Using `lazy.nvim`:
```lua
{
  "chrono-project/chrono.nvim",
  config = function()
    require("chrono").setup()
  end
}
```

#### Default Keymaps:
- `<leader>cr` — **Rewind** code to safe state before bug
- `<leader>cb` — **Fork** new experiment sandbox branch
- `<leader>cm` — **3-Way Auto-Merge** experiment into main
- `<leader>cq` — **Search** state history

---

### 4️⃣ Universal CLI / Any Editor (Sublime, Emacs, Zed, Terminal)
*If you use any other editor, the standalone CHRONO daemon observes your workspace filesystem automatically:*

```bash
# Install CLI globally
npm install -g chrono

# Start background recording for your current folder
chrono start
```

#### Common CLI Commands:
```bash
# See your recent continuous micro-history
chrono log --last 30m

# Rewind files to previous safe state
chrono replay HEAD~1

# Fork a sandbox experiment
chrono branch exp/my-test

# Reconcile experiment into main with 0 conflicts
chrono merge exp/my-test

# Ask questions in plain English
chrono query "when did tests break"
```

---

### 🎯 Summary: Works Everywhere

| Environment | Setup Time | How You Control It |
|:---|:---:|:---|
| **VS Code / Cursor / Windsurf** | 30 sec | Click **`[ C ]`** button or <kbd>Ctrl+Shift+T</kbd> |
| **IntelliJ / PyCharm / WebStorm** | 30 sec | Main toolbar menu or <kbd>Ctrl+Alt+Z</kbd> |
| **Neovim / Vim** | 30 sec | `<leader>cr` (Rewind), `<leader>cb` (Branch) |
| **Universal CLI / Any Editor** | 30 sec | `chrono start`, `chrono replay`, `chrono merge` |
