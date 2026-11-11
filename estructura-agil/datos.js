/* NMH Estructura Ágil · datos y parámetros del cotizador
   ---------------------------------------------------------------------------
   Este archivo concentra TODO lo que se calibra: precios, cupo del plan,
   factores de complejidad, tenores de acero y amenaza sísmica / eólica.
   Para ajustar el producto basta con editar los números y publicar.

   Fuentes:
   - Aa, Av y zona de amenaza: NSR-10, Tabla A.2.3-2 (capitales) y Apéndice A-4
     (municipios). Verificar siempre contra el texto oficial vigente.
   - Velocidad básica de viento: valores POR DEFECTO CONSERVADORES de referencia.
     Confirmar con la Figura B.6.4-1 vigente (NSR-10 y sus modificaciones).
   - Tenores de acero: rangos de práctica para predimensionamiento, a calibrar
     con los proyectos reales que diseñe NMH (ver documento del producto).
*/
window.NMH_DATOS = {
  version: "1.1 · 11/11/2026",

  /* ---------- Acceso de demostración (solo muestra, no es seguridad real) ---------- */
  acceso: {
    usuario: "herrajesandina",
    clave: "nmh2026",
    suscriptor: "Herrajes Andina S.A.S.",
    plan: "Plan Base"
  },

  contacto: {
    whatsapp: "573017972967",
    correo: "",
    horario: "Lunes a viernes, 8:00 a 12:00 y 14:00 a 18:00"
  },

  /* ---------- Plan Base ---------- */
  plan: {
    cuotaMensual: 6000000,          // COP antes de IVA
    iva: 0.19,
    cupoM2Eq: 300,                  // m² equivalentes de diseño incluidos por mes (crédito mensual: lo no usado se pierde)
    predimensionamientos: 8,        // fichas de predimensionamiento incluidas por mes
    cimentaciones: 2,               // diseños de cimentación de mástil o poste hasta 20 m incluidos por mes
    tarifaLista: 6000,              // COP/m² eq, antes de IVA
    tarifaSuscriptor: 5000,         // COP/m² eq, antes de IVA
    minimoLista: 1200000,           // valor mínimo por proyecto (no suscriptor)
    minimoSuscriptor: 1000000,      // valor mínimo por proyecto facturado completo (suscriptor)
    demoConsumido: 120,             // m² eq ya usados en la demostración
    demoPredim: 2,                  // fichas ya usadas en la demostración
    demoCim: 0,                     // cimentaciones ya usadas en la demostración
    demoProyecto: "Cubierta bodega en Malambo (120 m² eq)"
  },

  /* ---------- Factores de complejidad para el precio del diseño ---------- */
  diseno: {
    irregularidad: { regular: 1.00, leve: 1.10, marcada: 1.25 },
    zona: { Baja: 1.00, Intermedia: 1.05, Alta: 1.10 },
    alturaPorPiso: 0.03,            // +3 % por cada piso por encima de 4
    pisosSinRecargo: 4,
    // Descuento por escala, aplicado por tramos (marginal) sobre el área total
    escala: [
      { hasta: 1500, factor: 1.00 },
      { hasta: 3000, factor: 0.92 },
      { hasta: 6000, factor: 0.85 },
      { hasta: Infinity, factor: 0.78 }
    ]
  },

  /* ---------- Tenores de acero ----------
     base: kg/m² esperado para zona de amenaza baja (A ≤ 0,10), viento 100 km/h,
           planta regular y 1 piso.
     cons: multiplicador para el valor conservador (presupuesto).
     sis:  incremento por cada 0,05 de A = máx(Aa, Av) por encima de 0,10.
     vie:  exponente de sensibilidad al viento: f = (V/100)^(2·vie), con V ≥ 100.
     pis:  incremento del tenor promedio por cada piso adicional.
     dis:  factor de complejidad del diseño (precio).
     maxPisos: número máximo de niveles que admite la tipología.          */
  tipos: {
    cubierta:   { nombre: "Cubierta metálica liviana (cerchas y correas)", material: "Acero estructural", nota: "Sobre muros o columnas existentes. Incluye cerchas, correas, tensores y arriostramiento.", base: 13, cons: 1.25, sis: 0.01, vie: 0.40, pis: 0,    dis: 0.80, maxPisos: 1 },
    bodega:     { nombre: "Bodega o nave industrial (pórticos metálicos)", material: "Acero estructural", nota: "Pórticos de alma llena o en celosía, luces de 15 a 30 m. Incluye columnas, vigas, correas y arriostramiento.", base: 26, cons: 1.20, sis: 0.02, vie: 0.30, pis: 0,    dis: 0.90, maxPisos: 1 },
    marquesina: { nombre: "Marquesina o cubierta en voladizo", material: "Acero estructural", nota: "Parqueaderos, estaciones, accesos. El viento ascendente suele gobernar.", base: 24, cons: 1.20, sis: 0.02, vie: 0.40, pis: 0,    dis: 1.10, maxPisos: 1 },
    mezzanine:  { nombre: "Mezzanine o entrepiso metálico (steel deck)", material: "Acero estructural", nota: "Vigas, viguetas y columnas para cargas de 250 a 500 kgf/m². Sin incluir la lámina colaborante.", base: 40, cons: 1.20, sis: 0.04, vie: 0.00, pis: 0.03, dis: 1.00, maxPisos: 2 },
    plataforma: { nombre: "Plataforma o pasarela industrial", material: "Acero estructural", nota: "Plataformas de equipos y pasarelas con rejilla. Cargas de equipos a confirmar.", base: 70, cons: 1.25, sis: 0.04, vie: 0.10, pis: 0.04, dis: 1.20, maxPisos: 3 },
    edificioMetal: { nombre: "Edificio en estructura metálica", material: "Acero estructural", nota: "Pórticos resistentes a momento o arriostrados con losa sobre steel deck.", base: 48, cons: 1.20, sis: 0.06, vie: 0.08, pis: 0.04, dis: 1.15, maxPisos: 12 },
    casa:       { nombre: "Casa o vivienda en concreto reforzado", material: "Acero de refuerzo", nota: "Pórticos o mampostería confinada de 1 a 3 pisos. Incluye cimentación superficial.", base: 24, cons: 1.20, sis: 0.06, vie: 0.00, pis: 0.06, dis: 1.00, maxPisos: 3 },
    edificioConcreto: { nombre: "Edificio en concreto reforzado (pórticos)", material: "Acero de refuerzo", nota: "Pórticos o sistema combinado. Incluye cimentación superficial; pilotes aparte.", base: 34, cons: 1.20, sis: 0.07, vie: 0.03, pis: 0.025, dis: 1.10, maxPisos: 15 }
  },

  /* ---------- Mástiles y postes (hasta 20 m) ----------
     Peso por unidad (t) con viento de 100 km/h: ref18 × (H/18)^k. Referencias: 16 m y 18 m.
     Geometrías típicas: poste de alumbrado o cámaras (fuste cónico de 4 a 5 mm, placa base);
     monopolo de telecomunicaciones (fuste poligonal de 5 a 6 mm, placa base, escalera y soportes).
     Precios por tipo de mástil diseñado; la cimentación se cotiza por sitio o tipo de suelo.   */
  mastiles: {
    poste:    { nombre: "Poste de alumbrado o cámaras", ref18: 0.49, k: 1.72, vie: 0.35, sis: 0.01, cons: 1.20,
                disenoLista: 2500000, disenoSus: 2000000, cimLista: 1500000, cimSus: 1200000,
                nota: "Fuste tubular cónico galvanizado con placa base y pernos. Incluye diseño de placa y pernos de anclaje." },
    monopolo: { nombre: "Monopolo tubular de telecomunicaciones", ref18: 1.42, k: 1.43, vie: 0.35, sis: 0.01, cons: 1.20,
                disenoLista: 5000000, disenoSus: 4000000, cimLista: 2000000, cimSus: 1600000,
                nota: "Fuste poligonal galvanizado para antenas (ANSI/TIA-222 y NSR-10). Incluye placa base, pernos, escalera y soportes tipo." },
    alturaMin: 6, alturaMax: 20, referencias: [16, 18]
  },

  irregularidadAcero: { regular: 1.00, leve: 1.08, marcada: 1.18 },
  pesoPisoInferior: 0.30,   // el piso más bajo pesa hasta 30 % más que el último

  /* ---------- Viento: velocidad básica por defecto (km/h) por departamento ---------- */
  viento: {
    porDefecto: 100,
    departamentos: {
      "Atlántico": 130, "Bolívar": 130, "Magdalena": 130, "La Guajira": 130,
      "Sucre": 130, "Córdoba": 130, "Cesar": 130, "San Andrés y Providencia": 150
    },
    opciones: [80, 100, 120, 130, 150]
  },

  /* ---------- Amenaza sísmica: [municipio, Aa, Av] por departamento ---------- */
  municipios: {
    "Atlántico": [
      ["Barranquilla",0.10,0.10],["Baranoa",0.10,0.10],["Campo de la Cruz",0.10,0.10],["Candelaria",0.10,0.10],
      ["Galapa",0.10,0.10],["Juan de Acosta",0.10,0.10],["Luruaco",0.10,0.10],["Malambo",0.10,0.10],
      ["Manatí",0.10,0.10],["Palmar de Varela",0.10,0.10],["Piojó",0.10,0.10],["Polonuevo",0.10,0.10],
      ["Ponedera",0.10,0.10],["Puerto Colombia",0.10,0.10],["Repelón",0.10,0.10],["Sabanagrande",0.10,0.10],
      ["Sabanalarga",0.10,0.10],["Santa Lucía",0.10,0.10],["Santo Tomás",0.10,0.10],["Soledad",0.10,0.10],
      ["Suan",0.10,0.10],["Tubará",0.10,0.10],["Usiacurí",0.10,0.10]
    ],
    "Bolívar": [
      ["Cartagena",0.10,0.10],["Achí",0.15,0.15],["Altos del Rosario",0.15,0.15],["Arenal",0.15,0.15],
      ["Arjona",0.10,0.10],["Arroyohondo",0.10,0.10],["Barranco de Loba",0.15,0.15],["Calamar",0.10,0.10],
      ["Cantagallo",0.15,0.15],["Cicuco",0.10,0.15],["Clemencia",0.10,0.10],["Córdoba",0.10,0.10],
      ["El Carmen de Bolívar",0.10,0.15],["El Guamo",0.10,0.10],["El Peñón",0.15,0.15],["Hatillo de Loba",0.15,0.10],
      ["Magangué",0.10,0.15],["Mahates",0.10,0.10],["Margarita",0.10,0.10],["María la Baja",0.10,0.15],
      ["Mompós",0.10,0.15],["Montecristo",0.15,0.15],["Morales",0.15,0.15],["Pinillos",0.10,0.15],
      ["Regidor",0.15,0.15],["Río Viejo",0.15,0.15],["San Cristóbal",0.10,0.10],["San Estanislao",0.10,0.10],
      ["San Fernando",0.10,0.10],["San Jacinto",0.10,0.10],["San Jacinto del Cauca",0.15,0.15],["San Juan Nepomuceno",0.10,0.10],
      ["San Martín de Loba",0.15,0.15],["San Pablo",0.15,0.15],["Santa Catalina",0.10,0.10],["Santa Rosa",0.10,0.10],
      ["Santa Rosa del Sur",0.15,0.15],["Simití",0.15,0.15],["Soplaviento",0.10,0.10],["Talaigua Nuevo",0.10,0.10],
      ["Tiquisio",0.15,0.15],["Turbaco",0.10,0.10],["Turbaná",0.10,0.10],["Villanueva",0.10,0.10],["Zambrano",0.10,0.10]
    ],
    "Magdalena": [
      ["Santa Marta",0.15,0.10],["Algarrobo",0.10,0.10],["Aracataca",0.10,0.10],["Ariguaní",0.10,0.10],
      ["Cerro San Antonio",0.10,0.10],["Chivolo",0.10,0.10],["Ciénaga",0.10,0.10],["Concordia",0.10,0.10],
      ["El Banco",0.10,0.10],["El Piñón",0.10,0.10],["El Retén",0.10,0.10],["Fundación",0.10,0.10],
      ["Guamal",0.10,0.10],["Nueva Granada",0.10,0.10],["Pedraza",0.10,0.10],["Pijiño del Carmen",0.10,0.10],
      ["Pivijay",0.10,0.10],["Plato",0.10,0.10],["Puebloviejo",0.10,0.10],["Remolino",0.10,0.10],
      ["Sabanas de San Ángel",0.10,0.10],["Salamina",0.10,0.10],["San Sebastián de Buenavista",0.10,0.10],["San Zenón",0.10,0.10],
      ["Santa Ana",0.10,0.10],["Santa Bárbara de Pinto",0.10,0.10],["Sitionuevo",0.10,0.10],["Tenerife",0.10,0.10],
      ["Zapayán",0.10,0.10],["Zona Bananera",0.10,0.10]
    ],
    "Cesar": [
      ["Valledupar",0.10,0.10],["Aguachica",0.15,0.15],["Agustín Codazzi",0.10,0.10],["Astrea",0.10,0.10],
      ["Becerril",0.10,0.10],["Bosconia",0.10,0.10],["Chimichagua",0.10,0.10],["Chiriguaná",0.10,0.10],
      ["Curumaní",0.15,0.10],["El Copey",0.10,0.10],["El Paso",0.10,0.10],["Gamarra",0.15,0.15],
      ["González",0.20,0.15],["La Gloria",0.15,0.15],["La Jagua de Ibirico",0.10,0.10],["La Paz",0.10,0.10],
      ["Manaure Balcón del Cesar",0.10,0.10],["Pailitas",0.15,0.10],["Pelaya",0.15,0.15],["Pueblo Bello",0.10,0.10],
      ["Río de Oro",0.20,0.15],["San Alberto",0.20,0.15],["San Diego",0.10,0.10],["San Martín",0.20,0.15],
      ["Tamalameque",0.15,0.10]
    ],
    "La Guajira": [
      ["Riohacha",0.10,0.15],["Albania",0.10,0.10],["Barrancas",0.15,0.10],["Dibulla",0.15,0.10],
      ["Distracción",0.15,0.10],["El Molino",0.10,0.10],["Fonseca",0.15,0.10],["Hatonuevo",0.15,0.10],
      ["La Jagua del Pilar",0.10,0.10],["Maicao",0.10,0.15],["Manaure",0.10,0.15],["San Juan del Cesar",0.15,0.10],
      ["Uribia",0.15,0.15],["Urumita",0.10,0.10],["Villanueva",0.10,0.10]
    ],
    "Córdoba": [
      ["Montería",0.10,0.15],["Ayapel",0.15,0.15],["Buenavista",0.15,0.20],["Canalete",0.10,0.20],
      ["Cereté",0.10,0.15],["Chimá",0.10,0.15],["Chinú",0.10,0.15],["Ciénaga de Oro",0.10,0.15],
      ["Cotorra",0.10,0.15],["La Apartada",0.15,0.20],["Lorica",0.10,0.15],["Los Córdobas",0.10,0.20],
      ["Moñitos",0.10,0.15],["Momil",0.10,0.15],["Montelíbano",0.15,0.20],["Planeta Rica",0.15,0.20],
      ["Pueblo Nuevo",0.15,0.15],["Puerto Escondido",0.10,0.20],["Puerto Libertador",0.15,0.20],["Purísima",0.10,0.15],
      ["Sahagún",0.15,0.15],["San Andrés de Sotavento",0.10,0.15],["San Antero",0.10,0.15],["San Bernardo del Viento",0.10,0.15],
      ["San Carlos",0.10,0.15],["San Pelayo",0.10,0.15],["Tierralta",0.20,0.20],["Valencia",0.15,0.20]
    ],
    "Sucre": [
      ["Sincelejo",0.10,0.15],["Buenavista",0.10,0.15],["Caimito",0.15,0.15],["Chalán",0.10,0.15],
      ["Colosó",0.10,0.15],["Corozal",0.10,0.15],["El Roble",0.10,0.15],["Galeras",0.10,0.15],
      ["Guaranda",0.15,0.15],["La Unión",0.15,0.15],["Los Palmitos",0.10,0.15],["Majagual",0.15,0.15],
      ["Morroa",0.10,0.15],["Ovejas",0.10,0.15],["Palmito",0.10,0.15],["Sampués",0.10,0.15],
      ["San Benito Abad",0.10,0.15],["San Juan de Betulia",0.10,0.15],["San Marcos",0.15,0.15],["San Onofre",0.10,0.15],
      ["San Pedro",0.10,0.15],["Sincé",0.10,0.15],["Sucre",0.10,0.15],["Tolú",0.10,0.15],["Toluviejo",0.10,0.15]
    ],
    "Antioquia": [
      ["Medellín",0.15,0.20],["Barbosa",0.15,0.20],["Bello",0.15,0.20],["Caldas",0.20,0.20],
      ["Copacabana",0.15,0.20],["Envigado",0.15,0.20],["Girardota",0.15,0.20],["Itagüí",0.15,0.20],
      ["La Estrella",0.15,0.25],["Sabaneta",0.15,0.20]
    ],
    "Santander": [
      ["Bucaramanga",0.25,0.25],["Barrancabermeja",0.15,0.15],["Floridablanca",0.25,0.25],["Girón",0.20,0.25],
      ["Lebrija",0.25,0.20],["Piedecuesta",0.25,0.25],["San Gil",0.20,0.25],["Socorro",0.20,0.20]
    ],
    "Otras capitales": [
      ["Arauca",0.15,0.15],["Armenia",0.25,0.25],["Bogotá D. C.",0.15,0.20],["Cali",0.25,0.25],
      ["Cúcuta",0.35,0.30],["Florencia",0.20,0.15],["Ibagué",0.20,0.20],["Leticia",0.05,0.05],
      ["Manizales",0.25,0.25],["Mitú",0.05,0.05],["Mocoa",0.30,0.25],["Neiva",0.25,0.25],
      ["Pasto",0.25,0.25],["Pereira",0.25,0.25],["Popayán",0.25,0.20],["Puerto Carreño",0.05,0.05],
      ["Puerto Inírida",0.05,0.05],["Quibdó",0.35,0.35],["San José del Guaviare",0.05,0.05],["Tunja",0.20,0.20],
      ["Villavicencio",0.35,0.30],["Yopal",0.30,0.20]
    ],
    "San Andrés y Providencia": [
      ["San Andrés",0.10,0.10]
    ]
  }
};
