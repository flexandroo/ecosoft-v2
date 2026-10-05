import type { Metadata } from "next";
import { ComingSoon } from "../coming-soon";

export const metadata: Metadata = { title: "Налаштування" };

export default function Page() {
  return (
    <ComingSoon
      title="Налаштування"
      description="Загальні параметри магазину"
      planned={["Телефони, адреса, графік роботи","Telegram-сповіщення: куди і про що","Підключення реклами та аналітики (лише перегляд)"]}
    />
  );
}
