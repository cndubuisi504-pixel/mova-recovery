# Controlled withdrawal implementation — evidence and boundaries

Date: 13 September 2026.

## Contract-path review

EtherDelta native ETH withdrawal targets only `0x8d12A197cB00D4747a1fe03395095ce2A5CC6819`. The reviewed source debits `tokens[0][msg.sender]`, performs an ETH call to `msg.sender`, throws if that call fails, and then emits Withdraw with token zero and the amount. The balance getter reads the token/account ledger. No new token approval, transfer via Mova, or arbitrary destination is used.

Source record: https://sourcify.dev/server/v2/contract/1/0x8d12A197cB00D4747a1fe03395095ce2A5CC6819?fields=all . Sourcify reports `match` for this older deployment, not `exact_match`; do not relabel that as exact compiler-metadata verification. Its recorded on-chain runtime matched the live runtime used by the app. The app pins SHA-256 `7d73bf3b09322a85e37a0a34ccb35458bc6ee38999394f7819ef80db524fb8aa`.

The native-ETH path and its immediate dependencies were inspected for the restricted standard-account use case. This is not an independent full-contract security audit. The first controlled pilot rejects contract/delegated sender accounts and does not enable ERC-20 methods.

## Actual local-fork execution: passed

Evidence: `research/etherdelta-fork-result.json`.

- Forked Ethereum block 25,966,464; local chain ID 31337.
- Loaded real deployed runtime and storage through an explicitly read-only upstream RPC wrapper.
- Locally funded a test account for gas and created a **synthetic local** 0.002 ETH deposit in the fork only.
- Simulated and executed a 0.001 ETH owner withdrawal locally with fixed calldata, sender, value, gas and gas price.
- Rejected an unrelated account's withdrawal and an excessive amount.
- Checked successful local receipt, expected Withdraw event, position debit and exact recipient ETH change after gas.
- The upstream wrapper refuses broadcast/signing methods. All sends went to in-process Ganache, which was disconnected after the test.

No Mainnet deposit or withdrawal occurred. This does not establish a real user's position or consent. The previous historical-fork test was blocked by archive access; this test uses a recent fork and a locally created fixture instead. It does not imply archive access has been fixed.

## Automated tests

61 deterministic engine/API tests passed: 18 discovery regressions (FETH capability expectations updated), 20 EtherDelta/shared withdrawal tests and 23 FETH withdrawal tests.

Coverage includes pilot allowlist, fixed amount/fee limits, zero transaction value, exact gas/nonce/calldata simulation, nonce/position changes, unsupported sender code, failed simulation, HMAC tampering, expired preparation, hash-only pending, unknown submission, replacement/nonce consumption, wallet-altered transaction, changed fee type, reverted receipts, missing event, confirmation threshold, reorg, monitoring after pilot disablement, and rejection of arbitrary transaction inputs.

Browser tests used explicit isolated mock-wallet and API fixtures only. They verified consent gating, exact payload passed to the external-wallet interface, local record before send, no success from hash alone, mobile refresh without resubmission, default-hidden amount ticket, 1080x1080 output matching canvas, wallet rejection, denied pilot wallet, closing during final verification, network change during final verification, FETH account changes during final verification, real same-origin second-tab Web Lock exclusion, FETH locked-only position behavior, FETH-to-ETH labels, persistence of the project identity, missing trace evidence blocking success/tickets, and no uncaught browser errors.

No fixture or fake wallet code is included in the production patch. No screenshots or tickets from fixture success were offered as real recovery evidence.

Live smoke test: both real read-only project checks completed on Mainnet. Both default pilot statuses were disabled and FETH preparation returned 403. Evidence is in `research/live-readonly-smoke.json`.

## Exact transaction and outcome rules

Preparation uses fresh chain state, fixed EtherDelta target, owner sender/destination, min(balance, 0.001 ETH), zero value, pending nonce, legacy gas price and an estimated gas limit with a bounded buffer. It independently checks gas affordability and caps maximum prepared fee. The same transaction fields are simulated, reviewed, re-simulated before signing and passed to eth_sendTransaction in the user's external wallet.

The plan is short-lived and HMAC-sealed. The integrity key is not an Ethereum signing key. The backend has no broadcast/signing operation.

Monitoring reopens the sealed record and re-reads chain state. It requires the transaction to match sender, recipient contract, calldata, value, nonce, gas, gas price, legacy type and chain; a successful canonical receipt; the expected native-ETH Withdraw event; the pinned contract runtime; and two confirmations. Reviewed source semantics tie successful execution and the event to the owner-directed ETH transfer. This is not an archive-based balance-delta proof on Mainnet. The exact EtherDelta balance-delta assertion was exercised in the local fork. FETH has stricter tracing requirements described below. Any mismatch stays unverified, without a ticket.

Two confirmations are not a claim of irreversible finality. While open, the tracker continues to refresh its view. Refresh never trusts a stored success label.

## Release gate

