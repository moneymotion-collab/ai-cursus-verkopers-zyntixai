import {
  PUBLIC_ABOUT_PATH,
  PUBLIC_AUDIENCES_PATH,
  PUBLIC_HOME_PATH,
  PUBLIC_HOW_PATH,
  PUBLIC_LOGIN_PATH,
  PUBLIC_PLATFORM_PATH,
} from "@/features/public-web/paths";

export const PUBLIC_WORDMARK = "ZyntixAI";
export const PUBLIC_SKIP = "Ga naar de hoofdinhoud";
export const PUBLIC_NAV_LABEL = "Navigatie";
export const PUBLIC_NAV_SIGN_IN = "Inloggen";

export const PUBLIC_NAV = [
  { href: PUBLIC_PLATFORM_PATH, label: "Platform" },
  { href: PUBLIC_AUDIENCES_PATH, label: "Voor wie" },
  { href: PUBLIC_HOW_PATH, label: "Zo werkt het" },
  { href: PUBLIC_ABOUT_PATH, label: "Over" },
] as const;

export const PUBLIC_LOGIN_HREF = PUBLIC_LOGIN_PATH;
export const PUBLIC_HOME_HREF = PUBLIC_HOME_PATH;

export const PUBLIC_HOME_TITLE = "ZyntixAI";
export const PUBLIC_HOME_DESCRIPTION =
  "ZyntixAI is een ingelogde werkruimte voor klanten, taken en aandacht. Gebruik is gratis. Toegang op uitnodiging, zonder openbare aanmelding.";

export const PUBLIC_H1 = "Houd zicht op klanten, werk en voortgang.";
export const PUBLIC_SUPPORT =
  "ZyntixAI is een ingelogde werkruimte voor een organisatie. Je houdt er klanten, taken en aandachtspunten bij. Extra onderdelen hangen af van de bedrijfscontext van die organisatie.";
export const PUBLIC_BETA_NOW = "ZyntixAI is in gesloten b\u00e8ta.";
export const PUBLIC_BETA_EXISTING =
  "Via deze website kun je geen account aanmaken. Inloggen is voor bestaande accounts.";
export const PUBLIC_OFFER = "Gratis te gebruiken \u00b7 Toegang op uitnodiging";
export const PUBLIC_INSTAGRAM_URL = "https://www.instagram.com/zyntixai/";
export const PUBLIC_INSTAGRAM_BUTTON = "Vraag toegang via Instagram";
export const PUBLIC_INSTAGRAM_PROMPT =
  "Interesse in toegang? Stuur @zyntixai een bericht op Instagram.";
export const PUBLIC_INSTAGRAM_LIMIT = "Een bericht garandeert geen toegang.";
export const PUBLIC_INSTAGRAM_NEW_TAB =
  "Opent het Instagram-profiel in een nieuw tabblad.";
export const PUBLIC_INSTAGRAM_FOOTER = "Contact via Instagram";
export const PUBLIC_ACCESS_QUESTION = "Hoe krijg ik toegang?";
export const PUBLIC_ACCESS_ANSWER =
  "Stuur @zyntixai een bericht op Instagram om toegang te vragen. Verzoeken worden handmatig beoordeeld. Als je wordt toegelaten, ontvang je een uitnodiging via ZyntixAI. Een bericht garandeert geen toegang.";
export const PUBLIC_FREE_QUESTION = "Is ZyntixAI gratis?";
export const PUBLIC_FREE_ANSWER =
  "Ja, het gebruik van ZyntixAI is gratis. Het product heeft geen abonnement. Nieuwe toegang loopt via een uitnodiging, niet via een openbare aanmelding. Niet elk onderdeel staat in elke werkruimte. Kosten van diensten buiten ZyntixAI vallen hier niet onder.";

