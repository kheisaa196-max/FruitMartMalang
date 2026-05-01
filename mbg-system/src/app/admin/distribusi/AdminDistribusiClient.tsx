"use client";

import { useState, useMemo } from "react";
import {
  Card,
  Table,
  Typography,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  Tooltip,
  message,
  Modal,
  Form,
  InputNumber,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  EditOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";
import type { Kelas, LogMakan, StatusMakan } from "@/types/database";
import StatusBadge from "@/components/StatusBadge";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Props {
  logs: LogMakan[];
  allKelas: Kelas[];
}

export default function AdminDistribusiClient({ logs: initialLogs, allKelas }: Props) {
  const [logs, setLogs] = useState<LogMakan[]>(initialLogs);
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogMakan | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const supabase = createClient();

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (filterKelas !== "all" && l.kelas_id !== filterKelas) return false;
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (dateRange) {
        const d = dayjs(l.tanggal);
        if (d.isBefore(dateRange[0], "day") || d.isAfter(dateRange[1], "day"))
          return false;
      }
      return true;
    });
  }, [logs, filterKelas, filterStatus, dateRange]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalDipesan = filtered.reduce((s, l) => s + l.porsi_dipesan, 0);
  const totalDiterima = filtered.reduce((s, l) => s + (l.porsi_diterima ?? 0), 0);
  const efisiensi =
    totalDipesan > 0 ? Math.round((totalDiterima / totalDipesan) * 100) : 0;

  // ── Actions ────────────────────────────────────────────────────────────────
  const updateStatus = async (log: LogMakan, status: StatusMakan) => {
    const { error } = await supabase
      .from("log_makan")
      .update({ status })
      .eq("id", log.id);
    if (error) {
      messageApi.error("Gagal mengubah status");
    } else {
      setLogs((prev) =>
        prev.map((l) => (l.id === log.id ? { ...l, status } : l))
      );
      messageApi.success(`Status diubah ke "${status}"`);
    }
  };

  const openModal = (log: LogMakan) => {
    setSelectedLog(log);
    form.setFieldsValue({
      porsi_diterima: log.porsi_diterima ?? log.porsi_dipesan,
      status: log.status === "Selesai" ? "Selesai" : "Selesai",
    });
    setModalOpen(true);
  };

  const handleConfirm = async (values: {
    porsi_diterima: number;
    status: StatusMakan;
  }) => {
    if (!selectedLog) return;
    setLoading(true);
    const { error } = await supabase
      .from("log_makan")
      .update({ porsi_diterima: values.porsi_diterima, status: values.status })
      .eq("id", selectedLog.id);
    setLoading(false);
    if (error) {
      messageApi.error("Gagal menyimpan");
      return;
    }
    setLogs((prev) =>
      prev.map((l) =>
        l.id === selectedLog.id
          ? { ...l, porsi_diterima: values.porsi_diterima, status: values.status }
          : l
      )
    );
    messageApi.success("Konfirmasi disimpan!");
    setModalOpen(false);
    setSelectedLog(null);
    form.resetFields();
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnsType<LogMakan> = [
    {
      title: "Tanggal",
      dataIndex: "tanggal",
      key: "tanggal",
      sorter: (a, b) => a.tanggal.localeCompare(b.tanggal),
      render: (v: string) => (
        <div>
          <p className="font-medium text-sm">{dayjs(v).format("D MMM YYYY")}</p>
          <p className="text-xs text-gray-400">{dayjs(v).format("dddd")}</p>
        </div>
      ),
    },
    {
      title: "Kelas",
      key: "kelas",
      render: (_, r) => (
        <span className="font-semibold">{r.kelas?.nama_kelas ?? "—"}</span>
      ),
    },
    {
      title: "Dipesan",
      dataIndex: "porsi_dipesan",
      key: "porsi_dipesan",
      align: "center",
      sorter: (a, b) => a.porsi_dipesan - b.porsi_dipesan,
      render: (v: number) => (
        <Tag color="blue" className="font-bold px-3">
          {v}
        </Tag>
      ),
    },
    {
      title: "Diterima",
      dataIndex: "porsi_diterima",
      key: "porsi_diterima",
      align: "center",
      render: (v: number | null) =>
        v !== null ? (
          <Tag color="green" className="font-bold px-3">
            {v}
          </Tag>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Selisih",
      key: "selisih",
      align: "center",
      render: (_, r) => {
        if (r.porsi_diterima === null) return <span className="text-gray-400">—</span>;
        const diff = r.porsi_dipesan - r.porsi_diterima;
        return (
          <Tag color={diff === 0 ? "green" : diff > 0 ? "orange" : "red"}>
            {diff > 0 ? `+${diff}` : diff}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: StatusMakan) => <StatusBadge status={v} />,
    },
    {
      title: "Aksi",
      key: "aksi",
      render: (_, record) => (
        <div className="flex gap-1.5 flex-wrap">
          {record.status === "Pending" && (
            <Tooltip title="Mulai proses masak">
              <Button
                size="small"
                icon={<FireOutlined />}
                onClick={() => updateStatus(record, "Proses")}
                style={{ borderColor: "#3b82f6", color: "#3b82f6" }}
              >
                Proses
              </Button>
            </Tooltip>
          )}
          {(record.status === "Proses" || record.status === "Selesai") && (
            <Tooltip title="Konfirmasi porsi diambil">
              <Button
                size="small"
                type={record.status === "Proses" ? "primary" : "default"}
                icon={
                  record.status === "Selesai" ? (
                    <EditOutlined />
                  ) : (
                    <CheckCircleOutlined />
                  )
                }
                onClick={() => openModal(record)}
                style={
                  record.status === "Proses"
                    ? { background: "#059669", borderColor: "#059669" }
                    : {}
                }
              >
                {record.status === "Selesai" ? "Edit" : "Konfirmasi"}
              </Button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <div className="mb-6">
        <Title level={3} className="!mb-1 !text-gray-800">
          Distribusi Makan
        </Title>
        <Text className="text-gray-500">Riwayat 30 hari terakhir</Text>
      </div>

      {/* Summary */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={8}>
          <Card className="rounded-xl shadow-sm text-center">
            <Statistic
              title="Total Dipesan"
              value={totalDipesan}
              suffix="porsi"
              valueStyle={{ color: "#1e40af", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card className="rounded-xl shadow-sm text-center">
            <Statistic
              title="Total Diterima"
              value={totalDiterima}
              suffix="porsi"
              valueStyle={{ color: "#059669", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card className="rounded-xl shadow-sm text-center">
            <Statistic
              title="Efisiensi"
              value={efisiensi}
              suffix="%"
              valueStyle={{
                color: efisiensi >= 90 ? "#059669" : efisiensi >= 70 ? "#d97706" : "#dc2626",
                fontWeight: 700,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="rounded-2xl shadow-sm mb-4">
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8}>
            <Select
              value={filterKelas}
              onChange={setFilterKelas}
              className="w-full"
              placeholder="Filter Kelas"
            >
              <Select.Option value="all">Semua Kelas</Select.Option>
              {allKelas.map((k) => (
                <Select.Option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              className="w-full"
              placeholder="Filter Status"
            >
              <Select.Option value="all">Semua Status</Select.Option>
              <Select.Option value="Pending">Dipesan</Select.Option>
              <Select.Option value="Proses">Dimasak</Select.Option>
              <Select.Option value="Selesai">Diambil</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <RangePicker
              className="w-full"
              onChange={(dates) =>
                setDateRange(dates as [Dayjs, Dayjs] | null)
              }
              format="D MMM YYYY"
            />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl shadow-sm">
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: "Tidak ada data" }}
          size="middle"
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Confirm Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircleOutlined className="text-emerald-500" />
            <span>Konfirmasi — {selectedLog?.kelas?.nama_kelas}</span>
          </div>
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedLog(null);
          form.resetFields();
        }}
        footer={null}
        centered
      >
        <Divider className="mt-2 mb-4" />
        {selectedLog && (
          <Alert
            message={`Porsi dipesan: ${selectedLog.porsi_dipesan} porsi`}
            type="info"
            showIcon
            className="mb-4 rounded-lg"
          />
        )}
        <Form form={form} layout="vertical" onFinish={handleConfirm}>
          <Form.Item
            name="porsi_diterima"
            label="Porsi yang Diambil"
            rules={[{ required: true }, { type: "number", min: 0 }]}
          >
            <InputNumber min={0} className="w-full" size="large" addonAfter="porsi" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select size="large">
              <Select.Option value="Proses">🔥 Dimasak</Select.Option>
              <Select.Option value="Selesai">✅ Selesai</Select.Option>
            </Select>
          </Form.Item>
          <div className="flex gap-3 justify-end">
            <Button onClick={() => { setModalOpen(false); setSelectedLog(null); form.resetFields(); }}>
              Batal
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ background: "#059669", borderColor: "#059669" }}
            >
              Simpan
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
