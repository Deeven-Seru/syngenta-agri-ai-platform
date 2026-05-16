# Changelog

## [0.3.0](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/compare/platform-v0.2.0...platform-v0.3.0) (2026-05-16)


### 🚜 Platform Growth

* Activate System Views (Weather, Segments, Models) ([3f7fe2b](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/3f7fe2b3c9a345338116890131f83dbea9feeb78))
* Activate Weather Live, Grower Segments, and Model Scopes views ([a999529](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/a999529e5ffae8556f8efe4da4ce7059e0cd9cb0))
* Implement omnichannel RAG, Twilio IVR/WhatsApp, and Deck.gl 3D maps ([c2d6ab4](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/c2d6ab4e519dd3b2b2d00cb09d88ab39276d1ea3))
* Implement weather-triggered proactive campaigns (Issue [#13](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/issues/13)) ([3623d61](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/3623d61bebdd6a2ecb13327ed9d789b882693ca2))
* Omnichannel RAG, Twilio IVR, Deck.gl 3D Maps, and Performance/Security Hardening ([#22](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/issues/22)) ([4f51fe2](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/4f51fe250ba2f8746011f878b3de6476dd7a489c))


### 🩹 Patching

* Address gemini-code-assist review (BackgroundTasks, concurrency control, top-level imports) ([08d429e](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/08d429e5ef4aa54c96e406ee6cacc8daa84ba0d2))
* Address PR [#24](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/issues/24) review comments (lookback logic, campaign metadata, and cleanups) ([2d7696e](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/2d7696e914074ad51f4d532df5add22ee59b7b86))
* Address PR [#24](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/issues/24) round 2 review comments (batch history inserts and scalable grower targeting) ([d6be28f](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/d6be28fc1cee5c4508ad8585e8104a469dc23f78))
* Address PR [#24](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/issues/24) round 3 review comments (clean architecture, concurrency, and AI scoring) ([e414a18](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/e414a18851643b58f131fa430cb65ae99a8ab224))
* Address PR [#24](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/issues/24) round 4 review comments (memory scalability, status consistency, and ID collision hardening) ([da64e08](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/da64e083cbe367d9d087ca7fb12a9ceccb492b8d))
* Address round 2 review comments (robust webhooks, rate limiting, and cursor iteration) ([94010ac](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/94010ac895658ccfa320391a88e4fd12a1f02efc))
* Address round 3 review comments (scalability, efficiency, and safety) ([3e205ce](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/3e205cec04931ad001013fbcea9d8bde5993645c))
* Address round 4 review comments (N+1 in dispatch and blocking Groq call) ([0763ed1](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/0763ed13ccc2206521a947371dd76ffb43c8c318))
* Address round 5 review comments (personalized dispatch, secure webhooks, and OOM fixes) ([dd0cb05](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/dd0cb05acc0bf119f33cf02af08411937cb20a53))
* Address round 6 review comments (sorting, robust dict validation, and AsyncGroq) ([2207292](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/22072923132d5380114c74ff6c08dc5522cbe7df))
* Resolve critical bugs, security risks, and performance bottlenecks from review ([7189c8e](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/7189c8efcd4e2f6687f1ddbfcde312a348b6e616))
* Resolve N+1 queries, blocking calls, and language/security issues from review ([1cc38a1](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/1cc38a1de8a6daeeb29e8413db5ee38136d616f6))


### 🧱 Infrastructure

* Ignore .worktrees/ directory ([09ba123](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/09ba123f56a9356af5c5572d2a876651b18a82e0))


### 🍃 Knowledge Base

* Add Datadog observability design spec ([306f760](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/306f7601fd0a00b045b20646b603879d735da343))
* Update README with strategic pitch, technical guide, and observability ([ee6bee7](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/ee6bee7abb1771b892960365b6c11d14b9affc65))

## [0.2.0](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/compare/platform-v0.1.0...platform-v0.2.0) (2026-05-16)


### 🚜 Platform Growth

* Add system diagnostic endpoint for platform monitoring ([dd1d55d](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/dd1d55d5f6c241ec447804d856656bf137b2f006))
* **docs:** Initialize project readme and core architectural overview ([ce4de87](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/ce4de87ef2c3edb4103feb19e5b32c9834b92e08))
* **frontend:** 🦒 implement fluid transitions for district detail cards ([0be7a04](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/0be7a04fcb6e2e3b9840bbad452b1a39430c1d86))
* Integrate Carto-styled geospatial market intelligence map ([c5cbe10](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/c5cbe10d7e34cf9fe67431e635f186a00b4efbf2))
* **platform:** Enhance documentation and strategic roadmap ([#17](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/issues/17)) ([854ed1e](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/854ed1e01b1874d16ed094e3f1a548254ba009be))
* **platform:** Finalize project documentation and architectural summary ([9ba06ee](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/9ba06ee73c1b4ba653834c8b8edaf9110ca22908))
* **release:** Implement monorepo-style grouped changelog for frontend and backend ([6d0e179](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/6d0e179aca653c7d4ca6f3eaabd12ee291280a0f))


### 🧱 Infrastructure

* Bootstrap release-please for the first time ([d8ec6d7](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/d8ec6d7d98dc6acef68613537dae24beffe20c82))
* Enable manual workflow dispatch for release-please ([36a04ba](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/36a04ba01fd73315b1236bd0be65ac547df1a3aa))
* Fix release-please config to support monorepo structure ([22b3ecf](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/22b3ecfc23d3f17e36c41bb223b4a23021993bc6))
* Integrate release-please for automated versioning and changelogs ([e5bab41](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/e5bab4143f5e9aaf78c5b82c5698fe97b6734964))
* **release:** Include root platform changes in release tracking ([adbf7b8](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/adbf7b8fe3aaefcfc4c1bc1e5cd37f3f34a0add5))
* **release:** Move config to .github folder to trigger legacy app ([ac2d340](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/ac2d340b8937c5f10438d82d7b9b3d7f6467d0bb))
* **release:** Spice up changelog headers with animal emojis ([6ce7805](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/6ce78059c071021718a8a4a60234d4c2103746d8))
* Remove release-please action in favor of the official GitHub App ([6bdc4a9](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/6bdc4a924db0d2c5e04027d23524dea349cbffc6))
* Resolve release-please manifest conflict ([1cf0dc2](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/1cf0dc2105ab2e71695e566ccb746d307da793fd))
* Restore working release-please action ([6ccacdd](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/6ccacdd05f0b200f00257a4b2d88ff7acb138763))
