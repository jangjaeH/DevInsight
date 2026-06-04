'use client';

import { useState } from 'react';
import { Button, Form, Input, Modal } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import CustomAlert from '@/components/alert';

type LoginValues = {
    usercode: string;
    password: string;
};

type SignupValues = {
    newid_usercode: string;
    newid_username: string;
    newid_password: string;
    newid_password_confirm: string;
};

type AlertType = 'success' | 'info' | 'warning' | 'error';

export default function LoginPage() {
    const [message, setMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<AlertType>('error');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [signupLoading, setSignupLoading] = useState(false);
    const [signupForm] = Form.useForm<SignupValues>();
    const router = useRouter();

    const showMessage = (nextMessage: string, type: AlertType = 'error') => {
        setAlertType(type);
        setMessage(nextMessage);
    };

    const showModal = () => {
        signupForm.resetFields();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const onFinish = async (values: LoginValues) => {
        setLoginLoading(true);

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...values, action: 'login' }),
            });
            const data = await res.json();

            if (res.ok) {
                router.replace('/home');
                setTimeout(() => router.refresh(), 100);
                return;
            }

            showMessage(data.message || '아이디와 비밀번호를 확인하세요.');
        } finally {
            setLoginLoading(false);
        }
    };

    const onSignupFinish = async (values: SignupValues) => {
        if (values.newid_password !== values.newid_password_confirm) {
            showMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
            return;
        }

        setSignupLoading(true);

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...values, action: 'newid' }),
            });
            const data = await res.json();

            if (res.ok) {
                showMessage(data.message || '회원가입이 완료되었습니다. 로그인해 주세요.', 'success');
                signupForm.resetFields();
                setIsModalOpen(false);
                return;
            }

            showMessage(data.message || '회원가입에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setSignupLoading(false);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: '#f5f7fb',
            }}
        >
            <CustomAlert
                message={message || ''}
                type={alertType}
                onClose={() => setMessage(null)}
            />
            <Form
                name="login_form"
                style={{
                    width: 360,
                    padding: 32,
                    background: '#fff',
                    borderRadius: 8,
                    boxShadow: '0 10px 30px rgba(20, 30, 60, 0.08)',
                }}
                onFinish={onFinish}
            >
                <h1 style={{ margin: '0 0 24px', fontSize: 24 }}>DevInsight</h1>
                <Form.Item
                    name="usercode"
                    rules={[{ required: true, message: '아이디를 입력하세요.' }]}
                >
                    <Input prefix={<UserOutlined />} placeholder="ID" />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[{ required: true, message: '비밀번호를 입력하세요.' }]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loginLoading} style={{ width: '100%' }}>
                        Log in
                    </Button>
                </Form.Item>
                <Button type="link" onClick={showModal} style={{ padding: 0 }}>
                    회원가입
                </Button>
            </Form>
            <Modal
                title="회원가입"
                open={isModalOpen}
                okText="가입"
                cancelText="취소"
                confirmLoading={signupLoading}
                onOk={() => signupForm.submit()}
                onCancel={closeModal}
            >
                <Form
                    form={signupForm}
                    name="signup_form"
                    onFinish={onSignupFinish}
                    layout="vertical"
                >
                    <Form.Item
                        label="아이디"
                        name="newid_usercode"
                        rules={[{ required: true, message: '아이디는 필수 입력 값입니다.' }]}
                    >
                        <Input placeholder="ID" />
                    </Form.Item>
                    <Form.Item
                        label="이름"
                        name="newid_username"
                        rules={[{ required: true, message: '이름은 필수 입력 값입니다.' }]}
                    >
                        <Input placeholder="Name" />
                    </Form.Item>
                    <Form.Item
                        label="비밀번호"
                        name="newid_password"
                        rules={[{ required: true, message: '비밀번호는 필수 입력 값입니다.' }]}
                    >
                        <Input.Password placeholder="Password" />
                    </Form.Item>
                    <Form.Item
                        label="비밀번호 확인"
                        name="newid_password_confirm"
                        rules={[{ required: true, message: '비밀번호 확인은 필수 입력 값입니다.' }]}
                    >
                        <Input.Password placeholder="Password Confirm" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
