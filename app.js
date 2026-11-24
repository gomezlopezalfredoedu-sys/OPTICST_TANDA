/* ==================================================================
   TANDA VISUAL — PWA (App 2, SEPARADA de la App 1)
   Boutique de Lentes Yael · Sucursal Calle 4 · Solo Calle 4 por ahora.
   OPTICST NEXUS · Tanda Visual v2.0.4

   Reglas (definición aprobada 2026-11-23):
   - Venta a plazos PERSONAL (no es tanda ni fondo común). 10 pagos
     semanales; el cliente recibe los lentes en la semana de su número
     y sigue pagando ya con los lentes en su poder.
   - EL TOTAL: precio de los lentes (armazón + lente) dividido entre 10.
     Se elige el armazón y el lente con sus precios definidos del
     catálogo propio de la App 2; la app muestra el total definido y
     Alfredo TECLEA el total final (precio de venta). De ese total salen
     los pagos: semanal = ceil(total/10); los primeros 9 son ese monto y
     el 10º absorbe la diferencia.
   - Fechas límite: los lunes. Entrega estimada = inicio + número de
     semanas (viernes de la semana de entrega); entrega hasta el viernes,
     de 3:00 a 9:00 pm.
   - Color por tanda, lo asigna la app según el comportamiento de pago.
     Verde paga a tiempo; Amarillo 3+ atrasos; Naranja un pago sin pagar;
     Rojo al 4º atraso o si debe 2 pagos a la vez. Regreso a verde solo
     desde amarillo si la siguiente semana paga a tiempo. Al final de la
     tanda se evalúa y el operador confirma el color final.
   - Números 1-3 son fondo INTERNO (no se asignan). El cliente conoce
     del 1 al 10 y agarra desde el 4. Rangos por color (interno): verde
     4-10, amarillo 6-10, rojo 8 o solo 10. NUNCA se muestran al cliente.
   - El operador es Alfredo; el cliente NO usa la app.
   - Horarios hábiles para reportar pagos: lunes a sábado 9:00 am a
     9:00 pm. Entregas: 3:00 a 9:00 pm.
   - Garantías: 30 días de adaptación, 6 meses armazón, 6 meses tratamiento.
   ================================================================== */

'use strict';

/* ---------------- Constantes ---------------- */
var VERSION = '2.0.4';
var LS_URL = 'tv_api_url';
var LS_TOKEN = 'tv_api_token';
var LS_DEMO = 'tv_demo';
var NUMERO_MIN = 4, NUMERO_MAX = 10;
var WHATSAPP_REPORTES = '5215611586976'; // 56 1158 6976 (reporte de pagos)
var NEGOCIO = {
  nombre: 'Boutique de Lentes Yael',
  programa: 'Tanda Visual',
  sucursal: 'Calle 4',
  direccion: 'Calle 4 Nº 342, Agrícola Pantitlán, Iztacalco, CDMX, 08100',
  telefonos: '55 9719 1674 / 56 1158 6976',
  correo: 'contacto@opticasluna.com',
  instagram: '@Opticasluna14'
};
var GARANTIAS = { adaptacion: 30, armazon: 6, tratamiento: 6 };
/* ---------- Declaraciones de las firmas digitales (v2.0.4) ----------
   Cada firma va atada a lo que el cliente declaró: la firma no es
   solo un garabato. La de aceptación se firma en el paso 2 del wizard
   (después de LEER la carta); la de entrega se firma al recoger los
   lentes. Prueba de aceptación y de entrega, no para litigio. */
var DECLARACION_ACEPTACION = 'He leído las condiciones del programa y acepto y acataré las mismas para la participación de dicho programa.';
var DECLARACION_ENTREGA = 'Estoy conforme con mis lentes recibidos y entiendo las garantías que tiene mi producto.';
/* ---------- Tarjeta de EJEMPLO (v2.0.4, Detalle 7) ----------
   Datos CLARAMENTE FICTICIOS para la tarjeta de ejemplo de la carta.
   NUNCA se usan datos reales del cliente en el ejemplo: el ejemplo
   es solo para que el cliente vea cómo será su tarjeta; la tarjeta
   REAL (con sus datos) es otro documento y se genera a partir del
   primer pago. Fechas: lunes de muestra de enero a marzo de 2026. */
var EJEMPLO_TARJETA = {
  nombre: 'Cliente Ejemplo', clienteId: '0000', numero: 0,
  fechaInicio: '2026-01-05', entregaEstimada: '2026-01-05',
  total: 2500, pagoSemanal: 250, ultimoPago: 250,
  semanas: [
    { semana: 1, fechaLimite: '2026-01-05', monto: 250 },
    { semana: 2, fechaLimite: '2026-01-12', monto: 250 },
    { semana: 3, fechaLimite: '2026-01-19', monto: 250 },
    { semana: 4, fechaLimite: '2026-01-26', monto: 250 },
    { semana: 5, fechaLimite: '2026-02-02', monto: 250 },
    { semana: 6, fechaLimite: '2026-02-09', monto: 250 },
    { semana: 7, fechaLimite: '2026-02-16', monto: 250 },
    { semana: 8, fechaLimite: '2026-02-23', monto: 250 },
    { semana: 9, fechaLimite: '2026-03-02', monto: 250 },
    { semana: 10, fechaLimite: '2026-03-09', monto: 250 }
  ]
};
/* ---------- Laboratorio Óptico Luna (SOLO órdenes de trabajo) ----------
   Como en la App 1: Yael es el operador principal para la venta al
   cliente; Luna es el operador de proceso, la entidad que elabora los
   lentes. Por eso SOLO en las órdenes de trabajo sale Luna (nombre +
   logo); todo lo demás sigue con Yael. Misma dirección y teléfonos de
   Calle 4. El logo es logo-luna.png (copia del de la App 1, ya
   transparente, 785x527). */
var LABORATORIO = {
  nombre: 'Laboratorio Óptico Luna',
  direccion: NEGOCIO.direccion,
  telefonos: NEGOCIO.telefonos,
  logo: 'logo-luna.png'
};
var COLORES = {
  Verde: { etiqueta: 'Verde', clase: 'chip-estado-ok', desc: 'Al corriente' },
  Amarillo: { etiqueta: 'Amarillo', clase: 'chip-estado-amarillo', desc: '3 o más atrasos' },
  Naranja: { etiqueta: 'Naranja', clase: 'chip-estado-pend', desc: 'Un pago sin pagar' },
  Rojo: { etiqueta: 'Rojo', clase: 'chip-estado-rojo', desc: 'Riesgo: 4º atraso o debe 2 pagos' }
};

/* ---------------- Utilidades ---------------- */
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function money(n) {
  var v = Number(n);
  if (!isFinite(v)) return '$0.00';
  return '$' + v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fechaMX(iso) {
  if (!iso) return '—';
  var partes = String(iso).slice(0, 10).split('-');
  if (partes.length !== 3) return String(iso);
  var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return Number(partes[2]) + '/' + meses[Number(partes[1]) - 1] + '/' + partes[0];
}
function hoyISO() {
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + dia;
}
function sumarDias(iso, dias) {
  var p = String(iso).slice(0, 10).split('-');
  var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]) + dias);
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + dia;
}
function diaSemana(iso) {
  var p = String(iso).slice(0, 10).split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getDay(); // 0 dom, 1 lun...
}
function num(v, defecto) {
  var n = parseFloat(v);
  return isNaN(n) ? (defecto === undefined ? 0 : defecto) : n;
}
function redondear(n) { return Math.round(n * 100) / 100; }

/** Esf/Cil/Add siempre a 2 decimales CON signo (−2.00, +2.50, 0.00); vacío → "—". */
function fmtGrad(v) {
  if (v === '' || v === null || v === undefined) return '—';
  var n = parseFloat(v);
  if (isNaN(n)) return String(v);
  if (n === 0) return '0.00';
  return (n > 0 ? '+' : '−') + Math.abs(n).toFixed(2);
}

/* Rangos optométricos (iguales que la App 1). */
function rangoEsfera() {
  var out = [];
  for (var e = -20; e <= 10; e += 0.5) {
    var v = e === 0 ? '0.00' : (e < 0 ? e.toFixed(2) : '+' + e.toFixed(2));
    out.push(v);
  }
  return out;
}
function rangoCilindro() {
  var out = [];
  for (var c = 0; c >= -10; c -= 0.5) out.push(c.toFixed(2));
  return out;
}
function rangoEje() {
  var out = [];
  for (var g = 0; g <= 180; g += 5) out.push(String(g));
  return out;
}
function rangoAdd() {
  var out = [];
  for (var a = 1; a <= 3; a += 0.5) out.push('+' + a.toFixed(2));
  return out;
}
var SNELLEN = ['cuenta dedos', '20/400', '20/200', '20/100', '20/70', '20/50',
  '20/40', '20/30', '20/25', '20/20', '20/15', '20/13', '20/10'];

function fillSelect(sel, valores, conVacio, fmtEtiqueta) {
  if (!sel) return;
  sel.innerHTML = '';
  if (conVacio) {
    var o0 = document.createElement('option');
    o0.value = ''; o0.textContent = '—';
    sel.appendChild(o0);
  }
  valores.forEach(function (v) {
    var o = document.createElement('option');
    o.value = v;
    o.textContent = fmtEtiqueta ? fmtEtiqueta(v) : v;
    sel.appendChild(o);
  });
}

/* ---------------- Lógica de Tanda Visual (espejo del backend) ---------------- */
function calcularPlan(total) {
  var t = num(total, 0);
  if (t <= 0) throw new Error('el total debe ser mayor que 0');
  var semanal = Math.ceil(t / 10);
  var ultimo = redondear(t - 9 * semanal);
  return { semanal: semanal, ultimo: ultimo };
}
function primerLunes(fechaISO) {
  var p = String(fechaISO || hoyISO()).slice(0, 10).split('-');
  var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  var dia = d.getDay();
  var diff = (dia === 0 ? 1 : (dia === 1 ? 0 : 8 - dia));
  return sumarDias(fechaISO, diff);
}
function fechasLimite(fechaInicio) {
  var lunes = primerLunes(fechaInicio);
  var out = [];
  for (var i = 0; i < 10; i++) out.push(sumarDias(lunes, i * 7));
  return out;
}
function entregaEstimada(fechaInicio, numero) {
  return sumarDias(fechaInicio, num(numero, 0) * 7);
}
function numeroMinimo(color) {
  switch (String(color || 'Verde')) {
    case 'Rojo': return 8;
    case 'Amarillo': return 6;
    case 'Naranja': return 6;
    default: return 4;
  }
}
function colorDesdeSemanas(semanas, hoy) {
  var h = hoy || hoyISO();
  var tardios = 0, vencidos = 0, pagados = 0, ultimoPagado = null;
  semanas.forEach(function (s) {
    var estado = String(s.estado || 'Pendiente');
    if (estado === 'Tarde') tardios++;
    if (estado === 'Pagado' || estado === 'Tarde') {
      pagados++;
      if (!ultimoPagado || num(s.semana, 0) > num(ultimoPagado.semana, 0)) ultimoPagado = s;
    }
    if (estado === 'Pendiente' && s.fechaLimite && String(s.fechaLimite) < h) vencidos++;
  });
  var ultimoATiempo = !!ultimoPagado && String(ultimoPagado.estado) === 'Pagado';
  var color;
  if (vencidos >= 2) color = 'Rojo';
  else if (tardios >= 4) color = 'Rojo';
  else if (vencidos >= 1) color = 'Naranja';
  else if (tardios >= 3) color = ultimoATiempo ? 'Verde' : 'Amarillo';
  else color = 'Verde';
  return { color: color, tardios: tardios, vencidos: vencidos, pagados: pagados, ultimoATiempo: ultimoATiempo };
}

/* ---------------- Estado ---------------- */
var state = {
  config: null, listas: null, catalogos: null,
  demo: false, url: '', token: '',
  panel: null, resumen: null,
  tandasCache: [],
  currentTanda: null, currentCliente: null,
  currentDoc: null, // {kind: 'reglamento'|'tarjeta'|'orden'|'evidencia', tandaId}
  // v2.0.4 (Detalle 2): imagen del documento pre-generada al abrir la
  // vista, para que navigator.share se llame SÍNCRONO dentro del toque.
  docImg: { key: null, blob: null, listo: false },
  wizard: null
};

function isDemo() { return state.demo; }
function loadConfig() {
  state.url = (localStorage.getItem(LS_URL) || '').trim();
  state.token = (localStorage.getItem(LS_TOKEN) || '').trim();
  state.demo = localStorage.getItem(LS_DEMO) === '1';
  return !!(state.url && state.token) || state.demo;
}
function saveConfig(url, token, demoFlag) {
  localStorage.setItem(LS_URL, (url || '').trim());
  localStorage.setItem(LS_TOKEN, (token || '').trim());
  localStorage.setItem(LS_DEMO, demoFlag ? '1' : '0');
  return loadConfig();
}

/* ---------------- API ---------------- */
function api(action, params) {
  params = params || {};
  if (isDemo()) return demoApi(action, params);
  var body = Object.assign({ token: state.token, action: action }, params);
  return fetch(state.url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  }).then(function (r) { return r.json(); }).then(function (j) {
    if (!j.ok) throw new Error(j.error || 'Error del servidor');
    return j.data;
  });
}

/* ---------------- DEMO (datos de ejemplo, claramente ficticios) ---------------- */
var DEMO_CLIENTE = { id: 3790, nombre: 'Ana Demo', fechaNac: '1990-05-10', edad: 36,
  telefono: '5512345678', ocupacion: 'Demo', sexo: 'Femenino', creado: '2026-11-23' };
var DEMO_TANDA = null; // se construye al cargar demo
function demoCatalogos() {
  return {
    config: { Nombre: NEGOCIO.nombre, Programa: 'Tanda Visual', Sucursal: 'Calle 4',
      Direccion: NEGOCIO.direccion, Telefonos: NEGOCIO.telefonos,
      WhatsApp_Reportes: '56 1158 6976', Correo: NEGOCIO.correo,
      Folio_Cliente_Next: 3791, Folio_Tanda_Next: 2,
      Garantia_Adaptacion_Dias: 30, Garantia_Armazon_Meses: 6, Garantia_Tratamiento_Meses: 6,
      Horario_Reporte_Inicio: '9:00', Horario_Reporte_Fin: '21:00',
      Horario_Entrega_Inicio: '15:00', Horario_Entrega_Fin: '21:00',
      Numero_Fondo_Min: 1, Numero_Fondo_Max: 3, Numero_Cliente_Min: 4, Numero_Cliente_Max: 10 },
    listas: {
      Esfera: rangoEsfera(), Cilindro: rangoCilindro(), Eje: rangoEje(), Add: rangoAdd(),
      'Agudeza visual': SNELLEN,
      Material_Lente: ['Cristal', 'CR39', 'Poli', '1.67', '1.74'],
      Diseno_Lente: ['Monofocal', 'Bifocal', 'Progresivo', 'Lente de contacto'],
      Tratamiento: ['AR', 'Foto AR', 'Blue', 'Blue Foto', 'Polar', 'W', 'Foto', 'Filtro color'],
      Filtro_Tono: ['1', '2', '3'],
      Material_Armazon: ['Metálico', 'Plástico', 'TR-90', 'Ultem', 'Aluminio', 'Titanio'],
      Diseno_Armazon: ['completo', 'ranurado', '3 piezas (tornillo)', '3 piezas (grapa)'],
      Motivo: ['Primera vez', 'Dolor de cabeza', 'Visión borrosa', 'Actualización de graduación', 'Lentes rotos'],
      Metodo_Pago: ['Efectivo', 'Transferencia'],
      Proveedor: ['Mia', 'H2O', 'Lensbest', 'INFONDI'],
      Color: ['Verde', 'Amarillo', 'Naranja', 'Rojo'],
      Estado_Tanda: ['Activa', 'Entregada', 'Completada', 'Cerrada']
    },
    catalogos: {
      armazones: [], // vacío como en el Libro real (aún sin catálogo de armazones)
      lentes: [
        { concepto: 'Ar 1era', precioEstimado: 25 }, { concepto: 'Ar 2da', precioEstimado: 52 },
        { concepto: 'Blue 1era', precioEstimado: 65 }, { concepto: 'Blue 2da', precioEstimado: 90 },
        { concepto: 'Bifocal Ar', precioEstimado: 44 }, { concepto: 'progresivo Ar', precioEstimado: 80 },
        { concepto: 'Progresivo Blue', precioEstimado: 140 }, { concepto: 'poli Ar', precioEstimado: 130 }
      ]
    }
  };
}
function demoSemanas(inicio, numero, semanal, ultimo) {
  var limites = fechasLimite(inicio);
  var out = [];
  for (var i = 0; i < 10; i++) {
    out.push({ semana: i + 1, fechaLimite: limites[i], monto: (i === 9 ? ultimo : semanal),
      estado: 'Pendiente', fechaPago: '', metodo: '', comprobante: '', comprobanteUrl: '',
      estadoMuestra: 'Pendiente' });
  }
  return out;
}
function demoTanda() {
  if (DEMO_TANDA) return DEMO_TANDA;
  var inicio = '2026-11-23', numero = 5, total = 1999;
  var plan = calcularPlan(total);
  DEMO_TANDA = {
    id: 'TAN-0001', clienteId: 3790, numero: numero,
    armazonModelo: 'Demo', armazonMarca: 'Demo', armazonMaterial: 'Metálico',
    armazonDiseno: 'completo', armazonPrecio: 499,
    lenteConcepto: 'Blue 1era', lenteMaterial: 'CR39', lenteDiseno: 'Monofocal',
    lenteTratamiento: 'Blue', lentePrecio: 65, precioDefinido: 564,
    total: total, pagoSemanal: plan.semanal, ultimoPago: plan.ultimo,
    fechaInicio: inicio, entregaEstimada: entregaEstimada(inicio, numero),
    fechaEntrega: '', color: 'Verde', colorFinal: '', huboRojo: 'No', estado: 'Activa',
    firmaEntrega: '', creado: inicio,
    clienteNombre: DEMO_CLIENTE.nombre, clienteTelefono: DEMO_CLIENTE.telefono,
    pagados: 2, tardios: 0, vencidos: 0, totalAdeudado: 0,
    proximaSemana: 3, proximaFechaLimite: fechasLimite(inicio)[2], proximoMonto: plan.semanal,
    cliente: DEMO_CLIENTE,
    semanas: demoSemanas(inicio, numero, plan.semanal, plan.ultimo),
    pagos: [
      { idPago: 'PAG-0001', tandaId: 'TAN-0001', semana: 1, fecha: '2026-11-23', monto: plan.semanal, metodo: 'Efectivo', comprobante: '' },
      { idPago: 'PAG-0002', tandaId: 'TAN-0001', semana: 2, fecha: '2026-11-30', monto: plan.semanal, metodo: 'Efectivo', comprobante: '' }
    ],
    // Optometría de ejemplo (DEMO) para que la orden de trabajo se vea
    // completa: graduación, Add y DNP como los capturaría Alfredo.
    optometria: { gradEsfOD: '-2.00', gradCilOD: '-0.50', gradEjeOD: '180',
      gradEsfOI: '-2.50', gradCilOI: '-0.75', gradEjeOI: '10', gradAdd: '+2.00',
      dnp: '63', lensEsfOD: '-2.00', lensCilOD: '-0.50', lensEjeOD: '180',
      lensEsfOI: '-2.50', lensCilOI: '-0.75', lensEjeOI: '10', lensAdd: '+2.00',
      lensDnp: '63' }
  };
  DEMO_TANDA.semanas[0].estado = 'Pagado'; DEMO_TANDA.semanas[0].fechaPago = '2026-11-23'; DEMO_TANDA.semanas[0].metodo = 'Efectivo';
  DEMO_TANDA.semanas[1].estado = 'Pagado'; DEMO_TANDA.semanas[1].fechaPago = '2026-11-30'; DEMO_TANDA.semanas[1].metodo = 'Efectivo';
  return DEMO_TANDA;
}
function demoApi(action, p) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      try {
        if (action === 'ping') return resolve({ version: VERSION });
        if (action === 'getCatalogos') return resolve(demoCatalogos());
        if (action === 'buscarCliente') {
          var q = String(p.q || '').toLowerCase();
          if (!q) return resolve([]);
          return resolve(DEMO_CLIENTE.nombre.toLowerCase().indexOf(q) !== -1 ? [DEMO_CLIENTE] : []);
        }
        if (action === 'getCliente') return resolve({ cliente: DEMO_CLIENTE, tandas: [demoTanda()], optometria: [] });
        if (action === 'crearCliente') return resolve({ id: 3791 });
        if (action === 'guardarOptometria') return resolve({ id: 'OPT-0001' });
        if (action === 'crearTanda') {
          var plan = calcularPlan(p.total);
          return resolve({ id: 'TAN-0002', numero: Number(p.numero), total: Number(p.total),
            precioDefinido: redondear(num(p.armazonPrecio, 0) + num(p.lentePrecio, 0)),
            pagoSemanal: plan.semanal, ultimoPago: plan.ultimo,
            fechaInicio: p.fechaInicio || hoyISO(),
            entregaEstimada: entregaEstimada(p.fechaInicio || hoyISO(), p.numero),
            colorCliente: 'Verde', numeroMinimo: 4 });
        }
        if (action === 'getTanda') return resolve(demoTanda());
        if (action === 'getTandas') return resolve({ tandas: [demoTanda()] });
        if (action === 'registrarPago') {
          return resolve({ pagoId: 'PAG-0003', tandaId: p.tandaId, semana: Number(p.semana),
            fecha: hoyISO(), monto: 200, metodo: p.metodo, estado: 'Pagado', color: 'Verde', comprobanteUrl: '' });
        }
        if (action === 'registrarEntrega') return resolve({ tandaId: p.tandaId, fechaEntrega: hoyISO(), firmaUrl: '' });
        if (action === 'getPanel') {
          var t = demoTanda();
          return resolve({ hoy: hoyISO(), esViernes: new Date().getDay() === 5,
            paganHoy: [], atrasados: [],
            recibenEstaSemana: [{ tandaId: t.id, clienteId: t.clienteId, clienteNombre: t.clienteNombre,
              telefono: t.clienteTelefono, numero: t.numero, entregaEstimada: t.entregaEstimada, color: 'Verde' }] });
        }
        if (action === 'getResumen') return resolve({ periodo: p.periodo || 'mes', desde: hoyISO(), hasta: hoyISO(),
          totalCobrado: 400, pagosCount: 2, tandasPorEstado: { Activa: 1, Entregada: 0, Completada: 0, Cerrada: 0 }, porCobrar: 1599 });
        if (action === 'getTarjeta') {
          var d = demoTanda();
          return resolve({ cliente: d.cliente, tanda: d, semanas: d.semanas, pagados: d.pagados,
            tardios: d.tardios, vencidos: d.vencidos, totalAdeudado: d.totalAdeudado });
        }
        if (action === 'evaluarTanda') return resolve({ tandaId: p.id, clienteId: 3790, tardios: 0,
          pagosATiempo: 2, pagados: 2, huboRojo: 'No', colorActual: 'Verde', todosPagados: false,
          sugerencia: 'Verde', numeroMinimoSugerido: 4 });
        if (action === 'confirmarColorFinal') return resolve({ tandaId: p.id, colorFinal: p.colorFinal });
        reject(new Error('acción desconocida en DEMO: ' + action));
      } catch (e) { reject(e); }
    }, 60);
  });
}

