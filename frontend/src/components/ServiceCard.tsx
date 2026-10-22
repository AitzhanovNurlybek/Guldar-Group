import Link from "next/link";
import { Icon, WhatsAppIcon, type IconName } from "./Icons";
import { waLink } from "@/lib/site";
import { getServiceHref } from "@/lib/service-details";

export function IconTile({ name, size = "md" }: { name: IconName; size?: "sm" | "md" }) {
  return <span className={`icon-tile ${size === "sm" ? "size-10" : "size-12"}`}><Icon name={name} className={size === "sm" ? "size-5" : "size-6"} /></span>;
}

export function ServiceCard({ slug, title, text, price, icon, compact = false, number }: {
  slug?: string; title: string; text: string; price?: string; icon: IconName; compact?: boolean; number?: number;
}) {
  const detailHref = slug ? getServiceHref(slug) : undefined;
  const className = "panel lift service-card group flex h-full flex-col";
  const content = <>
    <div className="flex items-start justify-between gap-3"><IconTile name={icon} />{number && <span className="service-number">0{number}</span>}</div>
    <h3 className="mt-6 text-lg leading-snug font-bold tracking-[-0.025em]">{title}</h3>
    {!compact && <p className="mt-3 flex-1 text-sm leading-relaxed text-fg-2">{text}</p>}
    {price && <p className="mt-4 text-xs font-semibold text-fg-2">Ориентир: {price}</p>}
    <span className="service-link">{detailHref ? "Подробнее об услуге" : <><WhatsAppIcon className="size-4" />Обсудить в WhatsApp</>}<Icon name="arrowUpRight" className="ml-auto size-4 transition-transform group-hover:translate-x-0.5" /></span>
  </>;
  return detailHref ? <Link href={detailHref} className={className}>{content}</Link> : <a href={waLink(`Здравствуйте! Интересует: ${title.toLowerCase()}. Можно обсудить?`)} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>;
}
