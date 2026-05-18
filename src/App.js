import { useState, useEffect, useCallback } from "react";
import { cargarTodo, guardarAlumnos, guardarHorarios, guardarPagos, guardarHistorial } from "./firebase";

const DIAS = ["LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES"];
const DS = ["Lun","Mar","Mié","Jue","Vie"];
const HORAS = ["8:00","9:00","10:00","11:00","14:00","15:00","16:00","17:00","18:00","19:00"];
const SLOTS = 5;
const METODOS = ["Efectivo","Transferencia","Tarjeta"];
const NIVELES = ["A1","I1","I2","I3","B1","B2","B3","ADM1","ADM2"];

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// Calcula el lunes de la semana actual
function getLunesSemana() {
  var hoy = new Date();
  var diaSemana = hoy.getDay(); // 0=dom, 1=lun ... 6=sab
  var diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  var lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffLunes);
  return lunes;
}

// Devuelve array de fechas Lun-Vie de la semana actual
function getFechasSemana() {
  var lunes = getLunesSemana();
  var fechas = [];
  for (var i = 0; i < 5; i++) {
    var d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    fechas.push(d);
  }
  return fechas;
}

// Formatea: "07 Abr" etc
function formatFechaCorta(d) {
  return String(d.getDate()).padStart(2,"0");
}

function getSemanaLabel(fechas) {
  var ini = fechas[0];
  var fin = fechas[4];
  var mismoMes = ini.getMonth() === fin.getMonth();
  if (mismoMes) {
    return formatFechaCorta(ini) + " – " + formatFechaCorta(fin) + " " + MESES[ini.getMonth()] + " " + ini.getFullYear();
  }
  return formatFechaCorta(ini) + " " + MESES[ini.getMonth()].slice(0,3) + " – " + formatFechaCorta(fin) + " " + MESES[fin.getMonth()].slice(0,3) + " " + fin.getFullYear();
}

// Detecta qué día de la semana es hoy (para marcar el activo por defecto)
function getDiaHoy() {
  var hoy = new Date().getDay();
  var map = { 1:"LUNES", 2:"MARTES", 3:"MIÉRCOLES", 4:"JUEVES", 5:"VIERNES" };
  return map[hoy] || "LUNES";
}

const PLANES = {
  TRANSFORMACION: { label:"Transformación", dias:3, precio:52000 },
  BIENESTAR:      { label:"Bienestar",      dias:2, precio:46000 },
  ARRANQUE:       { label:"Arranque",       dias:1, precio:41000 }
};

function getPlan(key) {
  return PLANES[key] || { label:key, dias:2, precio:0 };
}

function getLugaresLibres(hor, dia, hora) {
  if (!dia || !hora) return -1;
  var slots = (hor[dia] && hor[dia][hora]) ? hor[dia][hora] : [];
  return slots.filter(function(s) { return !s.nombre.trim(); }).length;
}

var FONT = "'Nunito', sans-serif";

// Paleta extraída del logo Studio LC Pilates
var C = {
  bg:      "#f0f7f6",   // fondo: blanco verdoso muy suave
  card:    "#ffffff",
  header:  "#2d8c7e",   // teal principal del logo (círculo y texto)
  accent:  "#3a9e8f",   // teal más vivo
  accent2: "#5b8fa8",   // azul grisáceo del círculo interior
  teal:    "#3a9e8f",   // alias teal = accent del logo
  sky:     "#7bbccc",   // azul agua claro
  danger:  "#c0392b",   // rojo para bajas/errores
  border:  "#c8e8e4",   // borde: teal muy claro
  soft:    "#7aada6",   // texto suave: teal desaturado
  dark:    "#2c3e35",   // texto oscuro: casi negro verdoso
  charcoal:"#3d3d3d",   // carbón del texto PILATES en el logo
};

function pcolor(plan) {
  if (plan === "TRANSFORMACION") return C.charcoal;   // carbón del logo
  if (plan === "ARRANQUE") return C.accent2;           // azul grisáceo
  return C.header;                                     // teal principal
}

function today() {
  return new Date().toLocaleDateString("es-AR");
}

function nid(arr) {
  var max = 0;
  arr.forEach(function(a) { if (a.id > max) max = a.id; });
  return max + 1;
}

function mk(names) {
  return names.map(function(n) { return { nombre:n, asistencia:false, recupero:null }; });
}

function pd(arr) {
  var r = arr.slice();
  while (r.length < SLOTS) r.push({ nombre:"", asistencia:false, recupero:null });
  return r.slice(0, SLOTS);
}

