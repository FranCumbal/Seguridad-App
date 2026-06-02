import { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, App, Divider, InputNumber, Upload, Avatar } from 'antd';
import { SaveOutlined, UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { entrevistasApi } from '@/infrastructure/api/services';
import { CARGOS_MINERIA, ESTADOS_CIVILES, ESTADOS_SALUD, GENEROS, PROVINCIAS_ECUADOR } from '@/shared/utils/catalogos';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

const AREAS_TRABAJO = [
  "ADMINISTRACION", "ALL", "AMBIENTE", "BODEGA", "DEPARTAMENTO", "ELECTRICOS",
  "FINANCIERO", "GEOLOGIA", "INTEGRAL DE SALUD EN EL TRABAJO", "JURIDICO",
  "LABORATORIO", "MECANICA", "MINA", "MOLINO", "OPERACIONES", "PLANTA DE BENEFICIO",
  "SEGURIDAD FISICA", "SISTEMAS", "TALENTO HUMANO", "TECNICO DE SEGURIDAD E HIGIENE",
  "TELECOMUNICACIONES", "TRANSPORTE",
];

const schema = z.object({
  cedula:           z.string().min(10, 'Cédula debe tener 10 dígitos'),
  libreta_militar:  z.string().optional(),
  nombres:          z.string().min(2, 'Nombres requeridos'),
  apellidos:        z.string().min(2, 'Apellidos requeridos'),
  fecha_nacimiento: z.any(),
  edad:             z.number().optional().nullable(),
  estado_civil:     z.string().min(1, 'Estado civil requerido'),
  genero:           z.string().min(1, 'Género requerido'),
  lugar_nacimiento: z.string().optional(),
  provincia:        z.string().optional(),
  ciudad:           z.string().optional(),
  barrio_parroquia: z.string().optional(),
  direccion:        z.string().min(10, 'Ingrese una dirección detallada').optional().or(z.literal('')),
  estado_salud:     z.string().optional(),
  telefono_fijo:    z.string().optional(),
  celular:          z.string().min(9, 'Celular requerido'),
  correo:           z.string().email('Ingrese un correo electrónico válido').optional().or(z.literal('')),
  area_trabajo:     z.string().optional(),
  cargo_postula:    z.string().optional(),
});

type PersonalDataForm = z.infer<typeof schema>;

interface Props { entrevistaId: number; data: any; onSaved: () => void; }

// Modificado: Eliminamos el color fijo para que respete el tema de Ant Design
const label = (text: string) => <span style={{ fontSize: 12 }}>{text}</span>;

export default function DatosPersonalesTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<any[]>([]);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<PersonalDataForm>({
    resolver: zodResolver(schema),
  });

  const provinciaSeleccionada = watch('provincia');

  useEffect(() => {
    if (data) {
      reset({
        ...data,
        fecha_nacimiento: data.fecha_nacimiento ? dayjs(data.fecha_nacimiento) : undefined,
        correo: data.correo || '',
        area_trabajo: data.area_trabajo || undefined,
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: PersonalDataForm) => {
    try {
      const fd = new window.FormData();

      for (const [key, val] of Object.entries(values)) {
        if (val === null || val === undefined) continue;
        if (key === 'fecha_nacimiento') {
          fd.append(key, dayjs(val).toISOString());
        } else {
          fd.append(key, String(val));
        }
      }

      if (fileList[0]?.originFileObj) {
        fd.append('fotografia', fileList[0].originFileObj);
      }

      await entrevistasApi.saveDatosPersonales(entrevistaId, fd as any);
      message.success('Datos personales guardados correctamente');
      onSaved();
    } catch {
      message.error('Error al guardar datos personales');
    }
  };

  const errMsg = (field: keyof PersonalDataForm) =>
    errors[field] ? <span style={{ color: '#ff4d4f', fontSize: 11 }}>{errors[field]?.message as string}</span> : null;

  const currentPhotoUrl = data?.fotografia ? `${API_URL}${data.fotografia}` : null;
  const previewUrl = fileList[0]?.originFileObj
    ? URL.createObjectURL(fileList[0].originFileObj)
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      {/* FOTO DEL CANDIDATO */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 10, marginBottom: 28, paddingBottom: 24,
        // Modificado: Borde más sutil para tema claro
        borderBottom: '1px solid #f0f0f0', 
      }}>
        {previewUrl || currentPhotoUrl ? (
          <img
            src={previewUrl || currentPhotoUrl!}
            alt="Foto del candidato"
            style={{
              width: 110, height: 110, objectFit: 'cover',
              borderRadius: 12, 
              // Modificado: Borde para tema claro
              border: '1px solid #d9d9d9', 
            }}
          />
        ) : (
          <Avatar
            size={110}
            icon={<UserOutlined />}
            // Modificado: Se quita el borde oscuro
            style={{ background: 'linear-gradient(135deg, #1677ff, #0d3380)' }}
          />
        )}
        <Upload
          maxCount={1}
          beforeUpload={() => false}
          fileList={fileList}
          onChange={({ fileList: fl }) => setFileList(fl)}
          accept="image/jpeg,image/png,image/webp"
          showUploadList={false}
        >
          <Button
            size="small"
            icon={<UploadOutlined />}
            // Modificado: Se quitan los estilos forzados (fondo y borde oscuros)
          >
            {currentPhotoUrl ? 'Cambiar foto' : 'Subir foto del candidato'}
          </Button>
        </Upload>
        {fileList[0] && (
          <span style={{ fontSize: 11, color: '#52c41a' }}> {/* Color éxito Ant Design */}
            ✓ {fileList[0].name} — se guardará al presionar "Guardar"
          </span>
        )}
      </div>

      {/* SECCIÓN 1: IDENTIFICACIÓN */}
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8c8c8c', marginBottom: 14 }}>
        Información Personal
      </p>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item label={label('Cédula / Pasaporte *')} validateStatus={errors.cedula ? 'error' : ''} help={errMsg('cedula')}>
            <Controller name="cedula" control={control} render={({ field }) => <Input {...field} placeholder="Ej. 1700000000" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Libreta Militar (Opcional)')}>
            <Controller name="libreta_militar" control={control} render={({ field }) => <Input {...field} placeholder="N° Libreta" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}></Col>

        <Col xs={24} md={8}>
          <Form.Item label={label('Nombres *')} validateStatus={errors.nombres ? 'error' : ''} help={errMsg('nombres')}>
            <Controller name="nombres" control={control} render={({ field }) => <Input {...field} placeholder="Nombres completos" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Apellidos *')} validateStatus={errors.apellidos ? 'error' : ''} help={errMsg('apellidos')}>
            <Controller name="apellidos" control={control} render={({ field }) => <Input {...field} placeholder="Apellidos completos" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item label={label('Género *')} validateStatus={errors.genero ? 'error' : ''} help={errMsg('genero')}>
            <Controller name="genero" control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Seleccionar" options={GENEROS.map(g => ({ value: g, label: g }))} />
              )} />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item label={label('Estado Civil *')} validateStatus={errors.estado_civil ? 'error' : ''} help={errMsg('estado_civil')}>
            <Controller name="estado_civil" control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Seleccionar" options={ESTADOS_CIVILES.map(e => ({ value: e, label: e }))} />
              )} />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item label={label('Fecha de Nacimiento *')} validateStatus={errors.fecha_nacimiento ? 'error' : ''}>
            <Controller name="fecha_nacimiento" control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="dd/mm/aaaa"
                  onChange={(date) => {
                    field.onChange(date);
                    if (date) setValue('edad', dayjs().diff(date, 'year'));
                    else setValue('edad', null);
                  }}
                />
              )} />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item label={label('Edad calculada')}>
            <Controller name="edad" control={control} render={({ field }) => <InputNumber {...field} disabled style={{ width: '100%' }} />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={14}>
          <Form.Item label={label('Lugar de Nacimiento')}>
            <Controller name="lugar_nacimiento" control={control} render={({ field }) => <Input {...field} placeholder="Ciudad, Provincia" />} />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: '8px 0 16px' }} />

      {/* SECCIÓN 2: CONTACTO Y RESIDENCIA */}
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8c8c8c', marginBottom: 14 }}>
        Contacto y Residencia
      </p>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item label={label('Provincia')}>
            <Controller name="provincia" control={control}
              render={({ field }) => (
                <Select {...field}
                  showSearch
                  placeholder="Seleccione Provincia"
                  options={Object.keys(PROVINCIAS_ECUADOR).map(p => ({ value: p, label: p }))}
                  onChange={(val) => { field.onChange(val); setValue('ciudad', undefined); }}
                />
              )} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Ciudad')}>
            <Controller name="ciudad" control={control}
              render={({ field }) => (
                <Select {...field}
                  showSearch
                  placeholder={provinciaSeleccionada ? 'Seleccione Ciudad' : 'Elija primero una provincia'}
                  disabled={!provinciaSeleccionada}
                  options={provinciaSeleccionada ? PROVINCIAS_ECUADOR[provinciaSeleccionada].map(c => ({ value: c, label: c })) : []}
                />
              )} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Barrio / Parroquia')}>
            <Controller name="barrio_parroquia" control={control} render={({ field }) => <Input {...field} placeholder="Ej. La Aurora" />} />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item label={label('Dirección Detallada *')} validateStatus={errors.direccion ? 'error' : ''} help={errMsg('direccion')}>
            <Controller name="direccion" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} placeholder="Calle principal, número, intersección y referencia..." />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Teléfono Fijo')}>
            <Controller name="telefono_fijo" control={control} render={({ field }) => <Input {...field} placeholder="04 200 0000" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Celular *')} validateStatus={errors.celular ? 'error' : ''} help={errMsg('celular')}>
            <Controller name="celular" control={control} render={({ field }) => <Input {...field} placeholder="099 000 0000" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label={label('Correo Electrónico')} validateStatus={errors.correo ? 'error' : ''} help={errMsg('correo')}>
            <Controller name="correo" control={control} render={({ field }) => <Input {...field} type="email" placeholder="ejemplo@correo.com" />} />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: '8px 0 16px' }} />

      {/* SECCIÓN 3: LABORAL Y SALUD */}
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8c8c8c', marginBottom: 14 }}>
        Laboral y Salud
      </p>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item label={label('Área de Trabajo')}>
            <Controller name="area_trabajo" control={control}
              render={({ field }) => (
                <Select {...field}
                  showSearch
                  placeholder="Seleccione Área"
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={AREAS_TRABAJO.map(area => ({ value: area, label: area }))}
                />
              )} />
          </Form.Item>
        </Col>
        <Col xs={24} md={10}>
          <Form.Item label={label('Cargo / Puesto Postula')}>
            <Controller name="cargo_postula" control={control}
              render={({ field }) => (
                <Select {...field}
                  showSearch
                  placeholder="Escriba o seleccione el cargo"
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={CARGOS_MINERIA.map(cargo => ({ value: cargo, label: cargo }))}
                />
              )} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label={label('Estado de Salud')}>
            <Controller name="estado_salud" control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Seleccionar" options={ESTADOS_SALUD.map(s => ({ value: s, label: s }))} />
              )} />
          </Form.Item>
        </Col>
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