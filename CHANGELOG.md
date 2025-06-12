# Changelog

All notable changes to the "Stone.js Core" extension will be documented in this file.

## Unreleased


## [0.1.0](https://github.com/stone-foundation/stone-js-core/compare/v0.0.4...v0.1.0) (2025-06-04)


### Features

* major internal restructuring and cleanup ([#10](https://github.com/stone-foundation/stone-js-core/issues/10)) ([eb49057](https://github.com/stone-foundation/stone-js-core/commit/eb4905700b68d877c83920dea41d27fb1c7f6b98))
* This Version introduces a comprehensive internal refactoring of the Stone.js core module to improve maintainability, developer experience, and project readiness for future releases.

#### Highlights

* **Documentation Overhaul**

  * Updated `StoneFactory`, `Kernel`, and related modules to match the latest internal API.
  * Removed outdated references and improved clarity for new contributors.

* **License and Legal**

  * Switched project license from **Apache 2.0** to **MIT**.
  * Updated `README.md` to reflect the new licensing and project scope.

* **CI & DevOps Improvements**

  * Integrated **Codecov** for test coverage reporting.
  * Added **Dependabot** configuration for automated dependency updates.

* **Blueprint Utilities**

  * Introduced new utility functions to streamline blueprint definition and validation.

* **Testing Enhancements**

  * Achieved 100% unit test coverage on core adapters and blueprint modules.
  * Improved test organization and consistency across the project.

* **Imperative API Polishing**

  * Refined the imperative API for better developer ergonomics and internal coherence.

This restructuring lays the groundwork for the upcoming beta phase and prepares the core for long-term stability.

## [0.0.4](https://github.com/stone-foundation/stone-js-core/compare/v0.0.36...v0.0.4) (2025-01-21)


### Features

* implement response resolver for kernel ([7b609ec](https://github.com/stone-foundation/stone-js-core/commit/7b609ec8ba784ecdcf8353e8626cb5efb0b144ab))

## [0.0.36](https://github.com/stone-foundation/stone-js-core/compare/v0.0.35...v0.0.36) (2025-01-06)


### Features

* improve lifecycle hooks, implement error handler mechanism and legacy decorator compatibility ([8375902](https://github.com/stone-foundation/stone-js-core/commit/83759020101bdf94fc7c7a0d8609e63689d57c0f))


### Bug Fixes

* fix typing issues and update dependencies ([d28941a](https://github.com/stone-foundation/stone-js-core/commit/d28941aea6c8a2d26eb8cc9621f78faa8122d968))

## [0.0.35](https://github.com/stone-foundation/stone-js-core/compare/v0.0.34...v0.0.35) (2024-12-07)


### Miscellaneous Chores

* fix issues in errorHandler and allow onTerminate hook to finish gracefully ([bd81faa](https://github.com/stone-foundation/stone-js-core/commit/bd81faa568439cf30eb0c939171bd081c0b50861))

## [0.0.34](https://github.com/stone-foundation/stone-js-core/compare/v0.0.33...v0.0.34) (2024-12-05)


### Miscellaneous Chores

* move ErrorHandler config from global config to adapter config ([775bef5](https://github.com/stone-foundation/stone-js-core/commit/775bef589e4302e7bceb11d58608ca782f3078c7))

## [0.0.33](https://github.com/stone-foundation/stone-js-core/compare/v0.0.32...v0.0.33) (2024-12-01)


### Miscellaneous Chores

* rename  AdapterBuilder to AdapterEventBuilder ([59c27bd](https://github.com/stone-foundation/stone-js-core/commit/59c27bdae04e7adc72d7c3e25cee704d5e04ce0c))

## [0.0.32](https://github.com/stone-foundation/stone-js-core/compare/v0.0.31...v0.0.32) (2024-11-28)


### Miscellaneous Chores

* change the way Adapter and Kernel handle and process incoming event ([c4dbb69](https://github.com/stone-foundation/stone-js-core/commit/c4dbb69a8c86aa6134b62f7d9cac7dabb444c749))
* make OutgoingResponse properties mutable ([9cce3ac](https://github.com/stone-foundation/stone-js-core/commit/9cce3accbbae4e07f941cf224818cba52006a712))

## [0.0.31](https://github.com/stone-foundation/stone-js-core/compare/v0.0.3...v0.0.31) (2024-11-25)


### Miscellaneous Chores

* throw SetupError for blueprint utilities ([a1d0e9f](https://github.com/stone-foundation/stone-js-core/commit/a1d0e9f001d3ced56e24beb77bf778d53bbcde5a))

## [0.0.3](https://github.com/stone-foundation/stone-js-core/compare/v0.0.2...v0.0.3) (2024-11-25)


### Miscellaneous Chores

* add custom errors ([dd7eaec](https://github.com/stone-foundation/stone-js-core/commit/dd7eaec566465ef84c36b87b824f8ea9ab76e8fa))

## 0.0.2 (2024-11-23)


### Features

* implement core ([be89f75](https://github.com/stone-foundation/stone-js-core/commit/be89f756f02a94c320588453a86b3e95bc4e060f))
