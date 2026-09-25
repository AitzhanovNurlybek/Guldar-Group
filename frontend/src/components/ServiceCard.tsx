import { Icon, WhatsAppIcon, type IconName } from "./Icons";
import { waLink } from "@/lib/site";

export function IconTile({ name }: { name: IconName }) {
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line-strong bg-gradient-to-br from-sky-400/25 to-steel-600/30 text-ice-300 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]">
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
    <article className="glass lift group flex h-full flex-col rounded-[26px] p-6">
      <div className="flex items-start justify-between gap-4">
        <IconTile name={icon} />
        {price && (
          <span className="rounded-full border border-line bg-white/[0.04] px-3 py-1 text-xs font-semibold text-ice-300">
            {price}
          </span>
        )}
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em]">{title}</h3>
      <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-fg-2">{text}</p>
      <a
        href={waLink(`Здравствуйте! Интересует: ${title.toLowerCase()}. Можно обсудить?`)}
        target="_blank"
        rel="noopener"
        className="mt-5 inline-flex items-center gap-2 self-start text-sm font-semibold text-sky-400 transition-colors hover:text-ice-300"
      >
        <WhatsAppIcon className="size-4" />
        Обсудить
        <Icon name="arrow" className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </a>
    </article>
  );
}
