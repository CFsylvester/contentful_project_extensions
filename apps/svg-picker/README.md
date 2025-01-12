# SVG Picker App for Contentful

A Contentful app that allows users to select SVG icons from predefined groups. The app provides a visual interface for selecting and managing SVG assets within your Contentful space.

## Prerequisites

- Node.js (v14 or higher)
- Yarn package manager
- A Contentful account with admin access
- Contentful CLI installed globally (`npm install -g contentful-cli`)

## Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/svg-picker.git
cd svg-picker
```

2. Install dependencies:

```bash
yarn install
```

3. Login to Contentful:

```bash
yarn login
```

4. Configure you space and environment:

```bash
yarn configure
```

## Development

To start the development server:

```bash
yarn start:svg-picker
```

2. The app will be available at `http://localhost:3000`

## Building and Deployment

1. Build the app:

```bash
yarn build:svg-picker
```

2. Deploy the app:

```bash
yarn deploy:svg-picker
```

3. The app will be available at `https://<your-space-id>.contentful.com/app/`

## Configuration

### SVG Groups

SVGs must be tagged in Contentful with a prefix of `svgPicker`. For example:

- `svgPickerBranding`
- `svgPickerSocial`
- `svgPickerUI`

### App Installation

1. After deploying, install the app in your Contentful space
2. Configure the app instance by selecting an SVG group
3. Add the app to your content model as a JSON field

## Features

- Visual grid display of SVG icons
- Group-based organization of SVGs
- Single-select functionality
- Preview of selected SVGs
- Responsive design
- Auto-resizing within Contentful interface

## File Structure

- `src/`: Source code for the app
- `public/`: Static assets
- `package.json`: App configuration
- `README.md`: This file

## Security Note

Never commit `.contentfulrc.json` with real tokens to version control. Make sure to use environment variables for sensitive data in production.
