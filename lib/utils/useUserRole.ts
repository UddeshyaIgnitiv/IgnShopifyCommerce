import { useEffect, useState } from 'react';

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      //console.log('[useUserRole] Fetching user role...');
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch user role');
        const data = await res.json();
        //console.log("data", data);
        //console.log('[useUserRole] Role fetched:', data.role);

        // Sanitize role: remove extra quotes if present
        let cleanRole = data.role;
        if (typeof cleanRole === 'string') {
          cleanRole = cleanRole.replace(/^"(.*)"$/, '$1');
        }

        //console.log('[useUserRole] Role fetched:', cleanRole);

        setRole(cleanRole  || 'purchaser'); // default fallback
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole('purchaser');
      } finally {
        setLoading(false);
      }
    }
    fetchRole(); // add login check
  }, []);

  return { role, loading };
}