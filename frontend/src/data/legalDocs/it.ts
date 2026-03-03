import type { LegalDocType, LegalDocument } from '../legalDocuments'

export const LEGAL_DOCUMENTS_IT: Record<LegalDocType, LegalDocument> = {
  cgv: {
    title: 'Condizioni Generali di Vendita',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Articolo 1 - Oggetto',
        content: [
          'Le presenti Condizioni Generali di Vendita (di seguito "CGV") regolano i rapporti contrattuali tra Mano Verde SA, societa per azioni di diritto camerunese con sede legale a Douala, Camerun (di seguito "il Fornitore"), e qualsiasi persona fisica o giuridica che sottoscriva i suoi servizi (di seguito "il Cliente").',
          'Il Fornitore offre una piattaforma di cassa (Point of Sale) accessibile in modalita SaaS (Software as a Service) tramite l\'applicazione web pos.manoverde.com. Questo servizio consente la gestione delle vendite, l\'emissione di scontrini, la gestione delle scorte, il monitoraggio della tesoreria e la sincronizzazione dei dati tra piu dispositivi e attivita commerciali.',
          'L\'utilizzo della piattaforma POS Mano Verde implica l\'accettazione piena e integrale delle presenti CGV da parte del Cliente.',
        ],
      },
      {
        title: 'Articolo 2 - Accesso al servizio',
        content: [
          'L\'accesso al servizio richiede la creazione di un account utente sulla piattaforma. Il Cliente deve fornire informazioni esatte e aggiornate al momento della registrazione, in particolare il proprio nome, indirizzo email, numero di telefono e le informazioni relative alla propria attivita commerciale.',
          'Il Cliente deve avere almeno 18 anni o possedere la capacita giuridica necessaria per stipulare un contratto nella propria giurisdizione di residenza. In caso di utilizzo del servizio per conto di una persona giuridica, il Cliente dichiara di avere l\'autorita necessaria per impegnare tale entita.',
          'L\'account e personale e il Cliente e responsabile della riservatezza delle proprie credenziali di accesso. Qualsiasi utilizzo del servizio effettuato con le credenziali del Cliente si presume effettuato dal Cliente stesso.',
        ],
      },
      {
        title: 'Articolo 3 - Tariffazione',
        content: [
          'Il Fornitore propone diverse formule di abbonamento: un piano gratuito con funzionalita limitate e piani a pagamento che offrono funzionalita avanzate. Le tariffe in vigore sono visualizzate sulla pagina dei prezzi della piattaforma.',
          'In aggiunta ai piani fissi, il Fornitore propone un modello di fatturazione a consumo ("Pay-as-you-grow") al prezzo di 0,02 USD per scontrino emesso. Ogni nuovo account beneficia di un credito iniziale di 10 USD, che consente l\'emissione di 500 scontrini senza costi aggiuntivi.',
          'Le tariffe sono espresse in dollari americani (USD) e sono soggette a modifiche. Qualsiasi modifica tariffaria sara comunicata al Cliente con un preavviso di trenta (30) giorni. Le tariffe applicabili sono quelle in vigore al momento della sottoscrizione o del rinnovo dell\'abbonamento.',
        ],
      },
      {
        title: 'Articolo 4 - Metodi di pagamento',
        content: [
          'Il Cliente puo regolare i propri abbonamenti e consumi con i seguenti metodi di pagamento: Orange Money, MTN Mobile Money e carta bancaria (Visa, Mastercard).',
          'I pagamenti tramite mobile money vengono elaborati in tempo reale. I pagamenti con carta bancaria sono protetti da un fornitore di servizi di pagamento terzo conforme agli standard PCI-DSS.',
          'In caso di mancato pagamento, il Fornitore si riserva il diritto di sospendere l\'accesso alle funzionalita a pagamento del servizio previa notifica al Cliente. Il Cliente dispone di un termine di quindici (15) giorni per regolarizzare la propria situazione.',
        ],
      },
      {
        title: 'Articolo 5 - Durata e risoluzione',
        content: [
          'Gli abbonamenti mensili sono sottoscritti per la durata di un mese, rinnovabile tacitamente. Gli abbonamenti annuali sono sottoscritti per la durata di dodici (12) mesi, rinnovabili tacitamente.',
          'Il Cliente puo risolvere il proprio abbonamento in qualsiasi momento dalle impostazioni del proprio account. La risoluzione ha effetto alla fine del periodo di abbonamento in corso. Non sara effettuato alcun rimborso proporzionale per il periodo rimanente.',
          'In caso di risoluzione, i dati del Cliente sono conservati per un periodo di trenta (30) giorni, durante il quale il Cliente puo richiedere l\'esportazione dei propri dati. Trascorso tale termine, i dati vengono definitivamente cancellati.',
          'Il Fornitore si riserva il diritto di risolvere l\'account di un Cliente in caso di violazione delle presenti CGV, previa messa in mora rimasta senza effetto per un periodo di sette (7) giorni.',
        ],
      },
      {
        title: 'Articolo 6 - Responsabilita',
        content: [
          'Il Fornitore si impegna a fornire il servizio con diligenza e conformemente alle regole dell\'arte. Tuttavia, il servizio e fornito "cosi com\'e" e il Fornitore non garantisce un funzionamento ininterrotto o privo di errori.',
          'La responsabilita del Fornitore non potra essere invocata in caso di forza maggiore, malfunzionamento della rete Internet, guasto delle apparecchiature del Cliente o qualsiasi causa esterna al Fornitore.',
          'In ogni caso, la responsabilita complessiva del Fornitore nell\'ambito del presente contratto e limitata all\'importo delle somme effettivamente versate dal Cliente nel corso degli ultimi dodici (12) mesi precedenti il fatto generatore della responsabilita. Il Fornitore non potra in alcun caso essere ritenuto responsabile per danni indiretti, perdite di profitto, perdite di dati o perdite operative.',
        ],
      },
      {
        title: 'Articolo 7 - Proprieta intellettuale',
        content: [
          'La piattaforma POS Mano Verde, incluso il suo codice sorgente, la sua interfaccia grafica, i suoi algoritmi, la sua documentazione e tutti gli elementi che la compongono, e proprieta esclusiva di Mano Verde SA.',
          'L\'abbonamento conferisce al Cliente un diritto d\'uso personale, non esclusivo e non trasferibile del servizio, per la durata dell\'abbonamento. Tale diritto non conferisce alcun diritto di proprieta sul software o sui suoi componenti.',
          'Qualsiasi riproduzione, rappresentazione, modifica, distribuzione o sfruttamento della piattaforma o dei suoi elementi, in tutto o in parte, senza la preventiva autorizzazione scritta di Mano Verde SA e severamente vietata e costituisce una contraffazione sanzionata dalle leggi vigenti.',
        ],
      },
      {
        title: 'Articolo 8 - Legge applicabile e giurisdizione competente',
        content: [
          'Le presenti CGV sono regolate dal diritto camerunese e, ove applicabile, dalle disposizioni del diritto uniforme dell\'Organizzazione per l\'Armonizzazione del Diritto degli Affari in Africa (OHADA).',
          'In caso di controversia relativa all\'interpretazione o all\'esecuzione delle presenti CGV, le parti si impegneranno a trovare una soluzione amichevole. In mancanza di accordo amichevole entro un termine di trenta (30) giorni, la controversia sara sottoposta ai tribunali competenti di Douala, Camerun.',
          'Per qualsiasi reclamo, il Cliente puo contattare il Fornitore al seguente indirizzo: direction@manoverde.com.',
        ],
      },
    ],
  },

  rgpd: {
    title: 'Politica di Protezione dei Dati Personali',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Articolo 1 - Dati raccolti',
        content: [
          'Nell\'ambito dell\'utilizzo della piattaforma POS Mano Verde, il Fornitore raccoglie le seguenti categorie di dati personali:',
          'Dati identificativi: cognome, nome, indirizzo email, numero di telefono, indirizzo postale della sede dell\'attivita commerciale.',
          'Dati relativi all\'attivita commerciale: ragione sociale, settore di attivita, numero di identificazione fiscale (se applicabile), informazioni sui prodotti e servizi offerti.',
          'Dati transazionali: storico delle vendite, importi delle transazioni, metodi di pagamento utilizzati dai clienti del Cliente, scontrini emessi.',
          'Dati tecnici: indirizzo IP, tipo di browser, sistema operativo, dati di connessione e navigazione sulla piattaforma.',
        ],
      },
      {
        title: 'Articolo 2 - Finalita del trattamento',
        content: [
          'I dati personali raccolti sono trattati per le seguenti finalita:',
          'Funzionamento del servizio: creazione e gestione dell\'account utente, elaborazione delle transazioni, sincronizzazione dei dati tra dispositivi, generazione di report e statistiche.',
          'Fatturazione e gestione commerciale: emissione di fatture, gestione degli abbonamenti, monitoraggio dei consumi (numero di scontrini emessi), recupero dei pagamenti.',
          'Supporto tecnico: gestione delle richieste di assistenza, risoluzione degli incidenti tecnici, miglioramento continuo del servizio.',
          'Analisi e miglioramenti: analisi anonimizzata degli utilizzi per migliorare la piattaforma, rilevamento e prevenzione delle frodi, studi statistici aggregati.',
        ],
      },
      {
        title: 'Articolo 3 - Base giuridica del trattamento',
        content: [
          'Il trattamento dei dati personali si fonda sulle seguenti basi giuridiche:',
          'Il consenso dell\'utente, raccolto al momento della registrazione sulla piattaforma e revocabile in qualsiasi momento dalle impostazioni dell\'account.',
          'La necessita contrattuale: il trattamento dei dati e indispensabile per l\'esecuzione del contratto di servizio tra il Fornitore e il Cliente, in particolare per la fornitura del servizio di cassa e la fatturazione.',
          'L\'interesse legittimo del Fornitore: miglioramento del servizio, prevenzione delle frodi, sicurezza della piattaforma.',
          'Gli obblighi di legge: conservazione dei dati finanziari in conformita con gli obblighi contabili e fiscali applicabili.',
        ],
      },
      {
        title: 'Articolo 4 - Durata di conservazione',
        content: [
          'I dati personali sono conservati per le seguenti durate:',
          'Dati dell\'account attivo: i dati sono conservati per tutta la durata dell\'utilizzo attivo del servizio, quindi per un periodo di tre (3) anni dalla data dell\'ultima connessione del Cliente.',
          'Dati finanziari e transazionali: in conformita con gli obblighi legali contabili e fiscali, questi dati sono conservati per un periodo di dieci (10) anni.',
          'Dati tecnici (log di connessione): questi dati sono conservati per un periodo di dodici (12) mesi.',
          'Alla scadenza di tali termini, i dati vengono definitivamente cancellati o anonimizzati in modo irreversibile.',
        ],
      },
      {
        title: 'Articolo 5 - Condivisione dei dati',
        content: [
          'Mano Verde SA si impegna a non vendere, affittare o cedere mai i dati personali dei propri Clienti a terzi per scopi commerciali o pubblicitari.',
          'I dati possono essere condivisi con i seguenti fornitori tecnici, strettamente necessari al funzionamento del servizio:',
          'Supabase (hosting del database e autenticazione): i dati sono ospitati su server sicuri. Supabase e conforme agli standard di sicurezza del settore.',
          'Vercel (hosting dell\'applicazione web e CDN): solo il codice dell\'applicazione e ospitato su Vercel. Nessun dato personale viene memorizzato sui server di Vercel.',
          'I fornitori di servizi di pagamento (per l\'elaborazione delle transazioni finanziarie): vengono trasmessi solo i dati strettamente necessari all\'elaborazione del pagamento.',
          'I dati possono inoltre essere comunicati alle autorita competenti in caso di obbligo legale o su decisione giudiziaria.',
        ],
      },
      {
        title: 'Articolo 6 - Sicurezza dei dati',
        content: [
          'Mano Verde SA implementa misure tecniche e organizzative appropriate per proteggere i dati personali contro qualsiasi accesso non autorizzato, modifica, divulgazione o distruzione.',
          'Le misure di sicurezza includono in particolare: la crittografia dei dati in transito (TLS/SSL) e a riposo, l\'implementazione di politiche di sicurezza a livello di righe del database (Row Level Security - RLS) che garantiscono che ogni Cliente acceda esclusivamente ai propri dati, l\'utilizzo dell\'infrastruttura sicura di Supabase.',
          'Le password degli utenti sono sottoposte a hashing mediante algoritmi di hashing sicuri e non vengono mai memorizzate in chiaro.',
          'Il Fornitore si impegna a notificare i Clienti interessati e le autorita competenti in caso di violazione dei dati personali, in conformita con le disposizioni legali applicabili.',
        ],
      },
      {
        title: 'Articolo 7 - Diritti degli utenti',
        content: [
          'In conformita con la normativa applicabile in materia di protezione dei dati personali, il Cliente dispone dei seguenti diritti:',
          'Diritto di accesso: il Cliente puo ottenere la conferma che i dati che lo riguardano siano o meno oggetto di trattamento, e ottenere una copia di tali dati.',
          'Diritto di rettifica: il Cliente puo richiedere la correzione dei dati inesatti o incompleti che lo riguardano.',
          'Diritto alla cancellazione: il Cliente puo richiedere la cancellazione dei propri dati personali, fatti salvi gli obblighi legali di conservazione.',
          'Diritto alla portabilita: il Cliente puo ottenere i propri dati in un formato strutturato, di uso comune e leggibile da dispositivo automatico (esportazione CSV o JSON), al fine di trasmetterli a un altro fornitore.',
          'Diritto di opposizione: il Cliente puo opporsi al trattamento dei propri dati per motivi legittimi.',
          'Per esercitare tali diritti, il Cliente puo inviare la propria richiesta via email a: direction@manoverde.com. Il Fornitore si impegna a rispondere entro un termine di trenta (30) giorni.',
        ],
      },
      {
        title: 'Articolo 8 - Cookie',
        content: [
          'La piattaforma POS Mano Verde utilizza esclusivamente cookie tecnici strettamente necessari al funzionamento del servizio. Questi cookie consentono la gestione della sessione utente, la memorizzazione delle preferenze linguistiche e il mantenimento della connessione.',
          'Nessun cookie di tracciamento, pubblicitario o di analisi comportamentale viene utilizzato sulla piattaforma.',
          'Poiche questi cookie tecnici sono indispensabili al funzionamento del servizio, non richiedono il consenso preventivo dell\'utente in conformita con le disposizioni legali applicabili.',
        ],
      },
      {
        title: 'Articolo 9 - Contatto del Responsabile della Protezione dei Dati',
        content: [
          'Per qualsiasi domanda relativa alla protezione dei vostri dati personali o per esercitare i vostri diritti, potete contattare il nostro Responsabile della Protezione dei Dati (DPO) al seguente indirizzo:',
          'Email: direction@manoverde.com',
          'Indirizzo postale: Mano Verde SA, Douala, Camerun.',
          'Disponete inoltre del diritto di presentare un reclamo presso l\'autorita di controllo competente qualora riteniate che il trattamento dei vostri dati personali non sia conforme alla normativa applicabile.',
        ],
      },
    ],
  },

  terms: {
    title: 'Condizioni di Utilizzo',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Articolo 1 - Accettazione delle condizioni',
        content: [
          'L\'accesso e l\'utilizzo della piattaforma POS Mano Verde (di seguito "il Servizio") sono subordinati all\'accettazione preventiva e senza riserve delle presenti Condizioni di Utilizzo.',
          'Creando un account o utilizzando il Servizio, l\'utente riconosce di aver letto, compreso e accettato le presenti Condizioni di Utilizzo nella loro integralita. Se l\'utente non accetta queste condizioni, deve astenersi dall\'utilizzare il Servizio.',
          'Le presenti Condizioni di Utilizzo completano le Condizioni Generali di Vendita (CGV) e la Politica di Protezione dei Dati Personali (RGPD) accessibili dalla piattaforma.',
        ],
      },
      {
        title: 'Articolo 2 - Descrizione del servizio',
        content: [
          'POS Mano Verde e un sistema di cassa (Point of Sale) online accessibile tramite browser web. Il Servizio offre le seguenti funzionalita:',
          'Gestione delle vendite ed emissione di scontrini, gestione dei prodotti e del catalogo, monitoraggio delle scorte e dei movimenti di tesoreria, generazione di report e statistiche commerciali.',
          'Il Servizio funziona in modalita offline: l\'utente puo continuare a registrare vendite anche in assenza di connessione Internet. I dati vengono automaticamente sincronizzati con il cloud quando la connessione viene ripristinata.',
          'La sincronizzazione cloud consente all\'utente di accedere ai propri dati da piu dispositivi e di gestire piu attivita commerciali da un unico account.',
        ],
      },
      {
        title: 'Articolo 3 - Creazione dell\'account',
        content: [
          'Per utilizzare il Servizio, l\'utente deve creare un account fornendo informazioni esatte, complete e aggiornate. L\'utente si impegna ad aggiornare le proprie informazioni in caso di cambiamento.',
          'Ogni indirizzo email puo essere associato a un solo account utente. Un account utente puo tuttavia gestire piu organizzazioni e attivita commerciali.',
          'L\'utente e l\'unico responsabile della sicurezza della propria password e della riservatezza delle proprie credenziali di accesso. In caso di sospetto utilizzo non autorizzato del proprio account, l\'utente deve informare immediatamente il Fornitore all\'indirizzo direction@manoverde.com.',
          'Il Fornitore si riserva il diritto di rifiutare la creazione di un account o di sospendere un account esistente in caso di mancato rispetto delle presenti condizioni.',
        ],
      },
      {
        title: 'Articolo 4 - Uso accettabile',
        content: [
          'Il Servizio e destinato esclusivamente a un uso commerciale legale. L\'utente si impegna a utilizzare il Servizio in conformita con le leggi e i regolamenti vigenti nella propria giurisdizione.',
          'Sono severamente vietati i seguenti utilizzi: l\'uso del Servizio per attivita fraudolente, illegali o contrarie all\'ordine pubblico; il tentativo di accesso non autorizzato ai sistemi, server o reti del Fornitore; la decompilazione, il disassemblaggio, il reverse engineering o qualsiasi tentativo di estrazione del codice sorgente della piattaforma.',
          'Sono altresi vietati: la trasmissione di virus, malware o qualsiasi codice dannoso tramite il Servizio; l\'utilizzo di robot, scraper o qualsiasi strumento automatizzato per accedere al Servizio senza autorizzazione; il sovraccarico intenzionale dei server o qualsiasi azione suscettibile di perturbare il funzionamento del Servizio.',
          'In caso di violazione delle presenti regole di utilizzo, il Fornitore si riserva il diritto di sospendere o eliminare immediatamente l\'account dell\'utente, senza preavviso ne indennizzo.',
        ],
      },
      {
        title: 'Articolo 5 - Contenuto dell\'utente',
        content: [
          'L\'utente conserva la piena proprieta di tutti i dati che inserisce e memorizza sulla piattaforma (dati dei prodotti, transazioni, informazioni sui clienti, report, ecc.).',
          'Utilizzando il Servizio, l\'utente concede a Mano Verde SA una licenza limitata, non esclusiva e revocabile per trattare, memorizzare e visualizzare tali dati al solo scopo di fornire il Servizio. Tale licenza termina automaticamente alla cancellazione dell\'account.',
          'L\'utente garantisce che i dati inseriti sulla piattaforma non violano alcun diritto di proprieta intellettuale di terzi e non contengono alcun contenuto illegale, diffamatorio o pregiudizievole.',
          'Il Fornitore non esercita alcun controllo editoriale sul contenuto inserito dall\'utente e non puo essere ritenuto responsabile di tale contenuto.',
        ],
      },
      {
        title: 'Articolo 6 - Disponibilita del servizio',
        content: [
          'Il Fornitore si adopera per garantire la disponibilita del Servizio 24 ore su 24 e 7 giorni su 7. Tuttavia, il Servizio e fornito sulla base del "miglior impegno" e il Fornitore non garantisce una disponibilita ininterrotta.',
          'Il Fornitore si riserva il diritto di sospendere temporaneamente l\'accesso al Servizio per operazioni di manutenzione, aggiornamento o miglioramento. Le manutenzioni programmate saranno, per quanto possibile, effettuate al di fuori delle ore di maggiore utilizzo e annunciate in anticipo.',
          'Il piano gratuito non beneficia di alcun accordo sul livello di servizio (SLA). I piani a pagamento beneficiano di un obiettivo di disponibilita del 99,5%, esclusi i periodi di manutenzione programmata e i casi di forza maggiore.',
          'La modalita offline integrata nel Servizio consente all\'utente di continuare a lavorare anche in caso di indisponibilita temporanea della connessione Internet o dei server.',
        ],
      },
      {
        title: 'Articolo 7 - Multi-attivita',
        content: [
          'Il Servizio consente all\'utente di gestire piu attivita commerciali (negozi, ristoranti, servizi, ecc.) da un unico account utente.',
          'Ogni attivita costituisce uno spazio di lavoro distinto con i propri prodotti, transazioni, scorte e report. I dati di ogni attivita sono separati e non vengono condivisi tra le diverse attivita, salvo scelta esplicita dell\'utente.',
          'La fatturazione e calcolata per attivita: il numero di scontrini emessi e le funzionalita utilizzate vengono conteggiati separatamente per ogni attivita. L\'utente puo sottoscrivere piani diversi per ciascuna delle proprie attivita.',
        ],
      },
      {
        title: 'Articolo 8 - Sospensione e risoluzione',
        content: [
          'Il Fornitore si riserva il diritto di sospendere temporaneamente o definitivamente l\'accesso al Servizio in caso di:',
          'Violazione delle presenti Condizioni di Utilizzo o delle Condizioni Generali di Vendita; utilizzo del Servizio a fini illegali o fraudolenti; mancato pagamento delle somme dovute dopo messa in mora rimasta senza effetto; comportamento suscettibile di compromettere la sicurezza, l\'integrita o il corretto funzionamento del Servizio.',
          'In caso di sospensione, l\'utente sara notificato via email all\'indirizzo associato al proprio account. L\'utente potra contestare la sospensione inviando un reclamo motivato a direction@manoverde.com entro un termine di quindici (15) giorni.',
          'L\'utente puo risolvere il proprio account in qualsiasi momento dalle impostazioni del proprio account o inviando una richiesta a direction@manoverde.com.',
        ],
      },
      {
        title: 'Articolo 9 - Limitazione di responsabilita',
        content: [
          'Il Fornitore non potra essere ritenuto responsabile per danni indiretti, accessori, speciali o consequenziali derivanti dall\'utilizzo o dall\'impossibilita di utilizzare il Servizio, inclusi ma non limitati a: perdite di profitto, perdite di dati, interruzioni di attivita, perdite di clientela.',
          'La responsabilita complessiva del Fornitore nei confronti dell\'utente, qualunque ne sia la causa, e limitata all\'importo totale delle somme effettivamente versate dall\'utente nel corso dei dodici (12) mesi precedenti l\'evento che ha dato origine al reclamo.',
          'Tale limitazione di responsabilita si applica nella misura massima consentita dalla legge applicabile e sussiste anche in caso di risoluzione del contratto.',
        ],
      },
      {
        title: 'Articolo 10 - Modifica delle condizioni',
        content: [
          'Il Fornitore si riserva il diritto di modificare le presenti Condizioni di Utilizzo in qualsiasi momento. Le modifiche saranno notificate agli utenti via email e/o tramite una notifica visibile sulla piattaforma.',
          'Gli utenti dispongono di un termine di trenta (30) giorni dalla notifica per prendere conoscenza delle nuove condizioni. L\'uso continuato del Servizio dopo tale termine vale come accettazione delle nuove condizioni.',
          'Se l\'utente non accetta le nuove condizioni, puo risolvere il proprio account prima della scadenza del termine di trenta giorni. In tal caso, le condizioni precedenti restano applicabili fino alla data effettiva della risoluzione.',
          'Le modifiche sostanziali che incidono sui diritti dell\'utente o sulla tariffazione saranno oggetto di una comunicazione specifica e dettagliata.',
        ],
      },
      {
        title: 'Articolo 11 - Contatto',
        content: [
          'Per qualsiasi domanda, reclamo o richiesta relativa al Servizio o alle presenti Condizioni di Utilizzo, l\'utente puo contattare il Fornitore con i seguenti mezzi:',
          'Email: direction@manoverde.com',
          'Indirizzo postale: Mano Verde SA, Douala, Camerun.',
          'Il Fornitore si impegna ad accusare ricevuta di qualsiasi richiesta entro un termine di quarantotto (48) ore lavorative e a fornire una risposta circostanziata entro un termine di trenta (30) giorni.',
          'Le presenti Condizioni di Utilizzo sono regolate dal diritto camerunese. Qualsiasi controversia sara sottoposta ai tribunali competenti di Douala, Camerun, previo tentativo di risoluzione amichevole.',
        ],
      },
    ],
  },
}
