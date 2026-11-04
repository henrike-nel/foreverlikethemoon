import { CONTACT, SITE_NAME, SITE_TAGLINE } from "./site";
import { stockAvailabilityUrl, type Stock } from "./stock";

export function organizationLocalBusiness(site: URL): object {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    name: SITE_NAME,
    description: SITE_TAGLINE,
    url: site.origin,
    email: CONTACT.email,
    telephone: CONTACT.phoneHref.replace("tel:", ""),
    address: {
      "@type": "PostalAddress",
      addressLocality: CONTACT.locality,
      addressRegion: CONTACT.region,
      addressCountry: CONTACT.country,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: CONTACT.opens,
      closes: CONTACT.closes,
    },
  };
}

export function productOffer(input: {
  name: string;
  description: string;
  url: string;
  images: string[];
  priceCents: number;
  currency: "ZAR";
  stock: Stock;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.images,
    offers: {
      "@type": "Offer",
      url: input.url,
      priceCurrency: input.currency,
      price: (input.priceCents / 100).toFixed(2),
      availability: stockAvailabilityUrl(input.stock),
    },
  };
}
