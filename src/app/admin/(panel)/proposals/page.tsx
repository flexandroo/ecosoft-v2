import type { Metadata } from "next";
import { ComingSoon } from "../coming-soon";

export const metadata: Metadata = { title: "Генератор КП" };

export default function Page() {
  return (
    <ComingSoon
      title="Генератор КП"
      description="Комерційні пропозиції для клієнтів"
      planned={["Збирання КП з товарів каталогу та послуг монтажу","Знижки, умови оплати й доставки","Експорт у PDF і надсилання клієнту","Привʼязка КП до заявки чи клієнта"]}
    />
  );
}
