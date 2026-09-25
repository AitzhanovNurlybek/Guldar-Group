export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[74rem] px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

// Заголовок раздела с номером — как пункт в проектной документации: «02 / Услуги»
export function SectionHead({
  index,
  eyebrow,
  title,
  lead,
  className = "",
}: {
  index?: string;
  eyebrow?: string;
  title: React.ReactNode;
  lead?: string;
  className?: string;
}) {
  return (
    <div className={`max-w-2xl ${className}`}>
      {eyebrow && (
        <p className="eyebrow">
          {index && <span className="text-fg-3">{index} /</span>}
          {eyebrow}
        </p>
      )}
      <h2 className="title mt-4">{title}</h2>
      {lead && <p className="mt-4 text-lg leading-relaxed text-fg-2">{lead}</p>}
    </div>
  );
}