/* ---------------- UI helpers ---------------- */
function showError(msg) {
  var b = $('banner');
  if (!b) return;
  b.textContent = msg;
  b.className = 'banner error';
  b.hidden = false;
  clearTimeout(showError._t);
  showError._t = setTimeout(function () { b.hidden = true; }, 6000);
}
function showOk(msg) {
  var b = $('banner');
  if (!b) return;
  b.textContent = msg;
  b.className = 'banner success';
  b.hidden = false;
  clearTimeout(showOk._t);
  showOk._t = setTimeout(function () { b.hidden = true; }, 5000);
}
function waLink(telefono, texto) {
  var tel = String(telefono || '').replace(/\D/g, '');
  var base = tel ? 'https://wa.me/52' + tel : 'https://wa.me/';
  return base + '?text=' + encodeURIComponent(texto);
}
function colorChip(color) {
  var c = COLORES[color] || COLORES.Verde;
  return '<span class="chip ' + c.clase + '">' + c.etiqueta + '</span>';
}
function progresoBar(pagados) {
  var pct = Math.round((num(pagados, 0) / 10) * 100);
  var segs = '';
  for (var i = 0; i < 10; i++) {
    segs += '<span class="prog-seg' + (i < num(pagados, 0) ? ' lleno' : '') + '"></span>';
  }
  return '<div class="prog"><div class="prog-segs">' + segs + '</div><small>' + pagados + ' de 10 pagos · ' + pct + '%</small></div>';
}
/* ---------------- Lightbox de imágenes (v2.0.4, Detalle 4) ----------------
   Toca una miniatura (INE, rostro, firmas) y se ve en grande. El
   overlay se cierra con un toque en cualquier parte. */
function ampliarImagen(url) {
  var lb = $('lightbox');
  var img = $('lightboxImg');
  if (!lb || !img || !url) return;
  img.src = url;
  lb.hidden = false;
}
function cablearLightbox() {
  var lb = $('lightbox');
  if (!lb) return;
  lb.addEventListener('click', function () { lb.hidden = true; $('lightboxImg').src = ''; });
}
document.addEventListener('DOMContentLoaded', cablearLightbox);

/* ---------------- Navegación ---------------- */
var VISTAS = ['home', 'wizard', 'buscar', 'tandas', 'ficha', 'pago', 'entrega', 'resumen', 'doc', 'setup'];
function show(vista) {
  VISTAS.forEach(function (v) {
    var el = $('view-' + v);
    if (el) el.hidden = (v !== vista);
  });
  document.querySelectorAll('.nav-item').forEach(function (b) {
    b.classList.toggle('active', b.dataset.view === vista);
  });
  // v2.0.0: el FAB "Nueva tanda" también marca su estado activo cuando
  // está abierto el wizard (antes solo lo hacían los .nav-item).
  var fab = $('navFab');
  if (fab) fab.classList.toggle('active', vista === 'wizard');
  window.scrollTo(0, 0);
}

/* ---------------- Splash / arranque ---------------- */
function mostrarSplashArranque() {
  var s = $('splashStart');
  if (!s) return;
  s.hidden = false;
  s.addEventListener('click', ocultarSplash, { once: true });
  setTimeout(ocultarSplash, 4000);
}
function ocultarSplash() {
  var s = $('splashStart');
  if (s) s.hidden = true;
}
function esperarSplashMinimo(inicio) {
  var transcurrido = Date.now() - inicio;
  var falta = Math.max(0, 1500 - transcurrido);
  return new Promise(function (res) { setTimeout(res, falta); });
}

/* ---------------- Catálogos ---------------- */
function cargarCatalogos() {
  return api('getCatalogos').then(function (d) {
    state.config = d.config || {};
    state.listas = d.listas || {};
    state.catalogos = d.catalogos || { armazones: [], lentes: [] };
    llenarDropdownsOptometria();
    llenarDropdownsProducto();
    llenarEntregaOptometria();
  });
}
function listasDe(nombre) {
  if (state.listas && state.listas[nombre]) return state.listas[nombre];
  // Fallbacks si el backend no trae la lista (modo DEMO ya las trae).
  var fb = {
    Esfera: rangoEsfera(), Cilindro: rangoCilindro(), Eje: rangoEje(), Add: rangoAdd(),
    'Agudeza visual': SNELLEN,
    Material_Lente: ['Cristal', 'CR39', 'Poli', '1.67', '1.74'],
    Diseno_Lente: ['Monofocal', 'Bifocal', 'Progresivo', 'Lente de contacto'],
    Tratamiento: ['AR', 'Foto AR', 'Blue', 'Blue Foto', 'Polar', 'W', 'Foto', 'Filtro color'],
    Material_Armazon: ['Metálico', 'Plástico', 'TR-90', 'Ultem', 'Aluminio', 'Titanio'],
    Diseno_Armazon: ['completo', 'ranurado', '3 piezas (tornillo)', '3 piezas (grapa)'],
    Motivo: ['Primera vez', 'Dolor de cabeza', 'Visión borrosa', 'Actualización de graduación', 'Lentes rotos']
  };
  return fb[nombre] || [];
}
function llenarDropdownsOptometria() {
  var esf = listasDe('Esfera'), cil = listasDe('Cilindro'), eje = listasDe('Eje'), add = listasDe('Add');
  var fmt = function (v) { return fmtGrad(v); };
  [['wLensEsfOD', esf], ['wLensEsfOI', esf], ['wGradEsfOD', esf], ['wGradEsfOI', esf]].forEach(function (x) { fillSelect($(x[0]), x[1], true, fmt); });
  [['wLensCilOD', cil], ['wLensCilOI', cil], ['wGradCilOD', cil], ['wGradCilOI', cil]].forEach(function (x) { fillSelect($(x[0]), x[1], true, fmt); });
  [['wLensEjeOD', eje], ['wLensEjeOI', eje], ['wGradEjeOD', eje], ['wGradEjeOI', eje]].forEach(function (x) { fillSelect($(x[0]), x[1], true); });
  [['wLensAdd', add], ['wGradAdd', add]].forEach(function (x) { fillSelect($(x[0]), x[1], true, fmt); });
  var av = listasDe('Agudeza visual');
  ['wAvSinOD', 'wAvSinOI', 'wAvSinAO', 'wAvConOD', 'wAvConOI', 'wAvConAO'].forEach(function (id) { fillSelect($(id), av, true); });
  fillSelect($('wLensDiseno'), listasDe('Diseno_Lente'), true);
  fillSelect($('wMotivo'), listasDe('Motivo'), true);
}
function llenarDropdownsProducto() {
  fillSelect($('wArmazonMaterial'), listasDe('Material_Armazon'), true);
  fillSelect($('wArmazonDiseno'), listasDe('Diseno_Armazon'), true);
  fillSelect($('wLenteMaterial'), listasDe('Material_Lente'), true);
  fillSelect($('wLenteDiseno'), listasDe('Diseno_Lente'), true);
  fillSelect($('wLenteTratamiento'), listasDe('Tratamiento'), true);
  // Catálogo de armazones: sin desplegable (Alfredo 2026-11-23: el
  // catálogo está vacío y siempre se captura a mano; el título del
  // paso 4 lo dice. Si llega el catálogo, se repone el select).
  // Catálogo de lentes (29 conceptos de la lista de Alfredo).
  var selL = $('wLenteConcepto');
  selL.innerHTML = '<option value="">— Capturar a mano —</option>';
  (state.catalogos.lentes || []).forEach(function (l, i) {
    var o = document.createElement('option');
    o.value = String(i);
    o.textContent = (l.concepto || '') + ' — ' + money(l.precioEstimado);
    selL.appendChild(o);
  });
}

/* ---------------- Panel del día ---------------- */
function cargarPanel() {
  $('panelFecha').textContent = 'Hoy: ' + fechaMX(hoyISO());
  return api('getPanel').then(function (d) {
    state.panel = d;
    renderPanel(d);
  }).catch(function (e) { showError('No se pudo cargar el panel: ' + e.message); });
}
function renderPanel(d) {
  // v2.0.0: tira de resumen con los 3 conteos del día (Yael: turquesa /
  // rojo / lila según el estado). El payload de getPanel (backend y DEMO)
  // no trae `pagados` por cliente, así que cada tarjeta muestra el chip
  // de color bien visible + semana/monto, sin inventar progreso.
  var nHoy = (d.paganHoy || []).length;
  var nAtr = (d.atrasados || []).length;
  var nRec = (d.recibenEstaSemana || []).length;
  var elResumen = $('panelResumen');
  if (elResumen) {
    elResumen.innerHTML =
      '<div class="panel-resumen-item panel-resumen-hoy"><span class="pr-num">' + nHoy + '</span><span class="pr-label">Pagan hoy</span></div>' +
      '<div class="panel-resumen-item panel-resumen-atraso"><span class="pr-num">' + nAtr + '</span><span class="pr-label">Atrasados</span></div>' +
      '<div class="panel-resumen-item panel-resumen-reciben"><span class="pr-num">' + nRec + '</span><span class="pr-label">Reciben esta semana</span></div>';
  }
  var htmlHoy = '';
  (d.paganHoy || []).forEach(function (p) {
    htmlHoy += '<div class="list-item panel-item panel-item-' + String(p.color || 'Verde').toLowerCase() + '"><div class="row"><strong>' + esc(p.clienteNombre) + '</strong>' + colorChip(p.color) + '</div>' +
      '<small>Semana ' + p.semana + ' · ' + money(p.monto) + ' · Nº ' + p.numero + ' · TAN ' + esc(p.tandaId) + '</small>' +
      '<div class="row"><button class="btn btn-secondary" data-accion="pago" data-tanda="' + esc(p.tandaId) + '" data-semana="' + p.semana + '">Registrar pago</button>' +
      '<a class="btn btn-ghost" href="' + waLink(p.telefono, mensajeRecordatorio(p)) + '" target="_blank" rel="noopener">Recordatorio</a></div></div>';
  });
  $('panelPaganHoy').innerHTML = htmlHoy || '<p class="hint">Nadie paga hoy.</p>';
  var htmlAtr = '';
  (d.atrasados || []).forEach(function (a) {
    htmlAtr += '<div class="list-item panel-item panel-item-' + String(a.color || 'Verde').toLowerCase() + '"><div class="row"><strong>' + esc(a.clienteNombre) + '</strong>' + colorChip(a.color) + '</div>' +
      '<small>' + a.semanasVencidas + ' semana(s) vencida(s) · adeuda ' + money(a.adeudo) + ' · Nº ' + a.numero + ' · entrega ' + fechaMX(a.entregaEstimada) + ' (recorrida)</small>' +
      '<div class="row"><button class="btn btn-secondary" data-accion="ficha" data-tanda="' + esc(a.tandaId) + '">Ver tanda</button>' +
      '<a class="btn btn-ghost" href="' + waLink(a.telefono, mensajeAtraso(a)) + '" target="_blank" rel="noopener">Mensaje de atraso</a></div></div>';
  });
  $('panelAtrasados').innerHTML = htmlAtr || '<p class="hint">Nadie atrasado. Bien.</p>';
  var htmlRec = '';
  (d.recibenEstaSemana || []).forEach(function (r) {
    htmlRec += '<div class="list-item panel-item panel-item-' + String(r.color || 'Verde').toLowerCase() + '"><div class="row"><strong>' + esc(r.clienteNombre) + '</strong>' + colorChip(r.color) + '</div>' +
      '<small>Nº ' + r.numero + ' · entrega ' + fechaMX(r.entregaEstimada) + ' · de 3:00 a 9:00 pm</small>' +
      '<div class="row"><button class="btn btn-secondary" data-accion="ficha" data-tanda="' + esc(r.tandaId) + '">Ver tanda</button>' +
      '<button class="btn btn-secondary" data-accion="orden" data-tanda="' + esc(r.tandaId) + '">Orden de trabajo</button>' +
      (d.esViernes ? '<a class="btn btn-ghost" href="' + waLink(r.telefono, mensajeRecoger(r)) + '" target="_blank" rel="noopener">Ya puede recoger</a>' : '') + '</div></div>';
  });
  $('panelReciben').innerHTML = htmlRec || '<p class="hint">Nadie recibe esta semana.</p>';
  // Acciones de la lista del panel.
  document.querySelectorAll('#view-home [data-accion]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.accion === 'ficha') abrirFicha(b.dataset.tanda);
      if (b.dataset.accion === 'pago') abrirPago(b.dataset.tanda, b.dataset.semana);
      if (b.dataset.accion === 'orden') abrirOrden(b.dataset.tanda);
    });
  });
}

/* ---------------- Resumen ---------------- */
function cargarResumen() {
  var periodo = $('resumenPeriodo').value || 'mes';
  return api('getResumen', { periodo: periodo }).then(function (d) {
    state.resumen = d;
    var pe = d.tandasPorEstado || {};
    $('resumenContenido').innerHTML =
      '<p><strong>Periodo:</strong> ' + fechaMX(d.desde) + ' — ' + fechaMX(d.hasta) + '</p>' +
      '<p><strong>Total cobrado:</strong> ' + money(d.totalCobrado) + ' (' + d.pagosCount + ' pagos)</p>' +
      '<p><strong>Por cobrar (semanas pendientes):</strong> ' + money(d.porCobrar) + '</p>' +
      '<p><strong>Tandas activas:</strong> ' + (pe.Activa || 0) + ' · Entregadas: ' + (pe.Entregada || 0) +
      ' · Completadas: ' + (pe.Completada || 0) + ' · Cerradas: ' + (pe.Cerrada || 0) + '</p>';
  }).catch(function (e) { showError('No se pudo cargar el resumen: ' + e.message); });
}

/* ---------------- Arranque ---------------- */
function init() {
  var inicio = Date.now();
  mostrarSplashArranque();
  var configurado = loadConfig();
  $('btnConfig').hidden = configurado && !state.demo ? true : false;
  if (!configurado) {
    esperarSplashMinimo(inicio).then(function () { show('setup'); });
  } else {
    api('ping').then(function () { return cargarCatalogos(); }).then(function () {
      return esperarSplashMinimo(inicio);
    }).then(function () {
      show('home');
      return cargarPanel();
    }).catch(function (e) {
      esperarSplashMinimo(inicio).then(function () {
        showError('No se pudo conectar: ' + e.message + '. Revisa la URL y el token.');
        show('setup');
      });
    });
  }
  // Navegación inferior.
  document.querySelectorAll('.nav-item').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.view;
      if (v === 'home') { show('home'); cargarPanel(); }
      if (v === 'tandas') { show('tandas'); cargarTandas(); }
      if (v === 'buscar') { show('buscar'); }
      if (v === 'resumen') { show('resumen'); cargarResumen(); }
    });
  });
  $('navFab').addEventListener('click', iniciarWizard);
  $('btnNuevaTanda').addEventListener('click', iniciarWizard);
  $('btnIrBuscar').addEventListener('click', function () { show('buscar'); });
  $('btnIrRegistrarPago').addEventListener('click', function () { abrirPago(); });
  $('btnConfig').addEventListener('click', function () { show('setup'); });
  $('btnSetupGuardar').addEventListener('click', guardarSetup);
  $('resumenPeriodo').addEventListener('change', cargarResumen);
  // Registrar el service worker.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
}
function guardarSetup() {
  var url = $('setupUrl').value.trim();
  var token = $('setupToken').value.trim();
  var demo = $('setupDemo').checked;
  if (demo) {
    saveConfig('', '', true);
    showOk('Modo DEMO activado (datos de ejemplo).');
    init();
    return;
  }
  if (!url || !token) {
    $('setupError').hidden = false;
    $('setupError').textContent = 'Pega la URL del web app y el token.';
    return;
  }
  $('setupError').hidden = true;
  saveConfig(url, token, false);
  init();
}
document.addEventListener('DOMContentLoaded', init);

/* ---------------- Firma digital (canvas) ---------------- */
function initFirmaPad(canvas) {
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#241f31';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  var dibujando = false, ultimo = null, vacia = true;
  function pos(e) {
    var r = canvas.getBoundingClientRect();
    var t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * (canvas.width / r.width),
             y: (t.clientY - r.top) * (canvas.height / r.height) };
  }
  function inicio(e) { e.preventDefault(); dibujando = true; ultimo = pos(e); }
  function mover(e) {
    if (!dibujando) return;
    e.preventDefault();
    var p = pos(e);
    ctx.beginPath();
    ctx.moveTo(ultimo.x, ultimo.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ultimo = p;
    vacia = false;
  }
  function fin() { dibujando = false; }
  canvas.addEventListener('pointerdown', inicio);
  canvas.addEventListener('pointermove', mover);
  canvas.addEventListener('pointerup', fin);
  canvas.addEventListener('pointerleave', fin);
  canvas.addEventListener('touchstart', inicio, { passive: false });
  canvas.addEventListener('touchmove', mover, { passive: false });
  canvas.addEventListener('touchend', fin);
  return {
    limpiar: function () {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      vacia = true;
    },
    estaVacia: function () { return vacia; },
    toDataURL: function () { return canvas.toDataURL('image/png'); }
  };
}

/* ---------------- Fotos (captura + reducción) ---------------- */
function procesarFoto(input, previewEl, guardarEn) {
  var archivo = input.files && input.files[0];
  if (!archivo) return;
  var lector = new FileReader();
  lector.onload = function (ev) {
    var img = new Image();
    img.onload = function () {
      var max = 1200;
      var escala = Math.min(1, max / Math.max(img.width, img.height));
      var cv = document.createElement('canvas');
      cv.width = Math.round(img.width * escala);
      cv.height = Math.round(img.height * escala);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      var dataUrl = cv.toDataURL('image/jpeg', 0.8);
      state.wizard[guardarEn] = dataUrl;
      if (previewEl) previewEl.innerHTML = '<img src="' + dataUrl + '" alt="Foto">';
    };
    img.src = ev.target.result;
  };
  lector.readAsDataURL(archivo);
}

/* ---------------- Wizard: Nueva tanda ---------------- */
function nuevoWizard() {
  return {
    paso: 1,
    clienteId: null, clienteExistente: false, colorCliente: 'Verde',
    nombre: '', fechaNac: '', telefono: '', ocupacion: '', sexo: '',
    ineFrente: '', rostro: '', firmaTerminos: '', leyendaReverso: false,
    optometria: {},
    armazonModelo: '', armazonMarca: '', armazonMaterial: '', armazonDiseno: '',
    armazonPrecio: 0, lenteConcepto: '', lenteMaterial: '', lenteDiseno: '',
    lenteTratamiento: '', lentePrecio: 0, precioDefinido: 0, totalFinal: 0,
    numero: null, fechaInicio: hoyISO()
  };
}
function iniciarWizard() {
  state.wizard = nuevoWizard();
  state.firmaTerminosPad = initFirmaPad($('wFirmaTerminos'));
  // Limpiar el formulario.
  ['wNombre', 'wFechaNac', 'wTelefono', 'wOcupacion'].forEach(function (id) { $(id).value = ''; });
  $('wSexo').value = '';
  $('wBuscarCliente').value = '';
  $('wBuscarResultados').innerHTML = '';
  $('wClienteInfo').textContent = '';
  $('wIneFrente').value = ''; $('wRostro').value = '';
  $('wInePreview').innerHTML = ''; $('wRostroPreview').innerHTML = '';
  $('wLeyendaReverso').checked = false;
  $('wFechaInicio').value = hoyISO();
  $('wTotalFinal').value = '';
  $('wArmazonPrecio').value = ''; $('wLentePrecio').value = ''; $('wCostoInversion').value = '';
  $('wPrecioDefinido').value = '';
  $('wArmazonModelo').value = ''; $('wArmazonMarca').value = '';
  $('wLenteConcepto').value = '';
  $('wPlanPreview').innerHTML = ''; $('wEntregaPreview').innerHTML = '';
  $('wResumen').innerHTML = '';
  construirNumeroBotones();
  irPaso(1);
  show('wizard');
}
function irPaso(n) {
  state.wizard.paso = n;
  document.querySelectorAll('#wizardSteps li').forEach(function (li) {
    var p = Number(li.dataset.paso);
    li.classList.toggle('active', p === n);
    li.classList.toggle('done', p < n);
  });
  document.querySelectorAll('.wizard-paso').forEach(function (d) {
    d.hidden = Number(d.dataset.paso) !== n;
  });
  $('wBtnAtras').hidden = (n === 1);
  $('wBtnSiguiente').hidden = (n === 6);
  $('wBtnCrear').hidden = (n !== 6);
  // v2.0.4 (Detalle 6): en el paso 2 el cliente LEE la carta antes de
  // firmar; se renderiza con el nombre del paso 1.
  if (n === 2) renderCartaWizard();
  if (n === 6) renderResumenWizard();
  window.scrollTo(0, 0);
}
/* Vista previa de la carta en el paso 2 del wizard (Detalle 6): el
   cliente lee la carta + reglamento ANTES de firmar. Solo lleva el
   nombre (la tanda aún no existe); el número, la entrega y el plan se
   llenan al crear la tanda. */
