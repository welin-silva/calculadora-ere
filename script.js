// script.js

// -----------------------------------------------------------
// 1) Funciones auxiliares para parsear fechas y hacer cálculos
// -----------------------------------------------------------

// Parsea un string "dd/MM/yyyy" a objeto Date.
// Si el formato no es válido, devuelve null.
function parseFecha(str) {
  const partes = str.split('/');
  if (partes.length !== 3) return null;
  const day = parseInt(partes[0], 10);
  const month = parseInt(partes[1], 10) - 1; // mesIndex de 0 a 11
  const year = parseInt(partes[2], 10);
  const date = new Date(year, month, day);
  // Verificar que la fecha generada coincide exactamente
  if (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  ) {
    return date;
  }
  return null;
}

// Calcula la edad (años completos) entre fechaNac y fechaRef.
function calcularEdad(fechaNac, fechaRef) {
  let edad = fechaRef.getFullYear() - fechaNac.getFullYear();
  const mesDiff = fechaRef.getMonth() - fechaNac.getMonth();
  const diaDiff = fechaRef.getDate() - fechaNac.getDate();
  if (mesDiff < 0 || (mesDiff === 0 && diaDiff < 0)) {
    edad--;
  }
  return Math.max(edad, 0);
}

// Calcula la antigüedad en años (decimales) entre fechaAlta y fechaRef.
function calcularAntiguedad(fechaAlta, fechaRef) {
  const diffMs = fechaRef - fechaAlta; // diferencia en milisegundos
  const dias = diffMs / (1000 * 60 * 60 * 24);
  return dias / 365.25;
}

// Calcula el número de meses completos entre dos fechas.
// Si fecha2 < fecha1, devuelve 0.
function calcularMesesEntre(fecha1, fecha2) {
  if (fecha2 <= fecha1) return 0;
  const year1 = fecha1.getFullYear();
  const month1 = fecha1.getMonth();
  const day1 = fecha1.getDate();

  const year2 = fecha2.getFullYear();
  const month2 = fecha2.getMonth();
  const day2 = fecha2.getDate();

  let meses = (year2 - year1) * 12 + (month2 - month1);
  // Si el día2 es menor que el día1, restamos 1 mes 
  if (day2 < day1) {
    meses--;
  }
  return Math.max(meses, 0);
}

// Calcula IRPF aproximado para una baseImponible usando tramos progresivos.
function calcularIrpf(base) {
  let impuesto = 0;
  let restante = base;
  const tramos = [
    { limInf:   0, limSup:  12450, tasa: 0.19 },
    { limInf: 12450, limSup:  20200, tasa: 0.24 },
    { limInf: 20200, limSup:  35200, tasa: 0.30 },
    { limInf: 35200, limSup:  60000, tasa: 0.37 },
    { limInf: 60000, limSup: Infinity, tasa: 0.45 },
  ];

  for (const tramo of tramos) {
    if (restante <= 0) break;
    const ancho = tramo.limSup - tramo.limInf;
    if (restante > ancho) {
      impuesto += ancho * tramo.tasa;
      restante -= ancho;
    } else {
      impuesto += restante * tramo.tasa;
      break;
    }
  }
  return impuesto;
}

// Dado un importe bruto de indemnización, devuelve un objeto:
// { bruta, exento, exceso, baseImponible, irpf, neto }.
function desglosarIndemnizacion(bruta) {
  const LIMITE_EXENTO = 180000;
  const exento = Math.min(bruta, LIMITE_EXENTO);
  const exceso = bruta > LIMITE_EXENTO ? bruta - LIMITE_EXENTO : 0;
  const baseImponible = exceso * 0.7; // solo se integra el 70% del exceso
  const irpf = calcularIrpf(baseImponible);
  const neto = bruta - irpf;
  return { bruta, exento, exceso, baseImponible, irpf, neto };
}

// -----------------------------------------------------------
// 2) Referencias al DOM
// -----------------------------------------------------------

const form                = document.getElementById('form-calculo');
const resultadoDiv        = document.getElementById('resultado');

const txtEdad             = document.getElementById('txtEdad');
const txtAntiguedad       = document.getElementById('txtAntiguedad');
const txtSalarioCon       = document.getElementById('txtSalarioCon');
const txtSalarioSin       = document.getElementById('txtSalarioSin');

