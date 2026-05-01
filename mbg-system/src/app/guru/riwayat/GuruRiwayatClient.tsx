"use client";

import { Card, Table, Typography, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { LogMakan } from "@/types/database";
import StatusBadge from "@/components/StatusBadge";
import MealStatusSteps from "@/components/MealStatusSteps";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const { Title, Text } = Typography;

interface Props {
  logs: LogMakan[];
}

export default function GuruRiwayatClient({ logs }: Props) {
  const columns: ColumnsType<LogMakan> = [
    {
      title: "Tanggal",
      dataIndex: "tanggal",
      key: "tanggal",
      render: (v: string) => (
        <div>
          <p className="font-medium">{dayjs(v).format("D MMMM YYYY")}</p>
          <p className="text-xs text-gray-400">{dayjs(v).format("dddd")}</p>
        </div>
      ),
    },
    {
      title: "Porsi Dipesan",
      dataIndex: "porsi_dipesan",
      key: "porsi_dipesan",
      align: "center",
      render: (v: number) => (
        <Tag color="blue" className="font-semibold text-sm px-3">
          {v} porsi
        </Tag>
      ),
    },
    {
      title: "Porsi Diterima",
      dataIndex: "porsi_diterima",
      key: "porsi_diterima",
      align: "center",
      render: (v: number | null) =>
        v !== null ? (
          <Tag color="green" className="font-semibold text-sm px-3">
            {v} porsi
          </Tag>
        ) : (
          <span className="text-gray-400 text-sm">Belum dikonfirmasi</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: LogMakan["status"]) => <StatusBadge status={v} />,
    },
    {
      title: "Catatan",
      dataIndex: "catatan",
      key: "catatan",
      render: (v: string | null) => (
        <span className="text-gray-500 text-sm">{v ?? "—"}</span>
      ),
    },
  ];

  const expandedRowRender = (record: LogMakan) => (
    <div className="py-2 px-4">
      <MealStatusSteps status={record.status} size="small" />
    </div>
  );

  return (
    <>
      <div className="mb-6">
        <Title level={3} className="!mb-1 !text-gray-800">
          Riwayat Makan
        </Title>
        <Text className="text-gray-500">30 hari terakhir</Text>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          locale={{ emptyText: "Belum ada riwayat makan" }}
          size="middle"
        />
      </Card>
    </>
  );
}
