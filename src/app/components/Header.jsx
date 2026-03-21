import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function Header() {
  return (
    <div className="bg-blue-900 dark:bg-slate-900 text-white py-4 border-b border-blue-800 dark:border-slate-800">
      <div className="container mx-auto flex justify-between items-center px-6">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/pasig-seal.png"
              alt="Pasig City Logo"
              width={90}
              height={90}
            />
          </Link>
          <div className="flex flex-col">
            <span className="text-xs font-light tracking-widest opacity-90">
              LUNGSOD NG
            </span>
            <span className="text-lg font-bold tracking-wider">PASIG</span>
            <span className="text-xs font-light tracking-widest opacity-90 uppercase">
              Umaagos ang Pag-asa
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right text-sm hidden sm:block">
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            |{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
            })}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
