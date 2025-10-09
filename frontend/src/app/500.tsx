export default function Error500() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">500</h1>
        <p className="text-xl text-slate-400 mb-8">Internal Server Error</p>
        <p className="text-slate-500 mb-8">Something went wrong on our end.</p>
      </div>
    </div>
  )
}