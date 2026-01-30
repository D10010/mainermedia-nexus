import React from 'react';

export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl text-white mb-4">Access Required</h1>
        <p className="text-gray-400">Please contact an administrator for access to MAINERMEDIA NEXUS.</p>
      </div>
    </div>
  );
}