function renderCartaWizard() {
  var w = state.wizard;
  var el = $('wCartaPreview');
  if (!el) return;
  el.innerHTML = cartaWizardHTML(w.nombre || '');
}
function wizardError(msg) {
  var el = $('wizardError');
  if (!msg) { el.hidden = true; el.textContent = ''; return; }
  el.hidden = false;
  el.textContent = msg;
}
function validarPaso(n) {
  var w = state.wizard;
  if (n === 1) {
    if (!$('wNombre').value.trim()) { wizardError('Falta el nombre del cliente.'); return false; }
  }
  // v2.0.4 (Detalle 6): paso 2 = carta + firma de aceptación. La carta
  // se LEE antes de firmar; la firma va debajo de la declaración.
  if (n === 2) {
    if (!w.clienteExistente) {
      if (!state.firmaTerminosPad || state.firmaTerminosPad.estaVacia()) { wizardError('Falta la firma digital de aceptación de términos.'); return false; }
      if (!$('wLeyendaReverso').checked) { wizardError('Confirma que el cliente mostró el reverso de su INE en físico para cotejar la firma.'); return false; }
    }
  }
  // v2.0.4 (Detalle 6): paso 3 = fotos (INE frente + rostro).
  if (n === 3) {
    if (!w.clienteExistente) {
      if (!w.ineFrente) { wizardError('Falta la foto del INE (frente).'); return false; }
      if (!w.rostro) { wizardError('Falta la foto del rostro.'); return false; }
    }
  }
  if (n === 5) {
    if (!w.totalFinal || num(w.totalFinal, 0) <= 0) { wizardError('Teclea el total final (precio de venta).'); return false; }
    if (!w.numero) { wizardError('Elige el número de tanda (semana de entrega).'); return false; }
    if (w.numero < numeroMinimo(w.colorCliente)) { wizardError('Por su color (' + w.colorCliente + ') el número mínimo es ' + numeroMinimo(w.colorCliente) + '.'); return false; }
    if (!$('wFechaInicio').value) { wizardError('Falta la fecha de inicio.'); return false; }
  }
  wizardError('');
  return true;
}
function leerPaso1() {
  var w = state.wizard;
  w.nombre = $('wNombre').value.trim();
  w.fechaNac = $('wFechaNac').value;
  w.telefono = $('wTelefono').value.trim();
  w.ocupacion = $('wOcupacion').value.trim();
  w.sexo = $('wSexo').value;
}
function leerPasoOpto() {
  var w = state.wizard;
  var usa = (document.querySelector('input[name="wUsaLentes"]:checked') || {}).value || '';
  w.optometria = {
    usaLentes: usa,
    lensEsfOD: $('wLensEsfOD').value, lensCilOD: $('wLensCilOD').value, lensEjeOD: $('wLensEjeOD').value,
    lensEsfOI: $('wLensEsfOI').value, lensCilOI: $('wLensCilOI').value, lensEjeOI: $('wLensEjeOI').value,
    lensTratamientos: $('wLensTratamientos').value, lensDiseno: $('wLensDiseno').value,
    lensAdd: $('wLensAdd').value, lensDnp: $('wLensDnp').value,
    motivo: $('wMotivo').value, antTipo: $('wAntTipo').value,
    antDiabetes: $('wAntDiabetes').checked, antHipertension: $('wAntHipertension').checked,
    antMigrana: $('wAntMigrana').checked,
    avSinOD: $('wAvSinOD').value, avSinOI: $('wAvSinOI').value, avSinAO: $('wAvSinAO').value,
    avConOD: $('wAvConOD').value, avConOI: $('wAvConOI').value, avConAO: $('wAvConAO').value,
    gradEsfOD: $('wGradEsfOD').value, gradCilOD: $('wGradCilOD').value, gradEjeOD: $('wGradEjeOD').value,
    gradEsfOI: $('wGradEsfOI').value, gradCilOI: $('wGradCilOI').value, gradEjeOI: $('wGradEjeOI').value,
    gradAdd: $('wGradAdd').value, dnp: $('wDnp').value,
    diagnostico: $('wDiagnostico').value, indicaciones: $('wIndicaciones').value,
    recomendacion: $('wRecomendacion').value
  };
}
function leerPasoProducto() {
  var w = state.wizard;
  w.armazonModelo = $('wArmazonModelo').value.trim();
  w.armazonMarca = $('wArmazonMarca').value.trim();
  w.armazonMaterial = $('wArmazonMaterial').value;
  w.armazonDiseno = $('wArmazonDiseno').value;
  w.armazonPrecio = num($('wArmazonPrecio').value, 0);
  w.lenteConcepto = $('wLenteConcepto').selectedOptions[0]
    ? $('wLenteConcepto').selectedOptions[0].textContent.split(' — ')[0] : '';
  if ($('wLenteConcepto').value === '') w.lenteConcepto = '';
  w.lenteMaterial = $('wLenteMaterial').value;
  w.lenteDiseno = $('wLenteDiseno').value;
  w.lenteTratamiento = $('wLenteTratamiento').value;
  w.lentePrecio = num($('wLentePrecio').value, 0);
  w.costoInversion = num($('wCostoInversion').value, 0);
  w.precioDefinido = redondear(w.armazonPrecio + w.lentePrecio);
  w.totalFinal = num($('wTotalFinal').value, 0);
  w.fechaInicio = $('wFechaInicio').value || hoyISO();
}

/* Botones de número (4-10). El mínimo lo marca el color del cliente. */
function construirNumeroBotones() {
  var w = state.wizard;
  var min = numeroMinimo(w.colorCliente);
  var cont = $('wNumeroBotones');
  cont.innerHTML = '';
  for (var n = NUMERO_MIN; n <= NUMERO_MAX; n++) {
    (function (num_) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn numero-btn' + (w.numero === num_ ? ' numero-sel' : '');
      b.textContent = 'Nº ' + num_;
      b.disabled = num_ < min;
      b.addEventListener('click', function () {
        w.numero = num_;
        construirNumeroBotones();
        actualizarEntregaPreview();
      });
      cont.appendChild(b);
    })(n);
  }
  $('wNumeroInfo').textContent = 'Color del cliente: ' + w.colorCliente + ' — puede tomar del ' + min + ' al 10. ' +
    (w.clienteExistente ? 'El número se asigna según su historial de pagos y el calendario; el cliente no lo elige.' :
      'Cliente nuevo: se hace un sondeo y análisis visual; si genera desconfianza, se le ofrece un 7 u 8.');
}
function actualizarPlanPreview() {
  var w = state.wizard;
  // Total definido = precio del armazón + precio del lente (se muestra
  // en cuanto se capturan los precios, aunque aún no se teclee el total).
  var definido = redondear(num($('wArmazonPrecio').value, 0) + num($('wLentePrecio').value, 0));
  $('wPrecioDefinido').value = definido > 0 ? money(definido) : '';
  var total = num($('wTotalFinal').value, 0);
  if (!total || total <= 0) { $('wPlanPreview').innerHTML = ''; return; }
  try {
    var plan = calcularPlan(total);
    $('wPlanPreview').innerHTML = '<strong>Plan de pagos:</strong> 9 pagos de ' + money(plan.semanal) +
      ' + último pago de ' + money(plan.ultimo) + ' = ' + money(total) + ' en 10 semanas.';
  } catch (e) { $('wPlanPreview').innerHTML = ''; }
}
function actualizarEntregaPreview() {
  var w = state.wizard;
  if (!w.numero || !$('wFechaInicio').value) { $('wEntregaPreview').innerHTML = ''; return; }
  var entrega = entregaEstimada($('wFechaInicio').value, w.numero);
  var limites = fechasLimite($('wFechaInicio').value);
  $('wEntregaPreview').innerHTML = '<strong>Entrega estimada:</strong> ' + fechaMX(entrega) +
    ' (viernes de la semana ' + w.numero + '). Primera fecha límite: lunes ' + fechaMX(limites[0]) +
    '; última: lunes ' + fechaMX(limites[9]) + '.';
}
function renderResumenWizard() {
  var w = state.wizard;
  leerPasoProducto();
  var plan = null;
  try { plan = calcularPlan(w.totalFinal); } catch (e) {}
  var entrega = w.numero ? entregaEstimada(w.fechaInicio, w.numero) : '—';
  var html = '<p><strong>Cliente:</strong> ' + esc(w.nombre) + (w.clienteExistente ? ' (existente, Nº ' + w.clienteId + ')' : ' (nuevo)') + ' · Color: ' + esc(w.colorCliente) + '</p>' +
    '<p><strong>Armazón:</strong> ' + esc(w.armazonModelo || '—') + ' · ' + esc(w.armazonMarca || '') + ' ' + esc(w.armazonMaterial || '') + ' ' + esc(w.armazonDiseno || '') + ' — ' + money(w.armazonPrecio) + '</p>' +
    '<p><strong>Lente:</strong> ' + esc(w.lenteConcepto || '—') + ' ' + esc(w.lenteMaterial || '') + ' ' + esc(w.lenteDiseno || '') + ' ' + esc(w.lenteTratamiento || '') + ' — ' + money(w.lentePrecio) + '</p>' +
    '<p><strong>Total definido:</strong> ' + money(w.precioDefinido) + ' · <strong>Total final (precio de venta):</strong> ' + money(w.totalFinal) + ' · <strong>Costo final de inversión:</strong> ' + money(w.costoInversion) + '</p>' +
    (plan ? '<p><strong>Plan:</strong> 9 pagos de ' + money(plan.semanal) + ' + último de ' + money(plan.ultimo) + '</p>' : '') +
    '<p><strong>Número:</strong> ' + (w.numero || '—') + ' · <strong>Inicio:</strong> ' + fechaMX(w.fechaInicio) + ' · <strong>Entrega estimada:</strong> ' + fechaMX(entrega) + '</p>' +
    '<p><strong>Graduación:</strong> O.D. ' + fmtGrad(w.optometria.gradEsfOD) + ' / ' + fmtGrad(w.optometria.gradCilOD) + ' x ' + (w.optometria.gradEjeOD || '—') +
    ' · O.I. ' + fmtGrad(w.optometria.gradEsfOI) + ' / ' + fmtGrad(w.optometria.gradCilOI) + ' x ' + (w.optometria.gradEjeOI || '—') + '</p>';
  $('wResumen').innerHTML = html;
}

/* Crear la tanda: cliente (si es nuevo) → optometría → tanda. */
function crearTanda() {
  var w = state.wizard;
  if (!validarPaso(5)) { irPaso(5); return; }
  leerPaso1(); leerPasoOpto(); leerPasoProducto();
  $('wBtnCrear').disabled = true;
  $('wBtnCrear').textContent = 'Creando…';
  var errEl = $('wCrearError');
  errEl.hidden = true;
  var promesa = Promise.resolve(w.clienteId);
  if (!w.clienteExistente) {
    promesa = api('crearCliente', {
      nombre: w.nombre, fechaNac: w.fechaNac, telefono: w.telefono,
      ocupacion: w.ocupacion, sexo: w.sexo,
      ineFrente: w.ineFrente, rostro: w.rostro,
      firmaTerminos: state.firmaTerminosPad ? state.firmaTerminosPad.toDataURL() : ''
    }).then(function (r) { return r.id; });
  }
  promesa.then(function (clienteId) {
    w.clienteId = clienteId;
    var opt = w.optometria;
    var tieneOpto = Object.keys(opt).some(function (k) { return opt[k] !== '' && opt[k] !== false; });
    if (!tieneOpto) return null;
    return api('guardarOptometria', Object.assign({ clienteId: clienteId }, opt));
  }).then(function () {
    return api('crearTanda', {
      clienteId: w.clienteId, numero: w.numero, total: w.totalFinal,
      fechaInicio: w.fechaInicio,
      armazonModelo: w.armazonModelo, armazonMarca: w.armazonMarca,
      armazonMaterial: w.armazonMaterial, armazonDiseno: w.armazonDiseno,
      armazonPrecio: w.armazonPrecio,
      lenteConcepto: w.lenteConcepto, lenteMaterial: w.lenteMaterial,
      lenteDiseno: w.lenteDiseno, lenteTratamiento: w.lenteTratamiento,
      lentePrecio: w.lentePrecio, costoInversion: w.costoInversion
    });
  }).then(function (r) {
    showOk('Tanda ' + r.id + ' creada. Nº ' + r.numero + ', entrega ' + fechaMX(r.entregaEstimada) + '.');
    $('wBtnCrear').disabled = false;
    $('wBtnCrear').textContent = 'Crear tanda';
    abrirReglamento(r.id);
  }).catch(function (e) {
    $('wBtnCrear').disabled = false;
    $('wBtnCrear').textContent = 'Crear tanda';
    errEl.hidden = false;
    errEl.textContent = 'No se pudo crear la tanda: ' + e.message;
  });
}

/* Buscar cliente existente en el paso 1 del wizard. */
var buscarTimer = null;
function buscarClienteWizard(q) {
  clearTimeout(buscarTimer);
  buscarTimer = setTimeout(function () {
    if (!q || q.trim().length < 2) { $('wBuscarResultados').innerHTML = ''; return; }
    api('buscarCliente', { q: q }).then(function (res) {
      var html = '';
      res.forEach(function (c) {
        html += '<div class="list-item"><div class="row"><strong>' + esc(c.nombre) + '</strong><span class="chip">Nº ' + c.id + '</span></div>' +
          '<small>' + esc(c.telefono || '') + '</small> ' +
          '<button class="btn btn-secondary" data-cliente="' + c.id + '">Seleccionar</button></div>';
      });
      $('wBuscarResultados').innerHTML = html || '<p class="hint">Sin coincidencias: es un cliente nuevo.</p>';
      document.querySelectorAll('#wBuscarResultados [data-cliente]').forEach(function (b) {
        b.addEventListener('click', function () { seleccionarClienteExistente(Number(b.dataset.cliente)); });
      });
    }).catch(function (e) { showError('Error al buscar: ' + e.message); });
  }, 300);
}
function seleccionarClienteExistente(clienteId) {
  api('getCliente', { id: clienteId }).then(function (d) {
    var w = state.wizard;
    var c = d.cliente;
    w.clienteId = c.id;
    w.clienteExistente = true;
    w.nombre = c.nombre; w.fechaNac = c.fechaNac || ''; w.telefono = c.telefono || '';
    w.ocupacion = c.ocupacion || ''; w.sexo = c.sexo || '';
    $('wNombre').value = c.nombre;
    $('wFechaNac').value = c.fechaNac || '';
    $('wTelefono').value = c.telefono || '';
    $('wOcupacion').value = c.ocupacion || '';
    $('wSexo').value = c.sexo || '';
    // Color según su última tanda cerrada (evaluación final).
    var color = 'Verde';
    (d.tandas || []).forEach(function (t) { if (t.colorFinal) color = t.colorFinal; });
    w.colorCliente = color;
    $('wClienteInfo').textContent = 'Cliente existente Nº ' + c.id + ' · Color: ' + color +
      ' · ' + (d.tandas || []).length + ' tanda(s) registrada(s). Ya tiene INE, rostro y firma en su expediente: los pasos 2 (carta y firma) y 3 (fotos) son opcionales.';
    $('wBuscarResultados').innerHTML = '';
    construirNumeroBotones();
    showOk('Cliente seleccionado: ' + c.nombre);
  }).catch(function (e) { showError('No se pudo cargar el cliente: ' + e.message); });
}

/* Cableado del wizard. */
function cablearWizard() {
  $('wBtnAtras').addEventListener('click', function () {
    if (state.wizard.paso === 2) leerPaso1();
    if (state.wizard.paso === 4) leerPasoOpto();
    if (state.wizard.paso === 5) leerPasoOpto();
    if (state.wizard.paso === 6) leerPasoProducto();
    irPaso(Math.max(1, state.wizard.paso - 1));
  });
  $('wBtnSiguiente').addEventListener('click', function () {
    var n = state.wizard.paso;
    if (n === 1) leerPaso1();
    if (n === 4) leerPasoOpto();
    if (n === 5) { leerPasoProducto(); actualizarPlanPreview(); actualizarEntregaPreview(); }
    if (!validarPaso(n)) return;
    irPaso(Math.min(6, n + 1));
  });
  $('wBtnCrear').addEventListener('click', crearTanda);
  $('wBuscarCliente').addEventListener('input', function () { buscarClienteWizard(this.value); });
  $('wIneFrente').addEventListener('change', function () { procesarFoto(this, $('wInePreview'), 'ineFrente'); });
  $('wRostro').addEventListener('change', function () { procesarFoto(this, $('wRostroPreview'), 'rostro'); });
  $('wFirmaLimpiar').addEventListener('click', function () { if (state.firmaTerminosPad) state.firmaTerminosPad.limpiar(); });
  $('wLeyendaReverso').addEventListener('change', function () { state.wizard.leyendaReverso = this.checked; });
  document.querySelectorAll('input[name="wUsaLentes"]').forEach(function (r) {
    r.addEventListener('change', function () { $('wLensometriaBox').hidden = (r.value !== 'Sí'); });
  });
  // Producto: catálogos y totales.
  $('wLenteConcepto').addEventListener('change', function () {
    var l = (state.catalogos.lentes || [])[Number(this.value)];
    if (!l) return;
    // El precio estimado del concepto es el COSTO estimado de la mica:
    // va a Costo final de inversión (donde se corrige al costo real),
    // NUNCA al precio del lente (mismo error que App 1 v2.3.14).
    $('wCostoInversion').value = l.precioEstimado || '';
    actualizarPlanPreview();
  });
  $('wArmazonPrecio').addEventListener('input', actualizarPlanPreview);
  $('wLentePrecio').addEventListener('input', actualizarPlanPreview);
  $('wTotalFinal').addEventListener('input', actualizarPlanPreview);
  $('wFechaInicio').addEventListener('change', actualizarEntregaPreview);
}
document.addEventListener('DOMContentLoaded', cablearWizard);

/* ---------------- Los 4 mensajes de WhatsApp (pre-escritos) ---------------- */
/* (1) Recordatorio: el día antes del lunes de vencimiento. */
function mensajeRecordatorio(p) {
  var nombre = p.clienteNombre || p.nombre || '';
  var semana = p.semana || p.proximaSemana || '';
  var monto = money(p.monto || p.proximoMonto || 0);
  var fecha = fechaMX(p.fechaLimite || p.proximaFechaLimite || '');
  return 'Hola ' + nombre + ', te recordamos que tu pago de la semana ' + semana +
    ' de Tanda Visual es de ' + monto + ' y vence el lunes ' + fecha +
    '. Puedes pagar en efectivo en la sucursal o por transferencia y reportarlo por este WhatsApp con tu comprobante.';
}
/* (2) Atraso: al día siguiente del vencimiento sin pago. Sin rangos internos ni fondo. */
function mensajeAtraso(a) {
  var nombre = a.clienteNombre || a.nombre || '';
  var color = a.color || 'Verde';
  return 'Hola ' + nombre + ', tu pago de Tanda Visual está pendiente y tu entrega se recorre hasta que te pongas al corriente. ' +
    'Tu color en el programa es ' + color + ' (lo puedes ver en tu tarjeta). ' +
    'Ponte al corriente esta semana para no perder tu fecha de entrega. Puedes pagar en efectivo en la sucursal o por transferencia y reportarlo por este WhatsApp con tu comprobante.';
}
/* (3) Ya puede recoger — APROBADO: se envía el VIERNES de la semana de entrega. */
function mensajeRecoger(r) {
  var nombre = r.clienteNombre || r.nombre || '';
  return 'Hola ' + nombre + ', ¡tus lentes ya están listos! Te invitamos a recogerlos hoy viernes en ' +
    NEGOCIO.nombre + ', ' + NEGOCIO.direccion + ', y a realizar tu pago de esta semana. Te esperamos de 3:00 a 9:00 pm.';
}
/* (4) Tarjeta: al registrar el pago; mensaje corto + imagen de la tarjeta. */
function mensajeTarjeta(t) {
  var nombre = (t.cliente && t.cliente.nombre) || t.clienteNombre || '';
  var pagados = (t.tanda && t.tanda.pagados !== undefined) ? t.tanda.pagados : (t.pagados || 0);
  return 'Hola ' + nombre + ', te compartimos tu tarjeta de Tanda Visual con tu pago registrado (' + pagados + ' de 10 pagos). ¡Gracias por tu pago!';
}

