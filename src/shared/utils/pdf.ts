import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? (pdfFonts as any).vfs;

// ── Paleta corporativa ────────────────────────────────────────
const C = {
  primary:     '#1677FF',
  primaryDark: '#0D3380',
  dark:        '#0D1117',
  bgCard:      '#161B22',
  border:      '#30363D',
  textMain:    '#E6EDF3',
  textSub:     '#8B949E',
  green:       '#3FB950',
  red:         '#F85149',
  yellow:      '#D29922',
  blue:        '#58A6FF',
  purple:      '#A78BFA',
  white:       '#FFFFFF',
  lightGray:   '#F6F8FA',
  midGray:     '#EAEEF2',
};

// ── Helpers ───────────────────────────────────────────────────
const fmtFecha = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const fmtMoney = (v?: any) =>
  v != null ? `$${Number(v).toFixed(2)}` : '—';

const yn = (v?: boolean) => (v ? 'SÍ' : 'NO');

const resultadoLabel: Record<string, string> = {
  APROBADO: 'APROBADO', RECHAZADO: 'RECHAZADO',
  PENDIENTE: 'PENDIENTE', CONDICIONAL: 'CONDICIONAL',
};
const resultadoColor: Record<string, string> = {
  APROBADO: C.green, RECHAZADO: C.red,
  PENDIENTE: C.yellow, CONDICIONAL: C.blue,
};
const nivelColor: Record<string, string> = {
  BAJO: C.green, MEDIO: C.yellow, ALTO: C.red, CRITICO: '#FF4D4D',
};

// ── Sección con título ───────────────────────────────────────
const section = (title: string, content: any[]): any[] => [
  {
    table: {
      widths: ['*'],
      body: [[{
        text: title.toUpperCase(),
        style: 'sectionHeader',
        border: [false, false, false, false],
        fillColor: C.primary,
        color: C.white,
      }]],
    },
    layout: 'noBorders',
    margin: [0, 14, 0, 6],
  },
  ...content,
];

// ── Fila de dato simple ──────────────────────────────────────
const dataRow = (label: string, value: string, highlight = false): any => ({
  columns: [
    { text: label, width: 160, style: 'dataLabel' },
    { text: value || '—', style: highlight ? 'dataValueHighlight' : 'dataValue' },
  ],
  margin: [0, 2, 0, 2],
});

// ── Fila de dato con alerta ───────────────────────────────────
const alertRow = (label: string, value: boolean, detail?: string): any => ({
  stack: [
    {
      columns: [
        { text: label, width: 220, style: 'dataLabel' },
        {
          text: value ? '⚠ SÍ' : '✓ NO',
          width: 60,
          color: value ? C.red : C.green,
          bold: true,
          fontSize: 9,
        },
        ...(value && detail ? [{ text: detail, style: 'dataValue', italics: true }] : []),
      ],
    },
  ],
  margin: [0, 3, 0, 3],
});

// ── Tabla genérica ────────────────────────────────────────────
const makeTable = (headers: string[], rows: string[][], widths?: any[]): any => ({
  table: {
    headerRows: 1,
    widths: widths || headers.map(() => '*'),
    body: [
      headers.map((h) => ({ text: h, style: 'tableHeader' })),
      ...rows.map((row) =>
        row.map((cell) => ({ text: cell || '—', style: 'tableCell' }))
      ),
    ],
  },
  layout: {
    hLineWidth: (_i: number, node: any) => (_i === 0 || _i === node.table.body.length ? 0.8 : 0.4),
    vLineWidth: () => 0,
    hLineColor: () => C.border,
    paddingTop: () => 5,
    paddingBottom: () => 5,
    paddingLeft: () => 8,
    paddingRight: () => 8,
    fillColor: (i: number) => (i === 0 ? C.primary : i % 2 === 0 ? C.lightGray : C.white),
  },
  margin: [0, 2, 0, 10],
});

