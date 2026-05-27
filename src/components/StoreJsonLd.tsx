interface Product {
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
}

interface Props {
  storeName: string;
  storeDescription: string | null;
  storeUrl: string;
  products: Product[];
}

/**
 * JSON-LD structured data untuk storefront.
 * Membantu Google menampilkan rich results (product carousel, local business).
 */
export default function StoreJsonLd({ storeName, storeDescription, storeUrl, products }: Props) {
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: storeName,
    description: storeDescription ?? `Toko digital ${storeName}`,
    url: storeUrl,
  };

  const productList = products.slice(0, 10).map((p) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description ?? p.name,
    image: p.imageUrl ?? undefined,
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
    },
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      {productList.map((p, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(p) }}
        />
      ))}
    </>
  );
}