/* ---------------- Buscar cliente ---------------- */
var buscarTimer2 = null;
function cablearBuscar() {
  $('buscarInput').addEventListener('input', function () {
    var q = this.value;
    clearTimeout(buscarTimer2);
    buscarTimer2 = setTimeout(function () {
      if (!q || q.trim().length < 2) { $('buscarResultados').innerHTML = ''; $('buscarFicha').innerHTML = ''; return; }
      api('buscarCliente', { q: q }).then(function (res) {
        var html = '';
        res.forEach(function (c) {
          html += '<div class="list-item"><div class="row"><strong>' + esc(c.nombre) + '</strong><span class="chip">Nº ' + c.id + '</span></div>' +
            '<small>' + esc(c.telefono || '') + '</small> ' +
            '<button class="btn btn-secondary" data-cliente="' + c.id + '">Ver expediente</button></div>';
        });
        $('buscarResultados').innerHTML = html || '<p class="hint">Sin coincidencias.</p>';
        document.querySelectorAll('#buscarResultados [data-cliente]').forEach(function (b) {
          b.addEventListener('click', function () { mostrarExpediente(Number(b.dataset.cliente)); });
        });
      }).catch(function (e) { showError('Error al buscar: ' + e.message); });
    }, 300);
  });
}
function mostrarExpediente(clienteId) {
  api('getCliente', { id: clienteId }).then(function (d) {
    var c = d.cliente;
    var html = '<div class="card"><h3>' + esc(c.nombre) + ' <span class="chip">Nº ' + c.id + '</span></h3>' +
      '<p>Teléfono: ' + esc(c.telefono || '—') + ' · Edad: ' + esc(c.edad || '—') + ' · ' + esc(c.ocupacion || '') + '</p>';
    // v2.0.4 (Detalle 4): las imágenes de verdad, como miniaturas que
    // se tocan para verlas en grande (INE frente, rostro, firma de
    // aceptación). La firma de entrega vive en cada tanda (ficha).
    html += '<h3>Expediente — imágenes</h3><div class="evid-grid">' +
      '<div class="evid-item"><h4>INE (frente)</h4>' + evidImgHTML(c.ineFrenteUrl, 'INE (frente)') + '</div>' +
      '<div class="evid-item"><h4>Rostro</h4>' + evidImgHTML(c.rostroUrl, 'Rostro') + '</div>' +
      '<div class="evid-item"><h4>Firma de aceptación</h4>' + evidImgHTML(c.firmaTerminosUrl, 'Firma de aceptación de términos') + '<p class="hint">“' + esc(DECLARACION_ACEPTACION) + '”</p></div>' +
      '</div>';
    (d.tandas || []).forEach(function (t) {
      html += '<div class="list-item"><div class="row"><strong>' + esc(t.id) + ' · Nº ' + t.numero + '</strong>' + colorChip(t.color) +
        '<span class="chip">' + esc(t.estado) + '</span></div>' +
        '<small>Total ' + money(t.total) + ' · ' + t.pagados + ' de 10 pagos · entrega ' + fechaMX(t.entregaEstimada) + '</small> ' +
        progresoBar(t.pagados) +
        '<div class="row"><button class="btn btn-secondary" data-tanda="' + esc(t.id) + '">Ver tanda</button></div></div>';
    });
    html += '</div>';
    $('buscarFicha').innerHTML = html;
    document.querySelectorAll('#buscarFicha [data-tanda]').forEach(function (b) {
      b.addEventListener('click', function () { abrirFicha(b.dataset.tanda); });
    });
  }).catch(function (e) { showError('No se pudo cargar el expediente: ' + e.message); });
}

/* ---------------- Tandas (lista) ---------------- */
function cargarTandas() {
  var q = $('tandasBuscar').value || '';
  var estado = $('tandasEstado').value || '';
  return api('getTandas', { q: q, estado: estado }).then(function (d) {
    state.tandasCache = d.tandas || [];
    var html = '';
    state.tandasCache.forEach(function (t) {
      html += '<div class="list-item"><div class="row"><strong>' + esc(t.clienteNombre) + '</strong>' + colorChip(t.color) +
        '<span class="chip">' + esc(t.estado) + '</span></div>' +
        '<small>' + esc(t.id) + ' · Nº ' + t.numero + ' · Total ' + money(t.total) + ' · ' + t.pagados + ' de 10 pagos · entrega ' + fechaMX(t.entregaEstimada) + '</small>' +
        progresoBar(t.pagados) +
        '<div class="row"><button class="btn btn-secondary" data-tanda="' + esc(t.id) + '">Ver tanda</button></div></div>';
    });
    $('tandasLista').innerHTML = html || '<p class="hint">No hay tandas con ese filtro.</p>';
    document.querySelectorAll('#tandasLista [data-tanda]').forEach(function (b) {
      b.addEventListener('click', function () { abrirFicha(b.dataset.tanda); });
    });
  }).catch(function (e) { showError('No se pudieron cargar las tandas: ' + e.message); });
}
function cablearTandas() {
  $('tandasBuscar').addEventListener('input', function () { cargarTandas(); });
  $('tandasEstado').addEventListener('change', function () { cargarTandas(); });
}

/* ---------------- Ficha de tanda ---------------- */
function abrirFicha(tandaId) {
  api('getTanda', { id: tandaId }).then(function (d) {
    state.currentTanda = d;
    state.currentCliente = d.cliente;
    $('fichaTitulo').textContent = 'Tanda ' + d.id + ' · Nº ' + d.numero;
    var t = d;
    var html = '<div class="card"><h3>' + esc(t.cliente.nombre) + ' <span class="chip">Nº ' + t.cliente.id + '</span></h3>' +
      '<p>Teléfono: ' + esc(t.cliente.telefono || '—') + '</p>' +
      '<p><strong>Producto:</strong> ' + esc(t.armazonModelo || '—') + ' ' + esc(t.armazonMarca || '') + ' ' + esc(t.armazonMaterial || '') + ' ' + esc(t.armazonDiseno || '') + ' (' + money(t.armazonPrecio) + ') + ' +
      esc(t.lenteConcepto || '—') + ' ' + esc(t.lenteMaterial || '') + ' ' + esc(t.lenteDiseno || '') + ' ' + esc(t.lenteTratamiento || '') + ' (' + money(t.lentePrecio) + ')</p>' +
      '<p><strong>Total definido:</strong> ' + money(t.precioDefinido) + ' · <strong>Total final:</strong> ' + money(t.total) + '</p>' +
      '<p><strong>Plan:</strong> 9 pagos de ' + money(t.pagoSemanal) + ' + último de ' + money(t.ultimoPago) + '</p>' +
      '<p><strong>Inicio:</strong> ' + fechaMX(t.fechaInicio) + ' · <strong>Entrega estimada:</strong> ' + fechaMX(t.entregaEstimada) +
      (t.fechaEntrega ? ' · <strong>Entregada:</strong> ' + fechaMX(t.fechaEntrega) : '') + '</p>' +
      '<p><strong>Color actual:</strong> ' + colorChip(t.color) + ' <small>' + (COLORES[t.color] || {}).desc + '</small>' +
      (t.colorFinal ? ' · <strong>Color final:</strong> ' + colorChip(t.colorFinal) : '') + '</p>' +
      progresoBar(t.pagados) +
      '<h3>Semanas</h3><table><tr><th>Sem.</th><th>Límite</th><th>Monto</th><th>Estado</th><th>Pago</th></tr>';
    (t.semanas || []).forEach(function (s) {
      html += '<tr><td>' + s.semana + '</td><td>' + fechaMX(s.fechaLimite) + '</td><td>' + money(s.monto) + '</td>' +
        '<td>' + esc(s.estadoMuestra || s.estado) + '</td><td>' + (s.fechaPago ? fechaMX(s.fechaPago) + ' · ' + esc(s.metodo || '') : '—') + '</td></tr>';
    });
    html += '</table>';
    if (t.optometria) {
      var o = t.optometria;
      html += '<h3>Graduación</h3><p>O.D. ' + fmtGrad(o.gradEsfOD) + ' / ' + fmtGrad(o.gradCilOD) + ' x ' + esc(o.gradEjeOD || '—') +
        ' · O.I. ' + fmtGrad(o.gradEsfOI) + ' / ' + fmtGrad(o.gradCilOI) + ' x ' + esc(o.gradEjeOI || '—') +
        ' · Add ' + fmtGrad(o.gradAdd) + ' · DNP ' + esc(o.dnp || '—') + '</p>';
    } else {
      html += '<p class="hint">Sin optometría registrada: el cliente debe dar su receta vigente o hacerse el examen de la vista antes de la entrega.</p>';
    }
    // v2.0.4 (Detalle 4): evidencia — las 4 imágenes del expediente.
    html += '<h3>Expediente — evidencia</h3><div class="evid-grid">' +
      '<div class="evid-item"><h4>INE (frente)</h4>' + evidImgHTML(t.cliente.ineFrenteUrl, 'INE (frente)') + '</div>' +
      '<div class="evid-item"><h4>Rostro</h4>' + evidImgHTML(t.cliente.rostroUrl, 'Rostro') + '</div>' +
      '<div class="evid-item"><h4>Firma de aceptación</h4>' + evidImgHTML(t.cliente.firmaTerminosUrl, 'Firma de aceptación de términos') + '<p class="hint">“' + esc(DECLARACION_ACEPTACION) + '”</p></div>' +
      '<div class="evid-item"><h4>Firma de entrega</h4>' + evidImgHTML(t.firmaEntregaUrl, 'Firma de entrega') + '<p class="hint">“' + esc(DECLARACION_ENTREGA) + '”</p></div>' +
      '</div>' +
      '<div class="row"><button class="btn btn-secondary" id="btnFichaEvidencia" type="button">Hoja de evidencia</button></div>';
    html += '</div>';
    $('fichaContenido').innerHTML = html;
    var btnEv = $('btnFichaEvidencia');
    if (btnEv) btnEv.addEventListener('click', function () { abrirEvidencia(t.id); });
    // Evaluación final (solo si los 10 pagos están hechos).
    var ev = $('fichaEvaluar');
    if (t.pagados >= 10 && !t.colorFinal) {
      ev.innerHTML = '<h3>Evaluación final del color</h3><p class="hint">Los 10 pagos están hechos. Evalúa su comportamiento y confirma el color final: define el número mínimo de su siguiente tanda.</p>' +
        '<div class="grid2"><select id="evaluarColor"><option value="">— Elige el color final —</option><option>Verde</option><option>Amarillo</option><option>Rojo</option></select>' +
        '<button class="btn btn-primary" id="btnEvaluarConfirmar">Confirmar color final</button></div>' +
        '<div id="evaluarSugerencia"></div>';
      api('evaluarTanda', { id: t.id }).then(function (e) {
        $('evaluarSugerencia').innerHTML = '<p class="hint">Sugerencia de la app: <strong>' + e.sugerencia + '</strong> (atrasos: ' + e.tardios +
          ' · a tiempo: ' + e.pagosATiempo + ' · llegó a rojo: ' + e.huboRojo + '). Tú confirmas el color final.</p>';
      }).catch(function () {});
      $('btnEvaluarConfirmar').addEventListener('click', function () {
        var color = $('evaluarColor').value;
        if (!color) { showError('Elige el color final.'); return; }
        api('confirmarColorFinal', { id: t.id, colorFinal: color }).then(function () {
          showOk('Color final confirmado: ' + color + '. La tanda queda Completada.');
          abrirFicha(t.id);
        }).catch(function (e) { showError('No se pudo confirmar: ' + e.message); });
      });
    } else if (t.colorFinal) {
      ev.innerHTML = '<p class="hint">Color final: <strong>' + esc(t.colorFinal) + '</strong>. En su siguiente tanda su número mínimo será el ' + numeroMinimo(t.colorFinal) + '.</p>';
    } else {
      ev.innerHTML = '';
    }
    show('ficha');
  }).catch(function (e) { showError('No se pudo abrir la tanda: ' + e.message); });
}
function cablearFicha() {
  $('btnFichaPago').addEventListener('click', function () { if (state.currentTanda) abrirPago(state.currentTanda.id); });
  $('btnFichaTarjeta').addEventListener('click', function () { if (state.currentTanda) abrirTarjeta(state.currentTanda.id); });
  $('btnFichaOrden').addEventListener('click', function () { if (state.currentTanda) abrirOrden(state.currentTanda.id); });
  $('btnFichaReglamento').addEventListener('click', function () { if (state.currentTanda) abrirReglamento(state.currentTanda.id); });
  $('btnFichaEntrega').addEventListener('click', function () { if (state.currentTanda) abrirEntrega(state.currentTanda.id); });
  $('btnFichaVolver').addEventListener('click', function () { show('tandas'); cargarTandas(); });
  $('btnMsgRecordatorio').addEventListener('click', function () {
    var t = state.currentTanda; if (!t) return;
    window.open(waLink(t.cliente.telefono, mensajeRecordatorio({
      clienteNombre: t.cliente.nombre, semana: t.proximaSemana,
      monto: t.proximoMonto, fechaLimite: t.proximaFechaLimite })), '_blank');
  });
  $('btnMsgAtraso').addEventListener('click', function () {
    var t = state.currentTanda; if (!t) return;
    window.open(waLink(t.cliente.telefono, mensajeAtraso({
      clienteNombre: t.cliente.nombre, color: t.color })), '_blank');
  });
  $('btnMsgRecoger').addEventListener('click', function () {
    var t = state.currentTanda; if (!t) return;
    window.open(waLink(t.cliente.telefono, mensajeRecoger({
      clienteNombre: t.cliente.nombre })), '_blank');
  });
  $('btnMsgTarjeta').addEventListener('click', function () {
    var t = state.currentTanda; if (!t) return;
    abrirTarjeta(t.id);
  });
}

/* ---------------- Registrar pago ---------------- */
function abrirPago(tandaId, semana) {
  api('getTandas', { estado: 'Activa' }).then(function (d) {
    var sel = $('pagoTanda');
    sel.innerHTML = '';
    (d.tandas || []).forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.id;
      o.textContent = t.clienteNombre + ' · ' + t.id + ' · Nº ' + t.numero;
      sel.appendChild(o);
    });
    if (tandaId) sel.value = tandaId;
    $('pagoResultado').innerHTML = '';
    $('pagoError').hidden = true;
    actualizarPagoInfo(semana);
    show('pago');
  }).catch(function (e) { showError('No se pudieron cargar las tandas activas: ' + e.message); });
}
function actualizarPagoInfo(semanaPre) {
  var tandaId = $('pagoTanda').value;
  if (!tandaId) { $('pagoInfo').innerHTML = ''; $('pagoSemana').innerHTML = ''; return; }
  api('getTanda', { id: tandaId }).then(function (t) {
    state.currentTanda = t;
    var pendientes = (t.semanas || []).filter(function (s) { return String(s.estado) === 'Pendiente'; });
    $('pagoInfo').innerHTML = '<p><strong>' + esc(t.cliente.nombre) + '</strong> ' + colorChip(t.color) +
      ' · ' + t.pagados + ' de 10 pagos · entrega ' + fechaMX(t.entregaEstimada) + '</p>';
    var sel = $('pagoSemana');
    sel.innerHTML = '';
    pendientes.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.semana;
      o.textContent = 'Semana ' + s.semana + ' · límite lunes ' + fechaMX(s.fechaLimite) + ' · ' + money(s.monto);
      sel.appendChild(o);
    });
    if (semanaPre) sel.value = String(semanaPre);
    if (!pendientes.length) $('pagoInfo').innerHTML += '<p class="hint">Esta tanda ya tiene los 10 pagos.</p>';
  }).catch(function (e) { showError('No se pudo cargar la tanda: ' + e.message); });
}
function cablearPago() {
  $('pagoTanda').addEventListener('change', function () { actualizarPagoInfo(); });
  document.querySelectorAll('input[name="pagoMetodo"]').forEach(function (r) {
    r.addEventListener('change', function () {
      $('pagoComprobanteBox').hidden = (r.value !== 'Transferencia');
    });
  });
  $('pagoComprobante').addEventListener('change', function () {
    var archivo = this.files && this.files[0];
    if (!archivo) return;
    var lector = new FileReader();
    lector.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var max = 1200;
        var escala = Math.min(1, max / Math.max(img.width, img.height));
        var cv = document.createElement('canvas');
        cv.width = Math.round(img.width * escala);
        cv.height = Math.round(img.height * escala);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        var dataUrl = cv.toDataURL('image/jpeg', 0.8);
        state.pagoComprobante = dataUrl;
        $('pagoComprobantePreview').innerHTML = '<img src="' + dataUrl + '" alt="Comprobante">';
      };
      img.src = ev.target.result;
    };
    lector.readAsDataURL(archivo);
  });
  $('btnPagoGuardar').addEventListener('click', function () {
    var tandaId = $('pagoTanda').value;
    var semana = $('pagoSemana').value;
    var metodo = (document.querySelector('input[name="pagoMetodo"]:checked') || {}).value || 'Efectivo';
    var errEl = $('pagoError');
    errEl.hidden = true;
    if (!tandaId || !semana) { errEl.hidden = false; errEl.textContent = 'Elige la tanda y la semana.'; return; }
    if (metodo === 'Transferencia' && !state.pagoComprobante) {
      errEl.hidden = false; errEl.textContent = 'En transferencia el comprobante es obligatorio.'; return;
    }
    $('btnPagoGuardar').disabled = true;
    $('btnPagoGuardar').textContent = 'Guardando…';
    api('registrarPago', {
      tandaId: tandaId, semana: Number(semana), metodo: metodo,
      comprobante: metodo === 'Transferencia' ? state.pagoComprobante : ''
    }).then(function (r) {
      $('btnPagoGuardar').disabled = false;
      $('btnPagoGuardar').textContent = 'Guardar pago';
      state.pagoComprobante = '';
      $('pagoComprobante').value = '';
      $('pagoComprobantePreview').innerHTML = '';
      var estadoTxt = r.estado === 'Tarde' ? ' (Tarde: se pagó después de su lunes)' : ' (a tiempo)';
      $('pagoResultado').innerHTML = '<div class="success">Pago registrado: semana ' + r.semana + ' · ' + money(r.monto) + ' · ' + r.metodo +
        ' · ' + fechaMX(r.fecha) + estadoTxt + ' · Color actual: ' + r.color + '.</div>' +
        '<div class="wizard-nav"><button class="btn btn-primary" id="btnPagoVerTarjeta">Ver tarjeta actualizada</button></div>';
      $('btnPagoVerTarjeta').addEventListener('click', function () { abrirTarjeta(tandaId); });
      showOk('Pago guardado. La tarjeta es el comprobante del cliente: compártela por WhatsApp.');
      actualizarPagoInfo();
    }).catch(function (e) {
      $('btnPagoGuardar').disabled = false;
      $('btnPagoGuardar').textContent = 'Guardar pago';
      errEl.hidden = false;
      errEl.textContent = 'No se pudo guardar el pago: ' + e.message;
    });
  });
}

/* ---------------- Entrega ---------------- */
function abrirEntrega(tandaId) {
  api('getTandas', { estado: 'Activa' }).then(function (d) {
    var sel = $('entregaTanda');
    sel.innerHTML = '';
    (d.tandas || []).forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.id;
      o.textContent = t.clienteNombre + ' · ' + t.id + ' · Nº ' + t.numero + ' · entrega ' + fechaMX(t.entregaEstimada);
      sel.appendChild(o);
    });
    if (tandaId) sel.value = tandaId;
    state.entregaFirmaPad = initFirmaPad($('entregaFirma'));
    $('entregaResultado').innerHTML = '';
    $('entregaError').hidden = true;
    actualizarEntregaInfo();
    show('entrega');
  }).catch(function (e) { showError('No se pudieron cargar las tandas activas: ' + e.message); });
}
function actualizarEntregaInfo() {
  var tandaId = $('entregaTanda').value;
  if (!tandaId) { $('entregaInfo').innerHTML = ''; return; }
  api('getTanda', { id: tandaId }).then(function (t) {
    state.currentTanda = t;
    var btnGuardar = $('btnEntregaGuardar');
    var aviso = '';
    // v2.0.4 (Detalle 5): la entrega se BLOQUEA sin optometría. Sin
    // graduación no se pueden elaborar los lentes. El botón queda
    // deshabilitado y se ofrece capturar la optometría aquí mismo.
    if (!t.optometria) {
      aviso = '<p class="error">Sin optometría: el cliente debe dar su receta vigente o hacerse el examen antes de la entrega. La entrega está bloqueada hasta capturar la graduación.</p>' +
        '<div class="wizard-nav"><button class="btn btn-primary" id="btnEntOptCapturar" type="button">Capturar optometría</button></div>';
      if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = 'Confirmar entrega (bloqueada: sin optometría)'; }
    } else {
      if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = 'Confirmar entrega'; }
    }
    if (t.vencidos >= 1) aviso += '<p class="error">Tiene ' + t.vencidos + ' pago(s) vencido(s): la entrega se recorre hasta ponerse al corriente.</p>';
    $('entregaInfo').innerHTML = '<p><strong>' + esc(t.cliente.nombre) + '</strong> ' + colorChip(t.color) +
      ' · ' + t.pagados + ' de 10 pagos · entrega estimada ' + fechaMX(t.entregaEstimada) + '</p>' + aviso;
    var btnCap = $('btnEntOptCapturar');
    if (btnCap) btnCap.addEventListener('click', function () {
      $('entregaOptometriaBox').hidden = false;
      $('entregaOptometriaBox').scrollIntoView();
    });
  }).catch(function (e) { showError('No se pudo cargar la tanda: ' + e.message); });
}
/* Llena los desplegables de graduación del formulario de optometría
   de la vista de entrega (mismos rangos que el wizard). */
