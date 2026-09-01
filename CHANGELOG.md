# Changelog

All notable changes to **Java SerialVersion UID Generator** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-09-01

### Changed

- Initial commit: Java SerialVersion UID Generator for VS Code

## [1.2.0] - 2026-09-01

### Changed

- Refactored monolithic `extension.ts` into modular architecture (hash, parser, position, codeActionProvider)
- Replaced wildcard imports (`import *`) with specific named imports
- Added Prettier, ESLint+Prettier integration, and EditorConfig
- Added GitHub Actions CI and release workflows
- Added VS Code recommended extensions and launch configs
- Updated package.json with production scripts, devDependencies, and license
- Improved README with badges, installation guide, demo files table, and contributing section
- Improved CHANGELOG format following Keep a Changelog

### Added

- `src/serialuid/hash.ts` — serialVersionUID calculation logic
- `src/serialuid/parser.ts` — Java type declaration parsing and detection
- `src/serialuid/position.ts` — Insert position finding for all Java types
- `src/serialuid/codeActionProvider.ts` — Code action provider class
- `src/serialuid/index.ts` — Barrel export for clean imports
- `.editorconfig`, `.prettierrc`, `.prettierignore` — Code formatting config
- `.github/workflows/ci.yml` — CI pipeline
- `.github/workflows/release.yml` — Automated release pipeline

## [1.1.2] - 2026-07-20

### Fixed

- Bug fixes and error corrections
- Updated README documentation

## [1.0.0] - 2025-01-08

### Added

- Initial release
- Automatic serialVersionUID generation for Java types
- Code action integration in the editor
- Support for class, enum, interface, record, and @interface
- K&R and Allman brace style support
- Enum constant terminator handling
- Comment-aware detection of existing serialVersionUID
