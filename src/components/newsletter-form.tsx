"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Placeholder handler — no email provider is wired up yet, so this just
  // acknowledges the submission locally until the subscribe endpoint exists.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mt-4 flex flex-col items-center gap-2 rounded-lg bg-neutral-200 p-2 sm:flex-row sm:gap-3 dark:bg-neutral-800">
        <div className="w-full">
          <label htmlFor="footer-email" className="sr-only">
            Email
          </label>
          <input
            type="email"
            id="footer-email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitted}
            className="block w-full rounded-lg border-transparent bg-neutral-100 px-4 py-3 text-sm text-neutral-600 caret-orange-400 focus:border-orange-400 focus:ring-orange-400 disabled:pointer-events-none disabled:opacity-50 dark:border-transparent dark:bg-neutral-700 dark:text-gray-300 dark:placeholder:text-neutral-300"
            placeholder="Enter your email"
          />
        </div>
        <button
          type="submit"
          disabled={submitted}
          className="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-transparent bg-orange-400 p-3 text-sm font-bold whitespace-nowrap text-neutral-50 ring-zinc-500 transition duration-300 outline-hidden hover:bg-orange-500 focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 sm:w-auto dark:ring-zinc-200 dark:focus:ring-1 dark:focus:outline-hidden"
        >
          Subscribe
        </button>
      </div>
      <p
        className="mt-2 text-sm text-neutral-600 dark:text-neutral-400"
        aria-live="polite"
      >
        {submitted
          ? "Thanks! We'll notify you when new posts are published."
          : "Get notified whenever a new post goes live."}
      </p>
    </form>
  );
}
