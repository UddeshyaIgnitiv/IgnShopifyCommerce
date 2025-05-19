'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState<'email' | 'otp'>('email')
    const [error, setError] = useState('')
    const router = useRouter()

    const sendOtp = async () => {
        const res = await fetch('/api/auth/start-login', {
            method: 'POST',
            body: JSON.stringify({ email }),
        })
        const data = await res.json()
        if (res.ok) {
            setStep('otp')
        } else {
            setError(data.message)
        }
    }

    const verifyOtp = async () => {
        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        })
        const data = await res.json()
        if (res.ok) {
            // Save token in cookie
            document.cookie = `shopify_customer_token=${data.accessToken}; path=/`
            router.push('/account')
        } else {
            setError(data.message)
        }
    }

    return (
        <main className="p-8 max-w-md mx-auto">
            <h1 className="text-2xl mb-4">Login</h1>
            {step === 'email' ? (
                <>
                    <input
                        type="email"
                        className="border p-2 w-full mb-4"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button onClick={sendOtp} className="bg-black text-white px-4 py-2">Send OTP</button>
                </>
            ) : (
                <>
                    <input
                        type="text"
                        className="border p-2 w-full mb-4"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    <button onClick={verifyOtp} className="bg-black text-white px-4 py-2">Verify OTP</button>
                </>
            )}
            {error && <p className="text-red-600 mt-2">{error}</p>}
        </main>
    )
}
