"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Card,
  Table,
  Statistic,
  Button,
  Badge,
  Typography,
  Row,
  Col,
  Tag,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  Select,
  Divider,
  message,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { UtensilsCrossed, Wifi, WifiOff, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Kelas, LogMakan, StatusMakan } from "@/types/database";
import StatusBadge from "@/components/StatusBadge";
import MealStatusSteps from "@/components/MealStatusSteps";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const { Title, Text } = Typography;

interface Props {
  initialLogs: LogMakan[];
  allKelas: Kelas[];
}

export default function AdminDashboardClient({ initialLogs, allKelas }: Props) {
  const [logs, setLogs] = useState<LogMakan[]>(initialLogs);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [flashedRows, setFlashedRows] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogMakan | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = dayjs().format("dddd, D MMMM YYYY");

  // ── Realtime subscription ──────────────────────────────────────────────────
  const flashRow = useCallback((id: string) => {
    setFlashedRows((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setFlashedRows((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  }, []);

  const fetchFullLog = useCallback(
    async (id: string): Promise<LogMakan | null> => {
      const { data } = await supabase
        .from("log_makan")
        .select("*, kelas(*)")
        .eq("id", id)
        .single();
      return data;
    },
    [supabase]
  );

  useEffect(() => {
    const channel = supabase
      .channel("log_makan_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "log_makan",
          filter: `tanggal=eq.${today}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const full = await fetchFullLog(payload.new.id as string);
            if (full) {
              setLogs((prev) => [full, ...prev]);
              flashRow(full.id);
              messageApi.info(
                `📋 Pesanan baru dari ${full.kelas?.nama_kelas ?? "kelas"}`
              );
            }
          } else if (payload.eventType === "UPDATE") {
            const full = await fetchFullLog(payload.new.id as string);
            if (full) {
              setLogs((prev) =>
                prev.map((l) => (l.id === full.id ? full : l))
              );
              flashRow(full.id);
            }
          } else if (payload.eventType === "DELETE") {
            setLogs((prev) =>
              prev.filter((l) => l.id !== (payload.old.id as string))
            );
          }
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [today, supabase, fetchFullLog, flashRow, messageApi]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalDipesan = logs.reduce((s, l) => s + l.porsi_dipesan, 0);
  const totalDiterima = logs.reduce((s, l) => s + (l.porsi_diterima ?? 0), 0);
  const countPending = logs.filter((l) => l.status === "Pending").length;
  const countProses = logs.filter((l) => l.status === "Proses").length;
  const countSelesai = logs.filter((l) => l.status === "Selesai").length;
  const kelasYetToReport = allKelas.filter(
    (k) => !logs.find((l) => l.kelas_id === k.id)
  );

  // ── Status update ──────────────────────────────────────────────────────────
  const updateStatus = async (log: LogMakan, status: StatusMakan) => {
    const { error } = await supabase
      .from("log_makan")
      .update({ status })
      .eq("id", log.id);
    if (error) messageApi.error("Gagal mengubah status");
    else messageApi.success(`Status diubah ke "${status}"`);
  };

  // ── Re-attendance (konfirmasi porsi diterima) ──────────────────────────────
  const openReattendance = (log: LogMakan) => {
    setSelectedLog(log);
    form.setFieldsValue({
      porsi_diterima: log.porsi_diterima ?? log.porsi_dipesan,
      status: "Selesai",
    });
    setModalOpen(true);
  };

  const handleReattendance = async (values: {
    porsi_diterima: number;
    status: StatusMakan;
  }) => {
    if (!selectedLog) return;
    setLoading(true);

    const { error } = await supabase
      .from("log_makan")
      .update({
        porsi_diterima: values.porsi_diterima,
        status: values.status,
      })
      .eq("id", selectedLog.id);

    setLoading(false);

    if (error) {
      messageApi.error("Gagal menyimpan konfirmasi");
      return;
    }

    messageApi.success("Konfirmasi berhasil disimpan!");
    setModalOpen(false);
    form.resetFields();
    setSelectedLog(null);
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns: ColumnsType<LogMakan> = [
    {
      title: "Kelas",
      key: "kelas",
      render: (_, record) => (
        <div>
          <p className="font-semibold text-gray-800">
            {record.kelas?.nama_kelas ?? "—"}
          </p>
          <p className="text-xs text-gray-400">
            {record.kelas?.total_siswa} siswa terdaftar
          </p>
        </div>
      ),
    },
    {
      title: "Porsi Dipesan",
      dataIndex: "porsi_dipesan",
      key: "porsi_dipesan",
      align: "center",
      render: (v: number) => (
        <Tag color="blue" className="font-bold text-sm px-3 py-0.5">
          {v}
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
          <Tag color="green" className="font-bold text-sm px-3 py-0.5">
            {v}
          </Tag>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Dipesan", value: "Pending" },
        { text: "Dimasak", value: "Proses" },
        { text: "Diambil", value: "Selesai" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (v: StatusMakan) => <StatusBadge status={v} />,
    },
    {
      title: "Waktu",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string) => (
        <span className="text-gray-500 text-sm">
          {dayjs(v).format("HH:mm")}
        </span>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      render: (_, record) => (
        <div className="flex gap-2 flex-wrap">
          {record.status === "Pending" && (
            <Tooltip title="Tandai sedang dimasak">
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
          {record.status === "Proses" && (
            <Tooltip title="Konfirmasi porsi yang diambil">
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => openReattendance(record)}
                style={{ background: "#059669", borderColor: "#059669" }}
              >
                Konfirmasi
              </Button>
            </Tooltip>
          )}
          {record.status === "Selesai" && (
            <Tooltip title="Edit konfirmasi">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openReattendance(record)}
              >
                Edit
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

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <Title level={3} className="!mb-1 !text-gray-800">
            Dashboard Admin Dapur
          </Title>
          <Text className="text-gray-500 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" />
            {todayFormatted}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            status={realtimeConnected ? "processing" : "error"}
            text={
              <span className="text-sm flex items-center gap-1">
                {realtimeConnected ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-500">Offline</span>
                  </>
                )}
              </span>
            }
          />
        </div>
      </div>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={8} lg={4}>
          <Card className="rounded-xl shadow-sm stat-card text-center border-blue-100 border">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <Statistic
              title="Total Dipesan"
              value={totalDipesan}
              suffix="porsi"
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "#1e40af" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="rounded-xl shadow-sm stat-card text-center border-emerald-100 border">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircleOutlined className="text-emerald-600 text-xl" />
              </div>
            </div>
            <Statistic
              title="Total Diterima"
              value={totalDiterima}
              suffix="porsi"
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "#059669" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="rounded-xl shadow-sm stat-card text-center border-amber-100 border">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <ClockCircleOutlined className="text-amber-600 text-xl" />
              </div>
            </div>
            <Statistic
              title="Menunggu"
              value={countPending}
              suffix="kelas"
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "#d97706" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="rounded-xl shadow-sm stat-card text-center border-blue-100 border">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FireOutlined className="text-blue-600 text-xl" />
              </div>
            </div>
            <Statistic
              title="Dimasak"
              value={countProses}
              suffix="kelas"
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "#2563eb" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="rounded-xl shadow-sm stat-card text-center border-emerald-100 border">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircleOutlined className="text-emerald-600 text-xl" />
              </div>
            </div>
            <Statistic
              title="Selesai"
              value={countSelesai}
              suffix="kelas"
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "#059669" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="rounded-xl shadow-sm stat-card text-center border-gray-100 border">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <SyncOutlined className="text-gray-500 text-xl" />
              </div>
            </div>
            <Statistic
              title="Belum Lapor"
              value={kelasYetToReport.length}
              suffix="kelas"
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "#6b7280" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Kelas belum lapor */}
      {kelasYetToReport.length > 0 && (
        <Alert
          message={`${kelasYetToReport.length} kelas belum melaporkan absensi hari ini`}
          description={
            <div className="flex flex-wrap gap-1.5 mt-1">
              {kelasYetToReport.map((k) => (
                <Tag key={k.id} color="default">
                  {k.nama_kelas}
                </Tag>
              ))}
            </div>
          }
          type="warning"
          showIcon
          className="mb-6 rounded-xl"
        />
      )}

      {/* Main Table */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">
              Log Makan Hari Ini
            </span>
            <Badge count={logs.length} color="#059669" />
          </div>
        }
        className="rounded-2xl shadow-sm"
      >
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          rowClassName={(record) =>
            flashedRows.has(record.id) ? "row-flash" : ""
          }
          expandable={{
            expandedRowRender: (record) => (
              <div className="py-3 px-4">
                <MealStatusSteps status={record.status} size="small" />
                {record.catatan && (
                  <p className="text-sm text-gray-500 mt-2">
                    📝 {record.catatan}
                  </p>
                )}
              </div>
            ),
          }}
          pagination={false}
          locale={{ emptyText: "Belum ada pesanan hari ini" }}
          size="middle"
          scroll={{ x: 700 }}
        />
      </Card>

      {/* Re-attendance Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircleOutlined className="text-emerald-500" />
            <span>
              Konfirmasi Pengambilan — {selectedLog?.kelas?.nama_kelas}
            </span>
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

        <Form form={form} layout="vertical" onFinish={handleReattendance}>
          <Form.Item
            name="porsi_diterima"
            label="Jumlah Porsi yang Benar-benar Diambil"
            rules={[
              { required: true, message: "Wajib diisi" },
              { type: "number", min: 0, message: "Minimal 0" },
            ]}
          >
            <InputNumber
              min={0}
              className="w-full"
              size="large"
              addonAfter="porsi"
              placeholder="Masukkan jumlah aktual"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status Akhir"
            rules={[{ required: true }]}
          >
            <Select size="large">
              <Select.Option value="Proses">🔥 Dimasak</Select.Option>
              <Select.Option value="Selesai">✅ Diambil / Selesai</Select.Option>
            </Select>
          </Form.Item>

          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => {
                setModalOpen(false);
                setSelectedLog(null);
                form.resetFields();
              }}
            >
              Batal
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ background: "#059669", borderColor: "#059669" }}
            >
              Simpan Konfirmasi
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
