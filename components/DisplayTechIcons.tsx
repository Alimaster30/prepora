"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";

interface TechIcon {
  tech: string;
  url: string;
}

const DisplayTechIcons = ({ techStack }: TechIconProps) => {
  const [techIcons, setTechIcons] = useState<TechIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const safeStackLocal = techStack ?? [];
    const loadTechIcons = async () => {
      try {
        // Import dynamically to avoid SSR issues
        const { getTechLogos } = await import("@/lib/utils");
        const icons = await getTechLogos(safeStackLocal);
        setTechIcons(icons);
      } catch (error) {
        console.error("Error loading tech icons:", error);
        // Fallback to default icons if loading fails
        setTechIcons(safeStackLocal.slice(0, 3).map(tech => ({ tech, url: "/tech.svg" })));
      } finally {
        setIsLoading(false);
      }
    };

    if (safeStackLocal.length > 0) {
      loadTechIcons();
    } else {
      setIsLoading(false);
    }
  }, [techStack, mounted]);

  // Always render the same structure to prevent hydration mismatch
  const safeStack = techStack ?? [];
  const displayTechStack = safeStack.slice(0, 3);

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-row">
        {displayTechStack.map((tech, index) => (
          <div
            key={tech}
            className={cn(
              "relative group flex flex-center rounded-md border border-border bg-white p-2 hover:border-slate-400 hover:z-10",
              index >= 1 && "-ml-3"
            )}
          >
            <span className="tech-tooltip whitespace-nowrap">{tech}</span>

            <Image
              src="/tech.svg"
              alt={tech}
              width={100}
              height={100}
              className="size-5"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-row">
      {techIcons.slice(0, 3).map(({ tech, url }, index) => (
        <div
          key={tech}
          className={cn(
            "relative group flex flex-center rounded-md border border-border bg-white p-2 hover:border-slate-400 hover:z-10",
            index >= 1 && "-ml-3"
          )}
        >
          <span className="tech-tooltip">{tech}</span>

          <Image
            src={url}
            alt={tech}
            width={100}
            height={100}
            className="size-5"
          />
        </div>
      ))}
    </div>
  );
};

export default DisplayTechIcons;
