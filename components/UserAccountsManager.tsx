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
  const [showForm, setShowForm] = useState(false);
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

  const checkIfEmailExists = (email: string) => {
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
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
      setEmail('');
      setFirst('');
      setLast('');
      setRole('');
      setLocation('');
      setShowForm(false);
      setTimeout(() => {
        setFormMsg('');
      }, 4000);
      load();
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
      setTimeout(() => setFormMsg(''), 4000);
      load();
    } catch (err: any) {
      setMsg(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="max-w-3xl w-full space-y-8">
      <div className="bg-white p-6 rounded shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">List of Users</h2>
          {!roleLoading && userRole === 'admin' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              Add User
            </button>
          )}
        </div>
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
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="border border-gray-300 px-4 py-2 align-top">
                    <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-gray-600">{user.email}</div>
                  </td>
                  <td className="border border-gray-300 p-0 align-top">
                    {(() => {
                      const permissions = user.permissions ?? [];
                      return permissions.length > 0 ? (
                        permissions.map((perm, i) => (
                          <div key={i} className="px-4 py-2 border-b border-gray-200 last:border-b-0">
                            {perm.location}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 italic">—</div>
                      );
                    })()}
                  </td>

                  <td className="border border-gray-300 p-0 align-top">
                    {(() => {
                    const permissions = user.permissions ?? [];
                    return permissions.length > 0 ? (
                      permissions.map((perm, i) => {
                        const permRole = perm.role?.toLowerCase() || '';
                        const userB2bRole = user.b2bRole?.toLowerCase();

                        //console.log(`[${user.email}] permRole: ${permRole} | b2bRole: ${userB2bRole}`);

                        let label = 'Non-purchaser'; // default

                        // Logic to decide label based on both perm.role and b2b.role
                        if (permRole === 'location admin' && userB2bRole === 'admin') {
                          label = 'Admin';
                        } else if (permRole === 'ordering only' && userB2bRole === 'purchaser') {
                          label = 'Purchaser';
                        } else if (permRole === 'ordering only' && userB2bRole === 'non_purchaser') {
                          label = 'Non-purchaser';
                        } else {
                          // fallback if needed: maybe default to permRole or non_purchaser
                          label = permRole === 'location admin' ? 'Admin' : (permRole === 'ordering only' ? 'Purchaser' : 'Non-purchaser');
                        }

                        return (
                          <div key={i} className="px-4 py-2 border-b border-gray-200 last:border-b-0">
                            {label}
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-2 text-gray-500 italic">No assigned roles</div>
                    );
                    })()}
                  </td>

                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {(() => {
                      const isTargetAdmin = user.isAdmin === true;
                      const isSelf = user.email === currentUserEmail;
                      const isProtected = isTargetAdmin || isSelf || user.isMainContact;

                      return (
                        <button
                          onClick={() => !isProtected && deleteUser(user.contactId)}
                          disabled={isProtected}
                          className={`px-2 py-1 text-sm rounded 
                            ${isProtected
                              ? 'bg-red-200 text-white-400 cursor-not-allowed opacity-70'
                              : 'bg-red-600 text-white hover:bg-red-700'}`}
                        >
                          Delete
                        </button>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Form */}
      {!roleLoading && userRole === 'admin' && (
        <div
          className={`overflow-hidden transition-all shadow duration-500 ease-in-out ${showForm ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="bg-white p-6 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add User</h3>
              <button
                onClick={() => setShowForm(false)}
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
    </div>
  );
}
