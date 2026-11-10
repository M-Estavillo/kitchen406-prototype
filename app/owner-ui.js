/* Owner composition uses the application's brand and shared primitives. */
(() => {
const A=K406,U=A.ui,E=A.escape;
const V=A.ownerUI={};
V.button=(action,label,extra='',primary=false)=>U.button({action,label,extra,namespace:'owner',variant:primary?'primary':''});
V.link=(path,label)=>{path=path.replace(/^(payments|deliveries)(?:\/(.*))?$/,(_,view,id)=>'orders/'+(id||view));return `<a class="btn" href="#/owner${path?'/'+E(path):''}">${E(label)}</a>`;};
V.field=(name,label,value='',type='text',extra='')=>U.field({name,label,value,type,extra,prefix:'owner'});
V.select=(name,label,options,value,extra='')=>`<div class="field"><label for="owner-${E(name)}">${E(label)}</label><select id="owner-${E(name)}" name="${E(name)}" ${extra}>${options.map(([v,l])=>`<option value="${E(v)}" ${String(v)===String(value)?'selected':''}>${E(l)}</option>`).join('')}</select></div>`;
V.panel=(title,body,actions='')=>U.panel({title,bodyHtml:body,actionsHtml:actions});
V.intro=(title,subtitle,actionsHtml='')=>U.pageIntro({title,subtitle,actionsHtml});
// Owner-only placeholders: no live records or actionable controls while loading.
V.loading=(page,title,detail=false)=>{
 const repeat=(count,render)=>Array.from({length:count},(_,i)=>render(i)).join('');
 const bar=(kind='line')=>`<span class="owner-skeleton ${kind}"></span>`;
 const card=()=>`<div class="owner-loading-card">${bar('label')}${bar('value')}${bar('line')}</div>`;
 const fields=()=>`<div class="owner-loading-fields">${repeat(4,()=>`<div>${bar('label')}${bar('control')}</div>`)}</div>`;
 const table=()=>`<div class="owner-loading-table"><div class="owner-loading-row heading">${repeat(4,()=>bar('label'))}</div>${repeat(5,()=>`<div class="owner-loading-row">${repeat(4,(_,)=>`<div>${bar('line')}${bar('short')}</div>`)}</div>`)}</div><div class="owner-loading-pager">${bar('control')}${bar('label')}${bar('control')}</div>`;
 const calendar=()=>`<div class="owner-loading-card">${fields()}<div class="owner-loading-calendar ${A.owner.calendarMode==='day'?'day':''}">${repeat(A.owner.calendarMode==='month'?35:A.owner.calendarMode==='day'?1:7,()=>`<div>${bar('short')}${bar('line')}${bar('line')}</div>`)}</div></div>`;
 let content;
 if(detail)content=`<div class="owner-loading-stats">${repeat(2,card)}</div><div class="owner-loading-card">${fields()}${table()}</div>`;
 else if(page==='')content=`<div class="owner-loading-stats">${repeat(4,card)}</div><div class="owner-loading-columns">${repeat(2,()=>`<div class="owner-loading-card">${bar('label')}${repeat(4,()=>`<div class="owner-loading-item">${bar('line')}${bar('short')}</div>`)}</div>`)}</div>`;
 else if(page==='capacity'||page==='scheduling')content=calendar()+`<div class="owner-loading-stats">${repeat(page==='capacity'?3:2,card)}</div>`+(page==='scheduling'?`<div class="owner-loading-card">${fields()}${fields()}</div>`:'');
 else if(page==='recipes')content=`${fields()}<div class="owner-loading-columns"><div class="owner-loading-card">${bar('label')}${table()}</div><div class="owner-loading-card">${bar('label')}${repeat(4,()=>`<div class="owner-loading-item">${bar('line')}${bar('value')}</div>`)}</div></div>`;
 else content=(page==='orders'?`<div class="owner-loading-tabs">${repeat(5,()=>bar('control'))}</div>`:'')+fields()+table();
 return V.intro(detail?title+' details':title,'')+`<div class="owner-loading-status" role="status">Loading ${E(title.toLowerCase())}${detail?' details':''}…</div><div class="owner-loading" aria-busy="true" aria-label="Loading content"><div aria-hidden="true">${content}</div></div>`;
};
V.table=U.table;V.badge=s=>U.badge(String(s||'Not recorded').replaceAll('_',' ').replaceAll('-',' '));
V.money=n=>Number.isFinite(n)?A.commerce.money(n):'Not recorded';
const unitMoney=new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:6});
V.unitMoney=n=>Number.isFinite(n)?unitMoney.format(n):'Not recorded';
V.date=n=>n?A.commerce.ui.date(n):'—';
V.stamp=n=>{if(!n)return 'Not recorded';const d=new Date(n);return Number.isNaN(d.getTime())?String(n):d.toLocaleString('en-PH',{timeZone:'Asia/Manila'});};
V.businessDate=n=>{const d=new Date(n);return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);};
V.error=()=>'<p class="field-error owner-error" role="alert"></p>';
V.form=(kind,body,extra='',label='Save changes')=>`<form data-owner-form="${kind}" class="staff-form" ${extra}>${body}${V.error()}<button class="btn primary" type="submit">${E(label)}</button></form>`;
V.filters=(types=[],extra='')=>{const f=A.owner.filters;return `<form class="staff-toolbar" data-owner-form="filter">${V.field('query','Search',f.query,'search')}${types.length?V.select('type','Type',[['all','All types'],...types],f.type):''}${extra}${V.field('from','From date',f.from,'date')}${V.field('to','Through date',f.to,'date')}${V.select('sort','Sort',[['newest','Newest first'],['oldest','Oldest first']],f.sort)}<button class="btn">Apply filters</button>${V.button('clear-filters','Clear filters')}${V.error()}</form>`;};
V.filtered=(rows,text,date,type,{dateRange=true}={})=>{const f=A.owner.filters;return rows.filter(r=>(!text||!f.query||text(r).toLowerCase().includes(f.query.toLowerCase()))&&(!type||f.type==='all'||type(r)===f.type)&&(!dateRange||((!f.from||date(r)>=f.from)&&(!f.to||date(r)<=f.to)))).sort((a,b)=>(date(a)||'').localeCompare(date(b)||'')*(f.sort==='oldest'?1:-1));};
V.paged=(rows,render,showCount=true,pageSize=10)=>{const O=A.owner,pages=Math.max(1,Math.ceil(rows.length/pageSize));O.page=Math.max(1,Math.min(O.page,pages));return render(rows.slice((O.page-1)*pageSize,O.page*pageSize))+`<div class="staff-pager">${V.button('previous','Previous',O.page===1?'disabled':'')}<span>Page ${O.page} of ${pages}${showCount?` · ${rows.length} results`: ''}</span>${V.button('next','Next',O.page===pages?'disabled':'')}</div>`;};
const rangeDraft={month:'',start:''};
const shortRangeDate=date=>date.slice(5,7)+'/'+date.slice(8,10)+'/'+date.slice(2,4);
const rangeLabel=()=>{const f=A.owner.filters;return f.from&&f.to?shortRangeDate(f.from)+' – '+shortRangeDate(f.to):f.from?'From '+shortRangeDate(f.from):f.to?'Through '+shortRangeDate(f.to):'Any date';};
V.compactFilters=(placeholder,extra='',className='',{dateRange=true}={})=>{const f=A.owner.filters;return `<div class="owner-order-filters ${className}">${placeholder?V.field('query','Search',f.query,'search',`placeholder="${E(placeholder)}"`):''}${dateRange?`<div class="field owner-order-range"><label id="owner-order-range-label">Date Range</label><details id="owner-order-range"><summary aria-labelledby="owner-order-range-label owner-order-range-value"><span id="owner-order-range-value">${E(rangeLabel())}</span><span aria-hidden="true">⌄</span></summary><div class="owner-range-popover" role="group" aria-label="Choose date range"></div></details></div>`:''}${extra}${V.select('sort','Sort',[['newest','Newest first'],['oldest','Oldest first']],f.sort)}${V.button('clear-filters','Clear filters')}</div>`;};
function renderRange(focusDate){
 const root=document.querySelector('.owner-range-popover');if(!root)return;
 const f=A.owner.filters,month=rangeDraft.month,first=new Date(month+'-01T00:00:00Z'),offset=first.getUTCDay(),count=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
 root.innerHTML=`<div class="owner-range-heading"><button type="button" data-order-range="prev" aria-label="Previous month">‹</button><strong>${first.toLocaleDateString('en-PH',{month:'long',year:'numeric',timeZone:'UTC'})}</strong><button type="button" data-order-range="next" aria-label="Next month">›</button></div><p role="status">${rangeDraft.start?'Start: '+E(V.date(rangeDraft.start))+'. Select an end date.':'Select a start date, then an end date.'}</p><div class="owner-range-grid">${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>`<span aria-hidden="true">${d}</span>`).join('')}${'<span></span>'.repeat(offset)}${Array.from({length:count},(_,i)=>{const date=month+'-'+String(i+1).padStart(2,'0'),selected=rangeDraft.start?date===rangeDraft.start:date===f.from||date===f.to,inside=!rangeDraft.start&&f.from&&f.to&&date>f.from&&date<f.to;return `<button type="button" data-order-range="day" data-date="${date}" aria-label="${E(V.date(date))}" aria-pressed="${selected}" ${date===A.schedule.today()?'aria-current="date"':''} class="${inside?'in-range':''}">${i+1}</button>`;}).join('')}</div>`;
 if(focusDate)root.querySelector(`[data-date="${focusDate}"]`)?.focus();
}
function closeRange(restoreFocus=false){const details=document.querySelector('#owner-order-range');if(details){details.open=false;if(restoreFocus)details.querySelector('summary').focus();}rangeDraft.start='';}
document.addEventListener('click',e=>{
 const details=document.querySelector('#owner-order-range');
 if(!details)return;
 if(!details.contains(e.target)){closeRange();return;}
 if(e.target.closest('summary')&&!details.open){rangeDraft.month=(A.owner.filters.from||A.owner.filters.to||A.schedule.today()).slice(0,7);rangeDraft.start='';renderRange();}
 const button=e.target.closest('[data-order-range]');if(!button||!A.session.ownerAllowed())return;
 const action=button.dataset.orderRange;
 if(action==='prev'||action==='next'){const d=new Date(rangeDraft.month+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+(action==='next'?1:-1));rangeDraft.month=d.toISOString().slice(0,7);renderRange();document.querySelector(`[data-order-range="${action}"]`)?.focus();return;}
 const date=button.dataset.date;
 if(!rangeDraft.start){rangeDraft.start=date;renderRange(date);return;}
 const [from,to]=[rangeDraft.start,date].sort();Object.assign(A.owner.filters,{from,to});if(A.owner.parts[1]==='analytics')Object.assign(A.analytics,{period:'custom',from,to});rangeDraft.start='';A.owner.page=1;A.owner.render();document.querySelector('#owner-order-range summary')?.focus();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('#owner-order-range[open]')){e.preventDefault();closeRange(true);}});
function updateCompactFilter(e){
 if(!e.target.closest('.owner-order-filters')||!A.session.ownerAllowed())return;
 const name=e.target.name;if(!['query','sort','stock','category','type','product'].includes(name))return;
 const start=e.target.selectionStart,end=e.target.selectionEnd;A.owner.filters[name]=e.target.value;A.owner.page=1;A.owner.render();
 const input=document.querySelector('.owner-order-filters [name="'+name+'"]');input?.focus();if(name==='query'&&start!==null)input.setSelectionRange(start,end);
}
document.addEventListener('input',e=>{if(e.target.name==='query')updateCompactFilter(e);});
document.addEventListener('change',e=>{if(['sort','stock','category','type','product'].includes(e.target.name))updateCompactFilter(e);});
})();
