# Release Process

This document outlines the minimal release process for Coora for Sport.

## Prerequisites

- EAS CLI installed: `npm install -g @expo/eas-cli`
- EAS project configured: `eas init`
- Environment variables set in EAS profiles
- GitHub repository with proper permissions

## Release Steps

### 1. Version Bump

```bash
# Bump version (patch, minor, or major)
npm version minor

# Push version tag to GitHub
git push --follow-tags
```

### 2. Build for Production

#### iOS Production Build
```bash
eas build --platform ios --profile production
```

#### Android Production Build
```bash
eas build --platform android --profile production
```

### 3. Submit to App Stores (Optional)

#### iOS App Store
```bash
eas submit --platform ios --profile production
```

#### Google Play Store
```bash
eas submit --platform android --profile production
```

### 4. Over-the-Air Updates (Optional)

If using Expo Updates for OTA updates:

```bash
# Update production channel
eas update --branch production --message "Release v1.1.0: Manager role system"

# Update staging channel (for testing)
eas update --branch staging --message "Staging update"
```

## Environment-Specific Releases

### Staging Release
```bash
# Build staging version
eas build --platform ios --profile staging
eas build --platform android --profile staging

# Update staging channel
eas update --branch staging --message "Staging release"
```

### Development Release
```bash
# Build development version
eas build --platform ios --profile development
eas build --platform android --profile development
```

## Release Checklist

- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compilation succeeds (`npm run type-check`)
- [ ] CI pipeline is green
- [ ] Version bumped in `package.json`
- [ ] `CHANGELOG.md` updated
- [ ] Environment variables configured in EAS profiles
- [ ] Builds successful for target platforms
- [ ] App store submissions (if applicable)
- [ ] OTA updates deployed (if applicable)

## Rollback Process

### OTA Update Rollback
```bash
# Revert to previous update
eas update --branch production --message "Rollback to previous version"
```

### App Store Rollback
- Use App Store Connect or Google Play Console to rollback
- Submit previous working version if critical issues found

## Troubleshooting

### Build Failures
- Check environment variables in EAS profiles
- Verify app.config.js configuration
- Check for missing dependencies
- Review EAS build logs

### Submission Failures
- Verify app store credentials
- Check app store guidelines compliance
- Review submission logs for specific errors

### OTA Update Issues
- Verify channel configuration
- Check update compatibility
- Review update logs in Expo dashboard

## Security Considerations

- Never commit environment variables to repository
- Use EAS secrets for sensitive data
- Regularly rotate API keys and tokens
- Monitor for security vulnerabilities in dependencies

## Monitoring

- Monitor app store reviews and ratings
- Track crash reports and analytics
- Monitor OTA update adoption rates
- Review performance metrics
