// -----------------------------------------------------------
// 1) Funciones auxiliares para parsear fechas y hacer cálculos
// -----------------------------------------------------------

// Parsea un string "dd/MM/yyyy" a objeto Date.
// Si el formato no es válido, devuelve null.
function parseFecha(str) {
  const partes = str.split('/');
  if (partes.length !== 3) return null;
  const day   = parseInt(partes[0], 10);
  const month = parseInt(partes[1], 10) - 1; // mesIndex 0–11
  const year  = parseInt(partes[2], 10);
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
  const dias   = diffMs / (1000 * 60 * 60 * 24);
  return dias / 365.25;
}

// Calcula el número de meses completos entre dos fechas.
// Si fecha2 < fecha1, devuelve 0.
function calcularMesesEntre(fecha1, fecha2) {
  if (fecha2 <= fecha1) return 0;
  const year1  = fecha1.getFullYear();
  const month1 = fecha1.getMonth();
  const day1   = fecha1.getDate();

  const year2  = fecha2.getFullYear();
  const month2 = fecha2.getMonth();
  const day2   = fecha2.getDate();

  let meses = (year2 - year1) * 12 + (month2 - month1);
  // Si día2 < día1, restamos un mes
  if (day2 < day1) meses--;
  return Math.max(meses, 0);
}

// -----------------------------------------------------------
// 2) Cálculo de IRPF “por tramos” (valores oficiales 2024/2025)
// -----------------------------------------------------------
// Tramos IRPF (suma estatal + autonómico aproximado):
//   0 –   12 450 €     → 19 %
//   12 450 – 20 200 € → 24 %
//   20 200 – 35 200 € → 30 %
//   35 200 – 60 000 € → 37 %
//   60 000 – 300 000 €→ 45 %
//   > 300 000 €       → 47 %
function calcularIrpf(base) {
  let impuesto = 0;
  let restante = base;
  const tramos = [
    { limInf:     0, limSup: 12450, tasa: 0.19 },
    { limInf: 12450, limSup: 20200, tasa: 0.24 },
    { limInf: 20200, limSup: 35200, tasa: 0.30 },
    { limInf: 35200, limSup: 60000, tasa: 0.37 },
    { limInf: 60000, limSup:300000, tasa: 0.45 },
    { limInf:300000, limSup:   Infinity, tasa: 0.47 },
  ];

  for (const tramo of tramos) {
    if (restante <= 0) break;
    const ancho = tramo.limSup - tramo.limInf;
    if (restante > ancho) {
      impuesto += ancho * tramo.tasa;
      restante -= ancho;
    } else {
      impuesto += restante * tramo.tasa;
      restante = 0;
      break;
    }
  }
  return impuesto;
}

// -----------------------------------------------------------
// 3) Desglose de indemnización hasta 180 000 € exentos
// -----------------------------------------------------------
// - Si bruta ≤ 180 000 € → exento = bruta, exceso = 0 → no IRPF
// - Si bruta > 180 000 € →
//     exento = 180 000 €,
//     exceso = bruta − 180 000 €,
//     baseImponible = exceso,
//     irpf = calcularIrpf(exceso),
//     neto = bruta − irpf
function desglosarIndemnizacion(bruta) {
  const LIMITE_EXENTO = 180000;
  let exento, exceso, baseImponible, irpf, neto;

  if (bruta <= LIMITE_EXENTO) {
    exento        = bruta;
    exceso        = 0;
    baseImponible = 0;
    irpf          = 0;
    neto          = bruta;
  } else {
    exento        = LIMITE_EXENTO;
    exceso        = bruta - LIMITE_EXENTO;
    baseImponible = exceso;
    irpf          = calcularIrpf(exceso);
    neto          = bruta - irpf;
  }

  return { bruta, exento, exceso, baseImponible, irpf, neto };
}

// -----------------------------------------------------------
// 4) Referencias al DOM
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