export const PUBLIC_PREVIEW_H2 = "Today in de werkruimte";
export const PUBLIC_PREVIEW_BODY =
  "Wie is toegelaten en ingelogd, en van wie de organisatie is ingericht, start op Today. Die pagina toont een kort overzicht: aandacht van de organisatie, aandacht die aan jou is toegewezen, te laat werk en werk dat vandaag af moet.";
export const PUBLIC_PREVIEW_LIMIT =
  "Elk blok op Today toont een beperkt aantal regels. Ander werk kan elders in de werkruimte staan. Today is geen publieke demo en niet het hele product.";
export const PUBLIC_PREVIEW_CAPTION =
  "Voorbeeld met fictieve gegevens. De echte pagina gebruikt de gegevens van je organisatie en is alleen zichtbaar na het inloggen.";
export const PUBLIC_PREVIEW_ORG = "Atelier Linden";
export const PUBLIC_PREVIEW_ROLE = "Owner";
export const PUBLIC_PREVIEW_TITLE = "Today";
export const PUBLIC_PREVIEW_SUBTITLE =
  "Priority Attention and due work in today\u2019s brief.";
export const PUBLIC_PREVIEW_ATTENTION_H = "Organization attention";
export const PUBLIC_PREVIEW_ATTENTION_TITLE = "Klant mist een contactgegeven";
export const PUBLIC_PREVIEW_ATTENTION_SEVERITY = "High";
export const PUBLIC_PREVIEW_TASK_H = "Due today";
export const PUBLIC_PREVIEW_TASK_TITLE = "Bel de klant terug";
export const PUBLIC_PREVIEW_TASK_META = "Due today";

export const PUBLIC_WORK_H2 = "Werk dat de werkruimte nu ondersteunt";
export const PUBLIC_WORK_INTRO =
  "De punten hieronder horen bij functies die in het ingelogde product zitten. Ze gelden niet allemaal voor elke organisatie.";
export const PUBLIC_WORK = [
  {
    title: "Zien wat vandaag eerst komt",
    body: "Today zet aandacht en toegewezen taken die te laat zijn of vandaag af moeten in \u00e9\u00e9n kort overzicht.",
  },
  {
    title: "Klanten bij het werk houden",
    body: "Elke bedrijfscontext in het product bevat klanten. Taken horen bij de kern van de werkruimte.",
  },
  {
    title: "Opleidingen en coaching volgen",
    body: "In die context kun je programma\u2019s, inschrijvingen en voortgang bij de klant bijhouden. Er is geen leeromgeving voor deelnemers.",
  },
  {
    title: "Veldwerk plaatsen en toewijzen",
    body: "In de veldcontext zitten locaties, werkbonnen en een lichte planning met toewijzing aan een technicus. Zonder routeplanning of optimalisatie.",
  },
  {
    title: "Voorraad en orders samen zien",
    body: "In de productcontext zitten producten, voorraad, orders en fulfillment in de werkruimte. Zonder webwinkel of betaling.",
  },
] as const;

export const PUBLIC_FIT_H2 = "Hoe de onderdelen samenhangen";
export const PUBLIC_FIT_BODY =
  "Een organisatie werkt in \u00e9\u00e9n bedrijfscontext. De navigatie toont de onderdelen die bij die context horen. Onderdelen die niet gelden, blijven uit beeld tot de context ze toelaat.";
export const PUBLIC_FIT_SHARED_H = "In elke ingerichte werkruimte";
export const PUBLIC_FIT_SHARED = [
  "Today, met aandacht en taken voor vandaag",
  "Taken",
  "Aandachtspunten",
  "Klanten",
  "Ledenbeheer van de organisatie",
] as const;
export const PUBLIC_FIT_CONTEXT_H = "Afhankelijk van de context";
export const PUBLIC_FIT_CONTEXT =
  "Programma\u2019s en voortgang, of projecten, of locaties en werkbonnen, of producten en orders. Niet alles tegelijk, en niet op deze website.";
