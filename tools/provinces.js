/* Province seeds for Europe, 1914. Each province is the Voronoi cell of its seed, clipped to land.
   [key, name, lon, lat, owner, terrain, industry, victoryPoints, flags]
   terrain: p plains, h hills, m mountain, f forest, s marsh, u urban, d desert
   flags: c capital, p port */
module.exports.BBOX = { lon0: -11, lon1: 46, lat0: 33.5, lat1: 62.5 };
module.exports.PROVS = [
// ---- British Empire
['london','London',-0.1,51.5,'ENG','u',12,30,'cp'],['plymouth','Plymouth',-4.1,50.5,'ENG','h',2,2,'p'],['bristol','Bristol',-2.5,51.5,'ENG','p',3,3,'p'],
['birmingham','Birmingham',-1.8,52.6,'ENG','u',8,6,''],['cardiff','Cardiff',-3.7,52.1,'ENG','h',4,3,'p'],['norwich','Norwich',1.0,52.7,'ENG','p',1,1,'p'],
['manchester','Manchester',-2.4,53.6,'ENG','u',9,6,'p'],['newcastle','Newcastle',-1.6,54.9,'ENG','h',5,4,'p'],['edinburgh','Edinburgh',-3.1,55.95,'ENG','h',3,5,'p'],['glasgow','Glasgow',-4.6,55.8,'ENG','u',6,4,'p'],
['inverness','Inverness',-4.3,57.4,'ENG','m',0,1,'p'],['dublin','Dublin',-6.5,53.2,'ENG','p',2,4,'p'],['cork','Cork',-8.7,52.2,'ENG','h',1,1,'p'],
['belfast','Belfast',-6.4,54.7,'ENG','h',3,2,'p'],['galway','Galway',-8.8,53.8,'ENG','h',0,1,'p'],['cyprus','Cyprus',33.2,35.0,'ENG','h',0,1,'p'],
// ---- France
['paris','Paris',2.35,48.85,'FRA','u',10,30,'c'],['lille','Lille',2.9,50.5,'FRA','p',6,5,'p'],['rouen','Rouen',0.3,49.2,'FRA','p',3,3,'p'],
['brest','Brest',-3.0,48.2,'FRA','h',1,2,'p'],['nantes','Nantes',-1.2,47.2,'FRA','p',2,2,'p'],['orleans','Orléans',1.8,47.3,'FRA','p',1,2,''],
['reims','Reims',4.2,49.2,'FRA','p',2,3,''],['nancy','Nancy',6.1,48.6,'FRA','h',3,4,''],['dijon','Dijon',5.0,47.2,'FRA','h',1,2,''],
['lyon','Lyon',4.8,45.6,'FRA','h',4,5,''],['clermont','Clermont',2.8,45.6,'FRA','h',1,1,''],['bordeaux','Bordeaux',-0.6,44.8,'FRA','p',2,3,'p'],
['toulouse','Toulouse',1.4,43.6,'FRA','p',1,2,''],['marseille','Marseille',5.4,43.6,'FRA','h',3,5,'p'],['nice','Nice',6.8,44.3,'FRA','m',0,1,'p'],
['corsica','Corsica',9.1,42.3,'FRA','m',0,1,'p'],['oran','Oran',-0.6,35.5,'FRA','d',0,1,'p'],['algiers','Algiers',3.0,36.5,'FRA','h',1,2,'p'],
['constantine','Constantine',6.6,36.2,'FRA','h',0,1,'p'],['tunis','Tunis',10.0,36.4,'FRA','d',0,1,'p'],['fez','Fez',-5.0,34.2,'FRA','m',0,1,''],
// ---- German Empire
['berlin','Berlin',13.4,52.5,'GER','u',10,30,'c'],['hamburg','Hamburg',10.0,53.6,'GER','u',6,6,'p'],['kiel','Kiel',9.6,54.5,'GER','p',2,3,'p'],
['hanover','Hanover',9.7,52.3,'GER','p',3,3,''],['bremen','Bremen',8.2,53.15,'GER','p',3,3,'p'],['ruhr','Essen',7.4,51.7,'GER','u',12,8,''],['cologne','Cologne',6.9,50.8,'GER','u',5,5,''],
['frankfurt','Frankfurt',8.7,50.1,'GER','h',4,4,''],['metz','Metz',6.3,49.2,'GER','h',3,4,''],['strasbourg','Strassburg',7.7,48.4,'GER','h',2,4,''],
['stuttgart','Stuttgart',9.2,48.7,'GER','h',3,3,''],['munich','Munich',11.6,48.1,'GER','h',3,5,''],['nuremberg','Nuremberg',11.1,49.5,'GER','h',2,3,''],
['erfurt','Erfurt',11.0,50.9,'GER','f',1,1,''],['saxony','Dresden',13.4,51.1,'GER','h',6,5,''],['magdeburg','Magdeburg',11.6,52.1,'GER','p',3,2,''],
['rostock','Rostock',12.2,53.9,'GER','p',1,1,'p'],['stettin','Stettin',15.0,53.6,'GER','p',2,3,'p'],['posen','Posen',17.0,52.4,'GER','p',1,3,''],
['breslau','Breslau',17.0,51.1,'GER','p',3,4,''],['oppeln','Kattowitz',18.5,50.5,'GER','h',5,3,''],['danzig','Danzig',18.75,54.42,'GER','u',2,4,'p'],
['konigsberg','Königsberg',20.8,54.5,'GER','f',1,4,'p'],
// ---- Low Countries, Switzerland
['brussels','Brussels',4.4,50.9,'BEL','u',5,10,'c'],['ghent','Ghent',3.4,51.05,'BEL','p',2,3,'p'],['liege','Liège',5.5,50.4,'BEL','h',3,3,''],
['luxembourg','Luxembourg',6.1,49.75,'LUX','h',1,3,'c'],
['amsterdam','Amsterdam',4.9,52.4,'NED','s',5,10,'cp'],['groningen','Groningen',6.5,53.0,'NED','s',1,1,'p'],['eindhoven','Eindhoven',5.5,51.5,'NED','p',1,1,''],
['bern','Bern',7.4,46.8,'SWI','m',2,8,'c'],['zurich','Zürich',8.9,47.2,'SWI','m',2,3,''],
// ---- Scandinavia
['copenhagen','Copenhagen',12.0,55.5,'DEN','p',3,8,'cp'],['jutland','Aarhus',9.3,56.0,'DEN','p',1,2,'p'],['odense','Odense',10.4,55.3,'DEN','p',0,1,'p'],['aalborg','Aalborg',9.9,57.0,'DEN','p',0,1,'p'],
['oslo','Kristiania',10.7,60.0,'NOR','f',2,8,'cp'],['bergen','Bergen',6.2,60.2,'NOR','m',1,2,'p'],['kristiansand','Kristiansand',7.9,58.4,'NOR','m',0,1,'p'],
['stockholm','Stockholm',18.0,59.3,'SWE','f',4,10,'cp'],['gothenburg','Gothenburg',12.5,57.9,'SWE','f',2,3,'p'],['malmo','Malmö',13.3,55.8,'SWE','p',1,2,'p'],['sundsvall','Sundsvall',16.0,61.5,'SWE','f',1,1,'p'],['visby','Visby',18.4,57.5,'SWE','p',0,1,'p'],['kalmar','Kalmar',16.2,57.2,'SWE','f',0,1,'p'],
// ---- Iberia
['madrid','Madrid',-3.7,40.4,'SPA','h',3,12,'c'],['barcelona','Barcelona',2.0,41.6,'SPA','h',3,5,'p'],['zaragoza','Zaragoza',-0.9,41.6,'SPA','h',0,1,''],
['bilbao','Bilbao',-2.9,43.0,'SPA','m',2,2,'p'],['coruna','A Coruña',-8.0,43.0,'SPA','h',0,1,'p'],['valladolid','Valladolid',-5.0,41.8,'SPA','p',0,1,''],
['valencia','Valencia',-0.5,39.3,'SPA','h',1,2,'p'],['seville','Seville',-5.8,37.6,'SPA','p',1,2,''],['cadiz','Cádiz',-5.9,36.5,'SPA','h',0,1,'p'],['granada','Granada',-3.0,37.3,'SPA','m',0,1,'p'],
['badajoz','Badajoz',-6.2,39.1,'SPA','h',0,1,''],['tetuan','Tetuán',-5.3,35.2,'SPA','m',0,1,'p'],
['lisbon','Lisbon',-9.0,38.8,'POR','h',2,8,'cp'],['porto','Porto',-8.3,41.2,'POR','h',1,2,'p'],
// ---- Italy
['rome','Rome',12.5,41.9,'ITA','u',3,20,'c'],['turin','Turin',7.6,45.0,'ITA','h',5,5,''],['milan','Milan',9.2,45.5,'ITA','u',6,6,''],
['venice','Venice',12.0,45.6,'ITA','p',2,4,'p'],['genoa','Genoa',9.0,44.4,'ITA','m',3,3,'p'],['bologna','Bologna',11.3,44.5,'ITA','p',2,2,''],
['florence','Florence',11.2,43.6,'ITA','h',2,3,''],['pescara','Pescara',13.9,42.4,'ITA','m',0,1,'p'],['naples','Naples',14.4,40.9,'ITA','h',2,4,'p'],
['bari','Bari',16.6,41.1,'ITA','p',0,1,'p'],['lecce','Lecce',18.1,40.3,'ITA','p',0,1,'p'],['calabria','Reggio',16.3,39.1,'ITA','m',0,1,'p'],['sicily','Palermo',13.9,37.7,'ITA','h',1,2,'p'],['sardinia','Cagliari',9.0,40.3,'ITA','h',0,1,'p'],
// ---- Austria-Hungary
['vienna','Vienna',16.4,48.2,'AUS','u',8,25,'c'],['linz','Linz',13.8,47.9,'AUS','h',2,2,''],['tyrol','Innsbruck',11.3,46.8,'AUS','m',0,3,''],
['graz','Graz',15.4,47.0,'AUS','h',2,2,''],['trieste','Trieste',14.2,45.7,'AUS','h',2,4,'p'],['prague','Prague',14.4,50.1,'AUS','h',7,8,''],
['brno','Brünn',16.9,49.3,'AUS','h',3,3,''],['pressburg','Pressburg',19.0,48.7,'AUS','m',1,2,''],['budapest','Budapest',19.0,47.5,'AUS','u',6,15,''],
['szeged','Szeged',19.6,46.2,'AUS','p',1,2,''],['debrecen','Debrecen',21.6,47.6,'AUS','p',1,2,''],['kolozsvar','Kolozsvár',23.6,46.8,'AUS','m',1,2,''],['kronstadt','Kronstadt',25.3,46.0,'AUS','m',0,1,''],['neusatz','Neusatz',19.9,45.3,'AUS','p',0,1,''],
['temesvar','Temesvár',21.4,45.7,'AUS','p',1,2,''],['zagreb','Agram',16.0,45.8,'AUS','h',1,3,''],['dalmatia','Spalato',16.4,43.6,'AUS','m',0,1,'p'],
['sarajevo','Sarajevo',18.2,44.0,'AUS','m',0,3,''],['krakow','Krakau',20.0,50.0,'AUS','h',1,3,''],['przemysl','Przemyśl',22.6,49.7,'AUS','h',0,3,''],
['lemberg','Lemberg',24.2,49.8,'AUS','p',2,4,''],['czernowitz','Czernowitz',25.6,48.2,'AUS','h',0,1,''],
// ---- Balkans
['belgrade','Belgrade',20.6,44.2,'SER','h',1,10,'c'],['nis','Niš',21.9,43.3,'SER','m',0,2,''],['skopje','Skopje',21.5,41.9,'SER','m',0,2,''],
['cetinje','Cetinje',19.2,42.6,'MNT','m',0,5,'c'],['tirana','Durazzo',19.8,41.2,'ALB','m',0,5,'cp'],['valona','Valona',19.6,40.4,'ALB','m',0,1,'p'],
['athens','Athens',23.7,38.0,'GRE','h',1,10,'cp'],['salonika','Salonika',23.0,40.7,'GRE','h',1,4,'p'],['larissa','Larissa',22.2,39.5,'GRE','h',0,1,'p'],
['ioannina','Ioannina',20.8,39.7,'GRE','m',0,1,''],['patras','Patras',22.2,37.4,'GRE','m',0,1,'p'],['crete','Crete',24.9,35.2,'GRE','m',0,1,'p'],
['sofia','Sofia',23.3,42.7,'BUL','m',1,10,'c'],['plovdiv','Plovdiv',24.8,42.1,'BUL','h',0,2,''],['pleven','Pleven',25.0,43.4,'BUL','p',0,1,''],
['varna','Varna',27.5,43.2,'BUL','h',0,2,'p'],['dedeagach','Dedeagach',25.6,41.1,'BUL','h',0,1,'p'],
['bucharest','Bucharest',26.1,44.4,'ROM','p',2,10,'c'],['craiova','Craiova',23.8,44.4,'ROM','p',0,1,''],['ploesti','Ploești',26.0,45.2,'ROM','h',2,3,''],
['iasi','Iași',27.4,47.0,'ROM','h',0,2,''],['constanta','Constanța',28.4,44.3,'ROM','p',0,2,'p'],
// ---- Ottoman Empire
['constantinople','Constantinople',28.7,41.1,'OTT','u',3,25,'cp'],['adrianople','Adrianople',26.7,41.6,'OTT','h',0,3,''],['gallipoli','Gallipoli',26.6,40.3,'OTT','h',0,2,'p'],['bursa','Bursa',29.3,40.1,'OTT','h',1,2,'p'],
['smyrna','Smyrna',27.4,38.4,'OTT','h',1,4,'p'],['eskisehir','Eskişehir',30.6,39.5,'OTT','h',0,1,''],['ankara','Angora',32.9,39.9,'OTT','h',0,3,''],
['konya','Konya',32.5,37.9,'OTT','h',0,2,''],['antalya','Adalia',30.6,37.0,'OTT','m',0,1,'p'],['adana','Adana',35.3,37.1,'OTT','p',0,2,'p'],['silifke','Silifke',33.5,36.5,'OTT','m',0,1,'p'],
['sinope','Sinope',34.3,41.3,'OTT','m',0,1,'p'],['samsun','Samsun',36.4,40.9,'OTT','m',0,1,'p'],['sivas','Sivas',37.0,39.6,'OTT','m',0,2,''],
['trebizond','Trebizond',39.7,40.8,'OTT','m',0,2,'p'],['erzurum','Erzurum',41.3,39.9,'OTT','m',0,3,''],['van','Van',43.2,38.4,'OTT','m',0,1,''],
['diyarbakir','Diyarbekir',40.2,37.9,'OTT','h',0,1,''],['aleppo','Aleppo',37.2,36.2,'OTT','d',0,3,''],['deirezzor','Deir ez-Zor',40.1,35.2,'OTT','d',0,1,''],
['mosul','Mosul',43.1,36.3,'OTT','d',0,2,''],['damascus','Damascus',36.2,34.0,'OTT','d',0,3,'p'],
['tabriz','Tabriz',45.9,37.6,'PER','m',0,5,'c'],
// ---- Russian Empire
['petersburg','St. Petersburg',30.3,59.9,'RUS','u',8,30,'cp'],['helsinki','Helsingfors',25.0,60.4,'RUS','f',2,3,'p'],['turku','Åbo',22.5,61.0,'RUS','f',0,1,'p'],
['vyborg','Viborg',28.8,61.2,'RUS','f',0,1,'p'],['petrozavodsk','Petrozavodsk',34.3,61.6,'RUS','f',0,1,''],['reval','Reval',24.8,59.2,'RUS','f',1,2,'p'],
['riga','Riga',24.1,56.9,'RUS','f',3,5,'p'],['dvinsk','Dvinsk',26.5,55.9,'RUS','f',0,2,''],['pskov','Pskov',28.4,57.8,'RUS','f',0,2,''],
['novgorod','Novgorod',31.5,58.4,'RUS','f',0,2,''],['libau','Libau',21.5,56.8,'RUS','f',0,1,'p'],['kovno','Kovno',23.6,55.1,'RUS','f',0,2,'p'],['vilna','Vilna',25.4,54.6,'RUS','f',1,3,''],
['warsaw','Warsaw',21.0,52.3,'RUS','u',5,10,''],['lodz','Łódź',19.4,51.7,'RUS','p',4,4,''],['lublin','Lublin',22.6,51.2,'RUS','p',0,2,''],
['bialystok','Białystok',23.2,53.2,'RUS','f',1,2,''],['brestlitovsk','Brest-Litovsk',24.2,52.1,'RUS','s',0,3,''],['pinsk','Pinsk',26.6,52.0,'RUS','s',0,1,''],
['minsk','Minsk',27.6,53.9,'RUS','f',1,3,''],['vitebsk','Vitebsk',30.2,55.2,'RUS','f',0,2,''],['mogilev','Mogilev',30.3,53.6,'RUS','f',0,2,''],
['smolensk','Smolensk',32.1,54.8,'RUS','f',1,3,''],['tver','Tver',35.5,57.0,'RUS','f',1,2,''],['moscow','Moscow',37.6,55.75,'RUS','u',8,25,''],
['yaroslavl','Yaroslavl',39.9,58.0,'RUS','f',1,2,''],['vologda','Vologda',40.5,60.3,'RUS','f',0,1,''],['nizhny','Nizhny Novgorod',44.0,56.3,'RUS','f',2,3,''],
['tula','Tula',37.6,54.0,'RUS','p',3,3,''],['ryazan','Ryazan',41.0,54.3,'RUS','p',0,1,''],['orel','Orel',36.0,52.6,'RUS','p',0,2,''],
['tambov','Tambov',41.6,52.5,'RUS','p',0,1,''],['voronezh','Voronezh',39.3,51.4,'RUS','p',0,2,''],['saratov','Saratov',45.2,51.5,'RUS','p',1,2,''],
['gomel','Gomel',31.0,52.3,'RUS','s',0,1,''],['rovno','Rovno',26.3,50.7,'RUS','p',0,2,''],['kiev','Kiev',30.5,50.4,'RUS','p',3,8,''],
['vinnitsa','Vinnitsa',28.5,49.1,'RUS','p',0,1,''],['kishinev','Kishinev',28.8,47.1,'RUS','p',0,2,''],['odessa','Odessa',30.7,46.6,'RUS','p',2,5,'p'],
['kherson','Nikolaev',32.6,47.2,'RUS','p',1,2,'p'],['poltava','Poltava',34.2,49.9,'RUS','p',0,1,''],['kharkov','Kharkov',36.5,49.9,'RUS','p',3,4,''],
['ekaterinoslav','Ekaterinoslav',35.0,48.3,'RUS','p',2,3,''],['crimea','Sevastopol',34.0,45.0,'RUS','h',1,4,'p'],['donbass','Yuzovka',38.2,48.2,'RUS','p',4,3,''],
['rostov','Rostov',39.9,47.2,'RUS','p',1,3,'p'],['tsaritsyn','Tsaritsyn',44.4,48.8,'RUS','p',1,2,''],['kuban','Ekaterinodar',39.2,45.1,'RUS','p',0,1,'p'],
['stavropol','Stavropol',42.3,45.0,'RUS','p',0,1,''],['astrakhan','Elista',45.0,46.4,'RUS','d',0,1,''],['grozny','Grozny',44.8,43.4,'RUS','m',1,1,''],
['batum','Batum',42.0,42.2,'RUS','m',0,2,'p'],['tiflis','Tiflis',44.8,41.7,'RUS','m',1,4,''],['kars','Kars',43.1,40.6,'RUS','m',0,2,''],['erivan','Erivan',45.0,40.0,'RUS','m',0,1,''],
// ---- added so the crises of 1938-39 have their own ground
['westprussia','Bromberg',18.0,53.55,'GER','p',1,2,''],['sudeten','Reichenberg',15.2,50.8,'AUS','m',2,2,''],['eger','Karlsbad',12.7,50.15,'AUS','m',1,1,''],
['gorlitz','Görlitz',15.0,51.45,'GER','p',1,1,''],['regensburg','Regensburg',12.1,49.0,'GER','h',1,1,''],
];
/* Crossings by sea. Usable only by a side that is not outgunned at sea. */
module.exports.SEA = [['london','lille'],['manchester','dublin'],['glasgow','belfast'],['plymouth','brest'],['calabria','sicily'],['rome','sardinia'],['nice','corsica'],
 ['copenhagen','malmo'],['copenhagen','odense'],['odense','jutland'],['copenhagen','rostock'],['aalborg','gothenburg'],['stockholm','turku'],['reval','helsinki'],['marseille','algiers'],['sicily','tunis'],
 ['patras','crete'],['silifke','cyprus'],['athens','smyrna'],['cadiz','tetuan'],['lecce','valona'],['stockholm','visby'],['constantinople','bursa'],['crimea','kuban'],['norwich','amsterdam'],['danzig','konigsberg']];
