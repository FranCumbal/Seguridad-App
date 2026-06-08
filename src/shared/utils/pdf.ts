import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import dayjs from 'dayjs';

(pdfMake as any).vfs =
  (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;

const API_URL =
  (import.meta.env.VITE_API_URL as string)?.replace('/api', '') ??
  'http://localhost:3001';

// ─────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────
const v = (val: any, fallback = '—'): string =>
  val === null || val === undefined || val === '' ? fallback : String(val);

const fmtBool = (val: boolean | null | undefined): string =>
  val === true ? 'SÍ' : val === false ? 'NO' : '—';

const fmtFecha = (val: any): string =>
  val ? dayjs(val).format('DD/MM/YYYY') : '—';

const fmtMoneda = (val: any): string =>
  `$${Number(val || 0).toFixed(2)}`;

const fetchBase64 = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// BLOQUE FICHA CLÍNICA
// N campos en la misma fila → cada uno ocupa 100/N %
// Uso: fichaRow(['Cédula','170000'], ['Género','M'], ['E.Civil','S'])
// ─────────────────────────────────────────────────────────────
const fichaRow = (...fields: Array<[string, string]>): any => {
  const n = fields.length;
  return {
    table: {
      widths: Array(n).fill(`${(100 / n).toFixed(2)}%`),
      body: [[
        ...fields.map(([label, value]) => ({
          stack: [
            {
              text: label.toUpperCase(),
              fontSize: 6.5,
              bold: true,
              color: '#64748b',
              margin: [0, 0, 0, 2],
            },
            {
              text: value || '—',
              fontSize: 9,
              color: '#0f172a',
            },
          ],
          margin: [6, 5, 6, 5],
        })),
      ]],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#cbd5e1',
      vLineColor: () => '#cbd5e1',
      fillColor:  () => null,
    },
    margin: [0, 0, 0, 3],
  };
};

// ─────────────────────────────────────────────────────────────
// ENCABEZADO DE SECCIÓN
// ─────────────────────────────────────────────────────────────
const secHeader = (num: string, title: string, mb: number = 6): any => ({
  table: {
    widths: ['*'],
    body: [[{
      text:      `${num}.  ${title.toUpperCase()}`,
      fontSize:  9,
      bold:      true,
      color:      '#ffffff',
      fillColor: '#1e3a5f',
      margin:    [8, 5, 8, 5],
    }]]
  },
  layout:  'noBorders',
  margin: [0, 14, 0, mb], // Permite anular el margen para que la foto se pegue
});

// ─────────────────────────────────────────────────────────────
// TABLA DE DATOS CON CABECERA (listas: familiares, estudios…)
// ─────────────────────────────────────────────────────────────
const dataTable = (
  headers: string[],
  rows: any[][],
  widths: string[],
): any => ({
  table: {
    headerRows: 1,
    widths,
    body: [
      headers.map(h => ({
        text:      h.toUpperCase(),
        fontSize:  7,
        bold:      true,
        color:      '#374151',
        fillColor: '#f1f5f9',
        margin:    [4, 4, 4, 4],
      })),
      ...(rows.length > 0
        ? rows.map(row =>
            row.map(cell => ({
              text:   String(cell ?? '—'),
              fontSize: 8,
              color:  '#0f172a',
              margin: [4, 3, 4, 3],
            }))
          )
        : [[{
            text:    'Sin registros',
            colSpan: headers.length,
            fontSize: 8,
            color:   '#94a3b8',
            alignment: 'center',
            margin:  [0, 8, 0, 8],
          }]]),
    ],
  },
  layout: {
    hLineWidth: (i: number, node: any) =>
      i === 0 || i === node.table.body.length ? 0.8 : 0.3,
    vLineWidth: () => 0.3,
    hLineColor: () => '#cbd5e1',
    vLineColor: () => '#cbd5e1',
    fillColor:  (i: number) => i % 2 === 0 ? '#f8fafc' : null,
  },
  margin: [0, 0, 0, 8],
});

// ─────────────────────────────────────────────────────────────
// CUADRO DE TEXTO (observaciones, conceptos declarados)
// ─────────────────────────────────────────────────────────────
const textBox = (text: string): any => ({
  table: {
    widths: ['*'],
    body: [[{
      text,
      fontSize:  8,
      color:      '#374151',
      italics:   true,
      margin:    [6, 4, 6, 4],
    }]],
  },
  layout: {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => '#cbd5e1',
    vLineColor: () => '#cbd5e1',
    fillColor:  () => '#f8fafc',
  },
  margin: [0, 0, 0, 6],
});

// ─────────────────────────────────────────────────────────────
// SUBTÍTULO INTERNO DE GRUPO (Alcohol, Bienes, etc.)
// ─────────────────────────────────────────────────────────────
const subTitle = (text: string): any => ({
  text:   text.toUpperCase(),
  fontSize: 7,
  bold:   true,
  color:  '#475569',
  margin: [0, 8, 0, 4],
});

// ─────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────
export const generarInformePDF = async (entrevista: any): Promise<void> => {
  if (!entrevista) return;

  const dp   = entrevista.datos_personales || {};
  const fam  = entrevista.familia          || [];
  const est  = entrevista.estudios         || [];
  const fin  = entrevista.finanzas          || {};
  const labArr = entrevista.historial_laboral;
  const lab  = Array.isArray(labArr) ? (labArr[0] || {}) : (labArr || {});
  const drog = entrevista.drogas_alcohol   || {};
  const jud  = entrevista.judicial          || {};
  const inf  = entrevista.infiltracion     || {};
  const val_ = entrevista.validaciones      || {};
  const entrevistadores = entrevista.entrevistadores || [];

  const candidatoFoto = dp.fotografia
    ? await fetchBase64(`${API_URL}${dp.fotografia}`)
    : null;

  // Cargar logos de la empresa desde la carpeta public
  const baseUrl = import.meta.env.BASE_URL || '/';
  const logoIzquierdo = await fetchBase64(`${window.location.origin}${baseUrl}logo-izq.png`);
  const logoDerecho = await fetchBase64(`${window.location.origin}${baseUrl}logo-der.png`);

  // Mapeo asíncrono en paralelo para obtener las fotos y descripciones de los tatuajes
  const tatuajesArr = inf.tatuajes || [];
  const tatuajesProcesados = await Promise.all(
    tatuajesArr.map(async (t: any) => ({
      descripcion: t.descripcion,
      fotoBase64: t.fotografia ? await fetchBase64(`${API_URL}${t.fotografia}`) : null
    }))
  );

  const content: any[] = [];

  // ── ENCABEZADO GENERAL ──────────────────────────────────────
  content.push({
    text:      'INFORME INTEGRAL DE EVALUACIÓN DE SEGURIDAD',
    fontSize:  13,
    bold:      true,
    color:      '#1e3a5f',
    alignment: 'center',
    margin:    [0, 0, 0, 4],
  });
  content.push({
    text: `Código: ${v(entrevista.codigo)}  ·  Fecha: ${fmtFecha(entrevista.fecha_entrevista)}  ·  Estado: ${v(entrevista.estado)}`,
    fontSize:  8,
    color:      '#6b7280',
    alignment: 'center',
    margin:    [0, 0, 0, 4],
  });

  if (entrevistadores.length > 0) {
    content.push({
      text: `Entrevistadores: ${entrevistadores
        .map((e: any) => e.entrevistador?.nombre_completo || '—')
        .join('  ·  ')}`,
      fontSize:  8,
      color:      '#6b7280',
      alignment: 'center',
      margin:    [0, 0, 0, 10],
    });
  }

  content.push({
    canvas: [{
      type: 'line', x1: 0, y1: 0, x2: 515, y2: 0,
      lineWidth: 1.5, lineColor: '#1e3a5f',
    }],
    margin: [0, 0, 0, 12],
  });

  // ── 1. DATOS PERSONALES ─────────────────────────────────────
  // Extraemos el header del sistema de columnas para que ocupe el 100% del ancho
  // y aplicamos un margen inferior de 6 para separar la foto y los datos.
  content.push(secHeader('1', 'Datos Personales', 6));

  if (candidatoFoto) {
    const datosSuperiores = [
      fichaRow(
        ['Cédula / Pasaporte', v(dp.cedula)],
        ['Género',             v(dp.genero)],
        ['Estado Civil',       v(dp.estado_civil)],
      ),
      fichaRow(['Nombres Completos',   v(dp.nombres)]),
      fichaRow(['Apellidos Completos', v(dp.apellidos)]),
    ];

    const datosInferiores = [
      fichaRow(
        ['Libreta Militar',      v(dp.libreta_militar)],
        ['Fecha de Nacimiento',  fmtFecha(dp.fecha_nacimiento)],
        ['Edad',                 dp.edad ? `${dp.edad} años` : '—'],
        ['Estado de Salud',      v(dp.estado_salud)],
      ),
      fichaRow(
        ['Lugar de Nacimiento',  v(dp.lugar_nacimiento)],
        ['Provincia',            v(dp.provincia)],
        ['Ciudad',               v(dp.ciudad)],
        ['Barrio / Parroquia',   v(dp.barrio_parroquia)],
      ),
      fichaRow(['Dirección Domiciliaria', v(dp.direccion)]),
      fichaRow(
        ['Teléfono Fijo',      v(dp.telefono_fijo)],
        ['Celular',            v(dp.celular)],
        ['Correo Electrónico', v(dp.correo)],
      ),
      fichaRow(
        ['Área de Trabajo',  v(dp.area_trabajo)],
        ['Cargo que Postula', v(dp.cargo_postula)],
      ),
    ];

    content.push({
      columns: [
        {
          width: 75,
          margin: [0, 0, 15, 0], // Margen derecho de 15 para separar la foto de la tabla de datos
          table: {
            widths: [75],
            body: [[
              {
                image: candidatoFoto,
                width: 75,
                height: 90,
                alignment: 'center'
              }
            ]]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#1e3a5f',
            vLineColor: () => '#1e3a5f',
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
          }
        },
        { 
          width: '*', 
          stack: datosSuperiores,
          margin: [5, 0, 0, 0] 
        }
      ],
      margin: [0, 0, 0, 3]
    });

    content.push(...datosInferiores);
  } else {
    content.push(
      fichaRow(
        ['Cédula / Pasaporte', v(dp.cedula)],
        ['Libreta Militar',    v(dp.libreta_militar)],
        ['Género',             v(dp.genero)],
        ['Estado Civil',       v(dp.estado_civil)],
      ),
      fichaRow(
        ['Nombres Completos',   v(dp.nombres)],
        ['Apellidos Completos', v(dp.apellidos)],
      ),
      fichaRow(
        ['Fecha de Nacimiento',  fmtFecha(dp.fecha_nacimiento)],
        ['Edad',                 dp.edad ? `${dp.edad} años` : '—'],
        ['Lugar de Nacimiento',  v(dp.lugar_nacimiento)],
        ['Estado de Salud',      v(dp.estado_salud)],
      ),
      fichaRow(
        ['Provincia',          v(dp.provincia)],
        ['Ciudad',               v(dp.ciudad)],
        ['Barrio / Parroquia', v(dp.barrio_parroquia)],
      ),
      fichaRow(['Dirección Domiciliaria', v(dp.direccion)]),
      fichaRow(
        ['Teléfono Fijo',      v(dp.telefono_fijo)],
        ['Celular',            v(dp.celular)],
        ['Correo Electrónico', v(dp.correo)],
      ),
      fichaRow(
        ['Área de Trabajo',  v(dp.area_trabajo)],
        ['Cargo que Postula', v(dp.cargo_postula)],
      ),
    );
  }

  // ── 2. ENTORNO FAMILIAR ─────────────────────────────────────
  content.push(secHeader('2', 'Entorno Familiar'));
  content.push(fichaRow(
    ['Convive con',            v(entrevista.conviveCon?.replace(/,/g, ', '))],
    ['Lugar entre hermanos',   v(entrevista.lugar_hermanos)],
    ['Calificación familiar',  v(entrevista.calificacionFamilia)],
  ));

  if (fam.length > 0) {
    content.push(dataTable(
      ['Parentesco', 'Nombre Completo', 'Edad', 'Ocupación', 'Celular'],
      fam.map((f: any) => [
        v(f.tipo_parentesco), v(f.nombres), f.edad ?? '—',
        v(f.ocupacion), v(f.celular),
      ]),
      ['16%', '29%', '10%', '27%', '18%'],
    ));
  } else {
    content.push({ text: 'No se registraron familiares.', fontSize: 8, color: '#94a3b8', margin: [0, 0, 0, 8] });
  }

  // ── 3. FORMACIÓN ACADÉMICA ──────────────────────────────────
  content.push(secHeader('3', 'Formación Académica'));
  if (est.length > 0) {
    content.push(dataTable(
      ['Nivel', 'Institución', 'Título Obtenido', 'Ciudad', 'Estado', 'Verif.'],
      est.map((e: any) => [
        v(e.nivel), v(e.institucion), v(e.titulo_obtenido),
        v(e.ciudad), v(e.estado), e.verificado ? 'SÍ' : 'NO',
      ]),
      ['13%', '25%', '24%', '14%', '14%', '10%'],
    ));
  } else {
    content.push({ text: 'No se registraron estudios.', fontSize: 8, color: '#94a3b8', margin: [0, 0, 0, 8] });
  }

  // ── 4. SITUACIÓN FINANCIERA ─────────────────────────────────
  content.push(secHeader('4', 'Situación Financiera'));
  content.push(fichaRow(
    ['Ingresos Mensuales', fmtMoneda(fin.ingresos_mensuales)],
    ['Egresos Mensuales',  fmtMoneda(fin.egresos_mensuales)],
  ));

  const finSub = (
    label: string,
    tiene: boolean,
    items: any[],
    headers: string[],
    widths: string[],
    mapper: (i: any) => any[],
  ) => {
    content.push(subTitle(label));
    if (tiene && items?.length > 0) {
      content.push(dataTable(headers, items.map(mapper), widths));
    } else {
      content.push({ text: 'No declara.', fontSize: 8, color: '#94a3b8', margin: [0, 0, 0, 6] });
    }
  };

  finSub('Bienes Inmuebles', fin.tiene_bienes_inmuebles, fin.bienes_inmuebles,
    ['Tipo de Bien', 'Valor Estimado'], ['70%', '30%'],
    (b) => [v(b.tipo), fmtMoneda(b.valor)]);

  finSub('Vehículos', fin.tiene_vehiculos, fin.vehiculos,
    ['Tipo', 'Placa', 'Modelo / Año'], ['25%', '25%', '50%'],
    (veh) => [v(veh.tipo), v(veh.placa), v(veh.modelo)]);

  finSub('Créditos Financieros', fin.tiene_creditos, fin.creditos,
    ['Institución Financiera', 'Monto'], ['70%', '30%'],
    (c) => [v(c.entidad), fmtMoneda(c.monto)]);

  finSub('Deudas Personales', fin.tiene_deudas_personales, fin.deudas_personales,
    ['Detalle / Acreedor', 'Monto'], ['70%', '30%'],
    (d) => [v(d.detalle), fmtMoneda(d.monto)]);

  finSub('Reportes Negativos en Centrales', fin.tiene_reportes_negativos, fin.reportes_negativos,
    ['Entidad / Detalle', 'Monto'], ['70%', '30%'],
    (r) => [v(r.detalle), fmtMoneda(r.monto)]);

  if (fin.observaciones) {
    content.push({ text: `Obs.: ${fin.observaciones}`, fontSize: 8, color: '#6b7280', italics: true, margin: [0, 0, 0, 8] });
  }

  // ── 5. HISTORIAL LABORAL ────────────────────────────────────
  content.push(secHeader('5', 'Historial Laboral'));
  content.push(fichaRow(
    ['Medio por el que conoció la vacante',         v(lab.medio_vacante)],
    ['¿Cometió actos ilícitos en emp. anteriores?', fmtBool(lab.acto_ilicito)],
  ));
  if (lab.detalle_grave) {
    content.push(textBox(`Declaración sobre conductas graves: ${lab.detalle_grave}`));
  }

  const experiencias = lab.experiencias || [];
  if (experiencias.length > 0) {
    content.push(dataTable(
      ['Empresa', 'Cargo', 'Período', 'Salario', 'Certificado'],
      experiencias.map((exp: any) => [
        v(exp.empresa),
        v(exp.cargo),
        `${fmtFecha(exp.fecha_inicio)} — ${exp.trabajo_actual ? 'Actual' : fmtFecha(exp.fecha_fin)}`,
        fmtMoneda(exp.salario),
        exp.certificado_laboral ? 'SÍ' : 'NO',
      ]),
      ['24%', '22%', '30%', '13%', '11%'],
    ));
  } else {
    content.push({ text: 'No se registraron experiencias laborales.', fontSize: 8, color: '#94a3b8', margin: [0, 0, 0, 8] });
  }
  if (lab.observaciones) {
    content.push({ text: `Obs.: ${lab.observaciones}`, fontSize: 8, color: '#6b7280', italics: true, margin: [0, 0, 0, 8] });
  }

  // ── 6. DROGAS Y ALCOHOL ─────────────────────────────────────
  content.push(secHeader('6', 'Drogas y Alcohol'));

  content.push(subTitle('Consumo de Bebidas Alcohólicas'));
  content.push(fichaRow(['¿Consume bebidas alcohólicas?', fmtBool(drog.consume_alcohol)]));
  if (drog.consume_alcohol) {
    content.push(fichaRow(
      ['Última vez que consumió', v(drog.ultima_vez_alcohol)],
      ['Frecuencia de consumo',   v(drog.frecuencia_alcohol)],
      ['Bebida de preferencia',   v(drog.bebida_preferencia)],
    ));
  }
  content.push(fichaRow(
    ['¿Inconvenientes por ingesta de licor?', fmtBool(drog.inconvenientes_alcohol)],
    ['¿Dependencia al licor?',                fmtBool(drog.dependencia_alcohol)],
  ));

  content.push(subTitle('Drogas Ilegales y Control de Confianza'));
  if (drog.concepto_drogas) {
    content.push(textBox(`Concepto sobre drogas ilegales: ${drog.concepto_drogas}`));
  }
  content.push(fichaRow(
    ['¿Ha consumido drogas ilegales?', drog.consume_drogas ? `SÍ — ${v(drog.tipo_drogas)}` : 'NO'],
    ['¿Involucrado en narcotráfico?',  fmtBool(drog.involucrado_narcotrafico)],
  ));
  content.push(fichaRow(
    ['¿Propuestas del narcotráfico?',        fmtBool(drog.propuestas_narcotrafico)],
    ['¿Entorno cercano involucrado en drogas?', fmtBool(drog.entorno_drogas)],
  ));
  if (drog.observaciones) {
    content.push({ text: `Obs.: ${drog.observaciones}`, fontSize: 8, color: '#6b7280', italics: true, margin: [0, 0, 0, 8] });
  }

  // ── 7. ANTECEDENTES JUDICIALES ──────────────────────────────
  content.push(secHeader('7', 'Antecedentes Judiciales'));
  content.push(fichaRow(
    ['¿Ha interpuesto demandas?', fmtBool(jud.interpuesto_demandas)],
    ['¿Ha sido demandado?',       fmtBool(jud.sido_demandado)],
    ['¿Procesos judiciales?',     fmtBool(jud.proceso_judicial)],
  ));
  content.push(fichaRow(
    ['¿Ha tenido detenciones?',
      jud.detenciones ? `SÍ — ${v(jud.observacion_detenciones)}` : 'NO'],
    ['¿Familiares detenidos?',
      jud.familiares_detenidos ? `SÍ — ${v(jud.observacion_familiares_detenidos)}` : 'NO'],
  ));
  content.push(fichaRow(
    ['¿Ha visitado centros de reclusión?',
      jud.visitado_carcel ? `SÍ — ${v(jud.observacion_visitado_carcel)}` : 'NO'],
    ['Última verificación judicial', fmtFecha(jud.ultima_verificacion_judicial)],
  ));
  content.push(fichaRow(
    ['¿Ha manipulado armas de fuego?',
      jud.manipulado_armas ? `SÍ — ${v(jud.motivo_armas)}` : 'NO'],
    ['¿Actividades fuera de la ley?', fmtBool(jud.actividades_fuera_ley)],
    ['¿Propuestas ilegales recibidas?', fmtBool(jud.propuestas_ilegales)],
  ));
  content.push(fichaRow(
    ['¿Entorno con antecedentes penales?',  fmtBool(jud.entorno_ilegal_antecedentes)],
    ['¿Participación en actos ilegales?',   fmtBool(jud.participacion_actos_ilegales)],
  ));
  if (jud.concepto_margen_ley) {
    content.push(textBox(`Concepto sobre grupos al margen de la ley: ${jud.concepto_margen_ley}`));
  }
  if (jud.vinculos_margen_ley) {
    content.push(textBox(`Vínculos declarados: ${jud.vinculos_margen_ley}`));
  }
  if (jud.observaciones_generales) {
    content.push({ text: `Obs.: ${jud.observaciones_generales}`, fontSize: 8, color: '#6b7280', italics: true, margin: [0, 0, 0, 8] });
  }

  // ── 8. CONTROL DE INFILTRACIÓN ──────────────────────────────
  content.push(secHeader('8', 'Control de Infiltración'));
  if (inf.motivacion_ingreso) {
    content.push(textBox(`Motivación para ingresar a la empresa: ${inf.motivacion_ingreso}`));
  }
  content.push(fichaRow(
    ['¿Contactos dentro de la empresa?',
      inf.contactos_empresa ? `SÍ — ${v(inf.detalle_contactos)}` : 'NO'],
    ['¿Intención de cometer actos ilícitos?', fmtBool(inf.intencion_ilicitos)],
  ));
  content.push(fichaRow(
    ['¿Acuerdos con terceros para ilícitos?', fmtBool(inf.acuerdo_ilicitos)],
    ['¿Instrucciones para causar daños?',     fmtBool(inf.instrucciones_dano)],
  ));

  // MEJORA: Implementación de la visualización de tatuajes
  if (tatuajesProcesados.length > 0) {
    content.push(subTitle('Registro de Tatuajes y Marcas Identificativas'));

    tatuajesProcesados.forEach((t) => {
      content.push({
        unbreakable: true, // FORZA A QUE LA IMAGEN Y LA DESCRIPCIÓN NUNCA SE SEPAREN DE PÁGINA
        columns: [
          {
            width: 75, // Ancho fijo replicado de la foto del candidato
            margin: [0, 0, 15, 0], // Margen derecho para separar de la descripción
            table: {
              widths: [75],
              body: [[
                t.fotoBase64 
                  // Usamos fit en lugar de width/height absolutos para evitar que tatuajes largos/anchos se deformen
                  ? { image: t.fotoBase64, fit: [75, 75], alignment: 'center' } 
                  : { text: 'Sin foto', fontSize: 7, color: '#94a3b8', alignment: 'center', margin: [0, 30, 0, 30] }
              ]]
            },
            layout: {
              hLineWidth: () => 0.5, vLineWidth: () => 0.5,
              // Usamos el color azul corporativo puro para la cuadrícula
              hLineColor: () => '#1e3a5f', vLineColor: () => '#1e3a5f',
              paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0
            }
          },
          {
            width: '*', // Ocupa espacio disponible para la descripción
            margin: [5, 0, 0, 0], // Margen izquierdo para separar de la foto
            table: {
              widths: ['*'],
              body: [[{
                stack: [
                  { text: 'DESCRIPCIÓN DEL TATUAJE', fontSize: 6.5, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
                  { text: t.descripcion || 'Sin descripción', fontSize: 9, color: '#0f172a' }
                ],
                margin: [6, 5, 6, 5],
              }]]
            },
            layout: {
              hLineWidth: () => 0.5, vLineWidth: () => 0.5,
              hLineColor: () => '#cbd5e1', vLineColor: () => '#cbd5e1',
              fillColor: () => null
            }
          }
        ],
        margin: [0, 0, 0, 6] // Margen inferior del bloque para separar un tatuaje del siguiente
      });
    });
  }

  // Nivel de riesgo — sin color, solo texto encasillado
  const riesgo = (inf.nivel_riesgo || 'BAJO').toUpperCase();
  content.push(fichaRow(['Nivel de Riesgo de Infiltración Evaluado', riesgo]));

  if (inf.observaciones) {
    content.push({ text: `Obs.: ${inf.observaciones}`, fontSize: 8, color: '#6b7280', italics: true, margin: [0, 0, 0, 8] });
  }

  // ── 9. VALIDACIONES Y RESULTADO FINAL ───────────────────────
  content.push(secHeader('9', 'Validaciones y Resultado Final'));
  content.push(fichaRow(
    ['Documentos verificados',  fmtBool(val_.documentos_verificados)],
    ['Referencias verificadas', fmtBool(val_.referencias_verificadas)],
    ['Aprobado por',            v(val_.aprobado_por)],
    ['Fecha de validación',     fmtFecha(val_.fecha_validacion)],
  ));
  content.push(fichaRow([
    'Calificación obtenida',
    val_.calificacion != null ? `${val_.calificacion} / 100` : '—',
  ]));

  // Resultado final — se mantiene con color por ser el veredicto
  const resultado = (val_.resultado_general || 'PENDIENTE').toUpperCase();
  const resCfg: Record<string, { bg: string; fg: string }> = {
    APROBADO:    { bg: '#16a34a', fg: '#ffffff' },
    RECHAZADO:   { bg: '#dc2626', fg: '#ffffff' },
    CONDICIONAL: { bg: '#2563eb', fg: '#ffffff' },
    PENDIENTE:   { bg: '#d97706', fg: '#000000' },
  };
  const rc = resCfg[resultado] ?? resCfg.PENDIENTE;
  content.push({
    table: {
      widths: ['*'],
      body: [[{
        text:      `RESULTADO FINAL: ${resultado}`,
        fontSize:  13,
        bold:      true,
        color:      rc.fg,
        fillColor: rc.bg,
        alignment: 'center',
        margin:    [0, 10, 0, 10],
      }]],
    },
    layout: 'noBorders',
    margin: [0, 6, 0, 10],
  });

  if (val_.recomendacion) {
    content.push(textBox(`Recomendación: ${val_.recomendacion}`));
  }
  if (val_.observaciones_finales) {
    content.push(textBox(`Observaciones finales: ${val_.observaciones_finales}`));
  }

  // ── BLOQUE DE FIRMAS ────────────────────────────────────────
  content.push({
    canvas: [{
      type: 'line', x1: 0, y1: 0, x2: 515, y2: 0,
      lineWidth: 0.5, lineColor: '#cbd5e1',
    }],
    margin: [0, 20, 0, 24],
  });

  if (entrevistadores && entrevistadores.length > 0) {
    // Agrupamos los entrevistadores de 2 en 2 para mantener la estética de columnas
    const chunks = [];
    for (let i = 0; i < entrevistadores.length; i += 2) {
      chunks.push(entrevistadores.slice(i, i + 2));
    }

    chunks.forEach((chunk) => {
      // Mapeamos los entrevistadores del grupo actual a la estructura de columna de firma
      const firmasColumna = chunk.map((e: any) => {
        const nombre = e.entrevistador?.nombre_completo || 'Firma de Evaluador';
        const cargo = e.entrevistador?.cargo || 'Analista de Seguridad';

        return {
          width: '45%',
          stack: [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 210, y2: 0, lineWidth: 0.5, lineColor: '#374151' }] },
            { text: nombre, fontSize: 8, bold: true, color: '#374151', alignment: 'center', margin: [0, 4, 0, 2] },
            { text: cargo, fontSize: 8, color: '#6b7280', alignment: 'center', margin: [0, 0, 0, 2] },
            { text: 'Firma y Sello', fontSize: 7, color: '#9ca3af', alignment: 'center' },
          ],
        };
      });

      // Aseguramos la separación del 10% en el medio del documento para cuadrar visualmente
      const rowColumns: any[] = [];
      if (firmasColumna.length === 2) {
        rowColumns.push(firmasColumna[0], { width: '10%', text: '' }, firmasColumna[1]);
      } else {
        // Si hay un número impar (ej: 1 o 3), el sobrante queda a la izquierda
        rowColumns.push(firmasColumna[0], { width: '10%', text: '' }, { width: '45%', text: '' });
      }

      content.push({
        columns: rowColumns,
        margin: [0, 0, 0, 30], // Margen inferior en caso de existir más de 2 entrevistadores (múltiples filas)
      });
    });
  } else {
    // Fallback de seguridad en caso de que una entrevista no tenga entrevistador asignado
    content.push({
      columns: [
        {
          width: '45%',
          stack: [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 210, y2: 0, lineWidth: 0.5, lineColor: '#374151' }] },
            { text: 'Evaluador / Analista de Seguridad', fontSize: 8, color: '#6b7280', alignment: 'center', margin: [0, 4, 0, 2] },
            { text: 'Firma y Sello', fontSize: 7, color: '#9ca3af', alignment: 'center' },
          ],
        },
        { width: '10%', text: '' },
        { width: '45%', text: '' },
      ],
    });
  }

  // ─────────────────────────────────────────────────────────────
  // DEFINICIÓN FINAL DEL DOCUMENTO
  // ─────────────────────────────────────────────────────────────
  const docDefinition: any = {
    pageSize:    'A4',
    pageMargins: [40, 110, 40, 50], // Incremento sustancial del margen superior para evitar colisiones

    // Encabezado con logos de escala máxima
    header: () => {
      return {
        margin: [40, 15, 40, 0],
        columns: [
          logoIzquierdo 
            ? { image: logoIzquierdo, fit: [200, 85], alignment: 'left', opacity: 0.35 } 
            : { text: '', width: 200 },
          { text: '', width: '*' }, 
          logoDerecho 
            ? { image: logoDerecho, fit: [200, 85], alignment: 'right', opacity: 0.35 } 
            : { text: '', width: 200 },
        ]
      };
    },

    // Footer elegante con línea azul y símbolo corporativo
    footer: (currentPage: number, pageCount: number): any => ({
      margin: [40, 6, 40, 0],
      stack: [
        {
          canvas: [{
            type: 'line', x1: 0, y1: 0, x2: 515, y2: 0,
            lineWidth: 1.5, lineColor: '#1e3a5f',
          }],
          margin: [0, 0, 0, 5],
        },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: '◆  ', fontSize: 9, color: '#1e3a5f' },
                {
                  text: 'SEGURIDAD GRUPO EMPRESARIAL ROJAS',
                  fontSize: 8,
                  bold: true,
                  color: '#1e3a5f',
                  characterSpacing: 0.5,
                },
              ],
            },
            {
              width: 'auto',
              text: [
                { text: String(currentPage), fontSize: 10, bold: true, color: '#1e3a5f' },
                { text: `  /  ${pageCount}`, fontSize: 8, color: '#94a3b8' },
              ],
              alignment: 'right',
            },
          ],
        },
      ],
    }),

    content,
    defaultStyle: { font: 'Roboto', fontSize: 9, color: '#0f172a' },
  };

  // ─────────────────────────────────────────────────────────────
  // GENERAR Y DESCARGAR DIRECTAMENTE CON PDFMAKE
  // ─────────────────────────────────────────────────────────────
  const pdfDoc = (pdfMake as any).createPdf(docDefinition);
  pdfDoc.download(`INFORME_${v(dp.cedula, 'CANDIDATO')}.pdf`);
};