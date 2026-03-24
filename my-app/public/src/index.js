import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals.jsx';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import { SidebarProvider } from './context/SidebarContext.jsx';

import Scripture from './Scripture.jsx';
import Members from './Members.jsx';
import Songs from './Songs.jsx';
import Events from './Events.jsx';
import Announcements from './Announcements.jsx';
import Dashboard from './Dashboard.jsx';
import Settings from './Settings.jsx';
import Presentation from './Presentation.jsx';
import EditQuarters from './EditQuarters.jsx';
import EditRevenue from './EditRevenue.jsx';
import EditCampaign from './EditCampaign.jsx';
import EditTransaction from './EditTransaction.jsx';
import ShareData from './ShareData.jsx';

// Define all routes
const router = createHashRouter([
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
      { path: 'edit-quarters', element: <EditQuarters /> },
      { path: 'edit-revenue', element: <EditRevenue /> },
      { path: 'edit-campaign', element: <EditCampaign /> },
      { path: 'edit-transaction/:transactionId', element: <EditTransaction /> },
      { path: 'share-data', element: <ShareData /> },
    ],
  },
  // Standalone presentation page (no sidebar/navbar)
  {
    path: '/presentation/:templateId',
    element: <Presentation />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SidebarProvider>
    <RouterProvider router={router} />
    </SidebarProvider>
  </React.StrictMode>
);

// Measure app performance
reportWebVitals();
