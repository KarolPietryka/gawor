"""Render the stakeholder preview with the real static audio asset."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
source = (root / 'dev/sprint-001/podglad.html').read_text(encoding='utf-8')
manifest = json.loads((root / 'app/public/audio/practice.json').read_text(encoding='utf-8'))
sentences = json.loads((root / 'dev/sprint-001/sentences.json').read_text(encoding='utf-8'))
source = source.replace('Sprawdzam dostępność niemieckiego głosu…', 'Gotowe nagranie · 8 zdań · 1 min 12 s · w pętli')
source = source.replace('Prototyp do oceny. Pozostaw ekran otwarty. Odtwarzanie przy zablokowanym ekranie nie jest jeszcze gotowe.', 'Naciśnij Start, zablokuj ekran i sprawdź dwa pełne obiegi. Test działania w tle na iPhonie czeka na Twoje potwierdzenie.')
start = source.index('<label for="pace">')
end = source.index('</select>', start) + len('</select>')
source = source[:start] + '<p>Czas na powtórzenie: długość zdania × 1,5 + 1 sekunda.</p>' + source[end:]
source = source.replace('Sprint 001', 'Sprint 002')
start = source.index('<script>')
source = source[:start] + '''<audio id="audio" src="../../app/public/audio/practice.mp3" preload="metadata" loop></audio>
<script>
const sentences=SENTENCES,manifest=MANIFEST;
const $=id=>document.getElementById(id),audio=$('audio');
sentences.forEach((s,i)=>{const li=document.createElement('li');const n=document.createElement('span');n.className='number';n.textContent=String(i+1).padStart(2,'0');const t=document.createElement('span');t.lang='de';t.textContent=s.de;li.append(n,t);$('list').append(li)});
function render(){const time=audio.currentTime;let i=manifest.timeline.findIndex(s=>time>=s.start&&time<s.end);if(i<0)i=0;const item=manifest.timeline[i];$('sentence').textContent=sentences[i].de;$('counter').textContent=String(i+1).padStart(2,'0')+' / 08';$('cue').textContent=audio.paused?'Słuchaj → powtarzaj → i jeszcze raz':time<item.speech_end?'Posłuchaj…':'Teraz Ty. Powtórz na głos.';$('start').textContent=audio.paused?'▶ '+(time?'Wznów':'Zacznij powtarzać'):'Ⅱ Pauza';[...$('list').children].forEach((li,n)=>li.classList.toggle('active',!audio.paused&&i===n))}
async function play(){try{await audio.play()}catch{$('status').textContent='Nie udało się odtworzyć pliku. Sprawdź połączenie i spróbuj ponownie.'}}
$('start').onclick=()=>audio.paused?play():audio.pause();
audio.addEventListener('timeupdate',render);audio.addEventListener('play',()=>{render();if('mediaSession'in navigator)navigator.mediaSession.playbackState='playing'});audio.addEventListener('pause',()=>{render();if('mediaSession'in navigator)navigator.mediaSession.playbackState='paused'});audio.addEventListener('error',()=>{$('status').textContent='Nie udało się wczytać pliku MP3.'});
if('mediaSession'in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:'Moje pierwsze 8 zdań',artist:'Gawor · niemiecki'});navigator.mediaSession.setActionHandler('play',play);navigator.mediaSession.setActionHandler('pause',()=>audio.pause())}
render();
</script></html>'''
source = source.replace('SENTENCES', json.dumps(sentences, ensure_ascii=False)).replace('MANIFEST', json.dumps(manifest, ensure_ascii=False))
(root / 'dev/sprint-002/podglad.html').write_text(source, encoding='utf-8')
print('Created dev/sprint-002/podglad.html')
