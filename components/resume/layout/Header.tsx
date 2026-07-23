"use client";

import Link from "next/link";
import React from "react";

import BrandLogo from "@/components/BrandLogo";

const Header = () => {
  return (
    <header className="sticky top-0 z-50">
      <nav className="border-b border-border bg-white px-6 py-2.5">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
          <Link href="/" className="flex items-center" aria-label="Prepora home">
            <BrandLogo imageClassName="h-8 sm:h-9" />
          </Link>
          <div className="flex items-center lg:order-2">
            <Link
              href="/resume/dashboard"
              className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-full text-sm px-4 lg:px-5 py-2 lg:py-2.5 focus:outline-none"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
