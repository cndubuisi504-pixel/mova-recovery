# Mova Recovery — upload from your phone

This folder is specially packaged so all upload files live at the top level. No folder uploads or terminal commands are needed on your phone. Netlify builds the website and generates its serverless API from these files.

## 1. Extract, don't just upload the ZIP

Download `mova-netlify-mobile.zip`. In your phone's Files app, tap it and select Extract. Open the extracted folder. You should see `package.json`, `index.html`, `netlify.toml`, `App.tsx`, and other individual files.

## 2. Put the individual files on GitHub

Create a repository called `mova-recovery` in your GitHub account. Choose Private and initialize it with a README so the Add file button is available.

In the repository, choose Add file > Upload files > Choose your files. Select ALL the individual files from the extracted folder, then commit the upload. You may need your browser's Desktop site setting to expose GitHub's upload controls. If the picker only allows one file at a time, add them in batches before committing or repeat uploads.

Do NOT upload only the ZIP: GitHub will store it, not unpack it.

At the top of your repository, you must see `package.json` and `netlify.toml` directly, not inside another folder. Keep all filenames unchanged. Do not upload any .env file or API credentials.

## 3. Connect Netlify

In Netlify choose Add new project (or Add new site) > Import an existing project > GitHub. Authorize access to the new repository, then select it.

Settings:
- Production branch: main (or the branch you uploaded to)
- Base directory: leave empty
- Build command: npm run build
- Publish directory: dist
- Functions directory: netlify/functions

The included netlify.toml sets the build/publish/functions configuration. No custom domain is needed to begin.

You can deploy immediately to inspect the page: this research version falls back to a public Mainnet RPC. For more dependable checking, add ETHEREUM_RPC_URL in Netlify's environment variables, with Functions runtime access, then redeploy. Store credentials there, NEVER in uploaded code.

WALLETCONNECT_PROJECT_ID is optional. Without it, public-address checks and installed MetaMask/Phantom wallets remain available, while WalletConnect reports that configuration is required. Configure your Netlify domain in WalletConnect's origin allowlist when enabling it.

Archive access is needed for the separate historical fork test, not simply to view the website or read a current position. The local-fork test harness is in the complete development project, not this mobile deployment bundle.

## 4. Check the deployed site

Wait for the deployment to succeed. Netlify will give you an HTTPS site URL. Open that URL in your phone's browser.

Verify:
1. The welcome page loads.
2. Opening /api/config on the same domain returns JSON with signingEnabled:false, not an HTML page.
3. A public Ethereum address can be checked.
4. Wrong input and service errors are displayed clearly.

If deployment fails, send the red error section of the deploy log with secrets hidden. Do not send account passwords or access tokens.

## What is and is not delivered

This is the read-only Mova checker, adapted to Netlify Functions. Mainnet withdrawal signing is deliberately absent. A detected position or passed simulation is not a completed recovery. Protocol review, fork-test execution and a controlled real recovery remain outstanding.

Actual deployment and Netlify's hosted routing/rate-limit behavior must be verified in your own account; nothing has been published there by the assistant.

The Netlify API has platform rate-limit configuration (20 requests per minute per IP/domain). Check plan support and enforcement in the deployed project before inviting broad traffic. Network errors and rate-limit failures are shown without raw provider errors.

## About these files

Frontend: App.tsx, main.tsx, Modal.tsx, api.ts, wallet.ts, styles.css, index.html.
Build: package.json, package-lock.json, tsconfig.json, prepare.mjs, netlify.toml.
Backend: recovery-function.txt is executable API source. The build copies it to netlify/functions/api.mjs. Do not edit transaction behavior without review.

Do not use Netlify's static drag-and-drop upload for this source bundle. Import the GitHub repository so the build and Functions deployment run.
