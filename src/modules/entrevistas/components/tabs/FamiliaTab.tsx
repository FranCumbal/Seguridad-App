// src/modules/entrevistas/components/tabs/FamiliaTab.tsx
import { useEffect, useState, useMemo } from 'react';
import { Button, Input, Select, Table, Popconfirm, Typography, Card, Row, Col, InputNumber, Checkbox, App } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;

interface Miembro {
  key: string;
  tipo_parentesco: string;
  nombres: string;
  edad?: number;
  ocupacion?: string;
  celular?: string;
}

interface Props { 
  entrevistaId: number; 
  data: any[]; 
  entrevistaData?: any; 
  onSaved: () => void; 
}

const opcionesConvivencia = ['Padres', 'Cónyuge', 'Hijos', 'Hermanos', 'Tíos', 'Abuelos', 'Otros'];
const opcionesCalificacion = ['Unida', 'Estable', 'Distante', 'Conflictiva', 'Disfuncional'];
const tiposParentesco = ['Padre', 'Madre', 'Cónyuge', 'Hijo/a', 'Hermano/a', 'Abuelo/a', 'Otro'];

// REGLA DE NEGOCIO PARA EL PDF: Límites máximos permitidos por parentesco
const limitesParentesco: Record<string, number> = {
  'Padre': 1,
  'Madre': 1,
  'Cónyuge': 1,
  // Los demás parentescos (Hijos, Hermanos) no están aquí, por lo que no tendrán límite (undefined)
};