export const PUBLIC_FIT_MEMBERS =
  "Leden worden in het product beheerd. Via deze website nodig je niemand uit.";

export const PUBLIC_AUDIENCE_HOME_H2 = "Bedrijfscontexten in het product";
export const PUBLIC_AUDIENCE_HOME_BODY =
  "Het product bevat vier contexten. Een organisatie gebruikt er \u00e9\u00e9n. Deze site is geen aanmelding voor een context.";

export const PUBLIC_ACCESS_H2 = "Toegang";
export const PUBLIC_ACCESS_BODY =
  "Je logt in met een bestaand account. Daarna opent het product de werkruimte van je organisatie. Is die nog niet ingericht, dan volgt de inrichting in het product, inclusief de keuze van een bedrijfscontext. Today is daarna het dagelijkse startpunt, niet de hele werkruimte.";
export const PUBLIC_ACCESS_BEFORE_LINK = "Heb je al een account? ";
export const PUBLIC_ACCESS_LINK = "Inloggen";
export const PUBLIC_ACCESS_AFTER_LINK = ".";

export const PUBLIC_FAQ_H2 = "Vragen";
export const PUBLIC_FAQ = [
  {
    question: PUBLIC_ACCESS_QUESTION,
    answer: PUBLIC_ACCESS_ANSWER,
  },
  {
    question: "Kan ik op deze site een account aanmaken?",
    answer:
      "Nee. Openbare aanmelding staat uit. Nieuwe toegang loopt via een uitnodiging. Inloggen is voor bestaande accounts.",
  },
  {
    question: PUBLIC_FREE_QUESTION,
    answer: PUBLIC_FREE_ANSWER,
  },
  {
    question: "Wat zie ik na het inloggen?",
    answer:
      "Het product bepaalt de vervolgstap voor jouw account en organisatie. Als de werkruimte is ingericht, is Today het dagelijkse startpunt met aandacht en taken. Today toont niet al het werk.",
  },
  {
    question: "Geldt elke functie voor elke organisatie?",
    answer:
      "Nee. De navigatie volgt de gekozen bedrijfscontext. Wat niet bij die context hoort, blijft uit de navigatie.",
  },
  {
    question: "Is ZyntixAI een leeromgeving of een webwinkel?",
    answer:
      "Nee. Programma\u2019s zijn voor de organisatie die opleidingen of coaching aanbiedt, niet voor deelnemers op deze site. Orders en fulfillment zitten in de werkruimte, zonder webwinkel of betaling.",
  },
  {
    question: "Voert ZyntixAI het werk zelf uit?",
    answer:
      "Nee. Mensen werken in de werkruimte. Today stelt een overzicht samen uit aandacht en taken. Het rondt dat werk niet zelf af.",
  },
  {
    question: "Staan er meetcookies op deze pagina\u2019s?",
    answer:
      "Deze publieke pagina\u2019s laden geen aparte meet- of marketingcode. Een ingelogde sessie gebruikt authenticatiecookies van het product. De privacyverklaring staat op de privacypagina.",
  },
] as const;

export const PUBLIC_CLOSE_H2 = "Toegang vragen";

export const PUBLIC_FOOTER_NOTE =
  "ZyntixAI. Gebruik is gratis. Toegang op uitnodiging. Geen openbare aanmelding op deze site.";
export const PUBLIC_PRIVACY_LABEL = "Privacy";
export const PUBLIC_PRIVACY_EMAIL = "testplatform617@gmail.com";
export const PUBLIC_PRIVACY_MAILTO = "mailto:testplatform617@gmail.com";
export const PUBLIC_PRIVACY_H1 = "Privacy";
export const PUBLIC_PRIVACY_TITLE = "Privacy \u2014 ZyntixAI";
export const PUBLIC_PRIVACY_DESCRIPTION =
  "Privacyverklaring van ZyntixAI: Guus Vermolen is verantwoordelijke, met het privacycontact en de verwerkingen van de publieke site en de ingelogde werkruimte.";
