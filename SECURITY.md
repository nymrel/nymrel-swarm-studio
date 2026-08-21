# Security Policy

## Reporting Security Vulnerabilities

If you discover a vulnerability in Nymrel Swarm Studio, please report it privately to our security team at `security@jalenbuilds.com` or `contact@jalenbuilds.com`. Please **do not** open public GitHub issues for undisclosed vulnerabilities.

## Threat Model & Surety Guarantees

Nymrel Swarm Studio operates as an in-process and edge interceptor layer between autonomous agent model workers and execution runtimes (filesystem, shell, network, databases):

1. **Destructive Command Interception (`RULE-SEC-00`)**:
   - Commands attempting root directory deletion (`rm -rf /`, `mkfs`, raw block device writes) are blocked unconditionally at the interceptor boundary before shell dispatch.
2. **Credential Vault Protection (`RULE-VAULT-01`)**:
   - Environment variables matching private keys, API secrets, AWS keys, or SSH credentials cannot be queried directly by subagent tool calls.
3. **Outbound Egress Sandboxing (`RULE-NET-09`)**:
   - Unverified egress endpoints are routed through an isolated ephemeral Wasm proxy to prevent prompt injection data exfiltration.
4. **Cryptographic Tamper-Proof Merkle Proofs**:
   - Every execution event emits a SHA-256 leaf hash linked to the global Merkle root for immutable post-incident auditability.

## Coordinated Disclosure

We strive to respond to all valid vulnerability submissions within 24 business hours and publish patched releases promptly.
