"use client";

import { useState } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, Typography, Tag } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { UtensilsCrossed, ChefHat } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AppShellProps {
  children: React.ReactNode;
  role: "guru" | "admin";
  userName: string;
  kelasName?: string;
}

const guruMenuItems = [
  {
    key: "/guru",
    icon: <DashboardOutlined />,
    label: <Link href="/guru">Dashboard</Link>,
  },
  {
    key: "/guru/absensi",
    icon: <FileTextOutlined />,
    label: <Link href="/guru/absensi">Input Absensi</Link>,
  },
  {
    key: "/guru/riwayat",
    icon: <TeamOutlined />,
    label: <Link href="/guru/riwayat">Riwayat Makan</Link>,
  },
];

const adminMenuItems = [
  {
    key: "/admin",
    icon: <DashboardOutlined />,
    label: <Link href="/admin">Dashboard</Link>,
  },
  {
    key: "/admin/distribusi",
    icon: <FileTextOutlined />,
    label: <Link href="/admin/distribusi">Distribusi Makan</Link>,
  },
  {
    key: "/admin/kelas",
    icon: <TeamOutlined />,
    label: <Link href="/admin/kelas">Data Kelas</Link>,
  },
];

export default function AppShell({
  children,
  role,
  userName,
  kelasName,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const menuItems = role === "admin" ? adminMenuItems : guruMenuItems;

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Keluar",
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="min-h-screen">
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        className="shadow-xl"
        style={{ background: "#1e2a5e" }}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight">
                MBG System
              </p>
              <p className="text-emerald-300 text-xs leading-tight">
                Makan Bergizi Gratis
              </p>
            </div>
          )}
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-4 py-3">
            <Tag
              color={role === "admin" ? "blue" : "green"}
              className="w-full text-center text-xs py-0.5"
            >
              {role === "admin" ? "👨‍🍳 Admin Dapur" : "👩‍🏫 Guru Kelas"}
            </Tag>
          </div>
        )}

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          style={{ background: "#1e2a5e", border: "none", marginTop: 8 }}
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header
          className="flex items-center justify-between px-4 shadow-sm"
          style={{ background: "#fff", height: 60, lineHeight: "60px" }}
        >
          <div className="flex items-center gap-3">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-600 hover:text-emerald-600"
              style={{ fontSize: 16, width: 40, height: 40 }}
            />
            <div className="hidden sm:flex items-center gap-2">
              {role === "admin" ? (
                <ChefHat className="w-4 h-4 text-blue-600" />
              ) : (
                <UserOutlined className="text-emerald-600" />
              )}
              <Text className="text-gray-600 text-sm font-medium">
                {role === "admin" ? "Admin Dapur" : kelasName ?? "Guru Kelas"}
              </Text>
            </div>
          </div>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
              <Avatar
                size={32}
                style={{
                  background:
                    role === "admin"
                      ? "linear-gradient(135deg,#1e40af,#3b82f6)"
                      : "linear-gradient(135deg,#059669,#10b981)",
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800 leading-tight">
                  {userName}
                </p>
                <p className="text-xs text-gray-400 leading-tight">
                  {role === "admin" ? "Admin Dapur" : "Guru Kelas"}
                </p>
              </div>
            </div>
          </Dropdown>
        </Header>

        {/* Page Content */}
        <Content className="p-4 sm:p-6 overflow-auto">{children}</Content>
      </Layout>
    </Layout>
  );
}
