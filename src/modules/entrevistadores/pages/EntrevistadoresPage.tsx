import { useEffect, useState } from 'react';
import {
  Row, Col, Typography, Button, Modal, Form, Input, Switch, Upload,
  Avatar, Tag, Space, App, Spin, Empty, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  UploadOutlined, TeamOutlined, CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons';
import { entrevistadoresApi } from '@/infrastructure/api/services';

const { Title, Text } = Typography;

interface Entrevistador {
  id: number;
  nombre_completo: string;
  cargo: string;
  fotografia?: string;
  activo: boolean;
}

export default function EntrevistadoresPage() {
  const { message, modal } = App.useApp();
  const [entrevistadores, setEntrevistadores] = useState<Entrevistador[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Entrevistador | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

  const loadEntrevistadores = async () => {
    setLoading(true);
    try {
      const res = await entrevistadoresApi.getAll();
      setEntrevistadores(res.data.data);
    } catch { message.error('Error al cargar entrevistadores'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadEntrevistadores(); }, []);

  const handleOpenModal = (item?: Entrevistador) => {
    setEditTarget(item || null);
    setFileList([]);
    form.setFieldsValue(item || { activo: true });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const fd = new FormData();
      fd.append('nombre_completo', values.nombre_completo);
      fd.append('cargo', values.cargo);
      fd.append('activo', String(values.activo ?? true));
      if (fileList[0]?.originFileObj) {
        fd.append('fotografia', fileList[0].originFileObj);
      }

      if (editTarget) {
        await entrevistadoresApi.update(editTarget.id, fd);
        message.success('Entrevistador actualizado correctamente');
      } else {
        await entrevistadoresApi.create(fd);
        message.success('Entrevistador creado correctamente');
      }
      setModalOpen(false);
      loadEntrevistadores();
    } catch (err: any) {
      if (err?.response?.data?.message) message.error(err.response.data.message);
    } finally { setSaving(false); }
  };

  const handleDelete = (item: Entrevistador) => {
    modal.confirm({
      title: 'Eliminar entrevistador',
      content: `¿Eliminar a "${item.nombre_completo}"? Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        await entrevistadoresApi.delete(item.id);
        message.success('Entrevistador eliminado');
        loadEntrevistadores();
      },
    });
  };

  return (
    <div className="page-container fade-in-up">
      <div className="page-header">
        <div>
          <Title level={3} style={{ color: '#e6edf3', margin: 0, fontWeight: 700, fontSize: 22 }}>
            Entrevistadores
          </Title>
          <Text style={{ color: '#6e7681', fontSize: 13 }}>
            Gestión del equipo de entrevistadores de seguridad
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="action-btn-primary"
          onClick={() => handleOpenModal()}
          style={{ height: 38, fontWeight: 600 }}
        >
          Agregar Entrevistador
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
        </div>
      ) : entrevistadores.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Empty
            image={<TeamOutlined style={{ fontSize: 56, color: '#484f58' }} />}
            description={<Text style={{ color: '#484f58' }}>No hay entrevistadores registrados</Text>}
          />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {entrevistadores.map((e) => (
            <Col xs={24} sm={12} md={8} lg={6} key={e.id}>
              <div className="app-card" style={{
                padding: '24px 20px',
                textAlign: 'center',
                position: 'relative',
              }}>
                {/* Estado badge */}
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <Tag
                    icon={e.activo ? <CheckCircleOutlined /> : <StopOutlined />}
                    style={{
                      background: e.activo ? 'rgba(63,185,80,0.12)' : 'rgba(139,148,158,0.12)',
                      color: e.activo ? '#3fb950' : '#8b949e',
                      border: e.activo ? '1px solid rgba(63,185,80,0.3)' : '1px solid rgba(139,148,158,0.3)',
                      fontSize: 10, borderRadius: 6, padding: '1px 6px',
                    }}
                  >
                    {e.activo ? 'Activo' : 'Inactivo'}
                  </Tag>
                </div>

                {/* Avatar / Foto */}
                {e.fotografia ? (
                  <Avatar
                    size={72}
                    src={`${API_URL}${e.fotografia}`}
                    style={{ border: '3px solid #21262d', marginBottom: 12 }}
                  />
                ) : (
                  <Avatar
                    size={72}
                    icon={<UserOutlined />}
                    style={{ background: 'linear-gradient(135deg, #1677ff, #0d3380)', marginBottom: 12, border: '3px solid #21262d' }}
                  />
                )}

                <Title level={5} style={{ color: '#e6edf3', margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>
                  {e.nombre_completo}
                </Title>
                <Text style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 16 }}>
                  {e.cargo}
                </Text>

                {/* Acciones */}
                <Space size={8}>
                  <Tooltip title="Editar">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenModal(e)}
                      style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e' }}
                    />
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(e)}
                      style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)' }}
                    />
                  </Tooltip>
                </Space>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Modal Crear/Editar */}
      <Modal
        title={
          <Text style={{ color: '#e6edf3', fontWeight: 700, fontSize: 16 }}>
            {editTarget ? 'Editar Entrevistador' : 'Nuevo Entrevistador'}
          </Text>
        }
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleSave}
        okText={saving ? 'Guardando...' : 'Guardar'}
        confirmLoading={saving}
        cancelText="Cancelar"
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nombre_completo"
            label="Nombre completo"
            rules={[{ required: true, message: 'Nombre requerido' }]}
          >
            <Input placeholder="Ej. Jaime Bautista" />
          </Form.Item>

          <Form.Item
            name="cargo"
            label="Cargo"
            rules={[{ required: true, message: 'Cargo requerido' }]}
          >
            <Input placeholder="Ej. Jefe de Seguridad" />
          </Form.Item>

          <Form.Item name="fotografia" label="Fotografía">
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              accept="image/jpeg,image/png,image/webp"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 6, fontSize: 12 }}>Subir foto</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item name="activo" label="Estado" valuePropName="checked">
            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
