import type { Metadata } from "next";
import { ComingSoon } from "../coming-soon";

export const metadata: Metadata = { title: "Сторінки" };

export default function Page() {
  return (
    <ComingSoon
      title="Сторінки"
      description="Тексти інформаційних сторінок сайту"
      planned={["Про нас, Доставка й оплата, Повернення, Контакти","Редагування заголовків, текстів і SEO-полів","Попередній перегляд перед публікацією"]}
    />
  );
}
