# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-01-15

### Added
- **Manager Role System**: Complete role-based routing with separate manager screens
- **Route Groups**: `(app)` for standard users, `(manager)` for managers
- **Manager Screens**: Dashboard, Infohub, Calendar, Playerboard with club-wide data
- **Deep Linking**: Support for `coora://manager/*` and `coora://*` URLs with role-based routing
- **Error Boundaries**: Comprehensive error handling for manager tabs
- **Logging System**: Structured logging with context for debugging and monitoring
- **Testing Suite**: Unit tests (Jest + RTL) and E2E tests (Detox) for manager functionality
- **API Centralization**: Clean separation with `lib/api/club.ts` for club-level operations
- **React Query Integration**: Optimized caching and data fetching for club-wide data

### Changed
- **Authentication**: Enhanced AuthContext with `sessionLoaded` property to prevent UI flicker
- **Routing**: Robust role-based guards with fallback redirects
- **App Scheme**: Updated from `myapp` to `coora` for better branding
- **Query Client**: Centralized React Query configuration with optimized defaults

### Security
- **Route Protection**: Manager routes protected with authentication guards
- **Cross-Import Prevention**: ESLint rules prevent unauthorized imports between route groups
- **Environment Separation**: Clean separation of staging/production environments

### Technical
- **Type Safety**: Full TypeScript coverage for manager functionality
- **Error Handling**: Graceful error recovery with retry mechanisms
- **Performance**: Optimized data fetching with proper cache management
- **Testing**: Comprehensive test coverage for critical user flows

### Infrastructure
- **CI/CD**: GitHub Actions pipeline for linting, type checking, and testing
- **EAS Profiles**: Separate staging and production build profiles
- **Environment Management**: Secure environment variable handling

## [1.0.0] - 2024-01-01

### Added
- Initial release with basic user management
- Team and event functionality
- Basic authentication system
- Expo Router implementation