const retVolBrutaEl       = document.getElementById('retVolBruta');
const retVolExentoEl      = document.getElementById('retVolExento');
const retVolExcesoEl      = document.getElementById('retVolExceso');
const retVolBaseEl        = document.getElementById('retVolBase');
const retVolIrpfEl        = document.getElementById('retVolIrpf');
const retVolNetoEl        = document.getElementById('retVolNeto');

const retLegBrutaEl       = document.getElementById('retLegBruta');
const retLegExentoEl      = document.getElementById('retLegExento');
const retLegExcesoEl      = document.getElementById('retLegExceso');
const retLegBaseEl        = document.getElementById('retLegBase');
const retLegIrpfEl        = document.getElementById('retLegIrpf');
const retLegNetoEl        = document.getElementById('retLegNeto');

const retDifBrutaEl       = document.getElementById('retDifBruta');
const retDifExentoEl      = document.getElementById('retDifExento');
const retDifExcesoEl      = document.getElementById('retDifExceso');
const retDifBaseEl        = document.getElementById('retDifBase');
const retDifIrpfEl        = document.getElementById('retDifIrpf');
const retDifNetoEl        = document.getElementById('retDifNeto');

const retDifIrpfTramosEl  = document.getElementById('retDifIrpfTramos');
const retDifNetoTramosEl  = document.getElementById('retDifNetoTramos');

const retTotalSinVolEl    = document.getElementById('retTotalSinVol');
const retTotalSinLegEl    = document.getElementById('retTotalSinLeg');
const retTotalSinDifEl    = document.getElementById('retTotalSinDif');

const retTotalConVolEl    = document.getElementById('retTotalConVol');
const retTotalConLegEl    = document.getElementById('retTotalConLeg');
const retTotalConDifEl    = document.getElementById('retTotalConDif');

const totalGlobalSinEl    = document.getElementById('totalGlobalSin');
const totalGlobalConEl    = document.getElementById('totalGlobalCon');

const retencionesContainer = document.getElementById('retencionesContainer');

// Objeto en memoria para volcar datos exactos al PDF
let datosParaPDF = {};

