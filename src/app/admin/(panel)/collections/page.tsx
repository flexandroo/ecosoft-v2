import type { Metadata } from "next";
import { ComingSoon } from "../coming-soon";

export const metadata: Metadata = { title: "Підбірки" };

export default function Page() {
  return (
    <ComingSoon
      title="Підбірки"
      description="Добірки товарів для головної та сторінок рішень"
      planned={["Хіти продажів, акції, новинки","Ручний порядок товарів у підбірці","Показ підбірки на головній або на сторінці рішення"]}
    />
  );
}
