import React, { useEffect, useState } from 'react';
import { Typography, Card, Row, Col, Form, Input, Button, Switch, Slider, ColorPicker, Upload, message, Divider } from 'antd';
import { SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { configuracionApi } from '../../../infrastructure/api/services';

const { Title, Text } = Typography;

// Utilidad para convertir la imagen local a Base64 sin subirla al servidor tradicionalmente
const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function ConfiguracionPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Estado independiente para la vista previa en tiempo real
  const [preview, setPreview] = useState<any>({
    logo_izq_url: null,
    logo_izq_opacidad: 35, 
    logo_izq_visible: true,
    logo_der_url: null,
    logo_der_opacidad: 35, 
    logo_der_visible: true,
    color_corporativo: '#1e3a5f',
    texto_footer: 'SEGURIDAD GRUPO EMPRESARIAL ROJAS',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const normalizeOpacity = (val: any) => {
    if (val === undefined || val === null) return 35;
    if (val > 1) return val;
    return Math.round(val * 100);
  };

  const cargarDatos = async () => {
    try {
      setFetching(true);
      const { data } = await configuracionApi.get();
      if (data) {
        const formData = {
          ...data,
          logo_izq_opacidad: normalizeOpacity(data.logo_izq_opacidad),
          logo_der_opacidad: normalizeOpacity(data.logo_der_opacidad),
        };
        form.setFieldsValue(formData);
        setPreview(formData);
      }
    } catch (error) {
      message.error('Error al cargar la configuración global.');
    } finally {
      setFetching(false);
    }
  };

  // 🔥 SOLUCIÓN 1: BLINDAJE EN EL MANEJADOR DE CAMBIOS
  const handleValuesChange = (_changedValues: any, allValues: any) => {
    setPreview((prev: any) => {
      const newPreview = { 
        ...allValues,
        // Protegemos los logos: Rescatamos el Base64 que ya teníamos en el estado React
        logo_izq_url: prev.logo_izq_url,
        logo_der_url: prev.logo_der_url
      };
      
      if (typeof newPreview.color_corporativo === 'object') {
        newPreview.color_corporativo = newPreview.color_corporativo.toHexString();
      }
      return newPreview;
    });
  };

  // 🔥 SOLUCIÓN 2: DESACOPLAMIENTO DE FORM.ITEM
  const handleImageUpload = async (file: File, field: 'logo_izq_url' | 'logo_der_url') => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Solo puedes subir archivos de imagen');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2; 
    if (!isLt2M) {
      message.error('La imagen debe pesar menos de 2MB');
      return Upload.LIST_IGNORE;
    }

    const base64 = await getBase64(file);
    // Ya no usamos form.setFieldValue aquí. Confiamos 100% en el estado local (preview)
    setPreview((prev: any) => ({ ...prev, [field]: base64 }));
    
    return false; 
  };

  // 🔥 SOLUCIÓN 3: INYECCIÓN AL CARGAR A BASE DE DATOS
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = { 
        ...values,
        // Forzamos a que el JSON final incluya las imágenes rescatadas de nuestro estado
        logo_izq_url: preview.logo_izq_url,
        logo_der_url: preview.logo_der_url,
        
        logo_izq_opacidad: (values.logo_izq_opacidad ?? 35) / 100,
        logo_der_opacidad: (values.logo_der_opacidad ?? 35) / 100,
      };

      if (typeof payload.color_corporativo === 'object') {
        payload.color_corporativo = payload.color_corporativo.toHexString();
      }

      await configuracionApi.update(payload);
      message.success('Plantilla de PDF actualizada correctamente.');
    } catch (error) {
      message.error('Error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  const previewColor = typeof preview.color_corporativo === 'string' 
    ? preview.color_corporativo 
    : preview.color_corporativo?.toHexString?.() || '#1e3a5f';

  return (
    <div className="page-container fade-in-up" style={{ padding: '24px' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleValuesChange}
        initialValues={preview}
        disabled={fetching}
      >
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={3} style={{ color: '#262626', margin: 0, fontWeight: 700, fontSize: 22 }}>
              Configuración del Sistema
            </Title>
            <Text style={{ color: '#8c8c8c', fontSize: 13 }}>
              Administra los parámetros globales y la plantilla de generación de reportes PDF.
            </Text>
          </div>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} style={{ height: 38, fontWeight: 600 }}>
            Guardar Cambios
          </Button>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={13} xl={14}>
            <Card title="Ajustes Visuales" className="shadow-sm" style={{ borderRadius: 12 }}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Color Corporativo Principal" name="color_corporativo" rules={[{ required: true }]}>
                    <ColorPicker showText style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Texto del Pie de Página" name="texto_footer" rules={[{ required: true }]}>
                    <Input placeholder="Ej: SEGURIDAD GRUPO EMPRESARIAL ROJAS" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" style={{ marginTop: 0 }}>Logo Izquierdo</Divider>
              <Row gutter={16} align="middle">
                <Col span={6}>
                  <Form.Item label="Visible" name="logo_izq_visible" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Switch checkedChildren="SÍ" unCheckedChildren="NO" />
                  </Form.Item>
                </Col>
                <Col span={18}>
                  {/* Le quitamos el prop 'name' para que Antd deje de intentar controlar la imagen */}
                  <Form.Item label="Imagen (Recomendado: PNG sin fondo)" style={{ marginBottom: 0 }}>
                    <Upload accept="image/png, image/jpeg" showUploadList={false} beforeUpload={(f) => handleImageUpload(f, 'logo_izq_url')}>
                      <Button icon={<UploadOutlined />}>Cargar Logo Izquierdo</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Opacidad en PDF (%)" name="logo_izq_opacidad" style={{ marginTop: 16 }}>
                <Slider min={0} max={100} step={5} marks={{ 0: '0%', 50: '50%', 100: '100%' }} />
              </Form.Item>

              <Divider orientation="left">Logo Derecho</Divider>
              <Row gutter={16} align="middle">
                <Col span={6}>
                  <Form.Item label="Visible" name="logo_der_visible" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Switch checkedChildren="SÍ" unCheckedChildren="NO" />
                  </Form.Item>
                </Col>
                <Col span={18}>
                  {/* Le quitamos el prop 'name' para que Antd deje de intentar controlar la imagen */}
                  <Form.Item label="Imagen (Recomendado: PNG sin fondo)" style={{ marginBottom: 0 }}>
                    <Upload accept="image/png, image/jpeg" showUploadList={false} beforeUpload={(f) => handleImageUpload(f, 'logo_der_url')}>
                      <Button icon={<UploadOutlined />}>Cargar Logo Derecho</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Opacidad en PDF (%)" name="logo_der_opacidad" style={{ marginTop: 16 }}>
                <Slider min={0} max={100} step={5} marks={{ 0: '0%', 50: '50%', 100: '100%' }} />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={11} xl={10}>
            <Card title="Vista Previa en Vivo (Simulación de Hoja A4)" className="shadow-sm" style={{ borderRadius: 12 }}>
              <div
                style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  padding: '30px',
                  height: 480,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#fff',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', height: 45, marginBottom: 12 }}>
                    <div style={{ width: 120, display: 'flex', alignItems: 'center' }}>
                      {preview.logo_izq_visible && preview.logo_izq_url && (
                        <img 
                          src={preview.logo_izq_url} 
                          alt="Logo Izq" 
                          style={{ 
                            maxHeight: '100%', 
                            maxWidth: '100%', 
                            opacity: (preview.logo_izq_opacidad ?? 35) / 100, 
                            objectFit: 'contain' 
                          }} 
                        />
                      )}
                    </div>
                    <div style={{ width: 120, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {preview.logo_der_visible && preview.logo_der_url && (
                        <img 
                          src={preview.logo_der_url} 
                          alt="Logo Der" 
                          style={{ 
                            maxHeight: '100%', 
                            maxWidth: '100%', 
                            opacity: (preview.logo_der_opacidad ?? 35) / 100, 
                            objectFit: 'contain' 
                          }} 
                        />
                      )}
                    </div>
                  </div>
                  
                  <div style={{ width: '100%', height: 2, backgroundColor: previewColor }} />
                  
                  <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <Text strong style={{ color: previewColor, fontSize: 16 }}>
                      INFORME INTEGRAL DE EVALUACIÓN
                    </Text>
                    <br/>
                    <Text style={{ fontSize: 10, color: '#8c8c8c' }}>CÓDIGO: ENT-001 • ESTADO: APROBADO</Text>
                  </div>
                  
                  <div style={{ border: `1px solid ${previewColor}40`, height: 120, marginTop: 24, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' }}>
                     <Text type="secondary" style={{ fontSize: 12 }}>Cuerpo del reporte generado dinámicamente...</Text>
                  </div>
                </div>

                <div>
                  <div style={{ width: '100%', height: 2, backgroundColor: previewColor, marginBottom: 8 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: previewColor, fontWeight: 'bold' }}>
                      ◆ {preview.texto_footer || '...'}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#8c8c8c', fontWeight: 'bold' }}>
                      <span style={{ color: previewColor }}>1</span> / 10
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}