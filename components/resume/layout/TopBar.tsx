"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next-nprogress-bar";
import BrandLogo from "@/components/BrandLogo";

const TopBar = () => {
  const router = useRouter();

  return (
    <div className="flex w-full items-center justify-between border-b border-border bg-white px-5 py-3">
      <Link href="/" className="flex items-center" aria-label="Prepora home">
        <BrandLogo imageClassName="h-10" />
      </Link>

      <Button
        className="btn btn-primary"
        onClick={() => {
          router.push("/dashboard");
        }}
      >
        Dashboard
      </Button>
    </div>
  );
};

export default TopBar;
