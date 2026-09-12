'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Headphones, Pause, Play, Repeat2 } from 'lucide-react';
import sentences from './sentences.json';

type Asset = { file: string; duration: number; timeline: { id: string; start: number; speech_end: number; end: number }[] };

export default function Home() {
  const audio = useRef<HTMLAudioElement>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [message, setMessage] = useState('Wczytuję nagranie…');
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/audio/practice.json', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('missing');
      const data: Asset = await response.json();
      if (!/^[a-zA-Z0-9_-]+\.(wav|mp3|m4a)$/.test(data.file) || !Number.isFinite(data.duration) || data.duration <= 0 ||
          !Array.isArray(data.timeline) || data.timeline.length !== sentences.length ||
          data.timeline.some((item, index) => item.id !== sentences[index].id ||
            ![item.start, item.speech_end, item.end].every(Number.isFinite) || item.start < 0 ||
            item.speech_end <= item.start || item.end <= item.speech_end)) throw new Error('invalid');
      setAsset(data);
      setMessage('Gotowe. Słuchaj i powtarzaj w przerwach.');
    }).catch(() => { if (!controller.signal.aborted) setMessage('Nagranie nie jest jeszcze dostępne. Zestaw czeka na przygotowanie głosu.'); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: 'Moje pierwsze 8 zdań', artist: 'Gawor · niemiecki' });
    navigator.mediaSession.setActionHandler('play', () => { void audio.current?.play().catch(() => setMessage('Otwórz aplikację i naciśnij Start, aby wznowić.')); });
    navigator.mediaSession.setActionHandler('pause', () => audio.current?.pause());
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.metadata = null;
    };
  }, []);

  async function toggle() {
    if (!audio.current || !asset) return;
    if (!audio.current.paused) { audio.current.pause(); return; }
    try { await audio.current.play(); }
    catch { setMessage('Nie udało się odtworzyć nagrania. Sprawdź połączenie i spróbuj ponownie.'); }
  }

  const current = asset?.timeline.find(item => position >= item.start && position < item.end);
  const index = current ? sentences.findIndex(sentence => sentence.id === current.id) : 0;
  const speaking = current ? position < current.speech_end : true;

  return <main>
    <header><a href="/" className="brand">gawor<span>.</span></a><span className="language">DE / PL</span></header>
    <section className="practice" aria-labelledby="practice-title">
      <div className="eyebrow"><Headphones size={18} aria-hidden="true" /> POWTARZANIE</div>
      <h1 id="practice-title">Twoje zdania.<br />Twój rytm.</h1>
      <p className="intro">Moje pierwsze 8 zdań <span>· Zestaw przykładowy</span></p>
      <div className="player">
        <div className="player-top"><span>{String(index + 1).padStart(2, '0')} / 08</span><span><Repeat2 size={16} aria-hidden="true" /> W pętli</span></div>
        <p className="sentence" lang="de">{sentences[index].de}</p>
        <p className="cue" aria-live="polite">{playing ? (waiting ? 'Wczytuję dźwięk…' : speaking ? 'Posłuchaj…' : 'Teraz Ty. Powtórz na głos.') : 'Słuchaj → powtarzaj → i jeszcze raz'}</p>
        <Button className="play-button" onClick={toggle} disabled={!asset}>
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{playing ? 'Pauza' : position > 0 ? 'Wznów ćwiczenie' : 'Zacznij powtarzać'}
        </Button>
        <p className="status" role="status">{message}</p>
        {asset && <audio ref={audio} src={`/audio/${asset.file}`} preload="metadata" loop
          onTimeUpdate={event => setPosition(event.currentTarget.currentTime)}
          onPlay={() => { setPlaying(true); setMessage('Przerwy na powtórzenie są częścią nagrania.'); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; }}
          onPause={() => { setPlaying(false); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; }}
          onWaiting={() => setWaiting(true)} onPlaying={() => setWaiting(false)}
          onError={() => { setPlaying(false); setWaiting(false); setMessage('Nie udało się wczytać audio. Sprawdź połączenie i spróbuj ponownie.'); }} />}
      </div>
    </section>
    <section className="set" aria-labelledby="set-title"><div className="set-heading"><h2 id="set-title">W tym zestawie</h2><span>8 zdań</span></div>
      <ol>{sentences.map((sentence, number) => <li key={sentence.id} className={playing && number === index ? 'active' : ''}>
        <span className="number">{String(number + 1).padStart(2, '0')}</span><span lang="de">{sentence.de}</span>
      </li>)}</ol>
    </section>
    <footer>Głos w nagraniu będzie generowany przez AI. Pierwszy test: dwa obiegi z zablokowanym ekranem.</footer>
  </main>;
}
