export type SmtpPreset = "gmail" | "custom";

export const GMAIL_SMTP = {
  smtp_host: "smtp.gmail.com",
  smtp_port: 587,
} as const;
