import type { LegalDocType, LegalDocument } from '../legalDocuments'

export const LEGAL_DOCUMENTS_EN: Record<LegalDocType, LegalDocument> = {
  cgv: {
    title: 'General Terms of Sale',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Article 1 - Purpose',
        content: [
          'These General Terms of Sale (hereinafter "GTS") govern the contractual relationship between Mano Verde SA, a public limited company incorporated under Cameroonian law with its registered office located in Douala, Cameroon (hereinafter "the Provider"), and any natural or legal person subscribing to its services (hereinafter "the Client").',
          'The Provider offers a point of sale (POS) platform accessible in SaaS (Software as a Service) mode via the web application pos.manoverde.com. This service enables sales management, receipt issuance, stock management, treasury tracking, and data synchronization across multiple devices and commercial activities.',
          'The use of the POS Mano Verde platform implies the full and unconditional acceptance of these GTS by the Client.',
        ],
      },
      {
        title: 'Article 2 - Service Access',
        content: [
          'Access to the service requires the creation of a user account on the platform. The Client must provide accurate and up-to-date information during registration, including their name, email address, phone number, and information relating to their commercial activity.',
          'The Client must be at least 18 years of age or have the necessary legal capacity to enter into a contract in their jurisdiction of residence. If using the service on behalf of a legal entity, the Client declares that they have the necessary authority to bind said entity.',
          'The account is personal and the Client is responsible for the confidentiality of their login credentials. Any use of the service performed with the Client\'s credentials is deemed to have been made by the Client.',
        ],
      },
      {
        title: 'Article 3 - Pricing',
        content: [
          'The Provider offers several subscription plans: a free plan with limited features, and paid plans offering advanced features. Current rates are displayed on the platform\'s pricing page.',
          'In addition to fixed plans, the Provider offers a pay-as-you-grow billing model at a rate of $0.02 USD per receipt issued. Each new account benefits from an initial credit of $10 USD, allowing the issuance of 500 receipts at no additional cost.',
          'Prices are expressed in US dollars (USD) and are subject to change. Any price change will be communicated to the Client with thirty (30) days\' notice. The applicable rates are those in effect at the time of subscription or renewal of the subscription.',
        ],
      },
      {
        title: 'Article 4 - Payment Methods',
        content: [
          'The Client may pay for their subscriptions and usage through the following payment methods: Orange Money, MTN Mobile Money, and credit card (Visa, Mastercard).',
          'Mobile money payments are processed in real time. Credit card payments are secured through a third-party payment provider compliant with PCI-DSS standards.',
          'In the event of payment failure, the Provider reserves the right to suspend access to paid features of the service after notifying the Client. The Client has a period of fifteen (15) days to regularize their situation.',
        ],
      },
      {
        title: 'Article 5 - Duration and Termination',
        content: [
          'Monthly subscriptions are taken out for a period of one month, automatically renewable. Annual subscriptions are taken out for a period of twelve (12) months, automatically renewable.',
          'The Client may cancel their subscription at any time from their account settings. The cancellation takes effect at the end of the current subscription period. No pro-rata refund will be issued for the remaining period.',
          'In the event of cancellation, the Client\'s data is retained for a period of thirty (30) days, during which the Client may request the export of their data. After this period, the data is permanently deleted.',
          'The Provider reserves the right to terminate a Client\'s account in the event of a violation of these GTS, after formal notice that has remained without effect for a period of seven (7) days.',
        ],
      },
      {
        title: 'Article 6 - Liability',
        content: [
          'The Provider undertakes to provide the service with due diligence and in accordance with industry standards. However, the service is provided "as is" and the Provider does not guarantee uninterrupted or error-free operation.',
          'The Provider shall not be held liable in the event of force majeure, Internet network dysfunction, failure of the Client\'s equipment, or any cause external to the Provider.',
          'In any event, the total liability of the Provider under this contract is limited to the amounts actually paid by the Client during the twelve (12) months preceding the event giving rise to the liability. The Provider shall under no circumstances be held liable for indirect damages, loss of profits, loss of data, or loss of business.',
        ],
      },
      {
        title: 'Article 7 - Intellectual Property',
        content: [
          'The POS Mano Verde platform, including its source code, graphical interface, algorithms, documentation, and all elements composing it, is the exclusive property of Mano Verde SA.',
          'The subscription grants the Client a personal, non-exclusive, and non-transferable right to use the service for the duration of the subscription. This right does not confer any ownership rights over the software or its components.',
          'Any reproduction, representation, modification, distribution, or exploitation of the platform or its elements, in whole or in part, without the prior written authorization of Mano Verde SA is strictly prohibited and constitutes infringement punishable under applicable law.',
        ],
      },
      {
        title: 'Article 8 - Applicable Law and Jurisdiction',
        content: [
          'These GTS are governed by Cameroonian law and, where applicable, by the provisions of the uniform law of the Organization for the Harmonization of Business Law in Africa (OHADA).',
          'In the event of a dispute relating to the interpretation or performance of these GTS, the parties shall endeavor to find an amicable solution. Failing an amicable agreement within a period of thirty (30) days, the dispute shall be submitted to the competent courts of Douala, Cameroon.',
          'For any complaint, the Client may contact the Provider at the following address: direction@manoverde.com.',
        ],
      },
    ],
  },

  rgpd: {
    title: 'Personal Data Protection Policy',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Article 1 - Data Collected',
        content: [
          'In the course of using the POS Mano Verde platform, the Provider collects the following categories of personal data:',
          'Identification data: last name, first name, email address, phone number, postal address of the commercial activity\'s headquarters.',
          'Business activity data: company name, business sector, tax identification number (where applicable), information about the products and services offered.',
          'Transactional data: sales history, transaction amounts, payment methods used by the Client\'s customers, receipts issued.',
          'Technical data: IP address, browser type, operating system, connection and browsing data on the platform.',
        ],
      },
      {
        title: 'Article 2 - Purpose of Processing',
        content: [
          'The personal data collected is processed for the following purposes:',
          'Service operation: creation and management of the user account, transaction processing, data synchronization across devices, generation of reports and statistics.',
          'Billing and business management: invoice issuance, subscription management, usage tracking (number of receipts issued), payment collection.',
          'Technical support: processing of assistance requests, resolution of technical incidents, continuous service improvement.',
          'Analysis and improvements: anonymized usage analysis to improve the platform, fraud detection and prevention, aggregated statistical studies.',
        ],
      },
      {
        title: 'Article 3 - Legal Basis for Processing',
        content: [
          'The processing of personal data is based on the following legal grounds:',
          'User consent, collected during registration on the platform and which may be withdrawn at any time from the account settings.',
          'Contractual necessity: data processing is essential for the performance of the service contract between the Provider and the Client, particularly for the provision of the point of sale service and billing.',
          'The legitimate interest of the Provider: service improvement, fraud prevention, platform security.',
          'Legal obligations: retention of financial data in accordance with applicable accounting and tax obligations.',
        ],
      },
      {
        title: 'Article 4 - Data Retention Period',
        content: [
          'Personal data is retained for the following periods:',
          'Active account data: data is retained for the entire duration of active use of the service, then for a period of three (3) years from the Client\'s last login.',
          'Financial and transactional data: in accordance with legal accounting and tax obligations, this data is retained for a period of ten (10) years.',
          'Technical data (connection logs): this data is retained for a period of twelve (12) months.',
          'Upon expiration of these periods, the data is permanently deleted or irreversibly anonymized.',
        ],
      },
      {
        title: 'Article 5 - Data Sharing',
        content: [
          'Mano Verde SA undertakes never to sell, rent, or transfer its Clients\' personal data to third parties for commercial or advertising purposes.',
          'Data may be shared with the following technical service providers, strictly necessary for the operation of the service:',
          'Supabase (database hosting and authentication): data is hosted on secure servers. Supabase complies with industry security standards.',
          'Vercel (web application hosting and CDN): only the application code is hosted on Vercel. No personal data is stored on Vercel servers.',
          'Payment providers (for processing financial transactions): only the data strictly necessary for payment processing is transmitted.',
          'Data may also be disclosed to competent authorities in the event of a legal obligation or court order.',
        ],
      },
      {
        title: 'Article 6 - Data Security',
        content: [
          'Mano Verde SA implements appropriate technical and organizational measures to protect personal data against unauthorized access, modification, disclosure, or destruction.',
          'Security measures include, in particular: encryption of data in transit (TLS/SSL) and at rest, implementation of row-level security policies (Row Level Security - RLS) in the database ensuring that each Client can only access their own data, and the use of Supabase\'s secure infrastructure.',
          'User passwords are hashed using secure hashing algorithms and are never stored in plain text.',
          'The Provider undertakes to notify affected Clients and competent authorities in the event of a personal data breach, in accordance with applicable legal provisions.',
        ],
      },
      {
        title: 'Article 7 - User Rights',
        content: [
          'In accordance with applicable personal data protection regulations, the Client has the following rights:',
          'Right of access: the Client may obtain confirmation as to whether or not their data is being processed, and obtain a copy of such data.',
          'Right to rectification: the Client may request the correction of inaccurate or incomplete data concerning them.',
          'Right to erasure: the Client may request the deletion of their personal data, subject to legal retention obligations.',
          'Right to portability: the Client may obtain their data in a structured, commonly used, and machine-readable format (CSV or JSON export), in order to transfer it to another provider.',
          'Right to object: the Client may object to the processing of their data on legitimate grounds.',
          'To exercise these rights, the Client may send their request by email to: direction@manoverde.com. The Provider undertakes to respond within a period of thirty (30) days.',
        ],
      },
      {
        title: 'Article 8 - Cookies',
        content: [
          'The POS Mano Verde platform exclusively uses technical cookies that are strictly necessary for the operation of the service. These cookies enable user session management, language preference storage, and connection maintenance.',
          'No tracking, advertising, or behavioral analysis cookies are used on the platform.',
          'As these technical cookies are essential for the operation of the service, they do not require prior user consent in accordance with applicable legal provisions.',
        ],
      },
      {
        title: 'Article 9 - Data Protection Officer Contact',
        content: [
          'For any questions regarding the protection of your personal data or to exercise your rights, you may contact our Data Protection Officer (DPO) at the following address:',
          'Email: direction@manoverde.com',
          'Postal address: Mano Verde SA, Douala, Cameroon.',
          'You also have the right to file a complaint with the competent supervisory authority if you believe that the processing of your personal data does not comply with applicable regulations.',
        ],
      },
    ],
  },

  terms: {
    title: 'Terms of Use',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Article 1 - Acceptance of Terms',
        content: [
          'Access to and use of the POS Mano Verde platform (hereinafter "the Service") are subject to the prior and unconditional acceptance of these Terms of Use.',
          'By creating an account or using the Service, the user acknowledges having read, understood, and accepted these Terms of Use in their entirety. If the user does not accept these terms, they must refrain from using the Service.',
          'These Terms of Use complement the General Terms of Sale (GTS) and the Personal Data Protection Policy accessible from the platform.',
        ],
      },
      {
        title: 'Article 2 - Service Description',
        content: [
          'POS Mano Verde is an online point of sale (POS) system accessible via a web browser. The Service offers the following features:',
          'Sales management and receipt issuance, product and catalog management, stock tracking and treasury movements, generation of reports and commercial statistics.',
          'The Service operates in offline mode: the user can continue to record sales even without an Internet connection. Data is automatically synchronized with the cloud when the connection is restored.',
          'Cloud synchronization allows the user to access their data from multiple devices and manage multiple commercial activities from a single account.',
        ],
      },
      {
        title: 'Article 3 - Account Creation',
        content: [
          'To use the Service, the user must create an account by providing accurate, complete, and up-to-date information. The user agrees to update their information in the event of any changes.',
          'Each email address can only be associated with one user account. However, a single user account can manage multiple organizations and commercial activities.',
          'The user is solely responsible for the security of their password and the confidentiality of their login credentials. In the event of suspected unauthorized use of their account, the user must immediately notify the Provider at direction@manoverde.com.',
          'The Provider reserves the right to refuse the creation of an account or to suspend an existing account in the event of non-compliance with these terms.',
        ],
      },
      {
        title: 'Article 4 - Acceptable Use',
        content: [
          'The Service is intended exclusively for legal commercial use. The user agrees to use the Service in accordance with the laws and regulations in force in their jurisdiction.',
          'The following uses are strictly prohibited: using the Service for fraudulent, illegal, or public order-violating activities; attempting unauthorized access to the Provider\'s systems, servers, or networks; decompiling, disassembling, reverse engineering, or any attempt to extract the platform\'s source code.',
          'The following are also prohibited: transmitting viruses, malware, or any harmful code through the Service; using robots, scrapers, or any automated tools to access the Service without authorization; intentionally overloading the servers or any action likely to disrupt the operation of the Service.',
          'In the event of a violation of these usage rules, the Provider reserves the right to immediately suspend or delete the user\'s account, without notice or compensation.',
        ],
      },
      {
        title: 'Article 5 - User Content',
        content: [
          'The user retains full ownership of all data they enter and store on the platform (product data, transactions, customer information, reports, etc.).',
          'By using the Service, the user grants Mano Verde SA a limited, non-exclusive, and revocable license to process, store, and display this data solely for the purpose of providing the Service. This license automatically terminates upon deletion of the account.',
          'The user warrants that the data they enter on the platform does not violate any third-party intellectual property rights and does not contain any illegal, defamatory, or harmful content.',
          'The Provider exercises no editorial control over the content entered by the user and shall not be held liable for such content.',
        ],
      },
      {
        title: 'Article 6 - Service Availability',
        content: [
          'The Provider endeavors to ensure the availability of the Service 24 hours a day, 7 days a week. However, the Service is provided on a "best effort" basis and the Provider does not guarantee uninterrupted availability.',
          'The Provider reserves the right to temporarily suspend access to the Service for maintenance, update, or improvement operations. Scheduled maintenance will, where possible, be carried out outside peak usage hours and announced in advance.',
          'The free plan does not include any service level agreement (SLA). Paid plans benefit from an availability target of 99.5%, excluding scheduled maintenance periods and force majeure events.',
          'The offline mode built into the Service allows the user to continue working even in the event of temporary unavailability of the Internet connection or servers.',
        ],
      },
      {
        title: 'Article 7 - Multi-Activity',
        content: [
          'The Service allows the user to manage multiple commercial activities (shops, restaurants, services, etc.) from a single user account.',
          'Each activity constitutes a separate workspace with its own products, transactions, stock, and reports. The data of each activity is segregated and is not shared between different activities, unless explicitly chosen by the user.',
          'Billing is calculated per activity: the number of receipts issued and the features used are counted separately for each activity. The user may subscribe to different plans for each of their activities.',
        ],
      },
      {
        title: 'Article 8 - Suspension and Termination',
        content: [
          'The Provider reserves the right to temporarily or permanently suspend access to the Service in the event of:',
          'Violation of these Terms of Use or the General Terms of Sale; use of the Service for illegal or fraudulent purposes; non-payment of amounts due after formal notice that has remained without effect; behavior likely to undermine the security, integrity, or proper functioning of the Service.',
          'In the event of suspension, the user will be notified by email at the address associated with their account. The user may contest the suspension by submitting a substantiated complaint to direction@manoverde.com within a period of fifteen (15) days.',
          'The user may terminate their account at any time from their account settings or by sending a request to direction@manoverde.com.',
        ],
      },
      {
        title: 'Article 9 - Limitation of Liability',
        content: [
          'The Provider shall not be held liable for indirect, incidental, special, or consequential damages resulting from the use or inability to use the Service, including but not limited to: loss of profits, loss of data, business interruption, or loss of clientele.',
          'The total liability of the Provider to the user, regardless of cause, is limited to the total amount actually paid by the user during the twelve (12) months preceding the event giving rise to the claim.',
          'This limitation of liability applies to the maximum extent permitted by applicable law and survives even in the event of resolution or termination of the contract.',
        ],
      },
      {
        title: 'Article 10 - Modification of Terms',
        content: [
          'The Provider reserves the right to modify these Terms of Use at any time. Modifications will be notified to users by email and/or by a visible notification on the platform.',
          'Users have a period of thirty (30) days from the notification to review the new terms. Continued use of the Service after this period constitutes acceptance of the new terms.',
          'If the user does not accept the new terms, they may terminate their account before the expiration of the thirty-day period. In this case, the previous terms remain applicable until the effective date of termination.',
          'Substantial modifications affecting the user\'s rights or pricing will be the subject of specific and detailed communication.',
        ],
      },
      {
        title: 'Article 11 - Contact',
        content: [
          'For any questions, complaints, or requests relating to the Service or these Terms of Use, the user may contact the Provider by the following means:',
          'Email: direction@manoverde.com',
          'Postal address: Mano Verde SA, Douala, Cameroon.',
          'The Provider undertakes to acknowledge receipt of any request within forty-eight (48) business hours and to provide a detailed response within thirty (30) days.',
          'These Terms of Use are governed by Cameroonian law. Any dispute shall be submitted to the competent courts of Douala, Cameroon, after an attempt at amicable resolution.',
        ],
      },
    ],
  },
}
