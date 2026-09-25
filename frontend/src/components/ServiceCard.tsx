import { Icon, WhatsAppIcon, type IconName } from "./Icons";
import { waLink } from "@/lib/site";

export function IconTile({ name, size = "md" }: { name: IconName; size?: "sm" | "md" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl border border-line-strong bg-steel-600/40 text-ice-300 ${
        size === "sm" ? "size-10" : "size-12"
      }`}
    >
      <Icon name={name} className={size === "sm" ? "size-[1.15rem]" : "size-[1.35rem]"} />
    </span>
  );
}

// Карточка услуги. compact — без описания: для главной, где важнее быстро пробежать глазами
export function ServiceCard({
  title,
  text,
  price,
  icon,
  compact = false,
}: {
  title: string;
  text: string;
  price?: string;
  icon: IconName;
  compact?: boolean;
}) {
  return (
    <a
      href={waLink(`Здравствуйте! Интересует: ${title.toLowerCase()}. Можно обсудить?`)}
      target="_blank"
      rel="noopener"
      className="panel lift group flex h-full flex-col rounded-2xl p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <IconTile name={icon} />
        {price && (
          <span className="rounded-lg bg-safety/12 px-2.5 py-1 text-sm font-bold text-safety">{price}</span>
        )}
      </div>
      <h3 className="mt-5 text-lg leading-snug font-bold tracking-[-0.015em]">{title}</h3>
      {!compact && <p className="mt-1.5 flex-1 text-[0.95rem] leading-relaxed text-fg-2">{text}</p>}
      <span className="mt-4 inline-flex items-center gap-2 self-start text-sm font-bold text-safety transition-colors group-hover:text-fg">
        <WhatsAppIcon className="size-4" />
        Обсудить
        <Icon name="arrow" className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </a>
  );
}
