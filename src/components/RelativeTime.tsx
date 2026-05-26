import { formatDistanceToNow, format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

export function RelativeTime({ date }: { date: string | Date }) {
  const { i18n } = useTranslation();
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = i18n.language === "pt" ? ptBR : enUS;
  return (
    <time
      dateTime={d.toISOString()}
      title={format(d, "PPpp", { locale })}
      className="cursor-help"
    >
      {formatDistanceToNow(d, { addSuffix: true, locale })}
    </time>
  );
}
