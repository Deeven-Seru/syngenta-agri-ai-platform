# Changelog

## [0.4.0](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/compare/backend-v0.3.0...backend-v0.4.0) (2026-05-16)


### 🐘 Backend Intelligence

* Activate System Views (Weather, Segments, Models) ([3f7fe2b](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/3f7fe2b3c9a345338116890131f83dbea9feeb78))
* Implement omnichannel RAG, Twilio IVR/WhatsApp, and Deck.gl 3D maps ([c2d6ab4](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/c2d6ab4e519dd3b2b2d00cb09d88ab39276d1ea3))
* Implement weather-triggered proactive campaigns (Issue [#13](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/issues/13)) ([3623d61](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/3623d61bebdd6a2ecb13327ed9d789b882693ca2))
* Omnichannel RAG, Twilio IVR, Deck.gl 3D Maps, and Performance/Security Hardening ([#22](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/issues/22)) ([4f51fe2](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/4f51fe250ba2f8746011f878b3de6476dd7a489c))


### 🦟 Bug Squashing

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

## [0.3.0](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/compare/backend-v0.2.0...backend-v0.3.0) (2026-05-16)


### 🐘 Backend Intelligence

* Add system diagnostic endpoint for platform monitoring ([dd1d55d](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/dd1d55d5f6c241ec447804d856656bf137b2f006))
* **frontend:** 🦒 implement fluid transitions for district detail cards ([0be7a04](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/0be7a04fcb6e2e3b9840bbad452b1a39430c1d86))
* **platform:** Finalize project documentation and architectural summary ([9ba06ee](https://github.com/Deeven-Seru/syngenta-agri-ai-platform/commit/9ba06ee73c1b4ba653834c8b8edaf9110ca22908))
