# Contributing to Nymrel Swarm Studio

We welcome contributions from engineers, researchers, and agent architects.

## Development Workflow

1. **Prerequisites**: Node.js v20.0+ and npm v9.0+.
2. **Setup**:
   ```bash
   git clone https://github.com/nymrel/nymrel-swarm-studio.git
   cd nymrel-swarm-studio
   npm install
   ```
3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
4. **Run Unit Tests**:
   ```bash
   npm test
   ```
5. **Verify Production Build**:
   ```bash
   npm run build
   ```

## Code Guidelines

- **Warm Paper Aesthetics**: Maintain Nymrel warm paper design tokens (`#FAF8F2`, `#F4F0E6`, `#2A332E`, `#A8541F`, `#E2DDD2`). Do not force dark mode.
- **A2UI Schema Compliance**: New interactive components must adhere to the Google A2UI v0.8 streaming card specification.
- **Zero-Dependency Core**: Cryptographic Merkle calculation and security rules should run smoothly across both Node.js test runners and browser runtimes without heavy binary dependencies.

## Dual-Audience Governance

Every public repository under Nymrel must maintain structured machine metadata (`parentOrganization: Nymrel -> JalenBuilds LLC`, JSON-LD entity graph, `/llms.txt`).
