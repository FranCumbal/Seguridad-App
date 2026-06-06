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
const v = (val: any, fallback = 'No registra'): string =>
  val === null || val === undefined || val === '' ? fallback : String(val);

const fmtBool = (val: boolean | null | undefined): string =>
  val === true ? 'SÍ' : val === false ? 'NO' : 'No registra';

const fmtFecha = (val: any): string =>
  val ? dayjs(val).format('DD/MM/YYYY') : 'No registra';

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
// ESTILOS
// ─────────────────────────────────────────────────────────────
const styles: any = {
  documentTitle: {
    fontSize: 13,
    bold: true,
    color: '#1e3a5f',
    alignment: 'center',
    margin: [0, 0, 0, 4],
  },
  documentSubtitle: {
    fontSize: 8,
    color: '#6b7280',
    alignment: 'center',
    margin: [0, 0, 0, 4],
  },
  sectionHeader: {
    fontSize: 9,
    bold: true,
    color: '#ffffff',
  },
  label: {
    fontSize: 8,
    bold: true,
    color: '#6b7280',
  },
  value: {
    fontSize: 8,
    color: '#111827',
  },
  th: {
    fontSize: 7,
    bold: true,
    color: '#374151',
    fillColor: '#e5e7eb',
  },
  td: {
    fontSize: 8,
    color: '#111827',
  },
  boolYes: { fontSize: 8, color: '#166534', bold: true },
  boolNo:  { fontSize: 8, color: '#374151' },
};

// ─────────────────────────────────────────────────────────────
// LAYOUTS REUTILIZABLES
// ─────────────────────────────────────────────────────────────
const layoutLines = {
  hLineWidth: (i: number, node: any) =>
    i === 0 || i === node.table.body.length ? 0 : 0.5,
  vLineWidth: () => 0,
  hLineColor: () => '#e5e7eb',
  paddingLeft:   () => 4,
  paddingRight:  () => 4,
  paddingTop:    () => 3,
  paddingBottom: () => 3,
};

const layoutGrid = {
  hLineWidth: (i: number, node: any) =>
    i === 0 || i === node.table.body.length ? 0.5 : 0.25,
  vLineWidth: () => 0.25,
  hLineColor: () => '#d1d5db',
  vLineColor: () => '#d1d5db',
  fillColor:  (i: number) =>
    i === 0 ? '#f3f4f6' : i % 2 === 0 ? '#f9fafb' : null,
  paddingLeft:   () => 4,
  paddingRight:  () => 4,
  paddingTop:    () => 3,
  paddingBottom: () => 3,
};

// ─────────────────────────────────────────────────────────────
// BLOQUES DE CONSTRUCCIÓN
// ─────────────────────────────────────────────────────────────

/** Encabezado de sección con fondo azul */
const secHeader = (num: string, title: string): any => ({
  table: {
    widths: ['*'],
    body: [[{
      text:   `${num}. ${title.toUpperCase()}`,
      style:  'sectionHeader',
      fillColor: '#1e3a5f',
      margin: [8, 5, 8, 5],
    }]],
  },
  layout: 'noBorders',
  margin: [0, 14, 0, 8],
});

/** Tabla de dos columnas: etiqueta | valor */
const infoTable = (rows: [string, string][], widths = ['38%', '62%']): any => ({
  table: {
    widths,
    body: rows.map(([label, value]) => [
      { text: label, style: 'label' },
      { text: value, style: 'value' },
    ]),
  },
  layout: layoutLines,
  margin: [0, 0, 0, 8],
});

