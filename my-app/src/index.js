import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals.jsx';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import Scripture from './Scripture.jsx';
import Members from './Members.jsx';
import Songs from './Songs.jsx';
import Events from './Events.jsx';
import Announcements from './Announcements.jsx';
import Dashboard from './Dashboard.jsx';
import Settings from './Settings.jsx';

// Define all routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // Shared layout with navbar
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'announcements', element: <Announcements /> },
      { path: 'members', element: <Members /> },
      { path: 'songs', element: <Songs /> },
      { path: 'events', element: <Events /> },
      { path: 'scripture', element: <Scripture /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// Measure app performance
reportWebVitals();
