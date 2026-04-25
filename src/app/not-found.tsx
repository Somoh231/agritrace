import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-xl mx-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="font-display text-[20px] text-gray-900">Page not found</div>
        <div className="mt-2 text-[12px] text-gray-600 leading-relaxed">
          The link may be outdated, or the page may have moved.
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/"
            className="h-10 px-4 rounded-lg bg-forest-700 text-white text-[12px] hover:bg-forest-800 inline-flex items-center"
          >
            Go to homepage
          </Link>
          <Link
            href="/login"
            className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 inline-flex items-center"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

