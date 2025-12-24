import React, { useState } from 'react';

function CounterButton({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#10B981',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        marginRight: '10px'
      }}
    >
      Clicked {count} times
    </button>
  );
}

function CounterDisplay({ count }) {
  return (
    <div style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold' }}>
      Current count: {count}
    </div>
  );
}

export default function ReactCounter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '15px', background: '#EEF2FF', borderRadius: '6px', border: '2px solid #4F46E5' }}>
      <h3 style={{ marginTop: 0, color: '#4F46E5' }}>⚛️ React Component Inside Phoenix</h3>
      <p style={{ fontSize: '14px', color: '#6B7280' }}>
        This is a React component mounted inside a Phoenix LiveView card!
      </p>
      <CounterButton count={count} onClick={() => setCount(count + 1)} />
      <button
        onClick={() => setCount(0)}
        style={{
          background: '#EF4444',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Reset
      </button>
      <CounterDisplay count={count} />
    </div>
  );
}