function llenarEntregaOptometria() {
  var esf = listasDe('Esfera'), cil = listasDe('Cilindro'), eje = listasDe('Eje'), add = listasDe('Add');
  var fmt = function (v) { return fmtGrad(v); };
  [['entOptEsfOD', esf], ['entOptEsfOI', esf]].forEach(function (x) { fillSelect($(x[0]), x[1], true, fmt); });
  [['entOptCilOD', cil], ['entOptCilOI', cil]].forEach(function (x) { fillSelect($(x[0]), x[1], true, fmt); });
  [['entOptEjeOD', eje], ['entOptEjeOI', eje]].forEach(function (x) { fillSelect($(x[0]), x[1], true); });
  fillSelect($('entOptAdd'), add, true, fmt);
}
function cablearEntrega() {
  $('entregaTanda').addEventListener('change', actualizarEntregaInfo);
  $('entregaFirmaLimpiar').addEventListener('click', function () { if (state.entregaFirmaPad) state.entregaFirmaPad.limpiar(); });
  llenarEntregaOptometria();
  // v2.0.4 (Detalle 5): capturar la optometría desde la vista de
  // entrega (graduación), para desbloquearla. Se guarda con el
  // tandaId, así que queda ligada a esta tanda.
  $('btnEntOptGuardar').addEventListener('click', function () {
    var t = state.currentTanda;
    var errEl = $('entOptError');
    errEl.hidden = true;
    if (!t || !t.cliente) { errEl.hidden = false; errEl.textContent = 'Elige la tanda.'; return; }
    var grad = {
      gradEsfOD: $('entOptEsfOD').value, gradCilOD: $('entOptCilOD').value, gradEjeOD: $('entOptEjeOD').value,
      gradEsfOI: $('entOptEsfOI').value, gradCilOI: $('entOptCilOI').value, gradEjeOI: $('entOptEjeOI').value,
      gradAdd: $('entOptAdd').value, dnp: $('entOptDnp').value
    };
    if (!grad.gradEsfOD && !grad.gradCilOD && !grad.gradEsfOI && !grad.gradCilOI && !grad.gradAdd) {
      errEl.hidden = false; errEl.textContent = 'Captura al menos la graduación de un ojo.'; return;
    }
    $('btnEntOptGuardar').disabled = true;
    $('btnEntOptGuardar').textContent = 'Guardando…';
    api('guardarOptometria', Object.assign({ clienteId: t.cliente.id, tandaId: t.id }, grad)).then(function () {
      $('btnEntOptGuardar').disabled = false;
      $('btnEntOptGuardar').textContent = 'Guardar optometría';
      $('entregaOptometriaBox').hidden = true;
      showOk('Optometría guardada. La entrega quedó desbloqueada.');
      actualizarEntregaInfo();
    }).catch(function (e) {
      $('btnEntOptGuardar').disabled = false;
      $('btnEntOptGuardar').textContent = 'Guardar optometría';
      errEl.hidden = false;
      errEl.textContent = 'No se pudo guardar la optometría: ' + e.message;
    });
  });
  $('btnEntregaGuardar').addEventListener('click', function () {
    var tandaId = $('entregaTanda').value;
    var errEl = $('entregaError');
    errEl.hidden = true;
    if (!tandaId) { errEl.hidden = false; errEl.textContent = 'Elige la tanda.'; return; }
    if (!state.entregaFirmaPad || state.entregaFirmaPad.estaVacia()) {
      errEl.hidden = false; errEl.textContent = 'Falta la firma digital de recepción.'; return;
    }
    $('btnEntregaGuardar').disabled = true;
    $('btnEntregaGuardar').textContent = 'Guardando…';
    api('registrarEntrega', { tandaId: tandaId, firmaEntrega: state.entregaFirmaPad.toDataURL() }).then(function (r) {
      $('btnEntregaGuardar').disabled = false;
      $('btnEntregaGuardar').textContent = 'Confirmar entrega';
      $('entregaResultado').innerHTML = '<div class="success">Entrega registrada el ' + fechaMX(r.fechaEntrega) + '. El cliente firmó de recibido.</div>';
      showOk('Lentes entregados. Recuerda: al recoger, el cliente hace su pago de la semana.');
      actualizarEntregaInfo();
    }).catch(function (e) {
      $('btnEntregaGuardar').disabled = false;
      $('btnEntregaGuardar').textContent = 'Confirmar entrega';
      errEl.hidden = false;
      errEl.textContent = 'No se pudo registrar la entrega: ' + e.message;
    });
  });
}
document.addEventListener('DOMContentLoaded', function () {
  cablearBuscar(); cablearTandas(); cablearFicha(); cablearPago(); cablearEntrega();
});

/* ---------------- Documentos: reglamento y tarjeta ---------------- */
var PAGE_SIZES = { reglamento: 'letter', tarjeta: 'letter', orden: 'letter', evidencia: 'letter' };
function aplicarTamanoPagina(kind) {
  var st = document.getElementById('pageSizeStyle');
  if (!st) {
    st = document.createElement('style');
    st.id = 'pageSizeStyle';
    document.head.appendChild(st);
  }
  var size = PAGE_SIZES[kind] || 'letter';
  var margin = kind === 'tarjeta' ? '5mm' : '8mm';
  st.textContent = '@page { size: ' + size + '; margin: ' + margin + '; }';
}
function docHead(titulo) {
  return '<div class="doc-head"><img src="logo.png" alt="Boutique de Lentes Yael">' +
    '<div><div class="doc-title">' + esc(titulo) + '</div>' +
    '<div class="addr">' + esc(NEGOCIO.nombre) + ' · ' + esc(NEGOCIO.programa) + '<br>' +
    esc(NEGOCIO.direccion) + '<br>Tel. ' + esc(NEGOCIO.telefonos) + '</div></div></div>';
}
/* ---------------- Carta de bienvenida (v2.0.4, Detalle 1, 6 y 7) ----------
   Diseño IGUAL O SIMILAR al papel original que envió Alfredo (foto
   TANDA_20260521_020... / PDF TANDA_20260520_192543): ondas
   turquesa→lila, encabezado Yael + "TANDA VISUAL / Renueva tu visión
   de forma accesible y organizada", tira de contacto, título "CARTA
   DE BIENVENIDA", checklist, "Atentamente, Boutique de Lentes Yael",
   pie "Programa seguro, transparente y respaldado por Ópticas Luna".
   El texto es el del papel CON la corrección de Alfredo (2026-11-24
   15:40): "sistema de compra a plazos que te permite estrenar tus
   lentes antes de liquidarlos, porque confiamos en ti y sabemos las
   dificultades que puedes enfrentar sin ellos" — REEMPLAZA el
   "sistema de compra colaborativa" del papel, que contradecía la
   regla de que NO es fondo común (venta a plazos personal).
   El reglamento va COMPLETO en el mismo documento, con las garantías
   MODIFICADAS (30 días adaptación, 6 meses armazón, 6 meses
   tratamiento), NO las del papel (1 año). La tarjeta de EJEMPLO usa
   SOLO datos ficticios (EJEMPLO_TARJETA): NUNCA datos reales del
   cliente. El archivo enviado NO lleva fotos (sin INE ni rostro);
   la firma de aceptación SÍ va incrustada (Detalle 6).
   cartaHTML(datos) la usan dos vistas: el documento completo
   (docReglamentoHTML, con número/entrega/total/firma) y la vista
   previa del paso 2 del wizard (cartaWizardHTML, solo el nombre: el
   cliente LEE la carta ANTES de firmar). */
function cartaHTML(datos) {
  var nombre = esc(datos.nombre || '');
  var tieneTanda = !!datos.numero;
  var asignacion = tieneTanda
    ? 'Te informamos que se te ha asignado el número <strong>' + esc(String(datos.numero)) + '</strong>. Adjuntamos a este mensaje la documentación necesaria, que incluye:'
    : 'Al registrarte se te asignará un número de tanda, que determinará tu semana de entrega. Adjuntamos a este mensaje la documentación necesaria, que incluye:';
  var html = '<div class="doc doc-reglamento doc-carta">' +
    '<div class="carta-onda carta-onda-top" aria-hidden="true"></div>' +
    '<div class="carta-head"><img src="logo.png" alt="Boutique de Lentes Yael">' +
    '<div class="carta-head-txt"><div class="carta-programa"><span class="carta-programa-t">TANDA</span> <span class="carta-programa-v">VISUAL</span></div>' +
    '<div class="carta-programa-sub">Renueva tu visión de forma accesible y organizada.</div></div></div>' +
    '<div class="carta-contacto"><span>55 9719 1674<br>56 1158 6976</span><span>contacto@opticasluna.com</span><span>@Opticasluna14</span><span>Calle 4 Nº 342, Agrícola Pantitlán, Iztacalco, CDMX, 08100</span></div>' +
    '<h2 class="carta-titulo">CARTA DE BIENVENIDA</h2>' +
    '<p>Estimado(a) <strong>' + nombre + '</strong>:</p>' +
    '<p>¡Bienvenido(a) a Tanda Visual! Este es un sistema de compra a plazos que te permite estrenar tus lentes antes de liquidarlos, porque confiamos en ti y sabemos las dificultades que puedes enfrentar sin ellos.</p>' +
    '<p>' + asignacion + '</p>';
  if (tieneTanda) {
    html += '<div class="carta-datos"><p><strong>Nº de tanda:</strong> ' + esc(String(datos.numero)) + ' · <strong>Entrega estimada:</strong> ' + fechaMX(datos.entregaEstimada) + '</p>' +
      '<p><strong>Total:</strong> ' + money(datos.total) + ' · <strong>Plan:</strong> 9 pagos semanales de ' + money(datos.pagoSemanal) + ' + último pago de ' + money(datos.ultimoPago) + '</p></div>';
  } else {
    html += '<p class="hint">Tu número de tanda, tu entrega estimada y tu plan de pagos se llenarán al crear tu tanda.</p>';
  }
  html += '<ul class="carta-checklist">' +
    '<li>Calendario de pagos y entregas.</li>' +
    '<li>Datos bancarios y procedimiento para reportar tus depósitos.</li>' +
    '<li>Reglamento y términos y condiciones.</li></ul>' +
    '<p>Te invitamos a leer detenidamente cada documento, ya que contienen información importante sobre fechas de pago, funcionamiento de la tanda y otros detalles clave.</p>' +
    '<p>Si en algún momento tienes dudas o necesitas aclarar algún punto, no dudes en contactarnos. Contamos con los canales de comunicación necesarios para brindarte la mejor atención.</p>' +
    '<p>Agradecemos tu confianza en Tanda Visual. Estamos seguros de que será una gran experiencia.</p>' +
    '<p>Atentamente,</p>' +
    '<p class="carta-firma-nombre">Boutique de Lentes Yael</p>' +
    '<div class="carta-pie"><strong>Programa seguro, transparente y respaldado por Ópticas Luna.</strong>' +
    '<div class="carta-pie-items"><span>Calidad en cada lente</span><span>Garantía que te respalda</span><span>Atención que te acompaña</span></div></div>' +
    '<div class="carta-onda carta-onda-bottom" aria-hidden="true"></div>' +
    '<h2 class="carta-titulo">REGLAMENTO</h2>' +
    '<h4>1. GARANTÍA DEL PRODUCTO</h4><ul>' +
    '<li><strong>Graduación:</strong> ' + GARANTIAS.adaptacion + ' días a partir de la entrega, aplicable en caso de error en la fabricación de los lentes.</li>' +
    '<li><strong>Armazón:</strong> ' + GARANTIAS.armazon + ' meses por defectos de fabricación (válido únicamente si el cliente adquirió lentes completos).</li>' +
    '<li><strong>Tratamientos en micas:</strong> ' + GARANTIAS.tratamiento + ' meses, aplicable únicamente en caso de fallas relacionadas con el tratamiento adquirido.</li></ul>' +
    '<p>La garantía no cubre daños por mal uso, caídas, golpes o manipulación incorrecta.</p>' +
    '<h4>2. ASIGNACIÓN DE NÚMEROS Y ADQUISICIÓN DE LENTES</h4><ul>' +
    '<li>Cada número de tanda permite la adquisición de un solo par de lentes.</li>' +
    '<li>Si el cliente desea adquirir más de un par, deberá solicitar un número adicional dentro de la tanda.</li>' +
    '<li>La asignación de números adicionales será de forma ascendente. Es decir, si el cliente ya tiene el número 6, su siguiente número deberá ser el 7 o el siguiente disponible en orden.</li></ul>' +
    '<h4>3. PAGOS Y REPORTES</h4><ul>' +
    '<li>Los pagos deberán realizarse en tiempo y forma de acuerdo con el calendario establecido.</li>' +
    '<li>Todos los pagos deben ser reportados a través de los canales indicados, anexando el comprobante correspondiente.</li>' +
    '<li>El incumplimiento en los pagos puede afectar la entrega del producto y/o la participación en futuras tandas.</li></ul>' +
    '<h4>4. ENTREGA DE LENTES</h4><ul>' +
    '<li>Los lentes se entregarán conforme al orden de asignación de números y de acuerdo con el calendario establecido.</li>' +
    '<li>En caso de retrasos ajenos a la empresa, se notificará oportunamente a los participantes.</li></ul>' +
    '<h4>5. ENTREGA HASTA EL VIERNES</h4><ul>' +
    '<li>La entrega se hace <strong>hasta el viernes</strong> de tu semana de entrega, de <strong>3:00 a 9:00 pm</strong>. Al recoger tus lentes, haces tu pago de esa semana.</li></ul>' +
    '<h4>6. HORARIOS HÁBILES PARA REPORTAR PAGOS</h4><ul>' +
    '<li><strong>Lunes a sábado de 9:00 am a 9:00 pm.</strong> El domingo no es hábil. La fecha que cuenta es la fecha en que se registra tu pago en horario laboral: si lo reportas a las 11:59 del último día, se registra al día siguiente y la aplicación lo toma como atraso.</li></ul>' +
    '<h2 class="carta-titulo">TÉRMINOS Y CONDICIONES</h2>' +
    '<h4>1. REGISTRO Y PARTICIPACIÓN</h4>' +
    '<p>1.1 Para participar en Tanda Visual, el cliente deberá registrarse con sus datos personales y aceptar estos términos y condiciones.</p>' +
    '<p>1.2 Al momento del registro, se le asignará un número de tanda que determinará su semana de entrega.</p>' +
    '<p>1.3 El cliente deberá proporcionar su receta vigente; en caso de no contar con ella, Ópticas Luna podrá realizar un examen de la vista previo a la entrega para garantizar la correcta graduación.</p>' +
    '<p>1.4 Tu foto del INE es solo por el frente; el reverso lo muestras en físico para cotejar tu firma de manera visual (no se fotografía ni se guarda).</p>' +
    '<h4>2. PAGOS Y CONDICIONES</h4>' +
    '<p>2.1 Los pagos deberán realizarse semanalmente según el número de tanda asignado.</p>' +
    '<p>2.2 Se aceptan pagos en efectivo y transferencias bancarias.</p>' +
    '<p>2.3 <strong>Política de Pagos en Efectivo:</strong> Es responsabilidad exclusiva del cliente verificar que su pago sea abonado correctamente y solicitar su comprobante de pago, ya que este será necesario para futuras aclaraciones o reclamaciones. Ópticas Luna no se hará responsable por pagos no registrados o sin comprobante.</p>' +
    '<p>2.4 <strong>Política de Penalización por Depósito Tardío:</strong> En caso de que el cliente no realice sus pagos en el tiempo establecido, Ópticas Luna tendrá derecho a recorrer la fecha de entrega de los lentes proporcionalmente al atraso.</p>' +
    '<div class="carta-ejemplo-box"><strong>Ejemplo:</strong> un cliente con número asignado 7 debía recibir sus lentes en la Semana 7, pero tiene dos semanas de atraso en los pagos, su entrega podrá programarse hasta la Semana 9 o posterior, o hasta que regularice sus pagos.</div>' +
    '<p><strong>El cliente renuncia al derecho de reembolso de las cantidades pagadas en caso de incumplimiento en los pagos.</strong></p>' +
    '<h4>3. ASIGNACIÓN DEL NÚMERO Y ENTREGA EN PARTICIPACIONES FUTURAS</h4>' +
    '<p>3.1 El número de tanda se asigna por Ópticas Luna al registrarte, conforme al calendario y a tu historial de pagos. Tú no eliges tu número.</p>' +
    '<p>3.2 El número asignado determina la semana en que recibirás tus lentes.</p>' +
    '<p>3.3 Tu historial de pagos se refleja en tu nivel dentro del programa, que puedes consultar en tu tarjeta de pagos. Con pagos puntuales puedes acceder a una entrega más temprana en tus siguientes participaciones; con atrasos, tu entrega se programa en una semana más tardía.</p>' +
    '<p>3.4 El número asignado en cada tanda es definitivo. Al aceptar estos términos, aceptas el número asignado y la semana de entrega correspondiente.</p>' +
    '<h4>4. COLOR DENTRO DEL PROGRAMA</h4>' +
    '<p>Tu color dentro del programa (verde, amarillo, naranja o rojo) refleja tu comportamiento de pago en cada tanda y se recalcula por tanda. Un cliente puede rehabilitarse pagando bien en una tanda nueva.</p>' +
    '<h2 class="carta-titulo">TARJETA DE REGISTRO DE PAGOS — EJEMPLO</h2>' +
    '<p class="ejemplo-aviso">SOLO UN EJEMPLO. Esta tarjeta NO tiene validez como comprobante. Tu tarjeta REAL se genera a partir de tu primer pago y te llega por WhatsApp con cada abono registrado.</p>' +
    '<p><strong>Nombre:</strong> ' + esc(EJEMPLO_TARJETA.nombre) + ' · <strong>Nº de cliente:</strong> ' + esc(EJEMPLO_TARJETA.clienteId) + ' · <strong>Nº de tanda:</strong> ' + esc(String(EJEMPLO_TARJETA.numero)) + '</p>' +
    '<p><strong>Inicio:</strong> ' + fechaMX(EJEMPLO_TARJETA.fechaInicio) + ' · <strong>Entrega estimada:</strong> ' + fechaMX(EJEMPLO_TARJETA.entregaEstimada) + ' · <strong>Progreso:</strong> 0 de 10 pagos</p>' +
    '<table><tr><th>Semana</th><th>Fecha límite de pago</th><th>Monto</th><th>Estado</th><th>Fecha de pago</th><th>Comprobante</th></tr>';
  EJEMPLO_TARJETA.semanas.forEach(function (s) {
    html += '<tr><td>semana ' + s.semana + '</td><td>' + fechaMX(s.fechaLimite) + '</td><td>' + money(s.monto) + '</td><td>Pendiente</td><td>—</td><td>—</td></tr>';
  });
  html += '</table>' +
    '<p><strong>Total del ejemplo:</strong> ' + money(EJEMPLO_TARJETA.total) + ' · 9 pagos de ' + money(EJEMPLO_TARJETA.pagoSemanal) + ' + último de ' + money(EJEMPLO_TARJETA.ultimoPago) + '</p>' +
    '<p><strong>Reporta tu pago vía WhatsApp:</strong> 56 1158 6976 · <strong>Métodos de pago:</strong> Transferencia, Efectivo · <strong>Envía tu comprobante con:</strong> nombre completo, número de tanda, semana de pago.</p>';
  if (datos.firmaUrl) {
    html += '<div class="carta-firma-aceptacion"><h3>Aceptación de términos</h3>' +
      '<p class="carta-declaracion">“' + esc(DECLARACION_ACEPTACION) + '”</p>' +
      '<img src="' + esc(datos.firmaUrl) + '" alt="Firma digital de aceptación de términos">' +
      '<p><strong>' + nombre + '</strong>' + (datos.fechaFirma ? ' · Firmado el ' + fechaMX(datos.fechaFirma) : '') + '</p></div>';
  }
  html += '<p class="doc-contacto">' + esc(NEGOCIO.nombre) + ' · ' + esc(NEGOCIO.programa) + ' — Renueva tu visión de forma accesible y organizada<br>' +
    'Tel. ' + esc(NEGOCIO.telefonos) + ' · ' + esc(NEGOCIO.correo) + ' · ' + esc(NEGOCIO.instagram) + '<br>' +
    esc(NEGOCIO.direccion) + ' · Respaldado por Ópticas Luna</p>' +
    '<div class="carta-onda carta-onda-bottom" aria-hidden="true"></div>' +
    '</div>';
  return html;
}
/* Documento completo de la carta (tanda ya creada): con sus datos
   personales y su firma de aceptación incrustada. SIN fotos (sin INE
   ni rostro): las fotos se quedan solo en el expediente interno. */
function docReglamentoHTML(d) {
  var c = d.cliente || {};
  return cartaHTML({
    nombre: c.nombre, clienteId: c.id, numero: d.numero,
    fechaInicio: d.fechaInicio, entregaEstimada: d.entregaEstimada,
    total: d.total, pagoSemanal: d.pagoSemanal, ultimoPago: d.ultimoPago,
    firmaUrl: c.firmaTerminosUrl || '', fechaFirma: c.creado || d.fechaInicio
  });
}
/* Vista previa de la carta en el paso 2 del wizard: el cliente la LEE
   antes de firmar. Solo lleva el nombre (la tanda aún no existe). */
function cartaWizardHTML(nombre) {
  return cartaHTML({ nombre: nombre });
}
function estadoSemanaTxt(s) {
  var e = s.estadoMuestra || s.estado;
  if (e === 'Pagado') return 'Pagado';
  if (e === 'Tarde') return 'Tarde';
  if (e === 'Vencido') return 'Vencido';
  return 'Pendiente';
}
function docTarjetaHTML(d) {
  var c = d.cliente, t = d.tanda || d;
  var semanas = d.semanas || [];
  var colorT = t.color || d.color || 'Verde';
  // v2.0.0: banner Yael (degradado Turquesa→Lila) con el chip de color
  // bien visible, y el progreso destacado en su propio bloque.
  // v2.0.4 (Detalle 3): marca de agua de Yael al centro de la tarjeta,
  // EN GRANDE, con transparencia para que el contenido se vea
  // (.doc-watermark, mismo patrón que el comprobante de la App 1).
  var html = '<div class="doc doc-tarjeta"><div class="doc-watermark"></div>' + docHead('Tarjeta de registro de pagos') +
    '<div class="tarjeta-banner"><span class="doc-title">Tarjeta de pagos</span>' + colorChip(colorT) + '</div>' +
    '<p><strong>Nombre:</strong> ' + esc(c.nombre) + ' · <strong>Nº de cliente:</strong> ' + esc(c.id) +
    ' · <strong>Nº de tanda:</strong> ' + esc(t.numero) + '</p>' +
    '<p><strong>Inicio:</strong> ' + fechaMX(t.fechaInicio) + ' · <strong>Entrega estimada:</strong> ' + fechaMX(t.entregaEstimada) +
    (t.fechaEntrega ? ' · <strong>Entregada:</strong> ' + fechaMX(t.fechaEntrega) : '') + '</p>' +
    '<div class="tarjeta-progreso"><p><strong>Progreso:</strong> ' + (d.pagados || 0) + ' de 10 pagos ' + colorChip(colorT) + '</p>' +
    progresoBar(d.pagados || 0) + '</div>' +
    '<table><tr><th>Semana</th><th>Fecha límite</th><th>Monto</th><th>Estado</th><th>Fecha de pago</th><th>Comprobante</th></tr>';
  semanas.forEach(function (s) {
    html += '<tr><td>' + s.semana + '</td><td>' + fechaMX(s.fechaLimite) + '</td><td>' + money(s.monto) + '</td>' +
      '<td>' + estadoSemanaTxt(s) + '</td><td>' + (s.fechaPago ? fechaMX(s.fechaPago) : '—') + '</td>' +
      '<td>' + esc(s.metodo || '—') + '</td></tr>';
  });
  html += '</table>' +
    '<p><strong>Total:</strong> ' + money(t.total) + ' · 9 pagos de ' + money(t.pagoSemanal) + ' + último de ' + money(t.ultimoPago) + '</p>' +
    '<p class="doc-contacto">' + esc(NEGOCIO.nombre) + ' · ' + esc(NEGOCIO.programa) + '<br>' +
    'Tel. ' + esc(NEGOCIO.telefonos) + ' · ' + esc(NEGOCIO.correo) + ' · ' + esc(NEGOCIO.instagram) + '<br>' +
    esc(NEGOCIO.direccion) + ' · Respaldado por Ópticas Luna</p>' +
    '</div>';
  return html;
}
/* ---------------- Hoja de evidencia (v2.0.4, Detalle 4) ----------------
   Formato para mostrarle al cliente en caso de conflicto: reúne las 4
   imágenes del expediente (INE frente, rostro, firma de aceptación y
   firma de entrega) con sus etiquetas + datos del cliente y la tanda.
   Cada firma va con su DECLARACIÓN y su fecha debajo, para que la
   firma quede atada a lo que el cliente declaró. Documento imprimible
   (PDF) y compartible (PNG), como los demás. Las imágenes se guardan
   en la carpeta privada de Drive; las URLs son de miniatura y se ven
   con la sesión de Google del dueño en el celular. */
