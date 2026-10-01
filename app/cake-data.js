/* Prices in centavos. Recipe quantities below are explicit demo fixtures. */
(() => {
const A=K406;
A.cakeData={categories:['shape','flavor','size','color','icing'],options:[
 ['round','shape','Round',10000,'A classic layered cake',{flour:100}],['heart','shape','Heart',18000,'A sculpted celebration',{flour:130}],
 ['vanilla','flavor','Vanilla',30000,'Soft vanilla sponge',{vanilla:10}],['chocolate','flavor','Chocolate',38000,'Rich chocolate sponge',{cocoa:80}],
 ['six','size','6 inch',25000,'Serves 6–8',{flour:250}],['eight','size','8 inch',40000,'Serves 12–16',{flour:450}],
 ['cream','color','Cream',0,'Natural cream finish',{}],['pink','color','Pink',4000,'A soft pink palette',{tint:2}],
 ['buttercream','icing','Buttercream',22000,'Smooth buttercream finish',{butter:200}],['ganache','icing','Chocolate ganache',28000,'Currently unavailable',{cocoa:150}]
 ].map(([id,type,name,price,description,ingredients])=>({id,type,name,price,description,ingredients,available:id!=='ganache'})),
 addons:[{id:'decoration',name:'Chocolate decoration',price:10000,description:'Chocolate shards and decorative accents',available:true,ingredients:{cocoa:30}}],
 stock:{flour:10000,vanilla:1000,cocoa:5000,tint:100,butter:5000},
 config:{maxPerWeek:2,maxPerDay:1,leadDays:5,cutoffHour:16,cities:['Cebu City','Mandaue City','Lapu-Lapu City','Talisay City','Consolacion'],windows:{morning:'Morning · 9:00 AM–12:00 PM',afternoon:'Afternoon · 1:00–4:00 PM',evening:'Early evening · 4:30–6:30 PM'},windowOverrides:{}}
};
})();
