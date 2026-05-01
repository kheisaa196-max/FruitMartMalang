import { Steps } from "antd";
import { ShoppingCartOutlined, FireOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { StatusMakan } from "@/types/database";

interface MealStatusStepsProps {
  status: StatusMakan;
  size?: "default" | "small";
}

const stepIndex: Record<StatusMakan, number> = {
  Pending: 0,
  Proses: 1,
  Selesai: 2,
};

export default function MealStatusSteps({ status, size = "default" }: MealStatusStepsProps) {
  const current = stepIndex[status];

  return (
    <Steps
      current={current}
      size={size}
      items={[
        {
          title: "Dipesan",
          description: size === "default" ? "Guru input porsi" : undefined,
          icon: <ShoppingCartOutlined />,
          status: current > 0 ? "finish" : current === 0 ? "process" : "wait",
        },
        {
          title: "Dimasak",
          description: size === "default" ? "Dapur memproses" : undefined,
          icon: <FireOutlined />,
          status: current > 1 ? "finish" : current === 1 ? "process" : "wait",
        },
        {
          title: "Diambil",
          description: size === "default" ? "Porsi diterima" : undefined,
          icon: <CheckCircleOutlined />,
          status: current === 2 ? "finish" : "wait",
        },
      ]}
    />
  );
}
