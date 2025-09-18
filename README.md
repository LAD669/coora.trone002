# Coora for Sport

A comprehensive sports team management app built with React Native and Expo.

## Features

### Manager Role System
- **Role-based Routing**: Separate `(app)` and `(manager)` route groups
- **Manager Dashboard**: Club-wide statistics and analytics
- **Manager Infohub**: Organization posts only (no channel switcher)
- **Manager Calendar**: Club-wide events with month filtering
- **Manager Playerboard**: Club teams with player counts
- **Deep Linking**: Support for `coora://manager/*` URLs
- **Error Boundaries**: Comprehensive error handling
- **Testing**: Unit tests (Jest + RTL) and E2E tests (Detox)

### InfoHub
- **Post Creation**: Create posts for organization and team updates
- **Reactions**: React to posts with emojis
- **Real-time Updates**: Live updates when new posts are created
- **Role-based Access**: Different permissions for trainers and admins

### Dashboard
- Team statistics and performance metrics
- Match results and upcoming events
- Player performance tracking

### Calendar
- Event scheduling and management
- Training sessions and matches

## Environment Setup & Profiles

### Environment Variables
The app uses environment variables for configuration. Set these in your EAS build profiles:

```bash
# Required environment variables
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### EAS Build Profiles

#### Development
```bash
eas build --profile development
```
- Uses development client
- Internal distribution
- No environment variables required (uses local .env)

#### Staging
```bash
eas build --profile staging
```
- Release build configuration
- Internal distribution (APK for Android)
- Uses staging environment variables
- Channel: `staging`

#### Production
```bash
eas build --profile production
```
- Store-ready build (AAB for Android, App Store for iOS)
- Uses production environment variables
- Channel: `production`

### Environment Separation
- **No hardcoded secrets**: All sensitive data comes from environment variables
- **Profile-specific configs**: Each EAS profile has its own environment setup
- **Secure deployment**: Environment variables are injected at build time
- Team availability tracking

### Player Board
- Player profiles and statistics
- Performance tracking
- Team roster management

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Set up Supabase project
5. Run the app: `npx expo start`

## Technologies

- React Native
- Expo
- Supabase (Database)
- TypeScript
- Lucide React Native (Icons)
