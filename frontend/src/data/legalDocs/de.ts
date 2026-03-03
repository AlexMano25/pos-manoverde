import type { LegalDocType, LegalDocument } from '../legalDocuments'

export const LEGAL_DOCUMENTS_DE: Record<LegalDocType, LegalDocument> = {
  cgv: {
    title: 'Allgemeine Geschaeftsbedingungen',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Artikel 1 - Gegenstand',
        content: [
          'Die vorliegenden Allgemeinen Geschaeftsbedingungen (nachfolgend "AGB") regeln die vertraglichen Beziehungen zwischen Mano Verde SA, einer Aktiengesellschaft kamerunischen Rechts mit Sitz in Douala, Kamerun (nachfolgend "der Anbieter"), und jeder natuerlichen oder juristischen Person, die seine Dienste in Anspruch nimmt (nachfolgend "der Kunde").',
          'Der Anbieter bietet eine Registrierkassen-Plattform (Point of Sale) an, die im SaaS-Modus (Software as a Service) ueber die Webanwendung pos.manoverde.com zugaenglich ist. Dieser Dienst ermoeglicht die Verwaltung von Verkaeufen, die Ausstellung von Kassenbons, die Lagerverwaltung, die Ueberwachung der Finanzen und die Synchronisierung von Daten zwischen mehreren Geraeten und Geschaeftstaetigkeiten.',
          'Die Nutzung der Plattform POS Mano Verde setzt die vollstaendige und vorbehaltlose Akzeptanz der vorliegenden AGB durch den Kunden voraus.',
        ],
      },
      {
        title: 'Artikel 2 - Zugang zum Service',
        content: [
          'Der Zugang zum Service erfordert die Erstellung eines Benutzerkontos auf der Plattform. Der Kunde muss bei der Registrierung genaue und aktuelle Informationen angeben, insbesondere seinen Namen, seine E-Mail-Adresse, seine Telefonnummer und die Informationen zu seiner Geschaeftstaetigkeit.',
          'Der Kunde muss mindestens 18 Jahre alt sein oder die erforderliche Geschaeftsfaehigkeit besitzen, um in seinem Wohnsitzland einen Vertrag abzuschliessen. Bei Nutzung des Dienstes im Namen einer juristischen Person erklaert der Kunde, die notwendige Befugnis zu haben, diese zu binden.',
          'Das Konto ist persoenlich und der Kunde ist fuer die Vertraulichkeit seiner Zugangsdaten verantwortlich. Jede Nutzung des Dienstes, die mit den Zugangsdaten des Kunden erfolgt, gilt als von diesem durchgefuehrt.',
        ],
      },
      {
        title: 'Artikel 3 - Preisgestaltung',
        content: [
          'Der Anbieter bietet verschiedene Abonnementmodelle an: einen kostenlosen Plan mit eingeschraenkten Funktionen sowie kostenpflichtige Plaene mit erweiterten Funktionen. Die aktuellen Preise sind auf der Preisseite der Plattform einsehbar.',
          'Ergaenzend zu den Festpreisplaenen bietet der Anbieter ein nutzungsbasiertes Abrechnungsmodell ("Pay-as-you-grow") zum Preis von 0,02 USD pro ausgestelltem Kassenbon an. Jedes neue Konto erhaelt ein Anfangsguthaben von 10 USD, das die Ausstellung von 500 Kassenbons ohne zusaetzliche Kosten ermoeglicht.',
          'Die Preise sind in US-Dollar (USD) angegeben und koennen geaendert werden. Jede Preisaenderung wird dem Kunden mit einer Frist von dreissig (30) Tagen mitgeteilt. Es gelten die zum Zeitpunkt des Abschlusses oder der Verlaengerung des Abonnements gueltigen Preise.',
        ],
      },
      {
        title: 'Artikel 4 - Zahlungsmittel',
        content: [
          'Der Kunde kann seine Abonnements und Verbraeuche mit folgenden Zahlungsmitteln begleichen: Orange Money, MTN Mobile Money und Kreditkarte (Visa, Mastercard).',
          'Zahlungen per Mobile Money werden in Echtzeit verarbeitet. Kreditkartenzahlungen werden ueber einen Drittanbieter abgesichert, der den PCI-DSS-Standards entspricht.',
          'Bei fehlgeschlagener Zahlung behaelt sich der Anbieter das Recht vor, den Zugang zu den kostenpflichtigen Funktionen des Dienstes nach Benachrichtigung des Kunden zu sperren. Der Kunde hat eine Frist von fuenfzehn (15) Tagen, um seine Situation zu bereinigen.',
        ],
      },
      {
        title: 'Artikel 5 - Laufzeit und Kuendigung',
        content: [
          'Monatsabonnements werden fuer die Dauer eines Monats abgeschlossen und verlaengern sich stillschweigend. Jahresabonnements werden fuer die Dauer von zwoelf (12) Monaten abgeschlossen und verlaengern sich stillschweigend.',
          'Der Kunde kann sein Abonnement jederzeit ueber die Kontoeinstellungen kuendigen. Die Kuendigung wird zum Ende der laufenden Abonnementperiode wirksam. Eine anteilige Rueckerstattung fuer den verbleibenden Zeitraum erfolgt nicht.',
          'Im Falle einer Kuendigung werden die Daten des Kunden fuer einen Zeitraum von dreissig (30) Tagen aufbewahrt, waehrend dessen der Kunde den Export seiner Daten anfordern kann. Nach Ablauf dieser Frist werden die Daten endgueltig geloescht.',
          'Der Anbieter behaelt sich das Recht vor, das Konto eines Kunden bei Verstoss gegen die vorliegenden AGB zu kuendigen, nachdem eine Mahnung innerhalb einer Frist von sieben (7) Tagen ohne Wirkung geblieben ist.',
        ],
      },
      {
        title: 'Artikel 6 - Haftung',
        content: [
          'Der Anbieter verpflichtet sich, den Dienst mit Sorgfalt und gemaess den anerkannten Regeln der Technik zu erbringen. Der Dienst wird jedoch "wie besehen" bereitgestellt und der Anbieter garantiert keinen ununterbrochenen oder fehlerfreien Betrieb.',
          'Die Haftung des Anbieters kann nicht geltend gemacht werden bei hoehere Gewalt, Fehlfunktionen des Internets, Ausfall der Geraete des Kunden oder bei jeder anderen Ursache, die ausserhalb der Kontrolle des Anbieters liegt.',
          'In jedem Fall ist die Gesamthaftung des Anbieters im Rahmen dieses Vertrages auf den Betrag der vom Kunden in den letzten zwoelf (12) Monaten vor dem haftungsbegruendenden Ereignis tatsaechlich gezahlten Betraege begrenzt. Der Anbieter kann in keinem Fall fuer indirekte Schaeden, entgangene Gewinne, Datenverluste oder Betriebsunterbrechungen haftbar gemacht werden.',
        ],
      },
      {
        title: 'Artikel 7 - Geistiges Eigentum',
        content: [
          'Die Plattform POS Mano Verde, einschliesslich ihres Quellcodes, ihrer grafischen Oberflaeche, ihrer Algorithmen, ihrer Dokumentation und aller ihrer Bestandteile, ist das ausschliessliche Eigentum von Mano Verde SA.',
          'Das Abonnement gewaehrt dem Kunden ein persoenliches, nicht-exklusives und nicht uebertragbares Nutzungsrecht am Dienst fuer die Dauer des Abonnements. Dieses Recht begruendet kein Eigentumsrecht an der Software oder ihren Bestandteilen.',
          'Jede Vervielfaeltigung, Darstellung, Aenderung, Verbreitung oder Verwertung der Plattform oder ihrer Bestandteile, ganz oder teilweise, ohne vorherige schriftliche Genehmigung von Mano Verde SA ist strengstens verboten und stellt eine nach geltendem Recht strafbare Urheberrechtsverletzung dar.',
        ],
      },
      {
        title: 'Artikel 8 - Anwendbares Recht und zustaendige Gerichtsbarkeit',
        content: [
          'Die vorliegenden AGB unterliegen dem kamerunischen Recht und gegebenenfalls den Bestimmungen des einheitlichen Rechts der Organisation zur Harmonisierung des Wirtschaftsrechts in Afrika (OHADA).',
          'Im Falle von Streitigkeiten bezueglich der Auslegung oder Ausfuehrung der vorliegenden AGB werden die Parteien eine guetliche Loesung anstreben. Sollte innerhalb einer Frist von dreissig (30) Tagen keine guetliche Einigung erzielt werden, wird die Streitigkeit den zustaendigen Gerichten in Douala, Kamerun, vorgelegt.',
          'Fuer jede Beschwerde kann der Kunde den Anbieter unter folgender Adresse kontaktieren: direction@manoverde.com.',
        ],
      },
    ],
  },

  rgpd: {
    title: 'Datenschutzrichtlinie',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Artikel 1 - Erhobene Daten',
        content: [
          'Im Rahmen der Nutzung der Plattform POS Mano Verde erhebt der Anbieter die folgenden Kategorien personenbezogener Daten:',
          'Identifikationsdaten: Name, Vorname, E-Mail-Adresse, Telefonnummer, Postanschrift des Sitzes der Geschaeftstaetigkeit.',
          'Daten zur Geschaeftstaetigkeit: Unternehmensname, Branche, Steueridentifikationsnummer (falls zutreffend), Informationen zu den angebotenen Produkten und Dienstleistungen.',
          'Transaktionsdaten: Verkaufshistorie, Transaktionsbetraege, von den Kunden des Kunden verwendete Zahlungsmethoden, ausgestellte Kassenbons.',
          'Technische Daten: IP-Adresse, Browsertyp, Betriebssystem, Verbindungs- und Navigationsdaten auf der Plattform.',
        ],
      },
      {
        title: 'Artikel 2 - Verarbeitungszweck',
        content: [
          'Die erhobenen personenbezogenen Daten werden fuer folgende Zwecke verarbeitet:',
          'Betrieb des Dienstes: Erstellung und Verwaltung des Benutzerkontos, Verarbeitung von Transaktionen, Synchronisierung von Daten zwischen Geraeten, Erstellung von Berichten und Statistiken.',
          'Abrechnung und kaufmaennische Verwaltung: Rechnungsstellung, Abonnementverwaltung, Verbrauchsueberwachung (Anzahl der ausgestellten Kassenbons), Zahlungseinzug.',
          'Technischer Support: Bearbeitung von Supportanfragen, Behebung technischer Stoerungen, kontinuierliche Verbesserung des Dienstes.',
          'Analysen und Verbesserungen: anonymisierte Nutzungsanalyse zur Verbesserung der Plattform, Erkennung und Verhinderung von Betrug, aggregierte statistische Untersuchungen.',
        ],
      },
      {
        title: 'Artikel 3 - Rechtsgrundlage der Verarbeitung',
        content: [
          'Die Verarbeitung personenbezogener Daten beruht auf folgenden Rechtsgrundlagen:',
          'Die Einwilligung des Nutzers, die bei der Registrierung auf der Plattform eingeholt wird und jederzeit ueber die Kontoeinstellungen widerrufen werden kann.',
          'Die vertragliche Notwendigkeit: Die Datenverarbeitung ist fuer die Erfuellung des Dienstleistungsvertrages zwischen dem Anbieter und dem Kunden unerlasslich, insbesondere fuer die Bereitstellung des Registrierkassendienstes und die Abrechnung.',
          'Das berechtigte Interesse des Anbieters: Verbesserung des Dienstes, Betrugsvorbeugung, Sicherheit der Plattform.',
          'Gesetzliche Verpflichtungen: Aufbewahrung von Finanzdaten gemaess den geltenden buchhalterischen und steuerlichen Pflichten.',
        ],
      },
      {
        title: 'Artikel 4 - Aufbewahrungsdauer',
        content: [
          'Die personenbezogenen Daten werden fuer folgende Zeitraeume aufbewahrt:',
          'Daten des aktiven Kontos: Die Daten werden waehrend der gesamten Dauer der aktiven Nutzung des Dienstes und anschliessend fuer einen Zeitraum von drei (3) Jahren ab der letzten Anmeldung des Kunden aufbewahrt.',
          'Finanz- und Transaktionsdaten: Gemaess den gesetzlichen buchhalterischen und steuerlichen Verpflichtungen werden diese Daten fuer einen Zeitraum von zehn (10) Jahren aufbewahrt.',
          'Technische Daten (Verbindungsprotokolle): Diese Daten werden fuer einen Zeitraum von zwoelf (12) Monaten aufbewahrt.',
          'Nach Ablauf dieser Fristen werden die Daten endgueltig geloescht oder auf unwiderrufliche Weise anonymisiert.',
        ],
      },
      {
        title: 'Artikel 5 - Datenweitergabe',
        content: [
          'Mano Verde SA verpflichtet sich, personenbezogene Daten seiner Kunden niemals zu Werbe- oder kommerziellen Zwecken an Dritte zu verkaufen, zu vermieten oder abzutreten.',
          'Die Daten koennen an folgende technische Dienstleister weitergegeben werden, die fuer den Betrieb des Dienstes strikt erforderlich sind:',
          'Supabase (Datenbank-Hosting und Authentifizierung): Die Daten werden auf gesicherten Servern gehostet. Supabase entspricht den Sicherheitsstandards der Branche.',
          'Vercel (Hosting der Webanwendung und CDN): Nur der Anwendungscode wird auf Vercel gehostet. Keine personenbezogenen Daten werden auf den Servern von Vercel gespeichert.',
          'Zahlungsdienstleister (fuer die Abwicklung von Finanztransaktionen): Nur die fuer die Zahlungsabwicklung strikt erforderlichen Daten werden uebermittelt.',
          'Die Daten koennen auch den zustaendigen Behoerden bei gesetzlicher Verpflichtung oder auf gerichtliche Anordnung mitgeteilt werden.',
        ],
      },
      {
        title: 'Artikel 6 - Datensicherheit',
        content: [
          'Mano Verde SA setzt geeignete technische und organisatorische Massnahmen zum Schutz personenbezogener Daten gegen unbefugten Zugriff, Aenderung, Offenlegung oder Vernichtung ein.',
          'Zu den Sicherheitsmassnahmen gehoeren insbesondere: die Verschluesselung der Daten bei der Uebertragung (TLS/SSL) und im Ruhezustand, die Implementierung von Sicherheitsrichtlinien auf Datenbankzeilenebene (Row Level Security - RLS), die sicherstellen, dass jeder Kunde nur auf seine eigenen Daten zugreifen kann, sowie die Nutzung der gesicherten Infrastruktur von Supabase.',
          'Die Passwoerter der Benutzer werden mit sicheren Hash-Algorithmen gehasht und niemals im Klartext gespeichert.',
          'Der Anbieter verpflichtet sich, die betroffenen Kunden und die zustaendigen Behoerden im Falle einer Verletzung des Schutzes personenbezogener Daten gemaess den geltenden gesetzlichen Bestimmungen zu benachrichtigen.',
        ],
      },
      {
        title: 'Artikel 7 - Nutzerrechte',
        content: [
          'Gemaess der geltenden Datenschutzgesetzgebung stehen dem Kunden folgende Rechte zu:',
          'Auskunftsrecht: Der Kunde kann eine Bestaetigung darueber erhalten, ob ihn betreffende Daten verarbeitet werden oder nicht, und eine Kopie dieser Daten erhalten.',
          'Recht auf Berichtigung: Der Kunde kann die Korrektur unrichtiger oder unvollstaendiger Daten verlangen, die ihn betreffen.',
          'Recht auf Loeschung: Der Kunde kann die Loeschung seiner personenbezogenen Daten verlangen, vorbehaltlich gesetzlicher Aufbewahrungspflichten.',
          'Recht auf Datenuebertragbarkeit: Der Kunde kann seine Daten in einem strukturierten, gaengigen und maschinenlesbaren Format erhalten (CSV- oder JSON-Export), um sie an einen anderen Anbieter zu uebermitteln.',
          'Widerspruchsrecht: Der Kunde kann der Verarbeitung seiner Daten aus berechtigten Gruenden widersprechen.',
          'Zur Ausuebung dieser Rechte kann der Kunde seine Anfrage per E-Mail an direction@manoverde.com richten. Der Anbieter verpflichtet sich, innerhalb einer Frist von dreissig (30) Tagen zu antworten.',
        ],
      },
      {
        title: 'Artikel 8 - Cookies',
        content: [
          'Die Plattform POS Mano Verde verwendet ausschliesslich technische Cookies, die fuer den Betrieb des Dienstes strikt erforderlich sind. Diese Cookies ermoeglichen die Verwaltung der Benutzersitzung, die Speicherung der Spracheinstellungen und die Aufrechterhaltung der Verbindung.',
          'Es werden keine Tracking-, Werbe- oder Verhaltensanalyse-Cookies auf der Plattform verwendet.',
          'Da diese technischen Cookies fuer den Betrieb des Dienstes unverzichtbar sind, beduerfen sie gemaess den geltenden gesetzlichen Bestimmungen keiner vorherigen Einwilligung des Nutzers.',
        ],
      },
      {
        title: 'Artikel 9 - Datenschutzbeauftragter',
        content: [
          'Fuer Fragen zum Schutz Ihrer personenbezogenen Daten oder zur Ausuebung Ihrer Rechte koennen Sie unseren Datenschutzbeauftragten (DSB) unter folgender Adresse kontaktieren:',
          'E-Mail: direction@manoverde.com',
          'Postanschrift: Mano Verde SA, Douala, Kamerun.',
          'Sie haben ausserdem das Recht, eine Beschwerde bei der zustaendigen Aufsichtsbehoerde einzureichen, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten nicht den geltenden Vorschriften entspricht.',
        ],
      },
    ],
  },

  terms: {
    title: 'Nutzungsbedingungen',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Artikel 1 - Akzeptanz der Bedingungen',
        content: [
          'Der Zugang und die Nutzung der Plattform POS Mano Verde (nachfolgend "der Dienst") setzen die vorherige und vorbehaltlose Akzeptanz der vorliegenden Nutzungsbedingungen voraus.',
          'Durch die Erstellung eines Kontos oder die Nutzung des Dienstes erkennt der Nutzer an, die vorliegenden Nutzungsbedingungen vollstaendig gelesen, verstanden und akzeptiert zu haben. Wenn der Nutzer diese Bedingungen nicht akzeptiert, muss er von der Nutzung des Dienstes absehen.',
          'Die vorliegenden Nutzungsbedingungen ergaenzen die Allgemeinen Geschaeftsbedingungen (AGB) und die Datenschutzrichtlinie, die ueber die Plattform zugaenglich sind.',
        ],
      },
      {
        title: 'Artikel 2 - Dienstbeschreibung',
        content: [
          'POS Mano Verde ist ein Online-Registrierkassensystem (Point of Sale), das ueber einen Webbrowser zugaenglich ist. Der Dienst bietet folgende Funktionen:',
          'Verwaltung von Verkaeufen und Ausstellung von Kassenbons, Produktverwaltung und Katalogfuehrung, Bestandsueberwachung und Verfolgung der Finanzbewegungen, Erstellung von Berichten und Geschaeftsstatistiken.',
          'Der Dienst funktioniert im Offline-Modus: Der Nutzer kann weiterhin Verkaeufe erfassen, auch wenn keine Internetverbindung besteht. Die Daten werden automatisch mit der Cloud synchronisiert, sobald die Verbindung wiederhergestellt ist.',
          'Die Cloud-Synchronisierung ermoeglicht dem Nutzer den Zugriff auf seine Daten von mehreren Geraeten aus und die Verwaltung mehrerer Geschaeftstaetigkeiten von einem einzigen Konto aus.',
        ],
      },
      {
        title: 'Artikel 3 - Kontoerstellung',
        content: [
          'Um den Dienst zu nutzen, muss der Nutzer ein Konto erstellen und dabei genaue, vollstaendige und aktuelle Informationen angeben. Der Nutzer verpflichtet sich, seine Informationen bei Aenderungen zu aktualisieren.',
          'Jede E-Mail-Adresse kann nur mit einem einzigen Benutzerkonto verknuepft werden. Ein Benutzerkonto kann jedoch mehrere Organisationen und Geschaeftstaetigkeiten verwalten.',
          'Der Nutzer ist allein verantwortlich fuer die Sicherheit seines Passworts und die Vertraulichkeit seiner Zugangsdaten. Bei Verdacht auf unbefugte Nutzung seines Kontos muss der Nutzer den Anbieter unverzueglich unter direction@manoverde.com informieren.',
          'Der Anbieter behaelt sich das Recht vor, die Erstellung eines Kontos abzulehnen oder ein bestehendes Konto bei Nichteinhaltung der vorliegenden Bedingungen zu sperren.',
        ],
      },
      {
        title: 'Artikel 4 - Zulaessige Nutzung',
        content: [
          'Der Dienst ist ausschliesslich fuer eine legale kommerzielle Nutzung bestimmt. Der Nutzer verpflichtet sich, den Dienst in Uebereinstimmung mit den in seinem Rechtsgebiet geltenden Gesetzen und Vorschriften zu nutzen.',
          'Folgende Nutzungen sind strengstens untersagt: die Nutzung des Dienstes fuer betruegerische, illegale oder gegen die oeffentliche Ordnung verstossende Aktivitaeten; der Versuch eines unbefugten Zugriffs auf die Systeme, Server oder Netzwerke des Anbieters; die Dekompilierung, Disassemblierung, das Reverse Engineering oder jeder Versuch, den Quellcode der Plattform zu extrahieren.',
          'Ebenfalls untersagt sind: die Uebertragung von Viren, Schadsoftware oder schaedlichem Code ueber den Dienst; die Nutzung von Bots, Scrapern oder automatisierten Werkzeugen fuer den Zugriff auf den Dienst ohne Genehmigung; die absichtliche Ueberlastung der Server oder jede Handlung, die den Betrieb des Dienstes beeintraechtigen kann.',
          'Bei Verstoss gegen die vorliegenden Nutzungsregeln behaelt sich der Anbieter das Recht vor, das Konto des Nutzers unverzueglich und ohne Vorankuendigung oder Entschaedigung zu sperren oder zu loeschen.',
        ],
      },
      {
        title: 'Artikel 5 - Nutzerinhalte',
        content: [
          'Der Nutzer behaelt das vollstaendige Eigentum an allen Daten, die er auf der Plattform eingibt und speichert (Produktdaten, Transaktionen, Kundeninformationen, Berichte usw.).',
          'Durch die Nutzung des Dienstes gewaehrt der Nutzer Mano Verde SA eine eingeschraenkte, nicht-exklusive und widerrufliche Lizenz zur Verarbeitung, Speicherung und Anzeige dieser Daten zum alleinigen Zweck der Bereitstellung des Dienstes. Diese Lizenz endet automatisch mit der Loeschung des Kontos.',
          'Der Nutzer garantiert, dass die von ihm auf der Plattform eingegebenen Daten keine Rechte am geistigen Eigentum Dritter verletzen und keine illegalen, verleumderischen oder schaedigenden Inhalte enthalten.',
          'Der Anbieter uebt keine redaktionelle Kontrolle ueber die vom Nutzer eingegebenen Inhalte aus und kann fuer diese Inhalte nicht haftbar gemacht werden.',
        ],
      },
      {
        title: 'Artikel 6 - Verfuegbarkeit des Dienstes',
        content: [
          'Der Anbieter ist bestrebt, die Verfuegbarkeit des Dienstes 24 Stunden am Tag und 7 Tage die Woche zu gewaehrleisten. Der Dienst wird jedoch auf Basis des "bestmoeglichen Bemuehensprinzips" bereitgestellt und der Anbieter garantiert keine ununterbrochene Verfuegbarkeit.',
          'Der Anbieter behaelt sich das Recht vor, den Zugang zum Dienst voruebergehend fuer Wartungs-, Aktualisierungs- oder Verbesserungsarbeiten auszusetzen. Geplante Wartungsarbeiten werden nach Moeglichkeit ausserhalb der Hauptnutzungszeiten durchgefuehrt und im Voraus angekuendigt.',
          'Der kostenlose Plan beinhaltet keine Vereinbarung ueber das Serviceniveau (SLA). Die kostenpflichtigen Plaene beinhalten ein Verfuegbarkeitsziel von 99,5%, ausgenommen geplante Wartungsperioden und Faelle hoehere Gewalt.',
          'Der in den Dienst integrierte Offline-Modus ermoeglicht dem Nutzer die Weiterarbeit auch bei voruebergehender Nichtverfuegbarkeit der Internetverbindung oder der Server.',
        ],
      },
      {
        title: 'Artikel 7 - Multi-Aktivitaet',
        content: [
          'Der Dienst ermoeglicht dem Nutzer die Verwaltung mehrerer Geschaeftstaetigkeiten (Laeden, Restaurants, Dienstleistungen usw.) von einem einzigen Benutzerkonto aus.',
          'Jede Aktivitaet bildet einen eigenen Arbeitsbereich mit eigenen Produkten, Transaktionen, Bestaenden und Berichten. Die Daten jeder Aktivitaet sind voneinander getrennt und werden nicht zwischen den verschiedenen Aktivitaeten geteilt, es sei denn, der Nutzer entscheidet sich ausdruecklich dafuer.',
          'Die Abrechnung erfolgt pro Aktivitaet: Die Anzahl der ausgestellten Kassenbons und die genutzten Funktionen werden fuer jede Aktivitaet separat erfasst. Der Nutzer kann fuer jede seiner Aktivitaeten unterschiedliche Plaene abonnieren.',
        ],
      },
      {
        title: 'Artikel 8 - Aussetzung und Kuendigung',
        content: [
          'Der Anbieter behaelt sich das Recht vor, den Zugang zum Dienst voruebergehend oder dauerhaft auszusetzen in folgenden Faellen:',
          'Verstoss gegen die vorliegenden Nutzungsbedingungen oder die Allgemeinen Geschaeftsbedingungen; Nutzung des Dienstes fuer illegale oder betruegerische Zwecke; Nichtzahlung faelliger Betraege nach erfolgloser Mahnung; Verhalten, das die Sicherheit, Integritaet oder den ordnungsgemaessen Betrieb des Dienstes gefaehrden kann.',
          'Im Falle einer Aussetzung wird der Nutzer per E-Mail an die mit seinem Konto verknuepfte Adresse benachrichtigt. Der Nutzer kann die Aussetzung anfechten, indem er innerhalb von fuenfzehn (15) Tagen eine begruendete Beschwerde an direction@manoverde.com richtet.',
          'Der Nutzer kann sein Konto jederzeit ueber die Kontoeinstellungen oder durch eine Anfrage an direction@manoverde.com kuendigen.',
        ],
      },
      {
        title: 'Artikel 9 - Haftungsbeschraenkung',
        content: [
          'Der Anbieter kann nicht fuer indirekte, beilaeufige, besondere oder Folgeschaeden haftbar gemacht werden, die sich aus der Nutzung oder der Unmoeglichkeit der Nutzung des Dienstes ergeben, einschliesslich, aber nicht beschraenkt auf: entgangene Gewinne, Datenverluste, Betriebsunterbrechungen, Kundenverluste.',
          'Die Gesamthaftung des Anbieters gegenueber dem Nutzer ist, unabhaengig von der Ursache, auf den Gesamtbetrag der vom Nutzer in den zwoelf (12) Monaten vor dem die Forderung ausloesenden Ereignis tatsaechlich gezahlten Betraege begrenzt.',
          'Diese Haftungsbeschraenkung gilt im vollen Umfang des geltenden Rechts und bleibt auch im Falle der Aufhebung oder Kuendigung des Vertrages bestehen.',
        ],
      },
      {
        title: 'Artikel 10 - Aenderung der Bedingungen',
        content: [
          'Der Anbieter behaelt sich das Recht vor, die vorliegenden Nutzungsbedingungen jederzeit zu aendern. Die Aenderungen werden den Nutzern per E-Mail und/oder durch eine sichtbare Benachrichtigung auf der Plattform mitgeteilt.',
          'Die Nutzer haben eine Frist von dreissig (30) Tagen ab der Benachrichtigung, um die neuen Bedingungen zur Kenntnis zu nehmen. Die fortgesetzte Nutzung des Dienstes nach Ablauf dieser Frist gilt als Annahme der neuen Bedingungen.',
          'Wenn der Nutzer die neuen Bedingungen nicht akzeptiert, kann er sein Konto vor Ablauf der dreissig-Tage-Frist kuendigen. In diesem Fall gelten die alten Bedingungen bis zum effektiven Kuendigungsdatum weiter.',
          'Wesentliche Aenderungen, die die Rechte des Nutzers oder die Preisgestaltung betreffen, werden Gegenstand einer spezifischen und ausfuehrlichen Mitteilung sein.',
        ],
      },
      {
        title: 'Artikel 11 - Kontakt',
        content: [
          'Fuer alle Fragen, Beschwerden oder Anfragen bezueglich des Dienstes oder der vorliegenden Nutzungsbedingungen kann der Nutzer den Anbieter ueber folgende Wege kontaktieren:',
          'E-Mail: direction@manoverde.com',
          'Postanschrift: Mano Verde SA, Douala, Kamerun.',
          'Der Anbieter verpflichtet sich, den Eingang jeder Anfrage innerhalb von achtundvierzig (48) Geschaeftsstunden zu bestaetigen und eine ausfuehrliche Antwort innerhalb von dreissig (30) Tagen zu liefern.',
          'Die vorliegenden Nutzungsbedingungen unterliegen dem kamerunischen Recht. Jede Streitigkeit wird nach einem Versuch der guetlichen Beilegung den zustaendigen Gerichten in Douala, Kamerun, vorgelegt.',
        ],
      },
    ],
  },
}