function evidImgHTML(url, etiqueta) {
  if (!url) return '<div class="evid-sin-img">Sin imagen registrada — ' + esc(etiqueta) + '</div>';
  return '<img class="evid-img" src="' + esc(url) + '" alt="' + esc(etiqueta) + '" onclick="ampliarImagen(\'' + esc(url) + '\')">';
}
function docEvidenciaHTML(d) {
  var c = d.cliente || {};
  var html = '<div class="doc doc-evidencia">' + docHead('Hoja de evidencia') +
    '<p class="hint">Expediente de evidencia del programa Tanda Visual. Las imágenes se guardan en la carpeta privada de Drive del negocio; este formato es para mostrarle al cliente en caso de conflicto.</p>' +
    '<p><strong>Cliente:</strong> ' + esc(c.nombre || '') + ' · <strong>Nº de cliente:</strong> ' + esc(c.id || '') + ' · <strong>Teléfono:</strong> ' + esc(c.telefono || '—') + '</p>' +
    '<p><strong>Tanda:</strong> ' + esc(d.id || '') + ' · <strong>Nº de tanda:</strong> ' + esc(String(d.numero || '')) + ' · <strong>Inicio:</strong> ' + fechaMX(d.fechaInicio) + ' · <strong>Entrega estimada:</strong> ' + fechaMX(d.entregaEstimada) + (d.fechaEntrega ? ' · <strong>Entregada:</strong> ' + fechaMX(d.fechaEntrega) : '') + '</p>' +
    '<p><strong>Total:</strong> ' + money(d.total) + ' · <strong>Color actual:</strong> ' + esc(d.color || 'Verde') + '</p>' +
    '<h3>Identidad</h3>' +
    '<div class="evid-grid">' +
    '<div class="evid-item"><h4>INE (frente)</h4>' + evidImgHTML(c.ineFrenteUrl, 'INE (frente)') + '<p class="hint">Solo el frente, por seguridad del cliente. El reverso se muestra en físico para cotejar la firma de manera visual (no se fotografía ni se guarda).</p></div>' +
    '<div class="evid-item"><h4>Rostro</h4>' + evidImgHTML(c.rostroUrl, 'Rostro') + '</div>' +
    '</div>' +
    '<h3>Firma de aceptación de términos</h3>' +
    '<p class="carta-declaracion">“' + esc(DECLARACION_ACEPTACION) + '”</p>' +
    evidImgHTML(c.firmaTerminosUrl, 'Firma de aceptación de términos') +
    '<p><strong>' + esc(c.nombre || '') + '</strong>' + (c.creado ? ' · Firmado el ' + fechaMX(c.creado) : '') + '</p>' +
    '<h3>Firma de entrega — recepción de los lentes</h3>' +
    '<p class="carta-declaracion">“' + esc(DECLARACION_ENTREGA) + '”</p>' +
    evidImgHTML(d.firmaEntregaUrl, 'Firma de entrega') +
    '<p><strong>' + esc(c.nombre || '') + '</strong>' + (d.fechaEntrega ? ' · Firmado el ' + fechaMX(d.fechaEntrega) : ' · Aún no entregado') + '</p>' +
    '<p class="doc-contacto">' + esc(NEGOCIO.nombre) + ' · ' + esc(NEGOCIO.programa) + '<br>' +
    'Tel. ' + esc(NEGOCIO.telefonos) + ' · ' + esc(NEGOCIO.correo) + ' · ' + esc(NEGOCIO.instagram) + '<br>' +
    esc(NEGOCIO.direccion) + ' · Respaldado por Ópticas Luna</p>' +
    '</div>';
  return html;
}

/* ---------------- Vista de documento ----------------
   v2.0.4 (Detalle 2): al abrir un documento se PRE-GENERA su imagen
   (PNG) y el botón "Compartir por WhatsApp" queda en "Generando
   imagen…" hasta que esté lista; así navigator.share se llama
   síncrono dentro del toque y ya no falla con el error de gesto.
   Los 4 documentos son compartibles: carta, tarjeta, orden y
   evidencia. El autoShare (abrir y compartir solo) se quitó: el
   fetch asíncrono rompía el gesto y por eso fallaba el primer
   intento; ahora se abre la vista y el botón de compartir ya está
   listo con un solo toque. */
function abrirReglamento(tandaId) {
  api('getTanda', { id: tandaId }).then(function (d) {
    state.currentTanda = d;
    state.currentDoc = { kind: 'reglamento', tandaId: tandaId };
    $('docArea').innerHTML = docReglamentoHTML(d);
    $('btnDocCompartir').hidden = false;
    aplicarTamanoPagina('reglamento');
    show('doc');
    prepararImagenDoc();
  }).catch(function (e) { showError('No se pudo abrir el reglamento: ' + e.message); });
}
function abrirTarjeta(tandaId) {
  api('getTarjeta', { id: tandaId }).then(function (d) {
    state.currentTanda = d;
    state.currentDoc = { kind: 'tarjeta', tandaId: tandaId };
    $('docArea').innerHTML = docTarjetaHTML(d);
    $('btnDocCompartir').hidden = false;
    aplicarTamanoPagina('tarjeta');
    show('doc');
    prepararImagenDoc();
  }).catch(function (e) { showError('No se pudo abrir la tarjeta: ' + e.message); });
}
function abrirEvidencia(tandaId) {
  api('getTanda', { id: tandaId }).then(function (d) {
    state.currentTanda = d;
    state.currentDoc = { kind: 'evidencia', tandaId: tandaId };
    $('docArea').innerHTML = docEvidenciaHTML(d);
    $('btnDocCompartir').hidden = false;
    aplicarTamanoPagina('evidencia');
    show('doc');
    prepararImagenDoc();
  }).catch(function (e) { showError('No se pudo abrir la hoja de evidencia: ' + e.message); });
}
/* ---------------- Orden de trabajo (Laboratorio Óptico Luna) ----------
   v2.0.2: la App 2 NO tenía órdenes de trabajo. Se agregan espejo de la
   App 1: SOLO en la orden sale Laboratorio Óptico Luna (nombre + logo);
   en ningún lado aparece "Boutique de Lentes Yael" dentro de la orden.
   La orden se genera al registrar la tanda: los datos ya están
   guardados (graduación de la optometría + armazón y lente del
   producto), no se vuelve a teclear nada. NO requiere cambio de
   backend: getTanda ya trae tanda + cliente + optometría.
   Una sola etiqueta por tanda (la App 2 no tiene proveedor para
   agrupar). Si no hay graduación, la etiqueta muestra el aviso
   visible en vez de guiones silenciosos. */
function gradOrdenVacia(o) {
  if (!o) return true;
  return !o.gradEsfOD && !o.gradCilOD && !o.gradEsfOI && !o.gradCilOI && !o.gradAdd;
}
function docOrdenHeadHTML() {
  return '<div class="doc-head doc-head-luna"><img src="' + LABORATORIO.logo + '" alt="Laboratorio Óptico Luna" onerror="this.style.display=\'none\'"><div><div class="doc-title">Orden de trabajo</div><div><strong>' + esc(LABORATORIO.nombre) + '</strong></div><div class="addr">' + esc(LABORATORIO.direccion) + ' · Tel. ' + esc(LABORATORIO.telefonos) + '</div></div></div>';
}
function ordenEtiquetaHTML(d) {
  var t = d, c = d.cliente || {};
  var o = d.optometria;
  var sinGrad = gradOrdenVacia(o);
  var rx = sinGrad
    ? '<div class="orden-sin-grad">⚠ Graduación no registrada — el cliente debe dar su receta vigente o hacerse el examen de la vista antes de la entrega</div>'
    : '<table><tr><th></th><th>Esf</th><th>Cil</th><th>Eje</th></tr>' +
      '<tr><td>O.D.</td><td>' + esc(fmtGrad(o.gradEsfOD)) + '</td><td>' + esc(fmtGrad(o.gradCilOD)) + '</td><td>' + esc(o.gradEjeOD || '—') + '</td></tr>' +
      '<tr><td>O.I.</td><td>' + esc(fmtGrad(o.gradEsfOI)) + '</td><td>' + esc(fmtGrad(o.gradCilOI)) + '</td><td>' + esc(o.gradEjeOI || '—') + '</td></tr></table>' +
      '<div>Add ' + esc(fmtGrad(o.gradAdd)) + ' · DNP ' + esc(o.dnp || '—') + '</div>';
  return '<div class="orden-label"><div class="orden-label-wm" aria-hidden="true"></div><h4>' + esc(LABORATORIO.nombre) + ' · ' + esc(t.id || '') + '</h4>' +
    '<div>' + esc(c.nombre || '') + ' · ' + fechaMX(t.fechaInicio) + (c.edad ? ' · ' + esc(String(c.edad)) + ' años' : '') + '</div>' +
    '<div>Nº de tanda ' + esc(String(t.numero || '')) + ' · Entrega estimada ' + fechaMX(t.entregaEstimada) + '</div>' +
    rx +
    '<div>Diseño: ' + esc(t.lenteDiseno || '') + ' · Material: ' + esc(t.lenteMaterial || '') + '</div>' +
    '<div>Tratamiento: ' + esc(t.lenteTratamiento || '') + '</div>' +
    '<div>Armazón: ' + esc(t.armazonMaterial || '') + ' ' + esc(t.armazonDiseno || '') + ' · ' + esc(t.armazonModelo || '') + ' · ' + esc(t.armazonMarca || '') + '</div></div>';
}
function docOrdenHTML(d) {
  return '<div class="doc doc-orden">' + docOrdenHeadHTML() +
    '<p class="orden-hoja-info"><strong>Tanda ' + esc(d.id || '') + ' · Nº ' + esc(String(d.numero || '')) + '</strong> · 1 etiqueta · Entrega estimada ' + fechaMX(d.entregaEstimada) + '</p>' +
    '<div class="doc-orden-grid">' + ordenEtiquetaHTML(d) + '</div></div>';
}
function abrirOrden(tandaId) {
  api('getTanda', { id: tandaId }).then(function (d) {
    state.currentTanda = d;
    state.currentDoc = { kind: 'orden', tandaId: tandaId };
    $('docArea').innerHTML = docOrdenHTML(d);
    $('btnDocCompartir').hidden = false;
    aplicarTamanoPagina('orden');
    show('doc');
    prepararImagenDoc();
  }).catch(function (e) { showError('No se pudo abrir la orden de trabajo: ' + e.message); });
}
function mensajeOrden(d) {
  var nombre = (d.cliente && d.cliente.nombre) || '';
  return 'Orden de trabajo — ' + LABORATORIO.nombre + ' · ' + (d.id || '') +
    ' · Cliente ' + nombre + ' · Nº de tanda ' + (d.numero || '') +
    ' · Entrega estimada ' + fechaMX(d.entregaEstimada) + '.';
}
function imprimirDoc() {
  if (!state.currentDoc) return;
  aplicarTamanoPagina(state.currentDoc.kind);
  window.print();
}

/* ---------------- Imagen de la tarjeta (canvas, patrón App 1) ---------------- */
function cargarImagen(src) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    var t = setTimeout(function () { reject(new Error('No se pudo cargar ' + src + ' (tiempo agotado)')); }, 8000);
    img.onload = function () { clearTimeout(t); resolve(img); };
    img.onerror = function () { clearTimeout(t); reject(new Error('No se pudo cargar ' + src)); };
    img.src = src;
  });
}
/* v2.0.4: carga una imagen de Drive (miniatura) para pintarla en un
   canvas. Con crossOrigin='anonymous': si el servidor no manda CORS,
   la imagen falla al cargar y se devuelve null (el pintor pone un
   recuadro con la etiqueta en su lugar). Sin CORS, pintar la imagen
   mancharía el canvas y toBlob fallaría. Nunca rechaza. */
