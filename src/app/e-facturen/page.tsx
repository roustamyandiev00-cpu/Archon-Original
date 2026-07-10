import { redirect } from "next/navigation";

/** Publieke URL voor e-facturatie — doorverwijzing naar de marketingpagina. */
export default function EFacturenPublicPage() {
  redirect("/functies/peppol");
}
