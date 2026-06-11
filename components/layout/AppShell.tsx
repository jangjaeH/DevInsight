"use client";

import { Button, Flex, Layout, Tooltip, Typography } from "antd";
import { IdcardOutlined, LogoutOutlined } from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import Sidemenu from "./menu/sidemenu";

const { Sider, Content, Header } = Layout;

export default function AppShell({
    children,
    hasToken,
}: {
    children: React.ReactNode;
    hasToken: boolean;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const isLoginPage = pathname === "/login";
    const showNavigation = hasToken && !isLoginPage;

    const onLogout = async () => {
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: "logout" }),
            });

            if (res.ok) {
                router.replace("/login");
                setTimeout(() => router.refresh(), 100);
            }
        } catch {
            router.replace("/login");
        }
    };

    return (
        <Layout style={{ minHeight: "100vh" }}>
            {showNavigation ? (
                <Sider collapsible breakpoint="lg">
                    <Sidemenu />
                </Sider>
            ) : null}
            <Layout>
                {showNavigation ? (
                    <Header
                        style={{
                            background: "#fff",
                            padding: "0 20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: "1px solid #f0f0f0",
                        }}
                    >
                        <Typography.Text strong>DevInsight</Typography.Text>
                        <Flex gap="small" align="center">
                            <Tooltip title="Profile">
                                <Button aria-label="Profile" icon={<IdcardOutlined />} />
                            </Tooltip>
                            <Tooltip title="Log out">
                                <Button aria-label="Log out" icon={<LogoutOutlined />} onClick={onLogout} />
                            </Tooltip>
                        </Flex>
                    </Header>
                ) : null}
                <Content style={{ background: "#f5f7fb" }}>{children}</Content>
            </Layout>
        </Layout>
    );
}
