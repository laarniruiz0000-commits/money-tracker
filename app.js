const KEY='money_tracker_v3_v2_3';
const LEGACY_KEYS=['mtv3v2_fixed_v2_1','mtv3v2_fixed','mtv3v2_fixed_v2'];
const defaults={
  salaries:[], expenses:[], bills:[], installments:[], budgets:[],
  banks:['BPI','BDO','Metrobank','UnionBank','GCash','Maya'],
  cats:['Food','Grocery','Transportation','Shopping','Household','Other'],
  fav:[], salaryDates:[10,25]
};
let d, billMonth=new Date().toISOString().slice(0,7), billBank='All Banks', histQ='', histMonth='All', histType='All';

function clone(o){return JSON.parse(JSON.stringify(o))}
function uid(){return Date.now()+Math.random().toString(36).slice(2)}
function today(){return new Date().toISOString().slice(0,10)}
function curMonth(){return today().slice(0,7)}
function month(x){return String(x||'').slice(0,7)}
function peso(x){return '₱'+Number(x||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function dateObj(s){return new Date(String(s).slice(0,10)+'T12:00:00')}
function day(s){return Number(String(s).slice(8,10))}
function salaryTotal(m){return d.salaries.filter(x=>month(x.date)===m).reduce((a,x)=>a+Number(x.amount||0),0)}
function expenseTotal(m){return d.expenses.filter(x=>month(x.date)===m).reduce((a,x)=>a+Number(x.amount||0),0)}
function billsFor(m){return d.bills.filter(x=>month(x.date)===m)}
function unpaidBillsFor(m){return billsFor(m).filter(x=>x.status!=='paid')}
function plannedBillsTotal(m){return unpaidBillsFor(m).reduce((a,x)=>a+Number(x.amount||0),0)}
function status(x){
  if(x.status==='paid')return '<span class="badge paid">Paid</span>';
  const diff=(dateObj(x.date)-dateObj(today()))/86400000;
  return diff>=0&&diff<=3?'<span class="badge soon">Due soon</span>':'<span class="badge unpaid">Unpaid</span>';
}
function save(){localStorage.setItem(KEY,JSON.stringify(d));render()}
function load(){
  let raw=localStorage.getItem(KEY);
  if(!raw) for(const k of LEGACY_KEYS){raw=localStorage.getItem(k);if(raw)break}
  try{d=raw?JSON.parse(raw):clone(defaults)}catch(e){d=clone(defaults)}
  for(const k of Object.keys(defaults))if(!(k in d))d[k]=clone(defaults[k]);
}
function render(){renderDash();renderExpenses();renderInstallments();renderBills();renderBudget();renderSettings()}
function rangeBills(start,end){
  const a=dateObj(start),b=dateObj(end);
  return d.bills.filter(x=>x.status!=='paid'&&dateObj(x.date)>=a&&dateObj(x.date)<=b)
}
function paydayRange(which,m){
  const y=Number(m.slice(0,4)), mo=Number(m.slice(5,7))-1;
  if(which===10){
    return [new Date(y,mo,10,12),new Date(y,mo,24,12)];
  }
  return [new Date(y,mo,25,12),new Date(y,mo+1,9,12)];
}
function fmtDate(dte){return dte.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}
function paydayBlock(which,m){
  const salDay=which===10?10:25;
  const sal=d.salaries.filter(x=>month(x.date)===m&&day(x.date)===salDay).reduce((a,x)=>a+Number(x.amount||0),0);
  const [a,b]=paydayRange(which,m);
  const bills=d.bills.filter(x=>x.status!=='paid'&&dateObj(x.date)>=a&&dateObj(x.date)<=b);
  const expenses=d.expenses.filter(x=>dateObj(x.date)>=a&&dateObj(x.date)<=b);
  const e=expenses.reduce((s,x)=>s+Number(x.amount||0),0);
  const bl=bills.reduce((s,x)=>s+Number(x.amount||0),0);
  return `<div class="item"><span><b>Payday ${salDay}th</b><br><span class="muted">${fmtDate(a)} – ${fmtDate(b)} • Salary ${peso(sal)} • Expenses ${peso(e)} • Bills/Installments ${peso(bl)}</span></span><b>${peso(sal-e-bl)}</b></div>${bills.map(x=>`<div class="subitem"><span>${esc(x.name)} <span class="muted">${x.source==='installment'?'• Installment '+x.n+'/'+x.total:''}</span></span><b>${peso(x.amount)}</b></div>`).join('')}`
}
function renderDash(){
  const m=curMonth(),inc=salaryTotal(m),actual=expenseTotal(m),current=inc-actual,unpaid=plannedBillsTotal(m);
  document.getElementById('dash').innerHTML=`
  <h2>Dashboard</h2>
  <div class="cards">
    <div class="card">Current Money<div class="num">${peso(current)}</div><span class="muted">Salary received − actual expenses paid</span></div>
    <div class="card">Income<div class="num">${peso(inc)}</div></div>
    <div class="card">Actual Expenses<div class="num">${peso(actual)}</div></div>
    <div class="card">Unpaid Upcoming Bills<div class="num">${peso(unpaid)}</div></div>
  </div>
  <div class="card"><h3>Payday View</h3>
    <div class="notice">Salary Cutoff View and Payday View are now merged. Each payday shows what remains after actual expenses and unpaid bills/installments in that payday window.</div>
    ${paydayBlock(10,m)}${paydayBlock(25,m)}
  </div>`;
}
function salaryForm(){
  return `<div class="card"><h3>Add Salary</h3><div class="grid">
  <div class="field"><label>Amount</label><input id="salAmt" type="number" step="0.01"></div>
  <div class="field"><label>Date</label><input id="salDate" type="date" value="${today()}"></div>
  <div class="field full"><label>Description</label><input id="salDesc" placeholder="Salary"></div>
  </div><div class="actions"><button class="btn" id="addSalary">Add Salary</button></div></div>`
}
function expenseForm(){
  return `<div class="card"><h3>Add Expense / Bill / Installment / Budget</h3><div class="grid">
  <div class="field"><label>Amount</label><input id="a" type="number" step="0.01"></div>
  <div class="field"><label>Date</label><input id="dt" type="date" value="${today()}"></div>
  <div class="field"><label>Type</label><select id="t"><option value="expense">Expense</option><option value="bill">Bill</option><option value="installment">Installment</option><option value="budget">Budget</option></select></div>
  <div class="field"><label>Category</label><select id="c">${d.cats.map(x=>`<option>${esc(x)}</option>`).join('')}</select></div>
  <div class="field full"><label>Description</label><input id="desc" list="fav" placeholder="Frequent descriptions are saved automatically"><datalist id="fav">${d.fav.map(x=>`<option value="${esc(x)}">`).join('')}</datalist></div>
  <div class="field"><label>Bank / Card</label><select id="bank"><option value="">None</option>${d.banks.map(x=>`<option>${esc(x)}</option>`).join('')}</select></div>
  <div class="field" id="payWrap"><label>Payment</label><select id="pay"><option>Cash</option><option>Credit Card</option></select></div>
  <div id="insf" class="full" style="display:none"><div class="grid">
    <div class="field"><label>Starting installment # <span class="muted">(optional if start month is given)</span></label><input id="no" type="number" min="1" placeholder="e.g. 3"></div>
    <div class="field"><label>Total installments</label><input id="tot" type="number" min="1" placeholder="e.g. 12"></div>
    <div class="field"><label>Start month <span class="muted">(optional if # is given)</span></label><input id="sm" type="month"></div>
    <div class="field"><label>Due day</label><input id="due" type="number" min="1" max="31" value="26"></div>
  </div><div class="notice">Provide either starting installment # or start month. If both are provided, they are used together. Example: 3 of 12.</div></div>
  <div id="bf" class="full" style="display:none"><div class="grid">
    <div class="field"><label>Bill due day</label><input id="bdue" type="number" min="1" max="31" value="26"></div>
    <div class="field"><label>Recurring</label><select id="rec"><option value="no">No</option><option value="monthly">Monthly</option></select></div>
  </div></div>
  <div id="budf" class="full" style="display:none"><div class="grid">
    <div class="field"><label>Budget category</label><input id="bcat" placeholder="Food, utilities, etc."></div>
    <div class="field"><label>Budget limit</label><input id="bamt" type="number" step="0.01"></div>
  </div><div class="notice">Budget is an assumption/planning amount. It does not reduce Current Money.</div></div>
  </div><div class="actions"><button class="btn" id="addRecord">Add</button></div></div>`
}
function renderExpenses(){
  document.getElementById('exp').innerHTML=`<h2>Expenses</h2>${salaryForm()}${expenseForm()}<div class="card"><h3>Search & Transaction History</h3>
  <div class="grid"><div class="field"><label>Search</label><input class="search" id="q" value="${esc(histQ)}" placeholder="Description, category, bank, date..."></div>
  <div class="field"><label>Type</label><select id="ht"><option>All</option><option>Income</option><option>Expense</option><option>Bill</option><option>Installment</option><option>Budget</option></select></div></div>
  <div class="actions"><button class="btn secondary" id="clearHist">Clear filters</button></div><div id="hist"></div></div>`;
  document.getElementById('t').onchange=toggleFields;
  document.getElementById('addRecord').onclick=addRecord;
  document.getElementById('addSalary').onclick=addSalary;
  document.getElementById('q').oninput=e=>{histQ=e.target.value;renderHistory()};
  document.getElementById('ht').value=histType;
  document.getElementById('ht').onchange=e=>{histType=e.target.value;renderHistory()};
  document.getElementById('clearHist').onclick=()=>{histQ='';histType='All';renderExpenses()};
  toggleFields();renderHistory();
}
function toggleFields(){
  const type=document.getElementById('t').value;
  document.getElementById('insf').style.display=type==='installment'?'block':'none';
  document.getElementById('bf').style.display=type==='bill'?'block':'none';
  document.getElementById('budf').style.display=type==='budget'?'block':'none';
  document.getElementById('payWrap').style.display=type==='expense'?'block':'none';
  document.getElementById('c').disabled=type==='budget';
}
function addSalary(){const amount=Number(document.getElementById('salAmt').value),date=document.getElementById('salDate').value,description=document.getElementById('salDesc').value.trim()||'Salary';if(!amount||!date){alert('Enter salary amount and date.');return;}d.salaries.push({id:uid(),amount,date,description});save();alert('Salary saved.')});save();alert('Salary saved.');
}
function addRecord(){
 const amount=Number(document.getElementById('a').value), date=document.getElementById('dt').value;
 const description=document.getElementById('desc').value.trim(), type=document.getElementById('t').value;
 const category=document.getElementById('c').value, bank=document.getElementById('bank').value, payment=document.getElementById('pay').value;
 if(!amount||!date||!description){alert('Enter amount, date and description.');return;}
 if(!d.fav.includes(description))d.fav.unshift(description); if(bank&&!d.banks.includes(bank))d.banks.push(bank);
 if(type==='expense'){d.expenses.push({id:uid(),amount,date,description,category,bank,payment});save();alert('Expense saved.');return;}
 if(type==='bill'){
  const due=Number(document.getElementById('bdue').value)||26;
  d.bills.push({id:uid(),name:description,amount,date,bank,status:'unpaid',source:'bill',due});
  if(document.getElementById('rec').value==='monthly')for(let i=1;i<24;i++){const z=new Date(date+'T12:00:00');z.setMonth(z.getMonth()+i);d.bills.push({id:uid(),name:description,amount,date:z.toISOString().slice(0,10),bank,status:'unpaid',source:'bill',due});}
  save();alert('Bill saved and Bills Overview updated.');return;
 }
 const parts=(document.getElementById('sm').value||'').split('-'), sy=Number(parts[0]), sm=Number(parts[1]);
 const no=Number(document.getElementById('no').value), total=Number(document.getElementById('tot').value), due=Number(document.getElementById('due').value)||26;
 if(!no&&!sm){alert('Enter either a starting installment number or a start month.');return;}
 const startNo=no||1, startMonth=sm||(new Date(date+'T12:00:00').getMonth()+1), startYear=sy||(new Date(date+'T12:00:00').getFullYear());
 if(startNo<1||!total||startNo>total){alert('Check starting installment and total installments.');return;}
 const iid=uid(); d.installments.push({id:iid,amount,description,bank,startYear,startMonth,startNo,total,dueDay:due});
 for(let k=startNo;k<=total;k++){const z=new Date(startYear,startMonth-1+(k-startNo),due);d.bills.push({id:uid(),name:description,amount,date:z.toISOString().slice(0,10),bank,status:'unpaid',source:'installment',installmentId:iid,n:k,total,due});}
 save();alert('Installment saved and monthly bills generated.');
}
function recordList(){
  const arr=[
    ...d.salaries.map(x=>({...x,type:'Income',recordType:'salary',description:x.description||'Salary'})),
    ...d.expenses.map(x=>({...x,type:'Expense',recordType:'expense'})),
    ...d.bills.map(x=>({...x,description:x.name,type:x.source==='installment'?'Installment':'Bill',recordType:'bill'})),
    ...d.budgets.map(x=>({...x,type:'Budget',recordType:'budget',description:x.description||x.category}))
  ];
  return arr.filter(x=>{
    const q=histQ.toLowerCase();
    return (!q||JSON.stringify(x).toLowerCase().includes(q))&&(histType==='All'||x.type===histType);
  }).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
function renderHistory(){
  const all=recordList();
  document.getElementById('hist').innerHTML=all.map(x=>`<div class="item"><span><b>${esc(x.description)}</b><br><span class="muted">${esc(x.date)} • ${x.type}${x.category?' • '+esc(x.category):''}${x.bank?' • '+esc(x.bank):''}${x.source==='installment'?' • '+x.n+'/'+x.total:''}</span></span><span><b>${x.type==='Expense'||x.type==='Bill'||x.type==='Installment'||x.type==='Budget'?'-':'+'}${peso(x.amount)}</b><br><button class="btn secondary mini" data-editrec="${x.recordType}:${x.id}">Edit</button> <button class="btn danger mini" data-delrec="${x.recordType}:${x.id}">Delete</button></span></div>`).join('')||'<div class="muted">No transactions found.</div>';
  document.querySelectorAll('[data-editrec]').forEach(b=>b.onclick=()=>editRecord(b.dataset.editrec));
  document.querySelectorAll('[data-delrec]').forEach(b=>b.onclick=()=>deleteRecord(b.dataset.delrec));
}
function editRecord(key){
  const [type,id]=key.split(':');
  let x= type==='salary'?d.salaries.find(a=>a.id==id):type==='expense'?d.expenses.find(a=>a.id==id):type==='bill'?d.bills.find(a=>a.id==id):d.budgets.find(a=>a.id==id);
  if(!x)return;
  if(type==='bill'){
    const name=prompt('Description',x.name);if(name===null)return;
    const amount=prompt('Amount',x.amount);if(amount===null)return;
    const date=prompt('Date (YYYY-MM-DD)',x.date);if(date===null)return;
    const bank=prompt('Bank / Card',x.bank||'');if(bank===null)return;
    const statusV=prompt('Status (paid/unpaid)',x.status);if(statusV===null)return;
    x.name=name.trim();x.amount=Number(amount);x.date=date; x.bank=bank.trim();x.status=statusV==='paid'?'paid':'unpaid';save();return
  }
  const desc=prompt('Description',x.description||'');if(desc===null)return;
  const amount=prompt('Amount',x.amount);if(amount===null)return;
  const date=prompt('Date (YYYY-MM-DD)',x.date);if(date===null)return;
  const bank=prompt('Bank / Card',x.bank||'');if(bank===null)return;
  if(type==='salary'){x.description=desc;x.amount=Number(amount);x.date=date;x.bank=bank}
  else if(type==='expense'){const cat=prompt('Category',x.category||'Other');if(cat===null)return;const pay=prompt('Payment (Cash/Credit Card)',x.payment||'Cash');if(pay===null)return;x.description=desc;x.amount=Number(amount);x.date=date;x.bank=bank;x.category=cat;x.payment=pay}
  else {const cat=prompt('Budget category',x.category||'');if(cat===null)return;x.description=desc;x.amount=Number(amount);x.date=date;x.bank=bank;x.category=cat}
  save();
}
function deleteRecord(key){
  const [type,id]=key.split(':');
  if(!confirm('Delete this record?'))return;
  if(type==='salary')d.salaries=d.salaries.filter(x=>x.id!=id);
  else if(type==='expense')d.expenses=d.expenses.filter(x=>x.id!=id);
  else if(type==='budget')d.budgets=d.budgets.filter(x=>x.id!=id);
  else {const b=d.bills.find(x=>x.id==id); if(b?.installmentId){/* remove only this installment bill */} d.bills=d.bills.filter(x=>x.id!=id)}
  save();
}
function renderInstallments(){
  document.getElementById('ins').innerHTML=`<h2>Installments</h2><div class="notice">Installments are added only in Expenses. This tab is for monitoring and full editing/deleting.</div>${d.installments.map(x=>`<div class="item"><span><b>${esc(x.description)}</b><br><span class="muted">${esc(x.bank||'None')} • ${peso(x.amount)} • ${x.startNo}/${x.total} • Start ${x.startYear}-${String(x.startMonth).padStart(2,'0')} • Due ${x.dueDay}</span></span><span><button class="btn secondary" data-editins="${x.id}">Edit</button> <button class="btn danger" data-delins="${x.id}">Delete</button></span></div>`).join('')||'<div class="muted">No installments yet.</div>'}`;
  document.querySelectorAll('[data-editins]').forEach(b=>b.onclick=()=>editInstallment(b.dataset.editins));
  document.querySelectorAll('[data-delins]').forEach(b=>b.onclick=()=>deleteInstallment(b.dataset.delins));
}
function editInstallment(id){
  const x=d.installments.find(y=>y.id==id);if(!x)return;
  const amount=prompt('Monthly amount',x.amount);if(amount===null)return;
  const desc=prompt('Description',x.description);if(desc===null)return;
  const bank=prompt('Bank / Card',x.bank||'');if(bank===null)return;
  const startNo=prompt('Starting installment #',x.startNo);if(startNo===null)return;
  const total=prompt('Total installments',x.total);if(total===null)return;
  const start=prompt('Start month (YYYY-MM)',`${x.startYear}-${String(x.startMonth).padStart(2,'0')}`);if(start===null)return;
  const due=prompt('Due day',x.dueDay);if(due===null)return;
  const paidBills=d.bills.filter(b=>b.installmentId==id&&b.status==='paid');
  x.amount=Number(amount);x.description=desc.trim();x.bank=bank.trim();x.startNo=Number(startNo);x.total=Number(total);x.startYear=Number(start.slice(0,4));x.startMonth=Number(start.slice(5,7));x.dueDay=Number(due);
  d.bills=d.bills.filter(b=>!(b.installmentId==id&&b.status!=='paid'));
  for(let k=x.startNo;k<=x.total;k++){const z=new Date(x.startYear,x.startMonth-1+(k-x.startNo),x.dueDay);d.bills.push({id:uid(),name:x.description,amount:x.amount,date:z.toISOString().slice(0,10),bank:x.bank,status:'unpaid',source:'installment',installmentId:id,n:k,total:x.total,due:x.dueDay})}
  // Historical paid bills remain unchanged.
  save();
}
function deleteInstallment(id){
  if(!confirm('Delete this installment? Paid historical installment bills will remain.'))return;
  d.installments=d.installments.filter(x=>x.id!=id);
  d.bills=d.bills.filter(b=>!(b.installmentId==id&&b.status!=='paid'));
  save();
}
function renderBills(){
  const rows=billsFor(billMonth).filter(x=>billBank==='All Banks'||x.bank===billBank);
  const types=['All','Bill','Installment'];
  const selectedType=window.billType||'All';
  const filtered=selectedType==='All'?rows:rows.filter(x=>selectedType==='Installment'?x.source==='installment':x.source==='bill');
  const byBank=d.banks.map(b=>({b,total:filtered.filter(x=>x.bank===b).reduce((a,x)=>a+Number(x.amount||0),0)})).filter(x=>x.total>0);
  document.getElementById('bill').innerHTML=`<h2>Bills Overview</h2><div class="card"><div class="grid">
  <div class="field"><label>Month</label><input id="bm" type="month" value="${billMonth}"></div>
  <div class="field"><label>Bank / Card</label><select id="bb"><option>All Banks</option>${d.banks.map(x=>`<option ${x===billBank?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
  <div class="field"><label>Type</label><select id="bt">${types.map(x=>`<option ${x===selectedType?'selected':''}>${x}</option>`).join('')}</select></div>
  </div><div class="actions"><button class="btn" id="applyBills">Apply</button></div></div>
  <div class="cards"><div class="card">Total<div class="num">${peso(filtered.reduce((a,x)=>a+Number(x.amount||0),0))}</div></div><div class="card">Paid<div class="num">${peso(filtered.filter(x=>x.status==='paid').reduce((a,x)=>a+Number(x.amount||0),0))}</div></div><div class="card">Unpaid<div class="num">${peso(filtered.filter(x=>x.status!=='paid').reduce((a,x)=>a+Number(x.amount||0),0))}</div></div><div class="card">Bills<div class="num">${filtered.length}</div></div></div>
  <div class="card"><h3>Monthly Total by Bank</h3>${byBank.map(x=>`<div class="bankrow"><b>${esc(x.b)}</b><b>${peso(x.total)}</b></div>`).join('')||'<span class="muted">No bills for this filter.</span>'}</div>
  <div class="card">${filtered.map(x=>`<div class="item"><span><b>${esc(x.name)}</b><br><span class="muted">${x.date} • ${esc(x.bank||'None')} • ${x.source==='installment'?'Installment '+x.n+'/'+x.total:'Bill'}</span></span><span>${peso(x.amount)}<br>${status(x)} <button class="btn secondary" data-paid="${x.id}">${x.status==='paid'?'Mark unpaid':'Mark paid'}</button></span></div>`).join('')||'<div class="muted">No bills.</div>'}</div>`;
  document.getElementById('applyBills').onclick=()=>{billMonth=document.getElementById('bm').value;billBank=document.getElementById('bb').value;window.billType=document.getElementById('bt').value;renderBills()};
  document.querySelectorAll('[data-paid]').forEach(b=>b.onclick=()=>{const x=d.bills.find(y=>y.id==b.dataset.paid);if(x){x.status=x.status==='paid'?'unpaid':'paid';save()}});
}
function renderBudget(){
  const m=curMonth(),salary=salaryTotal(m),actual=expenseTotal(m),planned=plannedBillsTotal(m),totalMoney=salary-actual-planned,available=salary-actual-planned;
  const budgets=d.budgets.filter(x=>month(x.date)===m);
  document.getElementById('bud').innerHTML=`<h2>Budget</h2><div class="cards">
    <div class="card">Total Money<div class="num">${peso(totalMoney)}</div><span class="muted">Salary − actual expenses − unpaid bills/installments</span></div>
    <div class="card">Salary<div class="num">${peso(salary)}</div></div>
    <div class="card">Actual Expenses<div class="num">${peso(actual)}</div></div>
    <div class="card">Bills / Installments<div class="num">${peso(planned)}</div></div>
  </div>
  <div class="card"><h3>Budget Plan</h3><div class="notice">Budget entries are assumptions only. They do not reduce Current Money or Total Money until an actual expense is recorded.</div>${budgets.map(x=>`<div class="item"><span><b>${esc(x.category)}</b><br><span class="muted">${x.date} • ${esc(x.description||'Budget')}</span></span><b>${peso(x.amount)}</b></div>`).join('')||'<span class="muted">No budgets for this month.</span>'}</div>`;
}
function renderSettings(){
  document.getElementById('set').innerHTML=`<h2>Settings</h2><div class="card"><h3>Banks / Cards</h3>${d.banks.map((x,i)=>`<div class="item"><span>${esc(x)}</span><button class="btn danger" data-bank="${i}">Remove</button></div>`).join('')}<div class="actions"><input class="search" id="nb" placeholder="Add bank/card"><button class="btn" id="addBank">Add</button></div></div>
  <div class="card"><h3>Salary Dates</h3><div class="notice">Payday windows are fixed as 10th–24th and 25th–9th. These dates are used for salary entries; the old separate Salary Cutoff View has been merged into Payday View.</div><input class="search" id="sd" value="${d.salaryDates.join(',')}"><div class="actions"><button class="btn" id="saveDates">Save</button></div></div>
  <div class="card"><h3>Frequent Descriptions</h3>${d.fav.map(x=>`<div class="item">⭐ ${esc(x)}</div>`).join('')||'<span class="muted">Descriptions entered in Expenses are saved automatically.</span>'}</div>
  <div class="card"><button class="btn secondary" id="export">Export backup</button> <button class="btn danger" id="wipe">Delete all data</button></div>`;
  document.getElementById('addBank').onclick=()=>{const v=document.getElementById('nb').value.trim();if(v&&!d.banks.includes(v)){d.banks.push(v);save()}};
  document.getElementById('saveDates').onclick=()=>{alert('Payday windows are fixed to 10th–24th and 25th–9th as requested. Salary dates can still be stored for reference.');};
  document.querySelectorAll('[data-bank]').forEach(b=>b.onclick=()=>{d.banks.splice(Number(b.dataset.bank),1);save()});
  document.getElementById('export').onclick=exportBackup;
  document.getElementById('wipe').onclick=()=>{if(confirm('Delete all Money Tracker data?')){localStorage.removeItem(KEY);d=clone(defaults);render()}};
}
function exportBackup(){const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='money-tracker-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('on'));document.querySelectorAll('.page').forEach(x=>x.classList.remove('on'));b.classList.add('on');document.getElementById(b.dataset.tab).classList.add('on')});
load();render();
