import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAllPosts, getPostBySlug } from "@/lib/mdx";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const categoryLabels: Record<string, string> = {
  "technical-guide": "Technical Guide",
  "product-comparison": "Product Comparison",
  "specification-guidance": "Specification Guidance",
  "eurocode-explainer": "Eurocode Explainer",
};

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: `${post.title} | Torke Blog`,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Dynamic import of the MDX component
  let MdxContent: React.ComponentType;
  try {
    const mod = await import(`@/../content/blog/${slug}.mdx`);
    MdxContent = mod.default;
  } catch {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link
              href="/"
              className="text-[#999] hover:text-white transition-colors"
            >
              Home
            </Link>
          </li>
          <li className="text-[#666]">/</li>
          <li>
            <Link
              href="/blog"
              className="text-[#999] hover:text-white transition-colors"
            >
              Blog
            </Link>
          </li>
          <li className="text-[#666]">/</li>
          <li className="text-white font-medium truncate max-w-[300px]">
            {post.title}
          </li>
        </ol>
      </nav>

      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to blog
      </Link>

      {/* Article header */}
      <header className="mb-10">
        <span className="inline-block text-xs font-medium uppercase tracking-wider text-[#C41E3A] mb-3">
          {categoryLabels[post.category] ?? post.category}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-[#999]">
          <span>{post.author}</span>
          <span className="w-1 h-1 rounded-full bg-[#666]" />
          <time dateTime={post.date}>{formattedDate}</time>
          <span className="w-1 h-1 rounded-full bg-[#666]" />
          <span>{post.readingTime} min read</span>
        </div>
      </header>

      {/* MDX Content */}
      <article className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-headings:font-bold prose-p:text-[#B3B3B3] prose-p:leading-relaxed prose-a:text-[#C41E3A] prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-li:text-[#B3B3B3] prose-code:text-[#C41E3A] prose-code:bg-[#1A1A1A] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-[#C41E3A] prose-blockquote:text-[#999] prose-hr:border-[#333] prose-th:text-white prose-td:text-[#B3B3B3]">
        <MdxContent />
      </article>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-12 pt-8 border-t border-[#333]">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs bg-[#1A1A1A] text-[#999] border border-[#333] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
