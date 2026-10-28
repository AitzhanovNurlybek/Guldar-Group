import { Icon, WhatsAppIcon } from "./Icons";
import { site, waGreeting, waLink } from "@/lib/site";

export function ContactDock() {
  return <aside className="contact-dock" aria-label="Быстрая связь с GulDar Group">
    <a
      href={`tel:${site.technicalTel}`}
      className="contact-dock-action contact-dock-phone"
      aria-label={`Позвонить техническому специалисту: ${site.technicalPhone}`}
      title="Позвонить техническому специалисту"
    >
      <Icon name="phone" /><span>Позвонить</span>
    </a>
    <a
      href={waLink(waGreeting)}
      target="_blank"
      rel="noopener noreferrer"
      className="contact-dock-action contact-dock-whatsapp"
      aria-label="Написать в WhatsApp"
    >
      <WhatsAppIcon /><span>WhatsApp</span>
    </a>
  </aside>;
}
