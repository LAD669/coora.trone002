describe('Manager Happy Path E2E Tests', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login as manager and land on manager dashboard', async () => {
    // Wait for login screen
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(10000);

    // Enter manager credentials
    await element(by.id('email-input')).typeText('manager@club.com');
    await element(by.id('password-input')).typeText('password123');
    
    // Tap login button
    await element(by.id('login-button')).tap();

    // Wait for manager dashboard
    await waitFor(element(by.id('manager-dashboard')))
      .toBeVisible()
      .withTimeout(15000);

    // Verify manager-specific content
    await expect(element(by.text('Club Manager'))).toBeVisible();
    await expect(element(by.text('Total Members'))).toBeVisible();
    await expect(element(by.text('Total Teams'))).toBeVisible();
    await expect(element(by.text('Upcoming Events'))).toBeVisible();
  });

  it('should navigate to manager infohub and see organization posts', async () => {
    // Start from manager dashboard (assuming already logged in)
    await waitFor(element(by.id('manager-dashboard')))
      .toBeVisible()
      .withTimeout(10000);

    // Navigate to infohub tab
    await element(by.id('infohub-tab')).tap();

    // Wait for infohub screen
    await waitFor(element(by.id('manager-infohub')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify organization posts are shown
    await expect(element(by.text('Organization Posts'))).toBeVisible();
    
    // Verify no channel switcher is present
    await expect(element(by.id('channel-switcher'))).not.toBeVisible();

    // Test post creation
    await element(by.id('create-post-button')).tap();
    await waitFor(element(by.id('create-post-modal')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('post-title-input')).typeText('Test Manager Post');
    await element(by.id('post-content-input')).typeText('This is a test post from manager');
    
    await element(by.id('submit-post-button')).tap();

    // Verify post appears
    await waitFor(element(by.text('Test Manager Post')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate to manager calendar and see club events', async () => {
    // Start from manager dashboard
    await waitFor(element(by.id('manager-dashboard')))
      .toBeVisible()
      .withTimeout(10000);

    // Navigate to calendar tab
    await element(by.id('calendar-tab')).tap();

    // Wait for calendar screen
    await waitFor(element(by.id('manager-calendar')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify calendar elements
    await expect(element(by.id('calendar-header'))).toBeVisible();
    await expect(element(by.id('calendar-grid'))).toBeVisible();

    // Test month navigation
    await element(by.id('prev-month-button')).tap();
    await element(by.id('next-month-button')).tap();

    // Test event creation
    await element(by.id('create-event-button')).tap();
    await waitFor(element(by.id('create-event-modal')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('event-title-input')).typeText('Manager Event');
    await element(by.id('event-location-input')).typeText('Club Facility');
    
    await element(by.id('submit-event-button')).tap();

    // Verify event appears
    await waitFor(element(by.text('Manager Event')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate to manager playerboard and see club teams', async () => {
    // Start from manager dashboard
    await waitFor(element(by.id('manager-dashboard')))
      .toBeVisible()
      .withTimeout(10000);

    // Navigate to playerboard tab
    await element(by.id('playerboard-tab')).tap();

    // Wait for playerboard screen
    await waitFor(element(by.id('manager-playerboard')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify team list
    await expect(element(by.text('Club Teams'))).toBeVisible();
    
    // Tap on a team to see players
    await element(by.id('team-card-0')).tap();
    
    // Wait for team players screen
    await waitFor(element(by.id('team-players-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify players are shown
    await expect(element(by.text('Team Players'))).toBeVisible();
  });

  it('should handle network errors gracefully', async () => {
    // Start from manager dashboard
    await waitFor(element(by.id('manager-dashboard')))
      .toBeVisible()
      .withTimeout(10000);

    // Simulate network error by going offline
    await device.setURLBlacklist(['.*']);

    // Navigate to infohub to trigger API call
    await element(by.id('infohub-tab')).tap();

    // Wait for error handling
    await waitFor(element(by.id('error-snackbar')))
      .toBeVisible()
      .withTimeout(10000);

    // Verify retry button is available
    await expect(element(by.id('retry-button'))).toBeVisible();

    // Restore network
    await device.clearURLBlacklist();

    // Tap retry
    await element(by.id('retry-button')).tap();

    // Verify data loads successfully
    await waitFor(element(by.id('manager-infohub')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should maintain manager state across navigation', async () => {
    // Start from manager dashboard
    await waitFor(element(by.id('manager-dashboard')))
      .toBeVisible()
      .withTimeout(10000);

    // Navigate through all tabs
    await element(by.id('infohub-tab')).tap();
    await waitFor(element(by.id('manager-infohub'))).toBeVisible();

    await element(by.id('calendar-tab')).tap();
    await waitFor(element(by.id('manager-calendar'))).toBeVisible();

    await element(by.id('playerboard-tab')).tap();
    await waitFor(element(by.id('manager-playerboard'))).toBeVisible();

    await element(by.id('dashboard-tab')).tap();
    await waitFor(element(by.id('manager-dashboard'))).toBeVisible();

    // Verify we're still in manager context
    await expect(element(by.text('Club Manager'))).toBeVisible();
  });
});
