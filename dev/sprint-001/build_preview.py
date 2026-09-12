"""Standalone stakeholder preview; no Node dependency."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[2]
sentences = json.loads((root / 'dev/sprint-001/sentences.json').read_text(encoding='utf-8'))
css = (root / 'app/app/globals.css').read_text(encoding='utf-8')
css = re.sub(r'@import[^;]+;', '', css)
css = re.sub(r'@theme inline\s*\{[^}]+\}', '', css)
html = '''<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gawor — pierwszy prototyp</title><style>CSS
button{border:0;background:#d2fa69;color:#14281d;cursor:pointer;font-weight:700}button:disabled{opacity:.5;cursor:default}button:focus-visible{outline:3px solid #fff;outline-offset:4px}.notice{padding:12px 16px;background:#e4ebdf;border-radius:12px;font-size:14px;margin:20px 0}select{font:inherit;padding:8px;border-radius:8px;max-width:100%}label{display:block;margin:16px 0}a{color:inherit}
</style><main><header><span class="brand">gawor<span>.</span></span><span class="language">DE / PL</span></header>
<section class="practice"><div class="eyebrow">POWTARZANIE</div><h1>Twoje zdania.<br>Twój rytm.</h1><p class="intro">Moje pierwsze 8 zdań · Zestaw przykładowy</p>
<div class="player"><div class="player-top"><span id="counter">01 / 08</span><span>↻ W pętli</span></div><p class="sentence" id="sentence" lang="de"></p><p class="cue" id="cue" aria-live="polite">Słuchaj → powtarzaj → i jeszcze raz</p><button class="play-button" id="start">▶ Zacznij powtarzać</button><p class="status" id="status" role="status">Sprawdzam dostępność niemieckiego głosu…</p></div>
<div class="notice">Prototyp do oceny. Pozostaw ekran otwarty. Odtwarzanie przy zablokowanym ekranie nie jest jeszcze gotowe.</div>
<label for="pace">Czas na powtórzenie</label><select id="pace"><option value="1">Krótszy</option><option value="1.5" selected>Standardowy</option><option value="2">Dłuższy</option></select>
</section><section class="set"><div class="set-heading"><h2>W tym zestawie</h2><span>8 zdań</span></div><ol id="list"></ol></section><footer>Sprint 001 · Głos syntetyczny · Zapis z rozmowy pojawi się w kolejnym przyroście.</footer></main>
<script>
const sentences=DATA;
const $=id=>document.getElementById(id);
let index=0,running=false,timer=null,generation=0,voice=null;
const synth=window.speechSynthesis;
sentences.forEach((s,i)=>{const li=document.createElement('li');const n=document.createElement('span');n.className='number';n.textContent=String(i+1).padStart(2,'0');const t=document.createElement('span');t.lang='de';t.textContent=s.de;li.append(n,t);$('list').append(li)});
function render(){$('sentence').textContent=sentences[index].de;$('counter').textContent=String(index+1).padStart(2,'0')+' / 08';[...$('list').children].forEach((li,i)=>li.classList.toggle('active',running&&i===index))}
function voices(){if(!synth){$('start').disabled=true;$('status').textContent='Ta przeglądarka nie obsługuje syntezy mowy.';return}voice=synth.getVoices().find(v=>v.lang.toLowerCase().startsWith('de'));$('start').disabled=!voice;$('status').textContent=voice?'Gotowe. Głos: '+voice.name:'Brak niemieckiego głosu w tej przeglądarce. Na iPhonie sprawdź w Safari; może być potrzebne pobranie głosu w ustawieniach systemu.'}
function stop(message){running=false;generation++;clearTimeout(timer);synth?.cancel();$('start').textContent='▶ Wznów od tego zdania';$('cue').textContent=message||'Zatrzymano. Wznów, kiedy chcesz.';render()}
function speak(){if(!running)return;render();const token=generation;const utterance=new SpeechSynthesisUtterance(sentences[index].de);utterance.lang='de-DE';utterance.voice=voice;utterance.rate=.88;let started=performance.now();utterance.onstart=()=>{started=performance.now();$('cue').textContent='Posłuchaj…'};utterance.onend=()=>{if(!running||token!==generation)return;const seconds=Math.max(.5,(performance.now()-started)/1000);$('cue').textContent='Teraz Ty. Powtórz na głos.';timer=setTimeout(()=>{index=(index+1)%sentences.length;speak()},(seconds*Number($('pace').value)+1)*1000)};utterance.onerror=()=>{if(token===generation&&running)stop('Nie udało się odczytać zdania. Spróbuj ponownie.')};synth.speak(utterance)}
$('start').onclick=()=>{if(running){stop();return}if(!voice)return;running=true;generation++;$('start').textContent='■ Zatrzymaj';speak()};
if(synth)synth.onvoiceschanged=voices;render();voices();window.addEventListener('pagehide',()=>stop());
</script></html>'''
html = html.replace('CSS', css).replace('DATA', json.dumps(sentences, ensure_ascii=False))
(root / 'dev/sprint-001/podglad.html').write_text(html, encoding='utf-8')
print('Preview created: dev/sprint-001/podglad.html')
