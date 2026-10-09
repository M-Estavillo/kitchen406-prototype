/* Shared presentation primitives; HTML slots accept composed application markup only. */
(() => {
const A=K406,E=A.escape;
A.ui={
 pageIntro:({title,subtitle='',actionsHtml=''})=>`<div class="commerce-heading"><div><h1 tabindex="-1">${E(title)}</h1><p>${E(subtitle)}</p></div>${actionsHtml}</div>`,
 panel:({title,bodyHtml,actionsHtml=''})=>`<section class="commerce-card"><div class="commerce-card-heading"><h2>${E(title)}</h2>${actionsHtml}</div>${bodyHtml}</section>`,
 button:({label,action,variant='',extra='',namespace='staff'})=>`<button type="button" class="btn ${variant==='primary'?'primary':''}" data-${namespace==='owner'?'owner':'staff'}="${E(action)}" ${extra}>${E(label)}</button>`,
 badge:text=>`<span class="order-badge">${E(text)}</span>`,
 field:({name,label,value='',type='text',extra='',prefix='staff'})=>`<div class="field"><label for="${E(prefix)}-${E(name)}">${E(label)}</label><input id="${E(prefix)}-${E(name)}" name="${E(name)}" type="${E(type)}" value="${E(value)}" ${extra}></div>`,
 stat:({label,value})=>`<section class="commerce-card staff-stat"><p>${E(label)}</p><strong>${E(value)}</strong></section>`
};
A.ui.table=(heads,rows)=>`<div class="staff-table-wrap" tabindex="0" aria-label="Scrollable records"><table class="staff-table"><thead><tr>${heads.map(h=>`<th scope="col">${E(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${heads.length}">No matching records.</td></tr>`}</tbody></table></div>`;
A.ui.workspace=(links,current,body,label)=>`<div class="staff-layout"><aside class="staff-nav"><strong>${E(label)}</strong><nav aria-label="${E(label)} navigation">${links.map(([path,title,group],index)=>`${group&&group!==links[index-1]?.[2]?`<span class="workspace-nav-group">${E(group)}</span>`:''}<a href="#/${E(path)}" ${current===path?'aria-current="page"':''}>${E(title)}</a>`).join('')}</nav></aside><div class="staff-main">${body}</div></div>`;
})();
