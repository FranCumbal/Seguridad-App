import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Space, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, EyeTwoTone, EyeInvisibleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';

const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState('');
  const [form] = Form.useForm();

  const handleLogin = async (values: { username: string; password: string }) => {
    setError('');
    try {
      await login(values.username, values.password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.';
      setError(msg);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Grid decorativo de fondo */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.5,
        backgroundImage: 'linear-gradient(#e8e8e8 1px, transparent 1px), linear-gradient(90deg, #e8e8e8 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      <div className="fade-in-up" style={{ width: '100%', maxWidth: 420, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Logo y título */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #1677ff 0%, #0d3380 100%)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 4px 24px rgba(22,119,255,0.3)',
          }}>
            <SafetyOutlined style={{ fontSize: 28, color: 'white' }} />
          </div>
          <Title level={2} style={{ color: '#262626', margin: 0, fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em' }}>
            Seguridad App
          </Title>
          <Paragraph style={{ color: '#8c8c8c', marginTop: 6, fontSize: 13, marginBottom: 0 }}>
            Sistema de Entrevistas de Seguridad Empresarial
          </Paragraph>
        </div>

        {/* Card de login */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #f0f0f0',
          borderRadius: 16,
          padding: '32px 32px 28px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}>
          <Text style={{ fontSize: 13, color: '#595959', display: 'block', marginBottom: 24, fontWeight: 500 }}>
            Inicia sesión en tu cuenta
          </Text>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
              style={{ marginBottom: 20, borderRadius: 8 }}
            />
          )}

          <Form form={form} layout="vertical" onFinish={handleLogin} size="large">
            <Form.Item
              name="username"
              label={<span style={{ color: '#595959', fontSize: 13 }}>Usuario o correo</span>}
              rules={[{ required: true, message: 'Ingresa tu usuario' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="admin"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ color: '#595959', fontSize: 13 }}>Contraseña</span>}
              rules={[{ required: true, message: 'Ingresa tu contraseña' }]}
              style={{ marginBottom: 24 }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="••••••••"
                iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              className="action-btn-primary"
              style={{ height: 44, fontSize: 15, fontWeight: 600, borderRadius: 8 }}
            >
              {isLoading ? 'Verificando...' : 'Ingresar al sistema'}
            </Button>
          </Form>
        </div>

        <Divider style={{ borderColor: '#f0f0f0', margin: '28px 0 16px' }} />

        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: 11, color: '#bfbfbf' }}>
            Seguridad App v1.0.0 — Uso exclusivo empresarial
          </Text>
        </div>
      </div>
    </div>
  );
}