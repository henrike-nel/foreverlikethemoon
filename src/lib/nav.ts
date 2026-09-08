export const NAV = [
  { href: "/store", label: "Store" },
  { href: "/lookbook", label: "Lookbook" },
  { href: "/about", label: "About" },
  { href: "/stationery", label: "Stationery" },
  { href: "/websites", label: "Websites" },
  { href: "/contact", label: "Contact" },
] as const;

export const LEGAL = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
] as const;

export function isCurrentPath(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (href === "/") {
    return path === "/";
  }

  return path === href || path.startsWith(`${href}/`);
}
