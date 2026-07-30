import type { ProfileContact } from "@/sanity/types";

const ICONS: Record<
  keyof Omit<ProfileContact, "email" | "phone" | "location">,
  { label: string; path: string }
> = {
  github: {
    label: "GitHub",
    path: "M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-.89-.01-1.75-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.5A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z",
  },
  linkedin: {
    label: "LinkedIn",
    path: "M6.94 5a2 2 0 1 1-4-.02 2 2 0 0 1 4 .02ZM7 8.48H3V21h4V8.48Zm6.32 0H9.35V21h3.94v-6.57c0-3.66 4.77-3.96 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.68-2.91V8.48Z",
  },
  facebook: {
    label: "Facebook",
    path: "M13.5 21v-7.5H16l.5-3.5h-3V7.9c0-1 .28-1.7 1.73-1.7H16.6V3.14C16.29 3.1 15.24 3 14.02 3 11.5 3 9.8 4.53 9.8 7.6v2.4H7v3.5h2.8V21h3.7Z",
  },
  instagram: {
    label: "Instagram",
    path: "M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.21.6 1.76 1.15.5.5.9 1.1 1.15 1.76.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.13s-.01 3.07-.06 4.13c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.76c-.5.5-1.1.9-1.76 1.15-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.07-.01-4.13-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.76-1.15 4.9 4.9 0 0 1-1.15-1.76c-.25-.64-.42-1.37-.47-2.43C2.01 15.07 2 14.73 2 12s.01-3.07.06-4.13c.05-1.06.22-1.79.47-2.43.26-.66.6-1.21 1.15-1.76A4.9 4.9 0 0 1 5.44 2.53c.64-.25 1.37-.42 2.43-.47C8.93 2.01 9.27 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.25A3.25 3.25 0 1 1 12 8.75a3.25 3.25 0 0 1 0 6.5ZM17.25 5.5a1.19 1.19 0 1 0 0 2.38 1.19 1.19 0 0 0 0-2.38Z",
  },
  tiktok: {
    label: "TikTok",
    path: "M16.6 2h-3.2v13.6a2.9 2.9 0 1 1-2.05-2.77V9.6a6.1 6.1 0 1 0 5.25 6.05V8.3a7.9 7.9 0 0 0 4.6 1.47V6.55a4.6 4.6 0 0 1-4.6-4.55Z",
  },
};

export function SocialLinks({
  contact,
  bgClassName = "bg-neutral-100 dark:bg-neutral-800",
}: {
  contact?: ProfileContact;
  bgClassName?: string;
}) {
  if (!contact) return null;

  const entries = (Object.keys(ICONS) as (keyof typeof ICONS)[]).filter(
    (key) => contact[key],
  );
  if (entries.length === 0) return null;

  return (
    <ul className="flex items-center gap-3">
      {entries.map((key) => {
        const icon = ICONS[key];
        return (
          <li key={key}>
            <a
              href={contact[key]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={icon.label}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-900 hover:text-white dark:text-neutral-300 dark:hover:bg-white dark:hover:text-neutral-900 ${bgClassName}`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d={icon.path} />
              </svg>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