const bloqueMenor55       = document.getElementById('bloqueMenor55');
const bloqueMayor55       = document.getElementById('bloqueMayor55');

const volConContainer     = document.getElementById('volConContainer');
const volConBruta         = document.getElementById('volConBruta');
const volConExento        = document.getElementById('volConExento');
const volConExceso        = document.getElementById('volConExceso');
const volConBase          = document.getElementById('volConBase');
const volConIrpf          = document.getElementById('volConIrpf');
const volConNeto          = document.getElementById('volConNeto');

const volSinContainer     = document.getElementById('volSinContainer');
const volSinBruta         = document.getElementById('volSinBruta');
const volSinExento        = document.getElementById('volSinExento');
const volSinExceso        = document.getElementById('volSinExceso');
const volSinBase          = document.getElementById('volSinBase');
const volSinIrpf          = document.getElementById('volSinIrpf');
const volSinNeto          = document.getElementById('volSinNeto');

const legalContainer      = document.getElementById('legalContainer');
const legAntesBruta       = document.getElementById('legAntesBruta');
const legDespuesBruta     = document.getElementById('legDespuesBruta');
const legTotalBruta       = document.getElementById('legTotalBruta');
const legExento           = document.getElementById('legExento');
const legExceso           = document.getElementById('legExceso');
const legBase             = document.getElementById('legBase');
const legIrpf             = document.getElementById('legIrpf');
const legNeto             = document.getElementById('legNeto');

const mayor61Container    = document.getElementById('mayor61');
const ind61BrutaEl        = document.getElementById('ind61Bruta');
const tope24mEl           = document.getElementById('tope24m');
const tope75000El         = document.getElementById('tope75000');
const ind61AplicadaEl     = document.getElementById('ind61Aplicada');
const exento61El          = document.getElementById('exento61');
const exceso61El          = document.getElementById('exceso61');
const base61El            = document.getElementById('base61');
const irpf61El            = document.getElementById('irpf61');
const neto61El            = document.getElementById('neto61');

const mayor55_58Container = document.getElementById('mayor55_58');
const salarioMensualBEl   = document.getElementById('salarioMensualB');
const porcentajeBEl       = document.getElementById('porcentajeB');
const rentaMensualBEl     = document.getElementById('rentaMensualB');
const mesesBEl            = document.getElementById('mesesB');
const rentaTotalBEl       = document.getElementById('rentaTotalB');

const mayor59_60Container = document.getElementById('mayor59_60');
const salarioMensualCEl   = document.getElementById('salarioMensualC');
const porcentajeCEl       = document.getElementById('porcentajeC');
const rentaMensualCEl     = document.getElementById('rentaMensualC');
const mesesCEl            = document.getElementById('mesesC');
const rentaTotalCEl       = document.getElementById('rentaTotalC');

const menor55NoAplicaEl   = document.getElementById('menor55NoAplica');

const botonPDF            = document.getElementById('botonPDF');
const descargarPdfBtn      = document.getElementById('descargarPdf');

// Objeto en memoria para volcar datos exactos al PDF
let datosParaPDF = {};

