import type { Metadata } from "next";
import { ComingSoon } from "../coming-soon";

export const metadata: Metadata = { title: "Блог і кейси" };

export default function Page() {
  return (
    <ComingSoon
      title="Блог і кейси"
      description="Статті та приклади виконаних робіт"
      planned={["Створення і редагування статей","Кейси з фото обʼєктів","SEO-поля і дата публікації"]}
    />
  );
}
