import ContactForm from "@/components/dashboard/ContactForm";

export const metadata = { title: "Contacten — ArchonPro" };

export default function ContactenPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <ContactForm />
    </div>
  );
}
