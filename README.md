# Isaac's portfolio — hosting instructions

This ZIP contains the editable Astro website, the 3D arm and images, a dependency lockfile, tests, and automatic GitHub Pages deployment. It does not contain CVs, account credentials, local logs, or the other portfolio in the original workspace. No API keys or paid hosting are needed.

## Publish on your existing GitHub Pages site

1. Unzip the package. Open `https://github.com/isaaac-afk/isaaac-afk.github.io` while signed in as Isaac. Download a backup of the existing repository first (Code → Download ZIP).
2. At the repository root, choose **Add file → Upload files**. Upload the extracted folders and files themselves, not the ZIP and not an extra enclosing folder. `package.json`, `src`, `public`, and `.github` must sit at the repository root. Commit to `main`.
3. Make sure `.github/workflows/deploy.yml` was uploaded. Some file pickers hide dot folders. If missing, use **Add file → Create new file**, enter `.github/workflows/deploy.yml`, and paste the contents of that file from the ZIP. Commit to `main`.
4. Open **Settings → Pages** and set **Source** to **GitHub Actions**. Keep the existing site's custom-domain field empty unless you intentionally use a custom domain.
5. Open **Actions → Deploy portfolio to GitHub Pages**. If no run starts, use **Run workflow** on `main`. Wait for both build and deploy to turn green.
6. Open **https://isaaac-afk.github.io/**. Check that the arm loads, scroll through the sections, and try the contact and project links.

The existing top-level HTML files can remain in the repository: this workflow publishes only Astro's generated `dist` folder. If another workflow also deploys Pages, disable that old workflow to avoid competing deployments. This replaces the currently hosted site after a successful deployment; it does not delete the old site's files or Git history.

## If you prefer a new repository

Create a public repository under your own account, upload the same files, and select GitHub Actions in Pages settings. The configuration automatically uses the actual GitHub repository name, including the special `isaaac-afk.github.io` repository (which publishes at the domain root). No asset paths need editing. Custom domains require a separate configuration change.

## Run or edit locally (optional)

Install Node.js 24. In the extracted folder run:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4324/`. Use `npm test` and `npm run build` to validate edits. To inspect the production build, run `npm run preview` after building. Do not open `index.astro` directly in a browser.

Main copy: `src/pages/index.astro` and `src/data/portfolio.ts`.
Styles: `src/styles/global.css`.
Arm and animation: `src/scripts/scene.ts`, `main.ts`, and supporting modules.

The six-axis manipulator is original conceptual portfolio artwork, separate from the documented four-axis ROS 2 project. The runtime GLB is included; the large editable Blender authoring files are not needed for hosting and are not in this ZIP.

Your public contact email is `isaacglenu@gmail.com`. Review your experience dates and project wording before publication. A local build passing does not confirm a GitHub deployment: the Actions run and public URL must also be checked.

Deployment follows the official Astro guide: https://docs.astro.build/en/guides/deploy/github/.
