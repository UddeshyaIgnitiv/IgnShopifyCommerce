'use client'

import IgnIcon from 'components/icons/ignIcon'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center bg-gradient-to-br from-gray-100 to-white px-4 py-20">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 sm:p-10">
        
        {/* Logo above headline */}
        <div className="flex justify-center mb-6">
          <IgnIcon className="h-[72px] w-[180px]" />
        </div>

        {/* Headline */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Welcome Back</h2>
          <p className="text-base text-gray-500 mt-1">
            <strong>Already a customer?</strong> Log in to your account.
          </p>
        </div>

        {/* Login Button */}
        <div className="mb-6">
          <Link
            href="/api/auth/login"
            role="button"
            aria-label="Login to your account"
            className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md transition"
            >
            Log In
          </Link>
        </div>

        {/* Stylish Divider */}
        <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <span className="mx-4 text-gray-500 text-base font-medium">New business customer?</span>
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>

        {/* Register CTA */}
        <div className="text-center text-sm text-gray-500">
          <Link
            href="/register-company"
            className="text-blue-600 font-medium hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </main>
  )
}
