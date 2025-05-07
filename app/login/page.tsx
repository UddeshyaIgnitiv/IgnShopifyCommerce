// app/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/multipass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                // Redirect the user to the Shopify login URL returned by the API
                router.push(data.url);
            } else {
                // Show error (e.g. invalid credentials)
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Request error:', error);
            alert('An unexpected error occurred.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h1>Login</h1>
            <label>
                Email:
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
            </label>
            <br />
            <label>
                Password:
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
            </label>
            <br />
            <button type="submit">Log In</button>
        </form>
    );
}
