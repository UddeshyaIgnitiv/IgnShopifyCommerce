'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
    const router = useRouter()

    useEffect(() => {
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('shopify_customer_token='))
            ?.split('=')[1]

        if (!token) {
            router.push('/login')
        }
    }, [])

    return <main className="p-8">Welcome to your account dashboard</main>
}
