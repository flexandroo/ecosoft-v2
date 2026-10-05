import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { postStatus } from "@/lib/posts-shared";
import { createSessionClient } from "@/lib/supabase/server";
import { PageTitle } from "../../ui";
import { PostForm, type EditablePost } from "./post-form";

export const metadata: Metadata = { title: "Запис блогу" };

export default async function PostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "id, slug, kind, title, excerpt, body, cover_image, gallery, location, related_href, related_label, seo_title, meta_description, is_published, published_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const post = { ...data, gallery: Array.isArray(data.gallery) ? data.gallery : [] } as EditablePost;
  const status = postStatus(post);

  return (
    <>
      <Link href="/admin/blog" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Блог і кейси
      </Link>
      <PageTitle
        title={post.title}
        subtitle={
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.tone}`}>{status.label}</span>
        }
      />
      <PostForm key={post.id} post={post} livePath={status.label === "Опубліковано" ? `/blog/${post.slug}` : null} />
    </>
  );
}
