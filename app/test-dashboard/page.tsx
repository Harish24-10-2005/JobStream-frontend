'use client'

import React from 'react';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { AgentHealthList } from '@/components/dashboard/AgentHealthList';
import { ApiConnectionStatus } from '@/components/dashboard/ApiConnectionStatus';

export default function TestDashboard() {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Command Center</h1>
        <p>System Health & Validation Metrics</p>
      </header>

      <main className="dashboard-content">
        <MetricsGrid />

        <div className="grid-2-cols">
          <AgentHealthList />
          <ApiConnectionStatus />
        </div>
      </main>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: #0f172a;
          color: white;
          padding: 2rem;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .dashboard-header {
          margin-bottom: 3rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 1.5rem;
        }
        .dashboard-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .dashboard-header p {
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          font-size: 1.1rem;
        }
        .dashboard-content {
          max-width: 1400px;
          margin: 0 auto;
        }
        .grid-2-cols {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 1024px) {
          .grid-2-cols {
            grid-template-columns: 1.2fr 0.8fr;
          }
        }
      `}</style>
    </div>
  );
}
