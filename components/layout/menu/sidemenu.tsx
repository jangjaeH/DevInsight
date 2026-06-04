'use client';

import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { ClusterOutlined, DashboardOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
    {
        key: '/home',
        label: 'Home',
        icon: <HomeOutlined />,
    },
    {
        key: '/review',
        label: 'Code Review',
        icon: <ClusterOutlined />,
    },
    {
        key: '/dashboard',
        label: 'Dash Board',
        icon: <DashboardOutlined />,
    },
    {
        key: '/setting',
        label: 'Setting',
        icon: <SettingOutlined />,
    },
];

export default function Sidemenu() {
    const router = useRouter();
    const pathname = usePathname();

    const onClick: MenuProps['onClick'] = (event) => {
        router.replace(event.key);
    };

    return (
        <Menu
            onClick={onClick}
            style={{ height: '100vh' }}
            selectedKeys={[pathname]}
            theme="dark"
            mode="inline"
            items={items}
        />
    );
}
