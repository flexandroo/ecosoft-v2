import type { Metadata } from "next";
import { ComingSoon } from "../coming-soon";

export const metadata: Metadata = { title: "Медіатека" };

export default function Page() {
  return (
    <ComingSoon
      title="Медіатека"
      description="Усі завантажені зображення"
      planned={["Перегляд і пошук завантажених фото","Повторне використання в товарах і банерах","Видалення невикористаних файлів"]}
    />
  );
}
