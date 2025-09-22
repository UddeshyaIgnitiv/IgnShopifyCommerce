'use client';

import { useUserRole } from 'lib/utils/useUserRole';
import { useEffect, useState } from 'react';

type User = {
  id: string;
  contactId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyId?: string;
  isMainContact?: boolean;
  isAdmin?: boolean;
  b2bRole?: string;
  permissions?: {
    role: string;
    location: string;
    address?: string;
  }[];
};

type Location = {
  id: string;
  name: string;
  address?: string;
};

export default function UserAccountsManager({ isAdmin }: { isAdmin: boolean }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [msg, setMsg] = useState<string>('');
  const [formMsg, setFormMsg] = useState<string>('');
  
  const [showAddForm, setShowAddForm] = useState(false);

  const [email, setEmail] = useState('');
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [posting, setPosting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [locations, setLocations] = useState<Location[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  const { role: userRole, loading: roleLoading } = useUserRole();

  // --- New state for edit ---
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editing, setEditing] = useState(false);  // track edit submission loading

  const UI_ROLE_OPTIONS = [
    { id: 'admin', label: 'Admin' },
    { id: 'purchaser', label: 'Purchaser' },
    { id: 'non_purchaser', label: 'Non-purchaser' },
  ];

  async function load() {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed to load users');
      setUsers(j.users || []);
      setLocations(j.locations || []);
      setCurrentUserEmail(j.currentUserEmail || '');
    } catch (e: any) {
      setMsg(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const checkIfEmailExists = (emailToCheck: string) => {
    return users.some(user => user.email.toLowerCase() === emailToCheck.toLowerCase());
  };

  const createUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPosting(true);
    setFormMsg('');
    setEmailError('');

    if (checkIfEmailExists(email)) {
      setEmailError('This email is already associated with an account.');
      setPosting(false);
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          role,
          location,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setFormMsg('User created successfully.');
      // reset inputs
      setEmail('');
      setFirst('');
      setLast('');
      setRole('');
      setLocation('');
      setShowAddForm(false);
      // reload list
      load();
      // clear message later
      setTimeout(() => {
        setFormMsg('');
      }, 4000);
    } catch (err: any) {
      setFormMsg(err.message || 'Server error.');
    } finally {
      setPosting(false);
    }
  };

  const deleteUser = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      setFormMsg('User deleted successfully.');
      setTimeout(() => {
        setFormMsg('');
      }, 4000);
      load();
    } catch (err: any) {
      setMsg(err.message || 'Failed to delete user');
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditFirstName(user.firstName || '');
    setEditLastName(user.lastName || '');
    setEditRole(user.b2bRole || '');
    // If more than one permission, you might choose first, or allow multiple
    const firstPerm = user.permissions?.[0];
    setEditLocation(firstPerm?.location || '');
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditFirstName('');
    setEditLastName('');
    setEditRole('');
    setEditLocation('');
  };

  const updateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditing(true);
    setFormMsg('');

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: editingUser.contactId,
          firstName: editFirstName,
          lastName: editLastName,
          role: editRole,
          location: editLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setFormMsg('User updated successfully.');
      cancelEdit();
      load();
      setTimeout(() => {
        setFormMsg('');
      }, 4000);
    } catch (err: any) {
      setFormMsg(err.message || 'Error updating user.');
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="max-w-3xl w-full space-y-8">
      {/* Message Alerts */}
      {formMsg && (
        <div className="text-green-600 mb-4 text-sm border border-green-300 bg-green-50 px-4 py-2 rounded">
          {formMsg}
        </div>
      )}
      {msg && (
        <div className="text-red-600 mb-4 text-sm border border-red-300 bg-red-50 px-4 py-2 rounded">
          {msg}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">List of Users</h2>
          {!roleLoading && userRole === 'admin' && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1 text-sm text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              {showAddForm ? 'Close Add Form' : 'Add User'}
            </button>
          )}
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : users.length === 0 ? (
          <div>No User Available.</div>
        ) : (
          <table className="min-w-full border border-gray-300 divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">User</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Location</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Roles</th>
                <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isTargetAdmin = user.isAdmin === true;
                const isSelf = user.email === currentUserEmail;
                const isProtected = isTargetAdmin || isSelf || user.isMainContact;
                return (
                  <tr key={user.id} className="border-t">
                    <td className="border border-gray-300 px-4 py-2 align-top">
                      <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-gray-600">{user.email}</div>
                    </td>
                    <td className="border border-gray-300 p-0 align-top">
                      {user.permissions && user.permissions.length > 0 ? (
                        user.permissions.map((perm, i) => (
                          <div key={i} className="px-4 py-2 border-b border-gray-200 last:border-b-0">
                            {perm.location}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 italic">—</div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-0 align-top">
                      {user.permissions && user.permissions.length > 0 ? (
                        user.permissions.map((perm, i) => {
                          const permRole = perm.role?.toLowerCase() || '';
                          const userB2bRole = user.b2bRole?.toLowerCase() || '';

                          let label = 'Non-purchaser';

                          if (permRole === 'location admin' && userB2bRole === 'admin') {
                            label = 'Admin';
                          } else if (permRole === 'ordering only' && userB2bRole === 'purchaser') {
                            label = 'Purchaser';
                          } else if (permRole === 'ordering only' && userB2bRole === 'non_purchaser') {
                            label = 'Non-purchaser';
                          } else {
                            label = permRole === 'location admin' ? 'Admin'
                              : (permRole === 'ordering only' ? 'Purchaser' : 'Non-purchaser');
                          }

                          return (
                            <div key={i} className="px-4 py-2 border-b border-gray-200 last:border-b-0">
                              {label}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-2 text-gray-500 italic">No assigned roles</div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center space-x-2">
                      {/* Edit button */}
                      {!isProtected && (
                        <button
                          onClick={() => startEdit(user)}
                          className="px-2 py-1 text-sm rounded bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                      )}
                      {/* Delete button */}
                      <button
                        onClick={() => !isProtected && deleteUser(user.contactId)}
                        disabled={isProtected}
                        className={`px-2 py-1 text-sm rounded ${
                          isProtected
                          ? 'bg-red-200 text-white cursor-not-allowed opacity-70'
                          : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Form */}
      {!roleLoading && userRole === 'admin' && (
        <div
          className={`overflow-hidden transition-all shadow duration-500 ease-in-out ${
            showAddForm ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-white p-6 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add User</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {emailError && <div className="mb-3 text-sm text-red-600">{emailError}</div>}

            <form onSubmit={createUser} className="grid grid-cols-1 gap-4">
              <input
                className="border rounded p-2"
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="border rounded p-2"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirst(e.target.value)}
                />
                <input
                  className="border rounded p-2"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLast(e.target.value)}
                />
              </div>

              <select
                className="border rounded p-2"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">Select Role</option>
                {UI_ROLE_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>

              <select
                className="border rounded p-2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              >
                <option value="">Select Location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={posting}
                className="bg-black text-white rounded py-2"
              >
                {posting ? 'Creating...' : 'Add User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit User</h3>
              <button
                onClick={() => cancelEdit()}
                className="text-white cursor-pointer hover:text-white focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={updateUser} className="grid grid-cols-1 gap-4">
              <input
                className="border rounded p-2 bg-gray-100 text-gray-500"
                value={editingUser.email}
                disabled
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="border rounded p-2"
                  placeholder="First name"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  required
                />
                <input
                  className="border rounded p-2"
                  placeholder="Last name"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  required
                />
              </div>

              <select
                className="border rounded p-2"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                required
              >
                <option value="">Select Role</option>
                {UI_ROLE_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>

              <select
                className="border rounded p-2"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                required
              >
                <option value="">Select Location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => cancelEdit()}
                  className="px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="px-4 py-2 text-white rounded"
                >
                  {editing ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
