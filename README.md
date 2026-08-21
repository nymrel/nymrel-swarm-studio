# 🐝 Nymrel Swarm Studio

> **Visual Command Center & Action Surety Deck for Multi-Agent Coding Swarms**  
> *Built with Nymrel Warm Paper Aesthetics, Google A2UI v0.8 Streaming Primitives, Real-Time Fleet Topology, and Tamper-Proof Merkle SHA-256 Logs.*

[![License: MIT](https://img.shields.io/badge/License-MIT-A8541F.svg)](LICENSE)
[![A2UI Protocol](https://img.shields.io/badge/A2UI%20Protocol-v0.8.0-3B7A57.svg)](#google-a2ui-v08-streaming-primitives)
[![Dual Audience Verified](https://img.shields.io/badge/Entity-JalenBuilds%20LLC-2A332E.svg)](https://jalenbuilds.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](tsconfig.json)

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  NYMREL SWARM STUDIO  [A2UI v0.8]      Fleet: 5/5 Online   80% Local/Edge   Saved: $14.20│
├────────────────────────────────────────────────────────────────────────────────────────┤
│  SWARM FLEET ROSTER                    │  TOKEN PEAK-EFFICIENCY RADAR                  │
│  ┌────────────────┐ ┌────────────────┐ │  [====== Local GPU ======|== Edge ==| Frontier]│
│  │ Codex Sol      │ │ Claude Opus 5  │ │  Local RTX 4090: 584k tokens ($0.00)          │
│  │ GPT-5.6 Sol    │ │ Fable 5 Head   │ │  Edge Workers AI: 412k tokens ($0.20)         │
│  │ 46 t/s • Actv  │ │ 38 t/s • Synth │ │  Metered Frontier: 270k tokens ($4.05)        │
│  └────────────────┘ └────────────────┘ │  Saved vs Pure Frontier Baseline: $14.20      │
├────────────────────────────────────────┴───────────────────────────────────────────────┤
│  GOOGLE A2UI STREAMING CANVAS          │  ACTION SURETY SECURITY INTERCEPTOR (MERKLE)  │
│  ┌───────────────────────────────────┐ │  [ALLOW] Codex Sol -> src/kernel/bus.ts       │
│  │ DECISION BALLOT                   │ │    Leaf: 0x7f4a8b1... Block #14201 [VERIFIED] │
│  │ State Sync Protocol:              │ │  [BLOCK] Rogue Sandbox -> rm -rf /secrets     │
│  │  [■■■■■■□□] CRDT Clocks (60%)     │ │    Rule: RULE-SEC-00 Intercepted Destructive   │
│  │  [■■□□□□□□] Raft Consensus (20%)  │ │  [SANDBOX] Gemini 3.6 -> http://untrusted.dev │
│  │  [■■□□□□□□] Ephemeral SSE (20%)   │ │    Rule: RULE-NET-09 Routed to Wasm Proxy     │
│  │  [Vote: Cast Operator Vote]       │ │  ───────────────────────────────────────────  │
│  └───────────────────────────────────┘ │  CURRENT MERKLE ROOT: 0x9b41...e782 [SYNCED]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  WORKSPACE & WORKTREE INSPECTOR (Live AST Diffs & One-Click Rollback)                  │
│   src/surety/merkle_interceptor.rs   [MODIFIED]  +84 / -12   [Revert] [Inspect Diff]   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Show HN Overview

Modern multi-agent coding swarms (GPT-5.6 Codex Sol, Claude Opus 5, Gemini 3.6 Pro, and local 32B models on RTX 4090) generate hundreds of parallel edits, branch diffs, and background commands every minute. 

**Nymrel Swarm Studio** is a local-first, zero-telemetry visual command deck that gives human operators total situational awareness and cryptographic surety over autonomous coding fleets:

1. **Warm Paper Design System**: Replaces eye-straining neon dark mode with soft cream (`#FAF8F2`), linen (`#F4F0E6`), cedar green (`#2A332E`), terracotta (`#A8541F`), and stone borders (`#E2DDD2`).
2. **Google A2UI v0.8 Streaming Primitives**: Live Decision Ballots, Parameter Sliders, Interactive Approval Gates, and Diff Hunk Acceptors that render dynamically as swarms execute.
3. **Action Surety & Merkle Interceptor Ledger**: Every file write, shell command, or network request is checked against zero-trust policies and recorded into a cryptographically verifiable SHA-256 Merkle tree.
4. **Token Peak-Efficiency Economics**: Route high-volume tests to local GPU ($0) and edge gateways ($0.0005/k) while reserving metered frontier models ($0.015/k) for architecture.
5. **Workspace Tree & Instant Rollbacks**: Real-time multi-worktree AST diffs with one-click surgical rollback triggers.

---

## 🏗️ Architecture

```mermaid
graph TD
    A[Human Operator] -->|A2UI Ballots & Gates| B[Nymrel Swarm Studio Deck]
    
    subgraph Swarm Fleet
        C[Codex Sol - System Architect]
        D[Claude Opus 5 - UX Orchestrator]
        E[Gemini 3.6 Pro - Formal Advisory]
        F[Hermes 3 - RTX 4090 Local GPU]
        G[Cloudflare Sentinel - Edge Workers AI]
    end

    C <-->|gRPC / SSE Interconnect| B
    D <-->|gRPC / SSE Interconnect| B
    E <-->|gRPC / SSE Interconnect| B
    F <-->|Shared Memory IPC| B
    G <-->|HTTP/2 Wasm Pipe| B

    subgraph Surety Interceptor & Ledger
        H[Zero-Trust Policy Gate]
        I[Ephemeral Wasm Micro-Sandbox]
        J[Merkle Tree SHA-256 Receipts]
    end

    Swarm Fleet --> H
    H -->|Allowed| K[Workspace Worktrees]
    H -->|Blocked| J
    H -->|High Risk| I
    K --> J
```

---

## 🚀 Quickstart

### Prerequisites
- Node.js 20.0.0 or higher
- npm 9.0.0 or higher

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/nymrel/nymrel-swarm-studio.git
cd nymrel-swarm-studio

# Install dependencies
npm install

# Run unit test suite (100% green Node.js test runner)
npm test

# Start local visual command deck
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## ⚡ Component Deck Breakdown

| Component | Path | Description |
|---|---|---|
| **Header** | [`src/components/Header.tsx`](file:///C:/Users/johns/Desktop/nymrel-swarm-studio/src/components/Header.tsx) | Live fleet health pills, active Merkle root ticker, and chaos simulation trigger. |
| **SwarmRoster** | [`src/components/SwarmRoster.tsx`](file:///C:/Users/johns/Desktop/nymrel-swarm-studio/src/components/SwarmRoster.tsx) | Real-time agent status cards (t/s, memory, fencing generation, active task). |
| **A2UICanvas** | [`src/components/A2UICanvas.tsx`](file:///C:/Users/johns/Desktop/nymrel-swarm-studio/src/components/A2UICanvas.tsx) | Google A2UI v0.8 streaming feed (Decision Ballots, Parameter Sliders, Approval Gates, Diff Hunks). |
| **ActionSuretyLog** | [`src/components/ActionSuretyLog.tsx`](file:///C:/Users/johns/Desktop/nymrel-swarm-studio/src/components/ActionSuretyLog.tsx) | Security interceptor with SHA-256 leaf and root Merkle verification receipts. |
| **TokenEfficiencyRadar** | [`src/components/TokenEfficiencyRadar.tsx`](file:///C:/Users/johns/Desktop/nymrel-swarm-studio/src/components/TokenEfficiencyRadar.tsx) | Local GPU vs Edge vs Metered Frontier allocation & dollar savings calculator. |
| **WorkspaceInspector** | [`src/components/WorkspaceInspector.tsx`](file:///C:/Users/johns/Desktop/nymrel-swarm-studio/src/components/WorkspaceInspector.tsx) | Multi-worktree file inspector, syntax highlighted diffs, and surgical rollback buttons. |
| **TopologyView** | [`src/components/TopologyView.tsx`](file:///C:/Users/johns/Desktop/nymrel-swarm-studio/src/components/TopologyView.tsx) | Interactive interconnect bus matrix (gRPC, SSE, Shared Memory IPC, Wasm). |

---

## 🌐 Dual-Audience Rule & Machine Discoverability

Every product built across the Nymrel umbrella adheres to the **Dual-Audience Rule**:

- **For Human Visitors**: Visually stunning, fast, warm paper aesthetic with zero dark-mode forcing.
- **For Autonomous AI Agents**: Verifiable machine trust with schema.org JSON-LD entity graphs, `/llms.txt` discoverability endpoints, and cryptographic Merkle provenance.

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Nymrel Swarm Studio",
  "author": {
    "@type": "Organization",
    "name": "Nymrel",
    "parentOrganization": {
      "@type": "Organization",
      "name": "JalenBuilds LLC",
      "url": "https://jalenbuilds.com"
    }
  }
}
```

---

## 🧪 Test Suite

Run the built-in test suite:

```bash
npm test
```

Tests cover:
- **Merkle Calculation & Cryptography**: SHA-256 leaf hashing, odd/even Merkle root folding, hash chain integrity.
- **Security Interceptor**: Interception of destructive `rm -rf`, secret credential theft, unverified outbound networking.
- **A2UI Protocol**: Streaming Decision Ballots, vote aggregation, Approval Gate lifecycle, and Parameter Slider clamping.
- **Token Economics**: Multi-tier cost allocation and dollar savings formulas.

---

## 📄 License & Legal

Distributed under the **MIT License**. See [`LICENSE`](file:///C:/Users/johns/Desktop/nymrel-swarm-studio/LICENSE) for details.

Copyright (c) 2026 **Nymrel / JalenBuilds LLC**  
Contact: `contact@jalenbuilds.com` • [https://jalenbuilds.com](https://jalenbuilds.com)
