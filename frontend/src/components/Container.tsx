export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[74rem] px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function SectionHead({
  eyebrow,
  title,
  lead,
  className = "",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: string;
  className?: string;
}) {
  return (
    <div className={`max-w-2xl ${className}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="title mt-3">{title}</h2>
      {lead && <p className="mt-3 text-lg leading-relaxed text-fg-2">{lead}</p>}
    </div>
  );
}
