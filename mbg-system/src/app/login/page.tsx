"use client";

import { useState } from "react";
import { Form, Input, Button, Alert, Typography, Card } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setError("Email atau password salah. Silakan coba lagi.");
      setLoading(false);
      return;
    }

    const role = (data.user?.user_metadata?.role as string) ?? "guru";
    router.push(role === "admin" ? "/admin" : "/guru");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-700 to-emerald-800 p-4"
      style={{ background: "linear-gradient(135deg, #1e2a5e 0%, #1e40af 50%, #065f46 100%)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 mb-4 shadow-lg">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <Title level={2} className="!text-white !mb-1">
            MBG System
          </Title>
          <Text className="text-emerald-200 text-sm">
            Sistem Manajemen Makan Bergizi Gratis
          </Text>
        </div>

        {/* Login Card */}
        <Card
          className="shadow-2xl border-0 rounded-2xl"
          styles={{ body: { padding: "2rem" } }}
        >
          <Title level={4} className="!mb-6 !text-gray-700 text-center">
            Masuk ke Akun Anda
          </Title>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              className="mb-4 rounded-lg"
              closable
              onClose={() => setError(null)}
            />
          )}

          <Form
            layout="vertical"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Email wajib diisi" },
                { type: "email", message: "Format email tidak valid" },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="nama@sekolah.sch.id"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Password wajib diisi" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Masukkan password"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="h-11 rounded-lg font-semibold text-base"
                style={{ background: "#059669", borderColor: "#059669" }}
              >
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Text className="text-xs text-gray-400">
              Hubungi Admin jika lupa password
            </Text>
          </div>
        </Card>

        <p className="text-center text-emerald-200 text-xs mt-6 opacity-70">
          © 2025 MBG Management System
        </p>
      </div>
    </div>
  );
}