export const PUBLIC_PRIVACY_LEAD =
  "Deze tekst beschrijft welke persoonsgegevens ZyntixAI verwerkt, waarom, en hoe lang die gegevens blijven bestaan voor zover dat is vastgesteld.";
export const PUBLIC_PRIVACY_VERSION = "Versie 7 oktober 2026";
export const PUBLIC_AP_COMPLAINT_URL =
  "https://autoriteitpersoonsgegevens.nl/een-tip-of-klacht-indienen-bij-de-ap";
export const PUBLIC_PRIVACY_SECTIONS = [
  {
    title: "Verantwoordelijke",
    paragraphs: [
      "Guus Vermolen beheert ZyntixAI persoonlijk, als hobby- en leerproject, en is de verwerkingsverantwoordelijke voor de verwerkingen in deze tekst.",
      "Een privacyverzoek stuur je naar het privacycontact hieronder. Stuur geen wachtwoorden, tokens of onnodige gevoelige gegevens mee. Een identiteitsbewijs wordt niet standaard gevraagd.",
      "Instagram is het kanaal voor een uitnodigingsverzoek. Het is niet het privacycontact.",
    ],
  },
  {
    title: "Wat deze tekst wel en niet dekt",
    paragraphs: [
      "Het eerste deel gaat over bezoekers van de publieke pagina\u2019s. Het deel over accounts gaat over mensen die een ZyntixAI-account gebruiken.",
      "Gegevens die een organisatie in de werkruimte zet over haar eigen klanten, worden opgeslagen om die werkruimte te laten werken. Deze tekst vervangt niet de informatie die die organisatie aan haar eigen klanten geeft.",
    ],
  },
  {
    title: "Publieke bezoekers",
    paragraphs: [
      "Bij een bezoek verwerkt de hosting het HTTP-verzoek. Daarbij horen het IP-adres, browsergegevens, het tijdstip en het adres van de pagina. Het doel is de pagina tonen en misbruik beperken.",
      "Deze publieke pagina\u2019s laden geen aparte meet- of marketingcode. Een anonieme meting zonder cookie bewijst niet dat er geen persoonsgegevens worden verwerkt: het verzoek zelf wordt door de hosting verwerkt.",
      "De grondslag is artikel 6 lid 1 onder f van de AVG. Overweging 49 noemt verwerking die strikt noodzakelijk en evenredig is voor netwerk- en informatiebeveiliging als gerechtvaardigd belang. De logs worden niet voor reclame gebruikt. Een aparte schriftelijke belangenafweging ligt niet in de repository; deze alinea is de gepubliceerde begrenzing.",
    ],
  },
  {
    title: "Sessie en account",
    paragraphs: [
      "De middleware vraagt bij elk verzoek, ook op een publieke pagina, aan Supabase of er een sessie is. Zonder bestaande sessie zette een lokale meting op 7 oktober 2026 geen cookie.",
      "Wie inlogt, geeft een e-mailadres en een wachtwoord. Het wachtwoord wordt niet als leesbare tekst in deze verklaring opgeslagen; Supabase bewaart de aanmeldgegevens van het account. Daarna kan een authenticatiecookie worden gezet of ververst, zodat de sessie blijft werken.",
      "In de werkruimte staan de gegevens die de organisatie daar invoert, zoals klanten, taken en aandacht. Die opslag is nodig om de uitgenodigde werkruimte te laten werken. De grondslag daarvoor, en voor het account zelf, is artikel 6 lid 1 onder b van de AVG: de verwerking is nodig om de gevraagde werkruimte te leveren.",
      "Wachtwoordherstel gebruikt het e-mailadres om een herstellink te sturen als er een account bij hoort.",
    ],
  },
  {
    title: "Uitnodigingen",
    paragraphs: [
      "De website slaat een Instagram-bericht niet op en opent geen berichtvenster. Wie @zyntixai een bericht stuurt, doet dat bij Instagram. Instagram verwerkt dat bericht.",
      "Een bericht garandeert geen toegang. Als iemand wordt toegelaten, gaat de uitnodiging via de bestaande uitnodigingsfunctie van ZyntixAI. Het e-mailadres van die uitnodiging hoort dan bij de accountgegevens.",
      "E-mailverzending van een uitnodiging staat in de code alleen aan als die instelling exact is ingeschakeld. De code gebruikt daarvoor Resend. Deze tekst zegt niet dat die verzending op dit moment aan staat.",
    ],
  },
  {
    title: "Privacyverzoeken",
    paragraphs: [
      "Een bericht naar het privacycontact wordt gelezen door Guus Vermolen. Google verwerkt het bericht omdat het contact een Gmail-adres is. Deze tekst belooft niet dat Google het bericht in de EER bewaart.",
      "De grondslag voor het behandelen van een privacyverzoek is artikel 6 lid 1 onder c van de AVG: de AVG verplicht een verantwoordelijke om verzoeken over de rechten van betrokkenen te behandelen. Artikel 12 noemt daarvoor in de regel een termijn van \u00e9\u00e9n maand.",
    ],
  },
  {
    title: "Ontvangers",
    paragraphs: [
      "Vercel host de website en verwerkt het paginabezoek.",
      "Supabase bewaart de database en de authenticatie van het productieproject. Dat project staat in de regio eu-central-1, Frankfurt.",
      "Google ontvangt privacymail via Gmail. Instagram ontvangt een uitnodigingsbericht alleen als je dat zelf stuurt. Resend ontvangt een uitnodigingsmail alleen als die verzending aan staat.",
    ],
  },
  {
    title: "Bewaartermijnen",
    paragraphs: [
      "Account- en werkruimtegegevens blijven staan zolang het account bestaat. In het product zit geen automatische verwijdering. Verwijderen gebeurt na een verzoek aan het privacycontact, niet door een taak die in de code al is bewezen.",
      "Supabase documenteert dagelijkse databaseback-ups voor Pro (7 dagen), Team (14 dagen) en Enterprise (tot 30 dagen). Voor het Free-plan documenteert Supabase die reeks niet en raadt het een eigen export aan. Het abonnement van het productieproject is met de opgevraagde projectgegevens niet vastgesteld. Daarom noemt deze tekst geen van die termijnen als de termijn van ZyntixAI. Na verwijdering kan een back-up de gegevens nog bevatten tot die back-up volgens het dan geldende abonnement vervalt. Point-in-time recovery is een aparte betaalde optie; niet vastgesteld of die aan staat.",
      "Vercel documenteert de bewaring van runtime logs per abonnement: 1 uur op Hobby, 1 dag op Pro, 30 dagen op Pro met Observability Plus, 3 dagen op Enterprise en 30 dagen op Enterprise met Observability Plus. Het abonnement van dit Vercel-project is met project inspect niet als \u00e9\u00e9n van die rijen vastgesteld. De logs blijven dus staan volgens de rij van het actieve abonnement, en niet volgens een zelf gekozen termijn.",
    ],
  },
  {
    title: "Buiten de EER",
    paragraphs: [
      "De primaire database, authenticatie en opslag van het productieproject staan in Frankfurt, in de EU. Supabase schrijft dat back-ups, logs en subverwerkers de beoordeling van een doorgifte nog kunnen be\u00efnvloeden. Deze tekst garandeert niet dat elke kopie in de EU blijft.",
      "De repository zet geen eigen functieregio voor Vercel. Een productieantwoord op 7 oktober 2026 droeg het kenmerk fra1::iad1. Dat wijst op uitvoering van de functie in de Verenigde Staten. Vercel beschrijft in zijn verwerkersovereenkomst verwerking in de Verenigde Staten en past voor doorgiften vanuit de EER de standaardcontractbepalingen van uitvoeringsbesluit 2021/914 toe wanneer die overeenkomst geldt. Een ondertekend exemplaar ligt niet in deze repository.",
    ],
  },
  {
    title: "Rechten",
    paragraphs: [
      "Je kunt vragen om inzage, rectificatie, verwijdering, beperking of overdraagbaarheid, en je kunt bezwaar maken tegen een verwerking op grond van artikel 6 lid 1 onder f. Dat verzoek gaat naar het privacycontact.",
      "Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens. De AP vraagt om eerst contact op te nemen met de verantwoordelijke.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "Er is geen cookiemelding, omdat deze publieke pagina\u2019s geen meet- of marketingcookies plaatsen.",
      "Een authenticatiecookie wordt gezet of ververst wanneer Supabase dat vraagt voor een sessie. Die cookie dient om ingelogd te blijven. Afmelden roept het afmelden van die sessie aan.",
    ],
  },
] as const;

