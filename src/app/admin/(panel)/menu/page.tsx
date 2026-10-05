import type { Metadata } from "next";
import { ComingSoon } from "../coming-soon";

export const metadata: Metadata = { title: "Меню сайту" };

export default function Page() {
  return (
    <ComingSoon
      title="Меню сайту"
      description="Пункти верхнього меню і футера"
      planned={["Додавання, перейменування і порядок пунктів","Посилання на категорії, сторінки та рішення"]}
    />
  );
}
