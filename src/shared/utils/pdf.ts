// src/shared/utils/pdf.ts
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import dayjs from 'dayjs';

// Inicializar las fuentes virtuales de forma segura para TypeScript y Vite
(pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

/**
 * Formatea valores booleanos a texto legible e inequívoco
 */
const fmtBool = (val: boolean | null | undefined): string => {
  if (val === true) return 'SÍ';
  if (val === false) return 'NO';
  return 'NO REGISTRA';
};

/**
 * Formatea fechas de manera segura evitando rupturas por nulos
 */
const fmtFecha = (val: any): string => {
  if (!val) return 'N/A';
  return dayjs(val).format('DD/MM/YYYY');
};

/**
 * Formatea valores numéricos a formato moneda estandarizado
 */
const fmtMoneda = (val: any): string => {
  const num = Number(val || 0);
  return `$${num.toFixed(2)}`;
};

/**
 * Función maestra para generar el informe PDF corporativo con el nuevo formato SeguridadApp
 */
export const generarInformePDF = (entrevista: any) => {
  if (!entrevista) return;

  const dp = entrevista.datos_personales || {};
  const finanzas = entrevista.finanzas || {};
  const laboral = entrevista.historial_laboral || {};
  const drogas = entrevista.drogas_alcohol || {};
  const judicial = entrevista.judicial || {};
  const infil = entrevista.infiltracion || {};

  // Obtener nombres de entrevistadores vinculados
  const evaluadoresTexto = entrevista.entrevistadores?.length > 0
    ? entrevista.entrevistadores.map((e: any) => e.entrevistador?.nombre || 'Evaluador').join(', ')
    : 'No asignado';

  // Configuración dinámica del Semáforo de Riesgo Final
  const riesgo = (infil.nivel_riesgo || 'BAJO').toUpperCase();
  let colorRiesgoBg = '#238636'; // Verde Bajo
  let colorRiesgoText = '#FFFFFF';
  if (riesgo === 'MEDIO') {
    colorRiesgoBg = '#D29922'; // Naranja/Amarillo Medio
    colorRiesgoText = '#000000';
  } else if (riesgo === 'ALTO') {
    colorRiesgoBg = '#F85149'; // Rojo Alto
    colorRiesgoText = '#FFFFFF';
  }

  // DEFINICIÓN DEL DOCUMENTO MAESTRO (pdfmake docDefinition)
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 50],
    
    footer: (currentPage: number, pageCount: number) => {
      return {
        text: `Informe de Seguridad - Página ${currentPage} de ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        color: '#6e7681',
        margin: [0, 20, 0, 0]
      };
    },

    content: [
      // ==========================================
      // ENCABEZADO CORPORATIVO DE SEGURIDADAPP
      // ==========================================
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              {
                text: 'INFORME INTEGRAL DE EVALUACIÓN Y CONTROL DE CONFIANZA',
                style: 'mainHeaderTitle'
              },
              {
                text: 'SeguridadApp',
                style: 'mainHeaderBrand'
              }
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 15]
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#1f6feb' }] },
      { text: '', margin: [0, 0, 0, 10] },

      // ==========================================
      // CUADRO DE FILLIACIÓN GENERAL DEL CANDIDATO
      // ==========================================
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: 'POSTULANTE:', style: 'tableLabel' },
              { text: `${dp.nombres || ''} ${dp.apellidos || ''}`.toUpperCase(), colSpan: 3, style: 'tableValueBold' },
              {}, {}
            ],
            [
              { text: 'IDENTIFICACIÓN / CC:', style: 'tableLabel' },
              { text: dp.cedula || 'N/A', style: 'tableValue' },
              { text: 'CARGO PROPUESTO:', style: 'tableLabel' },
              { text: (entrevista.vacante || 'N/A').toUpperCase(), style: 'tableValueBold' }
            ],
            [
              { text: 'FECHA EVALUACIÓN:', style: 'tableLabel' },
              { text: fmtFecha(entrevista.fecha), style: 'tableValue' },
              { text: 'EVALUADOR / ANALISTA:', style: 'tableLabel' },
              { text: evaluadoresTexto.toUpperCase(), style: 'tableValue' }
            ]
          ]
        },
        layout: 'compactGrid'
      },
      { text: '', margin: [0, 15, 0, 0] },

      // ==========================================
      // SECCIÓN 1: ENTORNO SOCIO-FAMILIAR
      // ==========================================
      { text: '1. CONTEXTO SOCIO-FAMILIAR Y ENTORNO', style: 'sectionHeader' },
      entrevista.familia?.length > 0 ? {
        table: {
          headerRows: 1,
          widths: ['30%', '20%', '15%', '15%', '20%'],
          body: [
            [
              { text: 'Nombre Completo', style: 'th' },
              { text: 'Parentesco', style: 'th' },
              { text: 'Edad', style: 'th' },
              { text: 'Dependiente / Vive con él', style: 'th' },
              { text: 'Ocupación actual', style: 'th' }
            ],
            ...entrevista.familia.map((f: any) => [
              { text: f.nombre?.toUpperCase() || 'N/A', style: 'td' },
              { text: f.parentesco?.toUpperCase() || 'N/A', style: 'td' },
              { text: f.edad ? `${f.edad} años` : 'N/A', style: 'tdCenter' },
              { text: fmtBool(f.vive_con_candidato), style: 'tdCenter' },
              { text: f.ocupacion?.toUpperCase() || 'N/A', style: 'td' }
            ])
          ]
        },
        layout: 'zebraGrid'
      } : { text: 'No se registración información de cargas familiares o dependientes.', style: 'noDataText' },

      // ==========================================
      // SECCIÓN 2: TRAYECTORIA ACADÉMICA (CON CIUDAD NUEVA)
      // ==========================================
      { text: '2. INSTRUCCIÓN FORMAL Y TRAYECTORIA ACADÉMICA', style: 'sectionHeader' },
      entrevista.estudios?.length > 0 ? {
        table: {
          headerRows: 1,
          widths: ['20%', '30%', '20%', '15%', '15%'],
          body: [
            [
              { text: 'Nivel', style: 'th' },
              { text: 'Institución Educativa', style: 'th' },
              { text: 'Título Obtenido', style: 'th' },
              { text: 'Ciudad / Sede', style: 'th' },
              { text: 'Estado', style: 'th' }
            ],
            ...entrevista.estudios.map((e: any) => [
              { text: e.nivel?.toUpperCase() || 'N/A', style: 'td' },
              { text: e.institucion?.toUpperCase() || 'N/A', style: 'td' },
              { text: e.titulo_obtenido?.toUpperCase() || 'N/A', style: 'td' },
              { text: e.ciudad?.toUpperCase() || 'N/A', style: 'tdCenter' },
              { text: e.estado?.toUpperCase() || 'N/A', style: 'tdCenter' }
            ])
          ]
        },
        layout: 'zebraGrid'
      } : { text: 'No registra historial de formación académica formal.', style: 'noDataText' },

      // ==========================================
      // SECCIÓN 3: BALANCE FINANCIERO DINÁMICO COMPLETADO
      // ==========================================
      { text: '3. ANÁLISIS PATRIMONIAL, INGRESOS Y PASIVOS', style: 'sectionHeader', pageBreak: 'before' },
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: 'INGRESOS MENSUALES:', style: 'tableLabel' },
              { text: fmtMoneda(finanzas.ingresos_mensuales), style: 'tableValueGreen' },
              { text: 'EGRESOS MENSUALES:', style: 'tableLabel' },
              { text: fmtMoneda(finanzas.egresos_mensuales), style: 'tableValueRed' }
            ]
          ]
        },
        layout: 'compactGrid'
      },

      { text: 'BIENES INMUEBLES DECLARADOS', style: 'subSectionHeader', margin: [0, 8, 0, 4] },
      fmtBool(finanzas.tiene_bienes_inmuebles) === 'SÍ' && finanzas.bienes_inmuebles?.length > 0 ? {
        table: {
          headerRows: 1,
          widths: ['65%', '35%'],
          body: [
            [{ text: 'Tipo de Inmueble (Casa/Terreno/Departamento)', style: 'th' }, { text: 'Valor Comercial Estimado', style: 'th' }],
            ...finanzas.bienes_inmuebles.map((b: any) => [
              { text: b.tipo?.toUpperCase() || 'N/A', style: 'td' },
              { text: fmtMoneda(b.valor), style: 'tdRight' }
            ])
          ]
        },
        layout: 'zebraGrid'
      } : { text: 'Declara no poseer bienes inmuebles o activos de este tipo a su nombre.', style: 'noDataText' },

      { text: 'PARQUE AUTOMOTOR / VEHÍCULOS PROPIOS', style: 'subSectionHeader', margin: [0, 8, 0, 4] },
      fmtBool(finanzas.tiene_vehiculos) === 'SÍ' && finanzas.vehiculos?.length > 0 ? {
        table: {
          headerRows: 1,
          widths: ['25%', '25%', '50%'],
          body: [
            [{ text: 'Tipo de Vehículo', style: 'th' }, { text: 'Placa', style: 'th' }, { text: 'Modelo / Marca / Año', style: 'th' }],
            ...finanzas.vehiculos.map((v: any) => [
              { text: v.tipo?.toUpperCase() || 'N/A', style: 'td' },
              { text: v.placa?.toUpperCase() || 'N/A', style: 'tdCenter' },
              { text: v.modelo?.toUpperCase() || 'N/A', style: 'td' }
            ])
          ]
        },
        layout: 'zebraGrid'
      } : { text: 'Declara no poseer vehículos independientes (motos/carros) registrados a su nombre.', style: 'noDataText' },

      { text: 'ANÁLISIS DE PASIVOS Y OBLIGACIONES FINANCIERAS', style: 'subSectionHeader', margin: [0, 8, 0, 4] },
      {
        table: {
          widths: ['40%', '60%'],
          body: [
            [
              { text: 'Créditos Financieros Activos (Bancos/Coops):', style: 'tableLabel' },
              { text: finanzas.creditos?.length > 0 ? finanzas.creditos.map((c: any) => `${c.entidad} [${fmtMoneda(c.monto)}]`).join(', ') : 'Ninguno declarado', style: 'tableValue' }
            ],
            [
              { text: 'Deudas Personales / Informales (Prestamistas):', style: 'tableLabel' },
              { text: finanzas.deudas_personales?.length > 0 ? finanzas.deudas_personales.map((d: any) => `${d.detalle} [${fmtMoneda(d.monto)}]`).join(', ') : 'Ninguno declarado', style: 'tableValue' }
            ],
            [
              { text: 'Historial Negativo en Centrales (Mora/Coactiva):', style: 'tableLabel' },
              { text: finanzas.reportes_negativos?.length > 0 ? finanzas.reportes_negativos.map((r: any) => `${r.detalle} [${fmtMoneda(r.monto)}]`).join(', ') : 'Sin reportes en mora', style: finanzas.reportes_negativos?.length > 0 ? 'tableValueRed' : 'tableValue' }
            ]
          ]
        },
        layout: 'compactGrid'
      },
      { text: `Observaciones Financieras del Evaluador: ${finanzas.observaciones || 'Postulante con liquidez estable y sin indicios de vulnerabilidad por endeudamiento.'}`, style: 'commentText', margin: [0, 4, 0, 0] },

      // ==========================================
      // SECCIÓN 4: HISTORIAL LABORAL CON NUEVOS CAMPOS
      // ==========================================
      { text: '4. ANTECEDENTES LABORALES Y RECLUTAMIENTO', style: 'sectionHeader' },
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: 'Canal de atracción a la vacante corporativa:', style: 'tableLabel' },
              { text: (laboral.medio_vacante || 'No registra').toUpperCase(), style: 'tableValue' }
            ],
            [
              { text: '¿Declara haber cometido ilícitos en trabajos anteriores?', style: 'tableLabel' },
              { text: fmtBool(laboral.acto_ilicito), style: laboral.acto_ilicito ? 'tableValueRedBold' : 'tableValue' }
            ]
          ]
        },
        layout: 'compactGrid'
      },
      { text: `Declaración del postulante sobre faltas graves del pasado: ${laboral.detalle_grave || 'Declara comportamiento probo en sus anteriores empleadores.'}`, style: 'commentText', margin: [0, 4, 0, 6] },

      { text: 'CRONOLOGÍA DE EXPERIENCIA LABORAL DECLARADA', style: 'subSectionHeader' },
      laboral.experiencias?.length > 0 ? {
        table: {
          headerRows: 1,
          widths: ['25%', '25%', '25%', '13%', '12%'],
          body: [
            [
              { text: 'Empresa / Entidad', style: 'th' },
              { text: 'Cargo Desempeñado', style: 'th' },
              { text: 'Periodo de Duración', style: 'th' },
              { text: 'Sueldo', style: 'th' },
              { text: 'Certificado', style: 'th' }
            ],
            ...laboral.experiencias.map((exp: any) => [
              { text: exp.empresa?.toUpperCase() || 'N/A', style: 'td' },
              { text: exp.cargo?.toUpperCase() || 'N/A', style: 'td' },
              { text: `${fmtFecha(exp.fecha_inicio)} a ${exp.trabajo_actual ? 'ACTUAL' : fmtFecha(exp.fecha_fin)}`, style: 'tdCenter' },
              { text: fmtMoneda(exp.salario), style: 'tdRight' },
              { text: exp.certificado_laboral ? 'SÍ TIENE' : 'NO TIENE', style: 'tdCenter' }
            ])
          ]
        },
        layout: 'zebraGrid'
      } : { text: 'No se anexaron registros cronológicos de empleo.', style: 'noDataText' },
      { text: `Verificaciones y referencias de analista: ${laboral.observaciones || 'Referencias laborales confirmadas y validadas correctamente.'}`, style: 'commentText', margin: [0, 4, 0, 0] },

      // ==========================================
      // SECCIÓN 5: DROGAS Y TOXICOLOGÍA DE ALTA CERTEZA
      // ==========================================
      { text: '5. CONSUMO DE SUSTANCIAS Y CONTROL TOXICOLÓGICO', style: 'sectionHeader', pageBreak: 'before' },
      {
        table: {
          widths: ['65%', '35%'],
          body: [
            [{ text: '¿Consume bebidas alcohólicas o licor de forma recurrente?', style: 'tableLabel' }, { text: fmtBool(drogas.consume_alcohol), style: 'tableValue' }],
            ...(drogas.consume_alcohol ? [
              [{ text: '   -> Último consumo registrado:', style: 'tableLabel' }, { text: (drogas.ultima_vez_alcohol || 'N/A').toUpperCase(), style: 'tableValueBold' }],
              [{ text: '   -> Frecuencia manifestada:', style: 'tableLabel' }, { text: (drogas.frecuencia_alcohol || 'N/A').toUpperCase(), style: 'tableValue' }],
              [{ text: '   -> Bebida alcohólica de preferencia:', style: 'tableLabel' }, { text: (drogas.bebida_preferencia || 'N/A').toUpperCase(), style: 'tableValue' }]
            ] : []),
            [{ text: '¿Ha sufrido altercados personales/familiares vinculados al licor?', style: 'tableLabel' }, { text: fmtBool(drogas.inconvenientes_alcohol), style: 'tableValue' }],
            [{ text: '¿Presenta o ha presentado cuadros de dependencia al licor?', style: 'tableLabel' }, { text: fmtBool(drogas.dependencia_alcohol), style: 'tableValue' }],
            [{ text: '¿Ha consumido de forma consciente sustancias o drogas ilegales?', style: 'tableLabel' }, { text: fmtBool(drogas.consume_drogas), style: drogas.consume_drogas ? 'tableValueRedBold' : 'tableValue' }],
            ...(drogas.consume_drogas ? [[{ text: '   -> Tipo de sustancia ilegal consumida:', style: 'tableLabel' }, { text: (drogas.tipo_drogas || 'N/A').toUpperCase(), style: 'tableValueRed' }]] : []),
            [{ text: '¿Ha estado involucrado en actividades asociadas al narcotráfico?', style: 'tableLabel' }, { text: fmtBool(drogas.involucrado_narcotrafico), style: drogas.involucrado_narcotrafico ? 'tableValueRedBold' : 'tableValue' }],
            [{ text: '¿Ha recibido propuestas formales para participar en el tráfico de drogas?', style: 'tableLabel' }, { text: fmtBool(drogas.propuestas_narcotrafico), style: 'tableValue' }],
            [{ text: '¿Cuenta en su entorno cercano (amigos/familia) con nexos con drogas?', style: 'tableLabel' }, { text: fmtBool(drogas.entorno_drogas), style: 'tableValue' }]
          ]
        },
        layout: 'compactGrid'
      },
      { text: `Concepto manifestado sobre drogas ilegales: ${drogas.concepto_drogas || 'No definido.'}`, style: 'commentText', margin: [0, 4, 0, 0] },
      { text: `Anotaciones complementarias del evaluador: ${drogas.observaciones || 'Sin novedades críticas detectadas en el análisis toxicológico reactivo.'}`, style: 'commentText', margin: [0, 2, 0, 0] },

      // ==========================================
      // SECCIÓN 6: CUESTIONARIO JUDICIAL COMPLETO (14 ITEMS)
      // ==========================================
      { text: '6. CUESTIONARIO JUDICIAL Y AJUSTE AL ORDENAMIENTO LEGAL', style: 'sectionHeader' },
      {
        table: {
          widths: ['75%', '25%'],
          body: [
            [{ text: '1. ¿Ha interpuesto demandas legales o de carácter laboral contra terceros?', style: 'tableLabel' }, { text: fmtBool(judicial.interpuesto_demandas), style: 'tableValue' }],
            [{ text: '2. ¿Ha sido demandado alguna vez (Alimentos, civil, deudas, penal)?', style: 'tableLabel' }, { text: fmtBool(judicial.sido_demandado), style: 'tableValue' }],
            [{ text: '3. ¿Ha tenido participación activa en cualquier tipo de proceso judicial?', style: 'tableLabel' }, { text: fmtBool(judicial.proceso_judicial), style: 'tableValue' }],
            [{ text: '4. ¿Registra algún tipo de detención, arresto o boletas policiales?', style: 'tableLabel' }, { text: `${fmtBool(judicial.detenciones)} ${judicial.detenciones ? `[Motivo: ${judicial.observacion_detenciones}]` : ''}`, style: judicial.detenciones ? 'tableValueRedBold' : 'tableValue' }],
            [{ text: '5. ¿Tiene familiares directos en centros de reclusión penitenciaria?', style: 'tableLabel' }, { text: `${fmtBool(judicial.familiares_detenidos)} ${judicial.familiares_detenidos ? `[Detalle: ${judicial.observacion_familiares_detenidos}]` : ''}`, style: 'tableValue' }],
            [{ text: '6. ¿Ha visitado o ingresado a centros de reclusión carcelaria?', style: 'tableLabel' }, { text: `${fmtBool(judicial.visitado_carcel)} ${judicial.visitado_carcel ? `[Detalle: ${judicial.observacion_visitado_carcel}]` : ''}`, style: 'tableValue' }],
            [{ text: '7. Última validación formal de antecedentes en portales gubernamentales:', style: 'tableLabel' }, { text: fmtFecha(judicial.ultima_verificacion_judicial), style: 'tableValueBold' }],
            [{ text: '10. ¿Ha tenido acceso o ha manipulado de manera directa armas de fuego?', style: 'tableLabel' }, { text: `${fmtBool(judicial.manipulado_armas)} ${judicial.manipulado_armas ? `[Contexto: ${judicial.motivo_armas}]` : ''}`, style: 'tableValue' }],
            [{ text: '11. ¿Ha tenido participación en actividades ajenas a la ley o fuera del orden jurídico?', style: 'tableLabel' }, { text: fmtBool(judicial.actividades_fuera_ley), style: judicial.actividades_fuera_ley ? 'tableValueRedBold' : 'tableValue' }],
            [{ text: '12. ¿Ha recibido propuestas delictivas de grupos o personas al margen de la ley?', style: 'tableLabel' }, { text: fmtBool(judicial.propuestas_ilegales), style: 'tableValue' }],
            [{ text: '13. ¿Su círculo cercano cuenta con antecedentes penales o comete delitos?', style: 'tableLabel' }, { text: fmtBool(judicial.entorno_ilegal_antecedentes), style: 'tableValue' }],
            [{ text: '14. ¿Ha cooperado en acciones delictivas con personas al margen de la ley?', style: 'tableLabel' }, { text: fmtBool(judicial.participacion_actos_ilegales), style: judicial.participacion_actos_ilegales ? 'tableValueRedBold' : 'tableValue' }]
          ]
        },
        layout: 'compactGrid'
      },
      { text: `Postura frente a grupos organizados delictivos: ${judicial.concepto_margen_ley || 'No registra definición.'}`, style: 'commentText', margin: [0, 4, 0, 0] },
      { text: `Declaración de nexos o vínculos al margen de la ley: ${judicial.vinculos_margen_ley || 'Niega rotundamente cualquier tipo de vínculo.'}`, style: 'commentText', margin: [0, 2, 0, 0] },

      // ==========================================
      // SECCIÓN 7: INFILTRACIÓN CORPORATIVA Y DICTAMEN
      // ==========================================
      { text: '7. CONTROL DE INFILTRACIÓN CORPORATIVA Y SABOTAJE', style: 'sectionHeader', pageBreak: 'before' },
      {
        table: {
          widths: ['75%', '25%'],
          body: [
            [{ text: '¿Posee nexos, familiares o amigos laborando actualmente dentro de la empresa?', style: 'tableLabel' }, { text: `${fmtBool(infil.contactos_empresa)} ${infil.contactos_empresa ? `[Detalle: ${infil.detalle_contactos}]` : ''}`, style: 'tableValue' }],
            [{ text: '¿Mantiene intenciones encubiertas de cometer o facilitar ilícitos internos?', style: 'tableLabel' }, { text: fmtBool(infil.intencion_ilicitos), style: infil.intencion_ilicitos ? 'tableValueRedBold' : 'tableValue' }],
            [{ text: '¿Cuenta con acuerdos delictivos con terceros para extraer información o sabotear?', style: 'tableLabel' }, { text: fmtBool(infil.acuerdo_ilicitos), style: infil.acuerdo_ilicitos ? 'tableValueRedBold' : 'tableValue' }],
            [{ text: '¿Recibió instrucciones o mandatos ex profeso para causar daños a la organización?', style: 'tableLabel' }, { text: fmtBool(infil.instrucciones_dano), style: infil.instrucciones_dano ? 'tableValueRedBold' : 'tableValue' }]
          ]
        },
        layout: 'compactGrid'
      },
      { text: `Interés y motivación principal manifestada para ingresar a la empresa: ${infil.motivacion_ingreso || 'No registrada.'}`, style: 'commentText', margin: [0, 4, 0, 0] },
      { text: `Análisis conductual y poligráfico sobre espionaje industrial: ${infil.observaciones || 'Sin indicadores de alerta o filtración de seguridad competitiva.'}`, style: 'commentText', margin: [0, 2, 0, 15] },

      // SEMÁFORO DE RIESGO DE ALTA FIDELIDAD VISUAL SEGURIDADAPP
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: `DICTAMEN FINAL DE EVALUACIÓN: NIVEL DE RIESGO ${riesgo}`,
                alignment: 'center',
                color: colorRiesgoText,
                bold: true,
                fontSize: 13,
                fillColor: colorRiesgoBg,
                padding: [10, 10, 10, 10]
              }
            ]
          ]
        },
        layout: 'noBorders',
        unbreakable: true
      },

      // ==========================================
      // CUADRO DE VALIDACIÓN DE FIRMAS REPETIBLES
      // ==========================================
      { text: '', margin: [0, 50, 0, 0] },
      {
        table: {
          widths: ['45%', '10%', '45%'],
          body: [
            [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#6e7681' }] },
              {},
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#6e7681' }] }
            ],
            [
              { text: 'Evaluador / Analista de Seguridad\nCertificación de Control de Confianza', style: 'signatureTitle' },
              {},
              { text: 'Firma / Huella dactilar del Postulante\nDeclaración de veracidad de datos', style: 'signatureTitle' }
            ]
          ]
        },
        layout: 'noBorders',
        unbreakable: true
      }
    ],

    // ==========================================
    // ESTILOS DE DISEÑO CORPORATIVO OSCURO PREMIUM
    // ==========================================
    styles: {
      mainHeaderTitle: { fontSize: 13, bold: true, color: '#1f6feb' },
      mainHeaderBrand: { fontSize: 16, bold: true, color: '#58a6ff', alignment: 'right' },
      sectionHeader: {
        fontSize: 10,
        bold: true,
        color: '#FFFFFF',
        fillColor: '#0d1117',
        padding: [6, 4, 6, 4],
        margin: [0, 12, 0, 6]
      },
      subSectionHeader: { fontSize: 9, bold: true, color: '#58a6ff', margin: [0, 6, 0, 3] },
      th: { fontSize: 8, bold: true, color: '#FFFFFF', fillColor: '#161b22', alignment: 'center', padding: [4, 4, 4, 4] },
      td: { fontSize: 8, color: '#c9d1d9', padding: [4, 4, 4, 4] },
      tdCenter: { fontSize: 8, color: '#c9d1d9', alignment: 'center', padding: [4, 4, 4, 4] },
      tdRight: { fontSize: 8, color: '#c9d1d9', alignment: 'right', padding: [4, 4, 4, 4] },
      tableLabel: { fontSize: 8, bold: true, color: '#8b949e', fillColor: '#161b22', padding: [5, 4, 5, 4] },
      tableValue: { fontSize: 8, color: '#e6edf3', fillColor: '#0d1117', padding: [5, 4, 5, 4] },
      tableValueBold: { fontSize: 8, bold: true, color: '#e6edf3', fillColor: '#0d1117', padding: [5, 4, 5, 4] },
      tableValueGreen: { fontSize: 8, bold: true, color: '#3fb950', fillColor: '#0d1117', padding: [5, 4, 5, 4] },
      tableValueRed: { fontSize: 8, bold: true, color: '#f85149', fillColor: '#0d1117', padding: [5, 4, 5, 4] },
      tableValueRedBold: { fontSize: 8, bold: true, color: '#FFFFFF', fillColor: '#da3633', padding: [5, 4, 5, 4], alignment: 'center' },
      commentText: { fontSize: 8, italic: true, color: '#8b949e', margin: [4, 2, 4, 2] },
      noDataText: { fontSize: 8, italic: true, color: '#6e7681', padding: [5, 5, 5, 5] },
      signatureTitle: { fontSize: 8, color: '#8b949e', alignment: 'center', margin: [0, 4, 0, 0] }
    },

    defaultStyle: {
      font: 'Roboto'
    }
  };

  // CONFIGURACIÓN DE REJILLAS PERSONALIZADAS INMUNE A RUPTURAS
  (pdfMake as any).tableLayouts = {
    compactGrid: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#30363d',
      vLineColor: () => '#30363d',
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 4,
      paddingBottom: () => 4
    },
    zebraGrid: {
      hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 0.5 : 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#30363d',
      vLineColor: () => '#30363d',
      fillColor: (i: number) => (i === 0) ? null : (i % 2 === 0 ? '#161b22' : '#0d1117'),
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 4,
      paddingBottom: () => 4
    }
  };

  // Ejecutar el motor de impresión y descarga
  (pdfMake as any).createPdf(docDefinition).download(`INFORME_SEGURIDAD_${dp.cedula || 'CANDIDATO'}.pdf`);
};