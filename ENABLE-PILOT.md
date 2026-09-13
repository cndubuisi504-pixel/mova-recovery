# Mova: one combined update

This update contains address-first discovery AND restricted owner-withdrawal flows for EtherDelta and Foundation FETH. It replaces the earlier discovery and EtherDelta-only pilot ZIPs. Upload this release once; do not deploy the earlier ZIPs first.

## Upload from your phone

1. Download `mova-two-project-recovery-update.zip` and extract it in your phone's Files app.
2. Open https://github.com/cndubuisi504-pixel/mova-recovery in your browser and sign in. Stay on the `main` branch at the repository's top level.
3. Choose **Add file → Upload files**. If the mobile view hides that menu, enable **Desktop site** in the browser menu.
4. Select the **11 code files** listed below from the extracted folder. These replace existing matching names and add four new modules. The two Markdown guides in the ZIP do not need uploading.
5. Commit directly to `main` in one commit, such as “Add controlled EtherDelta and FETH recovery”. If direct commits are restricted, use a branch and merge its pull request once all files are present.
6. In Netlify, check that the deployment for that commit succeeds. Existing settings should be **build command: `npm run build`**, **publish directory: `dist`**, and **base directory: empty**. `prepare.mjs` generates the backend function during the build; you do not manually upload a generated function.

Upload these **11 individual code files** together:

- App.tsx
- styles.css
- api.ts
- Projects.tsx
- recovery-function.txt
- wallet.ts
- prepare.mjs
- withdrawal-backend.txt (new)
- withdrawal.ts (new)
- WithdrawalFlow.tsx (new)
- RecoveryTicket.tsx (new)

Keep the names unchanged. Do not upload just the ZIP. Keep your existing index.html, main.tsx, Modal.tsx, package.json, package-lock.json, tsconfig.json and netlify.toml. No production dependency changes are required.

