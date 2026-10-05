import type { Metadata } from "next";
import { requireStaff } from "@/lib/admin/auth";
import { BLOG_POSTS } from "@/lib/blog";
import { DEFAULT_CATEGORIES } from "@/lib/categories-shared";
import { mergeMenus } from "@/lib/menus-shared";
import { SOLUTIONS } from "@/lib/solutions";
import { createSessionClient } from "@/lib/supabase/server";
import { PageTitle } from "../ui";
import { MenuEditor, type LinkOptionGroup } from "./menu-editor";

export const metadata: Metadata = { title: "Меню сайту" };

const PAGES = [
  { href: "/", label: "Головна" },
  { href: "/catalog", label: "Каталог" },
  { href: "/solutions", label: "Рішення" },
  { href: "/delivery", label: "Доставка і оплата" },
  { href: "/returns", label: "Повернення та обмін" },
  { href: "/blog", label: "Блог" },
  { href: "/about", label: "Про нас" },
  { href: "/contacts", label: "Контакти" },
  { href: "/privacy", label: "Політика конфіденційності" },
];

export default async function MenuPage() {
  await requireStaff();
  const supabase = await createSessionClient();
  const [{ data: menuRows }, { data: categoryRows }] = await Promise.all([
    supabase.from("site_menus").select("key, items"),
    supabase.from("categories").select("key, title, short_title, is_hidden").order("sort"),
  ]);
  const menus = mergeMenus(Object.fromEntries((menuRows ?? []).map((row) => [row.key, row.items])));
  const categories = categoryRows?.length
    ? categoryRows
    : DEFAULT_CATEGORIES.map((c) => ({ key: c.key, title: c.title, short_title: c.short, is_hidden: false }));

  const options: LinkOptionGroup[] = [
    { title: "Сторінки", links: PAGES },
    {
      title: "Категорії",
      links: categories.map((c) => ({
        href: `/catalog/${c.key}`,
        label: c.title,
        note: c.is_hidden ? "прихована на сайті" : undefined,
      })),
    },
    { title: "Рішення", links: SOLUTIONS.map((s) => ({ href: `/solutions/${s.slug}`, label: s.title })) },
    { title: "Блог", links: BLOG_POSTS.map((p) => ({ href: `/blog/${p.slug}`, label: p.title })) },
  ];

  return (
    <>
      <PageTitle
        title="Меню сайту"
        subtitle="Посилання у шапці і футері. Кнопка «Каталог» у шапці будується з розділу «Категорії»."
      />
      <MenuEditor initial={menus} options={options} />
    </>
  );
}
