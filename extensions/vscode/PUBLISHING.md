# How to Publish CHRONO to the VS Code Marketplace 🏪

Follow these simple steps to make CHRONO available to millions of developers on the official Visual Studio Marketplace.

---

### Step 1: Create a Free Publisher Account (Takes 2 minutes)

1. Open the [VS Code Marketplace Management Portal](https://marketplace.visualstudio.com/manage).
2. Sign in with your **GitHub** or **Microsoft** account.
3. Click **"Create publisher"**.
4. Enter:
   - **Name**: Your display name (e.g. `Deepak Jadhav` or `Chrono Team`)
   - **ID**: A unique lowercase identifier (e.g. `deepxkjadhav` or `chrono-labs`)
5. Click **Create**.

---

### Step 2: Match Your Publisher ID in `package.json`

Open `extensions/vscode/package.json` and change the `"publisher"` field to your exact Publisher ID:

```json
{
  "name": "chrono-vscode",
  "displayName": "CHRONO — Time Machine for Code",
  "publisher": "YOUR_PUBLISHER_ID_HERE",
  ...
}
```

---

### Step 3: Package the Extension into a `.vsix` File

Open your terminal in the project directory and run:

```powershell
cd extensions/vscode
npx @vscode/vsce package --no-dependencies
```

This will bundle everything into a single file:  
📦 **`chrono-vscode-1.0.0.vsix`**

*(You can test this locally anytime in VS Code by pressing `Ctrl+Shift+P` ➔ "Extensions: Install from VSIX..." and picking this file!)*

---

### Step 4: Upload to the Marketplace (Two Ways)

#### Method A: Direct Web Upload (Easiest — Recommended!)
1. Go back to [https://marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage).
2. Click the **"New Extension"** button at the top right.
3. Select **"Visual Studio Code"**.
4. Drag and drop your **`chrono-vscode-1.0.0.vsix`** file.
5. Microsoft will verify the package (takes ~3 to 5 minutes). Once verified, it is **LIVE**! Anyone in the world can install it directly from inside VS Code by searching *"CHRONO"*.

---

#### Method B: Publish from Terminal CLI
If you want to publish directly from the command line:
1. Create a Personal Access Token (PAT) at [dev.azure.com](https://dev.azure.com):
   - Scope: **Marketplace (Manage)**
2. In terminal, run:
   ```bash
   npx @vscode/vsce publish -p <YOUR_PERSONAL_ACCESS_TOKEN>
   ```

---

### Step 5: Updating Your Extension Later
Whenever you add features or improvements:
1. Bump the version in `package.json` (e.g., `"version": "1.0.1"`).
2. Run `npx @vscode/vsce package --no-dependencies`.
3. Upload the new `.vsix` on the portal (or run `vsce publish`).
VS Code will automatically update it for all users!
