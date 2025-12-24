'use client';

import { useState } from 'react';

export default function DemoPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Next.js Demo</h1>

        <div className="mb-8">
          <p className="text-xl mb-4 text-gray-700">Hello from Next.js!</p>
          <p className="text-2xl mb-4 text-gray-700">
            Count: <span className="font-bold text-blue-600">{count}</span>
          </p>

          <div className="space-x-4">
            <button
              onClick={() => setCount(count + 1)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Increment
            </button>
            <button
              onClick={() => setCount(count - 1)}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Decrement
            </button>
            <button
              onClick={() => setCount(0)}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">React Counter Demo</p>
          <p>This demonstrates Next.js with React state management!</p>
        </div>
      </div>
    </div>
  );
}