// -----------------------------------------------------------
// 3) Manejador de “submit” del formulario
// -----------------------------------------------------------
form.addEventListener('submit', (event) => {
  event.preventDefault();

  // 3.1) Leer valores del formulario
  const fechaNacimientoStr = document.getElementById('fechaNacimiento').value.trim();
  const fechaAltaStr       = document.getElementById('fechaAlta').value.trim();
  const fechaCeseStr       = document.getElementById('fechaCese').value.trim();
  const salarioFijo        = parseFloat(document.getElementById('salarioFijo').value);
  const complementos       = parseFloat(document.getElementById('complementos').value);

  // 3.2) Parsear fechas a Date
  const fechaNacimiento = parseFecha(fechaNacimientoStr);
  const fechaAlta       = parseFecha(fechaAltaStr);
  const fechaCese       = parseFecha(fechaCeseStr);

  if (!fechaNacimiento || !fechaAlta || !fechaCese) {
    alert('Por favor, introduce fechas válidas en formato dd/MM/yyyy.');
    return;
  }
  if (isNaN(salarioFijo) || isNaN(complementos)) {
    alert('Por favor, introduce valores numéricos en salario y complementos.');
    return;
  }

  // 3.3) Calcular edad y antigüedad
  const edad  = calcularEdad(fechaNacimiento, fechaCese);
  const antig = calcularAntiguedad(fechaAlta, fechaCese);

  // Guardar datos básicos para PDF
  datosParaPDF.fechaNacimientoStr = fechaNacimientoStr;
  datosParaPDF.fechaAltaStr       = fechaAltaStr;
  datosParaPDF.fechaCeseStr       = fechaCeseStr;
  datosParaPDF.salarioFijo        = salarioFijo;
  datosParaPDF.complementos       = complementos;
  datosParaPDF.edad               = edad;
  datosParaPDF.antiguedad         = antig;

  // 3.4) Pintar en pantalla edad / antigüedad
  txtEdad.textContent       = edad.toString();
  txtAntiguedad.textContent = antig.toFixed(2);

  // 3.5) Calcular salario con/sin complementos y pintar
  const salarioCon = salarioFijo + complementos;
  const salarioSin = salarioFijo;
  txtSalarioCon.textContent = salarioCon.toFixed(2);
  txtSalarioSin.textContent = salarioSin.toFixed(2);
  datosParaPDF.salarioCon = salarioCon;
  datosParaPDF.salarioSin = salarioSin;

  // 3.6) Mostrar contenedor de resultados
  resultadoDiv.style.display = 'block';

  // 3.7) Lógica según edad
  if (edad < 55) {
    //---------------------------------------------------
    //  === MENOR DE 55: VOLUNTARIA + LEGAL UNIFICADO ===
    //---------------------------------------------------
    bloqueMenor55.style.display = 'block';
    bloqueMayor55.style.display = 'none';

    // -- Voluntaria 50 días --
    const brutoVolCon = (salarioCon / 365) * (50 * antig);
    const desgVolCon  = desglosarIndemnizacion(brutoVolCon);

    const brutoVolSin = (salarioSin / 365) * (50 * antig);
    const desgVolSin  = desglosarIndemnizacion(brutoVolSin);

    if (complementos > 0) {
      // Mostrar SOLO tabla “Con complementos”
      volConContainer.style.display = 'block';
      volSinContainer.style.display = 'none';

      volConBruta.textContent  = desgVolCon.bruta.toFixed(2);
      volConExento.textContent = desgVolCon.exento.toFixed(2);
      volConExceso.textContent = desgVolCon.exceso.toFixed(2);
      volConBase.textContent   = desgVolCon.baseImponible.toFixed(2);
      volConIrpf.textContent   = desgVolCon.irpf.toFixed(2);
      volConNeto.textContent   = desgVolCon.neto.toFixed(2);

      datosParaPDF.desgVolCon = desgVolCon;
    } else {
      // Mostrar SOLO tabla “Sin complementos”
      volConContainer.style.display = 'none';
      volSinContainer.style.display = 'block';

      volSinBruta.textContent  = desgVolSin.bruta.toFixed(2);
      volSinExento.textContent = desgVolSin.exento.toFixed(2);
      volSinExceso.textContent = desgVolSin.exceso.toFixed(2);
      volSinBase.textContent   = desgVolSin.baseImponible.toFixed(2);
      volSinIrpf.textContent   = desgVolSin.irpf.toFixed(2);
      volSinNeto.textContent   = desgVolSin.neto.toFixed(2);

      datosParaPDF.desgVolSin = desgVolSin;
    }

    // -- LEGAL (unificado) --
    const fechaReforma = new Date(2012, 1, 12); // 12 feb 2012

    let antiguedadAntes   = 0;
    let antiguedadDespues = 0;

    if (fechaAlta < fechaReforma) {
      const finTramo = fechaCese < fechaReforma ? fechaCese : fechaReforma;
      antiguedadAntes = calcularAntiguedad(fechaAlta, finTramo);
      if (fechaCese > fechaReforma) {
        antiguedadDespues = calcularAntiguedad(fechaReforma, fechaCese);
      }
    } else {
      antiguedadAntes   = 0;
      antiguedadDespues = calcularAntiguedad(fechaAlta, fechaCese);
    }

    // Importes brutos de cada tramo
    let brutoAntesCon   = (salarioCon / 365) * (45 * antiguedadAntes);
    let brutoDespuesCon = (salarioCon / 365) * (33 * antiguedadDespues);

    let brutoAntesSin   = (salarioSin / 365) * (45 * antiguedadAntes);
    let brutoDespuesSin = (salarioSin / 365) * (33 * antiguedadDespues);

    let totalBruta, desgTotal;
    if (complementos > 0) {
      totalBruta = brutoAntesCon + brutoDespuesCon;
      desgTotal  = desglosarIndemnizacion(totalBruta);
    } else {
      totalBruta = brutoAntesSin + brutoDespuesSin;
      desgTotal  = desglosarIndemnizacion(totalBruta);
    }

    // Volcar al DOM
    if (complementos > 0) {
      legAntesBruta.textContent   = brutoAntesCon.toFixed(2);
      legDespuesBruta.textContent = brutoDespuesCon.toFixed(2);
    } else {
      legAntesBruta.textContent   = brutoAntesSin.toFixed(2);
      legDespuesBruta.textContent = brutoDespuesSin.toFixed(2);
    }
    legTotalBruta.textContent = totalBruta.toFixed(2);
    legExento.textContent     = desgTotal.exento.toFixed(2);
    legExceso.textContent     = desgTotal.exceso.toFixed(2);
    legBase.textContent       = desgTotal.baseImponible.toFixed(2);
    legIrpf.textContent       = desgTotal.irpf.toFixed(2);
    legNeto.textContent       = desgTotal.neto.toFixed(2);

    // Guardar para PDF
    datosParaPDF.legAntesBruta   = parseFloat(legAntesBruta.textContent);
    datosParaPDF.legDespuesBruta = parseFloat(legDespuesBruta.textContent);
    datosParaPDF.legTotalBruta   = parseFloat(legTotalBruta.textContent);
    datosParaPDF.legExento       = parseFloat(legExento.textContent);
    datosParaPDF.legExceso       = parseFloat(legExceso.textContent);
    datosParaPDF.legBase         = parseFloat(legBase.textContent);
    datosParaPDF.legIrpf         = parseFloat(legIrpf.textContent);
    datosParaPDF.legNeto         = parseFloat(legNeto.textContent);

    legalContainer.style.display = 'block';
    menor55NoAplicaEl.style.display = 'none';
    mayor61Container.style.display = 'none';
    mayor55_58Container.style.display = 'none';
    mayor59_60Container.style.display = 'none';

    botonPDF.style.display = 'block';

  } else {
    //--------------------------------------------
    //  === MAYORES DE 55: A/B/C/D SEGÚN EDAD ===
    //--------------------------------------------
    bloqueMenor55.style.display = 'none';
    bloqueMayor55.style.display = 'block';

    // Primero ocultamos TODOS los sub‐bloques para ir activando el que corresponda
    mayor61Container.style.display    = 'none';
    mayor55_58Container.style.display = 'none';
    mayor59_60Container.style.display = 'none';
    menor55NoAplicaEl.style.display   = 'none';

    const cumple10 = antig >= 10.0;
    datosParaPDF.esMenor55         = false;
    datosParaPDF.esMayor55Eligible = cumple10;

    // A) Edad >= 61 años (a 31/12/2025) y antig >= 10
    if (edad >= 61 && cumple10) {
      mayor61Container.style.display = 'block';

      // Cálculo de indemnización 30días/año, tope 24 mensualidades y 75 000€
      // 1) Importe bruto sin tope = (salarioCon / 365) * (30 * antig)
      const libreBruta = (salarioCon / 365) * (30 * antig);

      // 2) Tope 24 mensualidades = (salarioCon / 12) * 24 = salarioCon * 2
      const tope24m = salarioCon * 2;

      // 3) Se elige el menor entre: libreBruta, tope24m, 75000
      const brutoAplicada = Math.min(libreBruta, tope24m, 75000);

      const desg = desglosarIndemnizacion(brutoAplicada);

      // Pinta en DOM
      ind61BrutaEl.textContent    = libreBruta.toFixed(2);
      tope24mEl.textContent       = tope24m.toFixed(2);
      tope75000El.textContent     = '75 000.00';
      ind61AplicadaEl.textContent = brutoAplicada.toFixed(2);
      exento61El.textContent      = desg.exento.toFixed(2);
      exceso61El.textContent      = desg.exceso.toFixed(2);
      base61El.textContent        = desg.baseImponible.toFixed(2);
      irpf61El.textContent        = desg.irpf.toFixed(2);
      neto61El.textContent        = desg.neto.toFixed(2);

      // Guardar para PDF
      datosParaPDF.ind61LibreBruta    = libreBruta;
      datosParaPDF.ind61Tope24m       = tope24m;
      datosParaPDF.ind61BrutaAplicada = brutoAplicada;
      datosParaPDF.desg61 = desg;

      // Desactivar otros bloques
      mayor55_58Container.style.display = 'none';
      mayor59_60Container.style.display = 'none';
      menor55NoAplicaEl.style.display   = 'none';

      botonPDF.style.display = 'block';
      return;
    }

    // D. Personas menores de 55 años (si accidentalmente entran aquí)
    if (edad < 55) {
      menor55NoAplicaEl.style.display = 'block';
      botonPDF.style.display = 'none';
      return;
    }

    // Si no cumplen 10 años, no son elegibles para B ni C
    if (!cumple10) {
      mayor55_58Container.style.display = 'none';
      mayor59_60Container.style.display = 'none';
      menor55NoAplicaEl.textContent = 'Para acogerte como mayor de 55 años necesitas al menos 10 años de antigüedad.';
      menor55NoAplicaEl.style.display = 'block';
      botonPDF.style.display = 'none';
      return;
    }

    // B) Edad entre 55 y 58 (inclusive) a 31/12/2025 y antig ≥ 10
    if (edad >= 55 && edad <= 58 && cumple10) {
      mayor55_58Container.style.display = 'block';

      // Salario mensual de referencia
      const salarioMensual = salarioCon / 12;
      const porcentaje     = 0.75; // 75%
      const rentaMensual   = salarioMensual * porcentaje;

      // Fecha en que cumple 63 años:
      const fecha63 = new Date(fechaNacimiento);
      fecha63.setFullYear(fechaNacimiento.getFullYear() + 63);

      // Meses desde fecha de cese hasta fecha63
      const mesesHasta63 = calcularMesesEntre(fechaCese, fecha63);

      const rentaTotal = rentaMensual * mesesHasta63;

      // Pintar en DOM
      salarioMensualBEl.textContent = salarioMensual.toFixed(2);
      porcentajeBEl.textContent     = '75 %';
      rentaMensualBEl.textContent   = rentaMensual.toFixed(2);
      mesesBEl.textContent          = mesesHasta63.toString();
      rentaTotalBEl.textContent     = rentaTotal.toFixed(2);

      // Guardar para PDF
      datosParaPDF.salarioMensualB   = salarioMensual;
      datosParaPDF.porcentajeB       = porcentaje;
      datosParaPDF.rentaMensualB     = rentaMensual;
      datosParaPDF.mesesHasta63_B    = mesesHasta63;
      datosParaPDF.rentaTotalB       = rentaTotal;

      mayor59_60Container.style.display = 'none';
      menor55NoAplicaEl.style.display   = 'none';

      botonPDF.style.display = 'block';
      return;
    }

    // C) Edad entre 59 y 60 (inclusive) a 31/12/2025 y antig ≥ 10
    if (edad >= 59 && edad <= 60 && cumple10) {
      mayor59_60Container.style.display = 'block';

      // Salario mensual de referencia
      const salarioMensual = salarioCon / 12;
      const porcentaje     = 0.80; // 80%
      const rentaMensual   = salarioMensual * porcentaje;

      // Fecha en que cumple 63 años:
      const fecha63 = new Date(fechaNacimiento);
      fecha63.setFullYear(fechaNacimiento.getFullYear() + 63);

      // Meses desde fecha de cese hasta fecha63
      const mesesHasta63 = calcularMesesEntre(fechaCese, fecha63);

      const rentaTotal = rentaMensual * mesesHasta63;

      // Pintar en DOM
      salarioMensualCEl.textContent = salarioMensual.toFixed(2);
      porcentajeCEl.textContent     = '80 %';
      rentaMensualCEl.textContent   = rentaMensual.toFixed(2);
      mesesCEl.textContent          = mesesHasta63.toString();
      rentaTotalCEl.textContent     = rentaTotal.toFixed(2);

      // Guardar para PDF
      datosParaPDF.salarioMensualC   = salarioMensual;
      datosParaPDF.porcentajeC       = porcentaje;
      datosParaPDF.rentaMensualC     = rentaMensual;
      datosParaPDF.mesesHasta63_C    = mesesHasta63;
      datosParaPDF.rentaTotalC       = rentaTotal;

      menor55NoAplicaEl.style.display   = 'none';

      botonPDF.style.display = 'block';
      return;
    }

    // Si llegamos aquí y edad ≥55 pero no entra en A, B ni C, significa edad EXACTA 59/60 sin antigüedad        
    menor55NoAplicaEl.textContent = 'No cumples las condiciones específicas para Prejubilación (B o C).';
    menor55NoAplicaEl.style.display = 'block';
    botonPDF.style.display = 'none';
  }
});

