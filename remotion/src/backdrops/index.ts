// Реестр фонов: id из content/locations → компонент.
import type { ComponentType } from "react";
import type { BackdropProps } from "./parts";
import { Banya } from "./banya";
import { Bar } from "./bar";
import { Bolnitsa } from "./bolnitsa";
import { Derevnya } from "./derevnya";
import { Doroga } from "./doroga";
import { Gostinaya } from "./gostinaya";
import { Klass } from "./klass";
import { Kukhnya } from "./kukhnya";
import { Magazin } from "./magazin";
import { Nebesa } from "./nebesa";
import { Ofis } from "./ofis";
import { Plyazh } from "./plyazh";
import { Podyezd } from "./podyezd";
import { Samolet } from "./samolet";
import { Spalnya } from "./spalnya";
import { Sud } from "./sud";
import { Tserkov } from "./tserkov";
import { Ulitsa } from "./ulitsa";
import { Zal } from "./zal";

export const BACKDROPS: Record<string, ComponentType<BackdropProps>> = {
  "banya": Banya,
  "bar": Bar,
  "bolnitsa": Bolnitsa,
  "derevnya": Derevnya,
  "doroga": Doroga,
  "gostinaya": Gostinaya,
  "klass": Klass,
  "kukhnya": Kukhnya,
  "magazin": Magazin,
  "nebesa": Nebesa,
  "ofis": Ofis,
  "plyazh": Plyazh,
  "podyezd": Podyezd,
  "samolet": Samolet,
  "spalnya": Spalnya,
  "sud": Sud,
  "tserkov": Tserkov,
  "ulitsa": Ulitsa,
  "zal": Zal,
};
