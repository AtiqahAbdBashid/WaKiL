# WaKiL

! Read this before touching any production code (`main` branch)

This guide is for using Git in **VS Code's** (Source Control panel).

## 1. Get the project onto your computer (Clone)

1. Open VS Code.
2. Press `Ctrl+Shift+P` to open the Command Palette, type **Git: Clone**, and select it.
   - Or: open the Source Control panel (`Ctrl+Shift+G`) and click **Clone Repository**.
3. Paste this repository URL when asked:
   ```
   https://gitlab.gamuda.app/gaia-kl-c7-technity/wakil.git
   ```
4. Choose a folder on your computer to save the project into (e.g. `Desktop/WaKiL`).
5. When cloning finishes, click **Open** to open the project folder in VS Code.

## 2. Create a branch for your work

! Never work directly on `main`. Always create your own branch first. !

1. Look at the bottom-left corner of VS Code — it shows the current branch name (e.g. `main`).
2. Click it. A menu opens at the top with a list of branches.
3. Select **Create new branch...**
4. Make sure you're branching off the latest `main` (pull first if unsure).
5. Name your branch based on what you're doing, e.g.:
   - `feature/login-page`
   - `fix/navbar-bug`
   - `chore/update-readme`
6. Press Enter. VS Code automatically switches you onto this new branch (shown at the bottom-left).

## 3. Make your changes

Edit files as normal. VS Code marks changed files with a colored letter (`M` = modified, `U` = untracked/new) in the file explorer and in the Source Control panel.

## 4. Save your changes (Commit)

1. Open the Source Control panel (`Ctrl+Shift+G`).
2. Under **Changes**, review the files you edited.
3. Hover over a file and click the **+** icon to stage it (or click **+** next to "Changes" to stage everything).
4. Type a short, clear commit message in the text box at the top, e.g. `Add login button to homepage`.
5. Click the **Commit** (checkmark ✓) button.

You can commit multiple times as you work — small, frequent commits are better than one giant commit.

## 5. Upload your branch (Push)

1. In the Source Control panel, click **Sync Changes** (or **Push**, shown as an up-arrow icon / cloud icon at the bottom).
2. The first time you push a new branch, VS Code may show a prompt asking to publish the branch — click **Publish Branch** / **OK**. This uploads your branch and commits to GitLab.

## 6. Open a Merge Request (MR) to combine your work into `main`

! `main` is protected — direct pushes to it are blocked. The **only** way to get code into `main` is by opening a Merge Request and getting it approved/merged. !

1. After pushing, VS Code may show a notification with a link to create a merge request — you can click that.
2. Otherwise, go to the project on GitLab: https://gitlab.gamuda.app/gaia-kl-c7-technity/wakil
3. GitLab usually shows a banner "Create merge request" for your recently pushed branch — click it. Otherwise, go to **Merge Requests > New merge request**.
4. Set:
   - **Source branch**: your branch (e.g. `feature/login-page`)
   - **Target branch**: `main`
5. Add a title and description explaining your change.
6. Click **Create merge request**.
7. Ask a teammate to review it. Once approved, it can be merged into `main`.

## 7. Keep your branch up to date

If `main` has changed while you were working, update your branch before pushing:

1. Click the branch name at the bottom-left and switch to `main`.
2. Click **Sync Changes** (or the `...` menu in Source Control > **Pull**) to get the latest changes.
3. Switch back to your branch (bottom-left branch menu).
4. Open the `...` menu in the Source Control panel > **Branch** > **Merge Branch...** and select `main` to bring those updates into your branch.
5. If VS Code highlights conflicts (marked in files with `<<<<<<<` markers), resolve them using VS Code's conflict editor (it shows "Accept Current", "Accept Incoming", "Accept Both" buttons above each conflict), then stage, commit, and push again.

## Quick summary

| Step | Action | Where in VS Code |
|------|--------|-------------------|
| 1 | Clone the repo | `Ctrl+Shift+P` > Git: Clone |
| 2 | Create a new branch from `main` | Bottom-left branch name > Create new branch |
| 3 | Make changes | Editor |
| 4 | Commit changes with a clear message | Source Control panel (`Ctrl+Shift+G`) |
| 5 | Push your branch | Sync Changes / Push button |
| 6 | Open a Merge Request into `main` | GitLab website |
| 7 | Wait for review/approval, then merge | GitLab website |

**Golden rule:** never commit or push directly to `main`. Always work on your own branch and merge via a Merge Request.