export const PUBLIC_PLATFORM_TITLE = "Platform \u2014 ZyntixAI";
export const PUBLIC_PLATFORM_DESCRIPTION =
  "Wat de ingelogde ZyntixAI-werkruimte nu bevat: Today, klanten, taken, aandacht en de onderdelen van de gekozen bedrijfscontext.";
export const PUBLIC_PLATFORM_H1 = "De ingelogde werkruimte";
export const PUBLIC_PLATFORM_LEAD =
  "ZyntixAI is geen openbare catalogus. Na het inloggen werkt een organisatie in een eigen werkruimte. De pagina Today is het dagelijkse startpunt. De rest van de navigatie volgt de bedrijfscontext.";

export const PUBLIC_AUDIENCES_TITLE = "Voor wie \u2014 ZyntixAI";
export const PUBLIC_AUDIENCES_DESCRIPTION =
  "De vier bedrijfscontexten die de huidige ZyntixAI-werkruimte bevat, met de grenzen die in het product zitten.";
export const PUBLIC_AUDIENCES_H1 = "Voor welke organisaties het product nu context heeft";
export const PUBLIC_AUDIENCES_LEAD =
  "Een toegelaten organisatie kiest \u00e9\u00e9n context. De werkruimte toont daarna de bijbehorende onderdelen. Dit is geen aanmeldpagina en geen belofte dat elke context voor elke bezoeker openstaat.";

