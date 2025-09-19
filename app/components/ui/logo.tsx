"use client";

import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <div className="relative w-6 h-6">
        <Image
          src="/icons/svg/sanhuamao-logo.svg"
          alt="XiYang Logo"
          width={24}
          height={24}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      <span className="font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
        XiYang
      </span>
    </Link>
  );
}
