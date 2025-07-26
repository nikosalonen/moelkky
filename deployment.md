<!-- @format -->

# Deployment Configuration

## GitHub Pages Setup

This project is configured to deploy automatically to GitHub Pages using GitHub Actions.

### Configuration Details

- **Repository**: The project should be hosted in a GitHub repository
- **Branch**: Deployments trigger on pushes to the `main` branch
- **Base Path**: The app is configured to work with the repository name as the base path (`/moelkky/`)
- **Build Output**: Static files are built to the `dist/` directory

### GitHub Pages Settings

To enable GitHub Pages deployment:

1. Go to your repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. The workflow will automatically deploy on the next push to main

### Environment Variables

- `NODE_ENV=production`: Set during build to enable production optimizations
- Base path is automatically configured based on the environment

### Local Testing

To test the production build locally:

```bash
# Build for production
npm run build:prod

# Preview the production build
npm run preview:prod
```

This will build the project with production settings and serve it with the correct base path at `http://localhost:4173/moelkky/`.

### Deployment Process

1. Code is pushed to the `main` branch
2. GitHub Actions workflow is triggered
3. Dependencies are installed
4. Tests are run (deployment fails if tests fail)
5. Project is built with production settings
6. Built files are deployed to GitHub Pages
7. Site is available at `https://[username].github.io/moelkky/`

### Troubleshooting

- Ensure the repository name matches the base path in `vite.config.ts`
- Check that GitHub Pages is enabled in repository settings
- Verify that the `GITHUB_TOKEN` has the necessary permissions
- Check the Actions tab for deployment logs if issues occur