export const PUBLIC_CONTEXTS = [
  {
    id: "opleidingen-en-coaching",
    title: "Opleidingen en coaching",
    body: "E\u00e9n context voor organisaties die opleidingen of coaching verkopen. In de werkruimte: klanten, leads, programma\u2019s, inschrijvingen en voortgang.",
    limit:
      "Geen leeromgeving voor deelnemers en geen open cursuscatalogus op deze website.",
  },
  {
    id: "agencies-en-diensten",
    title: "Agencies en zakelijke diensten",
    body: "In deze context heten klanten in het product Clients. De werkruimte bevat leads, projecten en taken, naast aandacht en Today.",
    limit: "Geen klantportaal en geen facturatie.",
  },
  {
    id: "bouw-en-veldwerk",
    title: "Bouw, installatie en veldwerk",
    body: "Projecten heten in het product Jobs. Daarnaast zitten er locaties, werkbonnen en Dispatch. Dispatch is een lichte planning: niet-toegewezen werk, werk van vandaag en later gepland werk, met een technicus.",
    limit:
      "Geen routeplanning en geen optimalisatie. Het product vermeldt dat zelf op Dispatch.",
  },
  {
    id: "product-en-fulfillment",
    title: "Product en fulfillment",
    body: "Producten, voorraad, orders en fulfillment. Een order wordt alleen aangemaakt als elke regel voorraad heeft. Een correctie die de voorraad onder nul brengt, wordt geweigerd. Fulfillment zet openstaande orders door naar afgerond.",
    limit: "Geen webwinkel, geen checkout en geen betaling.",
  },
] as const;