// ════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ════════════════════════════════════════════════════════════
export async function generarPDFEntrevista(entrevista: any): Promise<void> {
  const dp  = entrevista.datos_personales;
  const fam = entrevista.familia ?? [];
  const est = entrevista.estudios ?? [];
  const fin = entrevista.finanzas;
  const hl  = entrevista.historial_laboral ?? [];
  const da  = entrevista.drogas_alcohol;
  const jud = entrevista.judicial;
  const inf = entrevista.infiltracion;
  const val = entrevista.validaciones;
  const ents = entrevista.entrevistadores ?? [];

  const nombreCandidato = dp
    ? `${dp.nombres} ${dp.apellidos}`
    : 'Sin nombre';
  const fechaDoc = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // ── Resultado badge ──────────────────────────────────────
  const resultadoGeneral = val?.resultado_general ?? 'PENDIENTE';
  const calificacion     = val?.calificacion ?? 0;
  const calColor         = calificacion >= 80 ? C.green : calificacion >= 60 ? C.yellow : C.red;
  const nivelRiesgo      = inf?.nivel_riesgo ?? 'BAJO';

  const docDefinition: TDocumentDefinitions = {
    pageSize:        'A4',
    pageMargins:     [40, 110, 40, 70],
    pageOrientation: 'portrait',

    // ── HEADER ────────────────────────────────────────────
    header: (_currentPage, _pageCount) => ({
      stack: [
        {
          canvas: [{ type: 'rect', x: 0, y: 0, w: 595, h: 80, color: C.dark }],
          absolutePosition: { x: 0, y: 0 },
        },
        {
          columns: [
            {
              stack: [
                { text: 'PROMPT MAESTRO', fontSize: 18, bold: true, color: C.white, margin: [40, 18, 0, 2] },
                { text: 'INFORME DE ENTREVISTA DE SEGURIDAD', fontSize: 8, color: C.blue, characterSpacing: 1.5, margin: [40, 0, 0, 0] },
              ],
            },
            {
              stack: [
                { text: `Código: ${entrevista.codigo}`, fontSize: 8, color: C.textSub, alignment: 'right', margin: [0, 20, 40, 2] },
                { text: `Fecha: ${fechaDoc}`, fontSize: 8, color: C.textSub, alignment: 'right', margin: [0, 0, 40, 0] },
                { text: `Estado: ${entrevista.estado}`, fontSize: 8, color: C.blue, alignment: 'right', bold: true, margin: [0, 0, 40, 0] },
              ],
            },
          ],
        },
        {
          canvas: [{ type: 'rect', x: 0, y: 0, w: 595, h: 3, color: C.primary }],
          margin: [0, 0, 0, 0],
        },
      ],
    }),

    // ── FOOTER ────────────────────────────────────────────
    footer: (currentPage, pageCount) => ({
      columns: [
        {
          text: 'CONFIDENCIAL — Uso exclusivo empresarial. Prohibida su reproducción sin autorización.',
          style: 'footerText',
          margin: [40, 12, 0, 0],
        },
        {
          text: `Página ${currentPage} de ${pageCount}`,
          alignment: 'right',
          style: 'footerText',
          margin: [0, 12, 40, 0],
        },
      ],
    }),

    content: [
      // ── ENCABEZADO DEL INFORME ──────────────────────────
      {
        columns: [
          {
            stack: [
              { text: nombreCandidato, fontSize: 20, bold: true, color: C.dark, margin: [0, 0, 0, 4] },
              { text: dp?.cargo_aplicar ? `Cargo: ${dp.cargo_aplicar}` : 'Cargo: Sin especificar', fontSize: 11, color: C.textSub },
              { text: dp?.cedula ? `Cédula: ${dp.cedula}` : '', fontSize: 10, color: C.textSub, margin: [0, 2, 0, 0] },
            ],
            width: '*',
          },
          {
            stack: [
              {
                text: resultadoLabel[resultadoGeneral] || resultadoGeneral,
                fontSize: 18,
                bold: true,
                color: C.white,
                alignment: 'center',
                background: resultadoColor[resultadoGeneral] || C.yellow,
                margin: [0, 0, 0, 6],
              },
              {
                canvas: [{
                  type: 'rect', x: 0, y: 0, w: 120, h: 8,
                  r: 4, color: calColor,
                }],
                margin: [0, 0, 0, 2],
              },
              { text: `Calificación: ${calificacion}/100`, fontSize: 9, color: C.textSub, alignment: 'center' },
            ],
            width: 130,
            alignment: 'center',
          },
        ],
        margin: [0, 0, 0, 8],
      },

      // ── ENTREVISTADORES ──────────────────────────────────
      {
        table: {
          widths: ['*'],
          body: [[{
            stack: [
              { text: 'PANEL DE ENTREVISTADORES', fontSize: 8, color: C.textSub, characterSpacing: 1, bold: true, margin: [0, 0, 0, 4] },
              {
                columns: ents.map((ee: any) => ({
                  stack: [
                    { text: ee.entrevistador.nombre_completo, fontSize: 9, bold: true, color: C.dark },
                    { text: ee.entrevistador.cargo, fontSize: 8, color: C.textSub },
                  ],
                  width: '*',
                })),
              },
            ],
            fillColor: C.lightGray,
            border: [false, false, false, false],
          }]],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 4],
      },

      // ══════════════════════════════════════════════════
      // 1. DATOS PERSONALES
      // ══════════════════════════════════════════════════
      ...section('1. Datos Personales', dp ? [
        { columns: [
          { stack: [
            dataRow('Nombres completos', `${dp.nombres} ${dp.apellidos}`),
            dataRow('Cédula / Pasaporte', dp.cedula),
            dataRow('Fecha de nacimiento', fmtFecha(dp.fecha_nacimiento)),
            dataRow('Lugar de nacimiento', dp.lugar_nacimiento),
            dataRow('Estado civil', dp.estado_civil),
            dataRow('Número de hijos', String(dp.numero_hijos ?? 0)),
          ], width: '*' },
          { stack: [
            dataRow('Teléfono personal', dp.telefono_personal),
            dataRow('Teléfono alternativo', dp.telefono_alternativo),
            dataRow('Correo electrónico', dp.email),
            dataRow('Ciudad de residencia', dp.ciudad_residencia),
            dataRow('Sector / Barrio', dp.sector_barrio),
            dataRow('Tipo de vivienda', dp.vivienda_tipo),
            dataRow('Tiempo de residencia', dp.tiempo_residencia),
          ], width: '*' },
        ]},
        dataRow('Dirección', dp.direccion),
        dp.discapacidad ? dataRow('Discapacidad', dp.tipo_discapacidad || 'Sí (sin especificar)') : null,
      ].filter(Boolean) : [{ text: 'Sin datos personales registrados.', style: 'noData' }]),

      // ══════════════════════════════════════════════════
      // 2. COMPOSICIÓN FAMILIAR
      // ══════════════════════════════════════════════════
      ...section('2. Composición Familiar', fam.length > 0 ? [
        makeTable(
          ['Parentesco', 'Nombre Completo', 'Edad', 'Ocupación', 'Celular'],
          fam.map((m: any) => [m.tipo_parentesco, m.nombres, String(m.edad ?? ''), m.ocupacion ?? '', m.celular ?? '']),
          [90, '*', 40, '*', 100]
        ),
      ] : [{ text: 'Sin familiares registrados.', style: 'noData' }]),

      // ══════════════════════════════════════════════════
      // 3. ESTUDIOS REALIZADOS
      // ══════════════════════════════════════════════════
      ...section('3. Estudios Realizados', est.length > 0 ? [
        makeTable(
          ['Nivel', 'Institución', 'Título', 'Período', 'Estado', 'Verif.'],
          est.map((e: any) => [
            e.nivel, e.institucion, e.titulo_obtenido ?? '',
            `${e.anio_inicio ?? ''} – ${e.anio_fin ?? ''}`,
            e.estado ?? '', e.verificado ? '✓' : '✗',
          ]),
          [70, '*', '*', 80, 70, 40]
        ),
      ] : [{ text: 'Sin estudios registrados.', style: 'noData' }]),

      // ══════════════════════════════════════════════════
      // 4. FINANZAS
      // ══════════════════════════════════════════════════
      ...section('4. Situación Financiera', fin ? [
        { columns: [
          { stack: [
            dataRow('Ingresos mensuales', fmtMoney(fin.ingresos_mensuales)),
            dataRow('Egresos mensuales', fmtMoney(fin.egresos_mensuales)),
            dataRow('Score crediticio', fin.score_crediticio),
            dataRow('Buró de crédito', fin.buro_credito),
          ], width: '*' },
          { stack: [
            alertRow('Tiene deudas activas', fin.deudas_actuales, fin.tipo_deudas),
            fin.deudas_actuales ? dataRow('Monto de deudas', fmtMoney(fin.monto_deudas)) : null,
            alertRow('Posee bienes', fin.tiene_bienes, fin.descripcion_bienes),
            alertRow('Demandas coactivas', fin.demandas_coactivas, fin.detalle_coactivas),
          ].filter(Boolean), width: '*' },
        ]},
        fin.observaciones ? dataRow('Observaciones', fin.observaciones) : null,
      ].filter(Boolean) : [{ text: 'Sin información financiera registrada.', style: 'noData' }]),

      // ══════════════════════════════════════════════════
      // 5. HISTORIAL LABORAL
      // ══════════════════════════════════════════════════
      ...section('5. Historial Laboral', hl.length > 0 ? hl.map((t: any, i: number) => ({
        stack: [
          {
            columns: [
              { text: `${i + 1}. ${t.empresa}`, style: 'jobTitle', width: '*' },
              { text: t.trabajo_actual ? '● ACTUAL' : `${fmtFecha(t.fecha_inicio)} – ${fmtFecha(t.fecha_fin)}`, fontSize: 8, color: t.trabajo_actual ? C.green : C.textSub, alignment: 'right', width: 140 },
            ],
          },
          { columns: [
            { stack: [
              dataRow('Cargo', t.cargo),
              dataRow('Salario', fmtMoney(t.salario)),
              dataRow('Jefe inmediato', t.jefe_inmediato),
              dataRow('Teléfono empresa', t.telefono_empresa),
            ], width: '*' },
            { stack: [
              dataRow('Motivo de salida', t.motivo_salida),
              dataRow('Verificado', yn(t.verificado)),
            ], width: '*' },
          ]},
        ],
        margin: [0, 2, 0, 8],
      })) : [{ text: 'Sin historial laboral registrado.', style: 'noData' }]),

      // ══════════════════════════════════════════════════
      // 6. DROGAS Y ALCOHOL
      // ══════════════════════════════════════════════════
      ...section('6. Drogas y Alcohol', da ? [
        alertRow('Consume alcohol', da.consume_alcohol, da.frecuencia_alcohol),
        alertRow('Ha consumido drogas', da.consume_drogas, da.tipo_drogas),
        alertRow('Tratamiento previo por adicción', da.tratamiento_previo, da.detalle_tratamiento),
        alertRow('Fuma', da.fuma, da.frecuencia_tabaco),
        da.observaciones ? dataRow('Observaciones', da.observaciones) : null,
      ].filter(Boolean) : [{ text: 'Sin información registrada.', style: 'noData' }]),

      // ══════════════════════════════════════════════════
      // 7. INFORMACIÓN JUDICIAL
      // ══════════════════════════════════════════════════
      ...section('7. Información Judicial', jud ? [
        alertRow('Antecedentes penales', jud.antecedentes_penales, jud.detalle_penales),
        alertRow('Procesos judiciales activos', jud.procesos_judiciales, jud.detalle_procesos),
        alertRow('Detenciones o arrestos previos', jud.detencion_previa, jud.detalle_detencion),
        alertRow('Demandas civiles', jud.demandas_civiles, jud.detalle_demandas),
        dataRow('Verificado en sistema', yn(jud.verificado_sistema)),
        jud.observaciones ? dataRow('Observaciones', jud.observaciones) : null,
      ].filter(Boolean) : [{ text: 'Sin información judicial registrada.', style: 'noData' }]),

      // ══════════════════════════════════════════════════
      // 8. INFILTRACIÓN / VÍNCULOS ILEGALES
      // ══════════════════════════════════════════════════
      ...section('8. Infiltración / Vínculos Ilegales', inf ? [
        alertRow('Vínculos con org. delictivas', inf.vinculo_organizaciones, inf.tipo_organizaciones),
        alertRow('Familiar con vínculos ilegales', inf.familiar_implicado, inf.detalle_familiar),
        alertRow('Contacto con grupos ilegales', inf.contacto_grupos_ilegales, inf.detalle_grupos),
        alertRow('Víctima de amenaza/extorsión', inf.amenaza_extorsion, inf.detalle_amenaza),
        {
          columns: [
            { text: 'Nivel de riesgo evaluado:', style: 'dataLabel', width: 160 },
            {
              text: inf.nivel_riesgo,
              bold: true,
              color: nivelColor[inf.nivel_riesgo] || C.textSub,
              fontSize: 11,
            },
          ],
          margin: [0, 6, 0, 4],
        },
        inf.observaciones ? dataRow('Observaciones del analista', inf.observaciones) : null,
      ].filter(Boolean) : [{ text: 'Sin información registrada.', style: 'noData' }]),

      // ══════════════════════════════════════════════════
      // 9. VALIDACIONES Y RESULTADO FINAL
      // ══════════════════════════════════════════════════
      ...section('9. Validaciones y Resultado Final', val ? [
        { columns: [
          { stack: [
            dataRow('Documentos verificados', yn(val.documentos_verificados)),
            dataRow('Referencias verificadas', yn(val.referencias_verificadas)),
            dataRow('Aprobado por', val.aprobado_por),
            dataRow('Fecha de validación', fmtFecha(val.fecha_validacion)),
          ], width: '*' },
          {
            stack: [
              {
                table: {
                  widths: ['*'],
                  body: [[{
                    stack: [
                      { text: 'RESULTADO FINAL', fontSize: 8, color: C.white, characterSpacing: 1, bold: true, alignment: 'center', margin: [0, 0, 0, 6] },
                      { text: resultadoLabel[resultadoGeneral] || resultadoGeneral, fontSize: 22, bold: true, color: C.white, alignment: 'center', margin: [0, 0, 0, 4] },
                      { text: `Calificación: ${calificacion}/100`, fontSize: 10, color: C.white, alignment: 'center' },
                    ],
                    fillColor: resultadoColor[resultadoGeneral] || C.yellow,
                    border: [false, false, false, false],
                  }]],
                },
                layout: 'noBorders',
              },
            ],
            width: 180,
          },
        ]},
        val.recomendacion ? {
          stack: [
            { text: 'RECOMENDACIÓN DEL ENTREVISTADOR', fontSize: 8, color: C.textSub, characterSpacing: 1, bold: true, margin: [0, 10, 0, 4] },
            { text: val.recomendacion, style: 'quoteText' },
          ],
        } : null,
        val.observaciones_finales ? {
          stack: [
            { text: 'OBSERVACIONES FINALES', fontSize: 8, color: C.textSub, characterSpacing: 1, bold: true, margin: [0, 10, 0, 4] },
            { text: val.observaciones_finales, style: 'bodyText' },
          ],
        } : null,
      ].filter(Boolean) : [{ text: 'Entrevista aún no validada.', style: 'noData' }]),

      // ══════════════════════════════════════════════════
      // FIRMAS
      // ══════════════════════════════════════════════════
      { text: '', margin: [0, 20] },
      {
        columns: ents.map((ee: any) => ({
          stack: [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 130, y2: 0, lineWidth: 0.8, lineColor: C.border }] },
            { text: ee.entrevistador.nombre_completo, fontSize: 9, bold: true, color: C.dark, margin: [0, 4, 0, 1] },
            { text: ee.entrevistador.cargo, fontSize: 8, color: C.textSub },
            { text: 'Firma y Sello', fontSize: 7, color: '#BCC0C4', italics: true },
          ],
          alignment: 'center',
          width: '*',
        })),
        margin: [0, 16, 0, 0],
      },
    ],

    // ── ESTILOS ────────────────────────────────────────────
    styles: {
      sectionHeader: {
        fontSize: 9, bold: true, color: C.white,
        characterSpacing: 1.5, padding: [8, 6, 8, 6],
      },
      dataLabel: { fontSize: 9, color: C.textSub, bold: true },
      dataValue: { fontSize: 9, color: C.dark },
      dataValueHighlight: { fontSize: 9, color: C.primary, bold: true },
      tableHeader: { fontSize: 8, bold: true, color: C.white, alignment: 'center' as const },
      tableCell: { fontSize: 8, color: C.dark, alignment: 'left' as const },
      jobTitle: { fontSize: 11, bold: true, color: C.primary },
      noData: { fontSize: 9, color: C.textSub, italics: true, margin: [0, 4, 0, 4] },
      footerText: { fontSize: 7.5, color: C.textSub },
      bodyText: { fontSize: 9, color: C.dark, lineHeight: 1.5 },
      quoteText: { fontSize: 9, color: C.dark, italics: true, lineHeight: 1.5, background: C.lightGray, margin: [0, 0, 0, 4] },
    },

    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
      lineHeight: 1.3,
    },
  };

  const nombreArchivo = `entrevista-${entrevista.codigo}-${nombreCandidato.replace(/\s+/g, '_')}.pdf`;
  pdfMake.createPdf(docDefinition).download(nombreArchivo);
}
