'use client'

import React, { useEffect, useState } from 'react';

const metrics = [
  { label: 'Total Backend Tests', value: 47, color: '#60a5fa' },
  { label: 'Pass Rate', value: '100%', color: '#4ade80' },
  { label: 'Agent Health', value: 'Excellent', color: '#c084fc' },
  { label: 'Logic Assertions', value: 128, color: '#f472b6' }
];

export function MetricsGrid() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="metrics-grid">
      {metrics.map((metric, idx) => (
        <div
          key={metric.label}
          className="metric-card"
          style={{
            animationDelay: `${idx * 0.1}s`,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <div className="metric-value" style={{ color: metric.color }}>
            {metric.value}
          </div>
          <div className="metric-label">{metric.label}</div>
          <div className="glow" style={{ background: metric.color }} />
        </div>
      ))}

      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .metric-card {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .metric-card:hover {
          transform: translateY(-5px) scale(1.02) !important;
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .metric-value {
          font-size: 2.5rem;
          font-weight: 700;
          font-family: system-ui, -apple-system, sans-serif;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 20px currentColor;
        }
        .metric-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }
        .glow {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 100%;
          opacity: 0.05;
          filter: blur(30px);
          z-index: -1;
        }
      `}</style>
    </div>
  );
}
