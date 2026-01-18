'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/error-boundary';

// Test component that throws an error (only client-side after mount)
function BuggyComponent({ shouldError }: { shouldError: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (mounted && shouldError) {
    throw new Error('This is a test error from BuggyComponent!');
  }

  return <div className="text-green-600">✓ Component rendered successfully</div>;
}

export default function ErrorTestPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Error Boundary Test Page</h1>

      <div className="space-y-8">
        {/* Test 1: Normal component (no error) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test 1: Normal Component (No Error)
          </h2>
          <ErrorBoundary>
            <BuggyComponent shouldError={false} />
          </ErrorBoundary>
        </div>

        {/* Test 2: Component that throws error */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test 2: Component with Error (Error Boundary catches it)
          </h2>
          <ErrorBoundary>
            <BuggyComponent shouldError={true} />
          </ErrorBoundary>
        </div>

        {/* Test 3: Custom fallback */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test 3: Custom Fallback UI</h2>
          <ErrorBoundary
            fallback={
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-yellow-800">🎨 Custom error UI displayed!</p>
              </div>
            }
          >
            <BuggyComponent shouldError={true} />
          </ErrorBoundary>
        </div>

        {/* Test 4: With error callback */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test 4: With Error Callback (Check console)
          </h2>
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.log('🔍 Error caught by callback:', {
                message: error.message,
                componentStack: errorInfo.componentStack,
              });
            }}
          >
            <BuggyComponent shouldError={true} />
          </ErrorBoundary>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">Test Instructions:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Test 1 should render successfully with a green checkmark</li>
          <li>Test 2, 3, and 4 should show error boundary UI instead of crashing</li>
          <li>Test 3 uses a custom fallback UI (yellow background)</li>
          <li>Test 4 logs error details to the console (open DevTools)</li>
          <li>All errors are contained and don't crash the entire page</li>
        </ul>
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="text-primary-600 hover:text-primary-700 underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
