async function render(){
  const stored = await chrome.storage.local.get(['__cls_last_scan']);
  const payload = stored.__cls_last_scan;
  const meta = document.getElementById('meta');
  const linksDiv = document.getElementById('links');
  linksDiv.innerHTML = '';
  if(!payload){ meta.textContent = 'No page scanned yet.'; return; }
  meta.textContent = `${payload.title || payload.url}`;
  payload.links.forEach(l => {
    const el = document.createElement('div'); el.className='link-item';
    const a = document.createElement('a'); a.href = l.href; a.target = '_blank'; a.textContent = l.href;
    el.appendChild(a);
    linksDiv.appendChild(el);
  });
}
async function checkAll(){
  const stored = await chrome.storage.local.get(['__cls_last_scan']);
  const payload = stored.__cls_last_scan;
  if(!payload || !payload.links || payload.links.length===0){ alert('No links found.'); return; }
  const urls = payload.links.map(l=>l.href);
  const resp = await new Promise((resolve)=> chrome.runtime.sendMessage({ type: 'CHECK_URLS', urls }, (r)=>resolve(r)));
  if(!resp){ alert('No response.'); return; }
  const linksDiv = document.getElementById('links'); linksDiv.innerHTML = '';
  resp.results.forEach(r => {
    const el = document.createElement('div'); el.className='link-item';
    const a = document.createElement('a'); a.href = r.url; a.target = '_blank'; a.textContent = r.url;
    const resultBadge = document.createElement('span'); resultBadge.className='badge';
    if(r.result==='Malicious'){ resultBadge.classList.add('malicious'); resultBadge.textContent='Malicious'; }
    else if(r.result==='Suspicious'){ resultBadge.classList.add('suspicious'); resultBadge.textContent='Suspicious'; }
    else { resultBadge.classList.add('safe'); resultBadge.textContent='Likely Safe'; }
    el.appendChild(a); el.appendChild(resultBadge);
    linksDiv.appendChild(el);
  });
}
document.getElementById('scanBtn').addEventListener('click', checkAll);
window.addEventListener('load', render);