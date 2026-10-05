import type { Metadata } from "next";
import { ComingSoon } from "../coming-soon";

export const metadata: Metadata = { title: "Категорії" };

export default function Page() {
  return (
    <ComingSoon
      title="Категорії"
      description="Структура каталогу"
      planned={["Назви, описи та зображення категорій","Порядок категорій у каталозі","SEO-тексти категорій"]}
    />
  );
}