export const PUBLIC_HOW_TITLE = "Zo werkt het \u2014 ZyntixAI";
export const PUBLIC_HOW_DESCRIPTION =
  "Hoe toegang tot ZyntixAI nu werkt: gebruik is gratis, toegang op uitnodiging, inloggen voor bestaande accounts.";
export const PUBLIC_HOW_H1 = "Zo kom je in de werkruimte";
export const PUBLIC_HOW_LEAD =
  "Deze website legt de huidige werkwijze uit. Ze maakt geen account, geen organisatie en geen betaling aan.";
export const PUBLIC_HOW_STEPS = [
  {
    title: "Lezen kan zonder account",
    body: "De pagina\u2019s op deze site zijn openbaar. Ze beschrijven de werkruimte. Ze openen die werkruimte niet.",
  },
  {
    title: "Aanmelden via deze site staat uit",
    body: "Openbare registratie is niet beschikbaar. Toegang vraag je met een bericht aan @zyntixai op Instagram. Verzoeken worden handmatig beoordeeld. Een bericht garandeert geen toegang. Het gebruik is gratis; het product heeft geen abonnement.",
  },
  {
    title: "Bestaande accounts loggen in",
    body: "Inloggen staat op een eigen pagina. Het product bepaalt daarna de vervolgstap, bijvoorbeeld e-mailbevestiging, een openstaande uitnodiging, inrichting of Today.",
  },
  {
    title: "De organisatie heeft \u00e9\u00e9n context",
    body: "Tijdens de inrichting kiest de organisatie een bedrijfscontext. De navigatie laat alleen de onderdelen zien die bij die context horen.",
  },
  {
    title: "Today is het dagelijkse startpunt",
    body: "Today toont prioritaire aandacht en werk dat is toegewezen en te laat is of vandaag af moet. Het overzicht is begrensd. De rest van het werk staat op de bijbehorende pagina\u2019s in de werkruimte.",
  },
] as const;

export const PUBLIC_ABOUT_TITLE = "Over ZyntixAI";
export const PUBLIC_ABOUT_DESCRIPTION =
  "Feitelijke informatie over ZyntixAI: de naam van de ingelogde werkruimte, de productiesite en wat deze website niet is.";
export const PUBLIC_ABOUT_H1 = "Over ZyntixAI";
export const PUBLIC_ABOUT_LEAD =
  "ZyntixAI is de naam van deze software. De productiesite is https://www.zyntixai.com.";
export const PUBLIC_ABOUT_PARAS = [
  "ZyntixAI is een persoonlijk hobby- en leerproject.",
  "De publieke pagina\u2019s beschrijven de ingelogde werkruimte en verwijzen naar Inloggen voor bestaande accounts.",
  "ZyntixAI vervangt niet elke andere tool van een organisatie. De werkruimte dekt de onderdelen die bij de gekozen context horen: klanten, taken, aandacht en de contextspecifieke pagina\u2019s.",
  "Er is geen openbare aanmelding, geen webwinkel en geen leeromgeving voor deelnemers op deze site.",
] as const;

export const PUBLIC_NOT_FOUND_TITLE = "Pagina niet gevonden \u2014 ZyntixAI";
export const PUBLIC_NOT_FOUND_H1 = "Deze pagina bestaat niet";
export const PUBLIC_NOT_FOUND_BODY =
  "Het adres hoort niet bij de publieke pagina\u2019s van ZyntixAI. Ga terug naar het begin of log in als je al een account hebt.";

export const PUBLIC_SECTION_IDS = {
  main: "hoofdinhoud",
  preview: "today",
  work: "werk",
  fit: "samenhang",
  audiences: "contexten",
  access: "toegang",
  faq: "vragen",
  close: "verder",
} as const;
