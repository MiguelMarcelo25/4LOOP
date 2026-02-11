import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen h-full w-full grid grid-cols-1 md:grid-cols-2">
      {/* LEFT SECTION */}
      <div
        className="relative flex flex-col justify-center items-start p-20 bg-cover bg-center text-white"
        style={{
          backgroundImage: "url('/home.png')",
        }}
      >
        {/* overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>

  
         <div className="relative z-10 h-full flex flex-col justify-center px-10 text-white">
  <div>
    <h1 className="text-5xl font-semibold leading-tight">PASIG CITY</h1>
    <h2 className="text-4xl font-light leading-tight mt-2">SANITATION</h2>
    <h2 className="text-4xl font-light leading-tight">ONLINE SERVICE</h2>
  </div>
</div>
        
      </div>

      {/* RIGHT SECTION */}
      <div className="flex flex-col justify-center bg-white dark:bg-slate-900 p-10 md:px-20">
        <div className="max-w-md w-full mx-auto space-y-8 text-center">
         

          <div className="flex flex-col gap-4">
            <Link
              href="/login"
              className="w-full bg-blue-900 dark:bg-blue-700 text-white py-3 rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition"
            >
              SIGN IN
            </Link>

            <Link
              href="/registration"
              className="w-full border border-blue-900 dark:border-blue-700 text-blue-900 dark:text-blue-400 py-3 rounded-md hover:bg-blue-50 dark:hover:bg-slate-800 transition"
            >
              SIGN UP
            </Link>
          </div>
        </div>

        <footer className="mt-10 text-center text-xs text-gray-400 dark:text-slate-500">
          © {new Date().getFullYear()} CITY GOVERNMENT OF PASIG
        </footer>
      </div>
    </div>
  );
}
