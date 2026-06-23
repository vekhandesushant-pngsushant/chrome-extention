const VT_BASE = 'https://www.virustotal.com/api/v3/urls';

function simpleHeuristic(url){
  try{
    const u = new URL(url);
    const score = { suspiciousReasons: [], score: 0 };
    if(/^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)){
      score.suspiciousReasons.push('IP-based host'); score.score += 2;
    }
    const suspiciousTLDs = ['.xyz','.top','.click','.club'];
    if(suspiciousTLDs.some(t=>u.hostname.endsWith(t))){ score.suspiciousReasons.push('Suspicious TLD'); score.score += 1; }
    if(u.search && u.search.length > 80){ score.suspiciousReasons.push('Long query string'); score.score += 1; }
    const segs = u.pathname.split('/').filter(s=>s.length>0);
    if(segs.length > 6){ score.suspiciousReasons.push('Many path segments'); score.score += 1; }
    return score;
  }catch(e){ return { suspiciousReasons: ['parse error'], score: 0 } }
}

function vtUrlId(url){
  const enc = btoa(unescape(encodeURIComponent(url))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return enc;
}

async function queryVirusTotal(apiKey, url){
  try{
    const id = vtUrlId(url);
    const res = await fetch(`${VT_BASE}/${id}`, {
      method: 'GET',
      headers: { 'x-apikey': apiKey }
    });
    if(!res.ok) return { error: 'vt_unreachable', status: res.status };
    const data = await res.json();
    return { vt: data };
  }catch(e){ return { error: 'vt_error', message: e.message } }
}

async function probeUrl(url){
  try{
    const resp = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return { status: resp.status, redirected: resp.redirected, finalUrl: resp.url, contentType: resp.headers.get('content-type') };
  }catch(e){
    return { error: 'probe_failed', message: e.message };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if(msg?.type === 'CHECK_URLS'){
    (async ()=>{
      const { urls } = msg;
      const cfg = await chrome.storage.local.get(['vt_api_key']);
      const apiKey = cfg.vt_api_key;
      const results = [];
      for(const u of urls){
        const item = { url: u };
        if(apiKey){
          const vt = await queryVirusTotal(apiKey, u);
          item.vt = vt;
        }
        const probe = await probeUrl(u);
        item.probe = probe;
        item.heuristic = simpleHeuristic(u);
        const vtMalicious = item.vt && item.vt.vt && item.vt.vt.data && item.vt.vt.data.attributes && item.vt.vt.data.attributes.last_analysis_stats && item.vt.vt.data.attributes.last_analysis_stats.malicious;
        if(vtMalicious && vtMalicious > 0) item.result = 'Malicious';
        else if(probe && probe.status >= 400) item.result = 'Suspicious';
        else if(item.heuristic.score >= 2) item.result = 'Suspicious';
        else item.result = 'Likely Safe';
        results.push(item);
      }
      sendResponse({ results });
    })();
    return true;
  }
});