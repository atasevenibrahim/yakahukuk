// Sabit kurum bilgileri. İleride SiteSettings tablosundan gelecek.
export const site = {
  phone: "0312 215 80 85",
  phoneHref: "tel:+903122158085",
  email: "info@yakahukuk.com",
  emailHref: "mailto:info@yakahukuk.com",
  // Gerçek WhatsApp numarası sonradan bağlanacak.
  whatsappHref: "#",
  address: {
    line1: "Beştepe, Meriç Sk. No:54/A",
    line2: "Yenimahalle / Ankara",
  },
  location: "ANKARA · BEŞTEPE",
} as const;
