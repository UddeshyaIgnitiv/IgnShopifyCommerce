'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ActivatePage({ params }: { params: { id: string; token: string } }) {
    const router = useRouter();
    const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');

    useEffect(() => {
        const activateAccount = async () => {
            try {
                const res = await fetch('/api/account/activate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: params.id,
                        activationToken: params.token,
                        password: 'SecurePassword123!', // Or collect from user via a form
                    }),
                });

                const data = await res.json();
                if (res.ok) {
                    setStatus('success');
                    router.replace('/login');
                } else {
                    console.error(data);
                    setStatus('error');
                }
            } catch (err) {
                console.error(err);
                setStatus('error');
            }
        };

        activateAccount();
    }, [params.id, params.token]);

    return (
        <div className="p-6">
            {status === 'pending' && <p>Activating your account...</p>}
            {status === 'success' && <p>Account activated! Redirecting...</p>}
            {status === 'error' && <p>Something went wrong. Please contact support.</p>}
        </div>
    );
}
