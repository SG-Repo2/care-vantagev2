# CI/CD Setup Guide

This project uses GitHub Actions and Fastlane for continuous integration and deployment to TestFlight.

## Setup

### Prerequisites
- Xcode 15.0 or later
- Ruby 3.1.0 or later
- Node.js 18 or later
- Bundler (`gem install bundler`)
- CocoaPods (`gem install cocoapods`)

### Local Development

1. Install dependencies:
```bash
# Install JavaScript dependencies
npm install

# Install Ruby dependencies
cd ios
bundle install
pod install
cd ..
```

2. Run Fastlane commands locally:
```bash
cd ios
bundle exec fastlane build  # Just build the app
bundle exec fastlane test   # Run tests
bundle exec fastlane beta   # Deploy to TestFlight
```

### GitHub Actions CI/CD Pipeline

The project is configured with GitHub Actions to automatically:
- Build the iOS app
- Run tests
- Deploy to TestFlight (only on main branch)

#### GitHub Actions Setup

1. In your GitHub repository settings, go to Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `FASTLANE_USER`: Your Apple ID
   - `FASTLANE_PASSWORD`: Your Apple ID password
   - `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD`: App-specific password for your Apple ID
   
To generate an app-specific password:
1. Sign in to your Apple ID account at https://appleid.apple.com
2. In the Security section, click "Generate Password" under App-Specific Passwords
3. Follow the steps to generate the password
4. Use this password for the `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` secret

#### Deployment Process

1. Push changes to the main branch
2. GitHub Actions automatically:
   - Installs dependencies
   - Builds the app
   - Runs tests
   - Deploys to TestFlight (if on main branch)

## Troubleshooting

### Common Issues

1. Build failures:
   - Ensure all certificates and provisioning profiles are valid
   - Check if the build number needs to be incremented
   - Verify that all dependencies are properly installed

2. TestFlight upload failures:
   - Verify Apple ID credentials and app-specific password
   - Check if the app version and build numbers are unique
   - Ensure the app is properly signed

### Support

For any CI/CD related issues:
1. Check the GitHub Actions workflow runs in your repository's Actions tab
2. Review the Fastlane logs in the workflow run details
3. Verify all secrets are properly set in repository settings