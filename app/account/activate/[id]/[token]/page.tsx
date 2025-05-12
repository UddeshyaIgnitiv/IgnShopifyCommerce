// app/account/activate/[id]/[token]/page.tsx

import { redirect } from 'next/navigation';

export default async function ActivatePage({
  params,
}: {
  params: { id: string; token: string };
}) {
  const { id, token } = params;

  const password = 'TempPassword123!';

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/account/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, activationToken: token, password }),
      cache: 'no-store',
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result?.error || 'Activation failed');
    }

    // ✅ Redirect after success
    redirect('/login');
  } catch (error: any) {
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="text-xl font-semibold mb-4">Activation Failed</h2>
        <p>{error.message}</p>
        <p className="mt-4">Please contact support or request a new activation email.</p>
      </div>
    );
  }

}
