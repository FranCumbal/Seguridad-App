import { Typography, Card, Space, Button } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ConfiguracionPage() {
  return (
    <div className="page-container fade-in-up">
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ color: '#262626', margin: 0, fontWeight: 700, fontSize: 22 }}>
            Configuración del Sistema
          </Title>
          <Text style={{ color: '#8c8c8c', fontSize: 13 }}>
            Administra los parámetros globales y la plantilla de generación de reportes PDF.
          </Text>
        </div>
        <Button type="primary" icon={<SaveOutlined />} style={{ height: 38, fontWeight: 600 }}>
          Guardar Cambios
        </Button>
      </div>

      <Card style={{ marginTop: 20, borderRadius: 12, border: '1px solid #f0f0f0' }}>
        <Title level={4}>¡Pantalla conectada exitosamente!</Title>
        <Text>En el siguiente paso aquí construiremos los sliders, subidores de imágenes y el selector de color corporativo.</Text>
      </Card>
    </div>
  );
}