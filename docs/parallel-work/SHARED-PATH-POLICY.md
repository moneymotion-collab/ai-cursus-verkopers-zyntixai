# ZyntixAI Shared Path Coordination Policy

## 1. Shared by Default

The following areas are coordination-required:

- `README.md`
- `package.json`
- `package-lock.json`
- root configuration files
- CI/CD configuration
- build configuration
- lint configuration
- TypeScript configuration
- generated artifacts
- shared application types
- shared design system code
- global middleware
- global layout/shell files

This classification applies when such paths exist.

## 2. Explicit Release Requirement

A shared file can only be modified by the laptop after explicit release.

Required release record:

- exact path
- current owner
- temporary owner
- purpose
- start point SHA
- completion condition
- return-to-owner condition

## 3. No Simultaneous Editing

The same shared file must not be intentionally edited on both computers simultaneously.

## 4. Dependency Freeze

Laptop product/spec track must not modify:

- package manifest
- lockfile
- dependencies

unless explicitly coordinated.

## 5. Integration Checkpoint

Before integration:

- fetch remote state
- inspect divergence
- inspect changed paths
- compare ownership
- assess collisions
- only then choose merge strategy

No automatic merge or rebase is implied by this policy.

## 6. Conflict Rule

If a conflict touches Computer 1 protected technical work, the laptop must not auto-resolve it.

