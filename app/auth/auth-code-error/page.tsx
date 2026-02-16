import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8 text-center">
        <div className="text-red-500">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Authentication Error</h1>
        <p className="text-gray-600">
          Sorry, we couldn't complete your sign-in. This could be due to:
        </p>
        <ul className="text-left text-sm text-gray-600 space-y-2">
          <li>• The authentication code expired</li>
          <li>• An error occurred during sign-in</li>
          <li>• The redirect URL is not configured correctly</li>
        </ul>
        <Link
          href="/login"
          className="inline-block w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 transition-colors"
        >
          Try Again
        </Link>
      </div>
    </div>
  )
}
