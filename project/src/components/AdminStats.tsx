import React from 'react';
import { Users, CheckCircle, XCircle } from 'lucide-react';

export function AdminStats() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <Users className="text-purple-500" size={24} />
            <div>
              <h3 className="text-sm text-gray-400">Total Students</h3>
              <p className="text-2xl font-bold">150</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <h3 className="text-sm text-gray-400">Tests Completed</h3>
              <p className="text-2xl font-bold">324</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <Users className="text-blue-500" size={24} />
            <div>
              <h3 className="text-sm text-gray-400">Online Students</h3>
              <p className="text-2xl font-bold">23</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {/* This would be populated from the database */}
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium">John Doe</p>
              <p className="text-sm text-gray-400">Completed Economics Test</p>
            </div>
            <span className="text-sm text-gray-400">2 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}