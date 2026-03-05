import type { Metadata } from "next";
import { GlossarySearch, type GlossaryTerm } from "@/components/blog/GlossarySearch";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema } from "@/lib/schema-markup";
import glossaryData from "../../../../content/glossary.json";

const terms = glossaryData as GlossaryTerm[];

export const metadata: Metadata = {
  title: "Technical Glossary | Torke",
  description:
    "Comprehensive glossary of anchor design, construction fixings, and engineering terminology. Definitions for EN 1992-4, ETA, embedment depth, concrete cone breakout, and more.",
  keywords: terms.map((t) => t.term).join(", "),
};

export default function GlossaryPage() {
  // Build FAQ structured data from glossary terms
  const faqItems = terms.map((t) => ({
    question: `What is ${t.term}?`,
    answer: t.definition,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <JsonLd data={faqSchema(faqItems)} />

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          <span className="inline-block w-1.5 h-8 bg-[#C41E3A] mr-3 align-middle" />
          Technical Glossary
        </h1>
        <p className="text-[#999] text-lg max-w-2xl">
          Key terms and definitions for anchor design, construction fixings
          engineering, and European technical standards.
        </p>
      </div>

      {/* Glossary search and terms */}
      <GlossarySearch terms={terms} />
    </div>
  );
}
