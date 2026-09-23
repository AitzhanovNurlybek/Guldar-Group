export function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-line p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-subtle">{text}</p>
    </div>
  );
}
