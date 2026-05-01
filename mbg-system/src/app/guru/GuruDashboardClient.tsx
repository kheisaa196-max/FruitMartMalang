"use client";

import { useState } from "react";
import {
  Card,
  Statistic,
  Button,
  Form,
  InputNumber,
  Input,
  Table,
  Tag,
  Alert,
  Modal,
  Typography,
  Row,
  Col,
  Divider,
  message,
} from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Users, UtensilsCrossed, CalendarDays, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Kelas, LogMakan } from "@/types/database";
import StatusBadge from "@/components/StatusBadge";
import MealStatusSteps from "@/components/MealStatusSteps";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const { Title, Text } = Typography;

interface Props {
  kelas: Kelas | null;
  todayLog: LogMakan | null;
  history: LogMakan[];
  userId: string;
  userName: string;
}

export default function GuruDashboardClient({
  kelas,
  todayLog: initialTodayLog,
  history,
  userName,
}: Props) {
  const [todayLog, setTodayLog] = useState<LogMakan | null>(initialTodayLog);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const supabase = createClient();
  const [messageApi, contextHolder] = message.useMessage();

  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = dayjs().format("dddd, D MMMM YYYY");

  const handleSubmit = async (values: {
    porsi_dipesan: number;
    catatan?: string;
  }) => {
    if (!kelas) return;
    setLoading(true);

    const payload = {
      kelas_id: kelas.id,
      tanggal: today,
      porsi_dipesan: values.porsi_dipesan,
      catatan: values.catatan ?? null,
      status: "Pending" as const,
      petugas_penerima: userName,
    };

    let result;
    if (todayLog) {
      // Update existing
      result = await supabase
        .from("log_makan")
        .update(payload)
        .eq("id", todayLog.id)
        .select("*")
        .single();
    } else {
      // Insert new
      result = await supabase
        .from("log_makan")
        .insert(payload)
        .select("*")
        .single();
    }

    setLoading(false);

    if (result.error) {
      messageApi.error("Gagal menyimpan data. Coba lagi.");
      return;
    }

    setTodayLog(result.data);
    setModalOpen(false);
    form.resetFields();
    messageApi.success("Absensi berhasil disimpan!");
  };

  const openModal = () => {
    if (todayLog) {
      form.setFieldsValue({
        porsi_dipesan: todayLog.porsi_dipesan,
        catatan: todayLog.catatan,
      });
    } else {
      form.setFieldsValue({ porsi_dipesan: kelas?.total_siswa });
    }
    setModalOpen(true);
  };

  const historyColumns = [
    {
      title: "Tanggal",
      dataIndex: "tanggal",
      key: "tanggal",
      render: (v: string) => dayjs(v).format("D MMM YYYY"),
    },
    {
      title: "Porsi Dipesan",
      dataIndex: "porsi_dipesan",
      key: "porsi_dipesan",
      align: "center" as const,
      render: (v: number) => <span className="font-semibold">{v}</span>,
    },
    {
      title: "Porsi Diterima",
      dataIndex: "porsi_diterima",
      key: "porsi_diterima",
      align: "center" as const,
      render: (v: number | null) =>
        v !== null ? (
          <span className="font-semibold text-emerald-600">{v}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: LogMakan["status"]) => <StatusBadge status={v} />,
    },
  ];

  const totalPorsiMingguIni = history.reduce(
    (sum, l) => sum + l.porsi_dipesan,
    0
  );
  const totalDiterima = history.reduce(
    (sum, l) => sum + (l.porsi_diterima ?? 0),
    0
  );

  return (
    <>
      {contextHolder}

      {/* Page Header */}
      <div className="mb-6">
        <Title level={3} className="!mb-1 !text-gray-800">
          Dashboard Guru Kelas
        </Title>
        <Text className="text-gray-500 flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4" />
          {todayFormatted}
        </Text>
      </div>

      {/* Kelas Info Banner */}
      {kelas && (
        <div
          className="rounded-2xl p-5 mb-6 text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #059669 100%)",
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-emerald-200 text-sm font-medium mb-1">
                Kelas Anda
              </p>
              <h2 className="text-2xl font-bold">{kelas.nama_kelas}</h2>
              <p className="text-blue-200 text-sm mt-1">
                Total siswa terdaftar:{" "}
                <span className="font-semibold text-white">
                  {kelas.total_siswa} siswa
                </span>
              </p>
            </div>
            <Button
              size="large"
              onClick={openModal}
              className="font-semibold border-0 shadow-md"
              style={{ background: "#fff", color: "#059669" }}
              icon={todayLog ? <EditOutlined /> : <CheckCircleOutlined />}
            >
              {todayLog ? "Ubah Absensi" : "Input Absensi Hari Ini"}
            </Button>
          </div>
        </div>
      )}

      {/* Today's Status */}
      {todayLog ? (
        <Card className="mb-6 rounded-2xl shadow-sm border-emerald-200 border">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircleOutlined className="text-emerald-500 text-lg" />
            <Title level={5} className="!mb-0 !text-gray-700">
              Status Makan Hari Ini
            </Title>
          </div>
          <MealStatusSteps status={todayLog.status} />
          <Divider className="my-4" />
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Porsi Dipesan"
                value={todayLog.porsi_dipesan}
                suffix="porsi"
                valueStyle={{ color: "#1e40af", fontWeight: 700 }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Porsi Diterima"
                value={todayLog.porsi_diterima ?? "—"}
                suffix={todayLog.porsi_diterima !== null ? "porsi" : ""}
                valueStyle={{ color: "#059669", fontWeight: 700 }}
              />
            </Col>
            <Col span={8}>
              <div>
                <p className="text-gray-500 text-sm mb-1">Status</p>
                <StatusBadge status={todayLog.status} />
              </div>
            </Col>
          </Row>
          {todayLog.catatan && (
            <Alert
              message={`Catatan: ${todayLog.catatan}`}
              type="info"
              showIcon
              className="mt-4 rounded-lg"
            />
          )}
        </Card>
      ) : (
        <Alert
          message="Belum ada absensi hari ini"
          description="Silakan klik tombol 'Input Absensi Hari Ini' untuk melaporkan jumlah siswa yang hadir."
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          className="mb-6 rounded-xl"
          action={
            <Button size="small" onClick={openModal} type="primary" style={{ background: "#059669" }}>
              Input Sekarang
            </Button>
          }
        />
      )}

      {/* Weekly Stats */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card className="rounded-xl shadow-sm stat-card text-center">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <Statistic
              title="Total Siswa"
              value={kelas?.total_siswa ?? 0}
              valueStyle={{ fontSize: 22, fontWeight: 700, color: "#1e40af" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl shadow-sm stat-card text-center">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <Statistic
              title="Dipesan (7 Hari)"
              value={totalPorsiMingguIni}
              valueStyle={{ fontSize: 22, fontWeight: 700, color: "#d97706" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl shadow-sm stat-card text-center">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircleOutlined className="text-emerald-600 text-xl" />
              </div>
            </div>
            <Statistic
              title="Diterima (7 Hari)"
              value={totalDiterima}
              valueStyle={{ fontSize: 22, fontWeight: 700, color: "#059669" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl shadow-sm stat-card text-center">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <Statistic
              title="Hari Laporan"
              value={history.length}
              suffix="hari"
              valueStyle={{ fontSize: 22, fontWeight: 700, color: "#7c3aed" }}
            />
          </Card>
        </Col>
      </Row>

      {/* History Table */}
      <Card
        title={
          <span className="font-semibold text-gray-700">
            Riwayat 7 Hari Terakhir
          </span>
        }
        className="rounded-2xl shadow-sm"
      >
        <Table
          dataSource={history}
          columns={historyColumns}
          rowKey="id"
          pagination={false}
          size="middle"
          locale={{ emptyText: "Belum ada riwayat makan" }}
        />
      </Card>

      {/* Input Absensi Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <UserOutlined className="text-emerald-500" />
            <span>
              {todayLog ? "Ubah Absensi" : "Input Absensi"} —{" "}
              {kelas?.nama_kelas}
            </span>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        centered
        className="rounded-2xl"
      >
        <Divider className="mt-2 mb-4" />
        <Alert
          message={`Total siswa terdaftar: ${kelas?.total_siswa} siswa`}
          type="info"
          showIcon
          className="mb-4 rounded-lg"
        />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="porsi_dipesan"
            label="Jumlah Porsi yang Dipesan"
            rules={[
              { required: true, message: "Wajib diisi" },
              {
                type: "number",
                min: 1,
                max: kelas?.total_siswa ?? 999,
                message: `Antara 1 – ${kelas?.total_siswa}`,
              },
            ]}
          >
            <InputNumber
              min={1}
              max={kelas?.total_siswa ?? 999}
              className="w-full"
              size="large"
              placeholder="Masukkan jumlah porsi"
              addonAfter="porsi"
            />
          </Form.Item>
          <Form.Item name="catatan" label="Catatan (opsional)">
            <Input.TextArea
              rows={3}
              placeholder="Contoh: 3 siswa tidak hadir karena sakit"
              className="rounded-lg"
            />
          </Form.Item>
          <div className="flex gap-3 justify-end">
            <Button onClick={() => setModalOpen(false)}>Batal</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ background: "#059669", borderColor: "#059669" }}
            >
              {todayLog ? "Simpan Perubahan" : "Kirim Pesanan"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