// -----------------------------------------------------------
// 4) Generación de PDF con jsPDF
// -----------------------------------------------------------
descargarPdfBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 15;
  const xLabel = 10;
  const xValue = 80;

  doc.setFontSize(16);
  doc.text('Resumen de Cálculos y Análisis', 105, y, { align: 'center' });
  y += 10;

  doc.setFontSize(11);
  const hoy = new Date();
  const hoyStr =
    String(hoy.getDate()).padStart(2, '0') + '/' +
    String(hoy.getMonth() + 1).padStart(2, '0') + '/' +
    hoy.getFullYear();
  doc.text(`Fecha de generación: ${hoyStr}`, xLabel, y);
  y += 6;
  doc.text('Situación: Opción Voluntaria ERE / Prejubilación', xLabel, y);
  y += 10;

  // ---- Datos Personales ----
  doc.setFontSize(13);
  doc.text('Datos Personales', xLabel, y);
  y += 7;
  doc.setFontSize(11);
  doc.text(
    `- Fecha de nacimiento: ${datosParaPDF.fechaNacimientoStr} (Edad: ${datosParaPDF.edad} años)`,
    xLabel,
    y
  );
  y += 6;
  doc.text(
    `- Fecha de alta: ${datosParaPDF.fechaAltaStr} (Antigüedad: ${datosParaPDF.antiguedad.toFixed(2)} años)`,
    xLabel,
    y
  );
  y += 6;
  doc.text(`- Fecha de cese: ${datosParaPDF.fechaCeseStr}`, xLabel, y);
  y += 10;

  // ---- Salarios ----
  doc.setFontSize(13);
  doc.text('Salarios', xLabel, y);
  y += 7;
  doc.setFontSize(11);
  doc.text(
    `- Salario fijo anual: ${datosParaPDF.salarioFijo.toFixed(2)} €`, 
    xLabel, y
  );
  y += 6;
  doc.text(
    `- Complementos anuales: ${datosParaPDF.complementos.toFixed(2)} €`, 
    xLabel, y
  );
  y += 6;
  doc.text(
    `- Salario total (con complementos): ${datosParaPDF.salarioCon.toFixed(2)} €`, 
    xLabel, y
  );
  y += 6;
  doc.text(
    `- Salario total (sin complementos): ${datosParaPDF.salarioSin.toFixed(2)} €`, 
    xLabel, y
  );
  y += 10;

  // ---- MENOR DE 55 ----
  if (datosParaPDF.edad < 55) {
    doc.setFontSize(13);
    doc.text('Menor de 55 años – Indemnizaciones', xLabel, y);
    y += 7;
    doc.setFontSize(11);

    // VOLUNTARIA 50 días
    if (datosParaPDF.complementos > 0) {
      doc.text(
        '1) Indemnización VOLUNTARIA a 50 días – CON complementos',
        xLabel,
        y
      );
      y += 6;
      const vCon = datosParaPDF.desgVolCon;
      doc.text('- Indemnización Bruta:', xLabel, y);
      doc.text(vCon.bruta.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Exento:', xLabel, y);
      doc.text(vCon.exento.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Exceso:', xLabel, y);
      doc.text(vCon.exceso.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Base Imponible (70%):', xLabel, y);
      doc.text(vCon.baseImponible.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- IRPF Aproximado:', xLabel, y);
      doc.text(vCon.irpf.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Indemnización Neta:', xLabel, y);
      doc.text(vCon.neto.toFixed(2) + ' €', xValue, y); y += 8;
    } else {
      doc.text(
        '1) Indemnización VOLUNTARIA a 50 días – SIN complementos',
        xLabel,
        y
      );
      y += 6;
      const vSin = datosParaPDF.desgVolSin;
      doc.text('- Indemnización Bruta:', xLabel, y);
      doc.text(vSin.bruta.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Exento:', xLabel, y);
      doc.text(vSin.exento.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Exceso:', xLabel, y);
      doc.text(vSin.exceso.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Base Imponible (70%):', xLabel, y);
      doc.text(vSin.baseImponible.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- IRPF Aproximado:', xLabel, y);
      doc.text(vSin.irpf.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Indemnización Neta:', xLabel, y);
      doc.text(vSin.neto.toFixed(2) + ' €', xValue, y); y += 8;
    }

    // LEGAL unificado
    doc.text('2) Indemnización LEGAL', xLabel, y);
    y += 6;
    doc.text('- Antes 12/02/2012 (45 días/año):', xLabel, y);
    doc.text(datosParaPDF.legAntesBruta.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- Después 12/02/2012 (33 días/año):', xLabel, y);
    doc.text(datosParaPDF.legDespuesBruta.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- Indemnización Bruta TOTAL:', xLabel, y);
    doc.text(datosParaPDF.legTotalBruta.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- Exento:', xLabel, y);
    doc.text(datosParaPDF.legExento.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- Exceso:', xLabel, y);
    doc.text(datosParaPDF.legExceso.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- Base Imponible (70%):', xLabel, y);
    doc.text(datosParaPDF.legBase.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- IRPF Aproximado:', xLabel, y);
    doc.text(datosParaPDF.legIrpf.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- Indemnización Neta:', xLabel, y);
    doc.text(datosParaPDF.legNeto.toFixed(2) + ' €', xValue, y); y += 8;

  } else {
    //--------------------------------------------
    //  === MAYORES DE 55: A/B/C/D ===
    //--------------------------------------------
    doc.setFontSize(13);
    doc.text('Mayor de 55 años – Prejubilación/Indemnización', xLabel, y);
    y += 7;
    doc.setFontSize(11);

    // A) Edad ≥ 61
    if (datosParaPDF.edad >= 61 && datosParaPDF.antiguedad >= 10) {
      doc.text(
        'A) 61 o más años y antigüedad ≥ 10 años → Indemnización 30 días/año',
        xLabel,
        y
      );
      y += 6;
      doc.text(
        `- Indemnización Bruta (30días × antigüedad): ${datosParaPDF.ind61LibreBruta.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Tope 24 mensualidades: ${datosParaPDF.ind61Tope24m.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Tope 75 000 €: 75 000,00 €`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Indemnización Bruta Aplicada: ${datosParaPDF.ind61BrutaAplicada.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Exento: ${datosParaPDF.desg61.exento.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Exceso: ${datosParaPDF.desg61.exceso.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Base Imponible (70 % del exceso): ${datosParaPDF.desg61.baseImponible.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- IRPF aproximado: ${datosParaPDF.desg61.irpf.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Indemnización Neta: ${datosParaPDF.desg61.neto.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 10;
    }
    // B) Edad 55–58
    else if (datosParaPDF.edad >= 55 && datosParaPDF.edad <= 58 && datosParaPDF.antiguedad >= 10) {
      doc.text(
        'B) 55 – 58 años y antigüedad ≥ 10 años → Renta temporal mensual al 75 %',
        xLabel,
        y
      );
      y += 6;
      doc.text(
        `- Salario Mensual de Referencia: ${datosParaPDF.salarioMensualB.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Porcentaje aplicado: 75 %`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Renta Mensual: ${datosParaPDF.rentaMensualB.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Duración (meses hasta los 63 años): ${datosParaPDF.mesesHasta63_B} meses`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Renta Total Temporal: ${datosParaPDF.rentaTotalB.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 10;
    }
    // C) Edad 59–60
    else if (datosParaPDF.edad >= 59 && datosParaPDF.edad <= 60 && datosParaPDF.antiguedad >= 10) {
      doc.text(
        'C) 59 – 60 años y antigüedad ≥ 10 años → Renta temporal mensual al 80 %',
        xLabel,
        y
      );
      y += 6;
      doc.text(
        `- Salario Mensual de Referencia: ${datosParaPDF.salarioMensualC.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Porcentaje aplicado: 80 %`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Renta Mensual: ${datosParaPDF.rentaMensualC.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Duración (meses hasta los 63 años): ${datosParaPDF.mesesHasta63_C} meses`,
        xLabel,
        y
      );
      y += 5;
      doc.text(
        `- Renta Total Temporal: ${datosParaPDF.rentaTotalC.toFixed(2)} €`,
        xLabel,
        y
      );
      y += 10;
    }
    // D) Menos de 55 → no debería llegar aquí
    else {
      doc.setTextColor(192, 57, 43);
      doc.text(
        'No cumples las condiciones para Prejubilación (o eres menor de 55 años).',
        xLabel,
        y
      );
      y += 10;
      doc.setTextColor(0, 0, 0);
    }
  }

  // Pie de nota
  doc.setFontSize(9);
  doc.text(
    '* Estos cálculos son aproximados. Consulta con un asesor laboral y fiscal.',
    xLabel,
    y
  );

  // Descargar el PDF
  doc.save('Resumen_Indemnizacion.pdf');
});
// -----------------------------------------------------------
// [MÁSCARA] Auto‐inserción de "/" en campos de fecha dd/MM/yyyy
// -----------------------------------------------------------

/**
 * Toma un input de tipo texto (campo de fecha en formato dd/MM/yyyy)
 * y, en cuanto el usuario escribe, va insertando "/" automáticamente
 * tras los dos primeros dígitos y tras los siguientes dos.
 */
function aplicarMascaraFecha(inputElement) {
  inputElement.addEventListener('input', (event) => {
    // 1) Eliminamos todo lo que no sea dígito:
    let valor = event.target.value.replace(/\D/g, '');

    // 2) Limitar a máximo 8 dígitos (ddMMyyyy)
    if (valor.length > 8) {
      valor = valor.slice(0, 8);
    }

    // 3) Insertamos la primera "/" tras 2 dígitos, y la segunda tras 4:
    if (valor.length > 2) {
      valor = valor.slice(0, 2) + '/' + valor.slice(2);
    }
    if (valor.length > 5) {
      valor = valor.slice(0, 5) + '/' + valor.slice(5);
    }

    // 4) Asignamos el valor de vuelta al campo
    event.target.value = valor;
  });

  // Además, evitamos que el usuario pegue texto malformado:
  inputElement.addEventListener('paste', (event) => {
    event.preventDefault();
    // Obtenemos solo los dígitos del portapapeles
    const textoPegar = (event.clipboardData || window.clipboardData).getData('text');
    const soloDigitos = textoPegar.replace(/\D/g, '').slice(0, 8);

    // Reconstruimos con máscaras:
    let nuevoValor = soloDigitos;
    if (soloDigitos.length > 2) {
      nuevoValor = soloDigitos.slice(0, 2) + '/' + soloDigitos.slice(2);
    }
    if (soloDigitos.length > 4) {
      nuevoValor = nuevoValor.slice(0, 5) + '/' + soloDigitos.slice(4);
    }
    event.target.value = nuevoValor;
  });
}

// -----------------------------------------------------------
// 3) Invocación de la máscara sobre los tres campos de fecha
// -----------------------------------------------------------

// Esperamos a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  const fechaNacimientoEl = document.getElementById('fechaNacimiento');
  const fechaAltaEl       = document.getElementById('fechaAlta');
  const fechaCeseEl       = document.getElementById('fechaCese');

  aplicarMascaraFecha(fechaNacimientoEl);
  aplicarMascaraFecha(fechaAltaEl);
  aplicarMascaraFecha(fechaCeseEl);
});