// -----------------------------------------------------------
// 5) Manejador de “submit” del formulario
// -----------------------------------------------------------
form.addEventListener('submit', (event) => {
  event.preventDefault();

  // 5.1) Leer valores del formulario
  const fechaNacimientoStr = document.getElementById('fechaNacimiento').value.trim();
  const fechaAltaStr       = document.getElementById('fechaAlta').value.trim();
  const fechaCeseStr       = document.getElementById('fechaCese').value.trim();
  const salarioFijo        = parseFloat(document.getElementById('salarioFijo').value);
  const complementos       = parseFloat(document.getElementById('complementos').value);

  // 5.2) Parsear fechas a Date
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

  // 5.3) Calcular edad y antigüedad
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

  // 5.4) Pintar en pantalla edad / antigüedad
  txtEdad.textContent       = edad.toString();
  txtAntiguedad.textContent = antig.toFixed(2);

  // 5.5) Calcular salario con/sin complementos y pintar
  const salarioCon = salarioFijo + complementos;
  const salarioSin = salarioFijo;
  txtSalarioCon.textContent = salarioCon.toFixed(2);
  txtSalarioSin.textContent = salarioSin.toFixed(2);
  datosParaPDF.salarioCon = salarioCon;
  datosParaPDF.salarioSin = salarioSin;

  // 5.6) Mostrar contenedor de resultados
  resultadoDiv.style.display = 'block';

  // 5.7) Lógica según edad
  if (edad < 55) {
    //---------------------------------------------------
    //  === MENOR DE 55: VOLUNTARIA + LEGAL UNIFICADO ===
    //---------------------------------------------------
    bloqueMenor55.style.display = 'block';
    bloqueMayor55.style.display = 'none';

    // --- Indemnización VOLUNTARIA a 50 días ---
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

    // --- Indemnización LEGAL (unificado: 45 días/año antes 12-feb-2012 + 33 días/año después) ---
    const fechaReforma       = new Date(2012, 1, 12); // 12 feb 2012
    let antiguedadAntes      = 0;
    let antiguedadDespues    = 0;

    if (fechaAlta < fechaReforma) {
      const finTramo = (fechaCese < fechaReforma ? fechaCese : fechaReforma);
      antiguedadAntes = calcularAntiguedad(fechaAlta, finTramo);
      if (fechaCese > fechaReforma) {
        antiguedadDespues = calcularAntiguedad(fechaReforma, fechaCese);
      }
    } else {
      antiguedadAntes   = 0;
      antiguedadDespues = calcularAntiguedad(fechaAlta, fechaCese);
    }

    // Importes brutos de cada tramo (con o sin complementos)
    let brutoAntesCon   = (salarioCon / 365) * (45 * antiguedadAntes);
    let brutoDespuesCon = (salarioCon / 365) * (33 * antiguedadDespues);
    let brutoAntesSin   = (salarioSin / 365) * (45 * antiguedadAntes);
    let brutoDespuesSin = (salarioSin / 365) * (33 * antiguedadDespues);

    let totalBruta, desgTotal;
    if (complementos > 0) {
      totalBruta = brutoAntesCon + brutoDespuesCon;
      // La parte legal es 100 % exenta → sin retención
      desgTotal = {
        bruta:         totalBruta,
        exento:        totalBruta,
        exceso:        0,
        baseImponible: 0,
        irpf:          0,
        neto:          totalBruta
      };
    } else {
      totalBruta = brutoAntesSin + brutoDespuesSin;
      desgTotal = {
        bruta:         totalBruta,
        exento:        totalBruta,
        exceso:        0,
        baseImponible: 0,
        irpf:          0,
        neto:          totalBruta
      };
    }

    // Volcar al DOM (tabla LEGAL)
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

    // Guardar para PDF (tabla LEGAL)
    datosParaPDF.legAntesBruta   = parseFloat(legAntesBruta.textContent);
    datosParaPDF.legDespuesBruta = parseFloat(legDespuesBruta.textContent);
    datosParaPDF.legTotalBruta   = parseFloat(legTotalBruta.textContent);
    datosParaPDF.legExento       = parseFloat(legExento.textContent);
    datosParaPDF.legExceso       = parseFloat(legExceso.textContent);
    datosParaPDF.legBase         = parseFloat(legBase.textContent);
    datosParaPDF.legIrpf         = parseFloat(legIrpf.textContent);
    datosParaPDF.legNeto         = parseFloat(legNeto.textContent);

    legalContainer.style.display    = 'block';
    menor55NoAplicaEl.style.display = 'none';
    mayor61Container.style.display    = 'none';
    mayor55_58Container.style.display = 'none';
    mayor59_60Container.style.display = 'none';

    botonPDF.style.display = 'block';

    // ===========================================
    //  A PARTIR DE AQUÍ, CALCULAMOS RETENCIONES Y DIFERENCIAS
    // ===========================================

    // 1) HACEMOS DESGLOSE DE “VOLUNTARIA”:
    //    - Si complementos>0, usamos desgVolCon; sino, desgVolSin.
    let desgVol, volBrutaVal;
    if (complementos > 0) {
      desgVol      = desgVolCon;
      volBrutaVal = desgVolCon.bruta;
    } else {
      desgVol      = desgVolSin;
      volBrutaVal = desgVolSin.bruta;
    }

    // 2) PARA “LEGAL” usamos el objeto desgTotal (100 % exenta)
    const desgLeg   = {
      bruta:         desgTotal.bruta,
      exento:        desgTotal.exento,
      exceso:        0,
      baseImponible: 0,
      irpf:          0,
      neto:          desgTotal.neto
    };
    const legBrutaVal = desgTotal.bruta;

    // 3) RELLENAMOS en DOM “Retenciones y Diferencias”
    // Voluntaria:
    retVolBrutaEl.textContent  = desgVol.bruta.toFixed(2);
    retVolExentoEl.textContent = desgVol.exento.toFixed(2);
    retVolExcesoEl.textContent = desgVol.exceso.toFixed(2);
    retVolBaseEl.textContent   = desgVol.baseImponible.toFixed(2);
    retVolIrpfEl.textContent   = desgVol.irpf.toFixed(2);
    retVolNetoEl.textContent   = desgVol.neto.toFixed(2);

    // Legal (100 % exenta)
    retLegBrutaEl.textContent  = desgLeg.bruta.toFixed(2);
    retLegExentoEl.textContent = desgLeg.exento.toFixed(2);
    retLegExcesoEl.textContent = '0,00';
    retLegBaseEl.textContent   = '0,00';
    retLegIrpfEl.textContent   = '0,00';
    retLegNetoEl.textContent   = desgLeg.neto.toFixed(2);

    // 4) CALCULAMOS “DIFERENCIA BRUTA” = Voluntaria – Legal. Si negativa, la ajustamos a 0.
    let difBruta = volBrutaVal - legBrutaVal;
    if (difBruta < 0) difBruta = 0;

    // 5) DESGLOSE DE ESA DIFERENCIA con desglosarIndemnizacion(...)
    const desgDif = desglosarIndemnizacion(difBruta);

    // 6) RELLENAMOS la columna “Diferencia”
    retDifBrutaEl.textContent  = difBruta.toFixed(2);
    retDifExentoEl.textContent = desgDif.exento.toFixed(2);
    retDifExcesoEl.textContent = desgDif.exceso.toFixed(2);
    retDifBaseEl.textContent   = desgDif.baseImponible.toFixed(2);
    retDifIrpfEl.textContent   = desgDif.irpf.toFixed(2);
    retDifNetoEl.textContent   = desgDif.neto.toFixed(2);

    // 7) IRPF según tramos de Hacienda (si se tributase íntegramente la DIFERENCIA)
    //    – Este IRPF simula el tipo marginal máximo: calcularIrpf(difBruta).
    const irpfTramos = parseFloat(calcularIrpf(difBruta).toFixed(2));
    const netoTramos = parseFloat((difBruta - irpfTramos).toFixed(2));
    retDifIrpfTramosEl.textContent = irpfTramos.toFixed(2);
    retDifNetoTramosEl.textContent = netoTramos.toFixed(2);

    // 8) FILAS NUEVAS: Totales en cada columna
    //    – “Total sin retención”  → Voluntaria.bruta,  Legal.bruta,  Diferencia.bruta
    //    – “Total tras IRPF”      → Voluntaria.neto,   Legal.neto,   Diferencia.netoTramos
    const totalSinVol  = desgVol.bruta;
    const totalConVol  = desgVol.neto;

    const totalSinLeg  = desgLeg.bruta;  // (Legal es 100 % exenta)
    const totalConLeg  = desgLeg.neto;   // (Legal.neto === Legal.bruta)

    const totalSinDif  = difBruta;
    const totalConDif  = netoTramos;

    retTotalSinVolEl.textContent = totalSinVol.toFixed(2);
    retTotalConVolEl.textContent = totalConVol.toFixed(2);

    retTotalSinLegEl.textContent = totalSinLeg.toFixed(2);
    retTotalConLegEl.textContent = totalConLeg.toFixed(2);

    retTotalSinDifEl.textContent = totalSinDif.toFixed(2);
    retTotalConDifEl.textContent = totalConDif.toFixed(2);

    // 9) Totales globales combinados (Legal + Diferencia)
    const totalGlobalSin = totalSinLeg + totalSinDif;   // p. ej. 49 266,69 + 24 239,18 = 73 505,87
    const totalGlobalCon = totalConLeg + totalConDif;   // p. ej. 49 266,69 + 18 801,93 = 68 068,62
    totalGlobalSinEl.textContent = totalGlobalSin.toFixed(2);
    totalGlobalConEl.textContent = totalGlobalCon.toFixed(2);

    // 10) MOSTRAMOS el contenedor “Retenciones y Diferencias”
    retencionesContainer.style.display = 'block';

    // Guardar datos para PDF
    datosParaPDF.retVol           = desgVol;
    datosParaPDF.retLeg           = desgLeg;
    datosParaPDF.retDif           = desgDif;
    datosParaPDF.retDifIrpfTramos = irpfTramos;
    datosParaPDF.retDifNetoTramos = netoTramos;

    datosParaPDF.retTotalSinVol   = totalSinVol;
    datosParaPDF.retTotalConVol   = totalConVol;
    datosParaPDF.retTotalSinLeg   = totalSinLeg;
    datosParaPDF.retTotalConLeg   = totalConLeg;
    datosParaPDF.retTotalSinDif   = totalSinDif;
    datosParaPDF.retTotalConDif   = totalConDif;

    datosParaPDF.totalGlobalSin   = totalGlobalSin;
    datosParaPDF.totalGlobalCon   = totalGlobalCon;

    return; // terminamos el caso “Menor de 55”
  } else {
    //--------------------------------------------
    //  === MAYORES DE 55: A, B, C ===
    //--------------------------------------------
    bloqueMenor55.style.display = 'none';
    bloqueMayor55.style.display = 'block';

    mayor61Container.style.display    = 'none';
    mayor55_58Container.style.display = 'none';
    mayor59_60Container.style.display = 'none';
    menor55NoAplicaEl.style.display   = 'none';

    const cumple10 = antig >= 10.0;
    datosParaPDF.esMenor55         = false;
    datosParaPDF.esMayor55Eligible = cumple10;

    // A) Edad ≥ 61 y antig ≥ 10
    if (edad >= 61 && cumple10) {
      mayor61Container.style.display = 'block';

      // 1) Bruta = (salarioCon / 365) × (30 × antig)
      const libreBruta = (salarioCon / 365) * (30 * antig);
      // 2) Tope 24 mensualidades = salario anual ÷ 12 × 24 = salario anual × 2
      const tope24m = salarioCon * 2;
      // 3) Bruta Aplicada = min(libreBruta, tope24m, 75 000)
      const brutoAplicada = Math.min(libreBruta, tope24m, 75000);

      const desg = desglosarIndemnizacion(brutoAplicada);

      // Pintar en DOM
      ind61BrutaEl.textContent    = libreBruta.toFixed(2);
      tope24mEl.textContent       = tope24m.toFixed(2);
      tope75000El.textContent     = '75 000,00';
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
      datosParaPDF.desg61             = desg;

      mayor55_58Container.style.display = 'none';
      mayor59_60Container.style.display = 'none';
      menor55NoAplicaEl.style.display   = 'none';

      botonPDF.style.display = 'block';
      return;
    }

    // Si accidentalmente edad < 55 en este bloque
    if (edad < 55) {
      menor55NoAplicaEl.style.display = 'block';
      botonPDF.style.display = 'none';
      return;
    }

    // Si no cumple 10 años, no será elegible para B o C
    if (!cumple10) {
      mayor55_58Container.style.display = 'none';
      mayor59_60Container.style.display = 'none';
      menor55NoAplicaEl.textContent      =
        'Para acogerte como mayor de 55 necesitas al menos 10 años de antigüedad.';
      menor55NoAplicaEl.style.display    = 'block';
      botonPDF.style.display             = 'none';
      return;
    }

    // B) Edad 55–58 inclusive y antig ≥ 10
    if (edad >= 55 && edad <= 58 && cumple10) {
      mayor55_58Container.style.display = 'block';

      const salarioMensual = salarioCon / 12;
      const porcentaje     = 0.75; // 75 %
      const rentaMensual   = salarioMensual * porcentaje;

      const fecha63 = new Date(fechaNacimiento);
      fecha63.setFullYear(fechaNacimiento.getFullYear() + 63);

      const mesesHasta63 = calcularMesesEntre(fechaCese, fecha63);
      const rentaTotal   = rentaMensual * mesesHasta63;

      // Pintar en DOM
      salarioMensualBEl.textContent = salarioMensual.toFixed(2);
      porcentajeBEl.textContent     = '75 %';
      rentaMensualBEl.textContent   = rentaMensual.toFixed(2);
      mesesBEl.textContent          = mesesHasta63.toString();
      rentaTotalBEl.textContent     = rentaTotal.toFixed(2);

      // Guardar para PDF
      datosParaPDF.salarioMensualB = salarioMensual;
      datosParaPDF.porcentajeB     = porcentaje;
      datosParaPDF.rentaMensualB   = rentaMensual;
      datosParaPDF.mesesHasta63_B  = mesesHasta63;
      datosParaPDF.rentaTotalB     = rentaTotal;

      mayor59_60Container.style.display = 'none';
      menor55NoAplicaEl.style.display   = 'none';

      botonPDF.style.display = 'block';
      return;
    }

    // C) Edad 59–60 inclusive y antig ≥ 10
    if (edad >= 59 && edad <= 60 && cumple10) {
      mayor59_60Container.style.display = 'block';

      const salarioMensual = salarioCon / 12;
      const porcentaje     = 0.80; // 80 %
      const rentaMensual   = salarioMensual * porcentaje;

      const fecha63 = new Date(fechaNacimiento);
      fecha63.setFullYear(fechaNacimiento.getFullYear() + 63);

      const mesesHasta63 = calcularMesesEntre(fechaCese, fecha63);
      const rentaTotal   = rentaMensual * mesesHasta63;

      // Pintar en DOM
      salarioMensualCEl.textContent = salarioMensual.toFixed(2);
      porcentajeCEl.textContent     = '80 %';
      rentaMensualCEl.textContent   = rentaMensual.toFixed(2);
      mesesCEl.textContent          = mesesHasta63.toString();
      rentaTotalCEl.textContent     = rentaTotal.toFixed(2);

      // Guardar para PDF
      datosParaPDF.salarioMensualC = salarioMensual;
      datosParaPDF.porcentajeC     = porcentaje;
      datosParaPDF.rentaMensualC   = rentaMensual;
      datosParaPDF.mesesHasta63_C  = mesesHasta63;
      datosParaPDF.rentaTotalC     = rentaTotal;

      menor55NoAplicaEl.style.display   = 'none';

      botonPDF.style.display = 'block';
      return;
    }

    // Si llegamos aquí, edad ≥ 55 pero no cumple A, ni B, ni C
    menor55NoAplicaEl.textContent    =
      'No cumples las condiciones para Prejubilación (o eres menor de 55 años).';
    menor55NoAplicaEl.style.display  = 'block';
    botonPDF.style.display           = 'none';
  }
});

