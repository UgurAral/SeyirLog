/**
 * vehicleBrands.ts — Araç ekleme formunda öneri (autocomplete) için statik
 * marka/model listesi. Türkiye'de yaygın marka ve modelleri kapsar; listede
 * olmayan bir marka girilirse model alanı serbest metne döner.
 */

export const VEHICLE_BRANDS: Record<string, string[]> = {
  Fiat: ['Egea', 'Egea Cross', 'Panda', 'Punto', 'Doblo', '500', 'Tipo'],
  Renault: ['Clio', 'Megane', 'Symbol', 'Taliant', 'Captur', 'Kadjar', 'Talisman', 'Fluence'],
  Volkswagen: ['Passat', 'Jetta', 'Golf', 'Polo', 'Tiguan', 'T-Roc', 'Caddy'],
  Ford: ['Focus', 'Fiesta', 'Courier', 'Kuga', 'Puma', 'Transit', 'Mondeo'],
  Toyota: ['Corolla', 'Yaris', 'C-HR', 'RAV4', 'Auris', 'Hilux'],
  Hyundai: ['i20', 'i10', 'Accent Blue', 'Elantra', 'Tucson', 'Bayon'],
  Peugeot: ['301', '208', '2008', '3008', '508', 'Partner'],
  Dacia: ['Duster', 'Sandero', 'Logan', 'Jogger'],
  Opel: ['Astra', 'Corsa', 'Insignia', 'Crossland', 'Combo'],
  Citroën: ['C3', 'C-Elysée', 'C4', 'Berlingo'],
  'Mercedes-Benz': ['A Serisi', 'C Serisi', 'E Serisi', 'Vito', 'Sprinter', 'GLA'],
  BMW: ['3 Serisi', '5 Serisi', '1 Serisi', 'X1', 'X3'],
  Audi: ['A3', 'A4', 'A6', 'Q3', 'Q5'],
  Skoda: ['Octavia', 'Fabia', 'Superb', 'Kamiq'],
  Nissan: ['Qashqai', 'Micra', 'Juke', 'Note'],
  Honda: ['Civic', 'City', 'CR-V', 'Jazz'],
  Kia: ['Rio', 'Ceed', 'Sportage', 'Picanto', 'Stonic'],
  Chevrolet: ['Cruze', 'Aveo', 'Spark'],
  Mazda: ['3', '2', 'CX-5'],
  Suzuki: ['Vitara', 'Swift', 'S-Cross'],
  Seat: ['Leon', 'Ibiza', 'Arona'],
  Volvo: ['S60', 'XC40', 'XC60'],
  Mitsubishi: ['Lancer', 'ASX', 'Outlander'],
  MG: ['ZS', 'HS', '5'],
};

export const VEHICLE_BRAND_NAMES = Object.keys(VEHICLE_BRANDS);
