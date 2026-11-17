/* Prices in centavos. Recipe quantities below are explicit demo fixtures. */
(() => {
const A=K406;
A.cakeData={categories:['shape','size','flavor','color','icing'],options:[
 ['round','shape','Round',10000,'A classic layered cake',{flour:100}],['heart','shape','Heart',18000,'A sculpted celebration',{flour:130}],
 ['vanilla','flavor','Vanilla',30000,'Soft vanilla sponge',{vanilla:10}],['chocolate','flavor','Chocolate',38000,'Rich chocolate sponge',{cocoa:80}],
 ['marble','flavor','Marble',36000,'Vanilla and chocolate swirls',{vanilla:6,cocoa:40}],['red-velvet','flavor','Red velvet',40000,'Velvety sponge with light cocoa',{cocoa:30,vanilla:5,tint:2}],
 ['six','size','6 inch',25000,'Serves 6–8',{flour:250}],['eight','size','8 inch',40000,'Serves 12–16',{flour:450}],
 ['cream','color','Cream',0,'Natural cream finish',{}],['pink','color','Pink',4000,'A soft pink palette',{tint:2}],
 ['sage','color','Sage green',4000,'A muted botanical green',{tint:2}],['blue','color','Sky blue',4000,'A light blue finish',{tint:2}],
 ['buttercream','icing','Buttercream',22000,'Smooth buttercream finish',{butter:200}],['ganache','icing','Chocolate ganache',28000,'Rich chocolate coating',{cocoa:150}],
 ['vanilla-glaze','icing','Vanilla glaze',18000,'A light vanilla coating',{vanilla:10,butter:50}],['chocolate-buttercream','icing','Chocolate buttercream',26000,'Creamy chocolate finish',{butter:200,cocoa:60}]
 ].map(([id,type,name,price,description,ingredients])=>({id,type,name,price,description,ingredients,available:id!=='ganache'})),
 addons:[{id:'decoration',name:'Chocolate decoration',price:10000,description:'Chocolate shards and decorative accents',available:true,ingredients:{cocoa:30}}],
 stock:{flour:10000,vanilla:1000,cocoa:5000,tint:100,butter:5000},
 config:{maxPerWeek:2,maxPerDay:1,leadDays:7,cutoffHour:12,cities:['Cebu City','Mandaue City','Lapu-Lapu City','Talisay City','Consolacion']}
};
})();
