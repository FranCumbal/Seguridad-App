// src/modules/entrevistas/components/tabs/FinanzasTab.tsx
import { useEffect, useState } from 'react';
import { Button, Input, Select, App, Card, Row, Col, InputNumber, Radio, Typography, Divider } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Props {
  entrevistaId: number;
  data: any;
  onSaved: () => void;
}

const opcionesBienes = ['Casa', 'Departamento', 'Terreno', 'Finca', 'Local Comercial', 'Otro'];

export default function FinanzasTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    ingresos_mensuales: 0,
    egresos_mensuales: 0,
    tiene_bienes_inmuebles: false,
    tiene_vehiculos: false,
    tiene_creditos: false,
    tiene_deudas_personales: false,
    tiene_reportes_negativos: false,
    observaciones: ''
  });

  // Arreglos dinámicos
  const [bienes, setBienes] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [creditos, setCreditos] = useState<any[]>([]);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [reportes, setReportes] = useState<any[]>([]);

  useEffect(() => {
    if (data) {
      setForm({
        ingresos_mensuales: Number(data.ingresos_mensuales || 0),
        egresos_mensuales: Number(data.egresos_mensuales || 0),
        tiene_bienes_inmuebles: data.tiene_bienes_inmuebles ?? false,
        tiene_vehiculos: data.tiene_vehiculos ?? false,
        tiene_creditos: data.tiene_creditos ?? false,
        tiene_deudas_personales: data.tiene_deudas_personales ?? false,
        tiene_reportes_negativos: data.tiene_reportes_negativos ?? false,
        observaciones: data.observaciones || ''
      });
      
      const mapKey = (arr: any[]) => (arr || []).map((item, i) => ({ ...item, key: `item-${item.id || i}` }));
      setBienes(mapKey(data.bienes_inmuebles));
      setVehiculos(mapKey(data.vehiculos));
      setCreditos(mapKey(data.creditos));
      setDeudas(mapKey(data.deudas_personales));
      setReportes(mapKey(data.reportes_negativos));
    }
  }, [data]);

  // Funciones genéricas para manejar los arreglos
  const addArrayItem = (setter: any, initialObject: any) => {
    setter((prev: any) => [...prev, { key: `new-${Date.now()}-${Math.random()}`, ...initialObject }]);
  };
  const updateArrayItem = (setter: any, key: string, field: string, value: any) => {
    setter((prev: any) => prev.map((item: any) => item.key === key ? { ...item, [field]: value } : item));
  };
  const removeArrayItem = (setter: any, key: string) => {
    setter((prev: any) => prev.filter((item: any) => item.key !== key));
  };

  // Al marcar "SÍ", automáticamente agregamos 1 fila vacía si la lista está en cero
  const handleRadioChange = (field: string, value: boolean, listName: string, setter: any, initObj: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (value === true && eval(listName).length === 0) {
      addArrayItem(setter, initObj);
    }
  };

  const handleSave = async () => {
    // VALIDACIÓN OBLIGATORIA: Si marcó Sí, debe haber al menos 1 fila
    if (form.tiene_bienes_inmuebles && bienes.length === 0) return message.error('Debe agregar al menos un bien inmueble');
    if (form.tiene_vehiculos && vehiculos.length === 0) return message.error('Debe agregar al menos un vehículo');
    if (form.tiene_creditos && creditos.length === 0) return message.error('Debe agregar al menos un crédito');
    if (form.tiene_deudas_personales && deudas.length === 0) return message.error('Debe agregar al menos una deuda personal');
    if (form.tiene_reportes_negativos && reportes.length === 0) return message.error('Debe agregar al menos un reporte negativo');

    setSaving(true);
    try {
      const payload = {
        ...form,
        bienes_inmuebles: form.tiene_bienes_inmuebles ? bienes : [],
        vehiculos: form.tiene_vehiculos ? vehiculos : [],
        creditos: form.tiene_creditos ? creditos : [],
        deudas_personales: form.tiene_deudas_personales ? deudas : [],
        reportes_negativos: form.tiene_reportes_negativos ? reportes : []
      };

      await entrevistasApi.saveFinanzas(entrevistaId, payload);
      message.success('Información financiera guardada exitosamente');
      onSaved();
    } catch {
      message.error('Error al guardar la información financiera');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* 1. FLUJO MENSUAL */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Balance de Flujo Mensual</Text>}>
        <Row gutter={16}>
          <Col span={12} md={8}>
            <Text className="block mb-1 text-xs text-gray-400 uppercase">Ingresos Mensuales ($)</Text>
            <InputNumber min={0} className="w-full" value={form.ingresos_mensuales} onChange={v => setForm(p=>({...p, ingresos_mensuales: Number(v)}))} size="small" />
          </Col>
          <Col span={12} md={8}>
            <Text className="block mb-1 text-xs text-gray-400 uppercase">Egresos Mensuales ($)</Text>
            <InputNumber min={0} className="w-full" value={form.egresos_mensuales} onChange={v => setForm(p=>({...p, egresos_mensuales: Number(v)}))} size="small" />
          </Col>
        </Row>
      </Card>

      {/* 2. BIENES INMUEBLES */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Bienes Inmuebles</Text>}>
        <div className="mb-2">
          <Text className="block mb-1 text-xs text-gray-400 uppercase">¿Posee Bienes Inmuebles?</Text>
          <Radio.Group value={form.tiene_bienes_inmuebles} onChange={e => handleRadioChange('tiene_bienes_inmuebles', e.target.value, 'bienes', setBienes, {tipo: undefined, valor: 0})} size="small">
            <Radio value={true}>Sí</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        </div>
        {form.tiene_bienes_inmuebles && (
          <div className="pl-4 border-l-2 border-blue-100 mt-3">
            {bienes.map((b) => (
              <Row key={b.key} gutter={16} className="mb-2 items-end">
                <Col span={12} md={8}>
                  <Text className="block mb-1 text-xs text-gray-400 uppercase">Tipo de Bien</Text>
                  <Select className="w-full" placeholder="Seleccione" value={b.tipo} onChange={v => updateArrayItem(setBienes, b.key, 'tipo', v)} size="small">
                    {opcionesBienes.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                  </Select>
                </Col>
                <Col span={10} md={6}>
                  <Text className="block mb-1 text-xs text-gray-400 uppercase">Valor Estimado ($)</Text>
                  <InputNumber min={0} className="w-full" value={b.valor} onChange={v => updateArrayItem(setBienes, b.key, 'valor', v)} size="small" />
                </Col>
                <Col span={2}>
                  <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeArrayItem(setBienes, b.key)} size="small" />
                </Col>
              </Row>
            ))}
            <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => addArrayItem(setBienes, {tipo: undefined, valor: 0})}>Agregar otro bien</Button>
          </div>
        )}
      </Card>

      {/* 3. VEHÍCULOS (Anchos corregidos a md={6}) */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Vehículos</Text>}>
        <div className="mb-2">
          <Text className="block mb-1 text-xs text-gray-400 uppercase">¿Posee Vehículo(s)?</Text>
          <Radio.Group value={form.tiene_vehiculos} onChange={e => handleRadioChange('tiene_vehiculos', e.target.value, 'vehiculos', setVehiculos, {tipo: undefined, placa: '', modelo: ''})} size="small">
            <Radio value={true}>Sí</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        </div>
        {form.tiene_vehiculos && (
          <div className="pl-4 border-l-2 border-blue-100 mt-3">
            {vehiculos.map((v) => (
              <Row key={v.key} gutter={16} className="mb-2 items-end">
                <Col span={8} md={6}>
                  <Text className="block mb-1 text-xs text-gray-400 uppercase">Tipo</Text>
                  <Select className="w-full" placeholder="Tipo" value={v.tipo} onChange={val => updateArrayItem(setVehiculos, v.key, 'tipo', val)} size="small">
                    <Option value="Carro">Carro</Option>
                    <Option value="Moto">Moto</Option>
                    <Option value="Camión">Camión</Option>
                  </Select>
                </Col>
                <Col span={7} md={6}>
                  <Text className="block mb-1 text-xs text-gray-400 uppercase">Placa</Text>
                  <Input placeholder="PBA-1234" value={v.placa} onChange={e => updateArrayItem(setVehiculos, v.key, 'placa', e.target.value.toUpperCase())} size="small" />
                </Col>
                <Col span={7} md={8}>
                  <Text className="block mb-1 text-xs text-gray-400 uppercase">Modelo / Año</Text>
                  <Input placeholder="Sail 2022" value={v.modelo} onChange={e => updateArrayItem(setVehiculos, v.key, 'modelo', e.target.value)} size="small" />
                </Col>
                <Col span={2}>
                  <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeArrayItem(setVehiculos, v.key)} size="small" />
                </Col>
              </Row>
            ))}
            <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => addArrayItem(setVehiculos, {tipo: undefined, placa: '', modelo: ''})}>Agregar otro vehículo</Button>
          </div>
        )}
      </Card>

      {/* 4. CRÉDITOS */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Créditos Financieros Activos</Text>}>
        <div className="mb-2">
          <Text className="block mb-1 text-xs text-gray-400 uppercase">¿Tiene Créditos Bancarios?</Text>
          <Radio.Group value={form.tiene_creditos} onChange={e => handleRadioChange('tiene_creditos', e.target.value, 'creditos', setCreditos, {entidad: '', monto: 0})} size="small">
            <Radio value={true}>Sí</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        </div>
        {form.tiene_creditos && (
          <div className="pl-4 border-l-2 border-blue-100 mt-3">
            {creditos.map((c) => (
              <Row key={c.key} gutter={16} className="mb-2 items-end">
                <Col span={12} md={10}>
                  <Text className="block mb-1 text-xs text-gray-400 uppercase">Institución Financiera</Text>
                  <Input placeholder="Ej. Banco Pichincha" value={c.entidad} onChange={e => updateArrayItem(setCreditos, c.key, 'entidad', e.target.value)} size="small" />
                </Col>
                <Col span={10} md={6}>
                  <Text className="block mb-1 text-xs text-gray-400 uppercase">Monto ($)</Text>
                  <InputNumber min={0} className="w-full" value={c.monto} onChange={v => updateArrayItem(setCreditos, c.key, 'monto', v)} size="small" />
                </Col>
                <Col span={2}>
                  <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeArrayItem(setCreditos, c.key)} size="small" />
                </Col>
              </Row>
            ))}
            <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => addArrayItem(setCreditos, {entidad: '', monto: 0})}>Agregar otro crédito</Button>
          </div>
        )}
      </Card>

      {/* 5. DEUDAS PERSONALES */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Deudas Personales (Informales)</Text>}>
        <div className="mb-2">
          <Text className="block mb-1 text-xs text-gray-400 uppercase">¿Tiene Deudas Personales?</Text>
          <Radio.Group value={form.tiene_deudas_personales} onChange={e => handleRadioChange('tiene_deudas_personales', e.target.value, 'deudas', setDeudas, {detalle: '', monto: 0})} size="small">
            <Radio value={true}>Sí</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        </div>
        {form.tiene_deudas_personales && (
          <div className="pl-4 border-l-2 border-blue-100 mt-3">
            {deudas.map((d) => (
              <Row key={d.key} gutter={16} className="mb-2 items-end">
                <Col span={12} md={10}>
                  <Text className="block mb-1 text-xs text-gray-400 uppercase">Detalle / Acreedor</Text>
                  <Input placeholder="Familiar, prestamista, etc." value={d.detalle} onChange={e => updateArrayItem(setDeudas, d.key, 'detalle', e.target.value)} size="small" />
                </Col>
                <Col span={10} md={6}>
                  <Text className="block mb-1 text-xs text-gray-400 uppercase">Monto ($)</Text>
                  <InputNumber min={0} className="w-full" value={d.monto} onChange={v => updateArrayItem(setDeudas, d.key, 'monto', v)} size="small" />
                </Col>
                <Col span={2}>
                  <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeArrayItem(setDeudas, d.key)} size="small" />
                </Col>
              </Row>
            ))}
            <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => addArrayItem(setDeudas, {detalle: '', monto: 0})}>Agregar otra deuda</Button>
          </div>
        )}
      </Card>

      {/* 6. REPORTES NEGATIVOS */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Reportes Negativos en Centrales (Mora)</Text>}>
        <div className="mb-2">
          <Text className="block mb-1 text-xs text-gray-400 uppercase">¿Registra Reportes Negativos?</Text>
          <Radio.Group value={form.tiene_reportes_negativos} onChange={e => handleRadioChange('tiene_reportes_negativos', e.target.value, 'reportes', setReportes, {detalle: '', monto: 0})} size="small">
            <Radio value={true}>Sí</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        </div>
        {form.tiene_reportes_negativos && (
          <div className="pl-4 border-l-2 border-blue-100 mt-3">
            {reportes.map((r) => (
              <Row key={r.key} gutter={16} className="mb-2 items-end">
                <Col span={12} md={10}>
                  <Text className="block mb-1 text-xs text-gray-400 uppercase">Entidad / Detalle</Text>
                  <Input placeholder="Coactiva CNT, etc." value={r.detalle} onChange={e => updateArrayItem(setReportes, r.key, 'detalle', e.target.value)} size="small" />
                </Col>
                <Col span={10} md={6}>
                  <Text className="block mb-1 text-xs text-gray-400 uppercase">Monto ($)</Text>
                  <InputNumber min={0} className="w-full" value={r.monto} onChange={v => updateArrayItem(setReportes, r.key, 'monto', v)} size="small" />
                </Col>
                <Col span={2}>
                  <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeArrayItem(setReportes, r.key)} size="small" />
                </Col>
              </Row>
            ))}
            <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => addArrayItem(setReportes, {detalle: '', monto: 0})}>Agregar otro reporte</Button>
          </div>
        )}
      </Card>

      {/* OBSERVACIONES */}
      <Card size="small">
        <Text className="block mb-1 text-xs text-gray-400 uppercase">Observaciones</Text>
        <TextArea rows={2} placeholder="Notas complementarias..." value={form.observaciones} onChange={e => setForm(p=>({...p, observaciones: e.target.value}))} />
      </Card>

      {/* BOTÓN GUARDAR */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}
          className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 160 }}>
          Guardar Finanzas
        </Button>
      </div>
    </div>
  );
}