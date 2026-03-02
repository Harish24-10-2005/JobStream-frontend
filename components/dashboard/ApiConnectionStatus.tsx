import React from 'react';

export function ApiConnectionStatus() {
    return (
        <div className="api-connection-status">
            <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Connection Verifications</h3>
            <div className="connection-flow">
                <div className="node frontend">
                    <h4>Frontend Hooks</h4>
                    <ul>
                        <li>useAuth.ts (Supabase)</li>
                        <li>usePipelineSocket.ts</li>
                        <li>useRealtimeApplier.ts</li>
                    </ul>
                </div>

                <div className="connector">
                    <div className="line" />
                    <div className="label healthy">Verified v1 API</div>
                    <div className="line" />
                </div>

                <div className="node backend">
                    <h4>API Gateway & Services</h4>
                    <ul>
                        <li>v1_router (15 routes)</li>
                        <li>WebSocket Manager</li>
                        <li>Celery Publisher</li>
                    </ul>
                </div>
            </div>

            <style jsx>{`
        .api-connection-status {
          margin-top: 2rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .connection-flow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }
        @media (max-width: 768px) {
          .connection-flow {
            flex-direction: column;
          }
        }
        .node {
          flex: 1;
          padding: 1.5rem;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
        }
        .node.frontend {
          border-top: 3px solid #60a5fa;
        }
        .node.backend {
          border-top: 3px solid #c084fc;
        }
        .node h4 {
          margin: 0 0 1rem 0;
          color: white;
        }
        .node ul {
          margin: 0;
          padding-left: 1.2rem;
          color: rgba(255, 255, 255, 0.7);
          font-family: monospace;
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .connector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 0.5;
        }
        .line {
          height: 2px;
          flex: 1;
          background: linear-gradient(90deg, #60a5fa, #c084fc);
          opacity: 0.5;
        }
        .label {
          font-size: 0.8rem;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.2);
          white-space: nowrap;
        }
      `}</style>
        </div>
    );
}
