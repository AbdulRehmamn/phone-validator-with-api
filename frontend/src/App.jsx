import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SingleLookup from './pages/SingleLookup';
import BulkValidator from './pages/BulkValidator';
import BulkHistory from './pages/BulkHistory';
import BulkJobDetail from './pages/BulkJobDetail';
import ApiDocs from './pages/ApiDocs';
import ApiKeys from './pages/ApiKeys';
import AdminSettings from './pages/AdminSettings';
import { api } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.getSystemStatus();
        setSystemStatus(data);
      } catch (err) {
        // backend might be starting up
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            setActivePage={setActivePage}
            setSelectedJobId={setSelectedJobId}
          />
        );
      case 'single':
        return <SingleLookup />;
      case 'bulk':
        return (
          <BulkValidator
            setActivePage={setActivePage}
            setSelectedJobId={setSelectedJobId}
          />
        );
      case 'history':
        return (
          <BulkHistory
            setActivePage={setActivePage}
            setSelectedJobId={setSelectedJobId}
          />
        );
      case 'job-detail':
        return (
          <BulkJobDetail
            jobId={selectedJobId}
            setActivePage={setActivePage}
          />
        );
      case 'docs':
        return <ApiDocs />;
      case 'keys':
        return <ApiKeys />;
      case 'admin':
        return <AdminSettings />;
      default:
        return (
          <Dashboard
            setActivePage={setActivePage}
            setSelectedJobId={setSelectedJobId}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
        }}
        systemStatus={systemStatus}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar activePage={activePage} setActivePage={setActivePage} />

        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
