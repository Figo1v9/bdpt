import React, { useState } from 'react';
import { Plus, Trash } from 'lucide-react';

export function ManageAdmins() {
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    username: '',
    password: '',
  });

  const [admins] = useState([
    { id: 1, name: 'Dr. John Smith', username: 'jsmith' },
    { id: 2, name: 'Dr. Sarah Johnson', username: 'sjohnson' },
  ]);

  const handleAddAdmin = () => {
    // Here we would save to the database
    setNewAdmin({ name: '', username: '', password: '' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manage Administrators</h2>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Add New Administrator</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={newAdmin.name}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, name: e.target.value })
              }
              className="w-full p-2 bg-gray-700 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={newAdmin.username}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, username: e.target.value })
              }
              className="w-full p-2 bg-gray-700 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={newAdmin.password}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, password: e.target.value })
              }
              className="w-full p-2 bg-gray-700 rounded-lg"
            />
          </div>

          <button
            onClick={handleAddAdmin}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
          >
            <Plus size={20} />
            <span>Add Administrator</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Current Administrators</h3>
        <div className="space-y-4">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium">{admin.name}</p>
                <p className="text-sm text-gray-400">@{admin.username}</p>
              </div>
              <button className="p-2 hover:bg-gray-600 rounded-lg">
                <Trash size={20} className="text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}