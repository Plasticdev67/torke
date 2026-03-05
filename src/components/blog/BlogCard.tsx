import Link from "next/link";
import type { PostMeta } from "@/lib/mdx";

const categoryLabels: Record<string, string> = {
  "technical-guide": "Technical Guide",
  "product-comparison": "Product Comparison",
  "specification-guidance": "Specification Guidance",
  "eurocode-explainer": "Eurocode Explainer",
};

export function BlogCard({ post }: { post: PostMeta }) {
  const formattedDate = new Date(post.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-zinc-900 border border-[#333] rounded-lg p-6 hover:-translate-y-1 hover:border-[#C41E3A]/40 transition-all duration-300"
    >
      {/* Category badge */}
      <span className="inline-block text-xs font-medium uppercase tracking-wider text-[#C41E3A] mb-3">
        {categoryLabels[post.category] ?? post.category}
      </span>

      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#C41E3A] transition-colors line-clamp-2">
        {post.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-[#999] mb-4 line-clamp-3">
        {post.description}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-[#666]">
        <time dateTime={post.date}>{formattedDate}</time>
        <span className="w-1 h-1 rounded-full bg-[#666]" />
        <span>{post.readingTime} min read</span>
      </div>
    </Link>
  );
}
