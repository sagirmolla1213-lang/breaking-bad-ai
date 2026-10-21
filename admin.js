const $ = s => document.querySelector(s);
let token = sessionStorage.getItem("bbai-admin-token") || "";
function showDashboard(){ $("#login-card").classList.add("hidden"); $("#dashboard").classList.remove("hidden"); loadStats(); }
async function login(e){
  e.preventDefault(); $("#login-error").textContent = "";
  try {
    const r = await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:$("#password").value})});
    const d = await r.json(); if(!r.ok) throw new Error(d.error || "Login failed");
    token=d.token;sessionStorage.setItem("bbai-admin-token",token);showDashboard();
  } catch(err){$("#login-error").textContent=err.message;}
}
async function loadStats(){
  $("#load-error").textContent="";
  try{
    const r=await fetch("/api/admin/stats",{headers:{Authorization:"Bearer "+token}});
    const d=await r.json();if(!r.ok)throw new Error(d.error||"Data load failed");
    $("#users").textContent=d.totalVisitors;$("#requests").textContent=d.totalRequests;
    $("#today-users").textContent=d.todayVisitors;$("#today-requests").textContent=d.todayRequests;
    const tbody=$("#recent");tbody.innerHTML="";
    d.recent.forEach(item=>{
      const tr=document.createElement("tr");
      [new Date(item.at).toLocaleString(),item.visitor,item.status].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});
      tbody.appendChild(tr);
    });
    if(!d.recent.length){const tr=document.createElement("tr");const td=document.createElement("td");td.colSpan=3;td.textContent="এখনো কোনো request নেই";tr.appendChild(td);tbody.appendChild(tr);}
  }catch(err){$("#load-error").textContent=err.message;if(err.message.includes("Admin")){sessionStorage.removeItem("bbai-admin-token");token="";$("#dashboard").classList.add("hidden");$("#login-card").classList.remove("hidden");}}
}
$("#login-form").addEventListener("submit",login);$("#refresh").addEventListener("click",loadStats);
if(token)showDashboard();
