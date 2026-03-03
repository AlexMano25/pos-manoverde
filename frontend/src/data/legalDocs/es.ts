import type { LegalDocType, LegalDocument } from '../legalDocuments'

export const LEGAL_DOCUMENTS_ES: Record<LegalDocType, LegalDocument> = {
  cgv: {
    title: 'Condiciones Generales de Venta',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Articulo 1 - Objeto',
        content: [
          'Las presentes Condiciones Generales de Venta (en adelante "CGV") rigen las relaciones contractuales entre Mano Verde SA, sociedad anonima de derecho camerunes con domicilio social en Douala, Camerun (en adelante "el Proveedor"), y toda persona fisica o juridica que contrate sus servicios (en adelante "el Cliente").',
          'El Proveedor ofrece una plataforma de punto de venta (Point of Sale) accesible en modo SaaS (Software as a Service) a traves de la aplicacion web pos.manoverde.com. Este servicio permite la gestion de ventas, la emision de tickets de caja, la gestion de inventarios, el seguimiento de la tesoreria y la sincronizacion de datos entre multiples dispositivos y actividades comerciales.',
          'El uso de la plataforma POS Mano Verde implica la aceptacion plena y completa de las presentes CGV por parte del Cliente.',
        ],
      },
      {
        title: 'Articulo 2 - Acceso al servicio',
        content: [
          'El acceso al servicio requiere la creacion de una cuenta de usuario en la plataforma. El Cliente debe proporcionar informacion exacta y actualizada al momento del registro, incluyendo su nombre, direccion de correo electronico, numero de telefono e informacion relativa a su actividad comercial.',
          'El Cliente debe tener al menos 18 anos de edad o la capacidad juridica necesaria para celebrar un contrato en su jurisdiccion de residencia. En caso de uso del servicio en nombre de una persona juridica, el Cliente declara tener la autoridad necesaria para vincular a dicha entidad.',
          'La cuenta es personal y el Cliente es responsable de la confidencialidad de sus credenciales de acceso. Cualquier uso del servicio realizado con las credenciales del Cliente se presume efectuado por este.',
        ],
      },
      {
        title: 'Articulo 3 - Tarifas',
        content: [
          'El Proveedor ofrece varias formulas de suscripcion: un plan gratuito con funcionalidades limitadas y planes de pago que ofrecen funcionalidades avanzadas. Las tarifas vigentes se muestran en la pagina de precios de la plataforma.',
          'Ademas de los planes fijos, el Proveedor ofrece un modelo de facturacion por uso ("Pay-as-you-grow") a una tarifa de 0,02 USD por ticket de caja emitido. Cada nueva cuenta se beneficia de un credito inicial de 10 USD, que permite la emision de 500 tickets sin cargos adicionales.',
          'Las tarifas se expresan en dolares estadounidenses (USD) y estan sujetas a modificaciones. Cualquier modificacion tarifaria sera comunicada al Cliente con un preaviso de treinta (30) dias. Las tarifas aplicables son las vigentes al momento de la suscripcion o la renovacion de la suscripcion.',
        ],
      },
      {
        title: 'Articulo 4 - Metodos de pago',
        content: [
          'El Cliente puede abonar sus suscripciones y consumos mediante los siguientes metodos de pago: Orange Money, MTN Mobile Money y tarjeta bancaria (Visa, Mastercard).',
          'Los pagos por mobile money se procesan en tiempo real. Los pagos con tarjeta bancaria estan asegurados por un proveedor de pagos externo conforme a las normas PCI-DSS.',
          'En caso de fallo en el pago, el Proveedor se reserva el derecho de suspender el acceso a las funcionalidades de pago del servicio previa notificacion al Cliente. El Cliente dispone de un plazo de quince (15) dias para regularizar su situacion.',
        ],
      },
      {
        title: 'Articulo 5 - Duracion y rescision',
        content: [
          'Las suscripciones mensuales se contratan por un periodo de un mes, renovable tacitamente. Las suscripciones anuales se contratan por un periodo de doce (12) meses, renovable tacitamente.',
          'El Cliente puede rescindir su suscripcion en cualquier momento desde los ajustes de su cuenta. La rescision entra en vigor al final del periodo de suscripcion en curso. No se realizara ningun reembolso proporcional por el periodo restante.',
          'En caso de rescision, los datos del Cliente se conservan durante un periodo de treinta (30) dias, durante el cual el Cliente puede solicitar la exportacion de sus datos. Transcurrido dicho plazo, los datos se eliminan de forma definitiva.',
          'El Proveedor se reserva el derecho de rescindir la cuenta de un Cliente en caso de incumplimiento de las presentes CGV, previo requerimiento que haya quedado sin efecto durante un plazo de siete (7) dias.',
        ],
      },
      {
        title: 'Articulo 6 - Responsabilidad',
        content: [
          'El Proveedor se compromete a prestar el servicio con diligencia y conforme a las buenas practicas profesionales. No obstante, el servicio se proporciona "tal cual" y el Proveedor no garantiza un funcionamiento ininterrumpido o libre de errores.',
          'La responsabilidad del Proveedor no podra invocarse en caso de fuerza mayor, mal funcionamiento de la red de Internet, averia de los equipos del Cliente o cualquier causa externa al Proveedor.',
          'En cualquier caso, la responsabilidad total del Proveedor en virtud del presente contrato esta limitada al importe de las sumas efectivamente abonadas por el Cliente durante los doce (12) meses anteriores al hecho generador de responsabilidad. El Proveedor no podra en ningun caso ser considerado responsable de danos indirectos, lucro cesante, perdida de datos o interrupcion de la actividad comercial.',
        ],
      },
      {
        title: 'Articulo 7 - Propiedad intelectual',
        content: [
          'La plataforma POS Mano Verde, incluyendo su codigo fuente, su interfaz grafica, sus algoritmos, su documentacion y todos los elementos que la componen, es propiedad exclusiva de Mano Verde SA.',
          'La suscripcion confiere al Cliente un derecho de uso personal, no exclusivo e intransferible del servicio, por la duracion de la suscripcion. Este derecho no confiere ningun derecho de propiedad sobre el software o sus componentes.',
          'Toda reproduccion, representacion, modificacion, distribucion o explotacion de la plataforma o de sus elementos, total o parcialmente, sin la autorizacion previa y escrita de Mano Verde SA esta estrictamente prohibida y constituye una infraccion sancionada por las leyes vigentes.',
        ],
      },
      {
        title: 'Articulo 8 - Legislacion aplicable y jurisdiccion competente',
        content: [
          'Las presentes CGV se rigen por el derecho camerunes y, en su caso, por las disposiciones del derecho uniforme de la Organizacion para la Armonizacion del Derecho Mercantil en Africa (OHADA).',
          'En caso de litigio relativo a la interpretacion o ejecucion de las presentes CGV, las partes se esforzaran por encontrar una solucion amistosa. A falta de acuerdo amistoso en un plazo de treinta (30) dias, el litigio se sometera a los tribunales competentes de Douala, Camerun.',
          'Para cualquier reclamacion, el Cliente puede contactar al Proveedor en la siguiente direccion: direction@manoverde.com.',
        ],
      },
    ],
  },

  rgpd: {
    title: 'Politica de Proteccion de Datos Personales',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Articulo 1 - Datos recopilados',
        content: [
          'En el marco del uso de la plataforma POS Mano Verde, el Proveedor recopila las siguientes categorias de datos personales:',
          'Datos de identificacion: nombre, apellidos, direccion de correo electronico, numero de telefono, direccion postal del domicilio de la actividad comercial.',
          'Datos relativos a la actividad comercial: nombre de la empresa, sector de actividad, numero de identificacion fiscal (en su caso), informacion sobre los productos y servicios ofrecidos.',
          'Datos transaccionales: historial de ventas, importes de las transacciones, metodos de pago utilizados por los clientes del Cliente, tickets de caja emitidos.',
          'Datos tecnicos: direccion IP, tipo de navegador, sistema operativo, datos de conexion y navegacion en la plataforma.',
        ],
      },
      {
        title: 'Articulo 2 - Finalidad del tratamiento',
        content: [
          'Los datos personales recopilados se tratan para las siguientes finalidades:',
          'Funcionamiento del servicio: creacion y gestion de la cuenta de usuario, procesamiento de transacciones, sincronizacion de datos entre dispositivos, generacion de informes y estadisticas.',
          'Facturacion y gestion comercial: emision de facturas, gestion de suscripciones, seguimiento del consumo (numero de tickets emitidos), cobro de pagos.',
          'Soporte tecnico: tratamiento de solicitudes de asistencia, resolucion de incidencias tecnicas, mejora continua del servicio.',
          'Analisis y mejoras: analisis anonimizado de los usos para mejorar la plataforma, deteccion y prevencion de fraudes, estudios estadisticos agregados.',
        ],
      },
      {
        title: 'Articulo 3 - Base legal del tratamiento',
        content: [
          'El tratamiento de los datos personales se basa en las siguientes bases legales:',
          'El consentimiento del usuario, recabado durante el registro en la plataforma y que puede retirarse en cualquier momento desde los ajustes de la cuenta.',
          'La necesidad contractual: el tratamiento de los datos es indispensable para la ejecucion del contrato de servicio entre el Proveedor y el Cliente, en particular para la prestacion del servicio de punto de venta y la facturacion.',
          'El interes legitimo del Proveedor: mejora del servicio, prevencion del fraude, seguridad de la plataforma.',
          'Las obligaciones legales: conservacion de los datos financieros conforme a las obligaciones contables y fiscales aplicables.',
        ],
      },
      {
        title: 'Articulo 4 - Periodo de conservacion',
        content: [
          'Los datos personales se conservan durante los siguientes periodos:',
          'Datos de cuenta activa: los datos se conservan durante toda la duracion del uso activo del servicio, y posteriormente durante un periodo de tres (3) anos a partir de la ultima conexion del Cliente.',
          'Datos financieros y transaccionales: conforme a las obligaciones legales contables y fiscales, estos datos se conservan durante un periodo de diez (10) anos.',
          'Datos tecnicos (registros de conexion): estos datos se conservan durante un periodo de doce (12) meses.',
          'Al vencimiento de estos plazos, los datos se eliminan definitivamente o se anonimizan de forma irreversible.',
        ],
      },
      {
        title: 'Articulo 5 - Comparticion de datos',
        content: [
          'Mano Verde SA se compromete a no vender, alquilar ni ceder los datos personales de sus Clientes a terceros con fines comerciales o publicitarios.',
          'Los datos pueden compartirse con los siguientes proveedores tecnicos, estrictamente necesarios para el funcionamiento del servicio:',
          'Supabase (alojamiento de la base de datos y autenticacion): los datos se alojan en servidores seguros. Supabase cumple con los estandares de seguridad de la industria.',
          'Vercel (alojamiento de la aplicacion web y CDN): unicamente el codigo de la aplicacion se aloja en Vercel. Ningun dato personal se almacena en los servidores de Vercel.',
          'Los proveedores de pago (para el procesamiento de transacciones financieras): solo se transmiten los datos estrictamente necesarios para el procesamiento del pago.',
          'Los datos tambien pueden comunicarse a las autoridades competentes en caso de obligacion legal o por decision judicial.',
        ],
      },
      {
        title: 'Articulo 6 - Seguridad de los datos',
        content: [
          'Mano Verde SA implementa las medidas tecnicas y organizativas apropiadas para proteger los datos personales contra todo acceso no autorizado, modificacion, divulgacion o destruccion.',
          'Las medidas de seguridad incluyen, entre otras: el cifrado de los datos en transito (TLS/SSL) y en reposo, la implementacion de politicas de seguridad a nivel de filas de la base de datos (Row Level Security - RLS) que garantizan que cada Cliente solo acceda a sus propios datos, y el uso de la infraestructura segura de Supabase.',
          'Las contrasenas de los usuarios se procesan mediante algoritmos de hash seguros y nunca se almacenan en texto plano.',
          'El Proveedor se compromete a notificar a los Clientes afectados y a las autoridades competentes en caso de violacion de datos personales, conforme a las disposiciones legales aplicables.',
        ],
      },
      {
        title: 'Articulo 7 - Derechos de los usuarios',
        content: [
          'De conformidad con la normativa aplicable en materia de proteccion de datos personales, el Cliente dispone de los siguientes derechos:',
          'Derecho de acceso: el Cliente puede obtener la confirmacion de si se estan tratando o no datos que le conciernen, y obtener una copia de dichos datos.',
          'Derecho de rectificacion: el Cliente puede solicitar la correccion de datos inexactos o incompletos que le conciernan.',
          'Derecho de supresion: el Cliente puede solicitar la eliminacion de sus datos personales, salvo las obligaciones legales de conservacion.',
          'Derecho a la portabilidad: el Cliente puede obtener sus datos en un formato estructurado, de uso comun y lectura mecanica (exportacion CSV o JSON), para transmitirlos a otro proveedor.',
          'Derecho de oposicion: el Cliente puede oponerse al tratamiento de sus datos por motivos legitimos.',
          'Para ejercer estos derechos, el Cliente puede dirigir su solicitud por correo electronico a: direction@manoverde.com. El Proveedor se compromete a responder en un plazo de treinta (30) dias.',
        ],
      },
      {
        title: 'Articulo 8 - Cookies',
        content: [
          'La plataforma POS Mano Verde utiliza exclusivamente cookies tecnicas estrictamente necesarias para el funcionamiento del servicio. Estas cookies permiten la gestion de la sesion del usuario, la memorizacion de las preferencias de idioma y el mantenimiento de la conexion.',
          'No se utiliza ningun cookie de seguimiento, publicidad o analisis de comportamiento en la plataforma.',
          'Al ser estas cookies tecnicas indispensables para el funcionamiento del servicio, no requieren el consentimiento previo del usuario conforme a las disposiciones legales aplicables.',
        ],
      },
      {
        title: 'Articulo 9 - Contacto del Delegado de Proteccion de Datos',
        content: [
          'Para cualquier consulta relativa a la proteccion de sus datos personales o para ejercer sus derechos, puede contactar con nuestro Delegado de Proteccion de Datos (DPO) en la siguiente direccion:',
          'Correo electronico: direction@manoverde.com',
          'Direccion postal: Mano Verde SA, Douala, Camerun.',
          'Usted tiene tambien el derecho de presentar una reclamacion ante la autoridad de control competente si considera que el tratamiento de sus datos personales no cumple con la normativa aplicable.',
        ],
      },
    ],
  },

  terms: {
    title: 'Condiciones de Uso',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Articulo 1 - Aceptacion de las condiciones',
        content: [
          'El acceso y el uso de la plataforma POS Mano Verde (en adelante "el Servicio") estan supeditados a la aceptacion previa y sin reservas de las presentes Condiciones de Uso.',
          'Al crear una cuenta o utilizar el Servicio, el usuario reconoce haber leido, comprendido y aceptado las presentes Condiciones de Uso en su totalidad. Si el usuario no acepta estas condiciones, debe abstenerse de utilizar el Servicio.',
          'Las presentes Condiciones de Uso complementan las Condiciones Generales de Venta (CGV) y la Politica de Proteccion de Datos Personales (RGPD) accesibles desde la plataforma.',
        ],
      },
      {
        title: 'Articulo 2 - Descripcion del servicio',
        content: [
          'POS Mano Verde es un sistema de punto de venta (Point of Sale) en linea accesible a traves de un navegador web. El Servicio ofrece las siguientes funcionalidades:',
          'Gestion de ventas y emision de tickets de caja, gestion de productos y del catalogo, seguimiento de inventarios y movimientos de tesoreria, generacion de informes y estadisticas comerciales.',
          'El Servicio funciona en modo fuera de linea: el usuario puede seguir registrando ventas incluso sin conexion a Internet. Los datos se sincronizan automaticamente con la nube cuando se restablece la conexion.',
          'La sincronizacion en la nube permite al usuario acceder a sus datos desde multiples dispositivos y gestionar varias actividades comerciales desde una sola cuenta.',
        ],
      },
      {
        title: 'Articulo 3 - Creacion de cuenta',
        content: [
          'Para utilizar el Servicio, el usuario debe crear una cuenta proporcionando informacion exacta, completa y actualizada. El usuario se compromete a actualizar su informacion en caso de cambios.',
          'Cada direccion de correo electronico solo puede estar asociada a una unica cuenta de usuario. No obstante, una cuenta de usuario puede gestionar multiples organizaciones y actividades comerciales.',
          'El usuario es el unico responsable de la seguridad de su contrasena y de la confidencialidad de sus credenciales de acceso. En caso de sospecha de uso no autorizado de su cuenta, el usuario debe informar inmediatamente al Proveedor en la direccion direction@manoverde.com.',
          'El Proveedor se reserva el derecho de rechazar la creacion de una cuenta o de suspender una cuenta existente en caso de incumplimiento de las presentes condiciones.',
        ],
      },
      {
        title: 'Articulo 4 - Uso aceptable',
        content: [
          'El Servicio esta destinado exclusivamente a un uso comercial legal. El usuario se compromete a utilizar el Servicio de conformidad con las leyes y regulaciones vigentes en su jurisdiccion.',
          'Estan estrictamente prohibidos los siguientes usos: el uso del Servicio para actividades fraudulentas, ilegales o contrarias al orden publico; el intento de acceso no autorizado a los sistemas, servidores o redes del Proveedor; la descompilacion, el desensamblaje, la ingenieria inversa o cualquier intento de extraccion del codigo fuente de la plataforma.',
          'Tambien estan prohibidos: la transmision de virus, software malicioso o cualquier codigo danino a traves del Servicio; el uso de robots, scrapers o cualquier herramienta automatizada para acceder al Servicio sin autorizacion; la sobrecarga intencional de los servidores o cualquier accion susceptible de perturbar el funcionamiento del Servicio.',
          'En caso de incumplimiento de las presentes reglas de uso, el Proveedor se reserva el derecho de suspender o eliminar inmediatamente la cuenta del usuario, sin previo aviso ni indemnizacion.',
        ],
      },
      {
        title: 'Articulo 5 - Contenido del usuario',
        content: [
          'El usuario conserva la plena propiedad del conjunto de datos que introduce y almacena en la plataforma (datos de productos, transacciones, informacion de clientes, informes, etc.).',
          'Al utilizar el Servicio, el usuario otorga a Mano Verde SA una licencia limitada, no exclusiva y revocable para tratar, almacenar y mostrar dichos datos con el unico fin de prestar el Servicio. Esta licencia finaliza automaticamente con la eliminacion de la cuenta.',
          'El usuario garantiza que los datos que introduce en la plataforma no vulneran ningun derecho de propiedad intelectual de terceros y no contienen ningun contenido ilegal, difamatorio o perjudicial.',
          'El Proveedor no ejerce ningun control editorial sobre el contenido introducido por el usuario y no podra ser considerado responsable de dicho contenido.',
        ],
      },
      {
        title: 'Articulo 6 - Disponibilidad del servicio',
        content: [
          'El Proveedor se esfuerza por garantizar la disponibilidad del Servicio las 24 horas del dia, los 7 dias de la semana. No obstante, el Servicio se proporciona sobre la base del "mejor esfuerzo" y el Proveedor no garantiza una disponibilidad ininterrumpida.',
          'El Proveedor se reserva el derecho de suspender temporalmente el acceso al Servicio para operaciones de mantenimiento, actualizacion o mejora. Los mantenimientos planificados se realizaran, en la medida de lo posible, fuera de las horas de mayor uso y se anunciaran con antelacion.',
          'El plan gratuito no cuenta con ningun acuerdo de nivel de servicio (SLA). Los planes de pago cuentan con un objetivo de disponibilidad del 99,5%, excluidos los periodos de mantenimiento planificado y los casos de fuerza mayor.',
          'El modo fuera de linea integrado en el Servicio permite al usuario continuar trabajando incluso en caso de indisponibilidad temporal de la conexion a Internet o de los servidores.',
        ],
      },
      {
        title: 'Articulo 7 - Multi-actividad',
        content: [
          'El Servicio permite al usuario gestionar multiples actividades comerciales (tiendas, restaurantes, servicios, etc.) desde una unica cuenta de usuario.',
          'Cada actividad constituye un espacio de trabajo independiente con sus propios productos, transacciones, inventarios e informes. Los datos de cada actividad estan compartimentados y no se comparten entre las diferentes actividades, salvo eleccion explicita del usuario.',
          'La facturacion se calcula por actividad: el numero de tickets emitidos y las funcionalidades utilizadas se contabilizan por separado para cada actividad. El usuario puede suscribirse a planes diferentes para cada una de sus actividades.',
        ],
      },
      {
        title: 'Articulo 8 - Suspension y rescision',
        content: [
          'El Proveedor se reserva el derecho de suspender temporal o definitivamente el acceso al Servicio en caso de:',
          'Incumplimiento de las presentes Condiciones de Uso o de las Condiciones Generales de Venta; uso del Servicio con fines ilegales o fraudulentos; impago de las sumas adeudadas tras requerimiento sin efecto; comportamiento susceptible de atentar contra la seguridad, la integridad o el correcto funcionamiento del Servicio.',
          'En caso de suspension, el usuario sera notificado por correo electronico a la direccion asociada a su cuenta. El usuario podra impugnar la suspension dirigiendo una reclamacion motivada a direction@manoverde.com en un plazo de quince (15) dias.',
          'El usuario puede rescindir su cuenta en cualquier momento desde los ajustes de su cuenta o dirigiendo una solicitud a direction@manoverde.com.',
        ],
      },
      {
        title: 'Articulo 9 - Limitacion de responsabilidad',
        content: [
          'El Proveedor no podra ser considerado responsable de los danos indirectos, accesorios, especiales o consecuentes derivados del uso o de la imposibilidad de uso del Servicio, incluyendo pero sin limitarse a: perdida de beneficios, perdida de datos, interrupcion de la actividad comercial, perdida de clientela.',
          'La responsabilidad total del Proveedor frente al usuario, cualquiera que sea la causa, esta limitada al importe total de las sumas efectivamente abonadas por el usuario durante los doce (12) meses anteriores al evento que dio lugar a la reclamacion.',
          'Esta limitacion de responsabilidad se aplica en toda la medida permitida por la ley aplicable y subsiste incluso en caso de resolucion o rescision del contrato.',
        ],
      },
      {
        title: 'Articulo 10 - Modificacion de las condiciones',
        content: [
          'El Proveedor se reserva el derecho de modificar las presentes Condiciones de Uso en cualquier momento. Las modificaciones seran notificadas a los usuarios por correo electronico y/o mediante una notificacion visible en la plataforma.',
          'Los usuarios disponen de un plazo de treinta (30) dias a partir de la notificacion para tomar conocimiento de las nuevas condiciones. El uso continuado del Servicio tras dicho plazo implica la aceptacion de las nuevas condiciones.',
          'Si el usuario no acepta las nuevas condiciones, puede rescindir su cuenta antes de la expiracion del plazo de treinta dias. En tal caso, las condiciones anteriores seguiran siendo aplicables hasta la fecha efectiva de rescision.',
          'Las modificaciones sustanciales que afecten a los derechos del usuario o a las tarifas seran objeto de una comunicacion especifica y detallada.',
        ],
      },
      {
        title: 'Articulo 11 - Contacto',
        content: [
          'Para cualquier consulta, reclamacion o solicitud relativa al Servicio o a las presentes Condiciones de Uso, el usuario puede contactar al Proveedor por los siguientes medios:',
          'Correo electronico: direction@manoverde.com',
          'Direccion postal: Mano Verde SA, Douala, Camerun.',
          'El Proveedor se compromete a acusar recibo de toda solicitud en un plazo de cuarenta y ocho (48) horas laborables y a proporcionar una respuesta detallada en un plazo de treinta (30) dias.',
          'Las presentes Condiciones de Uso se rigen por el derecho camerunes. Todo litigio se sometera a los tribunales competentes de Douala, Camerun, tras intento de resolucion amistosa.',
        ],
      },
    ],
  },
}
