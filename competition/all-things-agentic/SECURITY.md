# Relay competition-slice security policy

Nymrel Relay is experimental competition software. It is not approved for customer data or production authority.

## Report privately

Send security reports to **contact@nymrel.com**. Do not include secrets, private prompts, customer records, service-account keys, access tokens, approval notes, or live exploit details in a public issue.

Useful reports include:

- a protected step executing without a resolved approval;
- duplicate delivery creating more than one effect or receipt;
- a stale worker overwriting a newer run revision;
- a lease being completed by the wrong worker;
- task input accepting credentials or secret-like fields;
- Pub/Sub messages exposing goals, input payloads, prompts, approvals, or secrets;
- Firestore writes that bypass revision checks;
- receipt tampering or unsupported claims verifying as valid;
- a worker handler performing network, filesystem, deployment, payment, publication, or account side effects that are not explicit and separately authorized;
- private or restricted data reaching logs, traces, demos, screenshots, or public artifacts.

## Security invariants

- Protected steps require a separate human approval record.
- The ADK agent has no approval-resolution tool.
- Pub/Sub carries identifiers and capability metadata only.
- Task input is strict JSON, limited to 8 KiB, and rejects secret-like keys.
- Workers must own a live lease to record a result.
- Results are idempotent by key.
- Store writes use optimistic revision checks.
- Retries and stale-lease recovery are bounded.
- Generic workers block unsupported and protected capabilities.
- Evidence receipts contain explicit non-certification claims.
- Credentials use Application Default Credentials or an approved secret manager and never enter Git.

## Google Cloud deployment boundary

Deploy the ADK service and worker to an isolated competition project. Keep the worker private and invoke it through an authenticated Pub/Sub push subscription or an equivalently reviewed Eventarc path. Use a dedicated service account with minimum Firestore, Pub/Sub, Cloud Run, logging, and tracing permissions.

Do not make the worker unauthenticated merely to simplify a demo. Do not use a broad owner/editor service account. Apply maximum-instance, timeout, and budget controls before external traffic.

## Data boundary

Only synthetic or public-safe fixtures are permitted until a separate privacy review. Prohibited data includes:

- customer or client data;
- family, health, financial-account, tax, identity, or employment records;
- private Studio Agent OS state or prompts;
- credentials, cookies, tokens, keys, card data, recovery codes, or wallet secrets;
- login-protected, paywalled, personal, or restricted third-party data.

## Claim boundary

Passing tests, receipts, traces, or a successful deployment do not establish security certification, agent identity, legal compliance, production admission, or correctness of an external system. Claims must remain limited to the behavior directly observed by the recorded version and configuration.
