import type {
  WithContext,
  Product,
  Article,
  Organization,
  BreadcrumbList,
  FAQPage,
  HowTo,
} from "schema-dts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://torke.co.uk";

export function productSchema(product: {
  name: string;
  sku: string;
  description?: string | null;
  images?: string[] | null;
  pricePence?: number | null;
}): WithContext<Product> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description ?? undefined,
    brand: {
      "@type": "Brand",
      name: "Torke",
    },
    manufacturer: {
      "@type": "Organization",
      name: "Torke",
    },
    image: product.images?.map((img) => `${SITE_URL}/${img.replace(/\\/g, "/")}`) ?? [],
    ...(product.pricePence != null
      ? {
          offers: {
            "@type": "Offer",
            price: (product.pricePence / 100).toFixed(2),
            priceCurrency: "GBP",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

export function articleSchema(post: {
  title: string;
  description: string;
  date: string;
  slug: string;
}): WithContext<Article> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: `${SITE_URL}/blog/${post.slug}`,
    author: {
      "@type": "Organization",
      name: "Torke",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Torke",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
  };
}

export function organizationSchema(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Torke",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "sales@torke.co.uk",
    },
    description:
      "Professional construction fixings with full mill-to-site batch traceability and verifiable EN 10204 3.1 certification.",
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[]
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function faqSchema(
  items: { question: string; answer: string }[]
): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function howToSchema(steps: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}): WithContext<HowTo> {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: steps.name,
    description: steps.description,
    step: steps.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}
