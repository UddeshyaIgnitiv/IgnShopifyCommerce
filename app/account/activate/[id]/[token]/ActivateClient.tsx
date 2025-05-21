// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';

// type Props = {
//     id: string;
//     token: string;
// };

// export default function ActivateClient({ id, token }: Props) {
//     const router = useRouter();
//     const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');

//     useEffect(() => {
//         const activateAccount = async () => {
//             try {
//                 const res = await fetch('/api/account/activate', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({
//                         id,
//                         activationToken: token,
//                         password: 'SecurePassword123!', // Replace with user input later
//                     }),
//                 });

//                 if (res.ok) {
//                     setStatus('success');
//                     router.replace('/login');
//                 } else {
//                     setStatus('error');
//                 }
//             } catch (err) {
//                 console.error(err);
//                 setStatus('error');
//             }
//         };

//         activateAccount();
//     }, [id, token]);

//     return (
//         <div className="p-6">
//             {status === 'pending' && <p>Activating your account...</p>}
//             {status === 'success' && <p>Account activated! Redirecting...</p>}
//             {status === 'error' && <p>Something went wrong. Please contact support.</p>}
//         </div>
//     );
// }
