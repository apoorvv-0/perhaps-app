import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-8xl font-black text-gray-200 leading-none select-none">404</div>
      <h2 className="mt-4 text-2xl font-bold text-gray-800">Page Not Found</h2>
      <p className="mt-2 text-gray-500 max-w-sm">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-6 px-6 py-2 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-brand-dark transition"
      >
        Go Home
      </Link>
    </div>
  );
}
