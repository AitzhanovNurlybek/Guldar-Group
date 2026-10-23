import Image from "next/image";
import { clients } from "@/lib/site";

export function ClientLogos({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <ul className={`client-logos ${size === "lg" ? "client-logos-large" : ""}`} aria-label="Компании, для которых мы выполняли работы">
      {clients.map((client) => <li key={client.name}>
        <div className="client-logo-image"><Image src={client.logo} alt={client.name} fill sizes="(max-width: 639px) 42vw, (max-width: 1023px) 28vw, 200px" className="object-contain" /></div>
        <span>{client.name}</span>
      </li>)}
    </ul>
  );
}