var ALM = [
  {id:2,  nombre:"Lorena Fernandez",          edad:null, nivel:"B3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:3,  nombre:"Daiana Centurión",           edad:44,   nivel:"I2",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:4,  nombre:"Sandra Rodríguez",           edad:null, nivel:"I1",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:5,  nombre:"Paola Elizabet Campos",      edad:null, nivel:"I2",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:6,  nombre:"Lidia Gomez",                edad:null, nivel:"ADM1", plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:7,  nombre:"Yanina Belén Eiza",          edad:null, nivel:"I2",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:8,  nombre:"Lidia Ortiz",                edad:null, nivel:"ADM1", plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:9,  nombre:"Nancy Mendoza",              edad:null, nivel:"I2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:10, nombre:"María Belén Funes",          edad:null, nivel:"B3",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:11, nombre:"Ángeles Villalba",           edad:null, nivel:"I3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:12, nombre:"Marcela Acosta",             edad:null, nivel:"ADM2", plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:13, nombre:"Juan Carlos Cortéz",         edad:null, nivel:"ADM1", plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:14, nombre:"Marisol Estanga",            edad:null, nivel:"I2",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:15, nombre:"Angeles Eseverri",           edad:61,   nivel:"I2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:16, nombre:"Nancy Mabel Salina",         edad:55,   nivel:"B2",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:17, nombre:"Priscila Abril Berbese",     edad:21,   nivel:"I3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:18, nombre:"Cintia Cabrera",             edad:42,   nivel:"I2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:19, nombre:"Selva Ramona Rosales",       edad:65,   nivel:"B2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:20, nombre:"Victoria Fernández",         edad:26,   nivel:"I3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:21, nombre:"Mirta Noemí Quinteros",      edad:56,   nivel:"B3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:22, nombre:"Alicia Graciela Sarlangue",  edad:59,   nivel:"ADM2", plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:23, nombre:"Soledad Martirengo",         edad:33,   nivel:"B2",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:24, nombre:"Romina Camargo",             edad:37,   nivel:"I1",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:25, nombre:"Noemi Leonor Cerone",        edad:64,   nivel:"I1",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:26, nombre:"Carla Diaz",                 edad:43,   nivel:"B3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:27, nombre:"Maria Belen Percara",        edad:null, nivel:"I1",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:28, nombre:"Analia Valeria Coppens",     edad:47,   nivel:"I1",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:29, nombre:"Iara Jazmin Vega",           edad:24,   nivel:"B3",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:30, nombre:"Candela Comunity",           edad:null, nivel:"B1",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:31, nombre:"Guadalupe Vicente",          edad:50,   nivel:"I2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:32, nombre:"Esther Rosana Reynoso",      edad:55,   nivel:"B3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:33, nombre:"Andrea Carina Mendoza",      edad:50,   nivel:"B3",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:34, nombre:"Kiara Wastavino",            edad:20,   nivel:"B2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:35, nombre:"Adriana Cambiaso",           edad:55,   nivel:"I1",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:36, nombre:"Alicia Acosta",              edad:61,   nivel:"ADM2", plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:37, nombre:"Dario Suárez",               edad:null, nivel:"I3",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:38, nombre:"Nora Calderon",              edad:null, nivel:"B3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:39, nombre:"Placida Noemi Caiani",       edad:null, nivel:"ADM1", plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:40, nombre:"Norma Bulacio",              edad:null, nivel:"B3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:41, nombre:"Alicia Faccio",              edad:null, nivel:"ADM1", plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:42, nombre:"Marcela Schlegel",           edad:null, nivel:"B3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:43, nombre:"Marcela Monescao",           edad:null, nivel:"B3",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:44, nombre:"Olga Ferreyro",              edad:null, nivel:"B2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:45, nombre:"Estefania Velozo",           edad:null, nivel:"B2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:46, nombre:"Delfina Abadie",             edad:null, nivel:"B3",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:47, nombre:"Lucia Makutenas",            edad:null, nivel:"B2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:48, nombre:"Mariela Juarez",             edad:null, nivel:"I2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:49, nombre:"Olga Decima",                edad:null, nivel:"ADM1", plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:50, nombre:"Maria Celeste Ferrari",      edad:null, nivel:"B3",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:51, nombre:"Marisa Bermudes",            edad:null, nivel:"B3",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:52, nombre:"Mario Chavez",               edad:null, nivel:"B2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:53, nombre:"Sabrina Montaño",            edad:null, nivel:"B3",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:54, nombre:"Natalia Albornoz",           edad:35,   nivel:"B2",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:55, nombre:"Paula Ordóñez",              edad:57,   nivel:"B1",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:56, nombre:"Valeria Torre",              edad:51,   nivel:"B3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:57, nombre:"Celia Chávez",               edad:46,   nivel:"B1",   plan:"ARRANQUE",       contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:58, nombre:"Carla Melisa García",        edad:38,   nivel:"B1",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:59, nombre:"Hilda",                      edad:61,   nivel:"ADM2", plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:60, nombre:"Laura Durán",                edad:51,   nivel:"B3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:61, nombre:"Silvia Adelaida Medina",     edad:54,   nivel:"ADM1", plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:62, nombre:"Johana Suarez",              edad:29,   nivel:"B3",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:63, nombre:"María del Carmen Sánchez",   edad:72,   nivel:"ADM1", plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:64, nombre:"Lucia Rozzi",                edad:25,   nivel:"B3",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:65, nombre:"Silvia Lopez",               edad:null, nivel:"B1",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:66, nombre:"Jessica Pérez",              edad:34,   nivel:"B1",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:67, nombre:"Nora Gribeluk",              edad:60,   nivel:"B1",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:68, nombre:"Liliana Diaz",               edad:55,   nivel:"B2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:69, nombre:"Quiroga Soledad",            edad:45,   nivel:"B1",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:70, nombre:"Berta Rojas",               edad:74,   nivel:"ADM1", plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:71, nombre:"Inés Roldan",               edad:null, nivel:"A1",   plan:"ARRANQUE",       contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:72, nombre:"Evangelina Cejas",           edad:44,   nivel:"B1",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:73, nombre:"Silvia Soledad Cejas",       edad:39,   nivel:"B1",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:74, nombre:"Sandra Sanchez",             edad:null, nivel:"B2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:75, nombre:"Tamara Pansia",              edad:27,   nivel:"B2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:76, nombre:"Héctor Zaragoza",            edad:64,   nivel:"B2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:77, nombre:"Sara",                       edad:null, nivel:"ADM1", plan:"ARRANQUE",       contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:78, nombre:"Mirta Liliana Cejas",        edad:48,   nivel:"B2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:79, nombre:"Marisol Juarez",             edad:null, nivel:"B2",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:80, nombre:"Laura Chávez",               edad:null, nivel:"B2",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:81, nombre:"Rubén Botini",               edad:null, nivel:"B1",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:82, nombre:"Noemí Martina Morete",       edad:61,   nivel:"B3",   plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:83, nombre:"Romina Rosales",             edad:null, nivel:"I3",   plan:"TRANSFORMACION", contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
  {id:84, nombre:"Olga Yolanda Suarez",        edad:62,   nivel:"ADM1", plan:"BIENESTAR",      contacto:"", obs:"", activo:true, estadoPago:"", metodoPago:""},
];

var HOR = {
  "LUNES": {
    "8:00": pd(mk(["Lorena Fernandez","Daiana Centurión","Paola Elizabet Campos","Romina Camargo","Romina Rosales"])),
    "9:00": pd(mk(["Lidia Gomez","Marcela Acosta","Nancy Mabel Salina","Noemi Leonor Cerone","Nora Calderon"])),
    "10:00":pd(mk(["María Belén Funes","Marisol Estanga","Victoria Fernández","Alicia Graciela Sarlangue","Natalia Albornoz"])),
    "11:00":pd(mk(["Carla Diaz","Maria Belen Percara","Adriana Cambiaso","Valeria Torre","Celia Chávez"])),
    "14:00":pd(mk(["Ángeles Villalba","Analia Valeria Coppens","Carla Melisa García","",""])),
    "15:00":pd(mk(["Sandra Rodríguez","Priscila Abril Berbese","Soledad Martirengo","Laura Durán",""])),
    "16:00":pd(mk(["Candela Comunity","Placida Noemi Caiani","Silvia Adelaida Medina","Johana Suarez",""])),
    "17:00":pd(mk(["Esther Rosana Reynoso","María del Carmen Sánchez","Lucia Rozzi","",""])),
    "18:00":pd(mk(["Mirta Noemí Quinteros","Delfina Abadie","","",""])),
    "19:00":pd(mk(["Marcela Schlegel","Silvia Lopez","Jessica Pérez","Nora Gribeluk","Liliana Diaz"])),
  },
  "MARTES": {
    "8:00": pd(mk(["Yanina Belén Eiza","Angeles Eseverri","Iara Jazmin Vega","Estefania Velozo","Sabrina Montaño"])),
    "9:00": pd(mk(["Lidia Ortiz","Nancy Mendoza","Cintia Cabrera","Selva Ramona Rosales","Quiroga Soledad"])),
    "10:00":pd(mk(["Andrea Carina Mendoza","Kiara Wastavino","Mariela Juarez","Olga Decima","Berta Rojas"])),
    "11:00":pd(mk(["Inés Roldan","Olga Yolanda Suarez","","",""])),
    "14:00":pd(mk(["","","","",""])),
    "15:00":pd(mk(["Evangelina Cejas","Silvia Soledad Cejas","","",""])),
    "16:00":pd(mk(["Guadalupe Vicente","Dario Suárez","Sandra Sanchez","Tamara Pansia","Héctor Zaragoza"])),
    "17:00":pd(mk(["Lucia Makutenas","Sara","","",""])),
    "18:00":pd(mk(["Juan Carlos Cortéz","Marcela Monescao","Mirta Liliana Cejas","Marisol Juarez",""])),
    "19:00":pd(mk(["Marisa Bermudes","Mario Chavez","Laura Chávez","Rubén Botini","Noemí Martina Morete"])),
  },
  "MIÉRCOLES": {
    "8:00": pd(mk(["Lorena Fernandez","Daiana Centurión","Paola Elizabet Campos","Romina Rosales",""])),
    "9:00": pd(mk(["Lidia Gomez","Marcela Acosta","Nancy Mabel Salina","Noemi Leonor Cerone","Nora Calderon"])),
    "10:00":pd(mk(["María Belén Funes","Marisol Estanga","Victoria Fernández","Alicia Graciela Sarlangue","Natalia Albornoz"])),
    "11:00":pd(mk(["Carla Diaz","Maria Belen Percara","Adriana Cambiaso","Paula Ordóñez","Valeria Torre"])),
    "14:00":pd(mk(["Ángeles Villalba","Analia Valeria Coppens","Carla Melisa García","Hilda",""])),
    "15:00":pd(mk(["Sandra Rodríguez","Priscila Abril Berbese","Soledad Martirengo","Maria Celeste Ferrari","Laura Durán"])),
    "16:00":pd(mk(["Candela Comunity","Placida Noemi Caiani","Norma Bulacio","Silvia Adelaida Medina","Johana Suarez"])),
    "17:00":pd(mk(["Esther Rosana Reynoso","Alicia Acosta","Alicia Faccio","",""])),
    "18:00":pd(mk(["Mirta Noemí Quinteros","Olga Ferreyro","Delfina Abadie","",""])),
    "19:00":pd(mk(["Marcela Schlegel","Silvia Lopez","Jessica Pérez","Nora Gribeluk","Liliana Diaz"])),
  },
  "JUEVES": {
    "8:00": pd(mk(["Yanina Belén Eiza","Angeles Eseverri","Iara Jazmin Vega","Estefania Velozo","Sabrina Montaño"])),
    "9:00": pd(mk(["Lidia Ortiz","Nancy Mendoza","Cintia Cabrera","Selva Ramona Rosales","Quiroga Soledad"])),
    "10:00":pd(mk(["Andrea Carina Mendoza","Kiara Wastavino","Mariela Juarez","Olga Decima","Berta Rojas"])),
    "11:00":pd(mk(["Olga Yolanda Suarez","","","",""])),
    "14:00":pd(mk(["","","","",""])),
    "15:00":pd(mk(["Evangelina Cejas","Silvia Soledad Cejas","","",""])),
    "16:00":pd(mk(["Guadalupe Vicente","María del Carmen Sánchez","Sandra Sanchez","Tamara Pansia","Héctor Zaragoza"])),
    "17:00":pd(mk(["Lucia Makutenas","","","",""])),
    "18:00":pd(mk(["Juan Carlos Cortéz","Marcela Monescao","Mirta Liliana Cejas","Marisol Juarez",""])),
    "19:00":pd(mk(["Marisa Bermudes","Mario Chavez","Laura Chávez","Rubén Botini","Noemí Martina Morete"])),
  },
  "VIERNES": {
    "8:00": pd(mk(["Lorena Fernandez","Daiana Centurión","Paola Elizabet Campos","Romina Camargo","Romina Rosales"])),
    "9:00": pd(mk(["Lidia Gomez","Marcela Acosta","Nancy Mabel Salina","Noemi Leonor Cerone","Nora Calderon"])),
    "10:00":pd(mk(["Yanina Belén Eiza","Marisol Estanga","Victoria Fernández","Alicia Graciela Sarlangue","Natalia Albornoz"])),
    "11:00":pd(mk(["Carla Diaz","Maria Belen Percara","Adriana Cambiaso","Paula Ordóñez","Valeria Torre"])),
    "14:00":pd(mk(["Ángeles Villalba","Analia Valeria Coppens","Hilda","",""])),
    "15:00":pd(mk(["Sandra Rodríguez","Priscila Abril Berbese","Soledad Martirengo","Maria Celeste Ferrari","Laura Durán"])),
    "16:00":pd(mk(["Dario Suárez","Norma Bulacio","Silvia Adelaida Medina","Johana Suarez",""])),
    "17:00":pd(mk(["Esther Rosana Reynoso","Alicia Acosta","Alicia Faccio","Lucia Rozzi",""])),
    "18:00":pd(mk(["Mirta Noemí Quinteros","Olga Ferreyro","","",""])),
    "19:00":pd(mk(["Marcela Schlegel","Silvia Lopez","Olga Ferreyro","",""])),
  }
};

export default function App() {
  const [cargando, setCargando] = useState(true);
  var [alumnos, setAlumnos] = useState(ALM);
  var [hor, setHor] = useState(HOR);
  var [pagos, setPagos] = useState([]);
  var [hist, setHist] = useState([]);
  var [dia, setDia] = useState(getDiaHoy);
  var [tab, setTab] = useState("horario");

  // Fechas dinámicas de la semana actual
  var fechasSemana = getFechasSemana();
  var semanaLabel = getSemanaLabel(fechasSemana);
  var [selH, setSelH] = useState(null);
  var [detA, setDetA] = useState(null);
  var [toast, setToast] = useState(null);
  var [modal, setModal] = useState(null);
  var [busq, setBusq] = useState("");
  var [recBusq, setRecBusq] = useState("");
  var [recSlot, setRecSlot] = useState(null);
  var [form, setForm] = useState({ nombre:"", edad:"", nivel:"B1", plan:"BIENESTAR", contacto:"", obs:"", d1:"", h1:"", d2:"", h2:"", d3:"", h3:"" });
  var [eForm, setEForm] = useState(null);
  var [delId, setDelId] = useState(null);
  var [pagoA, setPagoA] = useState(null);
  var [pMes, setPMes] = useState("");
  var [pagoParts, setPagoParts] = useState([{ metodo:"Efectivo", importe:"" }]);
  var [modalCambioTurno, setModalCambioTurno] = useState(null);

  // ── Cargar datos de Firebase al iniciar ──────────────────────
  useEffect(function() {
    cargarTodo().then(function(datos) {
      if (datos.alumnos)   setAlumnos(datos.alumnos);
      if (datos.horarios)  setHor(datos.horarios);
      if (datos.pagos)     setPagos(datos.pagos);
      if (datos.historial) setHist(datos.historial);
      setCargando(false);
    }).catch(function() {
      setCargando(false);
    });
  }, []);

  // ── Guardar en Firebase cada vez que cambian los datos ────────
  useEffect(function() { if (!cargando) guardarAlumnos(alumnos); }, [alumnos, cargando]);
  useEffect(function() { if (!cargando) guardarHorarios(hor); }, [hor, cargando]);
  useEffect(function() { if (!cargando) guardarPagos(pagos); }, [pagos, cargando]);
  useEffect(function() { if (!cargando) guardarHistorial(hist); }, [hist, cargando]);

  function msg(m, t) {
    setToast({ m: m, t: t || "ok" });
    setTimeout(function() { setToast(null); }, 2500);
  }

  var activos = alumnos.filter(function(a) { return a.activo; });
  var cd = hor[dia] || {};

  function setSlots(d, h, fn) {
    setHor(function(prev) {
      var nd = {};
      Object.keys(prev).forEach(function(dk) { nd[dk] = prev[dk]; });
      var nh = {};
      Object.keys(nd[d]).forEach(function(hk) { nh[hk] = nd[d][hk]; });
      nh[h] = (nh[h] || []).map(fn);
      nd[d] = nh;
      return nd;
    });
  }

  function togAsist(h, si) {
    setSlots(dia, h, function(s, i) {
      if (i !== si) return s;
      if (s.recupero) return { nombre: s.nombre, asistencia: s.asistencia, recupero: { nombre: s.recupero.nombre, asistencia: !s.recupero.asistencia } };
      if (!s.nombre.trim()) return s;
      return { nombre: s.nombre, asistencia: !s.asistencia, recupero: null };
    });
  }

  function asigRec(alumno) {
    if (!recSlot) return;
    var tit = "";
    var slots = (cd[recSlot.h] || []);
    if (slots[recSlot.si]) tit = slots[recSlot.si].nombre;
    setSlots(dia, recSlot.h, function(s, i) {
      if (i !== recSlot.si) return s;
      return { nombre: s.nombre, asistencia: s.asistencia, recupero: { nombre: alumno.nombre, asistencia: false } };
    });
    setHist(function(p) { return [{ fecha: today(), tipo: "RECUPERO", alumno: alumno.nombre, det: dia + " " + recSlot.h + " (tit: " + tit + ")" }].concat(p); });
    setRecSlot(null);
    setRecBusq("");
    msg("Recupero: " + alumno.nombre + " ✓");
  }

  function quitRec(h, si) {
    setSlots(dia, h, function(s, i) {
      if (i !== si) return s;
      return { nombre: s.nombre, asistencia: s.asistencia, recupero: null };
    });
    msg("Recupero quitado", "warn");
  }

  function getStats(d) {
    var tot = 0, pre = 0, rec = 0;
    var dh = hor[d] || {};
    Object.keys(dh).forEach(function(h) {
      dh[h].forEach(function(s) {
        if (s.nombre.trim()) { tot++; if (s.asistencia) pre++; }
        if (s.recupero) { tot++; if (s.recupero.asistencia) pre++; rec++; }
      });
    });
    return { tot: tot, pre: pre, rec: rec };
  }

  function ausHora(h) {
    return (cd[h] || []).filter(function(s) { return s.nombre.trim() && !s.asistencia && !s.recupero; });
  }

  function guardaNuevo() {
    if (!form.nombre.trim()) { msg("Nombre obligatorio", "warn"); return; }
    var nv = { id: nid(alumnos), nombre: form.nombre.trim(), edad: form.edad ? parseInt(form.edad) : null, nivel: form.nivel, plan: form.plan, contacto: form.contacto, obs: form.obs, activo: true, estadoPago: "", metodoPago: "" };
    setAlumnos(function(p) { return p.concat([nv]); });
    var clases = [{ d: form.d1, h: form.h1 }, { d: form.d2, h: form.h2 }, { d: form.d3, h: form.h3 }].filter(function(c) { return c.d && c.h; });
    clases.forEach(function(c) {
      setHor(function(prev) {
        var nd = JSON.parse(JSON.stringify(prev));
        if (!nd[c.d] || !nd[c.d][c.h]) return prev;
        var idx = -1;
        nd[c.d][c.h].forEach(function(s, i) { if (idx === -1 && !s.nombre.trim()) idx = i; });
        if (idx === -1) return prev;
        nd[c.d][c.h][idx] = { nombre: nv.nombre, asistencia: false, recupero: null };
        return nd;
      });
    });
    setHist(function(p) { return [{ fecha: today(), tipo: "ALTA", alumno: nv.nombre, det: "Plan " + nv.plan }].concat(p); });
    setModal(null);
    msg(nv.nombre + " registrado ✓");
  }

  function guardaEdit() {
    if (!eForm) return;
    setAlumnos(function(p) { return p.map(function(a) { return a.id === eForm.id ? eForm : a; }); });
    if (detA && detA.id === eForm.id) setDetA(eForm);
    setHist(function(p) { return [{ fecha: today(), tipo: "EDICIÓN", alumno: eForm.nombre, det: "Datos actualizados" }].concat(p); });
    setModal(null);
    msg("Actualizado ✓");
  }

  function baja(id) {
    var a = null;
    alumnos.forEach(function(x) { if (x.id === id) a = x; });
    if (!a) return;
    setAlumnos(function(p) { return p.map(function(x) { return x.id === id ? Object.assign({}, x, { activo: false }) : x; }); });
    setHor(function(prev) {
      var nd = JSON.parse(JSON.stringify(prev));
      DIAS.forEach(function(d) {
        HORAS.forEach(function(h) {
          if (nd[d] && nd[d][h]) {
            nd[d][h] = nd[d][h].map(function(s) {
              return s.nombre === a.nombre ? { nombre: "", asistencia: false, recupero: null } : s;
            });
          }
        });
      });
      return nd;
    });
    setHist(function(p) { return [{ fecha: today(), tipo: "BAJA", alumno: a.nombre, det: "Dado de baja" }].concat(p); });
    setDelId(null);
    if (detA && detA.id === id) setDetA(null);
    msg(a.nombre + " dado de baja", "warn");
  }

  function guardaPago() {
    if (!pagoA) return;
    var totalPlan = getPlan(pagoA.plan).precio;
    var mes = pMes || new Date().toLocaleString("es-AR", { month: "long" });
    var partsValidas = pagoParts.filter(function(p) { return p.importe && parseInt(p.importe) > 0; });
    if (partsValidas.length === 0) { partsValidas = [{ metodo: "Efectivo", importe: "" + totalPlan }]; }
    var totalPagado = partsValidas.reduce(function(s, p) { return s + parseInt(p.importe); }, 0);
    var nuevos = partsValidas.map(function(p) {
      return { id: nid(pagos), alumnoId: pagoA.id, alumno: pagoA.nombre, plan: pagoA.plan, importe: parseInt(p.importe), metodo: p.metodo, mes: mes, fecha: today() };
    });
    setPagos(function(prev) { return nuevos.concat(prev); });
    var resumen = partsValidas.map(function(p) { return p.metodo + " $" + parseInt(p.importe).toLocaleString("es-AR"); }).join(" + ");
    var metodoLabel = partsValidas.length > 1 ? "Mixto" : partsValidas[0].metodo;
    setAlumnos(function(p) { return p.map(function(a) { return a.id === pagoA.id ? Object.assign({}, a, { estadoPago: "SI", metodoPago: metodoLabel }) : a; }); });
    setHist(function(p) { return [{ fecha: today(), tipo: "PAGO", alumno: pagoA.nombre, det: "$" + totalPagado.toLocaleString("es-AR") + " · " + resumen }].concat(p); });
    setPagoA(null);
    msg("Pago registrado ✓");
  }

  function cambiarTurno(alumno, diaViejo, horaVieja, diaNuevo, horaNueva) {
    setHor(function(prev) {
      var nd = JSON.parse(JSON.stringify(prev));
      // Quitar del turno viejo
      if (nd[diaViejo] && nd[diaViejo][horaVieja]) {
        nd[diaViejo][horaVieja] = nd[diaViejo][horaVieja].map(function(s) {
          return s.nombre === alumno.nombre ? { nombre:"", asistencia:false, recupero:null } : s;
        });
      }
      // Agregar al turno nuevo
      if (nd[diaNuevo] && nd[diaNuevo][horaNueva]) {
        var idx = -1;
        nd[diaNuevo][horaNueva].forEach(function(s, i) { if (idx === -1 && !s.nombre.trim()) idx = i; });
        if (idx !== -1) nd[diaNuevo][horaNueva][idx] = { nombre: alumno.nombre, asistencia: false, recupero: null };
      }
      return nd;
    });
    setHist(function(p) { return [{ fecha: today(), tipo: "CAMBIO TURNO", alumno: alumno.nombre, det: diaViejo + " " + horaVieja + " → " + diaNuevo + " " + horaNueva }].concat(p); });
    setModalCambioTurno(null);
    msg("Turno cambiado ✓");
  }

  function getClasesAlumno(nombre) {
    var list = [];
    DIAS.forEach(function(d) {
      HORAS.forEach(function(h) {
        var slots = (HOR[d] && HOR[d][h]) ? HOR[d][h] : [];
        var found = false;
        slots.forEach(function(s) { if (s.nombre === nombre) found = true; });
        if (found) list.push(d + " " + h + "hs");
      });
    });
    return list;
  }

  var filtAlm = activos.filter(function(a) {
    return a.nombre.toLowerCase().indexOf(busq.toLowerCase()) !== -1 || a.plan.toLowerCase().indexOf(busq.toLowerCase()) !== -1;
  });

  var recFilt = activos.filter(function(a) {
    return a.nombre.toLowerCase().indexOf(recBusq.toLowerCase()) !== -1;
  }).slice(0, 8);

  var ds = getStats(dia);
  var G = { fontFamily: FONT };

  function Chip(props) {
    var s = props.s;
    var isR = !!s.recupero;
    var nm = isR ? s.recupero.nombre : s.nombre;
    var pr = isR ? s.recupero.asistencia : s.asistencia;
    var em = !nm.trim();
    var bg = em ? "#f0f4ff" : isR ? "#e0f7ff" : pr ? "#d0fff4" : "#fff3e0";
    var col = em ? "#b0bcd8" : isR ? C.sky : pr ? C.teal : C.accent2;
    return (
      <span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:bg, color:col, maxWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"inline-block", fontFamily:FONT, fontWeight:600 }}>
        {isR ? "🔄 " : ""}{nm.trim() || "libre"}
      </span>
    );
  }

  function Av(props) {
    var n = props.n || "?";
    var size = props.size || 32;
    return (
      <div style={{ width:size, height:size, borderRadius:"50%", background:pcolor(props.plan), display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:size*0.4, flexShrink:0, fontFamily:FONT }}>
        {n[0].toUpperCase()}
      </div>
    );
  }

  // Pantalla de carga
  if (cargando) {
    return (
      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#2c3e35,#2d8c7e,#5b8fa8)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Nunito', sans-serif" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🧘</div>
        <div style={{ fontSize:26, fontWeight:900, color:"#fff", letterSpacing:2, fontFamily:"serif" }}>STUDIO LC</div>
        <div style={{ fontSize:36, fontWeight:900, color:"#fff", letterSpacing:4 }}>PILATES</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.7)", marginTop:20, fontWeight:600 }}>Cargando datos...</div>
        <div style={{ width:48, height:4, background:"rgba(255,255,255,.3)", borderRadius:2, marginTop:12, overflow:"hidden" }}>
          <div style={{ width:"60%", height:"100%", background:"#fff", borderRadius:2, animation:"slide 1.2s ease-in-out infinite" }} />
        </div>
        <style>{"@keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }"}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, color:C.dark, fontSize:14 }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Righteous&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg, #2c3e35 0%, #2d8c7e 60%, #5b8fa8 100%)", padding:"16px 18px 13px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:46, height:46, borderRadius:"50%", border:"2px solid rgba(255,255,255,.5)", background:"rgba(255,255,255,.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🧘</div>
          <div>
            <div style={{ fontSize:10, letterSpacing:5, color:"rgba(255,255,255,.75)", textTransform:"uppercase", fontWeight:700 }}>Studio LC</div>
            <div style={{ fontSize:25, fontWeight:900, color:"#fff", fontFamily:"'Righteous', cursive", letterSpacing:2 }}>PILATES</div>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.65)", textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>{semanaLabel}</div>
          <div style={{ fontSize:13, color:"#fff", fontWeight:800 }}>{activos.length} alumnos 💪</div>
        </div>
      </div>

      {/* DÍAS */}
      <div style={{ background:"linear-gradient(135deg, #256b5f 0%, #2d8c7e 100%)", display:"flex" }}>
        {DIAS.map(function(d, i) {
          var st = getStats(d);
          var act = d === dia;
          var fecha = fechasSemana[i];
          var esHoy = new Date().toDateString() === fecha.toDateString();
          return (
            <button key={d} onClick={function() { setDia(d); setSelH(null); }} style={{ flex:1, padding:"9px 2px 7px", border:"none", cursor:"pointer", background:act?"rgba(255,255,255,.2)":"transparent", color:"#fff", fontWeight:act?900:600, fontFamily:FONT, borderBottom:act?"3px solid #fff":"3px solid transparent", transition:"all .15s", position:"relative" }}>
              <div style={{ fontSize:10, opacity:.75 }}>{DS[i]}</div>
              <div style={{ fontSize:14, fontWeight:800 }}>{formatFechaCorta(fecha)}</div>
              <div style={{ fontSize:9, opacity:.7 }}>{st.pre}/{st.tot}</div>
              {esHoy && !act && (
                <div style={{ position:"absolute", top:4, right:"50%", transform:"translateX(10px)", width:5, height:5, borderRadius:"50%", background:"#fff" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* TABS */}
      <div style={{ display:"flex", background:C.card, borderBottom:"2px solid "+C.border, boxShadow:"0 2px 8px rgba(45,140,126,.08)" }}>
        {[["horario","📋","Horario"],["alumnos","👤","Alumnos"],["pagos","💰","Pagos"],["historial","📜","Historial"],["stats","📊","Stats"]].map(function(item) {
          var v = item[0]; var ic = item[1]; var lbl = item[2];
          var act = tab === v && !selH && !detA;
          return (
            <button key={v} onClick={function() { setTab(v); setSelH(null); setDetA(null); }} style={{ flex:1, padding:"10px 0 8px", border:"none", background:"none", cursor:"pointer", fontFamily:FONT, fontWeight:act?800:600, color:act?C.header:C.soft, borderBottom:act?"3px solid "+C.header:"3px solid transparent" }}>
              <div style={{ fontSize:14 }}>{ic}</div>
              <div style={{ fontSize:9, marginTop:1 }}>{lbl}</div>
            </button>
          );
        })}
      </div>

      <div style={{ padding:"14px 13px 80px", maxWidth:680, margin:"0 auto" }}>

        {/* HORARIO */}
        {tab === "horario" && !selH && (
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              {[["Inscr.",ds.tot,C.charcoal,"#eef1f0"],["Pres.",ds.pre,C.header,"#d4eeeb"],["Ausen.",ds.tot-ds.pre,C.danger,"#fde8e8"],["Recup.",ds.rec,C.accent2,"#dceef5"]].map(function(it) {
                return (
                  <div key={it[0]} style={{ background:it[3], border:"2px solid "+it[2]+"44", borderRadius:12, padding:"9px 10px", flex:"1 1 66px", textAlign:"center" }}>
                    <div style={{ fontSize:22, fontWeight:900, color:it[2] }}>{it[1]}</div>
                    <div style={{ fontSize:9, color:it[2], textTransform:"uppercase", fontWeight:700, letterSpacing:1 }}>{it[0]}</div>
                  </div>
                );
              })}
            </div>
            {HORAS.map(function(h) {
              var sl = cd[h] || [];
              var tot = sl.filter(function(s) { return s.nombre.trim() || s.recupero; }).length;
              var pre = sl.filter(function(s) { return (s.nombre.trim() && s.asistencia) || (s.recupero && s.recupero.asistencia); }).length;
              var recN = sl.filter(function(s) { return s.recupero; }).length;
              var aus = ausHora(h).length;
              if (!tot) return null;
              return (
                <div key={h} onClick={function() { setSelH(h); }} style={{ background:C.card, borderLeft:"5px solid "+(aus?C.accent:recN?C.sky:C.border), border:"1px solid "+C.border, borderLeft:"5px solid "+(aus?C.accent:recN?C.sky:C.border), borderRadius:14, padding:"11px 13px", cursor:"pointer", marginBottom:8, display:"flex", alignItems:"center", gap:10, boxShadow:"0 2px 8px rgba(108,63,197,.06)", transition:"transform .1s, box-shadow .1s" }}
                  onMouseEnter={function(e){e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 16px rgba(108,63,197,.13)";}}
                  onMouseLeave={function(e){e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 8px rgba(108,63,197,.06)";}}>
                  <div style={{ minWidth:46, height:46, background:"linear-gradient(135deg,"+C.charcoal+","+C.header+")", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:12, flexShrink:0, fontFamily:FONT }}>{h}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginBottom:4 }}>
                      {sl.map(function(s, si) { return <Chip key={si} s={s} />; })}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ flex:1, height:5, background:C.border, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ width:(tot ? (pre/tot*100) : 0) + "%", height:"100%", background:pre===tot?C.header:pre>tot/2?C.accent2:C.danger, borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:10, color:C.soft, fontWeight:700 }}>{pre}/{tot}</span>
                      {aus > 0 && <span style={{ fontSize:9, color:C.danger, background:"#fde8e8", padding:"1px 6px", borderRadius:10, fontWeight:700 }}>⚠{aus}</span>}
                      {recN > 0 && <span style={{ fontSize:9, color:C.accent2, background:"#dceef5", padding:"1px 6px", borderRadius:10, fontWeight:700 }}>🔄{recN}</span>}
                    </div>
                  </div>
                  <span style={{ color:"#ccc" }}>›</span>
                </div>
              );
            })}
          </div>
        )}

        {/* DETALLE CLASE */}
        {tab === "horario" && selH && (
          <div>
            <button onClick={function() { setSelH(null); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.header, fontSize:14, fontFamily:FONT, padding:0, marginBottom:12, fontWeight:700 }}>← Volver</button>
            <div style={{ background:"linear-gradient(135deg,"+C.charcoal+" 0%,"+C.header+" 100%)", borderRadius:16, padding:"14px 18px", marginBottom:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.7)", textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>
                  {dia} · {formatFechaCorta(fechasSemana[DIAS.indexOf(dia)])} {MESES[fechasSemana[DIAS.indexOf(dia)].getMonth()]}
                </div>
                <div style={{ fontSize:28, fontWeight:900, color:"#fff", fontFamily:"'Righteous', cursive" }}>{selH}hs</div>
              </div>
              <div style={{ textAlign:"right" }}>
                {(function() {
                  var sl = cd[selH] || [];
                  var p = sl.filter(function(s) { return (s.nombre.trim() && s.asistencia) || (s.recupero && s.recupero.asistencia); }).length;
                  var t = sl.filter(function(s) { return s.nombre.trim() || s.recupero; }).length;
                  return <div><div style={{ fontSize:22, fontWeight:900, color:"#fff", fontFamily:FONT }}>{p}/{t}</div><div style={{ fontSize:10, color:"rgba(255,255,255,.7)", fontWeight:600 }}>presentes</div></div>;
                })()}
              </div>
            </div>
            {ausHora(selH).length > 0 && (
              <div style={{ background:"#fde8e8", border:"2px solid "+C.danger, borderRadius:10, padding:"9px 13px", marginBottom:11, fontSize:11, color:C.danger, fontWeight:700 }}>
                ⚠️ {ausHora(selH).length} ausente{ausHora(selH).length > 1 ? "s" : ""} sin recupero — tocá 🔄
              </div>
            )}
            {(cd[selH] || []).map(function(s, si) {
              var isR = !!s.recupero;
              var nm = isR ? s.recupero.nombre : s.nombre;
              var pr = isR ? s.recupero.asistencia : s.asistencia;
              var eTA = s.nombre.trim() && !s.asistencia;
              var em = !s.nombre.trim() && !isR;
              var ai = null;
              alumnos.forEach(function(a) { if (a.nombre === s.nombre) ai = a; });
              return (
                <div key={si} style={{ background:C.card, border:"2px solid "+(isR?C.sky:pr?C.header:em?C.border:C.border), borderRadius:12, padding:"10px 12px", marginBottom:8, display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", flexShrink:0, background:isR?"linear-gradient(135deg,"+C.sky+","+C.accent2+")":pr?"linear-gradient(135deg,"+C.header+","+C.accent+")":em?C.border:C.border, display:"flex", alignItems:"center", justifyContent:"center", color:isR||pr?"#fff":C.soft, fontWeight:800, fontSize:13 }}>
                    {isR ? "🔄" : em ? "+" : nm[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:em?C.soft:C.dark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {isR ? s.recupero.nombre : s.nombre.trim() || "Lugar libre"}
                    </div>
                    <div style={{ fontSize:10, color:isR?C.sky:C.soft, fontWeight:600 }}>
                      {isR ? ("Recupero · tit: " + (s.nombre || "—")) : ai ? (getPlan(ai.plan).label + " · " + ai.nivel) : em ? "Disponible" : ("Lugar " + (si+1))}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                    {(s.nombre.trim() || isR) && (
                      <button onClick={function() { togAsist(selH, si); }} style={{ padding:"4px 10px", borderRadius:20, border:"2px solid "+(pr?C.header:C.accent2), cursor:"pointer", fontSize:11, fontFamily:FONT, fontWeight:800, background:pr?C.header:C.accent2+"22", color:pr?"#fff":C.accent2 }}>
                        {pr ? "✓ Pres." : "Ausente"}
                      </button>
                    )}
                    {eTA && !isR && (
                      <button onClick={function() { setRecSlot({ h:selH, si:si }); setRecBusq(""); }} style={{ padding:"4px 10px", borderRadius:20, border:"2px solid "+C.sky, background:C.sky+"22", color:C.sky, cursor:"pointer", fontSize:11, fontFamily:FONT, fontWeight:800 }}>🔄</button>
                    )}
                    {isR && (
                      <button onClick={function() { quitRec(selH, si); }} style={{ padding:"4px 9px", borderRadius:20, border:"2px solid "+C.danger, background:C.danger+"11", color:C.danger, cursor:"pointer", fontSize:11 }}>✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ALUMNOS */}
        {tab === "alumnos" && !detA && (
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:11 }}>
              <input value={busq} onChange={function(e) { setBusq(e.target.value); }} placeholder="🔍 Buscar alumno..." style={{ flex:1, padding:"10px 13px", border:"2px solid "+C.border, borderRadius:12, fontSize:14, fontFamily:FONT, fontWeight:600, outline:"none", color:C.dark }} />
              <button onClick={function() { setModal("nuevo"); }} style={{ padding:"10px 16px", border:"none", borderRadius:12, background:"linear-gradient(135deg,"+C.header+","+C.accent2+")", color:"#fff", cursor:"pointer", fontFamily:FONT, fontWeight:800, fontSize:13 }}>+ Nuevo</button>
            </div>
            <div style={{ fontSize:11, color:C.soft, marginBottom:10, fontWeight:600 }}>
              {activos.length} activos · {alumnos.filter(function(a){return !a.activo;}).length} baja
            </div>
            {filtAlm.map(function(a) {
              return (
                <div key={a.id} style={{ background:C.card, border:"2px solid "+C.border, borderRadius:14, padding:"10px 13px", marginBottom:7, display:"flex", alignItems:"center", gap:9, boxShadow:"0 1px 6px rgba(108,63,197,.06)" }}>
                  <div onClick={function() { setDetA(a); }} style={{ cursor:"pointer" }}><Av n={a.nombre} plan={a.plan} /></div>
                  <div onClick={function() { setDetA(a); }} style={{ flex:1, minWidth:0, cursor:"pointer" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.dark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.nombre}</div>
                    <div style={{ fontSize:10, color:C.soft, fontWeight:600 }}>{getPlan(a.plan).label} · {a.nivel} {a.estadoPago==="SI" ? "· ✅" : "· ⏳"}</div>
                  </div>
                  <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                    <button onClick={function() { setPagoA(a); setPagoParts([{metodo:"Efectivo",importe:""}]); setPMes(""); }} style={{ padding:"4px 8px", borderRadius:8, border:"2px solid "+C.teal, background:C.teal+"22", cursor:"pointer", fontSize:12, color:C.teal }}>💰</button>
                    <button onClick={function() { setEForm(Object.assign({}, a)); setModal("edit"); }} style={{ padding:"4px 8px", borderRadius:8, border:"2px solid "+C.border, background:C.bg, cursor:"pointer", fontSize:12 }}>✏️</button>
                    <button onClick={function() { setDelId(a.id); }} style={{ padding:"4px 8px", borderRadius:8, border:"2px solid "+C.danger+"44", background:C.danger+"11", cursor:"pointer", fontSize:12, color:C.danger }}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DETALLE ALUMNO */}
        {tab === "alumnos" && detA && (
          <div>
            <button onClick={function() { setDetA(null); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.header, fontSize:14, fontFamily:FONT, padding:0, marginBottom:12, fontWeight:700 }}>← Volver</button>
            <div style={{ background:"linear-gradient(135deg,"+pcolor(detA.plan)+" 0%,"+pcolor(detA.plan)+"bb 100%)", borderRadius:16, padding:"15px 18px", marginBottom:13 }}>
              <Av n={detA.nombre} plan={detA.plan} size={46} />
              <div style={{ fontSize:18, fontWeight:800, color:"#fff", marginTop:9, fontFamily:FONT }}>{detA.nombre}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.8)", marginTop:3, fontWeight:600 }}>{getPlan(detA.plan).label} · ${getPlan(detA.plan).precio.toLocaleString("es-AR")}/mes · {detA.nivel}{detA.edad ? " · " + detA.edad + "a" : ""}</div>
              {detA.contacto && <div style={{ fontSize:11, color:"rgba(255,255,255,.9)", marginTop:2, fontWeight:600 }}>📱 {detA.contacto}</div>}
              {detA.obs && <div style={{ fontSize:11, color:"rgba(255,255,255,.75)", marginTop:2 }}>📋 {detA.obs}</div>}
            </div>
            <div style={{ background:C.card, border:"2px solid "+C.border, borderRadius:14, padding:14, marginBottom:11 }}>
              <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:9 }}>Clases asignadas</div>
              {getClasesAlumno(detA.nombre).map(function(c, i) {
                var parts = c.split(" ");
                return <div key={i} style={{ padding:"6px 0", borderBottom:"1px solid "+C.border, fontSize:12, display:"flex", gap:10 }}><span style={{ minWidth:80, fontWeight:800, color:C.dark }}>{parts[0]}</span><span style={{ color:C.header, fontWeight:700 }}>{parts[1]}</span></div>;
              })}
            </div>
            <div style={{ background:C.card, border:"2px solid "+C.border, borderRadius:14, padding:14, marginBottom:11 }}>
              <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:9 }}>Pagos</div>
              {pagos.filter(function(p) { return p.alumnoId === detA.id; }).map(function(p, i) {
                return <div key={i} style={{ padding:"5px 0", borderBottom:"1px solid "+C.border, fontSize:11, display:"flex", justifyContent:"space-between", fontWeight:600 }}><span style={{ color:C.soft }}>{p.mes} · {p.metodo}</span><span style={{ fontWeight:800, color:C.teal }}>${p.importe.toLocaleString("es-AR")}</span></div>;
              })}
            </div>
            <div style={{ display:"flex", gap:7 }}>
              <button onClick={function() { setPagoA(detA); setPagoParts([{metodo:"Efectivo",importe:""}]); setPMes(""); }} style={{ flex:1, padding:"10px", border:"none", borderRadius:12, background:"linear-gradient(135deg,"+C.header+","+C.accent+")", color:"#fff", cursor:"pointer", fontFamily:FONT, fontWeight:800 }}>💰 Pago</button>
              <button onClick={function() { setEForm(Object.assign({}, detA)); setModal("edit"); }} style={{ flex:1, padding:"10px", border:"2px solid "+C.border, borderRadius:12, background:C.card, cursor:"pointer", fontFamily:FONT, fontWeight:700, color:C.dark }}>✏️ Editar</button>
              <button onClick={function() { setModalCambioTurno(detA); }} style={{ flex:1, padding:"10px", border:"2px solid "+C.sky, borderRadius:12, background:C.sky+"22", color:C.sky, cursor:"pointer", fontFamily:FONT, fontWeight:800 }}>🔄 Turno</button>
              <button onClick={function() { setDelId(detA.id); }} style={{ padding:"10px 13px", border:"2px solid "+C.danger+"44", borderRadius:12, background:C.danger+"11", cursor:"pointer", color:C.danger, fontSize:14 }}>🗑</button>
            </div>
          </div>
        )}

        {/* PAGOS */}
        {tab === "pagos" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:13 }}>
              <div style={{ background:"linear-gradient(135deg,"+C.header+","+C.accent+")", borderRadius:14, padding:"11px 13px", textAlign:"center" }}>
                <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>${pagos.reduce(function(s,p){return s+p.importe;},0).toLocaleString("es-AR")}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,.8)", textTransform:"uppercase", fontWeight:700 }}>Total recaudado</div>
              </div>
              <div style={{ background:"linear-gradient(135deg,"+C.charcoal+","+C.accent2+")", borderRadius:14, padding:"11px 13px", textAlign:"center" }}>
                <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>{pagos.length}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,.8)", textTransform:"uppercase", fontWeight:700 }}>Pagos registrados</div>
              </div>
            </div>
            {pagos.length === 0 && <div style={{ fontSize:13, color:C.soft, textAlign:"center", padding:22, fontWeight:600 }}>Sin pagos registrados aún 💸</div>}
            {pagos.map(function(p, i) {
              return (
                <div key={i} style={{ background:C.card, border:"2px solid "+C.border, borderRadius:13, padding:"9px 13px", marginBottom:7, display:"flex", alignItems:"center", gap:9, boxShadow:"0 1px 6px rgba(108,63,197,.05)" }}>
                  <Av n={p.alumno} plan={p.plan} size={30} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.dark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.alumno}</div>
                    <div style={{ fontSize:10, color:C.soft, fontWeight:600 }}>{p.mes} · {p.metodo} · {p.fecha}</div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:900, color:C.teal }}>${p.importe.toLocaleString("es-AR")}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* HISTORIAL */}
        {tab === "historial" && (
          <div>
            <div style={{ fontSize:12, color:C.soft, marginBottom:11, fontWeight:600 }}>{hist.length} evento{hist.length !== 1 ? "s" : ""} registrados</div>
            {hist.length === 0 && <div style={{ fontSize:13, color:C.soft, textAlign:"center", padding:26, fontWeight:600 }}>Sin eventos aún 📋</div>}
            {hist.map(function(e, i) {
              var colors = { ALTA:C.teal, BAJA:C.danger, "EDICIÓN":C.accent2, PAGO:C.header, RECUPERO:C.sky, "CAMBIO TURNO":C.accent };
              var icons  = { ALTA:"🟢", BAJA:"🔴", "EDICIÓN":"✏️", PAGO:"💰", RECUPERO:"🔄", "CAMBIO TURNO":"🔀" };
              var bc = colors[e.tipo] || C.border;
              return (
                <div key={i} style={{ background:C.card, borderLeft:"5px solid "+bc, border:"1px solid "+C.border, borderLeft:"5px solid "+bc, borderRadius:12, padding:"10px 13px", marginBottom:7 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:C.dark }}>{icons[e.tipo] || "•"} {e.alumno}</span>
                    <span style={{ fontSize:10, color:C.soft, fontWeight:600 }}>{e.fecha}</span>
                  </div>
                  <div style={{ fontSize:11, color:C.soft, fontWeight:600 }}>{e.det}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* STATS */}
        {tab === "stats" && (
          <div>
            <div style={{ background:C.card, border:"2px solid "+C.border, borderRadius:14, padding:14, marginBottom:12 }}>
              <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:11 }}>Ocupación — {dia}</div>
              {HORAS.map(function(h) {
                var sl = cd[h] || [];
                var t = sl.filter(function(s){return s.nombre.trim()||s.recupero;}).length;
                var p = sl.filter(function(s){return (s.nombre.trim()&&s.asistencia)||(s.recupero&&s.recupero.asistencia);}).length;
                if (!t) return null;
                return (
                  <div key={h} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <div style={{ minWidth:44, fontSize:11, fontWeight:800, color:C.dark }}>{h}</div>
                    <div style={{ flex:1, height:10, background:C.border, borderRadius:5, overflow:"hidden" }}>
                      <div style={{ width:(t/SLOTS*100)+"%", height:"100%", background:C.border+"88", borderRadius:5, overflow:"hidden" }}>
                        <div style={{ width:(t?p/t*100:0)+"%", height:"100%", background:p===t?C.header:p>t/2?C.accent2:C.danger }} />
                      </div>
                    </div>
                    <div style={{ minWidth:36, fontSize:11, color:C.soft, textAlign:"right", fontWeight:700 }}>{p}/{t}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background:"linear-gradient(135deg,"+C.charcoal+" 0%,"+C.header+" 60%,"+C.accent2+" 100%)", borderRadius:14, padding:15 }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.7)", textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:12 }}>Financiero estimado</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                <div style={{ background:"rgba(255,255,255,.15)", borderRadius:10, padding:"11px 13px" }}>
                  <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>${activos.reduce(function(s,a){return s+getPlan(a.plan).precio;},0).toLocaleString("es-AR")}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,.75)", fontWeight:700 }}>Estimado mensual</div>
                </div>
                <div style={{ background:"rgba(255,255,255,.15)", borderRadius:10, padding:"11px 13px" }}>
                  <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>{activos.length}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,.75)", fontWeight:700 }}>Alumnos activos</div>
                </div>
                <div style={{ background:"rgba(255,255,255,.15)", borderRadius:10, padding:"11px 13px" }}>
                  <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>{activos.filter(function(a){return a.plan==="TRANSFORMACION";}).length}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,.75)", fontWeight:700 }}>Transformación</div>
                </div>
                <div style={{ background:"rgba(255,255,255,.15)", borderRadius:10, padding:"11px 13px" }}>
                  <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>{activos.filter(function(a){return a.plan==="BIENESTAR";}).length}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,.75)", fontWeight:700 }}>Bienestar</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL RECUPERO */}
      {recSlot && (
        <div style={{ position:"fixed", inset:0, background:"rgba(45,45,94,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:12 }}>
          <div style={{ background:C.card, borderRadius:18, padding:20, width:"100%", maxWidth:380, fontFamily:FONT, boxShadow:"0 20px 60px rgba(108,63,197,.3)" }}>
            <div style={{ fontSize:11, color:C.sky, textTransform:"uppercase", letterSpacing:1, fontWeight:800, marginBottom:4 }}>🔄 Asignar recupero</div>
            <div style={{ fontSize:15, fontWeight:900, color:C.dark, marginBottom:11 }}>{recSlot.h}hs — Lugar {recSlot.si+1}</div>
            <input value={recBusq} onChange={function(e){setRecBusq(e.target.value);}} placeholder="🔍 Buscar alumno..." style={{ width:"100%", padding:"10px 13px", border:"2px solid "+C.border, borderRadius:10, fontSize:13, fontFamily:FONT, fontWeight:600, boxSizing:"border-box", marginBottom:9, outline:"none", color:C.dark }} />
            <div style={{ maxHeight:220, overflowY:"auto", border:"2px solid "+C.border, borderRadius:12 }}>
              {recFilt.map(function(a) {
                return (
                  <button key={a.id} onClick={function(){asigRec(a);}} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 13px", border:"none", borderBottom:"1px solid "+C.border, background:C.card, cursor:"pointer", fontFamily:FONT }}>
                    <Av n={a.nombre} plan={a.plan} size={28} />
                    <div style={{ textAlign:"left", minWidth:0, flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:C.dark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.nombre}</div>
                      <div style={{ fontSize:10, color:C.soft, fontWeight:600 }}>{getPlan(a.plan).label} · {a.nivel}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={function(){setRecSlot(null);}} style={{ width:"100%", marginTop:10, padding:"10px", border:"2px solid "+C.border, borderRadius:10, background:C.bg, cursor:"pointer", fontFamily:FONT, fontWeight:700, color:C.soft }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL NUEVO */}
      {modal === "nuevo" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(45,45,94,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:12, overflowY:"auto" }}>
          <div style={{ background:C.card, borderRadius:18, padding:20, width:"100%", maxWidth:400, fontFamily:FONT, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(108,63,197,.3)" }}>
            <div style={{ fontSize:16, fontWeight:900, color:C.dark, marginBottom:14 }}>➕ Nuevo alumno</div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:5 }}>Nombre *</div>
              <input value={form.nombre} onChange={function(e){setForm(Object.assign({},form,{nombre:e.target.value}));}} placeholder="Nombre completo" style={{ width:"100%", padding:"10px 13px", border:"2px solid "+C.border, borderRadius:10, fontSize:14, fontFamily:FONT, fontWeight:600, boxSizing:"border-box", outline:"none", color:C.dark }} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:10 }}>
              <div>
                <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:5 }}>Edad</div>
                <input type="number" value={form.edad} onChange={function(e){setForm(Object.assign({},form,{edad:e.target.value}));}} placeholder="35" style={{ width:"100%", padding:"10px 13px", border:"2px solid "+C.border, borderRadius:10, fontSize:14, fontFamily:FONT, fontWeight:600, boxSizing:"border-box", outline:"none", color:C.dark }} />
              </div>
              <div>
                <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:5 }}>Nivel</div>
                <select value={form.nivel} onChange={function(e){setForm(Object.assign({},form,{nivel:e.target.value}));}} style={{ width:"100%", padding:"10px 13px", border:"2px solid "+C.border, borderRadius:10, fontSize:14, fontFamily:FONT, fontWeight:600, boxSizing:"border-box", background:C.card, color:C.dark }}>
                  {NIVELES.map(function(n){return <option key={n}>{n}</option>;})}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:7 }}>Plan</div>
              <div style={{ display:"flex", gap:7 }}>
                {Object.keys(PLANES).map(function(k){
                  var v = PLANES[k]; var isSel = form.plan === k;
                  return (
                    <button key={k} onClick={function(){ setForm(Object.assign({},form,{plan:k,d1:"",h1:"",d2:"",h2:"",d3:"",h3:""})); }} style={{ flex:1, padding:"9px 4px", borderRadius:10, border:"2px solid "+(isSel?pcolor(k):C.border), background:isSel?pcolor(k):C.card, color:isSel?"#fff":C.soft, cursor:"pointer", fontSize:10, fontFamily:FONT, fontWeight:800 }}>
                      <div>{v.label}</div><div style={{ fontSize:9, opacity:.8 }}>{v.dias}d</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:7 }}>Horarios ({PLANES[form.plan] ? PLANES[form.plan].dias : 1} día{PLANES[form.plan] && PLANES[form.plan].dias > 1 ? "s" : ""})</div>
              {(function() {
                var planDias = PLANES[form.plan] ? PLANES[form.plan].dias : 1;
                return [["d1","h1","Día 1"],["d2","h2","Día 2"],["d3","h3","Día 3"]].slice(0, planDias).map(function(item) {
                  var dk = item[0]; var hk = item[1]; var lbl = item[2];
                  var libres = getLugaresLibres(hor, form[dk], form[hk]);
                  var dc = libres > 2 ? C.teal : libres > 0 ? C.accent2 : C.danger;
                  var dt = libres < 0 ? "" : libres === 0 ? "🔴 Sin lugares" : libres === 1 ? "🟡 1 lugar libre" : "🟢 " + libres + " lugares libres";
                  return (
                    <div key={dk} style={{ marginBottom:9 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                        <select value={form[dk]||""} onChange={function(e){var u={};u[dk]=e.target.value;setForm(Object.assign({},form,u));}} style={{ width:"100%", padding:"9px 11px", border:"2px solid "+C.border, borderRadius:9, fontSize:13, fontFamily:FONT, fontWeight:600, background:C.card, color:C.dark }}>
                          <option value="">{lbl}</option>
                          {DIAS.map(function(d){return <option key={d}>{d}</option>;})}
                        </select>
                        <select value={form[hk]||""} onChange={function(e){var u={};u[hk]=e.target.value;setForm(Object.assign({},form,u));}} style={{ width:"100%", padding:"9px 11px", border:"2px solid "+C.border, borderRadius:9, fontSize:13, fontFamily:FONT, fontWeight:600, background:C.card, color:C.dark }}>
                          <option value="">Hora</option>
                          {HORAS.map(function(h){return <option key={h}>{h}</option>;})}
                        </select>
                      </div>
                      {dt && <div style={{ fontSize:11, color:dc, marginTop:4, fontWeight:800 }}>{dt}</div>}
                    </div>
                  );
                });
              })()}
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:5 }}>Contacto</div>
              <input value={form.contacto} onChange={function(e){setForm(Object.assign({},form,{contacto:e.target.value}));}} placeholder="Teléfono o email" style={{ width:"100%", padding:"10px 13px", border:"2px solid "+C.border, borderRadius:10, fontSize:14, fontFamily:FONT, fontWeight:600, boxSizing:"border-box", outline:"none", color:C.dark }} />
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:5 }}>Observaciones médicas</div>
              <input value={form.obs} onChange={function(e){setForm(Object.assign({},form,{obs:e.target.value}));}} placeholder="Ej: lumbalgia…" style={{ width:"100%", padding:"10px 13px", border:"2px solid "+C.border, borderRadius:10, fontSize:14, fontFamily:FONT, fontWeight:600, boxSizing:"border-box", outline:"none", color:C.dark }} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={function(){setModal(null);}} style={{ flex:1, padding:"11px", border:"2px solid "+C.border, borderRadius:11, background:C.bg, cursor:"pointer", fontFamily:FONT, fontWeight:700, color:C.soft }}>Cancelar</button>
              <button onClick={guardaNuevo} style={{ flex:1, padding:"11px", border:"none", borderRadius:11, background:"linear-gradient(135deg,"+C.header+","+C.accent2+")", color:"#fff", cursor:"pointer", fontFamily:FONT, fontWeight:900, fontSize:14 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modal === "edit" && eForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(45,45,94,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:12 }}>
          <div style={{ background:C.card, borderRadius:18, padding:20, width:"100%", maxWidth:380, fontFamily:FONT, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(108,63,197,.3)" }}>
            <div style={{ fontSize:16, fontWeight:900, color:C.dark, marginBottom:14 }}>✏️ Editar alumno</div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:5 }}>Nombre</div>
              <input value={eForm.nombre} onChange={function(e){setEForm(Object.assign({},eForm,{nombre:e.target.value}));}} style={{ width:"100%", padding:"10px 13px", border:"2px solid "+C.border, borderRadius:10, fontSize:14, fontFamily:FONT, fontWeight:600, boxSizing:"border-box", outline:"none", color:C.dark }} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:10 }}>
              <div>
                <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:5 }}>Edad</div>
                <input type="number" value={eForm.edad||""} onChange={function(e){setEForm(Object.assign({},eForm,{edad:e.target.value?parseInt(e.target.value):null}));}} style={{ width:"100%", padding:"10px 13px", border:"2px solid "+C.border, borderRadius:10, fontSize:14, fontFamily:FONT, fontWeight:600, boxSizing:"border-box", outline:"none", color:C.dark }} />
              </div>
              <div>
                <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:5 }}>Nivel</div>
                <select value={eForm.nivel} onChange={function(e){setEForm(Object.assign({},eForm,{nivel:e.target.value}));}} style={{ width:"100%", padding:"10px 13px", border:"2px solid "+C.border, borderRadius:10, fontSize:14, fontFamily:FONT, fontWeight:600, background:C.card, color:C.dark }}>
                  {NIVELES.map(function(n){return <option key={n}>{n}</option>;})}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:7 }}>Plan</div>
              <div style={{ display:"flex", gap:7 }}>
                {Object.keys(PLANES).map(function(k){
                  return <button key={k} onClick={function(){setEForm(Object.assign({},eForm,{plan:k}));}} style={{ flex:1, padding:"8px 4px", borderRadius:10, border:"2px solid "+(eForm.plan===k?pcolor(k):C.border), background:eForm.plan===k?pcolor(k):C.card, color:eForm.plan===k?"#fff":C.soft, cursor:"pointer", fontSize:10, fontFamily:FONT, fontWeight:800 }}>{PLANES[k].label}</button>;
                })}
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:5 }}>Contacto</div>
              <input value={eForm.contacto||""} onChange={function(e){setEForm(Object.assign({},eForm,{contacto:e.target.value}));}} style={{ width:"100%", padding:"10px 13px", border:"2px solid "+C.border, borderRadius:10, fontSize:14, fontFamily:FONT, fontWeight:600, boxSizing:"border-box", outline:"none", color:C.dark }} />
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:5 }}>Observaciones</div>
              <input value={eForm.obs||""} onChange={function(e){setEForm(Object.assign({},eForm,{obs:e.target.value}));}} style={{ width:"100%", padding:"10px 13px", border:"2px solid "+C.border, borderRadius:10, fontSize:14, fontFamily:FONT, fontWeight:600, boxSizing:"border-box", outline:"none", color:C.dark }} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={function(){setModal(null);}} style={{ flex:1, padding:"11px", border:"2px solid "+C.border, borderRadius:11, background:C.bg, cursor:"pointer", fontFamily:FONT, fontWeight:700, color:C.soft }}>Cancelar</button>
              <button onClick={guardaEdit} style={{ flex:1, padding:"11px", border:"none", borderRadius:11, background:"linear-gradient(135deg,"+C.charcoal+","+C.header+")", color:"#fff", cursor:"pointer", fontFamily:FONT, fontWeight:900, fontSize:14 }}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAGO */}
      {pagoA && (
        <div style={{ position:"fixed", inset:0, background:"rgba(45,45,94,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:12 }}>
          <div style={{ background:C.card, borderRadius:18, padding:20, width:"100%", maxWidth:400, fontFamily:FONT, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(108,63,197,.3)" }}>
            <div style={{ fontSize:16, fontWeight:900, color:C.dark, marginBottom:3 }}>💰 Registrar pago</div>
            <div style={{ fontSize:11, color:C.soft, marginBottom:4, fontWeight:600 }}>{pagoA.nombre} · {getPlan(pagoA.plan).label}</div>
            <div style={{ fontSize:13, color:C.teal, fontWeight:800, marginBottom:14 }}>Total plan: ${getPlan(pagoA.plan).precio.toLocaleString("es-AR")}</div>
            <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:5 }}>Mes</div>
            <input value={pMes} onChange={function(e){setPMes(e.target.value);}} placeholder="Abril" style={{ width:"100%", padding:"10px 13px", border:"2px solid "+C.border, borderRadius:10, fontSize:14, fontFamily:FONT, fontWeight:600, boxSizing:"border-box", marginBottom:13, outline:"none", color:C.dark }} />
            <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:8 }}>Partes del pago</div>
            {pagoParts.map(function(part, i) {
              return (
                <div key={i} style={{ background:C.bg, border:"2px solid "+C.border, borderRadius:12, padding:"12px 13px", marginBottom:9 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <span style={{ fontSize:11, fontWeight:800, color:C.dark }}>Parte {i+1}</span>
                    {pagoParts.length > 1 && (
                      <button onClick={function() { setPagoParts(pagoParts.filter(function(_,j){return j!==i;})); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.danger, fontSize:12, fontWeight:700 }}>✕ quitar</button>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                    {METODOS.map(function(m) {
                      var isSel = part.metodo === m;
                      return (
                        <button key={m} onClick={function() { var np = pagoParts.map(function(p,j){return j===i?Object.assign({},p,{metodo:m}):p;}); setPagoParts(np); }} style={{ flex:1, padding:"7px 3px", borderRadius:8, border:"2px solid "+(isSel?C.header:C.border), background:isSel?C.header:C.card, color:isSel?"#fff":C.soft, cursor:"pointer", fontSize:10, fontFamily:FONT, fontWeight:800 }}>{m}</button>
                      );
                    })}
                  </div>
                  <input type="number" value={part.importe} onChange={function(e){ var np = pagoParts.map(function(p,j){return j===i?Object.assign({},p,{importe:e.target.value}):p;}); setPagoParts(np); }} placeholder={"Importe (ej: " + Math.round(getPlan(pagoA.plan).precio / pagoParts.length) + ")"} style={{ width:"100%", padding:"9px 12px", border:"2px solid "+C.border, borderRadius:9, fontSize:13, fontFamily:FONT, fontWeight:600, boxSizing:"border-box", outline:"none", color:C.dark }} />
                </div>
              );
            })}
            <button onClick={function() { setPagoParts(pagoParts.concat([{metodo:"Efectivo",importe:""}])); }} style={{ width:"100%", padding:"9px", border:"2px dashed "+C.accent, borderRadius:10, background:"transparent", color:C.accent, cursor:"pointer", fontFamily:FONT, fontWeight:800, fontSize:12, marginBottom:13 }}>
              + Agregar otra parte de pago
            </button>
            {(function() {
              var total = pagoParts.reduce(function(s,p){return s+(parseInt(p.importe)||0);},0);
              var plan = getPlan(pagoA.plan).precio;
              if (total === 0) return null;
              var diff = plan - total;
              var col = diff === 0 ? C.teal : diff > 0 ? C.accent2 : C.danger;
              var txt = diff === 0 ? "✓ Total correcto" : diff > 0 ? "Faltan $" + diff.toLocaleString("es-AR") : "Excede por $" + Math.abs(diff).toLocaleString("es-AR");
              return (
                <div style={{ background:col+"15", border:"2px solid "+col, borderRadius:10, padding:"10px 13px", marginBottom:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:col, fontWeight:700 }}>Total ingresado:</span>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:16, fontWeight:900, color:col }}>${total.toLocaleString("es-AR")}</div>
                    <div style={{ fontSize:10, color:col, fontWeight:700 }}>{txt}</div>
                  </div>
                </div>
              );
            })()}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={function(){setPagoA(null);}} style={{ flex:1, padding:"11px", border:"2px solid "+C.border, borderRadius:11, background:C.bg, cursor:"pointer", fontFamily:FONT, fontWeight:700, color:C.soft }}>Cancelar</button>
              <button onClick={guardaPago} style={{ flex:1, padding:"11px", border:"none", borderRadius:11, background:"linear-gradient(135deg,"+C.header+","+C.accent+")", color:"#fff", cursor:"pointer", fontFamily:FONT, fontWeight:900, fontSize:14 }}>Confirmar pago</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BAJA */}
      {delId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(45,45,94,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:12 }}>
          <div style={{ background:C.card, borderRadius:18, padding:20, width:"100%", maxWidth:340, fontFamily:FONT, boxShadow:"0 20px 60px rgba(255,71,87,.2)" }}>
            <div style={{ fontSize:16, fontWeight:900, color:C.danger, marginBottom:9 }}>⚠️ Dar de baja</div>
            <div style={{ fontSize:13, color:C.dark, marginBottom:18, fontWeight:600 }}>
              Confirmás la baja de <strong>{(function(){ var a = null; alumnos.forEach(function(x){if(x.id===delId)a=x;}); return a ? a.nombre : ""; })()}</strong>? Se quitará de todos sus horarios.
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={function(){setDelId(null);}} style={{ flex:1, padding:"11px", border:"2px solid "+C.border, borderRadius:11, background:C.bg, cursor:"pointer", fontFamily:FONT, fontWeight:700, color:C.soft }}>Cancelar</button>
              <button onClick={function(){baja(delId);}} style={{ flex:1, padding:"11px", border:"none", borderRadius:11, background:"linear-gradient(135deg,"+C.danger+",#ff6b81)", color:"#fff", cursor:"pointer", fontFamily:FONT, fontWeight:900, fontSize:14 }}>Confirmar baja</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CAMBIAR TURNO */}
      {modalCambioTurno && (
        <div style={{ position:"fixed", inset:0, background:"rgba(45,45,94,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:12, overflowY:"auto" }}>
          <div style={{ background:C.card, borderRadius:18, padding:20, width:"100%", maxWidth:420, fontFamily:FONT, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(108,63,197,.3)" }}>
            <div style={{ fontSize:16, fontWeight:900, color:C.dark, marginBottom:3 }}>🔄 Cambiar turno</div>
            <div style={{ fontSize:11, color:C.soft, marginBottom:14, fontWeight:600 }}>{modalCambioTurno.nombre}</div>
            <div style={{ fontSize:10, color:C.header, textTransform:"uppercase", fontWeight:800, letterSpacing:1, marginBottom:9 }}>Turnos actuales</div>
            {getClasesAlumno(modalCambioTurno.nombre).map(function(c, i) {
              var parts = c.split(" ");
              var dv = parts[0]; var hv = parts[1].replace("hs","");
              return (
                <div key={i} style={{ background:C.bg, border:"2px solid "+C.border, borderRadius:12, padding:"12px 14px", marginBottom:9 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:C.dark, marginBottom:9 }}>{dv} {hv}hs → Cambiar a:</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:8 }}>
                    <select id={"nd-"+i} defaultValue="" style={{ width:"100%", padding:"9px 11px", border:"2px solid "+C.border, borderRadius:9, fontSize:13, fontFamily:FONT, fontWeight:600, background:C.card, color:C.dark }}>
                      <option value="">Nuevo día</option>
                      {DIAS.map(function(d){return <option key={d}>{d}</option>;})}
                    </select>
                    <select id={"nh-"+i} defaultValue="" style={{ width:"100%", padding:"9px 11px", border:"2px solid "+C.border, borderRadius:9, fontSize:13, fontFamily:FONT, fontWeight:600, background:C.card, color:C.dark }}>
                      <option value="">Nueva hora</option>
                      {HORAS.map(function(h){return <option key={h}>{h}</option>;})}
                    </select>
                  </div>
                  <button onClick={function() {
                    var nd = document.getElementById("nd-"+i).value;
                    var nh = document.getElementById("nh-"+i).value;
                    if (!nd || !nh) { msg("Seleccioná día y hora", "warn"); return; }
                    var libres = getLugaresLibres(hor, nd, nh);
                    if (libres === 0) { msg("Sin lugares disponibles en ese turno", "warn"); return; }
                    cambiarTurno(modalCambioTurno, dv, hv, nd, nh);
                  }} style={{ width:"100%", padding:"9px", border:"none", borderRadius:9, background:"linear-gradient(135deg,"+C.accent2+","+C.header+")", color:"#fff", cursor:"pointer", fontFamily:FONT, fontWeight:800, fontSize:13 }}>
                    Confirmar cambio
                  </button>
                </div>
              );
            })}
            <div style={{ background:C.header+"11", border:"2px solid "+C.border, borderRadius:12, padding:"12px 13px", marginBottom:13 }}>
              <div style={{ fontSize:10, color:C.header, fontWeight:800, textTransform:"uppercase", letterSpacing:1, marginBottom:9 }}>Disponibilidad</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {DIAS.map(function(d) {
                  return HORAS.map(function(h) {
                    var libres = getLugaresLibres(hor, d, h);
                    var slots = (hor[d] && hor[d][h]) ? hor[d][h] : [];
                    var hayAlumnos = slots.filter(function(s){return s.nombre.trim();}).length > 0;
                    if (!hayAlumnos && libres === SLOTS) return null;
                    var col = libres === 0 ? C.danger : libres <= 2 ? C.accent2 : C.teal;
                    return (
                      <span key={d+h} style={{ fontSize:9, padding:"3px 8px", borderRadius:10, background:col+"18", color:col, border:"1px solid "+col, whiteSpace:"nowrap", fontWeight:700 }}>
                        {DS[DIAS.indexOf(d)]} {h}: {libres}L
                      </span>
                    );
                  });
                })}
              </div>
            </div>
            <button onClick={function(){setModalCambioTurno(null);}} style={{ width:"100%", padding:"11px", border:"2px solid "+C.border, borderRadius:11, background:C.bg, cursor:"pointer", fontFamily:FONT, fontWeight:700, color:C.soft }}>Cerrar</button>
          </div>
        </div>
      )}

            {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)", background:toast.t==="warn"?"linear-gradient(135deg,"+C.danger+",#ff6b81)":"linear-gradient(135deg,"+C.header+","+C.accent+")", color:"#fff", padding:"11px 22px", borderRadius:30, fontSize:13, fontFamily:FONT, fontWeight:800, zIndex:1000, whiteSpace:"nowrap", boxShadow:"0 8px 24px rgba(0,0,0,.2)" }}>
          {toast.m}
        </div>
      )}
    </div>
  );
}
