-- =============================================
-- SEEDER DE RELLENO: 1 Cliente, 3 Procesos, 18 Postulantes
-- =============================================
-- Limpieza previa de IDs del seed
DELETE FROM public.observaciones_research WHERE proceso_id IN (
  'aa000000-0001-4000-8000-000000000001',
  'aa000000-0001-4000-8000-000000000002',
  'aa000000-0001-4000-8000-000000000003'
);
DELETE FROM public.perfiles_cargo WHERE proceso_id IN (
  'aa000000-0001-4000-8000-000000000001',
  'aa000000-0001-4000-8000-000000000002',
  'aa000000-0001-4000-8000-000000000003'
);
DELETE FROM public.postulantes WHERE proceso_id IN (
  'aa000000-0001-4000-8000-000000000001',
  'aa000000-0001-4000-8000-000000000002',
  'aa000000-0001-4000-8000-000000000003'
);
DELETE FROM public.procesos WHERE id IN (
  'aa000000-0001-4000-8000-000000000001',
  'aa000000-0001-4000-8000-000000000002',
  'aa000000-0001-4000-8000-000000000003'
);
DELETE FROM public.clientes WHERE id = 'bb000000-0001-4000-8000-000000000001';

-- =============================================
-- 1. CLIENTE
-- =============================================
INSERT INTO public.clientes (id, nombre, rut, industria, pais, ciudad, personas_contacto, created_by)
VALUES (
  'bb000000-0001-4000-8000-000000000001',
  'Grupo Austral Holdings',
  '76.482.315-7',
  'Servicios financieros',
  'Chile',
  'Santiago',
  'Carolina Méndez - Gerente de Personas
carolina.mendez@grupoaustral.cl
+56 9 6712 3344

Rodrigo Fuentes - Director de Operaciones
rodrigo.fuentes@grupoaustral.cl
+56 9 8834 5521',
  'a0000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- =============================================
-- 2. PROCESOS (3)
-- =============================================
INSERT INTO public.procesos (id, cliente_id, nombre_cargo, estado, mision_cargo, renta_obj, renta_var_def, benef_def, tipo_contrato, created_by)
VALUES
-- Proceso 1: Gerente Comercial
(
  'aa000000-0001-4000-8000-000000000001',
  'bb000000-0001-4000-8000-000000000001',
  'Gerente Comercial',
  'Entrevista Cliente',
  'Liderar la estrategia comercial de la compañía, desarrollando nuevos negocios y fortaleciendo las relaciones con clientes corporativos del segmento banca y seguros. Responsable de un equipo de 12 ejecutivos comerciales y de alcanzar las metas de revenue anual.',
  5500000,
  1200000,
  'Seguro complementario de salud, seguro de vida, bono anual de desempeño, estacionamiento, colación, celular corporativo',
  'Indefinido Fulltime - Híbrido',
  'a0000000-0000-0000-0000-000000000001'
),
-- Proceso 2: Jefe de Desarrollo de Software
(
  'aa000000-0001-4000-8000-000000000002',
  'bb000000-0001-4000-8000-000000000001',
  'Jefe de Desarrollo de Software',
  'Research',
  'Gestionar el equipo de desarrollo interno, asegurando la calidad y entrega oportuna de los proyectos tecnológicos del grupo. Definir arquitectura técnica, liderar sprints y coordinar con las áreas de negocio para la priorización del backlog.',
  4200000,
  800000,
  'Seguro complementario, bono trimestral por objetivos, capacitación anual en tecnología, día libre de cumpleaños, viernes flex',
  'Indefinido Fulltime - Remoto',
  'a0000000-0000-0000-0000-000000000001'
),
-- Proceso 3: Controller Financiero
(
  'aa000000-0001-4000-8000-000000000003',
  'bb000000-0001-4000-8000-000000000001',
  'Controller Financiero',
  'Carta Oferta',
  'Supervisar la consolidación financiera del grupo, asegurando el cumplimiento de normativas IFRS y reportando directamente al CFO. Liderar el cierre mensual, la elaboración de presupuestos y el control de gestión de las 4 filiales.',
  6000000,
  0,
  'Seguro complementario de salud, aguinaldo septiembre y diciembre, bono anual, estacionamiento',
  'Indefinido Fulltime - Presencial',
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 3. PERFILES DE CARGO
-- =============================================
INSERT INTO public.perfiles_cargo (proceso_id, descripcion, orden) VALUES
-- Gerente Comercial
('aa000000-0001-4000-8000-000000000001', 'Ingeniero Comercial, Ingeniero Civil Industrial o carrera afín con al menos 10 años de experiencia en roles comerciales B2B', 1),
('aa000000-0001-4000-8000-000000000001', 'Experiencia liderando equipos de venta de al menos 8 personas en industria financiera o seguros', 2),
('aa000000-0001-4000-8000-000000000001', 'Dominio de CRM (Salesforce o HubSpot) y metodologías de venta consultiva', 3),
('aa000000-0001-4000-8000-000000000001', 'Inglés nivel avanzado (deseable)', 4),
-- Jefe de Desarrollo
('aa000000-0001-4000-8000-000000000002', 'Ingeniero Civil Informático o carrera afín con mínimo 7 años de experiencia en desarrollo de software', 1),
('aa000000-0001-4000-8000-000000000002', 'Al menos 3 años liderando equipos de desarrollo (5+ personas) con metodologías ágiles', 2),
('aa000000-0001-4000-8000-000000000002', 'Experiencia en arquitectura de microservicios, contenedores (Docker/K8s) y cloud (AWS o GCP)', 3),
('aa000000-0001-4000-8000-000000000002', 'Conocimiento en CI/CD, testing automatizado y buenas prácticas de código', 4),
-- Controller Financiero
('aa000000-0001-4000-8000-000000000003', 'Contador Auditor o Ingeniero Comercial con especialización en finanzas corporativas y al menos 8 años de experiencia', 1),
('aa000000-0001-4000-8000-000000000003', 'Conocimiento profundo de IFRS y normativa CMF vigente', 2),
('aa000000-0001-4000-8000-000000000003', 'Experiencia en consolidación financiera multifilial y manejo avanzado de SAP FI/CO', 3),
('aa000000-0001-4000-8000-000000000003', 'Habilidades de comunicación ejecutiva para presentar ante directorio', 4)
ON CONFLICT DO NOTHING;

-- =============================================
-- 4. POSTULANTES — Proceso 1: Gerente Comercial (6)
-- =============================================
INSERT INTO public.postulantes (
  id, proceso_id, nombre, status, telefono, email, linkedin, edad, genero,
  estudios, institucion, estudios_2, institucion_2, estudios_3, institucion_3,
  cargo_actual, empresa, fecha_inicio_1, fecha_fin_1,
  cargo_2, empresa_2, fecha_inicio_2, fecha_fin_2,
  cargo_3, empresa_3, fecha_inicio_3, fecha_fin_3,
  cargo_4, empresa_4, fecha_inicio_4, fecha_fin_4,
  renta_actual, pretension_renta, benef_act, motivacion, observaciones
) VALUES
-- P1-1: Perfila
(
  'cc000000-0001-4000-8000-000000000001',
  'aa000000-0001-4000-8000-000000000001',
  'Rodrigo Alejandro Vásquez Pinto',
  'Perfila',
  '+56 9 7823 4501',
  'rodrigo.vasquez@gmail.com',
  'https://linkedin.com/in/rodrigovasquezp',
  42, 'Masculino',
  'Ingeniería Comercial', 'Universidad de Chile',
  'MBA', 'Universidad Adolfo Ibáñez',
  NULL, NULL,
  'Gerente de Ventas Corporativas', 'BCI Seguros', 'Mar 2019', 'Actualidad',
  'Subgerente Comercial', 'MetLife Chile', 'Ene 2015', 'Feb 2019',
  'Key Account Manager', 'Zurich Seguros', 'Jun 2011', 'Dic 2014',
  'Ejecutivo Comercial Senior', 'Banco Santander', 'Mar 2008', 'May 2011',
  5200000, 5800000,
  'Seguro complementario, bono anual de 2 sueldos, auto corporativo, celular, colación',
  'Le interesa el desafío de construir una operación comercial desde cero en una compañía en crecimiento. Valora la autonomía y el impacto estratégico del rol.',
  'Muy buen perfil. 14 años de experiencia comercial en seguros. Lidera equipo de 10 personas actualmente.'
),
-- P1-2: Perfila
(
  'cc000000-0001-4000-8000-000000000002',
  'aa000000-0001-4000-8000-000000000001',
  'Francisca Ignacia Morales Araya',
  'Perfila',
  '+56 9 6234 8876',
  'francisca.morales@outlook.com',
  'https://linkedin.com/in/fmoralesaraya',
  38, 'Femenino',
  'Ingeniería Civil Industrial', 'Pontificia Universidad Católica de Chile',
  'Diplomado en Dirección Comercial', 'ESE Business School',
  NULL, NULL,
  'Directora Comercial Zona Centro', 'Entel Empresas', 'Ago 2020', 'Actualidad',
  'Gerente de Cuentas Estratégicas', 'Movistar Empresas', 'Feb 2016', 'Jul 2020',
  'Jefa de Ventas B2B', 'Claro Chile', 'Ene 2013', 'Ene 2016',
  NULL, NULL, NULL, NULL,
  4800000, 5500000,
  'Seguro complementario, bono semestral, auto asignado, estacionamiento, colación diaria',
  'Busca un cambio de industria hacia servicios financieros. Le motiva el componente estratégico y la posibilidad de tener participación en las decisiones de alto nivel.',
  'Excelente candidata. Experiencia sólida en venta consultiva B2B en telecomunicaciones. Liderazgo de equipos de hasta 15 personas.'
),
-- P1-3: No interesado
(
  'cc000000-0001-4000-8000-000000000003',
  'aa000000-0001-4000-8000-000000000001',
  'Sebastián Andrés Lagos Herrera',
  'No interesado',
  '+56 9 9456 1122',
  'sebastian.lagos@corporativo.cl',
  'https://linkedin.com/in/slagosh',
  45, 'Masculino',
  'Ingeniería Comercial', 'Universidad de Santiago de Chile',
  'Magíster en Finanzas', 'Universidad de Chile',
  NULL, NULL,
  'Director Comercial', 'Scotiabank Chile', 'Ene 2018', 'Actualidad',
  'Gerente de Banca Corporativa', 'Banco de Chile', 'Mar 2013', 'Dic 2017',
  'Gerente de Sucursal', 'Banco Estado', 'Jun 2009', 'Feb 2013',
  'Ejecutivo de Empresas', 'Banco BCI', 'Ene 2006', 'May 2009',
  7200000, 7500000,
  'Auto corporativo, bono anual variable 3-4 sueldos, seguro complementario familiar, acciones de la empresa',
  NULL,
  'No le interesó. Indicó que está en un proceso de ascenso interno en Scotiabank y prefiere mantenerse. Renta actual muy por encima del rango.'
),
-- P1-4: Plan B
(
  'cc000000-0001-4000-8000-000000000004',
  'aa000000-0001-4000-8000-000000000001',
  'Catalina Paz Guerrero Soto',
  'Plan B',
  '+56 9 8345 6677',
  'catalina.guerrero@gmail.com',
  'https://linkedin.com/in/cataguerrero',
  36, 'Femenino',
  'Ingeniería Civil Industrial', 'Universidad de Concepción',
  'Diplomado en Marketing Digital', 'Pontificia Universidad Católica de Chile',
  NULL, NULL,
  'Subgerente Comercial', 'Falabella Financiero', 'May 2021', 'Actualidad',
  'Jefa de Desarrollo de Negocios', 'Cencosud Scotiabank', 'Mar 2017', 'Abr 2021',
  'Analista de Inteligencia Comercial', 'Banco Ripley', 'Ene 2014', 'Feb 2017',
  NULL, NULL, NULL, NULL,
  3900000, 4800000,
  'Seguro complementario, descuentos en tiendas del grupo, bono trimestral, colación',
  'Le interesa mucho la posición pero entiende que hay candidatos con más seniority. Dispuesta a esperar.',
  'Buen perfil pero con menos experiencia directiva que otros candidatos. Mantener como Plan B por su potencial de crecimiento.'
),
-- P1-5: No responde al perfil
(
  'cc000000-0001-4000-8000-000000000005',
  'aa000000-0001-4000-8000-000000000001',
  'Alejandro Ignacio Muñoz Reyes',
  'No responde al perfil',
  '+56 9 7123 9988',
  'alejandro.munoz@yahoo.com',
  NULL,
  33, 'Masculino',
  'Ingeniería Comercial', 'Universidad Diego Portales',
  NULL, NULL,
  NULL, NULL,
  'Jefe de Ventas Retail', 'Ripley', 'Mar 2020', 'Actualidad',
  'Supervisor de Tienda', 'Paris', 'Ene 2017', 'Feb 2020',
  'Vendedor Senior', 'Falabella', 'Jun 2014', 'Dic 2016',
  NULL, NULL, NULL, NULL,
  2600000, 3500000,
  'Descuentos en tienda, seguro básico, colación',
  'Le atrae trabajar en servicios financieros.',
  'No cumple con el perfil. Experiencia concentrada en retail presencial, sin manejo de ventas B2B ni equipos del tamaño solicitado.'
),
-- P1-6: Excede Renta
(
  'cc000000-0001-4000-8000-000000000006',
  'aa000000-0001-4000-8000-000000000001',
  'María José Fernández Cisternas',
  'Excede Renta',
  '+56 9 6654 3210',
  'mjfernandez@icloud.com',
  'https://linkedin.com/in/mjfernandezc',
  47, 'Femenino',
  'Ingeniería Civil Industrial', 'Pontificia Universidad Católica de Chile',
  'MBA', 'Kellogg School of Management',
  NULL, NULL,
  'VP Comercial Latam', 'Principal Financial Group', 'Feb 2017', 'Actualidad',
  'Directora de Ventas Cono Sur', 'AIG Seguros', 'Jun 2012', 'Ene 2017',
  'Gerente de Nuevos Negocios', 'Liberty Seguros', 'Mar 2008', 'May 2012',
  'Analista de Negocios', 'Bain & Company', 'Ene 2005', 'Feb 2008',
  9500000, 9000000,
  'Auto corporativo, bono anual de 4-6 sueldos, stock options, seguro complementario familiar, gastos de representación',
  'Interesada en el proyecto pero su expectativa salarial está muy por encima del rango.',
  'Perfil excepcional pero renta completamente fuera de rango. VP regional con MBA en Kellogg.'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 5. POSTULANTES — Proceso 2: Jefe de Desarrollo (6)
-- =============================================
INSERT INTO public.postulantes (
  id, proceso_id, nombre, status, telefono, email, linkedin, edad, genero,
  estudios, institucion, estudios_2, institucion_2, estudios_3, institucion_3,
  cargo_actual, empresa, fecha_inicio_1, fecha_fin_1,
  cargo_2, empresa_2, fecha_inicio_2, fecha_fin_2,
  cargo_3, empresa_3, fecha_inicio_3, fecha_fin_3,
  cargo_4, empresa_4, fecha_inicio_4, fecha_fin_4,
  renta_actual, pretension_renta, benef_act, motivacion, observaciones
) VALUES
-- P2-1: Perfila
(
  'cc000000-0002-4000-8000-000000000001',
  'aa000000-0001-4000-8000-000000000002',
  'Diego Sebastián Paredes Riquelme',
  'Perfila',
  '+56 9 8901 2345',
  'diego.paredes.dev@gmail.com',
  'https://linkedin.com/in/diegoparedesr',
  35, 'Masculino',
  'Ingeniería Civil Informática', 'Universidad Técnica Federico Santa María',
  'Diplomado en Arquitectura de Software', 'Pontificia Universidad Católica de Chile',
  NULL, NULL,
  'Tech Lead', 'Mercado Libre Chile', 'Ene 2021', 'Actualidad',
  'Senior Software Engineer', 'Cornershop (Uber)', 'Mar 2018', 'Dic 2020',
  'Desarrollador Full Stack', 'Globant', 'Jun 2015', 'Feb 2018',
  'Desarrollador Junior', 'Everis (NTT Data)', 'Ene 2013', 'May 2015',
  4000000, 4500000,
  'Seguro complementario, bono por objetivos, capacitación en Udemy ilimitada, home office permanente, viernes corto',
  'Busca dar el salto a una posición de liderazgo formal. Le entusiasma la posibilidad de definir arquitectura y formar equipo.',
  'Sólido perfil técnico. Experiencia en empresas de alto nivel. Lidera un squad de 6 personas actualmente en MeLi.'
),
-- P2-2: Llamar - Pendiente Contacto
(
  'cc000000-0002-4000-8000-000000000002',
  'aa000000-0001-4000-8000-000000000002',
  'Valentina Andrea Sepúlveda Bravo',
  'Llamar - Pendiente Contacto',
  '+56 9 7654 3210',
  'valentina.sepulveda@proton.me',
  'https://linkedin.com/in/valesepulveda',
  32, 'Femenino',
  'Ingeniería Civil en Computación', 'Universidad de Chile',
  'Magíster en Ciencias de la Computación', 'Universidad de Chile',
  NULL, NULL,
  'Engineering Manager', 'Buk', 'Sep 2022', 'Actualidad',
  'Senior Backend Developer', 'Fintual', 'Mar 2019', 'Ago 2022',
  'Software Developer', 'Banco Falabella', 'Ene 2017', 'Feb 2019',
  NULL, NULL, NULL, NULL,
  3800000, 4200000,
  'Seguro complementario, stock options, presupuesto anual de capacitación, horario flexible',
  NULL,
  'Referida por contacto en Fintual. No se ha podido establecer contacto telefónico, se intentará nuevamente.'
),
-- P2-3: Perfila
(
  'cc000000-0002-4000-8000-000000000003',
  'aa000000-0001-4000-8000-000000000002',
  'Tomás Alonso Figueroa Campos',
  'Perfila',
  '+56 9 6543 8877',
  'tomas.figueroa@outlook.com',
  'https://linkedin.com/in/tomasfigueroac',
  39, 'Masculino',
  'Ingeniería Civil Electrónica', 'Universidad de Concepción',
  'Diplomado en Gestión de Proyectos TI', 'Universidad Adolfo Ibáñez',
  'Certificación AWS Solutions Architect', 'Amazon Web Services',
  'Jefe de Desarrollo', 'Sonda', 'Feb 2020', 'Actualidad',
  'Líder Técnico', 'Accenture Chile', 'Mar 2016', 'Ene 2020',
  'Desarrollador Senior', 'IBM Chile', 'Ene 2013', 'Feb 2016',
  'Analista Programador', 'Indra Chile', 'Jun 2010', 'Dic 2012',
  4100000, 4500000,
  'Seguro complementario, bono semestral, certificaciones pagadas por la empresa, colación',
  'Quiere un cambio a una empresa más dinámica. Le frustra la burocracia de las consultoras grandes y busca mayor impacto.',
  'Excelente candidato. Ya tiene experiencia como Jefe de Desarrollo en Sonda (equipo de 8 personas). Certificado AWS.'
),
-- P2-4: No responde al perfil
(
  'cc000000-0002-4000-8000-000000000004',
  'aa000000-0001-4000-8000-000000000002',
  'Javiera Constanza Molina Urrutia',
  'No responde al perfil',
  '+56 9 5432 1098',
  'javiera.molina.dev@gmail.com',
  'https://linkedin.com/in/javimolina',
  28, 'Femenino',
  'Ingeniería en Informática', 'INACAP',
  NULL, NULL,
  NULL, NULL,
  'Desarrolladora Full Stack', 'Startup propia (FoodTech)', 'Mar 2023', 'Actualidad',
  'Desarrolladora Frontend', 'Carvajal Tecnología', 'Ene 2021', 'Feb 2023',
  'Practicante de Desarrollo', 'Walmart Chile', 'Jul 2020', 'Dic 2020',
  NULL, NULL, NULL, NULL,
  1800000, 3000000,
  'No tiene beneficios (emprendimiento propio)',
  'Le gustaría volver al mundo corporativo con un equipo establecido.',
  'No cumple con los requisitos mínimos. Solo 4 años de experiencia y sin trayectoria liderando equipos de desarrollo.'
),
-- P2-5: Plan B
(
  'cc000000-0002-4000-8000-000000000005',
  'aa000000-0001-4000-8000-000000000002',
  'Nicolás Esteban Rojas Gutiérrez',
  'Plan B',
  '+56 9 8765 4321',
  'nicolas.rojas.g@gmail.com',
  'https://linkedin.com/in/nicolasrojasg',
  37, 'Masculino',
  'Ingeniería Civil Informática', 'Universidad de Santiago de Chile',
  'Scrum Master Certified', 'Scrum Alliance',
  NULL, NULL,
  'Scrum Master / Tech Lead', 'Banco de Chile', 'Ene 2020', 'Actualidad',
  'Desarrollador Senior', 'Banco BCI', 'Mar 2016', 'Dic 2019',
  'Desarrollador Full Stack', 'Tata Consultancy Services', 'Jun 2013', 'Feb 2016',
  'Programador Junior', 'Synaptic Chile', 'Ene 2012', 'May 2013',
  3600000, 4000000,
  'Seguro complementario, bono anual, estacionamiento, gimnasio corporativo',
  'Le interesa un rol con más autonomía tecnológica. En banca siente que las decisiones técnicas son muy lentas.',
  'Buen perfil técnico pero su rol actual es más de Scrum Master que de líder técnico puro. Mantener como alternativa.'
),
-- P2-6: No interesado
(
  'cc000000-0002-4000-8000-000000000006',
  'aa000000-0001-4000-8000-000000000002',
  'Camila Fernanda Ortiz Bustamante',
  'No interesado',
  '+56 9 4321 8765',
  'camila.ortiz@googlemail.com',
  'https://linkedin.com/in/camilaortizb',
  34, 'Femenino',
  'Ingeniería Civil Informática', 'Universidad Técnica Federico Santa María',
  'Magíster en Data Science', 'Universidad Adolfo Ibáñez',
  NULL, NULL,
  'Head of Engineering', 'NotCo', 'Abr 2022', 'Actualidad',
  'Senior Software Engineer', 'Google (Remote)', 'Ene 2019', 'Mar 2022',
  'Software Engineer', 'Microsoft Chile', 'Jul 2016', 'Dic 2018',
  NULL, NULL, NULL, NULL,
  6500000, 6000000,
  'Stock options, seguro internacional, presupuesto de home office, viajes internacionales, horario totalmente flexible',
  NULL,
  'Declinó la oferta. Está muy cómoda en NotCo y considera que el rol propuesto sería un paso lateral en su carrera.'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. POSTULANTES — Proceso 3: Controller Financiero (6)
-- =============================================
INSERT INTO public.postulantes (
  id, proceso_id, nombre, status, telefono, email, linkedin, edad, genero,
  estudios, institucion, estudios_2, institucion_2, estudios_3, institucion_3,
  cargo_actual, empresa, fecha_inicio_1, fecha_fin_1,
  cargo_2, empresa_2, fecha_inicio_2, fecha_fin_2,
  cargo_3, empresa_3, fecha_inicio_3, fecha_fin_3,
  cargo_4, empresa_4, fecha_inicio_4, fecha_fin_4,
  renta_actual, pretension_renta, benef_act, motivacion, observaciones
) VALUES
-- P3-1: CO Aceptada
(
  'cc000000-0003-4000-8000-000000000001',
  'aa000000-0001-4000-8000-000000000003',
  'Andrea Patricia Villalobos Contreras',
  'CO Aceptada',
  '+56 9 9876 5432',
  'andrea.villalobos@gmail.com',
  'https://linkedin.com/in/andreavillalobos',
  41, 'Femenino',
  'Contador Auditor', 'Universidad de Chile',
  'Magíster en Finanzas Corporativas', 'Universidad Adolfo Ibáñez',
  'Certificación IFRS', 'ACCA Global',
  'Controller Financiero', 'Grupo Security', 'Mar 2019', 'Actualidad',
  'Subcontroller', 'LATAM Airlines', 'Ene 2015', 'Feb 2019',
  'Analista Senior de Consolidación', 'Deloitte Chile', 'Jun 2011', 'Dic 2014',
  'Analista Contable', 'EY Chile', 'Ene 2008', 'May 2011',
  5800000, 6200000,
  'Seguro complementario familiar, bono anual de 2 sueldos, estacionamiento, colación, aguinaldo navidad',
  'Le entusiasma la oportunidad de consolidar 4 filiales en una estructura más ágil que su empleador actual. Valora el reporte directo al CFO.',
  'Candidata ideal. Aceptó la carta oferta. Experiencia en consolidación multifilial, IFRS, y liderazgo de equipo contable de 6 personas.'
),
-- P3-2: CO Entregada
(
  'cc000000-0003-4000-8000-000000000002',
  'aa000000-0001-4000-8000-000000000003',
  'Gonzalo Felipe Ramírez Espinoza',
  'CO Entregada',
  '+56 9 8765 1234',
  'gonzalo.ramirez.e@outlook.com',
  'https://linkedin.com/in/gramirezespinoza',
  44, 'Masculino',
  'Ingeniería Comercial', 'Universidad de Santiago de Chile',
  'Diplomado en Control de Gestión', 'Pontificia Universidad Católica de Chile',
  'Certificación SAP FI/CO', 'SAP Education',
  'Gerente de Control de Gestión', 'Cementos Bío Bío', 'Sep 2018', 'Actualidad',
  'Controller de Filial', 'Empresas CMPC', 'Ene 2014', 'Ago 2018',
  'Analista de Presupuesto Senior', 'Codelco', 'Mar 2010', 'Dic 2013',
  'Analista Financiero', 'KPMG Chile', 'Ene 2007', 'Feb 2010',
  5500000, 6000000,
  'Seguro complementario, bono anual, transporte desde Santiago, capacitación continua',
  'Busca volver a Santiago centro. Actualmente viaja a planta en Talcahuano cada 15 días y eso afecta su calidad de vida.',
  'Excelente perfil técnico. Se le entregó carta oferta, está evaluando con su familia. Decisión para el viernes.'
),
-- P3-3: Perfila
(
  'cc000000-0003-4000-8000-000000000003',
  'aa000000-0001-4000-8000-000000000003',
  'María Soledad Fuentes Ortega',
  'Perfila',
  '+56 9 7654 9876',
  'marisol.fuentes@gmail.com',
  'https://linkedin.com/in/msolfuentes',
  37, 'Femenino',
  'Contador Auditor', 'Pontificia Universidad Católica de Valparaíso',
  'Magíster en Tributación', 'Universidad de Chile',
  NULL, NULL,
  'Subgerente de Contabilidad', 'Falabella Corporativo', 'Abr 2020', 'Actualidad',
  'Supervisora de Consolidación', 'Cencosud', 'Mar 2016', 'Mar 2020',
  'Contadora Senior', 'PwC Chile', 'Ene 2013', 'Feb 2016',
  'Contadora Junior', 'Grant Thornton Chile', 'Jun 2010', 'Dic 2012',
  4500000, 5500000,
  'Seguro complementario, descuentos en tiendas, bono por resultados, colación, estacionamiento',
  'Le atrae la posibilidad de ser la número uno del área contable-financiera. En Falabella el área está muy fragmentada.',
  'Perfil sólido en consolidación y auditoría Big4. Pendiente evaluar su experiencia con IFRS en contexto financiero puro.'
),
-- P3-4: No interesado
(
  'cc000000-0003-4000-8000-000000000004',
  'aa000000-0001-4000-8000-000000000003',
  'Roberto Carlos Henríquez Mora',
  'No interesado',
  '+56 9 6543 2109',
  'roberto.henriquez@corporativo.cl',
  'https://linkedin.com/in/rhenriquezm',
  50, 'Masculino',
  'Ingeniero Comercial', 'Universidad de Chile',
  'MBA', 'IE Business School Madrid',
  NULL, NULL,
  'CFO', 'Empresa mediana de construcción', 'Feb 2016', 'Actualidad',
  'Gerente de Finanzas', 'Empresas Penta', 'Ene 2010', 'Ene 2016',
  'Controller Senior', 'JP Morgan Chile', 'Mar 2005', 'Dic 2009',
  NULL, NULL, NULL, NULL,
  8000000, 8500000,
  'Auto corporativo, bono anual de 3 sueldos, seguro complementario familiar, gastos de representación',
  NULL,
  'Declinó. Considera que el rol de Controller es un retroceso ya que actualmente es CFO. Además, su renta está muy por encima.'
),
-- P3-5: Plan B
(
  'cc000000-0003-4000-8000-000000000005',
  'aa000000-0001-4000-8000-000000000003',
  'Paulina Beatriz Cárdenas Silva',
  'Plan B',
  '+56 9 5432 1098',
  'paulina.cardenas.s@gmail.com',
  'https://linkedin.com/in/paulinacardenas',
  34, 'Femenino',
  'Contador Auditor', 'Universidad de Santiago de Chile',
  'Diplomado en IFRS', 'Universidad de Chile',
  NULL, NULL,
  'Analista Senior de Control de Gestión', 'Grupo Bimbo Chile', 'May 2020', 'Actualidad',
  'Analista Financiero', 'Nestlé Chile', 'Ene 2017', 'Abr 2020',
  'Contadora Junior', 'BDO Chile', 'Jun 2014', 'Dic 2016',
  NULL, NULL, NULL, NULL,
  3200000, 4200000,
  'Seguro complementario, producto gratuito mensual, bono navidad, colación',
  'Quiere dar el salto a una jefatura. Le motiva la exposición al directorio y la posibilidad de liderar un equipo.',
  'Buen perfil junior-senior pero le falta experiencia en consolidación multifilial. Mantener como backup si los principales no avanzan.'
),
-- P3-6: Llamar - Pendiente Contacto
(
  'cc000000-0003-4000-8000-000000000006',
  'aa000000-0001-4000-8000-000000000003',
  'Ignacio Alonso Bravo Tapia',
  'Llamar - Pendiente Contacto',
  '+56 9 4321 5678',
  'ignacio.bravo.t@gmail.com',
  'https://linkedin.com/in/ignaciobravo',
  40, 'Masculino',
  'Ingeniería Comercial', 'Universidad Adolfo Ibáñez',
  'CFA Level III', 'CFA Institute',
  'Diplomado en Valorización de Empresas', 'Universidad de Chile',
  'Controller', 'Holding Patio', 'Ene 2019', 'Actualidad',
  'Senior Financial Analyst', 'LarrainVial', 'Mar 2014', 'Dic 2018',
  'Analista de Inversiones', 'AFP Habitat', 'Jun 2010', 'Feb 2014',
  'Analista Junior', 'Banco Central de Chile', 'Ene 2008', 'May 2010',
  5200000, 5800000,
  'Seguro complementario, bono anual, estacionamiento, CFA pagado por la empresa',
  NULL,
  'Identificado vía LinkedIn. Perfil muy interesante con CFA III y experiencia en holding. Intentar contacto esta semana.'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 7. OBSERVACIONES DE RESEARCH
-- =============================================
INSERT INTO public.observaciones_research (id, proceso_id, tipo, descripcion, orden) VALUES
-- Gerente Comercial
('dd000000-0001-4000-8000-000000000001', 'aa000000-0001-4000-8000-000000000001', 'no_interesado', 'La mayoría de candidatos no interesados ya se encuentran en posiciones de Director o VP con rentas significativamente superiores al rango ofrecido. Varios indicaron que el título de "Gerente Comercial" no les resulta atractivo frente a sus cargos actuales.', 1),
('dd000000-0001-4000-8000-000000000002', 'aa000000-0001-4000-8000-000000000001', 'no_responde_perfil', 'Se identificaron varios candidatos con experiencia comercial pero en retail presencial, sin trayectoria en ventas B2B ni experiencia en servicios financieros. También se descartaron perfiles con equipos menores a 5 personas.', 2),
-- Jefe de Desarrollo
('dd000000-0001-4000-8000-000000000003', 'aa000000-0001-4000-8000-000000000002', 'no_interesado', 'Candidatos senior de empresas tech internacionales (Google, Meta, etc.) no muestran interés por la posición debido a diferencia de renta y beneficios. El mercado tech remoto ofrece compensaciones en dólares difíciles de igualar.', 1),
('dd000000-0001-4000-8000-000000000004', 'aa000000-0001-4000-8000-000000000002', 'no_responde_perfil', 'Varios candidatos tienen perfil técnico fuerte pero carecen de experiencia en liderazgo formal de equipos. Otros tienen experiencia en gestión pero su stack tecnológico está desactualizado (Java monolítico, sin experiencia cloud).', 2),
-- Controller Financiero
('dd000000-0001-4000-8000-000000000005', 'aa000000-0001-4000-8000-000000000003', 'no_interesado', 'Perfiles de nivel CFO consideran el cargo un retroceso en su carrera. Otros controllers de grupos más grandes no ven atractivo moverse a un holding con solo 4 filiales. La renta es competitiva pero no suficiente para candidatos sobre los $7M.', 1),
('dd000000-0001-4000-8000-000000000006', 'aa000000-0001-4000-8000-000000000003', 'no_responde_perfil', 'Se encontraron contadores con buena base técnica pero sin experiencia en consolidación multifilial bajo IFRS. También se descartaron perfiles que solo han trabajado en empresas unisocietarias y no conocen normativa CMF.', 2)
ON CONFLICT DO NOTHING;