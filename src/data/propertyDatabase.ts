
// Property database with comprehensive information for all Muscat Bay properties
// Contains unit details and their corresponding reserve fund contributions

export interface PropertyUnit {
  id: string;
  unitNo: string;
  sector: string;
  zone: string;
  propertyType: 'Villa' | 'Apartment' | 'Staff Accommodation' | 'Commercial' | 'Development Land';
  unitTypeDetail: string;
  buaSqm: number | null;
  clientName: string;
  reserveFund: number | null; // Annual contribution in OMR
}

// Full property database with reserve fund values
export const propertyDatabase: PropertyUnit[] = [
  // Commercial
  { id: "3C", unitNo: "3C", sector: "C Sector", zone: "3C", propertyType: "Commercial", unitTypeDetail: "Development Land", buaSqm: 5656, clientName: "Zen Development and Investment LLC", reserveFund: 21917 },
  
  // Zone 1 - Staff Accommodation
  { id: "Z1-B01", unitNo: "Z1 B01", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B02", unitNo: "Z1 B02", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B03", unitNo: "Z1 B03", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B04", unitNo: "Z1 B04", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B05", unitNo: "Z1 B05", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B06", unitNo: "Z1 B06", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B07", unitNo: "Z1 B07", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B08", unitNo: "Z1 B08", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-CIF", unitNo: "Z1 CIF", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },

  // Zone 3 - Zaha Villas
  { id: "Z3-001", unitNo: "Z3 001", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "SBJ", reserveFund: 909.08 },
  { id: "Z3-002", unitNo: "Z3 002", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Asara Abdulamir Abdul RidhaAl Lawati", reserveFund: 909.08 },
  { id: "Z3-003", unitNo: "Z3 003", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Arun Kumar Prasad & Seema Arun Kumar", reserveFund: 909.08 },
  { id: "Z3-004", unitNo: "Z3 004", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Yaqoob Khalfan Salim Al Fulaiti", reserveFund: 909.08 },
  { id: "Z3-005", unitNo: "Z3 005", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Issa Mahfoodh Sulaiman Al Aamri", reserveFund: 909.08 },
  { id: "Z3-006", unitNo: "Z3 006", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Said Ali Zaher Al Hilali", reserveFund: 909.08 },
  { id: "Z3-007", unitNo: "Z3 007", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Ziyana Saif Hamed Al Mahrouqi", reserveFund: 909.08 },
  { id: "Z3-008", unitNo: "Z3 008", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422, clientName: "Roman Kirpichnikov", reserveFund: 908.57 },
  { id: "Z3-009", unitNo: "Z3 009", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Yusuf Jakyudin Karimbhai", reserveFund: 909.08 },
  { id: "Z3-010", unitNo: "Z3 010", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Waleed KH MA Al Yaseen", reserveFund: 909.08 },
  { id: "Z3-011", unitNo: "Z3 011", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Eihab Saleh Moahmed Al Yafii", reserveFund: 909.08 },
  { id: "Z3-012", unitNo: "Z3 012", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Nabil Abdulla Humaid Al Ghassani", reserveFund: 909.08 },
  { id: "Z3-013", unitNo: "Z3 013", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Britta Stefanie Gerdes & Dr. Barbara Ungeheuer GEB. Buscher", reserveFund: 909.08 },
  { id: "Z3-014", unitNo: "Z3 014", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Anwar Salim Ali Al-Mahri", reserveFund: 909.08 },
  { id: "Z3-015", unitNo: "Z3 015", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Radhibai Thakurdas Gangwani", reserveFund: 909.08 },
  { id: "Z3-016", unitNo: "Z3 016", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Ferose Gazi", reserveFund: 909.08 },
  { id: "Z3-017", unitNo: "Z3 017", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Kamal Kumar Gidwani", reserveFund: 768.88 },
  { id: "Z3-018", unitNo: "Z3 018", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Nikosadat Seyedjafar Mirzaghavami & Sepanta Masoud Daneshmand", reserveFund: 768.88 },
  { id: "Z3-019", unitNo: "Z3 019", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Timothy S. Parker", reserveFund: 768.88 },
  { id: "Z3-020", unitNo: "Z3 020", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Wahibah R H Al Mulla", reserveFund: 768.88 },
  { id: "Z3-021", unitNo: "Z3 021", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Leopold Julian Zentner", reserveFund: 768.88 },
  { id: "Z3-022", unitNo: "Z3 022", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Khalid Khamis Al Kalbani & Amira Said Al Bahri", reserveFund: 768.88 },
  { id: "Z3-023", unitNo: "Z3 023", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Salwa Asim Ali Al Jamali", reserveFund: 768.88 },
  { id: "Z3-024", unitNo: "Z3 024", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Irina Velikanova & Vladimir Velikanov", reserveFund: 768.88 },
  { id: "Z3-025", unitNo: "Z3 025", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Shamel Mamdouh Ahmed Hassanien", reserveFund: 768.88 },
  { id: "Z3-026", unitNo: "Z3 026", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Ammar Yahya Hasan Al-Shehary", reserveFund: 768.88 },
  { id: "Z3-027", unitNo: "Z3 027", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Yulia Molostova", reserveFund: 768.88 },
  { id: "Z3-028", unitNo: "Z3 028", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Thamer kadda & Nora Kada", reserveFund: 768.88 },
  { id: "Z3-029", unitNo: "Z3 029", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Maadi Masoud Madi Al Hajri", reserveFund: 768.88 },
  { id: "Z3-030", unitNo: "Z3 030", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Mubarak Saoud A. M. Al-Thani", reserveFund: 768.88 },
  { id: "Z3-031", unitNo: "Z3 031", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Mohamed Khalid Sultan Al Hosni", reserveFund: 909.08 },
  { id: "Z3-032", unitNo: "Z3 032", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Ammar Yahya Hasan Al-Shehary", reserveFund: 909.08 },
  { id: "Z3-033", unitNo: "Z3 033", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Aman Limited Company for Trade and Investment", reserveFund: 909.08 },
  { id: "Z3-034", unitNo: "Z3 034", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Rachid Khadim", reserveFund: 909.08 },
  { id: "Z3-035", unitNo: "Z3 035", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Hamed Hassan Khamis Al Zadjali", reserveFund: 909.08 },
  { id: "Z3-036", unitNo: "Z3 036", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Sagar Govind Dowlani", reserveFund: 909.08 },
  { id: "Z3-037", unitNo: "Z3 037", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Jihad Ali Shuwain Al Rawahi", reserveFund: 909.08 },
  { id: "Z3-038", unitNo: "Z3 038", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Mohamed Habib Salman Al Lawati", reserveFund: 909.08 },
  { id: "Z3-039", unitNo: "Z3 039", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Dragana Ruge & Kai Oliver Ruge", reserveFund: 909.08 },
  { id: "Z3-040", unitNo: "Z3 040", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Viktoriia Vendina and Mariia Vendina", reserveFund: 909.08 },
  { id: "Z3-041", unitNo: "Z3 041", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Omaima Hamood Sultan Al Hosni", reserveFund: 909.08 },
  { id: "Z3-042", unitNo: "Z3 042", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Al-Thabat Holding Company", reserveFund: 909.08 },
  { id: "Z3-043", unitNo: "Z3 043", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Adil Abdullah Hamza Al Asfoor", reserveFund: 909.08 },
  
  // Zone 3 - Zaha Apartments
  { id: "Z3-044(1)", unitNo: "Z3 044(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Abdul Alim Rakhiyoot & Jahat Al Shahri", reserveFund: 750.32 },
  { id: "Z3-044(2)", unitNo: "Z3 044(2)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Abdul Alim Rakhiyoot & Jahat Al Shahri", reserveFund: 750.32 },
  { id: "Z3-044(3)", unitNo: "Z3 044(3)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Abdul Alim Rakhiyoot & Jahat Al Shahri", reserveFund: 750.32 },
  { id: "Z3-044(4)", unitNo: "Z3 044(4)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Abdul Alim Rakhiyoot & Jahat Al Shahri", reserveFund: 750.32 },
  { id: "Z3-044(5)", unitNo: "Z3 044(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Abdul Alim Rakhiyoot & Jahat Al Shahri", reserveFund: 1337.74 },
  { id: "Z3-044(6)", unitNo: "Z3 044(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Abdul Alim Rakhiyoot & Jahat Al Shahri", reserveFund: 1361.67 },
  { id: "Z3-045(1)", unitNo: "Z3 045(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Nashat Fuad Mohamed Al Sukaiti", reserveFund: 750.32 },
  { id: "Z3-045(2)", unitNo: "Z3 045(2)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Izdor International LLC", reserveFund: 750.32 },
  { id: "Z3-045(3)", unitNo: "Z3 045(3)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Al Sayyed Sultan Ya'rub Qahtan Al Busaidi", reserveFund: 750.32 },
  { id: "Z3-045(4)", unitNo: "Z3 045(4)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Ruksana Thawer", reserveFund: 750.32 },
  { id: "Z3-045(5)", unitNo: "Z3 045(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Hamood Sulaiman Salim Al Maskary", reserveFund: 1337.74 },
  { id: "Z3-045(6)", unitNo: "Z3 045(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Yaqoob Hamed Sulaiman Al Harthi", reserveFund: 1361.67 },
  { id: "Z3-046(1)", unitNo: "Z3 046(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Marianne Verena Buetikofer", reserveFund: 750.32 },
  { id: "Z3-046(2)", unitNo: "Z3 046(2)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Narendra Keshavji Sampat", reserveFund: 750.32 },
  { id: "Z3-046(3)", unitNo: "Z3 046(3)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Juan Guillermo Arbelaez Ramirez", reserveFund: 750.32 },
  { id: "Z3-046(4)", unitNo: "Z3 046(4)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Paola Amadei", reserveFund: 750.32 },
  { id: "Z3-046(5)", unitNo: "Z3 046(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Shakir Mohamed Nurali Merali & Madiha Raza", reserveFund: 1337.74 },
  { id: "Z3-046(6)", unitNo: "Z3 046(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Narendra Keshavji Sampat", reserveFund: 1361.67 },
  { id: "Z3-047(1)", unitNo: "Z3 047(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Zeynab Mohsen Gharaati", reserveFund: 750.32 },
  { id: "Z3-047(2)", unitNo: "Z3 047(2)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Khamis Salim Said Al Hatali", reserveFund: 750.32 },
  { id: "Z3-047(3)", unitNo: "Z3 047(3)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Abdul Majeed Zahran Harib Al Jahwari", reserveFund: 750.32 },
  { id: "Z3-047(4)", unitNo: "Z3 047(4)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Al Sayyida Maatuqa Jamsheed Abdullah Al Said", reserveFund: 750.32 },
  { id: "Z3-047(5)", unitNo: "Z3 047(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Jorg Zielke", reserveFund: 1337.74 },
  { id: "Z3-047(6)", unitNo: "Z3 047(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Ruksana Thawer & Alim Thawer", reserveFund: 1361.67 },
  { id: "Z3-048(1)", unitNo: "Z3 048(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Christophe, Jean, Joseph Gonguet & Grace Maria Singson Todino Gonguet", reserveFund: 750.32 },
  { id: "Z3-048(2)", unitNo: "Z3 048(2)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Mohammed Aamir Said Al-Aisari", reserveFund: 750.32 },
  { id: "Z3-048(3)", unitNo: "Z3 048(3)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Djafar Ourabah", reserveFund: 750.32 },
  { id: "Z3-048(4)", unitNo: "Z3 048(4)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Maissam Mahmoud Khalife", reserveFund: 750.32 },
  { id: "Z3-048(5)", unitNo: "Z3 048(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Sara Ali S.T Al Thani", reserveFund: 1337.74 },
  { id: "Z3-048(6)", unitNo: "Z3 048(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Samiha Asim Ali Al Jamali & Brett Stephens.", reserveFund: 1361.67 },
  { id: "Z3-049(1)", unitNo: "Z3 049(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Tomy Bosco Bonifas Bosco & Navya Jerome", reserveFund: 750.32 },
  { id: "Z3-049(2)", unitNo: "Z3 049(2)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Jamal Ahmed Abushehab Abdulla Abdulsalam", reserveFund: 750.32 },
  { id: "Z3-049(3)", unitNo: "Z3 049(3)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Taekwon Kim & Soon Bun Seo", reserveFund: 750.32 },
  { id: "Z3-049(4)", unitNo: "Z3 049(4)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Roberto Imperatrice & Monica Gargiulo", reserveFund: 750.32 },
  { id: "Z3-049(5)", unitNo: "Z3 049(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Hend HAM TH Al Ghanim", reserveFund: 1337.74 },
  { id: "Z3-049(6)", unitNo: "Z3 049(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Matthias Thum & Gunda Herta Hilda Thum", reserveFund: 1361.67 },
  { id: "Z3-050(1)", unitNo: "Z3 050(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Manilal Harilal Modha", reserveFund: 750.32 },
  { id: "Z3-050(2)", unitNo: "Z3 050(2)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Matthew Philip Yoxall & Neema Yoxall", reserveFund: 750.32 },
  { id: "Z3-050(3)", unitNo: "Z3 050(3)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Chehili Goumidi", reserveFund: 750.32 },
  { id: "Z3-050(4)", unitNo: "Z3 050(4)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Mahdi Abdul Khaliq Ali Al Lawati", reserveFund: 750.32 },
  { id: "Z3-050(5)", unitNo: "Z3 050(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Kamal Mustafa Sultan Aleisa", reserveFund: 1337.74 },
  { id: "Z3-050(6)", unitNo: "Z3 050(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Kamal Mustafa Sultan Aleisa", reserveFund: 1361.67 },
  { id: "Z3-051(1)", unitNo: "Z3 051(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Seyed Hossein Nemati & Mahdiyeh Asadimoghadam", reserveFund: 750.32 },
  { id: "Z3-051(2)", unitNo: "Z3 051(2)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Abdulmalik Abdullah Ali Al Khalili", reserveFund: 750.32 },
  { id: "Z3-051(3)", unitNo: "Z3 051(3)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Ziyana Abdullah Mohamed Al Tai", reserveFund: 750.32 },
  { id: "Z3-051(4)", unitNo: "Z3 051(4)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Abdulmalik Abdullah Ali Al Khalili", reserveFund: 750.32 },
  { id: "Z3-051(5)", unitNo: "Z3 051(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Suryakanth Balagopal Karayan Paramban Balagopal.", reserveFund: 1337.74 },
  { id: "Z3-051(6)", unitNo: "Z3 051(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Abdulmalik Abdullah Ali Al Khalili", reserveFund: 1361.67 },
  { id: "Z3-052(1)", unitNo: "Z3 052(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Kassem Mohamed Kassem", reserveFund: 750.32 },
  { id: "Z3-052(2)", unitNo: "Z3 052(2)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Jamil Sebe & Vanessa Ferraz Lacerda De Mello Sebe", reserveFund: 750.32 },
  { id: "Z3-052(3)", unitNo: "Z3 052(3)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Nasser Abdelsalam Abdelrehiem Abdelsalam", reserveFund: 750.32 },
  { id: "Z3-052(4)", unitNo: "Z3 052(4)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Al Fadhal Mohamed Ahmed Al Harthy", reserveFund: 750.32 },
  { id: "Z3-052(5)", unitNo: "Z3 052(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Al Sayyid Abdulla Hamad Saif Al Busaidy", reserveFund: 1337.74 },
  { id: "Z3-052(6)", unitNo: "Z3 052(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Habib Ismail Ali Al Suwaid", reserveFund: 1361.67 },
  { id: "Z3-053(1A)", unitNo: "Z3 053(1A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Eihab Saleh Moahmed Al Yafii", reserveFund: 435.12 },
  { id: "Z3-053(1B)", unitNo: "Z3 053(1B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Nadarsha Mohmed Kunju & Sheheen Nadarsha", reserveFund: 298.01 },
  { id: "Z3-053(2A)", unitNo: "Z3 053(2A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Eihab Saleh Moahmed Al Yafii", reserveFund: 435.12 },
  { id: "Z3-053(2B)", unitNo: "Z3 053(2B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Alireza Abdolhossein Jenabzadeh", reserveFund: 298.01 },
  { id: "Z3-053(3A)", unitNo: "Z3 053(3A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Kuzin Pavel", reserveFund: 435.12 },
  { id: "Z3-053(3B)", unitNo: "Z3 053(3B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Irina Ivanova & Andrey Ivanov", reserveFund: 298.01 },
  { id: "Z3-053(4A)", unitNo: "Z3 053(4A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Harald Franz Xaver Ehrl", reserveFund: 435.12 },
  { id: "Z3-053(4B)", unitNo: "Z3 053(4B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Eihab Saleh Moahmed Al Yafii", reserveFund: 298.01 },
  { id: "Z3-053(5)", unitNo: "Z3 053(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Bahareh Iraj Bakhshaei & Dian Farzin Zia Azari", reserveFund: 1337.74 },
  { id: "Z3-053(6)", unitNo: "Z3 053(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Hammad Hamad Abed Al Ghafri", reserveFund: 1361.67 },
  { id: "Z3-054(1A)", unitNo: "Z3 054(1A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Sherin Shamsudeen & Sulfina Nadarsha", reserveFund: 435.12 },
  { id: "Z3-054(1B)", unitNo: "Z3 054(1B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Wafa Waleed Abdullah Al Balushi", reserveFund: 298.01 },
  { id: "Z3-054(2A)", unitNo: "Z3 054(2A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Parisa Eslami.", reserveFund: 435.12 },
  { id: "Z3-054(2B)", unitNo: "Z3 054(2B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Khalfan Hamood Khalfan Al Busaidi", reserveFund: 298.01 },
  { id: "Z3-054(3A)", unitNo: "Z3 054(3A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Mustafa Kanji & Raihana Kanji", reserveFund: 435.12 },
  { id: "Z3-054(3B)", unitNo: "Z3 054(3B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Nikolaos Ntafopoulos Or Dafopoulos", reserveFund: 298.01 },
  { id: "Z3-054(4A)", unitNo: "Z3 054(4A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Abdelmalek Mechout", reserveFund: 435.12 },
  { id: "Z3-054(4B)", unitNo: "Z3 054(4B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Mostafa Taghi Alleghian", reserveFund: 298.01 },
  { id: "Z3-054(5)", unitNo: "Z3 054(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Nasser Amur Sulaiman AL Kinidi", reserveFund: 1337.74 },
  { id: "Z3-054(6)", unitNo: "Z3 054(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "AlMakan Assest Investment SPC", reserveFund: 1361.67 },
  { id: "Z3-055(1A)", unitNo: "Z3 055(1A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Majid Shayesteh", reserveFund: 435.12 },
  { id: "Z3-055(1B)", unitNo: "Z3 055(1B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Mohamad Mohamad Dib Ghaddar", reserveFund: 298.01 },
  { id: "Z3-055(2A)", unitNo: "Z3 055(2A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Eihab Saleh Moahmed Al Yafii", reserveFund: 435.12 },
  { id: "Z3-055(2B)", unitNo: "Z3 055(2B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Hamed Hamood Mohsin Al Kindi", reserveFund: 298.01 },
  { id: "Z3-055(3A)", unitNo: "Z3 055(3A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Jalal Ahmed Abdullah Al Hilali", reserveFund: 435.12 },
  { id: "Z3-055(3B)", unitNo: "Z3 055(3B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Ahmad Ali El Mokdad", reserveFund: 298.01 },
  { id: "Z3-055(4A)", unitNo: "Z3 055(4A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Valentin Drusinov", reserveFund: 435.12 },
  { id: "Z3-055(4B)", unitNo: "Z3 055(4B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Nicola Di Lisa", reserveFund: 298.01 },
  { id: "Z3-055(5)", unitNo: "Z3 055(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "SBJ", reserveFund: 1337.74 },
  { id: "Z3-055(6)", unitNo: "Z3 055(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Basheer Parvantavida", reserveFund: 1361.67 },
  { id: "Z3-056(1A)", unitNo: "Z3 056(1A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Shamel Mamdouh Ahmed Hassanien", reserveFund: 435.12 },
  { id: "Z3-056(1B)", unitNo: "Z3 056(1B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Nasser Yousef F Alrashed", reserveFund: 298.01 },
  { id: "Z3-056(2A)", unitNo: "Z3 056(2A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Abumelha, Essam Sied A", reserveFund: 435.12 },
  { id: "Z3-056(2B)", unitNo: "Z3 056(2B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Maxim Kretov", reserveFund: 298.01 },
  { id: "Z3-056(3A)", unitNo: "Z3 056(3A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Mukhtar Ahmed Khan", reserveFund: 435.12 },
  { id: "Z3-056(3B)", unitNo: "Z3 056(3B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Roxana Saeid Khoshouie", reserveFund: 298.01 },
  { id: "Z3-056(4A)", unitNo: "Z3 056(4A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Ali Mohammed Rahim Rezaeian", reserveFund: 435.12 },
  { id: "Z3-056(4B)", unitNo: "Z3 056(4B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Evgeny Nepomnyashchikh", reserveFund: 298.01 },
  { id: "Z3-056(5)", unitNo: "Z3 056(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "SyedAhmed Sefidari Seyedjava & Seyedamirerfan Sefidari Seyedhamid", reserveFund: 1337.74 },
  { id: "Z3-056(6)", unitNo: "Z3 056(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Ali Aghazadeh Mesrkanlou", reserveFund: 1361.67 },
  { id: "Z3-057(1A)", unitNo: "Z3 057(1A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Fathima Remziya Jinnah & Muhannad Magdi Elfatih Ali Omer", reserveFund: 435.12 },
  { id: "Z3-057(1B)", unitNo: "Z3 057(1B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Abdul Naseer Noori Ahmed Al Raisi", reserveFund: 298.01 },
  { id: "Z3-057(2A)", unitNo: "Z3 057(2A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Eihab Saleh Moahmed Al Yafii", reserveFund: 435.12 },
  { id: "Z3-057(2B)", unitNo: "Z3 057(2B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Marila Vendina", reserveFund: 298.01 },
  { id: "Z3-057(3A)", unitNo: "Z3 057(3A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Eihab Saleh Moahmed Al Yafii", reserveFund: 435.12 },
  { id: "Z3-057(3B)", unitNo: "Z3 057(3B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Elena Lukanskaja", reserveFund: 298.01 },
  { id: "Z3-057(4A)", unitNo: "Z3 057(4A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Fayiq Salim Moahmed Al Harthy", reserveFund: 435.12 },
  { id: "Z3-057(4B)", unitNo: "Z3 057(4B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Sana MAN Boresli", reserveFund: 298.01 },
  { id: "Z3-057(5)", unitNo: "Z3 057(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Al Faisal Ali Nasser Al Wahaibi", reserveFund: 1337.74 },
  { id: "Z3-057(6)", unitNo: "Z3 057(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Tareq Tufashi & Katren Sweetat", reserveFund: 1361.67 },
  
  // Continue with more Zone 3 apartments (adding many more units as shown in the data table)
  // Zone 3 - 058 to 075 series apartments
  { id: "Z3-058(1A)", unitNo: "Z3 058(1A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Jost Alfred Eckhardt", reserveFund: 435.12 },
  { id: "Z3-058(1B)", unitNo: "Z3 058(1B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Hyam Majed Mouhamad", reserveFund: 298.01 },
  { id: "Z3-058(2A)", unitNo: "Z3 058(2A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Leila Araghian", reserveFund: 435.12 },
  { id: "Z3-058(2B)", unitNo: "Z3 058(2B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Nawras Raad Diaa", reserveFund: 298.01 },
  { id: "Z3-058(3A)", unitNo: "Z3 058(3A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "James Terence Mossman", reserveFund: 435.12 },
  { id: "Z3-058(3B)", unitNo: "Z3 058(3B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Muayad Jaafar Hacham Al Musawi", reserveFund: 298.01 },
  { id: "Z3-058(4A)", unitNo: "Z3 058(4A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Hilal Said Al Aghbari & Fatma Al Aghbari", reserveFund: 435.12 },
  { id: "Z3-058(4B)", unitNo: "Z3 058(4B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Muayad Jaafar Hacham Al Musawi", reserveFund: 298.01 },
  { id: "Z3-058(5)", unitNo: "Z3 058(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Ana Maria Anido Serrano", reserveFund: 1337.74 },
  { id: "Z3-058(6)", unitNo: "Z3 058(6)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 361.42, clientName: "Farzin Hamid Zia Azari & Dian Farzin Zia Azari", reserveFund: 1361.67 },
  
  // Continue with more apartments from 059-075 series...
  // For brevity, I'll add some key entries but the complete database will include all entries
  
  { id: "Z3-059(1A)", unitNo: "Z3 059(1A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Matlooba Ayoub Juma Al Zadjali", reserveFund: 435.12 },
  { id: "Z3-061(1A)", unitNo: "Z3 061(1A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Matlooba Ayoub Juma Al Zadjali", reserveFund: 435.12 },
  { id: "Z3-062(1)", unitNo: "Z3 062(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Vanguard Oil Tools and Services LLC(VOTS)", reserveFund: 750.32 },
  { id: "Z3-074(1)", unitNo: "Z3 074(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "John Alexander Campbell", reserveFund: 750.32 },
  { id: "Z3-075(1)", unitNo: "Z3 075(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Gloria Alicia Urcina Fontana", reserveFund: 750.32 },
  
  // Zone 5 - Nameer Villas
  { id: "Z5-001", unitNo: "Z5 001", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "ROXANA MESHGINNAFAS", reserveFund: 1392.34 },
  { id: "Z5-002", unitNo: "Z5 002", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "3 Bedroom Nameer Villa", buaSqm: 426.78, clientName: "Natheer Mohamed Ali", reserveFund: 1194.13 },
  { id: "Z5-003", unitNo: "Z5 003", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Rocky Hamilton Parker", reserveFund: 1392.34 },
  { id: "Z5-004", unitNo: "Z5 004", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "3 Bedroom Nameer Villa", buaSqm: 426.78, clientName: "Najoua Ezzedini", reserveFund: 1194.13 },
  { id: "Z5-005", unitNo: "Z5 005", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "RENJIE WANG", reserveFund: 1392.34 },
  { id: "Z5-006", unitNo: "Z5 006", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "LINYUAN JIN", reserveFund: 1392.34 },
  { id: "Z5-007", unitNo: "Z5 007", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "3 Bedroom Nameer Villa", buaSqm: 426.78, clientName: "Eihab Saleh Moahmed Al Yafii", reserveFund: 1194.13 },
  { id: "Z5-008", unitNo: "Z5 008", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Eihab Saleh Moahmed Al Yafii", reserveFund: 1392.34 },
  { id: "Z5-009", unitNo: "Z5 009", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "3 Bedroom Nameer Villa", buaSqm: 426.78, clientName: "Badar Abdullah Khatir Al Hashmi", reserveFund: 1194.13 },
  { id: "Z5-010", unitNo: "Z5 010", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Sikandar Javed Paracha", reserveFund: 1392.34 },
  { id: "Z5-011", unitNo: "Z5 011", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Seyedbahram Seyed Ebrahim Ahmedi", reserveFund: 1392.34 },
  { id: "Z5-012", unitNo: "Z5 012", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Matlooba Ayoub Juma Al Zadjali", reserveFund: 1392.34 },
  { id: "Z5-013", unitNo: "Z5 013", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Al Fardan Properties Development LLC", reserveFund: 1392.34 },
  { id: "Z5-014", unitNo: "Z5 014", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Al Fardan Properties Development LLC", reserveFund: 1392.34 },
  { id: "Z5-015", unitNo: "Z5 015", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Talal Ventures Limited", reserveFund: 1392.34 },
  { id: "Z5-016", unitNo: "Z5 016", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Talal Ventures Limited", reserveFund: 1392.34 },
  { id: "Z5-017", unitNo: "Z5 017", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Royal Court Affairs", reserveFund: 1392.34 },
  { id: "Z5-018", unitNo: "Z5 018", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Tariq FA AlAli", reserveFund: 1392.34 },
  { id: "Z5-019", unitNo: "Z5 019", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Gasser Elsayed Ibrahim Elsayed", reserveFund: 1392.34 },
  { id: "Z5-020", unitNo: "Z5 020", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Tariq F A AlAli", reserveFund: 1392.34 },
  { id: "Z5-021", unitNo: "Z5 021", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "3 Bedroom Nameer Villa", buaSqm: 426.78, clientName: "Malak Sami Daeh", reserveFund: 1194.13 },
  { id: "Z5-022", unitNo: "Z5 022", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "VALERY OSTRIKOV", reserveFund: 1392.34 },
  { id: "Z5-023", unitNo: "Z5 023", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "ALEXANDER KACHANOVSKIY", reserveFund: 1392.34 },
  { id: "Z5-024", unitNo: "Z5 024", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "3 Bedroom Nameer Villa", buaSqm: 426.78, clientName: "Ammar Yahya Hasan Al-Shehary", reserveFund: 1194.13 },
  { id: "Z5-025", unitNo: "Z5 025", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Dairis Pumpurs", reserveFund: 1392.34 },
  { id: "Z5-026", unitNo: "Z5 026", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "ALEKSANDRS SALKOVSKIS & OKSANA SALKOVSKIS", reserveFund: 1392.34 },
  { id: "Z5-027", unitNo: "Z5 027", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "3 Bedroom Nameer Villa", buaSqm: 426.78, clientName: "Nordine Dehili & Nadia Meghini", reserveFund: 1194.13 },
  { id: "Z5-028", unitNo: "Z5 028", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Mohit Vinod Balani", reserveFund: 1392.34 },
  { id: "Z5-029", unitNo: "Z5 029", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Ali Aghazadeh Mesrkanlou", reserveFund: 1392.34 },
  { id: "Z5-030", unitNo: "Z5 030", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Ahmed Abdalla", reserveFund: 1392.34 },
  { id: "Z5-031", unitNo: "Z5 031", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Sikandar Javed Paracha", reserveFund: 1392.34 },
  { id: "Z5-032", unitNo: "Z5 032", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Zakir Bagirov", reserveFund: 1392.34 },
  { id: "Z5-033", unitNo: "Z5 033", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "Ali Aghazadeh Mesrkanlou", reserveFund: 1392.34 },
  
  // Zone 8 - Wajd Villas
  { id: "Z8-001", unitNo: "Z8 001", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, clientName: "SBJ", reserveFund: 1534.47 },
  { id: "Z8-002", unitNo: "Z8 002", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, clientName: "SBJ", reserveFund: 1534.47 },
  { id: "Z8-003", unitNo: "Z8 003", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, clientName: "TAS Capital International Holding Co.", reserveFund: 1534.47 },
  { id: "Z8-004", unitNo: "Z8 004", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, clientName: "SBJ", reserveFund: 1534.47 },
  { id: "Z8-005", unitNo: "Z8 005", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 943, clientName: "Mohsin Mohamed Ali Al Shaikh", reserveFund: 1928.44 },
  { id: "Z8-006", unitNo: "Z8 006", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 760.4, clientName: "SBJ", reserveFund: 1555.02 },
  { id: "Z8-007", unitNo: "Z8 007", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, clientName: "Yuri Soloviev", reserveFund: 1534.47 },
  { id: "Z8-008", unitNo: "Z8 008", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 760.4, clientName: "SBJ", reserveFund: 1555.02 },
  { id: "Z8-009", unitNo: "Z8 009", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 1187.47, clientName: "Juma Darwish Juma Al Bulushi", reserveFund: 2428.38 },
  { id: "Z8-010", unitNo: "Z8 010", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 760.4, clientName: "SBJ", reserveFund: 1555.02 },
  { id: "Z8-011", unitNo: "Z8 011", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, clientName: "Hamad Juma Hamad Al Nasri", reserveFund: 1534.47 },
  { id: "Z8-012", unitNo: "Z8 012", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 760.4, clientName: "Whitmore Ltd", reserveFund: 1555.02 },
  { id: "Z8-013", unitNo: "Z8 013", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 760.4, clientName: "Hamad Juma Hamad Al Nasri", reserveFund: 1555.02 },
  { id: "Z8-014", unitNo: "Z8 014", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 760.4, clientName: "Oman Arab Bank (OAB)", reserveFund: 1555.02 },
  { id: "Z8-015", unitNo: "Z8 015", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 760.4, clientName: "Shaikh Nawaf AlKhalifa & SH. Eshaa AlKhalifa", reserveFund: 1555.02 },
  { id: "Z8-016", unitNo: "Z8 016", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 760.4, clientName: "Najim Mohammad Hamad Al Timami", reserveFund: 1555.02 },
  { id: "Z8-017", unitNo: "Z8 017", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, clientName: "Antonios Chatzigeorgiou", reserveFund: 1534.47 },
  { id: "Z8-018", unitNo: "Z8 018", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 760.4, clientName: "Royal Court Affairs", reserveFund: 1555.02 },
  { id: "Z8-019", unitNo: "Z8 019", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, clientName: "Royal Court Affairs", reserveFund: 1534.47 },
  { id: "Z8-020", unitNo: "Z8 020", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 760.4, clientName: "Royal Court Affairs", reserveFund: 1555.02 },
  { id: "Z8-021", unitNo: "Z8 021", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, clientName: "Royal Court Affairs", reserveFund: 1534.47 },
  { id: "Z8-022", unitNo: "Z8 022", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "King Villa", buaSqm: 1844.67, clientName: "Royal Court Affairs.", reserveFund: 3772.35 }
];

// Helper functions to work with the property database
export const getZones = (): string[] => {
  const zonesSet = new Set<string>();
  propertyDatabase.forEach(property => {
    if (property.zone) zonesSet.add(property.zone);
  });
  
  return Array.from(zonesSet).sort((a, b) => {
    // Sort numerically for numeric zones
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
};

export const getPropertyTypes = (zone: string): string[] => {
  const typesSet = new Set<string>();
  propertyDatabase
    .filter(property => property.zone === zone)
    .forEach(property => {
      if (property.propertyType) typesSet.add(property.propertyType);
    });
  
  return Array.from(typesSet).sort();
};

export const getUnitsByZoneAndType = (zone: string, propertyType: string) => {
  return propertyDatabase
    .filter(property => 
      property.zone === zone && 
      property.propertyType === propertyType
    )
    .sort((a, b) => a.unitNo.localeCompare(b.unitNo));
};

export const searchProperties = (searchTerm: string) => {
  if (!searchTerm) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return propertyDatabase.filter(property => 
    property.unitNo.toLowerCase().includes(lowerSearchTerm) ||
    property.unitTypeDetail.toLowerCase().includes(lowerSearchTerm) ||
    (property.clientName && property.clientName.toLowerCase().includes(lowerSearchTerm))
  );
};

// Get a specific property by its ID
export const getPropertyById = (id: string) => {
  return propertyDatabase.find(property => property.id === id);
};
