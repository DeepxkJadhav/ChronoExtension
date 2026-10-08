# CHRONO for Visual Studio Code ⏳

> **Git for living computational state — directly inside your editor.**

No manual daemons to launch. No terminal commands to remember.  
Just write code. CHRONO automatically records your state in the background.

---

## ✨ Features

- **Continuous Zero-Overhead Recording:**  
  Every keystroke and buffer modification is converted into lightweight semantic deltas (`text.splice`) stored in a local write-ahead log.
- **Status Bar Integration:**  
  See `$(history) CHRONO: Active` in the bottom bar. One click opens your timeline.
- **Built-in Time Machine Scrubber (`Ctrl+Shift+T` / `Cmd+Shift+T`):**  
  Opens a visual scrubber panel beside your code. Drag the slider to travel back in time.
- **Instant Buffer Rollback:**  
  Click *"⏮ Rewind Editor to This State"* to restore your active file to that exact moment in `0.024ms`.
- **Speculative Experiments:**  
  Click *"🌱 Fork New Experiment"* to try crazy ideas in an isolated sandbox branch without dirtying your Git tree.

---

## 🚀 Quick Start / Installation

### Option 1: Load Directly in VS Code (Development Mode)
1. Open this folder in VS Code.
2. Press **`F5`** to launch the Extension Development Host.
3. Open any file and start typing — CHRONO is already recording!

### Option 2: Symlink or Copy to Extensions Directory
```bash
# Windows
mkdir "%USERPROFILE%\.vscode\extensions\chrono-vscode"
xcopy /E /I extensions\vscode "%USERPROFILE%\.vscode\extensions\chrono-vscode"

# macOS / Linux
ln -s "$(pwd)/extensions/vscode" ~/.vscode/extensions/chrono-vscode
```

Restart VS Code, and CHRONO will activate automatically whenever you open any project!

---

## ⌨️ Keybindings

| Shortcut | Action |
|:---|:---|
| <kbd>Ctrl+Shift+T</kbd> / <kbd>Cmd+Shift+T</kbd> | Open CHRONO Time Machine Scrubber |
| <kbd>Ctrl+Shift+Z</kbd> / <kbd>Cmd+Shift+Z</kbd> | Instant Rewind to previous recorded state |
