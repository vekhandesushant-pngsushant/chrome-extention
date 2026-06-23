const keyInput = document.getElementById('vtKey');
const saveBtn = document.getElementById('save');
const clearBtn = document.getElementById('clear');
async function load(){ const s = await chrome.storage.local.get(['vt_api_key']); keyInput.value = s.vt_api_key || ''; }
saveBtn.addEventListener('click', async ()=>{ const val = keyInput.value.trim(); await chrome.storage.local.set({ vt_api_key: val }); alert('Saved'); });
clearBtn.addEventListener('click', async ()=>{ await chrome.storage.local.remove(['vt_api_key']); keyInput.value = ''; alert('Cleared'); });
window.addEventListener('load', load);