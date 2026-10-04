/* Shared presentation primitives; HTML slots accept composed application markup only. */
(() => {
const A=K406,E=A.escape;
A.ui={
 pageIntro:({title,subtitle='',actionsHtml=''})=>`<div class="commerce-heading"><div><h1 tabindex="-1">${E(title)}</h1><p>${E(subtitle)}</p></div>${actionsHtml}</div>`,
 panel:({title,bodyHtml,actionsHtml=''})=>`<section class="commerce-card"><div class="commerce-card-heading"><h2>${E(title)}</h2>${actionsHtml}</div>${bodyHtml}</section>`,
 button:({label,action,variant='',extra=''})=>`<button type="button" class="btn ${variant==='primary'?'primary':''}" data-staff="${E(action)}" ${extra}>${E(label)}</button>`,
 badge:text=>`<span class="order-badge">${E(text)}</span>`,
 field:({name,label,value='',type='text',extra=''})=>`<div class="field"><label for="staff-${E(name)}">${E(label)}</label><input id="staff-${E(name)}" name="${E(name)}" type="${E(type)}" value="${E(value)}" ${extra}></div>`,
 stat:({label,value})=>`<section class="commerce-card staff-stat"><p>${E(label)}</p><strong>${E(value)}</strong></section>`
};
})();
