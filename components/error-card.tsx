import { Card } from "@/components/ui/card";

export function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <Card className="border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
      <p className="font-medium">{title}</p>
      <p className="mt-1">{message}</p>
    </Card>
  );
}