/** Tabla de datos con cabecera */
const dataTable = (
  headers: string[],
  rows: (string | number)[][],
  widths: string[],
): any => ({
  table: {
    headerRows: 1,
    widths,
    body: [
      headers.map((h) => ({ text: h, style: 'th', margin: [2, 3, 2, 3] })),
      ...(rows.length > 0
        ? rows.map((row) =>
            row.map((cell) => ({
              text:  String(cell ?? '—'),
              style: 'td',
              margin: [2, 2, 2, 2],
            }))
          )
        : [[{
            text:    'Sin registros',
            colSpan: headers.length,
            style:   'td',
            alignment: 'center',
            color:   '#9ca3af',
            margin:  [0, 6, 0, 6],
          }]]),
    ],
  },
  layout: layoutGrid,
  margin: [0, 0, 0, 8],
});

/** Fila de sí/no con detalle opcional */
const yesNoRow = (
  label: string,
  value: boolean | null | undefined,
  detail?: string,
): any[] => {
  const boolText  = value !== null && value !== undefined ? fmtBool(value) : '';
  const displayed = [boolText, detail].filter(Boolean).join('  →  ') || 'No registra';
  const isYes     = value === true;
  return [
    { text: label,     style: 'label' },
    { text: displayed, style: isYes ? 'boolYes' : 'boolNo' },
  ];
};

/** Cuadro de texto con borde gris */
const textBox = (text: string): any => ({
  table: {
    widths: ['*'],
    body: [[{ text, fontSize: 8, color: '#374151', margin: [6, 4, 6, 4] }]],
  },
  layout: {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => '#e5e7eb',
    vLineColor: () => '#e5e7eb',
  },
  margin: [0, 0, 0, 8],
});

/** Separador horizontal */
const divider = (margin = [0, 8, 0, 8]): any => ({
  canvas: [{
    type: 'line', x1: 0, y1: 0, x2: 515, y2: 0,
    lineWidth: 0.5, lineColor: '#d1d5db',
  }],
  margin,
});

