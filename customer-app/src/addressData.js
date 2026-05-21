// Andhra Pradesh address hierarchy
// State is fixed. Districts + Mandals are static.
// Villages are fetched live from India Post API when a mandal is selected.

export const STATE_NAME = 'Andhra Pradesh';

export const DISTRICTS = [
  'Anantapur', 'Bapatla', 'Chittoor', 'East Godavari', 'Eluru',
  'Guntur', 'Kadapa', 'Kakinada', 'Konaseema', 'Krishna',
  'Kurnool', 'Nandyal', 'Nellore', 'NTR', 'Palnadu',
  'Parvathipuram Manyam', 'Prakasam', 'Sri Sathya Sai', 'Srikakulam',
  'Tirupati', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa',
];

export const MANDALS_BY_DISTRICT = {

  'Anantapur': [
    'Agali', 'Amadagur', 'Amarapuram', 'Atmakur', 'Bathalapalle',
    'Beluguppa', 'Bommireddy', 'Brahmasamudram', 'Buchayyapalle',
    'Bukkapatnam', 'C.K. Palle', 'Chilamathur', 'Chilleru', 'D. Hirehal',
    'Dharmavaram', 'Gooty', 'Gummagatta', 'Guntakal', 'Gurujala',
    'Hindupur', 'Kanekal', 'Kanaganapalle', 'Kalyandurg', 'Kudair',
    'Kothacheruvu', 'Kundurpi', 'Lepakshi', 'Madakasira', 'Mudigubba',
    'Nallamada', 'Narpala', 'Nellutla', 'O.D. Cheruvu', 'Obuladevaracheruvu',
    'Pamidi', 'Parigi', 'Peddavadugur', 'Penukonda', 'Putlur',
    'Ramagiri', 'Rapthadu', 'Rayadurgam', 'Roddam', 'Settur',
    'Singanamala', 'Somandepalle', 'T. Sundupalle', 'Tadpatri', 'Tadimarri',
    'Talupula', 'Thanakallu', 'Uravakonda', 'Vidapanakal', 'Yadiki', 'Yellanur',
  ],

  'Bapatla': [
    'Addanki', 'Bapatla', 'Cherukupalle', 'Chirala', 'Inkollu',
    'Karamchedu', 'Karlapalem', 'Nagaram', 'Nizampatnam', 'Parchur',
    'Repalle', 'Santhanuthalapadu', 'Singarayakonda', 'Tinguturu', 'Vemuru',
  ],

  'Chittoor': [
    'Bangarupalem', 'Baireddipalle', 'Chittoor', 'Chowdepalle',
    'Gangadhara Nellore', 'Gudipala', 'Gudur', 'Irala', 'Kalakada',
    'Kambhamvaripalle', 'Kauppam', 'Kuppam', 'Madanapalle', 'Nagari',
    'Pakala', 'Palasamudram', 'Palamaner', 'Peddamandyam', 'Penumuru',
    'Punganur', 'Putalapattu', 'Ramakuppam', 'Ramasamudram', 'Rojipeta',
    'Santhipuram', 'Thamballapalle', 'Valmikipuram', 'Vedurukuppam',
    'Venkatagirikota', 'Vijayapuram',
  ],

  'East Godavari': [
    'Alamuru', 'Ainavilli', 'Allavaram', 'Ambajipeta', 'Atreyapuram',
    'Biccavolu', 'Draksharamam', 'Gannavaram', 'Gokavaram', 'I. Polavaram',
    'Jaggampeta', 'Kajuluru', 'Kothapeta', 'Mandapeta', 'Malikipuram',
    'Mamidikuduru', 'Nidadavole', 'Pamarru', 'Peddapuram', 'Prathipadu',
    'Rajahmundry Rural', 'Rajahmundry Urban', 'Ramachandrapuram',
    'Rangampeta', 'Rajanagaram', 'Ravulapalem', 'Razole', 'Sakhinetipalle',
    'Samalkot', 'Tallarevu', 'Thondangi', 'U. Kothapalli', 'Yeleswaram',
  ],

  'Eluru': [
    'Bhimadole', 'Buttayagudem', 'Chintalapudi', 'Chintalpudi', 'Denduluru',
    'Dwaraka Tirumala', 'Eluru', 'Ganapavaram', 'Gopalapuram', 'Kaikaluru',
    'Kamavarapukota', 'Kovvur', 'Lingapalem', 'Narsapur', 'Nidadavole',
    'Nuzvid', 'Palakollu', 'Penugonda', 'Polavaram', 'T. Narasapuram',
    'Tanuku', 'Unguturu', 'Undi', 'Velerupadu',
  ],

  'Guntur': [
    'Amaravathi', 'Amruthalur', 'Bellamkonda', 'Bhattiprolu', 'Chebrolu',
    'Chilakaluripet', 'Dachepalle', 'Duggirala', 'Edlapadu', 'Guntur',
    'Ipur', 'Kallur', 'Kollipara', 'Krosuru', 'Macherla',
    'Mangalagiri', 'Medikonduru', 'Nadendla', 'Narasaraopet', 'Nizampatnam',
    'Pedakakani', 'Pedanandipadu', 'Phirangipuram', 'Piduguralla', 'Ponnekallu',
    'Prathipadu', 'Repalle', 'Rompicherla', 'Sattenapalle', 'Tadepalle',
    'Tadikonda', 'Tenali', 'Tsunduru', 'Vatticherukuru', 'Vinukonda',
  ],

  'Kadapa': [
    'Badvel', 'Brahmamgarimatam', 'Chapadu', 'Chennur', 'Duvvur',
    'Galiveedu', 'Gopavaram', 'Jammalamadugu', 'Kadapa', 'Kalasapadu',
    'Kamalapuram', 'Khajipet', 'Kodur', 'Kondapuram', 'Lakkireddipalle',
    'Lingala', 'Mydukur', 'Obulavaripalle', 'Pendlimarri', 'Proddatur',
    'Pulivendula', 'Rajampet', 'Ramapuram', 'Rayachoti', 'Sambepalle',
    'Sidhout', 'Thondur', 'Vallur', 'Veeraballe', 'Vemula',
  ],

  'Kakinada': [
    'Gollaprolu', 'Jagannadhapuram', 'Kajuluru', 'Kakinada Rural',
    'Kakinada Urban', 'Karapa', 'Kirlampudi', 'Malkipuram', 'Peddapuram',
    'Prathipadu', 'Rowthulapudi', 'Sambhara', 'Samalkot', 'Thondangi',
    'U. Kothapalli', 'Yeleswaram',
  ],

  'Konaseema': [
    'Amalapuram', 'Allavaram', 'Ainavilli', 'Katrenikona', 'Malikipuram',
    'Mamidikuduru', 'Mandapeta', 'Mummidivaram', 'P. Gannavaram',
    'Pithapuram', 'Ravulapalem', 'Razole', 'Sakhinetipalle', 'Uppalaguptam',
  ],

  'Krishna': [
    'Agiripalli', 'Bantumilli', 'Bapulapadu', 'Chandarlapadu', 'Chatrai',
    'G. Konduru', 'Ghantasala', 'Gudivada', 'Gudlavalleru', 'Ibrahimpatnam',
    'Jaggaiahpet', 'Kaikaluru', 'Kankipadu', 'Koduru', 'Machilipatnam',
    'Mopidevi', 'Mudinepalli', 'Musunuru', 'Nagayalanka', 'Nandigama',
    'Nandivada', 'Nuzvid', 'Pamarru', 'Pedaparupudi', 'Pedana',
    'Penamaluru', 'Tiruvuru', 'Thotlavalluru', 'Unguturu', 'Veerullapadu',
    'Vijayawada Rural', 'Vuyyuru',
  ],

  'Kurnool': [
    'Adoni', 'Alur', 'Aspari', 'Atmakur', 'Bandi Atmakur', 'Chagalamarri',
    'Devanakonda', 'Dhone', 'Gudur', 'Halaharvi', 'Holagunda',
    'Kallur', 'Kodumur', 'Kothapalle', 'Kurnool', 'Maddikera',
    'Mantralayam', 'Midthur', 'Nandavaram', 'Noonepalle', 'Orvakal',
    'Pattikonda', 'Peddakadimirlanka', 'Peruvancha', 'Srisailam',
    'Tuggali', 'Ulindakonda', 'Veldurthi', 'Velgode', 'Yemmiganur',
  ],

  'Nandyal': [
    'Allagadda', 'Atmakur', 'Banaganapalle', 'Bethamcherla', 'Chagalamarri',
    'Dhone', 'Gospadu', 'Mahanandi', 'Nandyal', 'Nandyal Rural',
    'Nandikotkur', 'Nandyal Urban', 'Pagidyala', 'Panyam', 'Peapally',
    'Rudravaram', 'Sanjanmala', 'Srisailam', 'Uyyalawada',
  ],

  'Nellore': [
    'Allur', 'Atmakur', 'Bogole', 'Buchireddipalem', 'Chejerla',
    'Chillakur', 'Dakkili', 'Duttaluru', 'Gudur', 'Indukurpet',
    'Jaladanki', 'Kaluvaya', 'Kavali', 'Kota', 'Kovur',
    'Manubolu', 'Mypadu', 'Naidupeta', 'Nellore', 'Ojili',
    'Pellakur', 'Podalakur', 'Rapur', 'Sangam', 'Sarvepalli',
    'Sydapuram', 'Tada', 'Tangutur', 'Udayagiri', 'Venkatachalam',
    'Vidavalur', 'Vinjamuru',
  ],

  'NTR': [
    'Bapulapadu', 'Gampalagudem', 'Gannavaram', 'Ibrahimpatnam', 'Jaggaiahpet',
    'Mylavaram', 'Nandigama', 'Penamaluru', 'Tiruvuru', 'Thotlavalluru',
    'Vijayawada East', 'Vijayawada West', 'Vuyyuru',
  ],

  'Palnadu': [
    'Amaravathi', 'Atchampeta', 'Bellamkonda', 'Bollapalle', 'Chilakaluripet',
    'Dachepalle', 'Durgi', 'Ganapavaram', 'Gurazala', 'Karempudi',
    'Macherla', 'Midjil', 'Narasaraopet', 'Nakarikallu', 'Piduguralla',
    'Rompicherla', 'Sattenapalle',
  ],

  'Parvathipuram Manyam': [
    'Bhamini', 'Garugubilli', 'Kurupam', 'Manyam', 'Parvathipuram',
    'Salur', 'Seethampeta',
  ],

  'Prakasam': [
    'Addanki', 'Ardhaveedu', 'Ballikurava', 'Bestavaripeta', 'Chandrasekharapuram',
    'Chimakurthi', 'Chirala', 'Cumbum', 'Darsi', 'Donakonda',
    'Dornala', 'Enumula', 'Giddaluru', 'Inkollu', 'Janakivaram',
    'Kandukur', 'Kanigiri', 'Karamchedu', 'Karampudi', 'Komarolu',
    'Kondapi', 'Kothapatnam', 'Kurichedu', 'Lingasamudram', 'Maddipadu',
    'Markapur', 'Martur', 'Muppala', 'Naguluppalpadu', 'Ongole',
    'Pamur', 'Parchur', 'Pedanandipadu', 'Podili', 'Pullalacheruvu',
    'Racherla', 'Ramavaram', 'Santhanuthalapadu', 'Singarayakonda', 'Tanguturu',
    'Thallur', 'Tripuranthakam', 'Ulavapadu', 'Vetapalem', 'Vinjamuru',
    'Yeddanapudi', 'Zarugumilli',
  ],

  'Sri Sathya Sai': [
    'Agali', 'Amarapuram', 'Beluguppa', 'Bommireddy', 'Bukkapatnam',
    'Dharmavaram', 'Garladinne', 'Gorantla', 'Gudibanda', 'Hindupur',
    'Kadiri', 'Kalyanadurgam', 'Kanaganapalle', 'Kothacheruvu', 'Lepakshi',
    'Madakasira', 'Nallamada', 'Narpala', 'Obuladevaracheruvu', 'Parigi',
    'Puttaparthi', 'Ramagiri', 'Roddam', 'Settur', 'Sodam',
    'Somandepalle', 'Tadimarri', 'Talupula', 'Uravakonda', 'Vidapanakal',
    'Yadiki',
  ],

  'Srikakulam': [
    'Amadalavalasa', 'Etcherla', 'G. Sigadam', 'Gara', 'Hiramandalam',
    'Jalumuru', 'Kanchili', 'Kaviti', 'Kotabommali', 'Kothuru',
    'L.N. Peta', 'Laveru', 'Mandasa', 'Meliaputti', 'Narasannapeta',
    'Palakonda', 'Pathapatnam', 'Polaki', 'R. Amadalavalasa', 'Rajam',
    'Ranastalam', 'Sarubujjili', 'Saravakota', 'Sompeta', 'Srikakulam',
    'Vajrapukotturu', 'Vangara',
  ],

  'Tirupati': [
    'Buchireddipalem', 'Chandragiri', 'Gudur', 'Kalahasti', 'Karvetnagar',
    'Naidupet', 'Nagari', 'Pakala', 'Puttur', 'Ramachandrapuram',
    'Renigunta', 'Satyavedu', 'Srikalahasti', 'Sullurpeta', 'Tirupati',
    'Tirupati Rural', 'Tondamanadu', 'Venkatagirikota', 'Yerpedu',
  ],

  'Visakhapatnam': [
    'Atchutapuram', 'Bheemunipatnam', 'Bhimili', 'Butchayyapeta', 'Chintapalli',
    'Devarapalle', 'Dumbriguda', 'G. Madugula', 'Golugonda', 'Hukumpeta',
    'K.D. Peta', 'Koyyuru', 'Makavarapalem', 'Munagapaka', 'Nathavaram',
    'Narsipatnam', 'Padmanabham', 'Paravada', 'Pedagantyada', 'Pendurthi',
    'Rambilli', 'S. Rayavaram', 'Sabbavaram', 'Thimmapuram', 'Visakhapatnam',
  ],

  'Vizianagaram': [
    'Badangi', 'Bobbili', 'Cheepurupalli', 'Dattirajeru', 'Denkada',
    'Gajapathinagaram', 'Gantyada', 'Gurla', 'Jami', 'Komarada',
    'Kothavalasa', 'Lakkavarapukota', 'Merakamudidam', 'Mentada',
    'Munchingput', 'Nellimarla', 'Pachipenta', 'Pusapatirega',
    'Ramabhadrapuram', 'Srungavarapukota', 'Therlam', 'Vepada', 'Vizianagaram',
  ],

  'West Godavari': [
    'Akiveedu', 'Attili', 'Bhimavaram', 'Chintalapudi', 'Chintalpudi',
    'Ganapavaram', 'Jangareddygudem', 'Kovvur', 'Lakkavaram', 'Narasapuram',
    'Nidadavole', 'Narsapur', 'Palakollu', 'Palakurthi', 'Peravali',
    'Poduru', 'Tadepalligudem', 'Tanuku', 'Thadikalapudi', 'Unguturu',
  ],

  'YSR Kadapa': [
    'Badvel', 'Brahmamgarimatam', 'Chapadu', 'Chennur', 'Duvvur',
    'Galiveedu', 'Gopavaram', 'Jammalamadugu', 'Kadapa', 'Kalasapadu',
    'Kamalapuram', 'Khajipet', 'Kodur', 'Kondapuram', 'Lakkireddipalle',
    'Lingala', 'Mydukur', 'Obulavaripalle', 'Pendlimarri', 'Proddatur',
    'Pulivendula', 'Rajampet', 'Ramapuram', 'Rayachoti', 'Sambepalle',
    'Sidhout', 'Thondur', 'Vallur', 'Veeraballe', 'Vemula',
  ],

};

// Fetch all villages for a given mandal from India Post API.
// Returns array of { name, pincode } sorted alphabetically.
// Caches results in memory to avoid repeated network calls.
const _cache = {};

export async function fetchVillagesForMandal(mandalName) {
  if (_cache[mandalName]) return _cache[mandalName];

  try {
    const res  = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(mandalName)}`);
    const json = await res.json();

    if (json && json[0] && json[0].Status === 'Success' && json[0].PostOffice && json[0].PostOffice.length > 0) {
      const seen = new Set();
      const villages = json[0].PostOffice
        .filter(po => {
          if (seen.has(po.Name)) return false;
          seen.add(po.Name);
          return true;
        })
        .map(po => ({ name: po.Name, pincode: po.Pincode }))
        .sort((a, b) => a.name.localeCompare(b.name));

      _cache[mandalName] = villages;
      return villages;
    }
  } catch (_e) {}

  return [];
}
