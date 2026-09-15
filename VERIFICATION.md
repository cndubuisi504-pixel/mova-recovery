# Website update verification

Packaged 15 September 2026. This is a four-project **checks** release.

- Fresh `npm ci` completed in this session.
- Fresh production build passed in this session.
- **91 backend tests passed in this session.**
- **19 browser groups passed at the prior build checkpoint** (12 existing ED/FETH regression groups, seven new read-only/mobile groups). They were not rerun in this packaging session. Website source was carried forward from that checkpoint.
- Live specialized reads for the supplied address completed across all four projects in this session. No position was found within those adapter scopes.
- No owner transaction, private key, signing permission or Mainnet recovery was used.

The earlier unmatched Silicon source blocker was resolved: an independent solc 0.8.20 build from upstream commit `d70266b8742672d59d4060019538d03fe0aac181`, optimizer 999 / Shanghai, exactly matched the deployed L2 runtime including metadata. The full runtime SHA-256 is `10a26c2e9fcc6f4fb003cc1b7b903a30d8ca3d158524c4e5786962c3961a9875`.

Prior actual-code fork tests passed for Stader's queued POL withdrawal path and Silicon's native-ETH exit/claim path. Stader used synthetic shares and modeled epochs. Silicon used local ETH and injected root registration. These are local tests, not real recoveries, audits or production execution approval. Silicon token exits were not covered by its native-ETH fork test.

## Execution remains unavailable for the new projects

Still required for full Stader/Silicon Mova withdrawals:

1. Reviewed production transaction preparation, exact simulation/output evidence and owner-bound wallet submission.
2. Persistent multi-stage tracking, reload/resume, proof readiness and explicit finalization.
3. Reversion/replacement/timeout handling without automatic duplicate submissions.
4. Final receipt and actual asset-delivery verification before any recovery ticket.
5. Controlled consenting-owner review/testing before broader execution availability.

The existing ED/FETH withdrawal backend, wallet module, withdrawal UI, recovery ticket and transaction types are included unchanged. The new projects are not added to that backend's execution allowlist. Existing operator flags, approved-wallet restrictions, trace requirements and secret configuration are retained. Do not enable or weaken old gates just to make a new project executable.

Optional backend-only service settings:

- `SILICON_RPC_URL`: HTTPS Silicon chain-2355 RPC. Defaults to the documented secondary RPC.
- `SILICON_BRIDGE_API_URL`: HTTPS base URL for Silicon's exit service. Defaults to the official service.
- `ETHEREUM_RPC_URL`: existing Ethereum backend RPC setting, unchanged.

No new dependency or hosting migration is required. Service availability and index coverage are not guaranteed. A Vite chunk-size warning remains; it does not prevent the build.

Research fixtures and wallet-specific reports are deliberately excluded from the website ZIP.