// ─────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────
export const generarInformePDF = async (entrevista: any): Promise<void> => {
  if (!entrevista) return;

  // Extraer datos con fallback seguro
  const dp   = entrevista.datos_personales || {};
  const fam  = entrevista.familia          || [];
  const est  = entrevista.estudios         || [];
  const fin  = entrevista.finanzas         || {};
  const labArr = entrevista.historial_laboral;
  const lab  = Array.isArray(labArr) ? (labArr[0] || {}) : (labArr || {});
  const drog = entrevista.drogas_alcohol   || {};
  const jud  = entrevista.judicial         || {};
  const inf  = entrevista.infiltracion     || {};
  const val_ = entrevista.validaciones     || {};
  const entrevistadores = entrevista.entrevistadores || [];

  // Foto del candidato en base64
  const candidatoFoto = dp.fotografia
    ? await fetchBase64(`${API_URL}${dp.fotografia}`)
    : null;

  // ───── CONTENIDO DEL DOCUMENTO ─────────────────────────────
  const content: any[] = [];

  // ── ENCABEZADO GENERAL ──
  content.push(
    { text: 'INFORME INTEGRAL DE EVALUACIÓN DE SEGURIDAD', style: 'documentTitle' },
    {
      text: `Código: ${v(entrevista.codigo)}  ·  Fecha: ${fmtFecha(entrevista.fecha_entrevista)}  ·  Estado: ${v(entrevista.estado)}`,
      style: 'documentSubtitle',
    },
  );

  if (entrevistadores.length > 0) {
    content.push({
      text: `Entrevistadores: ${entrevistadores
        .map((e: any) => e.entrevistador?.nombre_completo || '—')
        .join('  ·  ')}`,
      fontSize: 8,
      color: '#6b7280',
      alignment: 'center',
      margin: [0, 0, 0, 10],
    });
  }

  content.push({
    canvas: [{
      type: 'line', x1: 0, y1: 0, x2: 515, y2: 0,
      lineWidth: 1.5, lineColor: '#1e3a5f',
    }],
    margin: [0, 0, 0, 14],
  });

  // ── SECCIÓN 1: DATOS PERSONALES ──
  content.push(secHeader('1', 'Datos Personales'));

  const datosPersonalesTable = infoTable([
    ['Cédula / Pasaporte',    v(dp.cedula)],
    ['Libreta Militar',       v(dp.libreta_militar)],
    ['Nombres',               v(dp.nombres)],
    ['Apellidos',             v(dp.apellidos)],
    ['Género',                v(dp.genero)],
    ['Estado Civil',          v(dp.estado_civil)],
    ['Fecha de Nacimiento',   fmtFecha(dp.fecha_nacimiento)],
    ['Edad',                  dp.edad ? `${dp.edad} años` : 'No registra'],
    ['Lugar de Nacimiento',   v(dp.lugar_nacimiento)],
    ['Estado de Salud',       v(dp.estado_salud)],
  ]);

  // Si hay foto, mostrar al lado de los datos
  if (candidatoFoto) {
    content.push({
      columns: [
        { width: '75%', stack: [datosPersonalesTable] },
        {
          width: '25%',
          stack: [{
            image:     candidatoFoto,
            width:     100,
            height:    120,
            alignment: 'center',
            margin:    [8, 0, 0, 0],
          }],
        },
      ],
      columnGap: 10,
    });
  } else {
    content.push(datosPersonalesTable);
  }

  content.push(infoTable([
    ['Provincia',            v(dp.provincia)],
    ['Ciudad',               v(dp.ciudad)],
    ['Barrio / Parroquia',   v(dp.barrio_parroquia)],
    ['Dirección',            v(dp.direccion)],
    ['Teléfono Fijo',        v(dp.telefono_fijo)],
    ['Celular',              v(dp.celular)],
    ['Correo Electrónico',   v(dp.correo)],
    ['Área de Trabajo',      v(dp.area_trabajo)],
    ['Cargo que Postula',    v(dp.cargo_postula)],
  ]));

  // ── SECCIÓN 2: ENTORNO FAMILIAR ──
  content.push(secHeader('2', 'Entorno Familiar'));
  content.push(infoTable([
    ['Convive con',           v(entrevista.conviveCon?.replace(/,/g, ', '))],
    ['Calificación familiar', v(entrevista.calificacionFamilia)],
  ]));

  if (fam.length > 0) {
    content.push(dataTable(
      ['Parentesco', 'Nombre Completo', 'Edad', 'Ocupación', 'Celular'],
      fam.map((f: any) => [
        v(f.tipo_parentesco),
        v(f.nombres),
        f.edad ?? '—',
        v(f.ocupacion),
        v(f.celular),
      ]),
      ['16%', '28%', '10%', '28%', '18%'],
    ));
  } else {
    content.push({ text: 'No se registraron familiares.', style: 'td', color: '#9ca3af', margin: [0, 0, 0, 8] });
  }

  // ── SECCIÓN 3: FORMACIÓN ACADÉMICA ──
  content.push(secHeader('3', 'Formación Académica'));

  if (est.length > 0) {
    content.push(dataTable(
      ['Nivel', 'Institución', 'Título Obtenido', 'Ciudad', 'Estado', 'Verif.'],
      est.map((e: any) => [
        v(e.nivel),
        v(e.institucion),
        v(e.titulo_obtenido),
        v(e.ciudad),
        v(e.estado),
        e.verificado ? 'SÍ' : 'NO',
      ]),
      ['13%', '24%', '24%', '15%', '14%', '10%'],
    ));
  } else {
    content.push({ text: 'No se registraron estudios.', style: 'td', color: '#9ca3af', margin: [0, 0, 0, 8] });
  }

  // ── SECCIÓN 4: SITUACIÓN FINANCIERA ──
  content.push(secHeader('4', 'Situación Financiera'));
  content.push(infoTable([
    ['Ingresos Mensuales', fmtMoneda(fin.ingresos_mensuales)],
    ['Egresos Mensuales',  fmtMoneda(fin.egresos_mensuales)],
  ]));

  const finSubSection = (title: string, tiene: boolean, items: any[], cols: string[], headers: string[], rowMapper: (i: any) => any[]) => {
    content.push({ text: title, style: 'label', margin: [0, 4, 0, 4] });
    if (tiene && items?.length > 0) {
      content.push(dataTable(headers, items.map(rowMapper), cols));
    } else {
      content.push({ text: 'No declara.', fontSize: 8, color: '#9ca3af', margin: [0, 0, 0, 8] });
    }
  };

  finSubSection('Bienes Inmuebles', fin.tiene_bienes_inmuebles, fin.bienes_inmuebles,
    ['70%', '30%'], ['Tipo de Bien', 'Valor Estimado'],
    (b) => [v(b.tipo), fmtMoneda(b.valor)]);

  finSubSection('Vehículos', fin.tiene_vehiculos, fin.vehiculos,
    ['25%', '25%', '50%'], ['Tipo', 'Placa', 'Modelo / Año'],
    (veh) => [v(veh.tipo), v(veh.placa), v(veh.modelo)]);

  finSubSection('Créditos Financieros', fin.tiene_creditos, fin.creditos,
    ['70%', '30%'], ['Institución Financiera', 'Monto'],
    (c) => [v(c.entidad), fmtMoneda(c.monto)]);

  finSubSection('Deudas Personales', fin.tiene_deudas_personales, fin.deudas_personales,
    ['70%', '30%'], ['Detalle / Acreedor', 'Monto'],
    (d) => [v(d.detalle), fmtMoneda(d.monto)]);

  finSubSection('Reportes Negativos en Centrales', fin.tiene_reportes_negativos, fin.reportes_negativos,
    ['70%', '30%'], ['Entidad / Detalle', 'Monto'],
    (r) => [v(r.detalle), fmtMoneda(r.monto)]);

  if (fin.observaciones) {
    content.push({ text: `Observaciones: ${fin.observaciones}`, fontSize: 8, color: '#6b7280', italics: true, margin: [0, 0, 0, 8] });
  }

  // ── SECCIÓN 5: HISTORIAL LABORAL ──
  content.push(secHeader('5', 'Historial Laboral'));
  content.push(infoTable([
    ['Medio por el que conoció la vacante',          v(lab.medio_vacante)],
    ['¿Cometió actos ilícitos en trabajos previos?', fmtBool(lab.acto_ilicito)],
  ]));

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
    content.push({ text: 'No se registraron experiencias laborales.', style: 'td', color: '#9ca3af', margin: [0, 0, 0, 8] });
  }

  if (lab.observaciones) {
    content.push({ text: `Observaciones: ${lab.observaciones}`, fontSize: 8, color: '#6b7280', italics: true, margin: [0, 0, 0, 8] });
  }

  // ── SECCIÓN 6: DROGAS Y ALCOHOL ──
  content.push(secHeader('6', 'Drogas y Alcohol'));

  content.push({ text: 'CONSUMO DE BEBIDAS ALCOHÓLICAS', style: 'label', margin: [0, 2, 0, 4] });
  content.push({
    table: {
      widths: ['60%', '40%'],
      body: [
        yesNoRow('¿Consume bebidas alcohólicas?', drog.consume_alcohol),
        ...(drog.consume_alcohol ? [
          yesNoRow('Última vez que consumió', undefined, v(drog.ultima_vez_alcohol)),
          yesNoRow('Frecuencia de consumo',   undefined, v(drog.frecuencia_alcohol)),
          yesNoRow('Bebida de preferencia',   undefined, v(drog.bebida_preferencia)),
        ] : []),
        yesNoRow('¿Inconvenientes personales/familiares por licor?', drog.inconvenientes_alcohol),
        yesNoRow('¿Dependencia al licor?',                          drog.dependencia_alcohol),
      ],
    },
    layout: layoutLines,
    margin: [0, 0, 0, 8],
  });

  content.push({ text: 'DROGAS ILEGALES', style: 'label', margin: [0, 4, 0, 4] });

  if (drog.concepto_drogas) {
    content.push(textBox(`Concepto sobre drogas ilegales: ${drog.concepto_drogas}`));
  }

  content.push({
    table: {
      widths: ['60%', '40%'],
      body: [
        yesNoRow('¿Ha consumido sustancias/drogas ilegales?',
          drog.consume_drogas,
          drog.consume_drogas ? v(drog.tipo_drogas) : undefined),
        yesNoRow('¿Involucrado en actividades de narcotráfico?',    drog.involucrado_narcotrafico),
        yesNoRow('¿Ha recibido propuestas del narcotráfico?',       drog.propuestas_narcotrafico),
        yesNoRow('¿Entorno cercano involucrado en drogas?',         drog.entorno_drogas),
      ],
    },
    layout: layoutLines,
    margin: [0, 0, 0, 8],
  });

  if (drog.observaciones) {
    content.push({ text: `Observaciones: ${drog.observaciones}`, fontSize: 8, color: '#6b7280', italics: true, margin: [0, 0, 0, 8] });
  }

  // ── SECCIÓN 7: ANTECEDENTES JUDICIALES ──
  content.push(secHeader('7', 'Antecedentes Judiciales'));
  content.push({
    table: {
      widths: ['65%', '35%'],
      body: [
        yesNoRow('¿Ha interpuesto demandas?',                   jud.interpuesto_demandas),
        yesNoRow('¿Ha sido demandado?',                         jud.sido_demandado),
        yesNoRow('¿Ha participado en procesos judiciales?',     jud.proceso_judicial),
        yesNoRow('¿Ha tenido detenciones?',
          jud.detenciones,
          jud.detenciones ? v(jud.observacion_detenciones) : undefined),
        yesNoRow('¿Tiene familiares detenidos?',
          jud.familiares_detenidos,
          jud.familiares_detenidos ? v(jud.observacion_familiares_detenidos) : undefined),
        yesNoRow('¿Ha visitado centros de reclusión?',
          jud.visitado_carcel,
          jud.visitado_carcel ? v(jud.observacion_visitado_carcel) : undefined),
        yesNoRow('Última verificación judicial', undefined, fmtFecha(jud.ultima_verificacion_judicial)),
        yesNoRow('¿Ha manipulado armas de fuego?',
          jud.manipulado_armas,
          jud.manipulado_armas ? v(jud.motivo_armas) : undefined),
        yesNoRow('¿Actividades fuera de la ley?',               jud.actividades_fuera_ley),
        yesNoRow('¿Ha recibido propuestas ilegales?',           jud.propuestas_ilegales),
        yesNoRow('¿Entorno con antecedentes penales?',          jud.entorno_ilegal_antecedentes),
        yesNoRow('¿Ha participado en actos ilegales?',          jud.participacion_actos_ilegales),
      ],
    },
    layout: layoutLines,
    margin: [0, 0, 0, 8],
  });

  if (jud.concepto_margen_ley) {
    content.push(textBox(`Concepto sobre grupos al margen de la ley: ${jud.concepto_margen_ley}`));
  }
  if (jud.vinculos_margen_ley) {
    content.push(textBox(`Vínculos declarados: ${jud.vinculos_margen_ley}`));
  }
  if (jud.observaciones_generales) {
    content.push({ text: `Observaciones: ${jud.observaciones_generales}`, fontSize: 8, color: '#6b7280', italics: true, margin: [0, 0, 0, 8] });
  }

  // ── SECCIÓN 8: CONTROL DE INFILTRACIÓN ──
  content.push(secHeader('8', 'Control de Infiltración'));

  if (inf.motivacion_ingreso) {
    content.push(textBox(`Motivación para ingresar a la empresa: ${inf.motivacion_ingreso}`));
  }

  content.push({
    table: {
      widths: ['65%', '35%'],
      body: [
        yesNoRow('¿Tiene contactos dentro de la empresa?',
          inf.contactos_empresa,
          inf.contactos_empresa ? v(inf.detalle_contactos) : undefined),
        yesNoRow('¿Intención de cometer actos ilícitos internos?', inf.intencion_ilicitos),
        yesNoRow('¿Acuerdos con terceros para actos ilícitos?',    inf.acuerdo_ilicitos),
        yesNoRow('¿Ha recibido instrucciones para causar daños?',  inf.instrucciones_dano),
      ],
    },
    layout: layoutLines,
    margin: [0, 0, 0, 10],
  });

  // Semáforo de riesgo
  const riesgo   = (inf.nivel_riesgo || 'BAJO').toUpperCase();
  const riesgoCfg: Record<string, { bg: string; text: string }> = {
    ALTO:  { bg: '#dc2626', text: '#ffffff' },
    MEDIO: { bg: '#d97706', text: '#000000' },
    BAJO:  { bg: '#16a34a', text: '#ffffff' },
  };
  const rc = riesgoCfg[riesgo] ?? riesgoCfg.BAJO;
  content.push({
    table: {
      widths: ['*'],
      body: [[{
        text:      `NIVEL DE RIESGO DE INFILTRACIÓN: ${riesgo}`,
        fontSize:  11,
        bold:      true,
        color:     rc.text,
        fillColor: rc.bg,
        alignment: 'center',
        margin:    [0, 10, 0, 10],
      }]],
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 8],
  });

  if (inf.observaciones) {
    content.push({ text: `Observaciones: ${inf.observaciones}`, fontSize: 8, color: '#6b7280', italics: true, margin: [0, 0, 0, 8] });
  }

  // ── SECCIÓN 9: VALIDACIONES Y RESULTADO FINAL ──
  content.push(secHeader('9', 'Validaciones y Resultado Final'));
  content.push(infoTable([
    ['Documentos verificados',   fmtBool(val_.documentos_verificados)],
    ['Referencias verificadas',  fmtBool(val_.referencias_verificadas)],
    ['Aprobado por',             v(val_.aprobado_por)],
    ['Fecha de validación',      fmtFecha(val_.fecha_validacion)],
    ['Calificación',             val_.calificacion != null ? `${val_.calificacion} / 100` : 'No registra'],
  ]));

  // Badge resultado final
  const resultado = (val_.resultado_general || 'PENDIENTE').toUpperCase();
  const resCfg: Record<string, { bg: string; text: string }> = {
    APROBADO:    { bg: '#16a34a', text: '#ffffff' },
    RECHAZADO:   { bg: '#dc2626', text: '#ffffff' },
    CONDICIONAL: { bg: '#2563eb', text: '#ffffff' },
    PENDIENTE:   { bg: '#d97706', text: '#000000' },
  };
  const resColor = resCfg[resultado] ?? resCfg.PENDIENTE;
  content.push({
    table: {
      widths: ['*'],
      body: [[{
        text:      `RESULTADO FINAL: ${resultado}`,
        fontSize:  13,
        bold:      true,
        color:     resColor.text,
        fillColor: resColor.bg,
        alignment: 'center',
        margin:    [0, 10, 0, 10],
      }]],
    },
    layout: 'noBorders',
    margin: [0, 4, 0, 12],
  });

  if (val_.recomendacion) {
    content.push(textBox(`Recomendación: ${val_.recomendacion}`));
  }
  if (val_.observaciones_finales) {
    content.push(textBox(`Observaciones finales: ${val_.observaciones_finales}`));
  }

  // ── BLOQUE DE FIRMAS ──
  content.push(divider([0, 16, 0, 24]));
  content.push({
    columns: [
      {
        width: '45%',
        stack: [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 210, y2: 0, lineWidth: 0.5, lineColor: '#374151' }] },
          { text: 'Evaluador / Analista de Seguridad', fontSize: 8, color: '#6b7280', alignment: 'center', margin: [0, 4, 0, 2] },
          { text: 'Firma y Sello',                     fontSize: 7, color: '#9ca3af', alignment: 'center' },
        ],
      },
      { width: '10%', text: '' },
      {
        width: '45%',
        stack: [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 210, y2: 0, lineWidth: 0.5, lineColor: '#374151' }] },
          { text: 'Candidato / Postulante',       fontSize: 8, color: '#6b7280', alignment: 'center', margin: [0, 4, 0, 2] },
          { text: 'Firma y/o Huella Dactilar',    fontSize: 7, color: '#9ca3af', alignment: 'center' },
        ],
      },
    ],
  });

  // ─────────────────────────────────────────────────────────────
  // DEFINICIÓN FINAL DEL DOCUMENTO
  // ─────────────────────────────────────────────────────────────
  const docDefinition: any = {
    pageSize:    'A4',
    pageMargins: [40, 71, 40, 50],  // izq | sup(2.5cm) | der | inf

    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text:   'SEGURIDAD GRUPO EMPRESARIAL ROJAS',
          fontSize: 7,
          color:  '#9ca3af',
          margin: [40, 0, 0, 0],
        },
        {
          text:      `Página ${currentPage} de ${pageCount}`,
          fontSize:  7,
          color:     '#9ca3af',
          alignment: 'right',
          margin:    [0, 0, 40, 0],
        },
      ],
      margin: [0, 10, 0, 0],
    }),

    content,
    styles,
    defaultStyle: { font: 'Roboto', fontSize: 9, color: '#111827' },
  };

  // ─────────────────────────────────────────────────────────────
  // GENERAR CON PDFMAKE Y SUPERPONER SOBRE LA PLANTILLA
  // ─────────────────────────────────────────────────────────────
  const pdfDoc = (pdfMake as any).createPdf(docDefinition);

  // Obtener los bytes del contenido generado
  const contentBytes: ArrayBuffer = await new Promise((resolve) => {
    pdfDoc.getBuffer((buf: Uint8Array) => resolve(buf.buffer as ArrayBuffer));
  });

  try {
    const { PDFDocument } = await import('pdf-lib');

    // Cargar la plantilla desde public/
    const templateRes = await fetch('/plantilla.pdf');
    if (!templateRes.ok) throw new Error('Plantilla no encontrada en /plantilla.pdf');
    const templateBytes = await templateRes.arrayBuffer();

    // Cargar ambos PDFs con pdf-lib
    const templateDoc = await PDFDocument.load(templateBytes);
    const contentDoc  = await PDFDocument.load(contentBytes);
    const outputDoc   = await PDFDocument.create();

    const pageCount = contentDoc.getPageCount();

    // Incrustar todas las páginas del contenido como XObjects
    const embeddedContent = await outputDoc.embedPdf(contentDoc);

    // Para cada página: copiar la plantilla como base real y dibujar contenido encima
    for (let i = 0; i < pageCount; i++) {
      // Copia la página de la plantilla (con logos incluidos) al documento de salida
      const [templatePageCopy] = await outputDoc.copyPages(templateDoc, [0]);
      const page = outputDoc.addPage(templatePageCopy);

      // Obtener dimensiones reales de la página copiada
      const { width, height } = page.getSize();

      // Dibujar el contenido generado encima de la plantilla
      page.drawPage(embeddedContent[i], {
        x:      0,
        y:      0,
        width,
        height,
      });
    }

    // Descargar el PDF final
    const finalBytes: Uint8Array = await outputDoc.save();
    const blob = new Blob([finalBytes as any], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `INFORME_${v(dp.cedula, 'CANDIDATO')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (err) {
    // Si no hay plantilla, genera el PDF limpio igual
    console.warn('Plantilla no disponible, generando sin fondo:', err);
    pdfDoc.download(`INFORME_${v(dp.cedula, 'CANDIDATO')}.pdf`);
  }
};