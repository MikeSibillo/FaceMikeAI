import type { ComponentType, SVGProps } from "react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export function IconHome(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSpark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2l1.3 5.2L18 9l-4.7 1.8L12 16l-1.3-5.2L6 9l4.7-1.8L12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M5 14l.8 3.2L9 18l-3.2.8L5 22l-.8-3.2L1 18l3.2-.8L5 14Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}

export function IconList(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 7h13M8 12h13M8 17h13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.5 7h.01M4.5 12h.01M4.5 17h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSliders(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 6h10M18 6h2M4 12h2m6 0h10M4 18h6m6 0h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM10 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM16 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function IconFlag(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 21V4a1 1 0 0 1 1-1h11l-1.4 3H20v10h-7l1.4-3H6v8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const navItems: NavItem[] = [
  { href: "/", label: "Home", shortLabel: "Home", Icon: IconHome },
  {
    href: "/decisioni/nuova",
    label: "Nuova decisione",
    shortLabel: "Nuova",
    Icon: IconSpark,
  },
  { href: "/log", label: "Log decisionale", shortLabel: "Log", Icon: IconList },
  {
    href: "/vincoli",
    label: "Vincoli",
    shortLabel: "Vincoli",
    Icon: IconSliders,
  },
  {
    href: "/escalation",
    label: "Escalation",
    shortLabel: "Aiuto",
    Icon: IconFlag,
  },
];