function cargarImagenSegura(url) {
  return new Promise(function (resolve) {
    if (!url) return resolve(null);
    var img = new Image();
    img.crossOrigin = 'anonymous';
    var t = setTimeout(function () { resolve(null); }, 8000);
    img.onload = function () { clearTimeout(t); resolve(img); };
    img.onerror = function () { clearTimeout(t); resolve(null); };
    img.src = url;
  });
}
function trazoRedondeado(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
function envolverTexto(ctx, txt, maxW) {
  var palabras = String(txt || '').split(/\s+/).filter(Boolean);
  var lineas = [], linea = '';
  palabras.forEach(function (p) {
    var prueba = linea ? linea + ' ' + p : p;
    if (ctx.measureText(prueba).width <= maxW) linea = prueba;
    else { if (linea) lineas.push(linea); linea = p; }
  });
  if (linea) lineas.push(linea);
  return lineas.length ? lineas : [''];
}
function fuenteDe(familia, tam, negrita) {
  return (negrita ? '700 ' : '') + tam + 'px ' + familia;
}
function texto(ctx, s, x, y, fuente, color, align, dibujar) {
  ctx.font = fuente;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  if (dibujar) ctx.fillText(s, x, y);
  return ctx.measureText(s).width;
}
function dibujarTarjeta(ctx, doc, logo, escala, dibujar, wmImg, altoTotal) {
  var F = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  var tinta = '#241f31';
  var W = 528, M = 20, cw = W - 2 * M, LH = 17;
  var k = escala || 1;
  var y = M;
  // v2.0.4 (Detalle 3): marca de agua de Yael al centro de la tarjeta,
  // EN GRANDE, alfa 0.12, detrás del contenido. El alto total se conoce
  // por la pasada de medición (altoTotal), así que queda centrada en
  // vertical. Los fondos de la tabla son semitransparentes para que la
  // marca se vea a través de ellos; el texto va encima, opaco.
  if (dibujar && wmImg) {
    try {
      var wmW = 360;
      var wmH = Math.round(wmW * (wmImg.naturalHeight || wmImg.height || 1024) / (wmImg.naturalWidth || wmImg.width || 1024));
      var wmY = altoTotal ? (altoTotal / 2 - wmH / 2) : 90;
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.drawImage(wmImg, (W - wmW) / 2, wmY, wmW, wmH);
      ctx.restore();
    } catch (e) {}
  }
  // Banner degradado.
  if (dibujar) {
    var grad = ctx.createLinearGradient(M, y, W - M, y);
    grad.addColorStop(0, '#40C5D2');
    grad.addColorStop(1, '#9076DA');
    ctx.fillStyle = grad;
    trazoRedondeado(ctx, M, y, cw, 64, 8);
    ctx.fill();
    if (logo) { try { ctx.drawImage(logo, M + 14, y + 8, 140, 38); } catch (e) {} }
    ctx.fillStyle = '#fff';
    ctx.font = fuenteDe(F, 19, true);
    ctx.textAlign = 'right';
    ctx.fillText('TARJETA DE PAGOS', W - M - 12, y + 28);
    ctx.font = fuenteDe(F, 13, false);
    ctx.fillText('TANDA VISUAL', W - M - 12, y + 48);
  }
  y += 64 + 14;
  var c = doc.cliente, t = doc.tanda;
  var lineas = [
    ['Nombre: ' + (c.nombre || ''), true],
    ['Nº de cliente: ' + (c.id || '') + '   ·   Nº de tanda: ' + (t.numero || ''), false],
    ['Inicio: ' + fechaMX(t.fechaInicio) + '   ·   Entrega estimada: ' + fechaMX(t.entregaEstimada), false],
    ['Progreso: ' + (doc.pagados || 0) + ' de 10 pagos', false],
    ['Total: ' + money(t.total) + '  ·  9 pagos de ' + money(t.pagoSemanal) + ' + último de ' + money(t.ultimoPago), false]
  ];
  lineas.forEach(function (ln) {
    if (dibujar) texto(ctx, ln[0], M, y, fuenteDe(F, 14, ln[1]), tinta, 'left', true);
    y += LH + 2;
  });
  // v2.0.0: insignia de color + barra de progreso de 10 segmentos (Yael).
  // El avance de `y` es idéntico en la pasada de medición y en la de
  // dibujo, para que el alto medido sea el real.
  var colorNombre = t.color || doc.color || 'Verde';
  var colorHex = { Verde: '#1e7d4f', Amarillo: '#8d6e00', Naranja: '#8d4e00', Rojo: '#b3261e' }[colorNombre] || '#1e7d4f';
  var colorDesc = (COLORES[colorNombre] || {}).desc || '';
  var pillTxt = colorNombre + (colorDesc ? ' — ' + colorDesc : '');
  ctx.font = fuenteDe(F, 13, true);
  var pillW = ctx.measureText(pillTxt).width + 28;
  if (dibujar) {
    ctx.fillStyle = colorHex;
    trazoRedondeado(ctx, M, y, pillW, 24, 12);
    ctx.fill();
    texto(ctx, pillTxt, M + 14, y + 17, fuenteDe(F, 13, true), '#fff', 'left', true);
  }
  y += 24 + 8;
  var pag = num(doc.pagados, 0);
  if (dibujar) {
    var segW = (cw - 9 * 3) / 10, segH = 10;
    var gBar = ctx.createLinearGradient(M, y, W - M, y);
    gBar.addColorStop(0, '#40C5D2');
    gBar.addColorStop(1, '#9076DA');
    for (var i = 0; i < 10; i++) {
      ctx.fillStyle = i < pag ? gBar : '#e9e3f7';
      trazoRedondeado(ctx, M + i * (segW + 3), y, segW, segH, 5);
      ctx.fill();
    }
    texto(ctx, pag + ' de 10 pagos', M, y + segH + 14, fuenteDe(F, 12, false), '#6b6478', 'left', true);
  }
  y += 10 + 18 + 6;
  y += 6;
  // Tabla de semanas.
  var xSem = M, xLim = M + 62, xMon = M + 190, xEst = M + 300, xPag = M + 400;
  if (dibujar) {
    ctx.fillStyle = 'rgba(239,233,251,0.6)';
    ctx.fillRect(M, y, cw, 26);
    texto(ctx, 'Sem.', xSem + 4, y + 18, fuenteDe(F, 13, true), '#6f55b8', 'left', true);
    texto(ctx, 'Límite', xLim, y + 18, fuenteDe(F, 13, true), '#6f55b8', 'left', true);
    texto(ctx, 'Monto', xMon, y + 18, fuenteDe(F, 13, true), '#6f55b8', 'left', true);
    texto(ctx, 'Estado', xEst, y + 18, fuenteDe(F, 13, true), '#6f55b8', 'left', true);
    texto(ctx, 'Pago', xPag, y + 18, fuenteDe(F, 13, true), '#6f55b8', 'left', true);
  }
  y += 26;
  (doc.semanas || []).forEach(function (s, i) {
    var filaY = y + 4;
    if (dibujar) {
      if (i % 2 === 0) { ctx.fillStyle = 'rgba(247,245,252,0.55)'; ctx.fillRect(M, y, cw, LH + 8); }
      ctx.strokeStyle = '#e3ddf2';
      ctx.strokeRect(M + 0.5, y + 0.5, cw - 1, LH + 8);
      texto(ctx, String(s.semana), xSem + 4, filaY + 13, fuenteDe(F, 13, false), tinta, 'left', true);
      texto(ctx, fechaMX(s.fechaLimite), xLim, filaY + 13, fuenteDe(F, 13, false), tinta, 'left', true);
      texto(ctx, money(s.monto), xMon, filaY + 13, fuenteDe(F, 13, false), tinta, 'left', true);
      texto(ctx, estadoSemanaTxt(s), xEst, filaY + 13, fuenteDe(F, 13, false), tinta, 'left', true);
      texto(ctx, s.fechaPago ? fechaMX(s.fechaPago) : '—', xPag, filaY + 13, fuenteDe(F, 13, false), tinta, 'left', true);
    }
    y += LH + 8;
  });
  y += 10;
  if (dibujar) {
    ctx.fillStyle = 'rgba(239,233,251,0.6)';
    trazoRedondeado(ctx, M, y, cw, 52, 8);
    ctx.fill();
    texto(ctx, NEGOCIO.nombre + ' · ' + NEGOCIO.programa, M + 12, y + 20, fuenteDe(F, 13, true), '#6f55b8', 'left', true);
    texto(ctx, 'Tel. ' + NEGOCIO.telefonos + ' · ' + NEGOCIO.correo, M + 12, y + 40, fuenteDe(F, 12, false), tinta, 'left', true);
  }
  y += 52 + M;
  return { ancho: Math.round(W * k), alto: Math.round(y * k) };
}
/* ---------------- Imagen de la carta (canvas, patrón tarjeta) ----------
   v2.0.4 (Detalle 1 y 6): el archivo completo (carta + reglamento +
   tarjeta de ejemplo + firma de aceptación) se comparte por WhatsApp
   como PNG, igual que la tarjeta y la orden. Pintor 2 pasadas (medir
   + dibujar), mismo patrón que dibujarTarjeta. La tarjeta de ejemplo
   usa SOLO los datos ficticios de EJEMPLO_TARJETA (nunca datos reales).
   SIN fotos (sin INE ni rostro). La firma de aceptación se pinta si
   se pudo cargar (cargarImagenSegura); si no, queda el texto
   "Firmado digitalmente el …". Escala 1.5 (el documento es largo). */
function dibujarCarta(ctx, doc, logoYael, firmaImg, escala, dibujar) {
  var F = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  var tinta = '#241f31';
  var lila = '#9076DA', lilaOsc = '#6f55b8', turq = '#40C5D2';
  var W = 528, M = 20, cw = W - 2 * M;
  var k = escala || 1;
  var y = 0;
  var c = doc.cliente || {}, t = doc;
  function lineas(txt, tam, negrita, ancho) {
    ctx.font = fuenteDe(F, tam, negrita);
    return envolverTexto(ctx, txt, ancho || cw);
  }
  function parrafo(txt, tam, negrita, color, gap) {
    tam = tam || 13; color = color || tinta;
    var ls = lineas(txt, tam, negrita);
    ls.forEach(function (ln) {
      if (dibujar) texto(ctx, ln, M, y, fuenteDe(F, tam, negrita), color, 'left', true);
      y += tam + 5;
    });
    y += (gap === undefined ? 6 : gap);
  }
  function bullet(txt, tam) {
    tam = tam || 12.5;
    var ls = lineas(txt, tam, false, cw - 16);
    ls.forEach(function (ln, i) {
      if (dibujar) texto(ctx, (i === 0 ? '•  ' : '    ') + ln, M, y, fuenteDe(F, tam, false), tinta, 'left', true);
      y += tam + 5;
    });
    y += 3;
  }
  function seccion(txt) {
    y += 6;
    if (dibujar) texto(ctx, txt, M, y, fuenteDe(F, 14, true), lilaOsc, 'left', true);
    y += 14 + 8;
  }
  function tituloCentrado(txt) {
    y += 8;
    ctx.font = fuenteDe(F, 17, true);
    var wTxt = ctx.measureText(txt).width;
    if (dibujar) {
      var g = ctx.createLinearGradient(M + (cw - wTxt) / 2, 0, M + (cw - wTxt) / 2 + wTxt, 0);
      g.addColorStop(0, turq); g.addColorStop(1, lila);
      ctx.fillStyle = g;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(txt, W / 2, y);
      ctx.fillStyle = turq;
      ctx.fillRect(W / 2 - 30, y + 6, 60, 2);
    }
    y += 17 + 14;
  }
  // Onda superior (turquesa→lila).
  if (dibujar) {
    var gTop = ctx.createLinearGradient(0, 0, W, 0);
    gTop.addColorStop(0, turq); gTop.addColorStop(1, lila);
    ctx.fillStyle = gTop;
    ctx.fillRect(0, 0, W, 56);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(W / 2, 56, W * 0.55, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  y += 64;
  // Encabezado: logo Yael + TANDA VISUAL.
  var logoH = 44, logoW = 0;
  if (logoYael) {
    logoW = Math.round(logoH * (logoYael.naturalWidth || logoYael.width || 300) / (logoYael.naturalHeight || logoYael.height || 100));
  }
  var headX = M + logoW + 14;
  var headW = W - M - headX;
  ctx.font = fuenteDe(F, 16, true);
  var wTanda = ctx.measureText('TANDA ').width;
  ctx.font = fuenteDe(F, 11, false);
  var subLin = envolverTexto(ctx, 'Renueva tu visión de forma accesible y organizada.', headW);
  var headH = Math.max(logoH, 20 + subLin.length * 14 + 4);
  if (dibujar) {
    if (logoYael) { try { ctx.drawImage(logoYael, M, y, logoW, logoH); } catch (e) {} }
    texto(ctx, 'TANDA ', headX, y + 20, fuenteDe(F, 16, true), '#2b9aa8', 'left', true);
    texto(ctx, 'VISUAL', headX + wTanda, y + 20, fuenteDe(F, 16, true), lila, 'left', true);
    subLin.forEach(function (ln, i) {
      texto(ctx, ln, headX, y + 38 + i * 14, fuenteDe(F, 11, false), '#6b6478', 'left', true);
    });
  }
  y += headH + 10;
  // Tira de contacto.
  if (dibujar) {
    ctx.strokeStyle = turq; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke();
  }
  y += 8;
  var contacto = '55 9719 1674 / 56 1158 6976 · contacto@opticasluna.com · @Opticasluna14 · ' + NEGOCIO.direccion;
  var conLin = lineas(contacto, 11, false);
  conLin.forEach(function (ln) {
    if (dibujar) texto(ctx, ln, W / 2, y, fuenteDe(F, 11, false), '#6b6478', 'center', true);
    y += 11 + 4;
  });
  y += 6;
  // Carta de bienvenida.
  tituloCentrado('CARTA DE BIENVENIDA');
  parrafo('Estimado(a) ' + (c.nombre || '') + ':', 13, true);
  parrafo('¡Bienvenido(a) a Tanda Visual! Este es un sistema de compra a plazos que te permite estrenar tus lentes antes de liquidarlos, porque confiamos en ti y sabemos las dificultades que puedes enfrentar sin ellos.', 13);
  parrafo('Te informamos que se te ha asignado el número ' + (t.numero || '') + '. Adjuntamos a este mensaje la documentación necesaria, que incluye:', 13);
  // Datos personalizados.
  if (dibujar) {
    ctx.fillStyle = 'rgba(239,233,251,0.8)';
    trazoRedondeado(ctx, M, y, cw, 52, 8);
    ctx.fill();
  }
  var datosLin = [
    'Nº de tanda: ' + (t.numero || '') + '   ·   Entrega estimada: ' + fechaMX(t.entregaEstimada),
    'Total: ' + money(t.total) + '   ·   Plan: 9 pagos de ' + money(t.pagoSemanal) + ' + último de ' + money(t.ultimoPago)
  ];
  datosLin.forEach(function (ln) {
    if (dibujar) texto(ctx, ln, M + 12, y + 20, fuenteDe(F, 13, true), tinta, 'left', true);
    y += 22;
  });
  y += 8 + 6;
  // Checklist.
  ['Calendario de pagos y entregas.', 'Datos bancarios y procedimiento para reportar tus depósitos.', 'Reglamento y términos y condiciones.'].forEach(function (item) {
    if (dibujar) texto(ctx, '✓  ' + item, M, y, fuenteDe(F, 13, false), tinta, 'left', true);
    y += 13 + 8;
  });
  y += 4;
  parrafo('Te invitamos a leer detenidamente cada documento, ya que contienen información importante sobre fechas de pago, funcionamiento de la tanda y otros detalles clave.', 13);
  parrafo('Si en algún momento tienes dudas o necesitas aclarar algún punto, no dudes en contactarnos. Contamos con los canales de comunicación necesarios para brindarte la mejor atención.', 13);
  parrafo('Agradecemos tu confianza en Tanda Visual. Estamos seguros de que será una gran experiencia.', 13);
  parrafo('Atentamente,', 13);
  if (dibujar) texto(ctx, 'Boutique de Lentes Yael', M, y, '20px "Segoe Script","Brush Script MT",cursive', lila, 'left', true);
  y += 20 + 10;
  // Pie del papel.
  parrafo('Programa seguro, transparente y respaldado por Ópticas Luna.', 12, true, lilaOsc, 2);
  parrafo('Calidad en cada lente   ·   Garantía que te respalda   ·   Atención que te acompaña', 11, false, '#6b6478', 4);
  // Onda inferior.
  if (dibujar) {
    var gBot = ctx.createLinearGradient(0, y, W, y);
    gBot.addColorStop(0, turq); gBot.addColorStop(1, lila);
    ctx.fillStyle = gBot;
    ctx.fillRect(0, y, W, 46);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(W / 2, y, W * 0.55, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  y += 46 + 14;
  // Reglamento.
  tituloCentrado('REGLAMENTO');
  seccion('1. GARANTÍA DEL PRODUCTO');
  bullet('Graduación: ' + GARANTIAS.adaptacion + ' días a partir de la entrega, aplicable en caso de error en la fabricación de los lentes.');
  bullet('Armazón: ' + GARANTIAS.armazon + ' meses por defectos de fabricación (válido únicamente si el cliente adquirió lentes completos).');
  bullet('Tratamientos en micas: ' + GARANTIAS.tratamiento + ' meses, aplicable únicamente en caso de fallas relacionadas con el tratamiento adquirido.');
  parrafo('La garantía no cubre daños por mal uso, caídas, golpes o manipulación incorrecta.', 12.5);
  seccion('2. ASIGNACIÓN DE NÚMEROS Y ADQUISICIÓN DE LENTES');
  bullet('Cada número de tanda permite la adquisición de un solo par de lentes.');
  bullet('Si el cliente desea adquirir más de un par, deberá solicitar un número adicional dentro de la tanda.');
  bullet('La asignación de números adicionales será de forma ascendente. Es decir, si el cliente ya tiene el número 6, su siguiente número deberá ser el 7 o el siguiente disponible en orden.');
  seccion('3. PAGOS Y REPORTES');
  bullet('Los pagos deberán realizarse en tiempo y forma de acuerdo con el calendario establecido.');
  bullet('Todos los pagos deben ser reportados a través de los canales indicados, anexando el comprobante correspondiente.');
  bullet('El incumplimiento en los pagos puede afectar la entrega del producto y/o la participación en futuras tandas.');
  seccion('4. ENTREGA DE LENTES');
  bullet('Los lentes se entregarán conforme al orden de asignación de números y de acuerdo con el calendario establecido.');
  bullet('En caso de retrasos ajenos a la empresa, se notificará oportunamente a los participantes.');
  seccion('5. ENTREGA HASTA EL VIERNES');
  bullet('La entrega se hace hasta el viernes de tu semana de entrega, de 3:00 a 9:00 pm. Al recoger tus lentes, haces tu pago de esa semana.');
  seccion('6. HORARIOS HÁBILES PARA REPORTAR PAGOS');
  bullet('Lunes a sábado de 9:00 am a 9:00 pm. El domingo no es hábil. La fecha que cuenta es la fecha en que se registra tu pago en horario laboral: si lo reportas a las 11:59 del último día, se registra al día siguiente y la aplicación lo toma como atraso.');
  // Términos y condiciones.
  tituloCentrado('TÉRMINOS Y CONDICIONES');
  seccion('1. REGISTRO Y PARTICIPACIÓN');
  parrafo('1.1 Para participar en Tanda Visual, el cliente deberá registrarse con sus datos personales y aceptar estos términos y condiciones.', 12.5);
  parrafo('1.2 Al momento del registro, se le asignará un número de tanda que determinará su semana de entrega.', 12.5);
  parrafo('1.3 El cliente deberá proporcionar su receta vigente; en caso de no contar con ella, Ópticas Luna podrá realizar un examen de la vista previo a la entrega para garantizar la correcta graduación.', 12.5);
  parrafo('1.4 Tu foto del INE es solo por el frente; el reverso lo muestras en físico para cotejar tu firma de manera visual (no se fotografía ni se guarda).', 12.5);
  seccion('2. PAGOS Y CONDICIONES');
  parrafo('2.1 Los pagos deberán realizarse semanalmente según el número de tanda asignado.', 12.5);
  parrafo('2.2 Se aceptan pagos en efectivo y transferencias bancarias.', 12.5);
  parrafo('2.3 Política de Pagos en Efectivo: Es responsabilidad exclusiva del cliente verificar que su pago sea abonado correctamente y solicitar su comprobante de pago, ya que este será necesario para futuras aclaraciones o reclamaciones. Ópticas Luna no se hará responsable por pagos no registrados o sin comprobante.', 12.5);
  parrafo('2.4 Política de Penalización por Depósito Tardío: En caso de que el cliente no realice sus pagos en el tiempo establecido, Ópticas Luna tendrá derecho a recorrer la fecha de entrega de los lentes proporcionalmente al atraso.', 12.5);
  // Caja de ejemplo.
  var ejTxt = 'Ejemplo: un cliente con número asignado 7 debía recibir sus lentes en la Semana 7, pero tiene dos semanas de atraso en los pagos, su entrega podrá programarse hasta la Semana 9 o posterior, o hasta que regularice sus pagos.';
  var ejLin = lineas(ejTxt, 12.5, false, cw - 24);
  if (dibujar) {
    ctx.fillStyle = '#e8f6f8';
    trazoRedondeado(ctx, M, y, cw, ejLin.length * 17.5 + 12, 8);
    ctx.fill();
  }
  ejLin.forEach(function (ln) {
    if (dibujar) texto(ctx, ln, M + 12, y + 18, fuenteDe(F, 12.5, false), tinta, 'left', true);
    y += 17.5;
  });
  y += 12 + 4;
  parrafo('El cliente renuncia al derecho de reembolso de las cantidades pagadas en caso de incumplimiento en los pagos.', 12.5, true);
  seccion('3. ASIGNACIÓN DEL NÚMERO Y ENTREGA EN PARTICIPACIONES FUTURAS');
  parrafo('3.1 El número de tanda se asigna por Ópticas Luna al registrarte, conforme al calendario y a tu historial de pagos. Tú no eliges tu número.', 12.5);
  parrafo('3.2 El número asignado determina la semana en que recibirás tus lentes.', 12.5);
  parrafo('3.3 Tu historial de pagos se refleja en tu nivel dentro del programa, que puedes consultar en tu tarjeta de pagos. Con pagos puntuales puedes acceder a una entrega más temprana en tus siguientes participaciones; con atrasos, tu entrega se programa en una semana más tardía.', 12.5);
  parrafo('3.4 El número asignado en cada tanda es definitivo. Al aceptar estos términos, aceptas el número asignado y la semana de entrega correspondiente.', 12.5);
  seccion('4. COLOR DENTRO DEL PROGRAMA');
  parrafo('Tu color dentro del programa (verde, amarillo, naranja o rojo) refleja tu comportamiento de pago en cada tanda y se recalcula por tanda. Un cliente puede rehabilitarse pagando bien en una tanda nueva.', 12.5);
  // Tarjeta de ejemplo (SOLO datos ficticios).
  tituloCentrado('TARJETA DE REGISTRO DE PAGOS — EJEMPLO');
  var aviso = 'SOLO UN EJEMPLO. Esta tarjeta NO tiene validez como comprobante. Tu tarjeta REAL se genera a partir de tu primer pago y te llega por WhatsApp con cada abono registrado.';
  var avLin = lineas(aviso, 12, true, cw - 24);
  if (dibujar) {
    ctx.fillStyle = '#fdecea';
    trazoRedondeado(ctx, M, y, cw, avLin.length * 17 + 12, 8);
    ctx.fill();
  }
  avLin.forEach(function (ln) {
    if (dibujar) texto(ctx, ln, M + 12, y + 17, fuenteDe(F, 12, true), '#b3261e', 'left', true);
    y += 17;
  });
  y += 12 + 4;
  parrafo('Nombre: ' + EJEMPLO_TARJETA.nombre + '   ·   Nº de cliente: ' + EJEMPLO_TARJETA.clienteId + '   ·   Nº de tanda: ' + EJEMPLO_TARJETA.numero, 12.5, true);
  parrafo('Inicio: ' + fechaMX(EJEMPLO_TARJETA.fechaInicio) + '   ·   Entrega estimada: ' + fechaMX(EJEMPLO_TARJETA.entregaEstimada) + '   ·   Progreso: 0 de 10 pagos', 12.5);
  // Tabla de ejemplo.
  var xSem = M, xLim = M + 72, xMon = M + 180, xEst = M + 258, xPag = M + 348, xCom = M + 428;
  if (dibujar) {
    ctx.fillStyle = 'rgba(239,233,251,0.8)';
    ctx.fillRect(M, y, cw, 24);
    texto(ctx, 'Semana', xSem + 4, y + 17, fuenteDe(F, 11, true), lilaOsc, 'left', true);
    texto(ctx, 'Fecha límite', xLim, y + 17, fuenteDe(F, 11, true), lilaOsc, 'left', true);
    texto(ctx, 'Monto', xMon, y + 17, fuenteDe(F, 11, true), lilaOsc, 'left', true);
    texto(ctx, 'Estado', xEst, y + 17, fuenteDe(F, 11, true), lilaOsc, 'left', true);
    texto(ctx, 'Fecha de pago', xPag, y + 17, fuenteDe(F, 11, true), lilaOsc, 'left', true);
    texto(ctx, 'Comprobante', xCom, y + 17, fuenteDe(F, 11, true), lilaOsc, 'left', true);
  }
  y += 24;
  EJEMPLO_TARJETA.semanas.forEach(function (s, i) {
    if (dibujar) {
      if (i % 2 === 0) { ctx.fillStyle = 'rgba(247,245,252,0.55)'; ctx.fillRect(M, y, cw, 20); }
      ctx.strokeStyle = '#e3ddf2';
      ctx.strokeRect(M + 0.5, y + 0.5, cw - 1, 20);
      texto(ctx, 'semana ' + s.semana, xSem + 4, y + 14, fuenteDe(F, 11, false), tinta, 'left', true);
      texto(ctx, fechaMX(s.fechaLimite), xLim, y + 14, fuenteDe(F, 11, false), tinta, 'left', true);
      texto(ctx, money(s.monto), xMon, y + 14, fuenteDe(F, 11, false), tinta, 'left', true);
      texto(ctx, 'Pendiente', xEst, y + 14, fuenteDe(F, 11, false), tinta, 'left', true);
      texto(ctx, '—', xPag, y + 14, fuenteDe(F, 11, false), tinta, 'left', true);
      texto(ctx, '—', xCom, y + 14, fuenteDe(F, 11, false), tinta, 'left', true);
    }
    y += 20;
  });
  y += 8;
  parrafo('Total del ejemplo: ' + money(EJEMPLO_TARJETA.total) + ' · 9 pagos de ' + money(EJEMPLO_TARJETA.pagoSemanal) + ' + último de ' + money(EJEMPLO_TARJETA.ultimoPago), 12.5, true);
  parrafo('Reporta tu pago vía WhatsApp: 56 1158 6976 · Métodos de pago: Transferencia, Efectivo · Envía tu comprobante con: nombre completo, número de tanda, semana de pago.', 12);
  // Firma de aceptación (si se pudo cargar la imagen).
  seccion('Aceptación de términos');
  var decLin = lineas('“' + DECLARACION_ACEPTACION + '”', 12.5, false);
  decLin.forEach(function (ln) {
    if (dibujar) texto(ctx, ln, M, y, fuenteDe(F, 12.5, false), tinta, 'left', true);
    y += 12.5 + 5;
  });
  y += 4;
  if (firmaImg) {
    var fW = 220, fH = Math.round(fW * (firmaImg.naturalHeight || firmaImg.height || 220) / (firmaImg.naturalWidth || firmaImg.width || 600));
    if (fH > 90) { fH = 90; fW = Math.round(fH * (firmaImg.naturalWidth || firmaImg.width || 600) / (firmaImg.naturalHeight || firmaImg.height || 220)); }
    if (dibujar) { try { ctx.drawImage(firmaImg, M, y, fW, fH); } catch (e) {} }
    y += fH + 6;
  } else {
    parrafo('Firmado digitalmente' + (c.creado ? ' el ' + fechaMX(c.creado) : '') + '.', 12.5, false, '#6b6478');
  }
  parrafo((c.nombre || '') + (c.creado ? ' · Firmado el ' + fechaMX(c.creado) : ''), 12.5, true);
  // Contacto final.
  y += 4;
  var pieLin = lineas(NEGOCIO.nombre + ' · ' + NEGOCIO.programa + ' — Renueva tu visión de forma accesible y organizada', 11, false);
  pieLin.forEach(function (ln) {
    if (dibujar) texto(ctx, ln, W / 2, y, fuenteDe(F, 11, false), '#6b6478', 'center', true);
    y += 11 + 4;
  });
  parrafo('Tel. ' + NEGOCIO.telefonos + ' · ' + NEGOCIO.correo + ' · ' + NEGOCIO.instagram, 11, false, '#6b6478', 2);
  parrafo(NEGOCIO.direccion + ' · Respaldado por Ópticas Luna', 11, false, '#6b6478', 2);
  y += M;
  return { ancho: Math.round(W * k), alto: Math.round(y * k) };
}
function generarImagenCarta(doc, escala) {
  var k = escala || 1.5;
  var firmaUrl = (doc.cliente && doc.cliente.firmaTerminosUrl) || '';
  return Promise.all([
    cargarImagen('logo.png').catch(function () { return null; }),
    cargarImagenSegura(firmaUrl)
  ]).then(function (imgs) {
    var logo = imgs[0], firmaImg = imgs[1];
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible.');
    var dims;
    try { dims = dibujarCarta(ctx, doc, logo, firmaImg, k, false); } catch (e) { throw new Error('al medir la carta: ' + e.message); }
    if (!dims || !dims.ancho || !dims.alto) throw new Error('No se pudo medir la carta.');
    canvas.width = dims.ancho;
    canvas.height = dims.alto;
    ctx = canvas.getContext('2d');
    ctx.scale(k, k);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, dims.ancho / k, dims.alto / k);
    dibujarCarta(ctx, doc, logo, firmaImg, k, true);
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) reject(new Error('No se pudo exportar el PNG.'));
        else resolve(blob);
      }, 'image/png');
    });
  });
}
function generarImagenTarjeta(doc, escala) {
  var k = escala || 2;
  // v2.0.4: también se carga el logo circular de Yael para la marca de agua.
  return Promise.all([
    cargarImagen('logo-yael-contorno-blanco.png').catch(function () { return null; }),
    cargarImagen('logo-yael-circular.png').catch(function () { return null; })
  ]).then(function (logos) {
    var logo = logos[0], wmImg = logos[1];
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible.');
    var dims;
    try { dims = dibujarTarjeta(ctx, doc, logo, k, false); } catch (e) { throw new Error('al medir la tarjeta: ' + e.message); }
    if (!dims || !dims.ancho || !dims.alto) throw new Error('No se pudo medir la tarjeta.');
    canvas.width = dims.ancho;
    canvas.height = dims.alto;
    ctx = canvas.getContext('2d');
    ctx.scale(k, k);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, dims.ancho / k, dims.alto / k);
    dibujarTarjeta(ctx, doc, logo, k, true, wmImg, dims.alto / k);
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) reject(new Error('No se pudo exportar el PNG.'));
        else resolve(blob);
      }, 'image/png');
    });
  });
}
/* ---------------- Imagen de la orden de trabajo (canvas, patrón tarjeta) ----------
   Pintor 2 pasadas (medir + dibujar), mismo patrón que dibujarTarjeta:
   el avance de `y` es idéntico en ambas pasadas para que el alto medido
   sea el real. La marca de agua de Luna va detrás del contenido con
   alfa bajo. Fondo blanco opaco primero (WhatsApp muestra negro el PNG
   transparente). La fuente se fija antes de cada envolverTexto para que
   la medición y el dibujo envuelvan igual. */
