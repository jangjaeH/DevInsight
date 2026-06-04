"use client";

import { Layout } from "antd";
import Sidemenu from "./menu/sidemenu";
import { usePathname, useRouter } from "next/navigation"
import { LoginOutlined, IdcardOutlined } from '@ant-design/icons';
import { Button, Flex, Tooltip } from "antd";

const { Sider, Content, Header } = Layout;

export default function AntdLayout({ 
    children, 
    hasToken 
}: { 
    children: React.ReactNode, 
    hasToken: boolean 
    }) {
    const pathname = usePathname();
    
    const isLoginPage = pathname === '/login';
    const showNavigation = hasToken && !isLoginPage; 
    const router = useRouter();

    const onLogout = async () => {

        const params = {action: 'logout' };

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params),
        });

        if(res.ok) {
            router.replace('/login');

            setTimeout(() => {
                router.refresh();
            },100);
        }
    };

    return (
        <Layout style={{ minHeight: "100vh" }}>
        {showNavigation && (
            <Sider collapsible>
            <Sidemenu />
            </Sider>
        )}
            <Layout>
                {
                    showNavigation && (
                        <Header style={{ background: '#fff', padding: '0 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* 알람, 검색, 프로필 넣을곳 */}
                            <Flex gap="small" align="center">
                                <Tooltip title= "profile">
                                    <Button
                                        icon={<IdcardOutlined />}
                                        style={{ margin: 10 }}
                                    />
                                </Tooltip>
                                <Tooltip title="Logout">
                                    <Button
                                        icon={<LoginOutlined />}
                                        style={{ margin: 10 }}
                                        onClick={async () => onLogout()}
                                    />
                                </Tooltip>
                            </Flex>
                        </Header>
                    )
                }
                <Content>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
