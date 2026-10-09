/* Owner composition uses the application's brand and shared primitives. */
(() => {
const A=K406,U=A.ui,E=A.escape;
const V=A.ownerUI={};
V.button=(action,label,extra='',primary=false)=>U.button({action,label,extra,namespace:'owner',variant:primary?'primary':''});
V.link=(path,label)=>`<a class="btn" href="#/owner${path?'/'+E(path):''}">${E(label)}</a>`;
V.field=(name,label,value='',type='text',extra='')=>U.field({name,label,value,type,extra,prefix:'owner'});
V.select=(name,label,options,value,extra='')=>`<div class="field"><label for="owner-${E(name)}">${E(label)}</label><select id="owner-${E(name)}" name="${E(name)}" ${extra}>${options.map(([v,l])=>`<option value="${E(v)}" ${String(v)===String(value)?'selected':''}>${E(l)}</option>`).join('')}</select></div>`;
V.panel=(title,body,actions='')=>U.panel({title,bodyHtml:body,actionsHtml:actions});
V.intro=(title,subtitle,actionsHtml='')=>U.pageIntro({title,subtitle,actionsHtml});
V.table=U.table;V.badge=s=>U.badge(String(s||'Not recorded').replaceAll('_',' ').replaceAll('-',' '));
V.money=n=>Number.isFinite(n)?A.commerce.money(n):'Not recorded';
V.date=n=>n?A.commerce.ui.date(n):'—';
V.stamp=n=>{if(!n)return 'Not recorded';const d=new Date(n);return Number.isNaN(d.getTime())?String(n):d.toLocaleString('en-PH',{timeZone:'Asia/Manila'});};
V.businessDate=n=>{const d=new Date(n);return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);};
V.error=()=>'<p class="field-error owner-error" role="alert"></p>';
V.collectionFilters=(types=[],extra='')=>{const f=A.owner.filters;return `<form class="staff-toolbar" data-owner-form="filter">${V.field('query','Search',f.query,'search')}${types.length?V.select('type','Type',[['all','All types'],...types],f.type):''}${extra}${V.select('sort','Sort',[['name','Name A–Z'],['name-desc','Name Z–A']],f.sort||'name')}<button class="btn">Apply filters</button>${V.button('clear-filters','Clear filters')}${V.error()}</form>`;};
V.form=(kind,body,extra='',label='Save changes')=>`<form data-owner-form="${kind}" class="staff-form" ${extra}>${body}${V.error()}<button class="btn primary" type="submit">${E(label)}</button></form>`;
V.filters=(types=[],extra='')=>{const f=A.owner.filters;return `<form class="staff-toolbar" data-owner-form="filter">${V.field('query','Search',f.query,'search')}${types.length?V.select('type','Type',[['all','All types'],...types],f.type):''}${extra}${V.field('from','From date',f.from,'date')}${V.field('to','Through date',f.to,'date')}${V.select('sort','Sort',[['newest','Newest first'],['oldest','Oldest first']],f.sort)}<button class="btn">Apply filters</button>${V.button('clear-filters','Clear filters')}${V.error()}</form>`;};
V.filtered=(rows,text,date,type)=>{const f=A.owner.filters;return rows.filter(r=>(!f.query||text(r).toLowerCase().includes(f.query.toLowerCase()))&&(!type||f.type==='all'||type(r)===f.type)&&(!f.from||date(r)>=f.from)&&(!f.to||date(r)<=f.to)).sort((a,b)=>(date(a)||'').localeCompare(date(b)||'')*(f.sort==='oldest'?1:-1));};
V.paged=(rows,render)=>{const O=A.owner,pages=Math.max(1,Math.ceil(rows.length/10));O.page=Math.max(1,Math.min(O.page,pages));return render(rows.slice((O.page-1)*10,O.page*10))+`<div class="staff-pager">${V.button('previous','Previous',O.page===1?'disabled':'')}<span>Page ${O.page} of ${pages} · ${rows.length} results</span>${V.button('next','Next',O.page===pages?'disabled':'')}</div>`;};
})();
