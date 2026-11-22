(function () {
  'use strict';

  /* ===== 設定區 ===== */
  // 春節公休（除夕～初四）。每年請更新一次。
  var CLOSED = ['2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'];
  // 預設的「到店人次推估係數」與「到店率」，管理者可在頁面內修改並存到雲端
  var DEFAULT_PARAMS = {
    coef: { '台北仁愛': 0.30, '桃園中正': 0.31, '新竹光明': 0.30, '台中向上': 0.35, '台中崇德': 0.29, '高雄巨蛋': 0.31 },
    rate: { '台北仁愛': 0.73, '桃園中正': 0.77, '新竹光明': 0.80, '台中向上': 0.80, '台中崇德': 0.74, '高雄巨蛋': 0.75 }
  };
  var FALLBACK = { coef: 0.30, rate: 0.75 };
  // 預設的大檔期月份（預估剩餘人數與營收時，會排除這些月份的日均）
  var DEFAULT_PEAK = [5, 10];
  // 尚未連接雲端時顯示的內建範例資料
  var SEED = {"asOf":"2026-11-21","fileName":"內建範例資料","branches":[{"name":"台北仁愛","months":[{"m":1,"rev":8509215,"visitors":758,"newV":122,"newDeals":62,"newAmt":3242470,"oldDeals":187,"oldAmt":5266745},{"m":2,"rev":8132351,"visitors":658,"newV":99,"newDeals":50,"newAmt":2099066,"oldDeals":194,"oldAmt":6033285},{"m":3,"rev":8220418,"visitors":769,"newV":185,"newDeals":114,"newAmt":3470556,"oldDeals":163,"oldAmt":4749862},{"m":4,"rev":9923177,"visitors":757,"newV":133,"newDeals":72,"newAmt":2497551,"oldDeals":207,"oldAmt":7425626},{"m":5,"rev":16859042,"visitors":808,"newV":133,"newDeals":89,"newAmt":3408596,"oldDeals":315,"oldAmt":13450446},{"m":6,"rev":5936185,"visitors":684,"newV":109,"newDeals":60,"newAmt":2083502,"oldDeals":159,"oldAmt":3852683},{"m":7,"rev":7012113,"visitors":756,"newV":114,"newDeals":74,"newAmt":1919682,"oldDeals":197,"oldAmt":5092431},{"m":8,"rev":6249267,"visitors":707,"newV":108,"newDeals":63,"newAmt":1679523,"oldDeals":190,"oldAmt":4569744},{"m":9,"rev":10053209,"visitors":738,"newV":102,"newDeals":59,"newAmt":2095655,"oldDeals":226,"oldAmt":7957554},{"m":10,"rev":20755134,"visitors":898,"newV":143,"newDeals":86,"newAmt":4839934,"oldDeals":349,"oldAmt":15915200},{"m":11,"rev":5801093,"visitors":583,"newV":73,"newDeals":37,"newAmt":2603071,"oldDeals":146,"oldAmt":3198022}],"target":120000000,"rev":107449385,"card":97624955,"visitors":3165,"newV":1317,"newDeals":795,"newAmt":32112054,"oldDeals":1083,"oldAmt":75337331,"burn":113295074,"staff":[{"name":"蔡忻宸","title":"店副理","hire":"2018-10-01","rev":18895241,"card":17941864,"visitors":363,"newV":146,"newDeals":89,"newAmt":6584733,"oldDeals":130,"oldAmt":12310508,"burn":20878692},{"name":"陸思穎","title":"業務副理","hire":"2024-04-01","rev":16467427,"card":14978064,"visitors":564,"newV":235,"newDeals":125,"newAmt":5930595,"oldDeals":164,"oldAmt":10536832,"burn":17326831},{"name":"王并忻","title":"諮詢主任","hire":"2016-12-17","rev":21543293,"card":18903124,"visitors":611,"newV":218,"newDeals":134,"newAmt":6606344,"oldDeals":256,"oldAmt":14936949,"burn":22965187},{"name":"莫婕寶","title":"諮詢師","hire":"2022-03-17","rev":17843307,"card":17329014,"visitors":540,"newV":263,"newDeals":138,"newAmt":7878714,"oldDeals":159,"oldAmt":9964593,"burn":19465009},{"name":"黃怡甯","title":"諮詢師","hire":"2023-11-01","rev":11239437,"card":10808786,"visitors":621,"newV":198,"newDeals":133,"newAmt":3733045,"oldDeals":198,"oldAmt":7506392,"burn":13802233},{"name":"楊靜雯","title":"諮詢師","hire":"2024-08-12","rev":9774274,"card":8801552,"visitors":462,"newV":140,"newDeals":85,"newAmt":2190246,"oldDeals":121,"oldAmt":7584028,"burn":11315105},{"name":"牟怡柔","title":"醫美師","hire":"2023-02-01","rev":3311965,"card":2957020,"visitors":505,"newV":111,"newDeals":81,"newAmt":644108,"oldDeals":131,"oldAmt":2667857,"burn":5112016},{"name":"柯亭妘","title":"醫美師","hire":"2024-06-12","rev":5309974,"card":5245856,"visitors":557,"newV":107,"newDeals":82,"newAmt":1532329,"oldDeals":130,"oldAmt":3777645,"burn":9185176},{"name":"周雅慧","title":"醫美師","hire":"2026-03-09","rev":64805,"card":65860,"visitors":472,"newV":3,"newDeals":3,"newAmt":21670,"oldDeals":21,"oldAmt":43135,"burn":587094},{"name":"溫智涵","title":"醫美師","hire":"2026-06-23","rev":122824,"card":98185,"visitors":281,"newV":5,"newDeals":4,"newAmt":29839,"oldDeals":24,"oldAmt":92985,"burn":467612},{"name":"李昕曄","title":"醫美師","hire":"2026-09-14","rev":0,"card":0,"visitors":23,"newV":0,"newDeals":0,"newAmt":0,"oldDeals":0,"oldAmt":0,"burn":13140},{"name":"謝語珊","title":"醫美師","hire":"2026-09-14","rev":0,"card":0,"visitors":28,"newV":0,"newDeals":0,"newAmt":0,"oldDeals":0,"oldAmt":0,"burn":10060},{"name":"王薇雅","title":"醫美師","hire":"2026-09-22","rev":0,"card":0,"visitors":124,"newV":0,"newDeals":0,"newAmt":0,"oldDeals":3,"oldAmt":0,"burn":83037}]},{"name":"桃園中正","months":[{"m":1,"rev":5099718,"visitors":479,"newV":98,"newDeals":62,"newAmt":3011324,"oldDeals":121,"oldAmt":2088394},{"m":2,"rev":4661557,"visitors":420,"newV":69,"newDeals":41,"newAmt":1875617,"oldDeals":104,"oldAmt":2785940},{"m":3,"rev":4353366,"visitors":458,"newV":93,"newDeals":50,"newAmt":2561858,"oldDeals":100,"oldAmt":1791508},{"m":4,"rev":4558111,"visitors":450,"newV":75,"newDeals":41,"newAmt":1748303,"oldDeals":108,"oldAmt":2809808},{"m":5,"rev":8172772,"visitors":494,"newV":104,"newDeals":67,"newAmt":3138710,"oldDeals":138,"oldAmt":5034062},{"m":6,"rev":3687231,"visitors":401,"newV":71,"newDeals":50,"newAmt":2354766,"oldDeals":92,"oldAmt":1332465},{"m":7,"rev":3769775,"visitors":434,"newV":62,"newDeals":31,"newAmt":728715,"oldDeals":119,"oldAmt":3041060},{"m":8,"rev":3289290,"visitors":452,"newV":62,"newDeals":42,"newAmt":1197420,"oldDeals":133,"oldAmt":2091870},{"m":9,"rev":5598291,"visitors":395,"newV":59,"newDeals":36,"newAmt":1433038,"oldDeals":119,"oldAmt":4165253},{"m":10,"rev":11083333,"visitors":490,"newV":87,"newDeals":61,"newAmt":2311403,"oldDeals":177,"oldAmt":8771930},{"m":11,"rev":1943827,"visitors":251,"newV":25,"newDeals":20,"newAmt":565657,"oldDeals":74,"oldAmt":1378170}],"target":80000000,"rev":56219811,"card":51258843,"visitors":2034,"newV":804,"newDeals":513,"newAmt":21832900,"oldDeals":652,"oldAmt":34386911,"burn":60147512,"staff":[{"name":"陳伃涵","title":"諮詢主任","hire":"2021-07-01","rev":15198291,"card":15734718,"visitors":529,"newV":201,"newDeals":125,"newAmt":8287048,"oldDeals":114,"oldAmt":6911243,"burn":17093867},{"name":"邱品榛","title":"諮詢師","hire":"2018-11-01","rev":15109590,"card":13626182,"visitors":435,"newV":174,"newDeals":119,"newAmt":5055619,"oldDeals":158,"oldAmt":10053971,"burn":14718289},{"name":"郭驊慧","title":"諮詢師","hire":"2023-05-22","rev":11193975,"card":10439596,"visitors":491,"newV":199,"newDeals":120,"newAmt":3984543,"oldDeals":125,"oldAmt":7209432,"burn":11621870},{"name":"陳佩怡","title":"諮詢師","hire":"2024-04-08","rev":8689068,"card":8474291,"visitors":504,"newV":197,"newDeals":118,"newAmt":5013279,"oldDeals":125,"oldAmt":3675789,"burn":9728154},{"name":"詹佩茹","title":"醫美師","hire":"2024-09-09","rev":3088747,"card":2522425,"visitors":515,"newV":27,"newDeals":22,"newAmt":311356,"oldDeals":168,"oldAmt":2777391,"burn":3366767},{"name":"林詩穎","title":"醫美師","hire":"2026-03-02","rev":296226,"card":249606,"visitors":391,"newV":14,"newDeals":9,"newAmt":86230,"oldDeals":29,"oldAmt":209996,"burn":574480},{"name":"游蕥榕","title":"醫美師","hire":"2026-09-14","rev":0,"card":0,"visitors":27,"newV":0,"newDeals":0,"newAmt":0,"oldDeals":0,"oldAmt":0,"burn":13372}]},{"name":"台中向上","months":[{"m":1,"rev":6919983,"visitors":671,"newV":113,"newDeals":69,"newAmt":2385802,"oldDeals":168,"oldAmt":4534181},{"m":2,"rev":4469396,"visitors":549,"newV":92,"newDeals":52,"newAmt":1163543,"oldDeals":156,"oldAmt":3305853},{"m":3,"rev":4270520,"visitors":656,"newV":122,"newDeals":63,"newAmt":1363067,"oldDeals":173,"oldAmt":2907453},{"m":4,"rev":4683719,"visitors":663,"newV":126,"newDeals":71,"newAmt":1729482,"oldDeals":165,"oldAmt":2954237},{"m":5,"rev":10002240,"visitors":702,"newV":127,"newDeals":88,"newAmt":3111440,"oldDeals":230,"oldAmt":6890800},{"m":6,"rev":5455534,"visitors":624,"newV":98,"newDeals":68,"newAmt":2241341,"oldDeals":154,"oldAmt":3214193},{"m":7,"rev":4414976,"visitors":628,"newV":84,"newDeals":50,"newAmt":1370270,"oldDeals":156,"oldAmt":3044706},{"m":8,"rev":6085108,"visitors":656,"newV":89,"newDeals":58,"newAmt":1693414,"oldDeals":220,"oldAmt":4391694},{"m":9,"rev":8004603,"visitors":672,"newV":81,"newDeals":55,"newAmt":1861382,"oldDeals":217,"oldAmt":6143221},{"m":10,"rev":15590132,"visitors":760,"newV":131,"newDeals":87,"newAmt":3236386,"oldDeals":297,"oldAmt":12353746},{"m":11,"rev":3064391,"visitors":474,"newV":48,"newDeals":28,"newAmt":921706,"oldDeals":142,"oldAmt":2142685}],"target":80000000,"rev":72978312,"card":64683823,"visitors":3054,"newV":1118,"newDeals":726,"newAmt":22724588,"oldDeals":1002,"oldAmt":50253724,"burn":78490680,"staff":[{"name":"賴涵蓁","title":"諮詢主任","hire":"2019-12-24","rev":13059561,"card":11866177,"visitors":582,"newV":196,"newDeals":129,"newAmt":4873433,"oldDeals":166,"oldAmt":8186128,"burn":13224235},{"name":"彭麗嘉","title":"諮詢主任","hire":"2026-04-16","rev":4554142,"card":3879476,"visitors":264,"newV":97,"newDeals":57,"newAmt":1838270,"oldDeals":71,"oldAmt":2715872,"burn":4642305},{"name":"陳巧玲","title":"諮詢師","hire":"2017-04-01","rev":16825913,"card":15276601,"visitors":616,"newV":197,"newDeals":127,"newAmt":5008033,"oldDeals":250,"oldAmt":11817880,"burn":17819550},{"name":"孫怡婷","title":"諮詢師","hire":"2023-03-02","rev":13084561,"card":11932112,"visitors":537,"newV":195,"newDeals":138,"newAmt":5082136,"oldDeals":169,"oldAmt":8002425,"burn":14152294},{"name":"王喬儀","title":"諮詢師","hire":"2025-02-19","rev":8927472,"card":8313000,"visitors":443,"newV":194,"newDeals":122,"newAmt":3747588,"oldDeals":113,"oldAmt":5179884,"burn":9130998},{"name":"李濘汶","title":"醫美師","hire":"2025-09-08","rev":2696566,"card":2185668,"visitors":483,"newV":64,"newDeals":47,"newAmt":650908,"oldDeals":104,"oldAmt":2045658,"burn":3107712},{"name":"廖梓芸","title":"醫美師","hire":"2026-02-02","rev":2796727,"card":2350502,"visitors":463,"newV":44,"newDeals":30,"newAmt":356846,"oldDeals":126,"oldAmt":2439881,"burn":3829252},{"name":"方琬菁","title":"醫美師","hire":"2026-02-23","rev":971811,"card":660457,"visitors":460,"newV":25,"newDeals":17,"newAmt":230627,"oldDeals":84,"oldAmt":741184,"burn":1543306},{"name":"林筠軒","title":"醫美師","hire":"2026-09-01","rev":0,"card":2500,"visitors":21,"newV":1,"newDeals":0,"newAmt":0,"oldDeals":0,"oldAmt":0,"burn":18639},{"name":"郭昀萱","title":"醫美師","hire":"2026-09-01","rev":75814,"card":41064,"visitors":111,"newV":5,"newDeals":2,"newAmt":12474,"oldDeals":6,"oldAmt":63340,"burn":156569}]},{"name":"高雄巨蛋","months":[{"m":1,"rev":8613750,"visitors":856,"newV":148,"newDeals":95,"newAmt":2769374,"oldDeals":234,"oldAmt":5844376},{"m":2,"rev":8210414,"visitors":667,"newV":102,"newDeals":65,"newAmt":2135544,"oldDeals":201,"oldAmt":6074870},{"m":3,"rev":7818423,"visitors":842,"newV":157,"newDeals":95,"newAmt":2762997,"oldDeals":201,"oldAmt":5055426},{"m":4,"rev":8986616,"visitors":797,"newV":134,"newDeals":87,"newAmt":2792052,"oldDeals":206,"oldAmt":6194564},{"m":5,"rev":15031628,"visitors":884,"newV":163,"newDeals":93,"newAmt":3322004,"oldDeals":283,"oldAmt":11709624},{"m":6,"rev":7705863,"visitors":730,"newV":129,"newDeals":97,"newAmt":3254864,"oldDeals":184,"oldAmt":4450999},{"m":7,"rev":7708012,"visitors":783,"newV":128,"newDeals":85,"newAmt":2794298,"oldDeals":205,"oldAmt":4913714},{"m":8,"rev":6512096,"visitors":730,"newV":136,"newDeals":87,"newAmt":2877852,"oldDeals":198,"oldAmt":3634244},{"m":9,"rev":11670191,"visitors":800,"newV":122,"newDeals":78,"newAmt":2663964,"oldDeals":233,"oldAmt":9006227},{"m":10,"rev":22762743,"visitors":953,"newV":170,"newDeals":113,"newAmt":4596146,"oldDeals":381,"oldAmt":18166597},{"m":11,"rev":4187176,"visitors":591,"newV":75,"newDeals":43,"newAmt":1626323,"oldDeals":114,"oldAmt":2560853}],"target":100000000,"rev":109206912,"card":93592028,"visitors":3454,"newV":1466,"newDeals":994,"newAmt":35107151,"oldDeals":1133,"oldAmt":74099761,"burn":109295787,"staff":[{"name":"陸依箖","title":"諮詢主任","hire":"2024-01-02","rev":16593664,"card":14203423,"visitors":369,"newV":168,"newDeals":134,"newAmt":7341963,"oldDeals":148,"oldAmt":9251701,"burn":15668805},{"name":"李雅萍","title":"諮詢師","hire":"2019-01-01","rev":12520565,"card":11532331,"visitors":344,"newV":147,"newDeals":93,"newAmt":4309932,"oldDeals":112,"oldAmt":8210633,"burn":12613255},{"name":"莊靖涵","title":"諮詢師","hire":"2024-07-15","rev":11433923,"card":9856682,"visitors":429,"newV":160,"newDeals":111,"newAmt":4113095,"oldDeals":121,"oldAmt":7320828,"burn":11052679},{"name":"林采蓁","title":"諮詢師","hire":"2023-06-26","rev":11888930,"card":10620142,"visitors":404,"newV":169,"newDeals":109,"newAmt":4183960,"oldDeals":110,"oldAmt":7704970,"burn":12048482},{"name":"蔡芳嘉","title":"諮詢師","hire":"2024-04-08","rev":6273614,"card":4595109,"visitors":402,"newV":116,"newDeals":91,"newAmt":1356650,"oldDeals":93,"oldAmt":4916964,"burn":5510380},{"name":"胡云禎","title":"諮詢師","hire":"2024-05-01","rev":8085083,"card":6674099,"visitors":520,"newV":171,"newDeals":133,"newAmt":3483582,"oldDeals":114,"oldAmt":4601501,"burn":8572241},{"name":"黃雅湄","title":"醫美師","hire":"2024-05-01","rev":4426289,"card":3778260,"visitors":518,"newV":70,"newDeals":54,"newAmt":518515,"oldDeals":144,"oldAmt":3907774,"burn":6047594},{"name":"許淑婷","title":"醫美師","hire":"2025-10-06","rev":2366248,"card":1566976,"visitors":407,"newV":80,"newDeals":76,"newAmt":1417230,"oldDeals":138,"oldAmt":949018,"burn":3841906},{"name":"莊為晴","title":"醫美師","hire":"2026-09-14","rev":96676,"card":59756,"visitors":80,"newV":10,"newDeals":9,"newAmt":51727,"oldDeals":5,"oldAmt":44949,"burn":156216},{"name":"王酉鈴","title":"護理諮詢主任","hire":"2015-09-07","rev":18209304,"card":16823100,"visitors":478,"newV":202,"newDeals":124,"newAmt":5191312,"oldDeals":113,"oldAmt":13017992,"burn":18835323},{"name":"邱靜宜","title":"護理諮詢主任","hire":"2024-06-01","rev":12677855,"card":11652908,"visitors":572,"newV":255,"newDeals":161,"newAmt":6013493,"oldDeals":108,"oldAmt":6664362,"burn":13918317}]},{"name":"新竹光明","months":[{"m":1,"rev":2250111,"visitors":178,"newV":63,"newDeals":29,"newAmt":1301252,"oldDeals":50,"oldAmt":948859},{"m":2,"rev":1340582,"visitors":158,"newV":49,"newDeals":29,"newAmt":692164,"oldDeals":43,"oldAmt":648418},{"m":3,"rev":1608508,"visitors":179,"newV":57,"newDeals":30,"newAmt":1068728,"oldDeals":42,"oldAmt":539780},{"m":4,"rev":2820735,"visitors":183,"newV":61,"newDeals":29,"newAmt":1514672,"oldDeals":48,"oldAmt":1306063},{"m":5,"rev":3538858,"visitors":182,"newV":53,"newDeals":33,"newAmt":1492480,"oldDeals":54,"oldAmt":2046378},{"m":6,"rev":2400249,"visitors":198,"newV":64,"newDeals":34,"newAmt":1045519,"oldDeals":48,"oldAmt":1354730},{"m":7,"rev":2118871,"visitors":215,"newV":69,"newDeals":52,"newAmt":924348,"oldDeals":47,"oldAmt":1194523},{"m":8,"rev":2894683,"visitors":242,"newV":69,"newDeals":43,"newAmt":881297,"oldDeals":79,"oldAmt":2013386},{"m":9,"rev":1783154,"visitors":210,"newV":38,"newDeals":24,"newAmt":442794,"oldDeals":73,"oldAmt":1340360},{"m":10,"rev":5003726,"visitors":235,"newV":47,"newDeals":30,"newAmt":1113519,"oldDeals":80,"oldAmt":3890207},{"m":11,"rev":1018529,"visitors":158,"newV":24,"newDeals":13,"newAmt":272246,"oldDeals":51,"oldAmt":746283}],"target":37000000,"rev":26652503,"card":21627612,"visitors":950,"newV":594,"newDeals":369,"newAmt":11484743,"oldDeals":210,"oldAmt":15167760,"burn":24642614,"staff":[{"name":"高麗雯","title":"諮詢主任","hire":"2025-09-29","rev":10386259,"card":8718637,"visitors":362,"newV":227,"newDeals":147,"newAmt":6099354,"oldDeals":84,"oldAmt":4286905,"burn":9683435},{"name":"林怡辰","title":"諮詢師","hire":"2025-11-01","rev":8897305,"card":6213166,"visitors":304,"newV":194,"newDeals":102,"newAmt":3692537,"oldDeals":58,"oldAmt":5204768,"burn":7205970},{"name":"林宣諭","title":"醫美師","hire":"2025-11-03","rev":2526871,"card":2699459,"visitors":266,"newV":88,"newDeals":59,"newAmt":1054924,"oldDeals":71,"oldAmt":1471947,"burn":3284170},{"name":"曾家欣","title":"醫美師","hire":"2026-05-01","rev":740827,"card":711400,"visitors":153,"newV":28,"newDeals":19,"newAmt":251892,"oldDeals":36,"oldAmt":488935,"burn":1042856},{"name":"謝心瑜","title":"醫美師","hire":"2026-05-08","rev":588642,"card":403851,"visitors":136,"newV":30,"newDeals":21,"newAmt":301021,"oldDeals":22,"oldAmt":287621,"burn":637976},{"name":"胡芳綺","title":"醫美師","hire":"2026-11-02","rev":0,"card":0,"visitors":0,"newV":0,"newDeals":0,"newAmt":0,"oldDeals":0,"oldAmt":0,"burn":0}]},{"name":"台中崇德","months":[{"m":1,"rev":5880853,"visitors":501,"newV":114,"newDeals":72,"newAmt":2596651,"oldDeals":148,"oldAmt":3284202},{"m":2,"rev":3744420,"visitors":401,"newV":94,"newDeals":66,"newAmt":1550703,"oldDeals":105,"oldAmt":2193717},{"m":3,"rev":5510253,"visitors":529,"newV":121,"newDeals":64,"newAmt":1840512,"oldDeals":150,"oldAmt":3669741},{"m":4,"rev":5587990,"visitors":480,"newV":84,"newDeals":48,"newAmt":1016268,"oldDeals":147,"oldAmt":4571722},{"m":5,"rev":7913574,"visitors":440,"newV":106,"newDeals":75,"newAmt":2094061,"oldDeals":139,"oldAmt":5819513},{"m":6,"rev":3175268,"visitors":373,"newV":67,"newDeals":52,"newAmt":1391593,"oldDeals":94,"oldAmt":1783675},{"m":7,"rev":3543328,"visitors":411,"newV":70,"newDeals":45,"newAmt":1193078,"oldDeals":133,"oldAmt":2350250},{"m":8,"rev":3095128,"visitors":423,"newV":92,"newDeals":54,"newAmt":1554113,"oldDeals":116,"oldAmt":1541015},{"m":9,"rev":6650594,"visitors":435,"newV":86,"newDeals":51,"newAmt":1773355,"oldDeals":119,"oldAmt":4877239},{"m":10,"rev":12945150,"visitors":498,"newV":116,"newDeals":80,"newAmt":3265097,"oldDeals":195,"oldAmt":9680053},{"m":11,"rev":1802030,"visitors":311,"newV":51,"newDeals":26,"newAmt":1152692,"oldDeals":78,"oldAmt":649338}],"target":80000000,"rev":59842711,"card":52164366,"visitors":1993,"newV":995,"newDeals":667,"newAmt":21079623,"oldDeals":583,"oldAmt":38763088,"burn":61591220,"staff":[{"name":"何忻穎","title":"諮詢主任","hire":"2024-08-05","rev":15624940,"card":12595210,"visitors":364,"newV":192,"newDeals":138,"newAmt":7299283,"oldDeals":101,"oldAmt":8325657,"burn":15667157},{"name":"劉芳瑜","title":"諮詢主任","hire":"2024-09-02","rev":10472693,"card":10240455,"visitors":336,"newV":174,"newDeals":118,"newAmt":4521790,"oldDeals":95,"oldAmt":5950903,"burn":11180481},{"name":"鐘茹恩","title":"諮詢師","hire":"2025-02-03","rev":7529158,"card":6569077,"visitors":385,"newV":132,"newDeals":92,"newAmt":2358482,"oldDeals":118,"oldAmt":5170676,"burn":7677101},{"name":"林雅玲","title":"諮詢師","hire":"2025-06-17","rev":9292644,"card":7896094,"visitors":334,"newV":157,"newDeals":105,"newAmt":4197826,"oldDeals":82,"oldAmt":5094818,"burn":9164941},{"name":"姜力菱","title":"諮詢師","hire":"2026-08-03","rev":1798409,"card":1132430,"visitors":83,"newV":46,"newDeals":25,"newAmt":903849,"oldDeals":16,"oldAmt":894560,"burn":1244781},{"name":"高寶芸","title":"醫美師","hire":"2024-08-01","rev":4901895,"card":4443283,"visitors":312,"newV":119,"newDeals":80,"newAmt":1516197,"oldDeals":76,"oldAmt":3385698,"burn":5385141},{"name":"曾姿芳","title":"醫美師","hire":"2024-10-01","rev":4613795,"card":4433136,"visitors":348,"newV":106,"newDeals":62,"newAmt":969728,"oldDeals":84,"oldAmt":3644067,"burn":5450371},{"name":"蘇妡衧","title":"醫美師","hire":"2026-08-03","rev":798775,"card":416380,"visitors":164,"newV":41,"newDeals":32,"newAmt":464998,"oldDeals":40,"oldAmt":333777,"burn":732176}]}]};

  var FB_APP = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
  var FB_FS = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
  var DAY = 864e5;
  var APP_VERSION = 'v8（個人數據版）';

  var S = { data: null, params: null, adj: {}, branch: null, status: 'loading', fb: null, pwd: null, parsed: null, banner: '', viewPwd: null, unsub: null, dataKey: '', scope: 'branch', person: 0 };
  var imp = (typeof window !== 'undefined' && window.__fbImport) || function (u) { return import(u); };

  /* ===== 小工具 ===== */
  var $ = function (s) { return document.querySelector(s); };
  var nf = function (v) { return Math.round(v).toLocaleString('en-US'); };
  var pc = function (v) { return (v * 100).toFixed(1) + '%'; };
  var pcn = function (v) { return v == null || !isFinite(v) ? '—' : pc(v); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var UP = '#3F7078', DOWN = '#8C5E4B', FLAT = '#556677';

  function P(kind, name) {
    var p = (S.params && S.params[kind]) || {};
    if (p[name] != null) return p[name];
    if (DEFAULT_PARAMS[kind][name] != null) return DEFAULT_PARAMS[kind][name];
    return FALLBACK[kind];
  }

  /* ===== 日期：營業日、經過月數 ===== */
  function workDays(from, to) {
    var c = 0;
    for (var t = from; t <= to; t += DAY) {
      var dt = new Date(t);
      if (dt.getUTCDay() !== 0 && CLOSED.indexOf(dt.toISOString().slice(0, 10)) < 0) c++;
    }
    return c;
  }
  function timeInfo(asOf) {
    var p = asOf.split('-').map(Number), y = p[0], m = p[1], d = p[2];
    var t0 = Date.UTC(y, 0, 1), t1 = Date.UTC(y, m - 1, d), t2 = Date.UTC(y, 11, 31);
    function work(from, to) {
      var c = 0;
      for (var t = from; t <= to; t += DAY) {
        var dt = new Date(t);
        if (dt.getUTCDay() !== 0 && CLOSED.indexOf(dt.toISOString().slice(0, 10)) < 0) c++;
      }
      return c;
    }
    var dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return { y: y, m: m, d: d, elapsed: work(t0, t1), remain: work(t1 + DAY, t2), months: (m - 1) + d / dim, weeks: ((t1 - t0) / DAY + 1) / 7 };
  }

  /* ===== 計算 ===== */
  function baseOf(b) {
    var oldV = b.visitors - b.newV;
    return {
      visitors: b.visitors,
      newV: b.newV,
      newRate: b.newV ? b.newDeals / b.newV : 0,
      newAov: b.newDeals ? b.newAmt / b.newDeals : 0,
      oldRate: oldV ? b.oldDeals / oldV : 0,
      oldAov: b.oldDeals ? b.oldAmt / b.oldDeals : 0
    };
  }
  function calc(b, a) {
    var newDeals = a.newV * a.newRate, newAmt = newDeals * a.newAov;
    var oldV = a.visitors - a.newV, oldDeals = oldV * a.oldRate, oldAmt = oldDeals * a.oldAov;
    var rev = newAmt + oldAmt, deals = newDeals + oldDeals;
    return {
      newDeals: newDeals, newAmt: newAmt, oldV: oldV, oldDeals: oldDeals, oldAmt: oldAmt, rev: rev, deals: deals,
      ach: b.target ? rev / b.target : null, cardRate: b.rev ? b.card / b.rev : null,
      closeRate: a.visitors ? deals / a.visitors : 0, aov: deals ? rev / deals : 0
    };
  }
  function peakMonths() {
    var p = S.params && S.params.peak;
    return Array.isArray(p) ? p : DEFAULT_PEAK;
  }
  function runs(list) {
    var out = [], i = 0;
    while (i < list.length) {
      var j = i;
      while (j + 1 < list.length && list[j + 1] === list[j] + 1) j++;
      out.push(j > i ? list[i] + '–' + list[j] : String(list[i]));
      i = j + 1;
    }
    return out.join('、');
  }
  // 預估剩餘營業日的人數與營收：以「非大檔期月份」的營業日日均為基準
  function forecastPlan(b, base, t) {
    var simpleV = base.visitors / t.elapsed * t.remain, simpleN = base.newV / t.elapsed * t.remain;
    var res = { simple: true, addV: simpleV, addN: simpleN, addOldV: simpleV - simpleN, addNewAmt: 0, addOldAmt: 0 };
    if (!b.months || !b.months.length) return res;
    var peak = peakMonths();
    var dim = new Date(Date.UTC(t.y, t.m, 0)).getUTCDate();
    var lastFull = t.d === dim ? t.m : t.m - 1;
    var ref = b.months.filter(function (x) { return x.m <= lastFull && peak.indexOf(x.m) < 0; });
    var all = b.months.filter(function (x) { return x.m <= t.m; });
    if (!ref.length || !all.length) return res;
    function days(mm) {
      var s0 = Date.UTC(t.y, mm - 1, 1), e0 = mm === t.m ? Date.UTC(t.y, t.m - 1, t.d) : Date.UTC(t.y, mm, 0);
      return workDays(s0, e0);
    }
    function sum(list, f) { return list.reduce(function (a, x) { return a + f(x); }, 0); }
    var refDays = sum(ref, function (x) { return days(x.m); });
    var allDays = sum(all, function (x) { return days(x.m); });
    if (!refDays || !allDays) return res;
    var oldRef = sum(ref, function (x) { return x.visitors - x.newV; }) / refDays;
    var oldAll = sum(all, function (x) { return x.visitors - x.newV; }) / allDays;
    var ratio = oldAll ? oldRef / oldAll : 1;
    var addN = sum(ref, function (x) { return x.newV; }) / refDays * t.remain;
    var addOldV = (base.visitors - base.newV) / t.elapsed * t.remain * ratio;
    return {
      simple: false, ref: ref.map(function (x) { return x.m; }), peak: peak,
      addV: addN + addOldV, addN: addN, addOldV: addOldV,
      addNewAmt: sum(ref, function (x) { return x.newAmt; }) / refDays * t.remain,
      addOldAmt: sum(ref, function (x) { return x.oldAmt; }) / refDays * t.remain,
      refNewPerDay: sum(ref, function (x) { return x.newV; }) / refDays
    };
  }
  // 按下「自動套入」後的各項指標：新增人數＋以非大檔期水準計算的營收，與全年數字加權混合
  function forecastAdj(m) {
    var b = m.b, base = m.base, p = m.plan;
    if (p.simple) return { visitors: base.visitors + p.addV, newV: base.newV + p.addN };
    var oldV0 = b.visitors - b.newV;
    var newV = base.newV + p.addN, oldV = oldV0 + p.addOldV;
    var nD = b.newDeals + p.addN * base.newRate, nA = b.newAmt + p.addNewAmt;
    var oD = b.oldDeals + p.addOldV * base.oldRate, oA = b.oldAmt + p.addOldAmt;
    return {
      visitors: base.visitors + p.addN + p.addOldV, newV: newV,
      newRate: newV ? nD / newV : 0, newAov: nD ? nA / nD : 0,
      oldRate: oldV ? oD / oldV : 0, oldAov: oD ? oA / oD : 0
    };
  }
  function branchObj() { return S.data.branches.filter(function (x) { return x.name === S.branch; })[0]; }
  function curUnit() {
    var br = branchObj();
    if (S.scope === 'person' && br.staff && br.staff.length) {
      var idx = Math.min(S.person, br.staff.length - 1);
      return { u: br.staff[idx], key: br.name + '|' + idx, person: true, branch: br };
    }
    return { u: br, key: br.name, person: false, branch: br };
  }
  // 以「非大檔期月份」相對於全期間的日均比例，推估個人在剩餘日子的人數與業績
  function refAll(br, t) {
    if (!br.months || !br.months.length) return null;
    var peak = peakMonths();
    var dim = new Date(Date.UTC(t.y, t.m, 0)).getUTCDate();
    var lastFull = t.d === dim ? t.m : t.m - 1;
    var ref = br.months.filter(function (x) { return x.m <= lastFull && peak.indexOf(x.m) < 0; });
    var all = br.months.filter(function (x) { return x.m <= t.m; });
    if (!ref.length || !all.length) return null;
    function days(mm) {
      var s0 = Date.UTC(t.y, mm - 1, 1), e0 = mm === t.m ? Date.UTC(t.y, t.m - 1, t.d) : Date.UTC(t.y, mm, 0);
      return workDays(s0, e0);
    }
    var refDays = ref.reduce(function (a, x) { return a + days(x.m); }, 0);
    var allDays = all.reduce(function (a, x) { return a + days(x.m); }, 0);
    if (!refDays || !allDays) return null;
    return { ref: ref, all: all, refDays: refDays, allDays: allDays, peak: peak };
  }
  function peakRatios(br, t) {
    var x = refAll(br, t);
    if (!x) return null;
    function r(f) {
      var a = x.all.reduce(function (s0, m) { return s0 + f(m); }, 0) / x.allDays;
      var b = x.ref.reduce(function (s0, m) { return s0 + f(m); }, 0) / x.refDays;
      return a ? b / a : 1;
    }
    return {
      newV: r(function (m) { return m.newV; }), oldV: r(function (m) { return m.visitors - m.newV; }),
      newAmt: r(function (m) { return m.newAmt; }), oldAmt: r(function (m) { return m.oldAmt; }),
      peak: x.peak, ref: x.ref.map(function (m) { return m.m; })
    };
  }
  function personPlan(p, br, base, t) {
    var yStart = Date.UTC(t.y, 0, 1), start = yStart, startISO = t.y + '-01-01';
    if (p.hire) {
      var hp = p.hire.split('-').map(Number), hs = Date.UTC(hp[0], hp[1] - 1, hp[2]);
      if (hs > yStart) { start = hs; startISO = p.hire; }
    }
    var end = Date.UTC(t.y, t.m - 1, t.d);
    var elapsed = start <= end ? workDays(start, end) : 0;
    var res = { person: true, simple: true, elapsed: elapsed, startISO: startISO, addV: 0, addN: 0, addOldV: 0, addNewAmt: 0, addOldAmt: 0, peak: [] };
    if (!elapsed) return res;
    var addN = base.newV / elapsed * t.remain, addOldV = (base.visitors - base.newV) / elapsed * t.remain;
    var addNewAmt = p.newAmt / elapsed * t.remain, addOldAmt = p.oldAmt / elapsed * t.remain;
    var rr = peakRatios(br, t);
    if (rr) { addN *= rr.newV; addOldV *= rr.oldV; addNewAmt *= rr.newAmt; addOldAmt *= rr.oldAmt; res.simple = false; res.peak = rr.peak; }
    res.addN = addN; res.addOldV = addOldV; res.addV = addN + addOldV; res.addNewAmt = addNewAmt; res.addOldAmt = addOldAmt;
    return res;
  }
  function model() {
    var cu = curUnit();
    var b = cu.u, br = cu.branch;
    var base = baseOf(b);
    var a = Object.assign({}, base, S.adj[cu.key] || {});
    var coef = P('coef', br.name), rate = P('rate', br.name);
    var t = timeInfo(S.data.asOf);
    var f = coef * rate * t.months;
    var plan = cu.person ? personPlan(b, br, base, t) : forecastPlan(b, base, t);
    var addV = plan.addV, addN = plan.addN;
    var vmax = Math.max(Math.round(base.visitors * 1.6), Math.round((base.visitors + addV) * 1.3));
    return { b: b, br: br, person: cu.person, key: cu.key, base: base, a: a, o: calc(b, base), n: calc(b, a), coef: coef, rate: rate, t: t, f: f, addV: addV, addN: addN, plan: plan, vmax: vmax };
  }
  function defsOf(m) {
    var base = m.base, a = m.a;
    var vmin = Math.max(a.newV, Math.round(base.visitors * 0.5));
    var defs = [
      { k: 'book', name: '預約數（月平均）', kind: 'n', unit: ' 筆／月', step: 10, min: vmin / m.f, max: m.vmax / m.f, get: function (x) { return x.visitors / m.f; },
        note: '到店服務人次 ÷ 到店率 ' + Math.round(m.rate * 100) + '% ÷ ' + m.t.months.toFixed(1) + ' 個月 ＝ 平均每月預約數（到店率固定）' },
      { k: 'svc', avg: true, name: '到店服務人次', kind: 'n', unit: ' 人次', step: 50, min: vmin / m.coef, max: m.vmax / m.coef, get: function (x) { return x.visitors / m.coef; },
        note: '到店來客數 ÷ 係數 ' + Math.round(m.coef * 100) + '% ＝ 到店服務人次（係數固定）' },
      { k: 'visitors', avg: true, name: '到店來客數', kind: 'n', unit: ' 人', step: 10, min: vmin, max: m.vmax, get: function (x) { return x.visitors; } },
      { k: 'newV', avg: true, name: '到店新客數', kind: 'n', unit: ' 人', step: 5, min: Math.round(base.newV * 0.5),
        max: Math.min(Math.max(Math.round(base.newV * 1.6), Math.round((base.newV + m.addN) * 1.3)), a.newV + (m.vmax - a.visitors)), get: function (x) { return x.newV; } },
      { k: 'newRate', name: '新客成交率', kind: 'p', step: 0.01, min: Math.max(0.05, base.newRate - 0.25), max: Math.min(1, base.newRate + 0.25), get: function (x) { return x.newRate; } },
      { k: 'newAov', name: '新客平均客單', kind: 'm', step: 1000, min: Math.round(base.newAov * 0.6), max: Math.round(base.newAov * 1.6), get: function (x) { return x.newAov; } },
      { k: 'oldRate', name: '舊客成交率', kind: 'p', step: 0.01, min: Math.max(0.05, base.oldRate - 0.25), max: Math.min(1, base.oldRate + 0.25), get: function (x) { return x.oldRate; } },
      { k: 'oldAov', name: '舊客平均客單', kind: 'm', step: 1000, min: Math.round(base.oldAov * 0.6), max: Math.round(base.oldAov * 1.6), get: function (x) { return x.oldAov; } }
    ];
    if (m.person) {
      defs.forEach(function (d) {
        var bv = d.get(base) || 0;
        if (d.kind === 'n') d.step = Math.max(1, Math.round(bv * 0.03));
        else if (d.kind === 'm') d.step = Math.max(100, Math.round(bv * 0.02 / 100) * 100);
      });
    }
    return defs;
  }
  function show(d, v) {
    if (d.kind === 'm') return 'NT$ ' + nf(v);
    if (d.kind === 'p') return pc(v);
    return nf(v) + d.unit;
  }
  function apply(k, x) {
    var m = model();
    var d = defsOf(m).filter(function (z) { return z.k === k; })[0];
    if (!d || isNaN(x)) return;
    x = Math.min(d.max, Math.max(d.min, x));
    var adj = Object.assign({}, S.adj[m.key] || {});
    if (k === 'newV') { adj.newV = x; adj.visitors = m.a.visitors + (x - m.a.newV); }
    else if (k === 'svc') adj.visitors = x * m.coef;
    else if (k === 'book') adj.visitors = x * m.f;
    else adj[k] = x;
    S.adj[m.key] = adj;
    update();
  }

  /* ===== 畫面 ===== */
  function renderPills() {
    var el = $('#pills');
    el.innerHTML = S.data.branches.map(function (b) {
      return '<button type="button" class="pill" data-name="' + esc(b.name) + '" aria-pressed="' + (b.name === S.branch) + '">' + esc(b.name) + '</button>';
    }).join('');
  }
  function renderScope() {
    var br = branchObj(), staff = br && br.staff ? br.staff : [];
    if (!staff.length) S.scope = 'branch';
    if (S.person >= staff.length) S.person = 0;
    $('#scBranch').setAttribute('aria-pressed', String(S.scope === 'branch'));
    $('#scPerson').setAttribute('aria-pressed', String(S.scope === 'person'));
    $('#scPerson').disabled = !staff.length;
    $('#personWrap').hidden = S.scope !== 'person';
    $('#personSel').innerHTML = staff.map(function (p, i) {
      return '<option value="' + i + '"' + (i === S.person ? ' selected' : '') + '>' + esc(p.name) + '（' + esc(p.title || '職稱未填') + (p.hire ? '・' + tenureOf(p.hire, S.data.asOf).text : '') + '）' + '</option>';
    }).join('');
    $('#scopeNote').textContent = staff.length ? '' : '此分院沒有個人資料（請管理者重新上傳含「工作表2」的報表）';
  }
  function buildControls() {
    var m = model();
    $('#controls').innerHTML = defsOf(m).map(function (d) {
      return '<div class="ctl">' +
        '<div class="ctl-top"><label id="lbl-' + d.k + '" for="ctl-' + d.k + '">' + d.name + '</label><span class="tag-adj">可調整</span></div>' +
        '<div class="ctl-val"><button type="button" class="step" data-act="dec" data-k="' + d.k + '" aria-label="' + d.name + '減少">−</button>' +
        '<span class="val" id="val-' + d.k + '"></span>' +
        '<button type="button" class="step" data-act="inc" data-k="' + d.k + '" aria-label="' + d.name + '增加">＋</button></div>' +
        '<input id="ctl-' + d.k + '" data-k="' + d.k + '" type="range" step="any">' +
        '<p class="note" id="note-' + d.k + '" hidden></p>' +
        '<div class="ctl-foot"><span class="o" id="orig-' + d.k + '"></span><span class="chip" id="chip-' + d.k + '"></span></div>' +
        '</div>';
    }).join('');
  }
  function dText(kind, ov, nv) {
    var d = nv - ov;
    if (Math.abs(d) < (kind === 'p' ? 0.0005 : 0.5)) return '—';
    var ad = Math.abs(d);
    return (d > 0 ? '+' : '−') + (kind === 'p' ? (ad * 100).toFixed(1) + ' pt' : nf(ad));
  }
  function dColor(kind, ov, nv) {
    var d = nv - ov;
    if (Math.abs(d) < (kind === 'p' ? 0.0005 : 0.5)) return FLAT;
    return d > 0 ? UP : DOWN;
  }
  function forecastText(m) {
    var p = m.plan, t = m.t;
    if (p.person) {
      if (!p.elapsed) return '此同仁的到職日晚於資料截至日，沒有足夠的營業日可以推算。';
      var q = p.startISO.split('-');
      var addRev = calc(m.b, Object.assign({}, m.base, forecastAdj(m))).rev - m.o.rev;
      return '依個人 ' + Number(q[1]) + '/' + Number(q[2]) + '–' + t.m + '/' + t.d + ' 營業日共 ' + p.elapsed + ' 天（' + (p.startISO.slice(5) === '01-01' ? '' : '從到職日起，') + '排除週日與春節公休）的日平均' +
        (p.simple || !p.peak.length ? '' : '，並套用分院大檔期影響比例（已排除大檔期 ' + p.peak.join('、') + ' 月）') + '，推算剩餘 ' + t.remain +
        ' 個營業日約增加來客 ' + nf(p.addV) + ' 人、新客 ' + nf(p.addN) + ' 人、業績約 NT$ ' + nf(addRev) + '。';
    }
    if (p.simple) {
      return '依 1/1–' + t.m + '/' + t.d + ' 營業日共 ' + t.elapsed + ' 天（排除週日與春節公休 2/16–2/20）的日平均，推算剩餘 ' + t.remain +
        ' 個營業日約增加來客 ' + nf(m.addV) + ' 人、新客 ' + nf(m.addN) + ' 人。成交率與客單維持報表原值。';
    }
    var addRev = p.addNewAmt + p.addOldAmt;
    return '以 ' + runs(p.ref) + ' 月（' + (p.peak.length ? '已排除大檔期 ' + p.peak.join('、') + ' 月、' : '已排除') + '週日與春節公休）的營業日日均為基準，推算剩餘 ' + t.remain +
      ' 個營業日約增加新客 ' + nf(p.addN) + ' 人、舊客 ' + nf(p.addOldV) + ' 人、營收約 NT$ ' + nf(addRev) + '，視為剩餘日子都是平常月份。';
  }
  function tenureOf(hire, asOf) {
    if (!hire) return null;
    var h = hire.split('-').map(Number), a = asOf.split('-').map(Number);
    var months = (a[0] - h[0]) * 12 + (a[1] - h[1]);
    if (a[2] < h[2]) months--;
    if (months < 0) months = 0;
    return { months: months, text: Math.floor(months / 12) + '年' + (months % 12) + '個月' };
  }
  function personStrip(m) {
    if (!m.person) return '';
    var p = m.b, tn = tenureOf(p.hire, S.data.asOf);
    var meta = [p.title || '職稱未填', tn ? '年資 ' + tn.text : '年資未提供', p.hire ? '到職日 ' + fmtDate(p.hire) : ''].filter(Boolean).join(' · ');
    var hint = tn && tn.months < 3 ? '<p class="phint">到職未滿 3 個月，資料天數少，推算的參考性較低。</p>' : '';
    return '<div class="card pstrip"><p class="pname">' + esc(p.name) + '</p><p class="pmeta">' + esc(meta) + '</p>' + hint + '</div>';
  }
  function resultsHTML(m) {
    var o = m.o, n = m.n, b = m.b, base = m.base, a = m.a;
    var asShort = m.t.m + '/' + m.t.d;
    var revD = n.rev - o.rev, revFlat = Math.abs(revD) < 0.5;
    var revDelta = revFlat ? '與報表相同' : (revD > 0 ? '+' : '−') + ' NT$ ' + nf(Math.abs(revD)) + '（' + (revD > 0 ? '+' : '−') + (o.rev ? (Math.abs(revD / o.rev) * 100).toFixed(1) + '%' : '—') + '）';
    var revColor = revFlat ? FLAT : (revD > 0 ? UP : DOWN);
    var S_ = Math.max(1.5, n.ach * 1.05, o.ach * 1.05);
    var gap = n.rev - b.target;
    var gapText = gap >= 0 ? '已達成年度目標，超出 NT$ ' + nf(gap) : '距離年度目標還差 NT$ ' + nf(-gap);
    var newShare = n.rev ? n.newAmt / n.rev : 0;

    var fmt = { m: nf, n: nf, p: pcn };
    var tagText = { adj: '可調', link: '連動', fix: '固定' };
    function row(label, t, kind, ov, nv) {
      return '<div class="tr"><span class="lbl">' + label + '<span class="t t-' + t + '">' + tagText[t] + '</span></span>' +
        '<span class="r" style="color:#556677">' + fmt[kind](ov) + '</span>' +
        '<span class="r" style="font-weight:700">' + fmt[kind](nv) + '</span>' +
        '<span class="r" style="font-weight:600;color:' + (t === 'fix' ? FLAT : dColor(kind, ov, nv)) + '">' + (t === 'fix' ? '—' : dText(kind, ov, nv)) + '</span></div>';
    }
    var rows = [
      m.person ? null : row('營收月目標', 'fix', 'm', b.target, b.target),
      row(m.person ? '當月銷售業績' : '營收月達成', 'link', 'm', o.rev, n.rev),
      m.person ? null : row('營收達成率', 'link', 'p', o.ach, n.ach),
      row('當月開卡比率', 'fix', 'p', o.cardRate, o.cardRate),
      row('預約數（月平均）', 'adj', 'n', base.visitors / m.f, a.visitors / m.f),
      row('到店服務人次', 'adj', 'n', base.visitors / m.coef, a.visitors / m.coef),
      row('到店來客數', 'adj', 'n', base.visitors, a.visitors),
      row('到店新客數', 'adj', 'n', base.newV, a.newV),
      row('到店舊客數', 'link', 'n', o.oldV, n.oldV),
      row('到店消費人數', 'link', 'n', o.deals, n.deals),
      row('平均成交率', 'link', 'p', o.closeRate, n.closeRate),
      row('總平均客單', 'link', 'm', o.aov, n.aov),
      row('新客成交率', 'adj', 'p', base.newRate, a.newRate),
      row('新客成交數', 'link', 'n', o.newDeals, n.newDeals),
      row('新客平均客單', 'adj', 'm', base.newAov, a.newAov),
      row('新客消費金額', 'link', 'm', o.newAmt, n.newAmt),
      row('舊客成交率', 'adj', 'p', base.oldRate, a.oldRate),
      row('舊客成交數', 'link', 'n', o.oldDeals, n.oldDeals),
      row('舊客平均客單', 'adj', 'm', base.oldAov, a.oldAov),
      row('舊客消費金額', 'link', 'm', o.oldAmt, n.oldAmt),
      row('當月消耗金額', 'fix', 'm', b.burn, b.burn)
    ].filter(Boolean).join('');

    return personStrip(m) +
      '<div class="row">' +
        '<div class="card kpi"><p class="label">' + (m.person ? '推算年度個人業績' : '推算年度營收達成') + '</p><p class="big">NT$ ' + nf(n.rev) + '</p>' +
          '<p class="small">報表目前 NT$ ' + nf(o.rev) + '（資料截至 ' + asShort + '）</p>' +
          '<p class="kchip" style="color:' + revColor + '">' + revDelta + '</p></div>' +
        (m.person ? '' : '<div class="card kpi"><p class="label">推算年度營收達成率</p><p class="big">' + pc(n.ach) + '</p>' +
          '<div class="bar" role="img" aria-label="年度達成率 ' + pc(n.ach) + '，報表目前 ' + pc(o.ach) + '">' +
            '<div class="fill" style="width:' + (Math.min(n.ach / S_, 1) * 100).toFixed(2) + '%"></div>' +
            '<div class="orig" style="left:' + (Math.min(o.ach / S_, 1) * 100).toFixed(2) + '%"></div>' +
            '<div class="goal" style="left:' + (Math.min(1 / S_, 1) * 100).toFixed(2) + '%"></div></div>' +
          '<p class="small13">淺線為報表目前 ' + pc(o.ach) + '，虛線為年度目標 NT$ ' + nf(b.target) + '</p>' +
          '<p class="status">' + gapText + '</p></div>') +
      '</div>' +
      '<div class="row">' +
        '<div class="card mini"><p class="label">當月開卡比率</p><p class="num">' + pcn(o.cardRate) + '</p><p class="foot">獨立係數，不隨調整連動</p></div>' +
        '<div class="card mini"><p class="label">平均成交率</p><p class="num">' + pc(n.closeRate) + '</p><p class="foot">報表目前 ' + pc(o.closeRate) + '</p></div>' +
        '<div class="card mini"><p class="label">總平均客單</p><p class="num">NT$ ' + nf(n.aov) + '</p><p class="foot">報表目前 NT$ ' + nf(o.aov) + '</p></div>' +
      '</div>' +
      '<div class="card panel"><h2>新客與舊客的營收組成</h2>' +
        '<div class="comp" role="img" aria-label="新客營收占 ' + pc(newShare) + '，舊客營收占 ' + pc(1 - newShare) + '"><div class="n" style="width:' + (newShare * 100).toFixed(2) + '%"></div><div class="o"></div></div>' +
        '<div class="legend"><span><span class="sw" style="background:#7C9BB2"></span>新客 NT$ ' + nf(n.newAmt) + '（' + pc(newShare) + '）</span>' +
        '<span><span class="sw" style="background:#3F5A70"></span>舊客 NT$ ' + nf(n.oldAmt) + '（' + pc(1 - newShare) + '）</span></div></div>' +
      '<div class="card panel"><h2>連動明細</h2><p class="sub">金額單位為元；標示「固定」的項目維持報表原值，不隨調整變動</p>' +
        '<div class="tablewrap"><div class="tbl"><div class="tr th"><span>指標</span><span class="r">報表目前</span><span class="r">推算後</span><span class="r">差異</span></div>' + rows + '</div></div></div>';
  }
  function update() {
    var m = model();
    defsOf(m).forEach(function (d) {
      var v = d.get(m.a), bv = d.get(m.base), id = function (p) { return document.getElementById(p + '-' + d.k); };
      id('val').textContent = show(d, v);
      id('lbl').textContent = d.k === 'book' ? '預約數（月平均，週均 ' + nf(v * m.t.months / m.t.weeks) + '）' : d.name + (d.avg ? '（月均 ' + nf(v / m.t.months) + '）' : '');
      id('orig').textContent = '報表目前 ' + show(d, bv);
      var inp = id('ctl'); inp.min = d.min; inp.max = d.max; inp.value = v;
      var txt = '未調整', color = FLAT;
      if (d.kind === 'p') {
        var dd = (v - bv) * 100;
        if (Math.abs(dd) >= 0.05) { txt = (dd > 0 ? '+' : '−') + Math.abs(dd).toFixed(1) + ' pt'; color = dd > 0 ? UP : DOWN; }
      } else if (bv) {
        var r = v / bv - 1;
        if (Math.abs(r) >= 0.0005) { txt = (r > 0 ? '+' : '−') + (Math.abs(r) * 100).toFixed(1) + '%'; color = r > 0 ? UP : DOWN; }
      }
      var chip = id('chip'); chip.textContent = txt; chip.style.color = color;
      var note = id('note');
      if (d.note) { note.textContent = d.note; note.hidden = false; }
    });
    $('#forecastText').textContent = forecastText(m);
    $('#unitLabel').textContent = '目前對象：' + m.br.name + ' · ' + (m.person ? m.b.name : '分院整體');
    $('#results').innerHTML = resultsHTML(m);
  }
  function fmtDate(s) { var p = s.split('-'); return p[0] + '/' + Number(p[1]) + '/' + Number(p[2]); }
  function render(full) {
    var state = $('#state'), main = $('#main');
    var banner = $('#banner');
    banner.hidden = !S.banner;
    $('#bannerText').textContent = S.banner;
    $('#lock').hidden = S.status !== 'locked';
    $('#logoutBtn').hidden = !S.viewPwd;
    if (S.status === 'locked') {
      main.hidden = true; state.hidden = true; $('#pills').innerHTML = ''; $('#asof').textContent = '';
      return;
    }
    if (!S.data || !S.data.branches || !S.data.branches.length) {
      main.hidden = true; $('#pills').innerHTML = ''; $('#asof').textContent = '';
      state.hidden = false;
      state.textContent = S.status === 'loading' ? '資料載入中…' : (S.status === 'error' ? '無法讀取雲端資料，請稍後重新整理或聯絡管理者。' : '尚未上傳報表資料，請管理者登入後上傳。');
      return;
    }
    state.hidden = true; main.hidden = false;
    if (!S.branch || !S.data.branches.some(function (b) { return b.name === S.branch; })) { S.branch = S.data.branches[0].name; full = true; }
    var up = S.data.uploadedAtText ? '（上傳時間 ' + S.data.uploadedAtText + '）' : '';
    $('#asof').textContent = '報表資料截至 ' + fmtDate(S.data.asOf) + up;
    if (full) { renderPills(); renderScope(); buildControls(); }
    update();
  }

  /* ===== 報表解析（.xls / .xlsx） ===== */
  var KEYS = { '營收月目標': 'target', '營收月達成': 'rev', '當月開卡業績': 'card', '到店來客數': 'visitors', '到店新客數': 'newV', '新客成交數': 'newDeals', '新客消費金額': 'newAmt', '舊客成交數': 'oldDeals', '舊客消費金額': 'oldAmt', '當月消耗金額': 'burn' };
  var MONTH_KEYS = ['visitors', 'newV', 'newDeals', 'newAmt', 'oldDeals', 'oldAmt', 'rev'];
  var STAFF_KEYS = { '當月銷售業績': 'rev', '當月開卡業績': 'card', '到店來客數': 'visitors', '到店新客數': 'newV', '新客成交數': 'newDeals', '新客消費金額': 'newAmt', '舊客成交數': 'oldDeals', '舊客消費金額': 'oldAmt', '當月消耗金額': 'burn' };
  function parseStaff(wb) {
    var ws = wb.Sheets[wb.SheetNames[1]];
    if (!ws) return {};
    var rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    var hr = -1;
    rows.forEach(function (r, i) { if (hr < 0 && r.some(function (v) { return typeof v === 'string' && v.indexOf('到職日') >= 0; })) hr = i; });
    if (hr < 2) return {};
    var nameRow = rows[hr - 1], brRow = rows[hr - 2], hireRow = rows[hr];
    var cols = [], curBr = null;
    for (var j = 2; j < nameRow.length; j++) {
      var bc = brRow[j];
      if (typeof bc === 'string' && bc.trim()) curBr = bc.split(/\n/)[0].trim();
      var nc = nameRow[j];
      if (typeof nc !== 'string' || !nc.trim()) continue;
      var lines = nc.split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean);
      var mm = /^(.*?)-\(.*\)$/.exec(lines[0]);
      var hm = /到職日\s*:\s*(\d{4}-\d{2}-\d{2})/.exec(String(hireRow[j] || ''));
      cols.push({ j: j, branch: curBr, person: { name: (mm ? mm[1] : lines[0]).trim(), title: lines[1] || '', hire: hm ? hm[1] : null } });
    }
    for (var i = hr + 1; i < rows.length; i++) {
      var lab = rows[i][1], k = typeof lab === 'string' ? STAFF_KEYS[lab.trim()] : null;
      if (!k) continue;
      cols.forEach(function (c) { c.person[k] = Number(rows[i][c.j]) || 0; });
    }
    var out = {};
    cols.forEach(function (c) {
      if (!c.branch) return;
      Object.keys(STAFF_KEYS).forEach(function (x) { if (typeof c.person[STAFF_KEYS[x]] !== 'number') c.person[STAFF_KEYS[x]] = 0; });
      (out[c.branch] = out[c.branch] || []).push(c.person);
    });
    return out;
  }
  function parseWorkbook(wb) {
    var branches = parseReport(wb), st = parseStaff(wb), n = 0;
    branches.forEach(function (b) { if (st[b.name] && st[b.name].length) { b.staff = st[b.name]; n += b.staff.length; } });
    return { branches: branches, staffCount: n };
  }
  function parseReport(wb) {
    var ws = wb.Sheets[wb.SheetNames[0]];
    var rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    var hr = -1, ac = -1;
    rows.forEach(function (r, i) {
      if (hr >= 0) return;
      r.forEach(function (v, j) { if (hr < 0 && typeof v === 'string' && v.indexOf('年度') >= 0) { hr = i; ac = j; } });
    });
    if (hr < 0) throw new Error('找不到「年度」欄位，請確認是「營運績效報表」。');
    var monthCols = [];
    rows[hr].forEach(function (v, j) {
      if (j >= ac) return;
      var mm = /^\d{6}$/.test(String(v)) ? Number(String(v).slice(4)) : 0;
      if (mm >= 1 && mm <= 12) monthCols.push({ j: j, m: mm });
    });
    var out = [], cur = null;
    for (var i = hr + 1; i < rows.length; i++) {
      var r = rows[i], bn = r[1], lab = r[2];
      if (typeof bn === 'string' && bn.trim()) {
        cur = { name: bn.trim(), months: monthCols.map(function (c) { return { m: c.m }; }) };
        out.push(cur);
      }
      if (cur && typeof lab === 'string') {
        var k = KEYS[lab.trim()];
        if (k) {
          cur[k] = Number(r[ac]);
          if (MONTH_KEYS.indexOf(k) >= 0) monthCols.forEach(function (c, ci) { cur.months[ci][k] = Number(r[c.j]) || 0; });
        }
      }
    }
    var need = Object.keys(KEYS).map(function (x) { return KEYS[x]; });
    out.forEach(function (b) {
      need.forEach(function (k) { if (typeof b[k] !== 'number' || isNaN(b[k])) throw new Error('「' + b.name + '」缺少或無法讀取欄位：' + k); });
      if (b.visitors < b.newV) throw new Error('「' + b.name + '」到店新客數大於到店來客數，請確認報表。');
    });
    if (!out.length) throw new Error('沒有讀到任何分院資料。');
    return out;
  }

  /* ===== 雲端（Firebase） ===== */
  function configured() {
    var c = window.FIREBASE_CONFIG;
    return !!(c && c.apiKey && !/YOUR/i.test(c.apiKey) && c.projectId && !/YOUR/i.test(c.projectId));
  }
  function stampText(ts) {
    try {
      var d = ts && ts.toDate ? ts.toDate() : null;
      if (!d) return '';
      var z = function (x) { return String(x).padStart(2, '0'); };
      return d.getFullYear() + '/' + z(d.getMonth() + 1) + '/' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes());
    } catch (e) { return ''; }
  }
  var STORE_KEY = 'clinicrev_view_pwd';
  function ssGet() { try { return sessionStorage.getItem(STORE_KEY); } catch (e) { return null; } }
  function ssSet(v) { try { if (v) sessionStorage.setItem(STORE_KEY, v); else sessionStorage.removeItem(STORE_KEY); } catch (e) {} }
  function vaultRef(pwd) { return S.fb.fs.doc(S.fb.db, 'vault', pwd); }
  function showLock(msg) {
    if (S.unsub) { S.unsub(); S.unsub = null; }
    S.viewPwd = null; S.data = null; S.params = null; S.adj = {}; S.dataKey = ''; S.status = 'locked'; ssSet(null);
    $('#viewPwdIn').value = ''; setMsg('#enterMsg', msg || '');
    render(true);
  }
  function listen(pwd) {
    var fs = S.fb.fs;
    if (S.unsub) S.unsub();
    S.unsub = fs.onSnapshot(vaultRef(pwd), function (snap) {
      if (!snap.exists()) { showLock('進入密碼已更新，請重新輸入。'); return; }
      var v = snap.data() || {}, d = v.data || null;
      if (d) d.uploadedAtText = stampText(d.uploadedAt);
      var key = d ? d.asOf + '|' + d.uploadedAtText + '|' + (d.branches || []).length : '';
      if (key !== S.dataKey) { S.adj = {}; S.dataKey = key; }
      S.data = d; S.params = v.params || null; S.status = 'ready';
      render(true);
    }, function () { S.status = 'error'; S.data = null; render(true); });
  }
  async function tryEnter(pwd, silent) {
    if (!pwd || pwd.indexOf('/') >= 0) { if (!silent) setMsg('#enterMsg', '請輸入進入密碼。', 'err'); return false; }
    try {
      var snap = await S.fb.fs.getDoc(vaultRef(pwd));
      if (!snap.exists()) { if (silent) showLock(); else setMsg('#enterMsg', '密碼錯誤，請再試一次。', 'err'); return false; }
    } catch (e) {
      if (silent) showLock(); else setMsg('#enterMsg', '無法連線到雲端，請稍後再試。', 'err');
      return false;
    }
    S.viewPwd = pwd; ssSet(pwd); S.status = 'loading'; render(true); listen(pwd);
    return true;
  }
  async function initCloud() {
    if (!configured()) {
      S.data = SEED; S.status = 'ready';
      S.banner = '尚未連接雲端資料庫（Firebase），目前顯示內建範例資料，管理功能暫時無法使用。';
      render(true); return;
    }
    try {
      var app = await imp(FB_APP), fs = await imp(FB_FS);
      var db = fs.getFirestore(app.initializeApp(window.FIREBASE_CONFIG));
      S.fb = { fs: fs, db: db };
      var saved = ssGet();
      if (saved) await tryEnter(saved, true); else showLock();
    } catch (e) { S.status = 'error'; render(true); }
  }
  async function gateBatch(pwd, writes) {
    var fs = S.fb.fs, db = S.fb.db, batch = fs.writeBatch(db);
    batch.set(fs.doc(db, 'gate', pwd), { ts: fs.serverTimestamp() });
    writes(batch, fs, db);
    await batch.commit();
  }

  /* ===== 管理視窗 ===== */
  function branchNames() {
    if (S.data && S.data.branches) return S.data.branches.map(function (b) { return b.name; });
    return Object.keys(DEFAULT_PARAMS.coef);
  }
  function fillParams(useDefault) {
    $('#ptbody').innerHTML = branchNames().map(function (n, i) {
      var c = useDefault ? (DEFAULT_PARAMS.coef[n] != null ? DEFAULT_PARAMS.coef[n] : FALLBACK.coef) : P('coef', n);
      var r = useDefault ? (DEFAULT_PARAMS.rate[n] != null ? DEFAULT_PARAMS.rate[n] : FALLBACK.rate) : P('rate', n);
      return '<tr><td>' + esc(n) + '</td><td><input type="number" step="0.1" min="1" max="100" data-kind="coef" data-name="' + esc(n) + '" value="' + (c * 100).toFixed(1).replace(/\.0$/, '') + '" aria-label="' + esc(n) + ' 人次推估係數"></td>' +
        '<td><input type="number" step="0.1" min="1" max="100" data-kind="rate" data-name="' + esc(n) + '" value="' + (r * 100).toFixed(1).replace(/\.0$/, '') + '" aria-label="' + esc(n) + ' 到店率"></td></tr>';
    }).join('');
  }
  function fillPeak(useDefault) { $('#peakIn').value = (useDefault ? DEFAULT_PEAK : peakMonths()).join(','); }
  function openAdminBody() {
    $('#adminLock').hidden = true; $('#adminBody').hidden = false;
    $('#adminInit').hidden = !!S.viewPwd; $('#adminFull').hidden = !S.viewPwd;
    if (S.viewPwd) { fillParams(false); fillPeak(false); }
  }
  function setMsg(id, text, cls) { var el = $(id); el.textContent = text; el.className = 'msg' + (cls ? ' ' + cls : ''); }
  function localDate(ms) {
    var d = new Date(ms), z = function (x) { return String(x).padStart(2, '0'); };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }

  function bind() {
    $('#ver').textContent = '程式版本 ' + APP_VERSION;
    $('#pills').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-name]'); if (!b) return;
      S.branch = b.dataset.name; S.person = 0; renderPills(); renderScope(); buildControls(); update();
    });
    $('#controls').addEventListener('input', function (e) {
      if (e.target.matches('input[type=range]')) apply(e.target.dataset.k, parseFloat(e.target.value));
    });
    $('#controls').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act]'); if (!b) return;
      var m = model(), d = defsOf(m).filter(function (z) { return z.k === b.dataset.k; })[0];
      apply(d.k, d.get(m.a) + (b.dataset.act === 'inc' ? d.step : -d.step));
    });
    $('#scBranch').addEventListener('click', function () { S.scope = 'branch'; renderScope(); buildControls(); update(); });
    $('#scPerson').addEventListener('click', function () { S.scope = 'person'; renderScope(); buildControls(); update(); });
    $('#personSel').addEventListener('change', function (e) { S.person = Number(e.target.value) || 0; buildControls(); update(); });
    $('#resetBtn').addEventListener('click', function () { S.adj[curUnit().key] = {}; update(); });
    $('#forecastBtn').addEventListener('click', function () {
      var m = model();
      S.adj[m.key] = forecastAdj(m); update();
    });

    var dlg = $('#adminDlg');
    $('#adminBtn').addEventListener('click', function () {
      if (!S.fb) { alert('尚未連接雲端資料庫（Firebase），請先完成 firebase-config.js 設定。'); return; }
      if (S.pwd) { openAdminBody(); }
      else { $('#adminLock').hidden = false; $('#adminBody').hidden = true; $('#pwd').value = ''; setMsg('#lockMsg', ''); }
      dlg.showModal();
    });
    $('#adminClose').addEventListener('click', function () { dlg.close(); });
    async function unlock() {
      var pwd = $('#pwd').value.trim();
      if (!pwd || pwd.indexOf('/') >= 0) { setMsg('#lockMsg', '請輸入管理密碼。', 'err'); return; }
      setMsg('#lockMsg', '驗證中…');
      try {
        var fs = S.fb.fs;
        await fs.setDoc(fs.doc(S.fb.db, 'gate', pwd), { ts: fs.serverTimestamp() });
        S.pwd = pwd; openAdminBody();
      } catch (e) { setMsg('#lockMsg', '密碼錯誤，或無法連線到雲端。', 'err'); }
    }
    $('#unlockBtn').addEventListener('click', unlock);
    $('#pwd').addEventListener('keydown', function (e) { if (e.key === 'Enter') unlock(); });

    $('#file').addEventListener('change', async function (e) {
      var f = e.target.files[0]; S.parsed = null; $('#publishBtn').disabled = true; setMsg('#upMsg', '');
      if (!f) { $('#upPreview').textContent = ''; return; }
      try {
        var wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
        var pw = parseWorkbook(wb), branches = pw.branches;
        S.parsed = { branches: branches, fileName: f.name };
        $('#upAsOf').value = localDate(f.lastModified);
        $('#upPreview').innerHTML = '讀到 ' + branches.length + ' 間分院：' + branches.map(function (b) { return esc(b.name) + '（年度營收 ' + nf(b.rev) + '）'; }).join('、') + (pw.staffCount ? '。另讀到個人資料 ' + pw.staffCount + ' 位同仁。' : '。未讀到個人資料（工作表2）。');
        $('#publishBtn').disabled = false;
      } catch (err) { $('#upPreview').textContent = ''; setMsg('#upMsg', '讀取失敗：' + err.message, 'err'); }
    });
    $('#publishBtn').addEventListener('click', async function () {
      var asOf = $('#upAsOf').value;
      if (!S.parsed) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) { setMsg('#upMsg', '請選擇資料截至日期。', 'err'); return; }
      setMsg('#upMsg', '發布中…');
      try {
        var payload = { asOf: asOf, fileName: S.parsed.fileName, branches: S.parsed.branches };
        await gateBatch(S.pwd, function (batch, fs, db) {
          payload.uploadedAt = fs.serverTimestamp();
          batch.set(fs.doc(db, 'vault', S.viewPwd), { data: payload }, { merge: true });
        });
        setMsg('#upMsg', '已發布。所有人開啟頁面即可看到新資料。', 'ok');
        $('#publishBtn').disabled = true; S.parsed = null; $('#file').value = '';
      } catch (err) { setMsg('#upMsg', '發布失敗，請確認密碼與雲端規則設定。', 'err'); }
    });
    $('#enterBtn').addEventListener('click', function () { tryEnter($('#viewPwdIn').value.trim(), false); });
    $('#viewPwdIn').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryEnter($('#viewPwdIn').value.trim(), false); });
    $('#logoutBtn').addEventListener('click', function () { showLock(''); });
    $('#initBtn').addEventListener('click', async function () {
      try {
        var fs = S.fb.fs, ref = fs.doc(S.fb.db, 'vault', '1234');
        var snap = await fs.getDoc(ref);
        if (snap.exists()) { setMsg('#initMsg', '預設密碼 1234 已經建立過了。'); return; }
        await gateBatch(S.pwd, function (batch, f, d) { batch.set(f.doc(d, 'vault', '1234'), { createdAt: f.serverTimestamp() }); });
        setMsg('#initMsg', '已建立。請關閉管理視窗，用 1234 進入網站，再開啟管理上傳報表。', 'ok');
      } catch (err) { setMsg('#initMsg', '建立失敗，請確認密碼與雲端規則設定。', 'err'); }
    });
    $('#newPwdBtn').addEventListener('click', async function () {
      var np = $('#newPwd').value.trim();
      if (!/^[A-Za-z0-9]{4,20}$/.test(np)) { setMsg('#newPwdMsg', '密碼請用 4 到 20 個英文字母或數字。', 'err'); return; }
      if (np === S.viewPwd) { setMsg('#newPwdMsg', '與目前的進入密碼相同。', 'err'); return; }
      setMsg('#newPwdMsg', '變更中…');
      var oldPwd = S.viewPwd;
      try {
        var fs = S.fb.fs, db = S.fb.db;
        var exist = await fs.getDoc(fs.doc(db, 'vault', np));
        if (exist.exists()) { setMsg('#newPwdMsg', '這組密碼已被使用，請換一組。', 'err'); return; }
        var cur = await fs.getDoc(vaultRef(oldPwd));
        var payload = cur.data() || {};
        if (S.unsub) { S.unsub(); S.unsub = null; }
        await gateBatch(S.pwd, function (batch, f, d) { batch.set(f.doc(d, 'vault', np), payload); batch.delete(f.doc(d, 'vault', oldPwd)); });
        S.viewPwd = np; ssSet(np); listen(np); $('#newPwd').value = '';
        setMsg('#newPwdMsg', '已變更，之後請用新密碼進入網站。', 'ok');
      } catch (err) {
        listen(oldPwd);
        setMsg('#newPwdMsg', '變更失敗，請確認管理密碼與雲端規則設定。', 'err');
      }
    });
    $('#paramDefault').addEventListener('click', function () { fillParams(true); fillPeak(true); setMsg('#paramMsg', '已帶入預設值，按「儲存參數」才會生效。'); });
    $('#paramSave').addEventListener('click', async function () {
      var coef = {}, rate = {}, bad = false;
      document.querySelectorAll('#ptbody input').forEach(function (i) {
        var v = parseFloat(i.value);
        if (isNaN(v) || v < 1 || v > 100) { bad = true; return; }
        (i.dataset.kind === 'coef' ? coef : rate)[i.dataset.name] = v / 100;
      });
      if (bad) { setMsg('#paramMsg', '請輸入 1 到 100 之間的百分比。', 'err'); return; }
      var peak = $('#peakIn').value.split(/[,，、\s]+/).filter(Boolean).map(Number);
      if (peak.some(function (x) { return !(x >= 1 && x <= 12) || x % 1 !== 0; })) { setMsg('#paramMsg', '大檔期月份請填 1 到 12 的整數，用逗號分隔。', 'err'); return; }
      peak = peak.filter(function (x, i) { return peak.indexOf(x) === i; }).sort(function (a, b) { return a - b; });
      setMsg('#paramMsg', '儲存中…');
      try {
        await gateBatch(S.pwd, function (batch, fs, db) { batch.set(fs.doc(db, 'vault', S.viewPwd), { params: { coef: coef, rate: rate, peak: peak, updatedAt: fs.serverTimestamp() } }, { merge: true }); });
        setMsg('#paramMsg', '已儲存，所有人的頁面會即時套用。', 'ok');
      } catch (err) { setMsg('#paramMsg', '儲存失敗，請確認密碼與雲端規則設定。', 'err'); }
    });
  }

  if (typeof document !== 'undefined' && document.getElementById('main')) {
    bind();
    initCloud();
  }
  if (typeof window !== 'undefined') window.__App = { parseReport: parseReport, parseStaff: parseStaff, parseWorkbook: parseWorkbook, timeInfo: timeInfo, S: S, model: model, defsOf: defsOf, apply: apply, render: render };
})();
