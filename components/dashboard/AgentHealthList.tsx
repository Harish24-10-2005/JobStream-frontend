import React from 'react';

type AgentHealth = {
    name: string;
    type: 'Agent' | 'Automator';
    status: 'Healthy' | 'Warning' | 'Error';
    checks: { name: string; passed: boolean }[];
};

const agents: AgentHealth[] = [
    { name: 'Resume', type: 'Agent', status: 'Healthy', checks: [{ name: 'AgentResponse Schema', passed: true }, { name: 'Circuit Breaker', passed: true }] },
    { name: 'Cover Letter', type: 'Agent', status: 'Healthy', checks: [{ name: 'AgentResponse Schema', passed: true }, { name: 'Circuit Breaker', passed: true }] },
    { name: 'Company', type: 'Agent', status: 'Healthy', checks: [{ name: 'AgentResponse Schema', passed: true }, { name: 'Circuit Breaker', passed: true }] },
    { name: 'Interview', type: 'Agent', status: 'Healthy', checks: [{ name: 'AgentResponse Schema', passed: true }, { name: 'Circuit Breaker', passed: true }] },
    { name: 'Tracker', type: 'Agent', status: 'Healthy', checks: [{ name: 'AgentResponse Schema', passed: true }, { name: 'Database Connection', passed: true }] },
    { name: 'Network', type: 'Agent', status: 'Healthy', checks: [{ name: 'AgentResponse Schema', passed: true }, { name: 'API Search', passed: true }] },
    { name: 'Analyst', type: 'Automator', status: 'Healthy', checks: [{ name: 'Validations', passed: true }] },
    { name: 'Scout', type: 'Automator', status: 'Healthy', checks: [{ name: 'Search Execution', passed: true }, { name: 'Webhook Emit', passed: true }] },
    { name: 'Applier', type: 'Automator', status: 'Healthy', checks: [{ name: 'Profile Completeness', passed: true }, { name: 'Live Application', passed: true }] },
];

export function AgentHealthList() {
    return (
        <div className="agent-health-list">
            <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Core Agents & Automators</h3>
            <div className="agent-grid">
                {agents.map((agent) => (
                    <div key={agent.name} className="agent-card">
                        <div className="agent-card-header">
                            <div>
                                <h4>{agent.name}</h4>
                                <span className="agent-type">{agent.type}</span>
                            </div>
                            <span className={`status-badge ${agent.status.toLowerCase()}`}>
                                {agent.status}
                            </span>
                        </div>
                        <div className="agent-checks">
                            {agent.checks.map((check, idx) => (
                                <div key={idx} className="check-item">
                                    <span className={check.passed ? 'check-icon pass' : 'check-icon fail'}>
                                        {check.passed ? '✓' : '✗'}
                                    </span>
                                    <span className="check-name">{check.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <style jsx>{`
        .agent-health-list {
          margin-top: 2rem;
        }
        .agent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .agent-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .agent-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }
        .agent-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        .agent-card-header h4 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }
        .agent-type {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.2rem;
          display: block;
        }
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        .status-badge.healthy {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .agent-checks {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .check-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
        }
        .check-icon {
          font-weight: bold;
        }
        .check-icon.pass {
          color: #4ade80;
        }
        .check-icon.fail {
          color: #ef4444;
        }
      `}</style>
        </div>
    );
}
