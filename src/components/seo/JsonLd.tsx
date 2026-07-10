type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Structured data (JSON-LD) voor Google rich results. */
export default function JsonLd({ data }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
