"use client";

import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Typography,
  Popconfirm,
  message,
  Tag,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";
import type { Kelas } from "@/types/database";

const { Title, Text } = Typography;

interface Props {
  initialKelas: Kelas[];
}

export default function AdminKelasClient({ initialKelas }: Props) {
  const [kelas, setKelas] = useState<Kelas[]>(initialKelas);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Kelas | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const supabase = createClient();

  const openAdd = () => {
    setEditTarget(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (k: Kelas) => {
    setEditTarget(k);
    form.setFieldsValue({ nama_kelas: k.nama_kelas, total_siswa: k.total_siswa });
    setModalOpen(true);
  };

  const handleSubmit = async (values: { nama_kelas: string; total_siswa: number }) => {
    setLoading(true);
    if (editTarget) {
      const { data, error } = await supabase
        .from("kelas")
        .update(values)
        .eq("id", editTarget.id)
        .select()
        .single();
      if (error) { messageApi.error("Gagal mengubah kelas"); }
      else {
        setKelas((prev) => prev.map((k) => (k.id === editTarget.id ? data : k)));
        messageApi.success("Kelas berhasil diubah");
      }
    } else {
      const { data, error } = await supabase
        .from("kelas")
        .insert(values)
        .select()
        .single();
      if (error) { messageApi.error("Gagal menambah kelas"); }
      else {
        setKelas((prev) => [...prev, data].sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas)));
        messageApi.success("Kelas berhasil ditambahkan");
      }
    }
    setLoading(false);
    setModalOpen(false);
    form.resetFields();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("kelas").delete().eq("id", id);
    if (error) { messageApi.error("Gagal menghapus kelas"); }
    else {
      setKelas((prev) => prev.filter((k) => k.id !== id));
      messageApi.success("Kelas dihapus");
    }
  };

  const columns: ColumnsType<Kelas> = [
    {
      title: "No",
      key: "no",
      width: 60,
      render: (_, __, i) => <span className="text-gray-500">{i + 1}</span>,
    },
    {
      title: "Nama Kelas",
      dataIndex: "nama_kelas",
      key: "nama_kelas",
      render: (v: string) => <span className="font-semibold">{v}</span>,
    },
    {
      title: "Total Siswa",
      dataIndex: "total_siswa",
      key: "total_siswa",
      align: "center",
      render: (v: number) => (
        <Tag color="blue" className="font-semibold px-3">
          {v} siswa
        </Tag>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Hapus kelas ini?"
            description="Data log makan terkait juga akan terhapus."
            onConfirm={() => handleDelete(record.id)}
            okText="Hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Hapus
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-1 !text-gray-800">
            Data Kelas
          </Title>
          <Text className="text-gray-500">
            {kelas.length} kelas terdaftar
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAdd}
          size="large"
          style={{ background: "#059669", borderColor: "#059669" }}
        >
          Tambah Kelas
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <Table
          dataSource={kelas}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: "Belum ada kelas" }}
          size="middle"
        />
      </Card>

      <Modal
        title={
          <span>{editTarget ? "Edit Kelas" : "Tambah Kelas Baru"}</span>
        }
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        centered
      >
        <Divider className="mt-2 mb-4" />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="nama_kelas"
            label="Nama Kelas"
            rules={[{ required: true, message: "Wajib diisi" }]}
          >
            <Input size="large" placeholder="Contoh: Kelas 1A" />
          </Form.Item>
          <Form.Item
            name="total_siswa"
            label="Total Siswa"
            rules={[
              { required: true, message: "Wajib diisi" },
              { type: "number", min: 1, message: "Minimal 1" },
            ]}
          >
            <InputNumber
              min={1}
              className="w-full"
              size="large"
              addonAfter="siswa"
            />
          </Form.Item>
          <div className="flex gap-3 justify-end">
            <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>
              Batal
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ background: "#059669", borderColor: "#059669" }}
            >
              {editTarget ? "Simpan Perubahan" : "Tambah Kelas"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
