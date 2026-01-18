export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Loading...</h2>

        <p className="text-gray-600 text-center text-sm">
          Please wait while we prepare the application for you.
        </p>

        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <div
              className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
