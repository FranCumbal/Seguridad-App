import { useEffect } from 'react';
import { Form, Input, Select, DatePicker, Switch, Button, Row, Col, App, Divider } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { entrevistasApi } from '@/infrastructure/api/services';

const schema = z.object({
  nombres:              z.string().min(2, 'Nombres requeridos'),
  apellidos:            z.string().min(2, 'Apellidos requeridos'),
  cedula:               z.string().min(8, 'Cédula inválida'),
  fecha_nacimiento:     z.any(),
  lugar_nacimiento:     z.string().optional(),
  estado_civil:         z.string().min(1, 'Estado civil requerido'),
  numero_hijos:         z.number().min(0).default(0),
  telefono_personal:    z.string().optional(),
  telefono_alternativo: z.string().optional(),
  email:                z.string().email('Email inválido').optional().or(z.literal('')),
  direccion:            z.string().optional(),
  ciudad_residencia:    z.string().optional(),
  sector_barrio:        z.string().optional(),
  tiempo_residencia:    z.string().optional(),
  vivienda_tipo:        z.string().optional(),
  discapacidad:         z.boolean().default(false),
  tipo_discapacidad:    z.string().optional(),
  cargo_aplicar:        z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props { entrevistaId: number; data: any; onSaved: () => void; }

const label = (text: string) => <span style={{ color: '#8b949e', fontSize: 12 }}>{text}</span>;

export default function DatosPersonalesTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { discapacidad: false, numero_hijos: 0 },
  });

  const tieneDiscapacidad = watch('discapacidad');

  useEffect(() => {
    if (data) {
      reset({
        ...data,
        fecha_nacimiento: data.fecha_nacimiento ? dayjs(data.fecha_nacimiento) : undefined,
        discapacidad: data.discapacidad ?? false,
        numero_hijos: data.numero_hijos ?? 0,
      });
    }
  }, [data]);

  const onSubmit = async (values: FormData) => {
    try {
      const payload = {
        ...values,
        fecha_nacimiento: values.fecha_nacimiento ? dayjs(values.fecha_nacimiento).toISOString() : null,
      };
      await entrevistasApi.saveDatosPersonales(entrevistaId, payload);
      message.success('Datos personales guardados correctamente');
      onSaved();
    } catch { message.error('Error al guardar datos personales'); }
  };

  const errMsg = (field: keyof FormData) =>
    errors[field] ? <span style={{ color: '#f85149', fontSize: 11 }}>{errors[field]?.message as string}</span> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Identificación */}
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6e7681', marginBottom: 14 }}>
        Identificación
      </p>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item label={label('Nombres *')} validateStatus={errors.nombres ? 'error' : ''} help={errMsg('nombres')}>
            <Controller name="nombres" control={control}
              render={({ field }) => <Input {...field} placeholder="Juan Carlos" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Apellidos *')} validateStatus={errors.apellidos ? 'error' : ''} help={errMsg('apellidos')}>
            <Controller name="apellidos" control={control}
              render={({ field }) => <Input {...field} placeholder="Pérez Rodríguez" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Cédula / Pasaporte *')} validateStatus={errors.cedula ? 'error' : ''} help={errMsg('cedula')}>
            <Controller name="cedula" control={control}
              render={({ field }) => <Input {...field} placeholder="1234567890" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label={label('Fecha de Nacimiento *')}>
            <Controller name="fecha_nacimiento" control={control}
              render={({ field }) => <DatePicker {...field} style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="dd/mm/aaaa" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label={label('Lugar de Nacimiento')}>
            <Controller name="lugar_nacimiento" control={control}
              render={({ field }) => <Input {...field} placeholder="Ciudad, País" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label={label('Estado Civil *')} validateStatus={errors.estado_civil ? 'error' : ''} help={errMsg('estado_civil')}>
            <Controller name="estado_civil" control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Seleccionar">
                  <Select.Option value="SOLTERO">Soltero/a</Select.Option>
                  <Select.Option value="CASADO">Casado/a</Select.Option>
                  <Select.Option value="DIVORCIADO">Divorciado/a</Select.Option>
                  <Select.Option value="VIUDO">Viudo/a</Select.Option>
                  <Select.Option value="UNION_LIBRE">Unión Libre</Select.Option>
                </Select>
              )} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label={label('N° de Hijos')}>
            <Controller name="numero_hijos" control={control}
              render={({ field }) => <Input {...field} type="number" min={0} onChange={(e) => field.onChange(Number(e.target.value))} />} />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ borderColor: '#21262d', margin: '8px 0 16px' }} />
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6e7681', marginBottom: 14 }}>
        Contacto
      </p>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item label={label('Teléfono Personal')}>
            <Controller name="telefono_personal" control={control}
              render={({ field }) => <Input {...field} placeholder="+593 99 000 0000" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Teléfono Alternativo')}>
            <Controller name="telefono_alternativo" control={control}
              render={({ field }) => <Input {...field} placeholder="+593 99 000 0001" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Correo Electrónico')} validateStatus={errors.email ? 'error' : ''} help={errMsg('email')}>
            <Controller name="email" control={control}
              render={({ field }) => <Input {...field} placeholder="correo@ejemplo.com" />} />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ borderColor: '#21262d', margin: '8px 0 16px' }} />
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6e7681', marginBottom: 14 }}>
        Residencia
      </p>
      <Row gutter={[16, 0]}>
        <Col xs={24}>
          <Form.Item label={label('Dirección')}>
            <Controller name="direccion" control={control}
              render={({ field }) => <Input.TextArea {...field} rows={2} placeholder="Calle, número, referencias..." />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Ciudad de Residencia')}>
            <Controller name="ciudad_residencia" control={control}
              render={({ field }) => <Input {...field} placeholder="Guayaquil" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Sector / Barrio')}>
            <Controller name="sector_barrio" control={control}
              render={({ field }) => <Input {...field} placeholder="Ej. Kennedy Norte" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item label={label('Tiempo de Residencia')}>
            <Controller name="tiempo_residencia" control={control}
              render={({ field }) => <Input {...field} placeholder="Ej. 5 años" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item label={label('Tipo de Vivienda')}>
            <Controller name="vivienda_tipo" control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Seleccionar">
                  <Select.Option value="PROPIA">Propia</Select.Option>
                  <Select.Option value="ARRENDADA">Arrendada</Select.Option>
                  <Select.Option value="FAMILIAR">Familiar</Select.Option>
                  <Select.Option value="OTRA">Otra</Select.Option>
                </Select>
              )} />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ borderColor: '#21262d', margin: '8px 0 16px' }} />
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item label={label('Cargo al que aplica')}>
            <Controller name="cargo_aplicar" control={control}
              render={({ field }) => <Input {...field} placeholder="Ej. Guardia de Seguridad" />} />
          </Form.Item>
        </Col>
        <Col xs={12} md={4}>
          <Form.Item label={label('¿Tiene Discapacidad?')}>
            <Controller name="discapacidad" control={control}
              render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="Sí" unCheckedChildren="No" />} />
          </Form.Item>
        </Col>
        {tieneDiscapacidad && (
          <Col xs={24} md={8}>
            <Form.Item label={label('Tipo de Discapacidad')}>
              <Controller name="tipo_discapacidad" control={control}
                render={({ field }) => <Input {...field} placeholder="Describir tipo de discapacidad" />} />
            </Form.Item>
          </Col>
        )}
      </Row>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={isSubmitting}
          className="action-btn-primary"
          style={{ height: 40, fontWeight: 600, minWidth: 160 }}
        >
          Guardar Datos Personales
        </Button>
      </div>
    </form>
  );
}
