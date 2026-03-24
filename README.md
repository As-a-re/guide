# Believers Guide - Desktop Application

A modern desktop application built with Electron and React, designed to provide a comprehensive tool for church management and spiritual growth.

## Features

- 📅 Church Management Dashboard
- 📢 Announcements
- 👥 Member Directory
- 🎵 Hymns and Songs
- 📖 Scripture Reference
- 🗓️ Events Calendar
- ⚙️ Application Settings

## Tech Stack

- **Frontend**: React 18, React Router 6
- **Desktop**: Electron
- **UI Components**: Lucide Icons, Recharts
- **Styling**: CSS Modules with Tailwind CSS
- **Data**: JSON-based storage

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Git

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd FirstElectron-App
   ```

2. Install dependencies for both main application and React app:
   ```bash
   # Install main app dependencies
   npm install
   
   # Install React app dependencies
   cd my-app
   npm install
   cd ..
   ```

### Development

1. Start the development server (in the my-app directory):
   ```bash
   cd my-app
   npm start
   ```

2. In a new terminal, start the Electron app:
   ```bash
   npm run dev
   ```

### Building for Production

1. Build the React app:
   ```bash
   cd my-app
   npm run build
   cd ..
   ```

2. Package the Electron app:
   ```bash
   npm run build
   ```
   This will create a distributable package in the `dist` directory.

## Project Structure

```
FirstElectron-App/
├── my-app/                 # React frontend
│   ├── public/             # Static files
│   ├── src/                # React source code
│   │   ├── components/     # Reusable components
│   │   ├── assets/         # Images and other assets
│   │   ├── utils/          # Utility functions
│   │   ├── App.jsx         # Main App component
│   │   └── index.js        # Entry point
│   └── ...
├── main.js                # Electron main process
├── preload.cjs            # Preload script
└── package.json           # Main app configuration
```

## Available Scripts

- `npm start` - Start the Electron app in development mode
- `npm run dev` - Start with electronmon for hot reloading
- `npm run build` - Build the application for production
- `npm test` - Run tests (to be implemented)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the repository.