Actual wallet-extension interaction, WalletConnect session behavior on target devices, independent review, Netlify production routing after upload, and a real consenting-owner Mainnet recovery remain to be verified. General public withdrawals stay disabled. FETH now has a separately gated withdrawal pilot and needs the tracing-capable operator RPC integration verified before use. No Solana implementation is included.


## FETH owner withdrawal review

Proxy: `0x49128CF8ABE9071ee24540a296b5DED3F9D50443`.
Implementation: `0xCc446C3d1738A6e66D366446C37a942c5e750250`.

Both Sourcify source records report exact_match; both live runtimes matched their records and pinned hashes in the new fork test. Source records are at https://sourcify.dev/server/v2/contract/1/0x49128CF8ABE9071ee24540a296b5DED3F9D50443?fields=all and https://sourcify.dev/server/v2/contract/1/0xCc446C3d1738A6e66D366446C37a942c5e750250?fields=all .

The inspected source is the deployed contracts/FETH.sol together with LockedBalance, TimeLibrary and AddressUpgradeable.sendValue. Review covered withdrawFrom, its balance/authorization helpers, the direct ETH call, withdrawal event, balanceOf/totalBalanceOf, and lockup-expiry handling. This is not a full independent protocol audit.

The selected method is `withdrawFrom(owner, owner, amount)`, called by the owner through the proxy. The contract only deducts allowance when `from != msg.sender`; this selected owner path needs no approval. Mova intentionally does not expose the contract's alternate-recipient or delegated-withdrawal features.

The method frees expired escrow, checks/deducts the available balance, sends ETH to the owner using sendValue (reverting on payment failure), then emits `ETHWithdrawn(from, to, amount)`. The view balanceOf includes freed balances plus expired escrow; totalBalanceOf also includes unexpired locks. Expiry means strictly `expiry < block.timestamp`, not equality. No universal fixed unlock date is invented.

The pilot caps the exact withdrawal amount to min(available, 0.001 FETH), paid 1:1 in native ETH before gas. It does not use withdrawAvailableBalance because an uncapped full-balance method would not preserve the small-test amount or exact amount reviewed if balances changed.

## New FETH local-fork execution: passed

Evidence: `research/feth-fork-result.json` and `app/tests/feth-fork.mjs` in the workspace. The latest fork block/hash are recorded in that JSON. Local chain ID was 31337.

- Verified real deployed proxy, implementation slot and implementation runtime against the saved source records.
- Created a synthetic local 0.002 ETH/FETH available deposit and 0.003 FETH lockup. The authorized market was impersonated ONLY inside Ganache to create the synthetic lock fixture. No market privilege is part of Mova's app or backend.
- Simulated and executed the exact owner-only 0.001 FETH withdrawal locally, with fixed gas, gas price, nonce, zero value and calldata.
- Rejected a non-owner withdrawal, a withdrawal exceeding available funds despite sufficient total balance, and an unauthorized market operation.
- Verified total and available ledger debit, locked balance preservation, expected owner-directed ETHWithdrawn event and exact owner's ETH increase net of gas.
- Decoded actual Ganache opcode traces to assert the reviewed implementation received DELEGATECALL and a successful CALL paid the exact ETH amount to the owner.
- Checked that the lock remained unavailable at its exact expiry timestamp and became available one second later; simulated a withdrawal using the newly expired balance.

All transactions, funding, impersonation and time changes happened in-process locally. The upstream RPC wrapper has an explicit read-only allowlist and refuses broadcast/signing methods. Neither test is a Mainnet recovery.

## FETH execution tracing and boundaries

The backend requires Parity/OpenEthereum `trace_call` during preparation/final verification and `trace_transaction` for completion. It accepts only the expected successful root call → pinned implementation delegatecall → exact owner ETH payment, with no additional call branches. Receipt traces must match transaction and block hashes. Event, transaction field matching, canonical block, receipt-block and latest version pinning and two confirmations are also required. It rechecks canonicality after outcome verification.

This prevents a matching-looking event or a currently restored implementation slot from being treated alone as proof of the code used during execution. Unavailable/unknown/mismatched trace data fails closed. These checks still rely on the integrity of the operator's RPC and do not prevent a future proxy upgrade or make the protocol audited.

Tests validate the actual local opcode-level execution and exercise the production trace validator with isolated fixtures and a locally decoded parity-format representation. Ganache does not expose the production provider's parity trace API. The live public fallback refused a read-only trace probe; no usable live withdrawal tracing integration is claimed. An operator must supply and test an appropriate provider.

The new FETH-specific tests cover amount caps, locked-only rejection, independent review gating, exact owner calldata, no approvals, source/implementation changes, lost available balance, wrong chain/delegated senders, failed simulation, missing pre-sign traces, cross-project/recipient tampering, legacy EtherDelta record compatibility, event/trace mismatches, reverted receipts, confirmation threshold, monitoring after disablement and receipt/latest version reads.

Clean npm ci and production build passed without production dependency or lockfile changes. Temporary Ganache and Playwright test packages are not in the production ZIP. Only the existing Vite large-chunk advisory remains.
