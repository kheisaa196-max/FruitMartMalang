import { Badge, Tag } from "antd";
import type { StatusMakan } from "@/types/database";

interface StatusBadgeProps {
  status: StatusMakan;
  showDot?: boolean;
}

const config: Record<
  StatusMakan,
  { color: string; text: string; dotStatus: "default" | "processing" | "success" | "error" | "warning" }
> = {
  Pending: {
    color: "warning",
    text: "Dipesan",
    dotStatus: "warning",
  },
  Proses: {
    color: "processing",
    text: "Dimasak",
    dotStatus: "processing",
  },
  Selesai: {
    color: "success",
    text: "Diambil",
    dotStatus: "success",
  },
};

export default function StatusBadge({ status, showDot = false }: StatusBadgeProps) {
  const { color, text, dotStatus } = config[status];

  if (showDot) {
    return <Badge status={dotStatus} text={text} />;
  }

  return (
    <Tag color={color} className="font-medium rounded-full px-3">
      {text}
    </Tag>
  );
}
