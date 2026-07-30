"use client";

import Link from "next/link";
import { useState } from "react";

import { SocialLinks } from "@/components/social-links";
import { navLinks, studioLink } from "@/lib/navigation";
import type { ProfileContact } from "@/sanity/types";

export function SiteHeader({ contact }: { contact?: ProfileContact }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-7xl px-4 text-sm sm:px-6 lg:px-8">
      <nav
        className="relative flex w-full items-center justify-between rounded-[36px] border border-yellow-100/40 bg-yellow-50/60 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8 dark:border-neutral-700/40 dark:bg-neutral-800/80"
        aria-label="Global"
      >
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100"
        >
          HOME
        </Link>

        <div className="hidden items-center gap-8 sm:flex">
          <ul className="flex items-center gap-6 text-sm font-bold text-neutral-600 dark:text-neutral-300">
            {navLinks.map((link) => (
              <li key={link.url}>
                <Link
                  href={link.url}
                  className="transition-colors hover:text-neutral-900 dark:hover:text-white"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          <SocialLinks contact={contact} bgClassName="bg-yellow-50/60 dark:bg-neutral-800/80" />
          <Link
            href={studioLink.url}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {studioLink.name}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 sm:hidden dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="mt-2 rounded-[28px] border border-yellow-100/40 bg-yellow-50/60 px-4 py-4 backdrop-blur-md sm:hidden dark:border-neutral-700/40 dark:bg-neutral-800/80">
          <ul className="flex flex-col gap-4 text-sm font-bold text-neutral-600 dark:text-neutral-300">
            {navLinks.map((link) => (
              <li key={link.url}>
                <Link href={link.url} onClick={() => setOpen(false)}>
                  {link.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={studioLink.url}
                onClick={() => setOpen(false)}
                className="font-semibold text-neutral-900 dark:text-neutral-100"
              >
                {studioLink.name}
              </Link>
            </li>
          </ul>
          <div className="mt-4">
            <SocialLinks contact={contact} bgClassName="bg-yellow-50/60 dark:bg-neutral-800/80" />
          </div>
        </div>
      )}
    </header>
  );
}