export default function FamiliaTab({ entrevistaId, data, entrevistaData, onSaved }: Props) {
  const { message } = App.useApp();
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [conviveCon, setConviveCon] = useState<string[]>([]);
  const [calificacionFamilia, setCalificacionFamilia] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.length > 0) {
      setMiembros(data.map((m, i) => ({ ...m, key: `m-${i}` })));
    }
    if (entrevistaData) {
      if (entrevistaData.conviveCon) {
        setConviveCon(entrevistaData.conviveCon.split(','));
      }
      if (entrevistaData.calificacionFamilia) {
        setCalificacionFamilia(entrevistaData.calificacionFamilia);
      }
    }
  }, [data, entrevistaData]);

  const addMiembro = (parentesco: string = '') => {
    setMiembros((prev) => [...prev, { key: `m-${Date.now()}-${Math.random()}`, tipo_parentesco: parentesco, nombres: '' }]);
  };

  const updateMiembro = (key: string, field: keyof Miembro, value: any) => {
    setMiembros((prev) => prev.map((m) => m.key === key ? { ...m, [field]: value } : m));
  };

  const removeMiembro = (key: string) => {
    setMiembros((prev) => prev.filter((m) => m.key !== key));
  };

  const handleContadorChange = (parentesco: string, nuevoValor: number | null) => {
    const valor = nuevoValor || 0;
    
    setMiembros(prev => {
      const actuales = prev.filter(m => m.tipo_parentesco === parentesco);
      
      if (valor > actuales.length) {
        const cantidadAAgregar = valor - actuales.length;
        const nuevos = Array.from({ length: cantidadAAgregar }).map(() => ({
          key: `m-${Date.now()}-${Math.random()}`,
          tipo_parentesco: parentesco,
          nombres: ''
        }));
        return [...prev, ...nuevos];
      } else if (valor < actuales.length) {
        const aEliminar = actuales.length - valor;
        let eliminados = 0;
        const nuevoArreglo = [...prev];
        for (let i = nuevoArreglo.length - 1; i >= 0; i--) {
          if (nuevoArreglo[i].tipo_parentesco === parentesco && eliminados < aEliminar) {
            nuevoArreglo.splice(i, 1);
            eliminados++;
          }
        }
        return nuevoArreglo;
      }
      return prev;
    });
  };

  const conteoParentescos = useMemo(() => {
    const conteo: Record<string, number> = {};
    tiposParentesco.forEach(tipo => {
      conteo[tipo] = miembros.filter(m => m.tipo_parentesco === tipo).length;
    });
    return conteo;
  }, [miembros]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        conviveCon: conviveCon.length > 0 ? conviveCon.join(',') : null,
        calificacionFamilia: calificacionFamilia,
        familiares: miembros.filter(m => m.tipo_parentesco)
      };

      await entrevistasApi.saveFamilia(entrevistaId, payload);
      message.success('Información familiar guardada');
      onSaved();
    } catch { 
      message.error('Error al guardar familia'); 
    } finally { 
      setSaving(false); 
    }
  };

  const columns = [
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' }}>Parentesco</Text>,
      key: 'tipo_parentesco',
      width: 140,
      render: (_: any, r: Miembro) => (
        <Select 
          value={r.tipo_parentesco || undefined} 
          onChange={(v) => updateMiembro(r.key, 'tipo_parentesco', v)} 
          style={{ width: '100%' }} 
          size="small"
          placeholder="Seleccione"
        >
          {tiposParentesco.map((p) => {
            // LÓGICA DEL CANDADO: Si ya existe un límite y lo hemos alcanzado, bloqueamos la opción
            // (a menos que esta sea la fila que ya tiene asignado ese parentesco)
            const limiteAlcanzado = limitesParentesco[p] !== undefined && conteoParentescos[p] >= limitesParentesco[p];
            const esElSeleccionadoActualmente = r.tipo_parentesco === p;
            const debeDeshabilitar = limiteAlcanzado && !esElSeleccionadoActualmente;

            return (
              <Select.Option key={p} value={p} disabled={debeDeshabilitar}>
                {p}
              </Select.Option>
            );
          })}
        </Select>
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' }}>Nombre Completo</Text>,
      key: 'nombres',
      render: (_: any, r: Miembro) => (
        <Input value={r.nombres} onChange={(e) => updateMiembro(r.key, 'nombres', e.target.value)} placeholder="Opcional" size="small" />
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' }}>Edad</Text>,
      key: 'edad',
      width: 80,
      render: (_: any, r: Miembro) => (
        <Input type="number" value={r.edad} onChange={(e) => updateMiembro(r.key, 'edad', Number(e.target.value))} size="small" />
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' }}>Ocupación</Text>,
      key: 'ocupacion',
      render: (_: any, r: Miembro) => (
        <Input value={r.ocupacion} onChange={(e) => updateMiembro(r.key, 'ocupacion', e.target.value)} placeholder="Opcional" size="small" />
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' }}>Celular</Text>,
      key: 'celular',
      width: 140,
      render: (_: any, r: Miembro) => (
        <Input value={r.celular} onChange={(e) => updateMiembro(r.key, 'celular', e.target.value)} placeholder="Opcional" size="small" />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, r: Miembro) => (
        <Popconfirm title="¿Eliminar este miembro?" onConfirm={() => removeMiembro(r.key)} okText="Sí" cancelText="No">
          <Button danger size="small" icon={<DeleteOutlined />} type="text" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <Card size="small" className="mb-4" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Dinámica Familiar</Text>}>
        <Row gutter={[16, 16]}>
          <Col span={24} md={16}>
            <Text className="block mb-2 text-sm font-medium">La persona evaluada manifiesta vivir en su lugar de residencia actualmente con:</Text>
            <Checkbox.Group 
              options={opcionesConvivencia} 
              value={conviveCon} 
              onChange={(checkedValues) => setConviveCon(checkedValues as string[])} 
            />
          </Col>
          <Col span={24} md={8}>
            <Text className="block mb-2 text-sm font-medium">Califica a tu familia:</Text>
            <Select 
              className="w-full"
              placeholder="Seleccionar calificación" 
              value={calificacionFamilia}
              onChange={setCalificacionFamilia}
              options={opcionesCalificacion.map(opt => ({ label: opt, value: opt }))} 
            />
          </Col>
        </Row>
      </Card>

      <Card size="small" className="mb-4" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Resumen de Composición (Modificable)</Text>}>
        <Row gutter={[16, 16]}>
          {tiposParentesco.map((tipo) => (
            <Col span={12} md={6} lg={3} key={`contador-${tipo}`}>
              <Text className="block mb-1 text-xs text-gray-500 uppercase">{tipo}</Text>
              <InputNumber
                min={0}
                max={limitesParentesco[tipo]} // <-- Aplicamos el límite máximo al InputNumber
                className="w-full"
                value={conteoParentescos[tipo]}
                onChange={(val) => handleContadorChange(tipo, val)}
              />
            </Col>
          ))}
        </Row>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#8b949e', fontSize: 13 }}>Detalle de familiares</Text>
        <Button size="small" icon={<PlusOutlined />} onClick={() => addMiembro('')}
          style={{ background: 'rgba(22,119,255,0.1)', border: '1px solid rgba(22,119,255,0.2)', color: '#58a6ff' }}>
          Agregar fila manual
        </Button>
      </div>
      
      <Table dataSource={miembros} columns={columns} rowKey="key" pagination={false} size="small" style={{ marginBottom: 20 }} />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}
          className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 160 }}>
          Guardar Familia
        </Button>
      </div>
    </div>
  );
}