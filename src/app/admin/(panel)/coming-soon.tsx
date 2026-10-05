import { Construction } from "lucide-react";
import { Card, PageTitle } from "./ui";

/** Placeholder for admin sections that are planned but not built yet. */
export function ComingSoon({ title, description, planned }: { title: string; description: string; planned: string[] }) {
  return (
    <>
      <PageTitle title={title} subtitle={description} />
      <Card className="max-w-2xl">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <Construction className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Розділ у розробці</p>
            <p className="mt-1 text-sm text-muted-foreground">Що тут буде:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {planned.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </>
  );
}