function dibujarOrden(ctx, doc, logoLuna, escala, dibujar) {
  var F = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  var tinta = '#241f31';
  var W = 528, M = 20, cw = W - 2 * M, LH = 17;
  var k = escala || 1;
  var y = M;
  var t = doc, c = doc.cliente || {};
  var o = doc.optometria;
  var sinGrad = gradOrdenVacia(o);
  // Marca de agua de Luna detrás del contenido.
  if (dibujar && logoLuna) {
    try {
      var wmW = 300, wmH = Math.round(wmW * 527 / 785);
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.drawImage(logoLuna, (W - wmW) / 2, 90, wmW, wmH);
      ctx.restore();
    } catch (e) {}
  }
  // Encabezado: logo de Luna + título + laboratorio. La dirección se
  // envuelve a 2 líneas si no cabe (en 528px no cabe en una sola).
  var logoW = 92, logoH = Math.round(logoW * 527 / 785);
  var dirX = M + logoW + 14, dirW = W - M - dirX;
  ctx.font = fuenteDe(F, 11, false);
  var dirLin = envolverTexto(ctx, LABORATORIO.direccion + ' · Tel. ' + LABORATORIO.telefonos, dirW);
  var headH = 58 + dirLin.length * 14 + 8;
  if (dibujar) {
    if (logoLuna) { try { ctx.drawImage(logoLuna, M, y, logoW, logoH); } catch (e) {} }
    texto(ctx, 'ORDEN DE TRABAJO', dirX, y + 22, fuenteDe(F, 18, true), '#6f55b8', 'left', true);
    texto(ctx, LABORATORIO.nombre, dirX, y + 42, fuenteDe(F, 14, true), tinta, 'left', true);
    dirLin.forEach(function (ln, i) {
      texto(ctx, ln, dirX, y + 60 + i * 14, fuenteDe(F, 11, false), '#6b6478', 'left', true);
    });
    ctx.strokeStyle = '#9076DA';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(M, y + headH); ctx.lineTo(W - M, y + headH); ctx.stroke();
  }
  y += headH + 12;
  // Folio + cliente.
  var lineas = [
    [LABORATORIO.nombre + ' · ' + (t.id || ''), true],
    ['Cliente: ' + (c.nombre || '') + ' · ' + fechaMX(t.fechaInicio) + (c.edad ? ' · ' + c.edad + ' años' : ''), false],
    ['Nº de tanda ' + (t.numero || '') + ' · Entrega estimada ' + fechaMX(t.entregaEstimada), false]
  ];
  lineas.forEach(function (ln) {
    if (dibujar) texto(ctx, ln[0], M, y, fuenteDe(F, 14, ln[1]), tinta, 'left', true);
    y += LH + 2;
  });
  y += 4;
  // Graduación (tabla Esf/Cil/Eje) o aviso.
  if (sinGrad) {
    var aviso = 'Graduación no registrada — el cliente debe dar su receta vigente o hacerse el examen de la vista antes de la entrega.';
    ctx.font = fuenteDe(F, 13, true);
    var avLin = envolverTexto(ctx, aviso, cw - 20);
    if (dibujar) {
      ctx.fillStyle = '#fdecea';
      trazoRedondeado(ctx, M, y, cw, avLin.length * 18 + 12, 8);
      ctx.fill();
    }
    avLin.forEach(function (ln) {
      if (dibujar) texto(ctx, ln, M + 10, y + 18, fuenteDe(F, 13, true), '#b3261e', 'left', true);
      y += 18;
    });
    y += 12;
  } else {
    var xLab = M, xEsf = M + 60, xCil = M + 170, xEje = M + 280;
    if (dibujar) {
      ctx.fillStyle = '#efe9fb';
      ctx.fillRect(M, y, cw, 26);
      texto(ctx, 'Esf', xEsf, y + 18, fuenteDe(F, 13, true), '#6f55b8', 'left', true);
      texto(ctx, 'Cil', xCil, y + 18, fuenteDe(F, 13, true), '#6f55b8', 'left', true);
      texto(ctx, 'Eje', xEje, y + 18, fuenteDe(F, 13, true), '#6f55b8', 'left', true);
    }
    y += 26;
    [['O.D.', o.gradEsfOD, o.gradCilOD, o.gradEjeOD], ['O.I.', o.gradEsfOI, o.gradCilOI, o.gradEjeOI]].forEach(function (fila, i) {
      if (dibujar) {
        if (i % 2 === 0) { ctx.fillStyle = '#f7f5fc'; ctx.fillRect(M, y, cw, LH + 8); }
        ctx.strokeStyle = '#e3ddf2';
        ctx.strokeRect(M + 0.5, y + 0.5, cw - 1, LH + 8);
        texto(ctx, fila[0], xLab + 4, y + 17, fuenteDe(F, 13, true), tinta, 'left', true);
        texto(ctx, fmtGrad(fila[1]), xEsf, y + 17, fuenteDe(F, 13, false), tinta, 'left', true);
        texto(ctx, fmtGrad(fila[2]), xCil, y + 17, fuenteDe(F, 13, false), tinta, 'left', true);
        texto(ctx, String(fila[3] || '—'), xEje, y + 17, fuenteDe(F, 13, false), tinta, 'left', true);
      }
      y += LH + 8;
    });
    if (dibujar) texto(ctx, 'Add ' + fmtGrad(o.gradAdd) + ' · DNP ' + (o.dnp || '—'), M, y + 16, fuenteDe(F, 13, false), tinta, 'left', true);
    y += LH + 8;
  }
  y += 4;
  // Lente y armazón.
  var det = [
    'Diseño: ' + (t.lenteDiseno || '—') + ' · Material: ' + (t.lenteMaterial || '—'),
    'Tratamiento: ' + (t.lenteTratamiento || '—'),
    'Armazón: ' + (t.armazonMaterial || '') + ' ' + (t.armazonDiseno || '') + ' · ' + (t.armazonModelo || '') + ' · ' + (t.armazonMarca || '')
  ];
  ctx.font = fuenteDe(F, 13, false);
  det.forEach(function (ln) {
    var partes = envolverTexto(ctx, ln, cw);
    partes.forEach(function (p) {
      if (dibujar) texto(ctx, p, M, y, fuenteDe(F, 13, false), tinta, 'left', true);
      y += LH + 2;
    });
  });
  y += 6;
  if (dibujar) {
    ctx.fillStyle = '#efe9fb';
    trazoRedondeado(ctx, M, y, cw, 34, 8);
    ctx.fill();
    texto(ctx, LABORATORIO.nombre + ' · Precisión en nuestros procesos', M + 12, y + 22, fuenteDe(F, 12, true), '#6f55b8', 'left', true);
  }
  y += 34 + M;
  return { ancho: Math.round(W * k), alto: Math.round(y * k) };
}
function generarImagenOrden(doc, escala) {
  var k = escala || 2;
  return cargarImagen('logo-luna.png').catch(function () { return null; }).then(function (logo) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible.');
    var dims;
    try { dims = dibujarOrden(ctx, doc, logo, k, false); } catch (e) { throw new Error('al medir la orden: ' + e.message); }
    if (!dims || !dims.ancho || !dims.alto) throw new Error('No se pudo medir la orden.');
    canvas.width = dims.ancho;
    canvas.height = dims.alto;
    ctx = canvas.getContext('2d');
    ctx.scale(k, k);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, dims.ancho / k, dims.alto / k);
    dibujarOrden(ctx, doc, logo, k, true);
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) reject(new Error('No se pudo exportar el PNG.'));
        else resolve(blob);
      }, 'image/png');
    });
  });
}
/* ---------------- Imagen de la hoja de evidencia (canvas) ----------
   v2.0.4 (Detalle 4): la hoja de evidencia también se comparte como
   PNG. Las 4 imágenes se cargan con cargarImagenSegura; si alguna no
   se puede pintar (Drive sin CORS), queda un recuadro con su etiqueta
   ("Sin imagen registrada — ver en el expediente"). Las cajas tienen
   alto fijo, así que la medición y el dibujo avanzan igual. */
function dibujarImagenAjustada(ctx, img, x, y, boxW, boxH) {
  var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  var s = Math.min(boxW / iw, boxH / ih);
  var w = Math.max(1, Math.round(iw * s)), h = Math.max(1, Math.round(ih * s));
  ctx.drawImage(img, x + Math.round((boxW - w) / 2), y + Math.round((boxH - h) / 2), w, h);
}
function dibujarEvidencia(ctx, doc, logoYael, imgs, escala, dibujar) {
  var F = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
  var tinta = '#241f31';
  var lila = '#9076DA', lilaOsc = '#6f55b8', turq = '#40C5D2';
  var W = 528, M = 20, cw = W - 2 * M;
  var k = escala || 1;
  var y = M;
  var c = doc.cliente || {}, t = doc;
  function lineas(txt, tam, negrita, ancho) {
    ctx.font = fuenteDe(F, tam, negrita);
    return envolverTexto(ctx, txt, ancho || cw);
  }
  function parrafo(txt, tam, negrita, color, gap) {
    tam = tam || 13; color = color || tinta;
    var ls = lineas(txt, tam, negrita);
    ls.forEach(function (ln) {
      if (dibujar) texto(ctx, ln, M, y, fuenteDe(F, tam, negrita), color, 'left', true);
      y += tam + 5;
    });
    y += (gap === undefined ? 6 : gap);
  }
  function seccion(txt) {
    y += 6;
    if (dibujar) texto(ctx, txt, M, y, fuenteDe(F, 14, true), lilaOsc, 'left', true);
    y += 14 + 8;
  }
  function cajaImagen(img, etiqueta, x, boxW, boxH) {
    if (dibujar) {
      ctx.strokeStyle = '#cfc6e6';
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x + 0.5, y + 0.5, boxW - 1, boxH - 1);
      ctx.setLineDash([]);
      if (img) {
        try { dibujarImagenAjustada(ctx, img, x + 4, y + 4, boxW - 8, boxH - 8); } catch (e) {}
      } else {
        texto(ctx, 'Sin imagen registrada', x + boxW / 2, y + boxH / 2, fuenteDe(F, 12, false), '#6b6478', 'center', true);
      }
    }
    y += boxH;
  }
  // Encabezado: logo Yael + título.
  var logoH = 40, logoW = 0;
  if (logoYael) {
    logoW = Math.round(logoH * (logoYael.naturalWidth || logoYael.width || 300) / (logoYael.naturalHeight || logoYael.height || 100));
  }
  if (dibujar) {
    if (logoYael) { try { ctx.drawImage(logoYael, M, y, logoW, logoH); } catch (e) {} }
    texto(ctx, 'HOJA DE EVIDENCIA', M + logoW + 14, y + 26, fuenteDe(F, 17, true), lilaOsc, 'left', true);
    ctx.strokeStyle = turq; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(M, y + 48); ctx.lineTo(W - M, y + 48); ctx.stroke();
  }
  y += 48 + 10;
  parrafo('Expediente de evidencia del programa Tanda Visual. Las imágenes se guardan en la carpeta privada de Drive del negocio; este formato es para mostrarle al cliente en caso de conflicto.', 12, false, '#6b6478');
  parrafo('Cliente: ' + (c.nombre || '') + '   ·   Nº de cliente: ' + (c.id || '') + '   ·   Teléfono: ' + (c.telefono || '—'), 13, true);
  parrafo('Tanda: ' + (t.id || '') + '   ·   Nº de tanda: ' + (t.numero || '') + '   ·   Inicio: ' + fechaMX(t.fechaInicio) + '   ·   Entrega estimada: ' + fechaMX(t.entregaEstimada) + (t.fechaEntrega ? '   ·   Entregada: ' + fechaMX(t.fechaEntrega) : ''), 13);
  parrafo('Total: ' + money(t.total) + '   ·   Color actual: ' + (t.color || 'Verde'), 13);
  // Identidad: INE y rostro lado a lado.
  seccion('Identidad');
  var fotoW = Math.floor((cw - 12) / 2), fotoH = 150;
  if (dibujar) {
    texto(ctx, 'INE (frente)', M, y, fuenteDe(F, 13, true), tinta, 'left', true);
    texto(ctx, 'Rostro', M + fotoW + 12, y, fuenteDe(F, 13, true), tinta, 'left', true);
  }
  y += 13 + 8;
  var yFotos = y;
  cajaImagen(imgs.ine, 'INE (frente)', M, fotoW, fotoH);
  var yDespuesIne = y;
  y = yFotos;
  cajaImagen(imgs.rostro, 'Rostro', M + fotoW + 12, fotoW, fotoH);
  y = Math.max(y, yDespuesIne);
  y += 6;
  parrafo('Solo el frente del INE, por seguridad del cliente. El reverso se muestra en físico para cotejar la firma de manera visual (no se fotografía ni se guarda).', 11, false, '#6b6478');
  // Firma de aceptación.
  seccion('Firma de aceptación de términos');
  var decLin = lineas('“' + DECLARACION_ACEPTACION + '”', 12.5, false);
  decLin.forEach(function (ln) {
    if (dibujar) texto(ctx, ln, M, y, fuenteDe(F, 12.5, false), tinta, 'left', true);
    y += 12.5 + 5;
  });
  y += 4;
  cajaImagen(imgs.firmaTerminos, 'Firma de aceptación de términos', M, 300, 90);
  y += 6;
  parrafo((c.nombre || '') + (c.creado ? ' · Firmado el ' + fechaMX(c.creado) : ''), 12.5, true);
  // Firma de entrega.
  seccion('Firma de entrega — recepción de los lentes');
  var dec2Lin = lineas('“' + DECLARACION_ENTREGA + '”', 12.5, false);
  dec2Lin.forEach(function (ln) {
    if (dibujar) texto(ctx, ln, M, y, fuenteDe(F, 12.5, false), tinta, 'left', true);
    y += 12.5 + 5;
  });
  y += 4;
  cajaImagen(imgs.firmaEntrega, 'Firma de entrega', M, 300, 90);
  y += 6;
  parrafo((c.nombre || '') + (t.fechaEntrega ? ' · Firmado el ' + fechaMX(t.fechaEntrega) : ' · Aún no entregado'), 12.5, true);
  // Contacto final.
  y += 8;
  parrafo(NEGOCIO.nombre + ' · ' + NEGOCIO.programa, 11, true, lilaOsc, 2);
  parrafo('Tel. ' + NEGOCIO.telefonos + ' · ' + NEGOCIO.correo + ' · ' + NEGOCIO.instagram, 11, false, '#6b6478', 2);
  parrafo(NEGOCIO.direccion + ' · Respaldado por Ópticas Luna', 11, false, '#6b6478', 2);
  y += M;
  return { ancho: Math.round(W * k), alto: Math.round(y * k) };
}
function generarImagenEvidencia(doc, escala) {
  var k = escala || 1.5;
  var c = doc.cliente || {};
  return Promise.all([
    cargarImagen('logo.png').catch(function () { return null; }),
    cargarImagenSegura(c.ineFrenteUrl || ''),
    cargarImagenSegura(c.rostroUrl || ''),
    cargarImagenSegura(c.firmaTerminosUrl || ''),
    cargarImagenSegura(doc.firmaEntregaUrl || '')
  ]).then(function (res) {
    var logo = res[0];
    var imgs = { ine: res[1], rostro: res[2], firmaTerminos: res[3], firmaEntrega: res[4] };
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible.');
    var dims;
    try { dims = dibujarEvidencia(ctx, doc, logo, imgs, k, false); } catch (e) { throw new Error('al medir la evidencia: ' + e.message); }
    if (!dims || !dims.ancho || !dims.alto) throw new Error('No se pudo medir la evidencia.');
    canvas.width = dims.ancho;
    canvas.height = dims.alto;
    ctx = canvas.getContext('2d');
    ctx.scale(k, k);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, dims.ancho / k, dims.alto / k);
    dibujarEvidencia(ctx, doc, logo, imgs, k, true);
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) reject(new Error('No se pudo exportar el PNG.'));
        else resolve(blob);
      }, 'image/png');
    });
  });
}
/* ---------------- Compartir por WhatsApp (v2.0.4, Detalle 2) ----------
   La imagen ya está PRE-GENERADA (prepararImagenDoc, al abrir la
   vista), así que compartirDoc es SÍNCRONO: construye el File y llama
   a navigator.share dentro del toque, sin awaits de por medio. Antes
   la imagen se generaba DESPUÉS del toque y el gesto expiraba: por
   eso fallaba el primer intento ("Must be handling a user gesture")
   y el segundo ya funcionaba (logo en caché). El respaldo de
   solo-texto (wa.me) se mantiene, pero ya no debería necesitarse. */
function prepararImagenDoc() {
  var btn = $('btnDocCompartir');
  var kind = state.currentDoc && state.currentDoc.kind;
  var d = state.currentTanda;
  state.docImg = { key: null, blob: null, listo: false };
  if (!kind || !d || !btn) return;
  btn.disabled = true;
  btn.textContent = 'Generando imagen…';
  var key = kind + ':' + (d.tanda ? d.tanda.id : (d.id || ''));
  var generar = null, escala = 2, escalaBaja = 1;
  if (kind === 'tarjeta') { generar = generarImagenTarjeta; escala = 2; }
  else if (kind === 'orden') { generar = generarImagenOrden; escala = 2; }
  else if (kind === 'reglamento') { generar = generarImagenCarta; escala = 1.5; }
  else if (kind === 'evidencia') { generar = generarImagenEvidencia; escala = 1.5; }
  if (!generar) { btn.disabled = false; btn.textContent = 'Compartir por WhatsApp'; return; }
  generar(d, escala).catch(function () { return generar(d, escalaBaja); }).then(function (blob) {
    // Si el usuario ya abrió otro documento, no sobreescribir su imagen.
    if (!state.currentDoc || state.currentDoc.kind !== kind) return;
    state.docImg = { key: key, blob: blob, listo: true };
    btn.disabled = false;
    btn.textContent = 'Compartir por WhatsApp';
  }).catch(function (e) {
    // La imagen no se pudo generar: el botón queda habilitado y el
    // compartir cae al respaldo de solo-texto.
    if (!state.currentDoc || state.currentDoc.kind !== kind) return;
    btn.disabled = false;
    btn.textContent = 'Compartir por WhatsApp';
    showError('No se pudo generar la imagen del documento: ' + e.message + ' Se compartirá solo el texto.');
  });
}
function mensajeDoc(kind, d) {
  if (kind === 'orden') return mensajeOrden(d);
  if (kind === 'evidencia') {
    var nombre = (d.cliente && d.cliente.nombre) || '';
    return 'Hola ' + nombre + ', te compartimos tu hoja de evidencia de Tanda Visual (tanda ' + (d.id || '') + ', Nº ' + (d.numero || '') + ').';
  }
  if (kind === 'reglamento') {
    var nombre2 = (d.cliente && d.cliente.nombre) || '';
    return 'Hola ' + nombre2 + ', te compartimos tu carta de bienvenida de Tanda Visual con el reglamento y los términos y condiciones. Léela con calma: ahí vienen tus fechas de pago y tu entrega.';
  }
  return mensajeTarjeta(d);
}
function compartirTextoDoc(textoMsg, d) {
  var tel = (d.cliente && d.cliente.telefono) || '';
  if (navigator.share) {
    navigator.share({ title: 'Tanda Visual', text: textoMsg }).catch(function () {
      window.open(waLink(tel, textoMsg), '_blank');
    });
  } else {
    window.open(waLink(tel, textoMsg), '_blank');
  }
}
function compartirDoc() {
  var kind = state.currentDoc && state.currentDoc.kind;
  var d = state.currentTanda;
  if (!kind || !d) return;
  var textoMsg = mensajeDoc(kind, d);
  var folio = String(d.tanda ? d.tanda.id : (d.id || kind)).replace(/[^A-Za-z0-9]/g, '');
  var prefijo = kind === 'orden' ? 'orden-' : kind === 'tarjeta' ? 'tarjeta-' : kind === 'evidencia' ? 'evidencia-' : 'carta-';
  var nombreArchivo = prefijo + folio + '.png';
  var img = state.docImg;
  if (img && img.listo && img.blob) {
    var archivo = new File([img.blob], nombreArchivo, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      // Llamada SÍNCRONA dentro del toque (la imagen ya está lista).
      navigator.share({ files: [archivo], title: 'Tanda Visual — ' + nombreArchivo, text: textoMsg }).catch(function (e) {
        if (e && e.name === 'AbortError') return;
        showError('No se pudo compartir la imagen. Se comparte el texto.');
        compartirTextoDoc(textoMsg, d);
      });
      return;
    }
    // Sin menú para compartir archivos: descargar el PNG.
    var url = URL.createObjectURL(img.blob);
    var a = document.createElement('a');
    a.href = url; a.download = nombreArchivo;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    showError('No se pudo abrir el menú para compartir: se descargó "' + nombreArchivo + '" — envíalo desde Descargas por WhatsApp.');
    return;
  }
  // Sin imagen lista (no debería pasar: el botón se deshabilita hasta
  // que esté): respaldo de solo-texto, dentro del gesto.
  compartirTextoDoc(textoMsg, d);
}
function cablearDoc() {
  $('btnDocVolver').addEventListener('click', function () {
    if (state.currentTanda && state.currentTanda.id) abrirFicha(state.currentTanda.id);
    else { show('home'); cargarPanel(); }
  });
  $('btnDocImprimir').addEventListener('click', imprimirDoc);
  $('btnDocCompartir').addEventListener('click', compartirDoc);
}
document.addEventListener('DOMContentLoaded', cablearDoc);
