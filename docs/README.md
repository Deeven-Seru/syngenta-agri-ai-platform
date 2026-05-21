# Docs Guide

Use the `docs/` directory for non-runtime material that would otherwise clutter the repository root.

## Layout

- `submissions/`: hackathon deliverables, exported PDFs, and presentation/source files.
- `release/`: release metadata and supporting notes.
- `superpowers/`: design specs, plans, and internal implementation notes.

## Rule of Thumb

If a file is not imported by the app, not executed by the build/deploy flow, and not required at the repo root by tooling, it should usually live under `docs/`.
