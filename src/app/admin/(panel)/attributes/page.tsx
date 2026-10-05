import type { Metadata } from "next";
import { ComingSoon } from "../coming-soon";

export const metadata: Metadata = { title: "Характеристики" };

export default function Page() {
  return (
    <ComingSoon
      title="Характеристики"
      description="Фільтри та характеристики товарів"
      planned={["Довідник характеристик (ступені, продуктивність тощо)","Які фільтри показувати в кожній категорії","Значення характеристик у товарах"]}
    />
  );
}