Wait for Netlify to finish building. Open the normal site URL (for example https://mova-co.netlify.app), not an old immutable deployment URL. Test an address and confirm that EtherDelta and Foundation FETH both appear.

## What works before enabling the pilot

- EtherDelta native ETH discovery and read-only simulation.
- Foundation FETH available/locked discovery and read-only available-balance withdrawal simulation.
- No unrestricted Mainnet signing.

The pilot is disabled by default. Uploading these files alone does not authorize withdrawals.

## Before enabling real transactions

A qualified reviewer/operator should review the deployed source, withdrawal implementation, limits and test evidence. The shipped code is not claimed to have an independent security audit. Do not flip the review flag just to remove a warning.

Find one consenting owner with an existing EtherDelta native ETH position or available Foundation FETH, using a standard Ethereum account. Review that specific project and position. Smart-contract/delegated accounts, arbitrary ERC-20 methods and locked FETH withdrawals are excluded from the pilot. Do not deposit into an abandoned Mainnet project to create a test.

Both local-fork tests passed with synthetic positions created ONLY in local copies of Ethereum. FETH testing also created a local lockup, checked owner authorization and verified an exact ETH payment after gas. That is useful contract-path evidence, not a real recovery or proof that anyone controls a funded Mainnet position.

## Netlify environment settings

When those prerequisites are satisfied, add these variables in the Netlify dashboard with **Functions runtime scope**, then redeploy:

| Variable | Value |
|---|---|
| ETHEREUM_RPC_URL | Your operator-configured HTTPS Ethereum Mainnet RPC endpoint. A blank/public fallback does not enable the pilot. |
| RECOVERY_RECORD_SECRET | A new, random secret of at least 32 characters; use a password manager to generate and retain it privately. |
| RECOVERY_PILOT_WALLETS | The consenting tester's public Ethereum address. Use one owner for the first test; comma-separated addresses are supported. This is a shared pilot allowlist, so review the intended project/position before enabling its gate. |
| RECOVERY_REVIEW_APPROVED | `true`, only after the required review. |
| RECOVERY_PILOT_ENABLED | `true`, only when ready for the controlled test. |
| RECOVERY_FETH_REVIEW_APPROVED | For FETH only: `true` after the FETH-specific review and RPC tracing checks. Missing/false keeps FETH signing disabled even if EtherDelta is enabled. |

WALLETCONNECT_PROJECT_ID remains optional. Configure its allowed origin if used. MetaMask and Phantom EVM discovery are already included.

**RECOVERY_RECORD_SECRET is NOT a wallet private key or seed phrase.** It authenticates server-created tracking records so a browser cannot invent a successful Mova recovery record. It cannot sign Ethereum transactions or move funds. Never reuse wallet credentials here. Do not put any secret in GitHub or send it in chat.

Preserve this integrity secret across deployments: rotating/removing it prevents old tracking records from being authenticated. Pause new withdrawals using RECOVERY_PILOT_ENABLED=false instead; existing record verification continues while the secret remains configured. A pause cannot cancel a request already handed to a wallet or broadcast to Ethereum.

## FETH RPC requirement — do not skip

FETH is an upgradeable proxy. Reading its current implementation after a transaction is not enough to prove which code actually executed.

For FETH, the configured HTTPS Mainnet RPC must support:

- Standard Ethereum reads, eth_call and gas estimation.
- `trace_call` with the Parity/OpenEthereum trace format, including the root call, delegatecall and ETH payment. Mova requires this exact-request trace during preparation and again immediately before wallet approval.
- `trace_transaction` with transaction/block identity fields and the same call-trace format, for receipt verification.
- Historical code/storage reads at the transaction's receipt block, plus latest state. Retaining older tracking may require archive access.

Do not assume a provider supports these methods just because balance discovery works. Our public fallback trace-read probe was refused; it is not validated for the FETH pilot. The Ganache fork supplies opcode traces, which were decoded locally for test evidence; it is not a live provider trace API integration test.

If pre-sign tracing is unavailable or mismatched, Mova refuses to prepare/verify a signing request. If receipt tracing is unavailable after submission, the transaction may still have succeeded, but Mova leaves it unverified with no ticket and no automatic resubmission. Configure and test the operator's intended RPC before involving the owner.

An upgrade can still happen after simulation. Mova does not control the proxy administrator and cannot guarantee execution or protocol safety. Completion checks require the expected implementation actually executed, an exact ETH payment to the owner, the expected event, current/receipt-block version checks and canonical confirmations.

## First controlled recovery

1. Connect the approved owner's wallet on Ethereum Mainnet.
2. Scan and open the EtherDelta or Foundation FETH position. For FETH, inspect Available separately from Locked. A locked-only position has no withdrawal action.
3. Review the position and run the read-only simulation.
4. Choose Review controlled withdrawal, then Prepare exact withdrawal.
5. Review amount, destination and gas costs. The pilot takes the smaller of the available position or **0.001 ETH equivalent**; it does not withdraw the whole position when larger. For FETH, this redeems at most 0.001 available FETH for the same amount of native ETH. No token approval is requested, and locked funds are untouched.
6. Read and tick the acknowledgement. Click Recover funds only if the owner wants to proceed.
7. Mova rechecks the account, chain, pending nonce, balance, contract version and exact transaction simulation. The external wallet then requests approval.
8. Do not edit transaction fields in the wallet. Gas/fee/type changes are flagged as mismatches rather than silently accepted.
9. The tracker waits for the matching transaction, successful receipt, canonical block, project-specific withdrawal event, pinned contract version (and actual implementation/payment traces for FETH) and at least **two confirmations** before showing completion.
10. A genuine verified result can generate a 1080x1080 PNG ticket. Amount is hidden by default; on-chain amounts remain public.

The pilot also caps maximum fee at the prepared settings to 0.001 ETH and gas limit to 300,000. Actual gas cost can still be meaningful relative to a tiny withdrawal. A reverted transaction can charge gas. USD estimates are not supplied.

## Refresh, cancellation and troubleshooting

- A public transaction record is saved locally BEFORE the wallet submission request. Refresh never submits automatically.
- A Web Locks guard coordinates submission between tabs. A browser without the required storage/locking facilities cannot use the pilot.
- Wallet rejection is shown as cancellation, not contract failure.
- If the wallet returns an ambiguous error or the page closes before a hash is saved, the record remains unresolved. Check wallet history and attach the hash if available. Do not submit again blindly.
- Delayed, dropped or replaced transactions are not called successful. A changed replacement must be inspected separately; it does not silently inherit the original simulation.
- Removing local tracking DOES NOT cancel a transaction. Do so only after checking the wallet and ensuring the record is resolved. It is an explicit user action, never automatic retry.
- A successful transaction hash is not enough. A receipt/event mismatch does not produce a recovery ticket.
- Monitoring works without reconnecting the wallet because transaction data is public. The app rechecks stored records against the backend and chain before showing success.

## Limits of this release

Implemented and locally tested: controlled EtherDelta native ETH and FETH-to-ETH flows, exact-request simulation, receipt verification, persistence, safe failure states and ticket export.

Not completed: independent security review, real-wallet-extension end-to-end testing on the owner's devices, a consenting-owner Mainnet recovery, the configured live tracing-provider integration, broad public withdrawal enablement and Solana support.

Do not present the local-fork test, browser test fixtures, or an unrelated historical withdrawal as a real Mova Mainnet recovery.


## Netlify credits: avoid wasting the next deployment

Keep your existing account for now; no account migration has been performed. Upload the 11 files in one commit rather than publishing each file separately. For future changes, use a non-production branch/Deploy Preview, test the complete update, then merge once to main. Preview deployments themselves do not incur production-deploy credits, but preview requests, bandwidth and compute can still consume usage.

Current credit-plan documentation lists 15 credits per successful production deployment; check your actual plan and account usage before changing hosts. Documentation: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/

Send a screenshot of the plan name, usage breakdown, remaining credits and reset date, with billing details/secrets hidden. We have not inspected your account and cannot yet identify its main consumption category. A migration must preserve the backend, record integrity secret and pending tracking continuity, not just copy the static page.

If tracking records exist, keep the same public origin where possible: local browser tracking belongs to an origin and does not automatically follow a new hostname/account. Do not migrate while a tester has an unresolved wallet request without a deliberate continuity plan.
