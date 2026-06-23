(function(){
  function extractLinks(){
    const anchors = Array.from(document.querySelectorAll('a'));
    const links = anchors
      .map(a => ({ href: a.href, text: (a.innerText||a.getAttribute('aria-label')||'').trim() }))
      .filter(l => l.href && l.href.trim().length>0);
    const map = new Map();
    links.forEach(l => { if(!map.has(l.href)) map.set(l.href, l); });
    const result = Array.from(map.values()).map(item => {
      try{
        const u = new URL(item.href, location.href);
        const pathSegments = u.pathname.split('/').filter(s=>s.length>0);
        const directories = pathSegments.slice(0, -1);
        const last = pathSegments[pathSegments.length-1] || '';
        return { href: u.href, host: u.host, pathname: u.pathname, directories, last, text: item.text };
      }catch(e){
        return { href: item.href, error: 'Invalid URL' };
      }
    });
    return result;
  }
  const payload = { url: location.href, title: document.title, collectedAt: Date.now(), links: extractLinks() };
  chrome.storage.local.set({__cls_last_scan: payload}, () => {
    chrome.runtime.sendMessage({ type: 'PAGE_SCANNED', payload: { page: location.href } }).catch(()=>{});
  });
})();  