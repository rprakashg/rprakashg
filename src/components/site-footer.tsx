import { NewsletterForm } from "@/components/newsletter-form";
import { SocialLinks } from "@/components/social-links";
import type { ProfileContact } from "@/sanity/types";

export function SiteFooter({ contact }: { contact?: ProfileContact }) {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-300 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Ram's Blog
            </span>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Writing about my journey in the world of kubernetes, servicemesh and 
              distributed systems in general
            </p>
          </div>
          <div className="col-span-2 ml-auto w-full max-w-lg sm:col-span-2">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Stay up to date
            </h3>
            <NewsletterForm />
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            &copy; {new Date().getFullYear()} Ram Gopinathan. All rights reserved.
          </p>
          <SocialLinks contact={contact} bgClassName="bg-neutral-300 dark:bg-neutral-900" />
        </div>
      </div>
    </footer>
  );
}