// -----------------------------------------------------------
// 6) Generación de PDF con jsPDF
// -----------------------------------------------------------
botonPDF.addEventListener('click', () => {
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

    // Indemnización VOLUNTARIA 50 días
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

    // Indemnización LEGAL (improcedente)
    doc.text('2) Indemnización LEGAL (improcedente)', xLabel, y);
    y += 6;
    doc.text('- Antes 12/02/2012 (45 días/año):', xLabel, y);
    doc.text(datosParaPDF.legAntesBruta.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- Después 12/02/2012 (33 días/año):', xLabel, y);
    doc.text(datosParaPDF.legDespuesBruta.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- Indemnización Bruta TOTAL:', xLabel, y);
    doc.text(datosParaPDF.legTotalBruta.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- Exento (100%):', xLabel, y);
    doc.text(datosParaPDF.legExento.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- Exceso (0,00):', xLabel, y);
    doc.text('0,00 €', xValue, y); y += 5;
    doc.text('- Base Imponible (0,00):', xLabel, y);
    doc.text('0,00 €', xValue, y); y += 5;
    doc.text('- IRPF aproximado (0,00):', xLabel, y);
    doc.text('0,00 €', xValue, y); y += 5;
    doc.text('- Indemnización Neta:', xLabel, y);
    doc.text(datosParaPDF.legNeto.toFixed(2) + ' €', xValue, y); y += 8;

    // Retenciones y Diferencias
    doc.text('3) Retenciones y Diferencias', xLabel, y);
    y += 7;
    doc.setFontSize(11);
    // Voluntaria
    if (datosParaPDF.complementos > 0) {
      const vCon = datosParaPDF.desgVolCon;
      doc.text('- Voluntaria Bruta:', xLabel, y);
      doc.text(vCon.bruta.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Voluntaria Exento:', xLabel, y);
      doc.text(vCon.exento.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Voluntaria Exceso:', xLabel, y);
      doc.text(vCon.exceso.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Voluntaria Base Imponible:', xLabel, y);
      doc.text(vCon.baseImponible.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Voluntaria IRPF:', xLabel, y);
      doc.text(vCon.irpf.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Voluntaria Neta:', xLabel, y);
      doc.text(vCon.neto.toFixed(2) + ' €', xValue, y); y += 8;
    } else {
      const vSin = datosParaPDF.desgVolSin;
      doc.text('- Voluntaria Bruta:', xLabel, y);
      doc.text(vSin.bruta.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Voluntaria Exento:', xLabel, y);
      doc.text(vSin.exento.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Voluntaria Exceso:', xLabel, y);
      doc.text(vSin.exceso.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Voluntaria Base Imponible:', xLabel, y);
      doc.text(vSin.baseImponible.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Voluntaria IRPF:', xLabel, y);
      doc.text(vSin.irpf.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Voluntaria Neta:', xLabel, y);
      doc.text(vSin.neto.toFixed(2) + ' €', xValue, y); y += 8;
    }

    // Legal (100 % exenta)
    doc.text('- Legal Bruta:', xLabel, y);
    doc.text(datosParaPDF.legTotalBruta.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- Legal Exento (100%):', xLabel, y);
    doc.text(datosParaPDF.legExento.toFixed(2) + ' €', xValue, y); y += 5;
    doc.text('- Legal Exceso:', xLabel, y);
    doc.text('0,00 €', xValue, y); y += 5;
    doc.text('- Legal Base Imponible:', xLabel, y);
    doc.text('0,00 €', xValue, y); y += 5;
    doc.text('- Legal IRPF:', xLabel, y);
    doc.text('0,00 €', xValue, y); y += 5;
    doc.text('- Legal Neta:', xLabel, y);
    doc.text(datosParaPDF.legNeto.toFixed(2) + ' €', xValue, y); y += 8;

    // Diferencia (Voluntaria – Legal)
    {
      doc.text('- Diferencia Bruta:', xLabel, y);
      doc.text(retDifBrutaEl.textContent + ' €', xValue, y); y += 5;
      doc.text('- Diferencia Exento:', xLabel, y);
      doc.text(retDifExentoEl.textContent + ' €', xValue, y); y += 5;
      doc.text('- Diferencia Exceso:', xLabel, y);
      doc.text(retDifExcesoEl.textContent + ' €', xValue, y); y += 5;
      doc.text('- Diferencia Base Imponible:', xLabel, y);
      doc.text(retDifBaseEl.textContent + ' €', xValue, y); y += 5;
      doc.text('- Diferencia IRPF (por tramos):', xLabel, y);
      doc.text(datosParaPDF.retDifIrpfTramos.toFixed(2) + ' €', xValue, y); y += 5;
      doc.text('- Diferencia Neta (por tramos):', xLabel, y);
      doc.text(datosParaPDF.retDifNetoTramos.toFixed(2) + ' €', xValue, y); y += 8;
    }

    // Filas NUEVAS:
    doc.text('- Total sin retención:', xLabel, y);
    doc.text(datosParaPDF.retTotalSinVol.toFixed(2) + ' €', xValue + 50, y); y += 5;
    doc.text('  Voluntaria', xLabel + 10, y); y -= 5;
    doc.text(datosParaPDF.retTotalSinLeg.toFixed(2) + ' €', xValue + 110, y); y += 5;
    doc.text('  Legal', xLabel + 10, y); y -= 5;
    doc.text(datosParaPDF.retTotalSinDif.toFixed(2) + ' €', xValue + 170, y); y += 8;

    doc.text('- Total tras IRPF:', xLabel, y);
    doc.text(datosParaPDF.retTotalConVol.toFixed(2) + ' €', xValue + 50, y); y += 5;
    doc.text('  Voluntaria', xLabel + 10, y); y -= 5;
    doc.text(datosParaPDF.retTotalConLeg.toFixed(2) + ' €', xValue + 110, y); y += 5;
    doc.text('  Legal', xLabel + 10, y); y -= 5;
    doc.text(datosParaPDF.retTotalConDif.toFixed(2) + ' €', xValue + 170, y); y += 10;

    // Bloque ADICIONAL: Totales globales combinados
    doc.text(
      `* Total global sin retención (Legal + Diferencia): ${datosParaPDF.totalGlobalSin.toFixed(2)} €`,
      xLabel,
      y
    );
    y += 6;
    doc.text(
      `* Total global tras IRPF (Legal + Diferencia): ${datosParaPDF.totalGlobalCon.toFixed(2)} €`,
      xLabel,
      y
    );
    y += 10;

    // Pie de nota de retención
    doc.setFontSize(9);
    doc.text(
      '* El IRPF (por tramos) corresponde al tipo marginal máximo según Hacienda. ' +
      'La retención real varía según tu situación familiar (hijos, estado civil, etc.).',
      xLabel,
      y
    );
    y += 10;
  }

  // Pie de nota general
  doc.setFontSize(9);
  doc.text(
    '* Estos cálculos son aproximados. Consulta con un asesor laboral y fiscal.',
    10,
    y + 5
  );

  // Descargar el PDF
  doc.save('Resumen_Indemnizacion.pdf');
});

// -----------------------------------------------------------
// 7) [MÁSCARA] Auto‐inserción de "/" en campos de fecha dd/MM/yyyy
// -----------------------------------------------------------

/** 
 * Cada vez que el usuario escriba en el campo de fecha, se formatea
 * para que aparezca dd/MM/yyyy y las barras se inserten automáticamente. 
 */
function aplicarMascaraFecha(inputElement) {
  inputElement.addEventListener('input', (event) => {
    // Eliminamos todo lo que no sea dígito:
    let valor = event.target.value.replace(/\D/g, '');

    // Limitamos a 8 dígitos (ddMMyyyy)
    if (valor.length > 8) {
      valor = valor.slice(0, 8);
    }

    // Insertamos "/" tras dos dígitos (día) y tras cuatro (mes)
    if (valor.length > 2) {
      valor = valor.slice(0, 2) + '/' + valor.slice(2);
    }
    if (valor.length > 5) {
      valor = valor.slice(0, 5) + '/' + valor.slice(5);
    }

    // Asignamos el valor de vuelta al campo
    event.target.value = valor;
  });

  // Evitamos pegar texto malformado:
  inputElement.addEventListener('paste', (event) => {
    event.preventDefault();
    const textoPegar = (event.clipboardData || window.clipboardData).getData('text');
    const soloDigitos = textoPegar.replace(/\D/g, '').slice(0, 8);

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
// 8) Invocación de la máscara sobre los tres campos de fecha
// -----------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const fechaNacimientoEl = document.getElementById('fechaNacimiento');
  const fechaAltaEl       = document.getElementById('fechaAlta');
  const fechaCeseEl       = document.getElementById('fechaCese');

  aplicarMascaraFecha(fechaNacimientoEl);
  aplicarMascaraFecha(fechaAltaEl);
  aplicarMascaraFecha(fechaCeseEl);
});
