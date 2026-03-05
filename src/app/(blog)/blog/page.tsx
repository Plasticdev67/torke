import type { Metadata } from "next";
import { getAllPosts } from "@/lib/mdx";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogCategoryFilter } from "@/components/blog/BlogCategoryFilter";

export const metadata: Metadata = {
  title: "Technical Blog",
  description:
    "Engineering articles on anchor design, EN 1992-4, embedment depth, and construction fixings from Torke.",
};

export default function BlogListingPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          <span className="inline-block w-1.5 h-8 bg-[#C41E3A] mr-4 align-middle" />
          Technical Blog
        </h1>
        <p className="text-[#999] max-w-2xl">
          Engineering insights on anchor design, Eurocode compliance, and
          construction fixings. Written by structural engineers, for structural
          engineers.
        </p>
      </div>

      {/* Category filter + Grid */}
      <BlogCategoryFilter posts={posts} />
    </div>
  );
}
