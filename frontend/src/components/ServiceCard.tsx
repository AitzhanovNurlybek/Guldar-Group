import { Icon, WhatsAppIcon, type IconName } from "./Icons";
import { waLink } from "@/lib/site";

export function IconTile({ name }: { name: IconName }) {
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-md border border-line-strong bg-steel-600/40 text-ice-300">
      <Icon name={name} className="size-[1.35rem]" />
    </span>
  );
}

export function ServiceCard({
  title,
  text,
  price,
  icon,
}: {
  title: string;
  text: string;
  price?: string;
  icon: IconName;
}) {
  return (
    <article className="panel lift group flex h-full flex-col rounded-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <IconTile name={icon} />
        {price && (
          <span className="rounded-sm border border-safety/40 bg-safety/10 px-2.5 py-1 font-display text-sm font-medium tracking-[0.04em] text-safety">
            {price}
          </span>
        )}
      </div>
      <h3 className="mt-5 font-display text-[1.35rem] leading-tight font-medium tracking-[0.02em] uppercase">{title}</h3>
      <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-fg-2">{text}</p>
      <a
        href={waLink(`Здравствуйте! Интересует: ${title.toLowerCase()}. Можно обсудить?`)}
        target="_blank"
        rel="noopener"
        className="mt-5 inline-flex items-center gap-2 self-start font-display text-sm font-medium tracking-[0.08em] text-safety uppercase transition-colors hover:text-fg"
      >
        <WhatsAppIcon className="size-4" />
        Обсудить
        <Icon name="arrow" className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </a>
    </article>
  );
}
