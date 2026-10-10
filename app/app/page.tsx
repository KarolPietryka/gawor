'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Check,
  Headphones,
  Library,
  LoaderCircle,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat2,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import type { AudioManifest } from '@/lib/audio';
type Sentence = {
  id: string;
  german: string;
  polish: string;
  note: string;
  position: number;
};
type AudioAsset = {
  file_url: string | null;
  status: 'ready' | 'stale' | 'pending' | 'failed';
  is_current: boolean;
  manifest: AudioManifest | null;
};
type PracticeSession = {
  id: string;
  summary: string;
  created_at: string;
  sentences: Sentence[];
  practice_set: { id: string; title: string; audio: AudioAsset | null };
};
type SentenceDraft = { german: string; polish: string; note: string };
type PlaybackMode = 'loop' | 'sentence' | null;
type LoopResume = { position: number; wasPlaying: boolean };
type AudioCache = {
  fileUrl: string;
  objectUrl: string | null;
  promise: Promise<string>;
};

const emptyDraft: SentenceDraft = { german: '', polish: '', note: '' };

function vttTime(seconds: number) {
  const milliseconds = Math.round(seconds * 1000);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const wholeSeconds = Math.floor((milliseconds % 60_000) / 1000);
  const remainder = milliseconds % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
    wholeSeconds,
  ).padStart(2, '0')}.${String(remainder).padStart(3, '0')}`;
}

async function api<T = Record<string, unknown>>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok)
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'Nie udało się wykonać operacji.',
    );
  return data as T;
}

export default function Home() {
  const audio = useRef<HTMLAudioElement>(null);
  const audioCache = useRef<AudioCache | null>(null);
  const loadedObjectUrl = useRef<string | null>(null);
  const playbackMode = useRef<PlaybackMode>(null);
  const loopResume = useRef<LoopResume | null>(null);
  const loopShouldResume = useRef(false);
  const sentenceEnd = useRef<number | null>(null);
  const commandId = useRef(0);
  const startLoopRef = useRef<(() => void) | null>(null);
  const currentAudioUrl = useRef<string | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'practice' | 'library' | 'import'>(
    'practice',
  );
  const [playing, setPlaying] = useState(false);
  const [playback, setPlayback] = useState<PlaybackMode>(null);
  const [waiting, setWaiting] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [cacheLoadingUrl, setCacheLoadingUrl] = useState<string | null>(null);
  const [previewSentence, setPreviewSentence] = useState<number | null>(null);
  const [preparingAudio, setPreparingAudio] = useState(false);
  const [position, setPosition] = useState(0);
  const [message, setMessage] = useState('Wybierz zestaw z biblioteki.');
  const [libraryMessage, setLibraryMessage] = useState('');
  const [importText, setImportText] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [newSentence, setNewSentence] = useState<SentenceDraft>(emptyDraft);
  const [editing, setEditing] = useState<Sentence | null>(null);
  const [editDraft, setEditDraft] = useState<SentenceDraft>(emptyDraft);
  const [deleting, setDeleting] = useState<Sentence | null>(null);

  const selected =
    sessions.find((session) => session.id === selectedId) ?? null;
  const activeSentences = useMemo(() => selected?.sentences ?? [], [selected]);
  const activeAudioUrl = selected
    ? selected.practice_set.audio?.is_current
      ? selected.practice_set.audio.file_url
      : null
    : null;
  currentAudioUrl.current = activeAudioUrl;
  const activeTitle = selected?.practice_set.title ?? 'Wybierz zestaw';
  const audioLoading =
    loadingAudio || Boolean(activeAudioUrl && cacheLoadingUrl === activeAudioUrl);
  const timeline = useMemo(
    () =>
      selected?.practice_set.audio?.is_current &&
      selected.practice_set.audio.manifest?.timeline.length ===
        activeSentences.length
        ? selected.practice_set.audio.manifest.timeline
        : [],
    [activeSentences.length, selected],
  );
  const audioReady = Boolean(
    activeAudioUrl && timeline.length === activeSentences.length,
  );

  async function loadSessions(preferId?: string) {
    try {
      const data = await api<{ sessions: PracticeSession[] }>('/api/sessions');
      setSessions(data.sessions);
      if (preferId) setSelectedId(preferId);
    } catch (error) {
      setLibraryMessage(
        error instanceof Error
          ? error.message
          : 'Biblioteka jest chwilowo niedostępna.',
      );
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadSessions());
  }, []);

  useEffect(() => {
    commandId.current += 1;
    audio.current?.pause();
    playbackMode.current = null;
    loopResume.current = null;
    loopShouldResume.current = false;
    sentenceEnd.current = null;
    setPlayback(null);
    setPreviewSentence(null);
    setPosition(0);
    setPlaying(false);
    setWaiting(false);
    setLoadingAudio(false);
    if (audioCache.current?.fileUrl !== activeAudioUrl) {
      const oldObjectUrl = audioCache.current?.objectUrl;
      if (audio.current) {
        audio.current.removeAttribute('src');
        audio.current.load();
      }
      loadedObjectUrl.current = null;
      audioCache.current = null;
      if (oldObjectUrl) URL.revokeObjectURL(oldObjectUrl);
    }
    if (selectedId && !activeAudioUrl)
      setMessage('Ten zestaw wymaga przygotowania aktualnego audio.');
    else if (activeAudioUrl)
      setMessage('Gotowe. Słuchaj i powtarzaj w przerwach.');
  }, [selectedId, activeAudioUrl]);

  useEffect(
    () => () => {
      audio.current?.pause();
      if (audioCache.current?.objectUrl)
        URL.revokeObjectURL(audioCache.current.objectUrl);
      audioCache.current = null;
      loadedObjectUrl.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: activeTitle,
      artist: 'Gawor · niemiecki',
    });
    navigator.mediaSession.setActionHandler('play', () => {
      startLoopRef.current?.();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      if (playbackMode.current === 'loop') {
        loopShouldResume.current = false;
        audio.current?.pause();
      }
    });
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.metadata = null;
    };
  }, [activeTitle]);

  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'get_practice_state',
            title: 'Stan ćwiczenia',
            description:
              'Odczytuje wybrany zestaw, liczbę zdań oraz stan odtwarzania.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute(input: unknown) {
              if (
                !input ||
                typeof input !== 'object' ||
                Object.keys(input).length
              )
                throw new Error('Oczekiwano pustego obiektu.');
              return {
                title: activeTitle,
                sentence_count: activeSentences.length,
                audio_ready: Boolean(activeAudioUrl),
                paused: audio.current?.paused ?? true,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Odtwarzacz działa również bez WebMCP. */
    }
    return () => lifecycle.abort();
  }, [activeAudioUrl, activeSentences.length, activeTitle]);

  const setMode = useCallback((mode: PlaybackMode) => {
    playbackMode.current = mode;
    setPlayback(mode);
  }, []);

  const ensureAudioLoaded = useCallback(async (fileUrl: string) => {
    const player = audio.current;
    if (!player) throw new Error('Odtwarzacz audio jest niedostępny.');

    let cached = audioCache.current;
    if (!cached || cached.fileUrl !== fileUrl) {
      player.pause();
      player.removeAttribute('src');
      player.load();
      loadedObjectUrl.current = null;
      if (cached?.objectUrl) URL.revokeObjectURL(cached.objectUrl);

      const record: AudioCache = {
        fileUrl,
        objectUrl: null,
        promise: Promise.resolve(''),
      };
      record.promise = fetch(fileUrl, { cache: 'no-store' })
        .then(async (response) => {
          if (!response.ok)
            throw new Error('Nie udało się pobrać aktualnego audio.');
          return URL.createObjectURL(await response.blob());
        })
        .then((objectUrl) => {
          if (audioCache.current !== record) {
            URL.revokeObjectURL(objectUrl);
            throw new Error('Zmieniono wybrany zestaw. Spróbuj ponownie.');
          }
          record.objectUrl = objectUrl;
          return objectUrl;
        })
        .catch((error: unknown) => {
          if (audioCache.current === record) audioCache.current = null;
          throw error;
        });
      audioCache.current = record;
      cached = record;
    }

    const objectUrl = await cached.promise;
    if (audioCache.current !== cached || currentAudioUrl.current !== fileUrl)
      throw new Error('Zmieniono wybrany zestaw. Spróbuj ponownie.');

    if (loadedObjectUrl.current !== objectUrl) {
      const metadataReady = new Promise<void>((resolve, reject) => {
        const onReady = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error('Nie udało się otworzyć nagrania.'));
        };
        const cleanup = () => {
          player.removeEventListener('loadedmetadata', onReady);
          player.removeEventListener('error', onError);
        };
        player.addEventListener('loadedmetadata', onReady, { once: true });
        player.addEventListener('error', onError, { once: true });
      });
      player.src = objectUrl;
      player.load();
      try {
        await metadataReady;
      } catch (error) {
        if (audioCache.current === cached) {
          audioCache.current = null;
          URL.revokeObjectURL(objectUrl);
        }
        throw error;
      }
      loadedObjectUrl.current = objectUrl;
    }
    return player;
  }, []);

  useEffect(() => {
    if (!activeAudioUrl || !audioReady) {
      setCacheLoadingUrl(null);
      return;
    }
    let cancelled = false;
    setCacheLoadingUrl(activeAudioUrl);
    void ensureAudioLoaded(activeAudioUrl)
      .catch(() => {})
      .finally(() => {
        if (!cancelled && currentAudioUrl.current === activeAudioUrl)
          setCacheLoadingUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeAudioUrl, audioReady, ensureAudioLoaded]);

  const startLoop = useCallback(async () => {
    if (!activeAudioUrl || !audioReady) return;
    const command = ++commandId.current;
    loopResume.current = null;
    sentenceEnd.current = null;
    loopShouldResume.current = true;
    setPreviewSentence(null);
    setMode('loop');
    setLoadingAudio(true);
    try {
      const player = await ensureAudioLoaded(activeAudioUrl);
      if (command !== commandId.current) return;
      player.pause();
      player.loop = true;
      player.currentTime = 0;
      setPosition(0);
      await player.play();
    } catch (error) {
      if (command === commandId.current) {
        setMode(null);
        loopShouldResume.current = false;
        setMessage(
          error instanceof Error
            ? error.message
            : 'Nie udało się odtworzyć nagrania. Spróbuj ponownie.',
        );
      }
    } finally {
      if (command === commandId.current) setLoadingAudio(false);
    }
  }, [activeAudioUrl, audioReady, ensureAudioLoaded, setMode]);
  startLoopRef.current = () => void startLoop();

  async function playSentence(sentenceNumber: number) {
    const item = timeline[sentenceNumber];
    if (!activeAudioUrl || !audioReady || !item) return;
    const player = audio.current;
    const mode = playbackMode.current;
    if (mode === 'loop' && !loopResume.current) {
      loopResume.current = {
        position: player?.currentTime ?? position,
        wasPlaying: loopShouldResume.current,
      };
    }
    const command = ++commandId.current;
    sentenceEnd.current = item.speech_end;
    setPreviewSentence(sentenceNumber);
    setMode('sentence');
    setLoadingAudio(true);
    try {
      const currentPlayer = await ensureAudioLoaded(activeAudioUrl);
      if (command !== commandId.current) return;
      currentPlayer.pause();
      currentPlayer.loop = false;
      currentPlayer.currentTime = item.start;
      setPosition(item.start);
      await currentPlayer.play();
      setMessage(`Odsłuch zdania ${sentenceNumber + 1} z ${activeSentences.length}.`);
    } catch (error) {
      if (command === commandId.current) {
        setMode(null);
        setPreviewSentence(null);
        sentenceEnd.current = null;
        loopResume.current = null;
        loopShouldResume.current = false;
        setMessage(
          error instanceof Error
            ? error.message
            : 'Nie udało się odtworzyć zdania.',
        );
      }
    } finally {
      if (command === commandId.current) setLoadingAudio(false);
    }
  }

  function finishSentence() {
    if (playbackMode.current !== 'sentence') return;
    const player = audio.current;
    if (!player) return;
    commandId.current += 1;
    const resume = loopResume.current;
    player.pause();
    sentenceEnd.current = null;
    setPreviewSentence(null);
    loopResume.current = null;
    if (resume) {
      player.loop = true;
      setMode('loop');
      loopShouldResume.current = resume.wasPlaying;
      player.currentTime = resume.position;
      setPosition(resume.position);
      if (resume.wasPlaying) {
        void player.play().catch(() => {
          setMode(null);
          loopShouldResume.current = false;
          setMessage('Nie udało się wznowić pętli. Naciśnij Start.');
        });
      }
      return;
    }
    player.loop = false;
    setMode(null);
    loopShouldResume.current = false;
    setMessage('Odsłuch zdania zakończony.');
  }

  function updatePosition(value: number) {
    setPosition(value);
    const end = sentenceEnd.current;
    if (playbackMode.current === 'sentence' && end !== null && value >= end)
      finishSentence();
  }

  async function toggle() {
    const player = audio.current;
    if (playbackMode.current === 'loop') {
      if (player && !player.paused) {
        loopShouldResume.current = false;
        player.pause();
      } else if (loadingAudio) {
        commandId.current += 1;
        setLoadingAudio(false);
        loopShouldResume.current = false;
        setMode(null);
      } else if (player && activeAudioUrl) {
        loopShouldResume.current = true;
        try {
          await player.play();
        } catch {
          setMessage('Nie udało się wznowić nagrania. Spróbuj ponownie.');
        }
      }
      return;
    }
    await startLoop();
  }

  async function importSession() {
    setImportMessage('Zapisuję sesję…');
    try {
      const data = await api<{ id: string; sentence_count: number }>(
        '/api/sessions',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: importText,
        },
      );
      setImportText('');
      setImportMessage(`Zapisano ${data.sentence_count} zdań.`);
      await loadSessions(data.id);
      setView('library');
    } catch (error) {
      setImportMessage(
        error instanceof Error ? error.message : 'Nie udało się zapisać sesji.',
      );
    }
  }

  async function addSentence() {
    if (!selected) return;
    setLibraryMessage('Dodaję zdanie…');
    try {
      await api(`/api/sessions/${selected.id}/sentences`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newSentence),
      });
      setNewSentence(emptyDraft);
      await loadSessions(selected.id);
      setLibraryMessage('Zdanie zostało dodane. Audio wymaga odświeżenia.');
    } catch (error) {
      setLibraryMessage(
        error instanceof Error ? error.message : 'Nie udało się dodać zdania.',
      );
    }
  }

  async function saveEdit() {
    if (!editing || !selected) return;
    setLibraryMessage('Zapisuję zmianę…');
    try {
      await api(`/api/sentences/${editing.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(editDraft),
      });
      setEditing(null);
      await loadSessions(selected.id);
      setLibraryMessage('Zdanie zmienione. Stare audio zostało unieważnione.');
    } catch (error) {
      setLibraryMessage(
        error instanceof Error
          ? error.message
          : 'Nie udało się zmienić zdania.',
      );
    }
  }

  async function deleteSentence() {
    if (!deleting || !selected) return;
    try {
      await api(`/api/sentences/${deleting.id}`, { method: 'DELETE' });
      setDeleting(null);
      await loadSessions(selected.id);
      setLibraryMessage('Zdanie usunięte. Stare audio zostało unieważnione.');
    } catch (error) {
      setLibraryMessage(
        error instanceof Error ? error.message : 'Nie udało się usunąć zdania.',
      );
    }
  }

  async function prepareAudio() {
    if (!selected || preparingAudio) return;
    setPreparingAudio(true);
    setLibraryMessage('Przygotowuję mowę i przerwy dla całego zestawu…');
    try {
      const result = await api<{ status: 'ready' | 'pending' }>(
        `/api/practice-sets/${selected.practice_set.id}/audio`,
        {
          method: 'POST',
        },
      );
      await loadSessions(selected.id);
      setLibraryMessage(
        result.status === 'ready'
          ? 'Aktualne audio jest gotowe.'
          : 'Audio jest jeszcze przygotowywane. Odśwież bibliotekę za chwilę.',
      );
    } catch (error) {
      setLibraryMessage(
        error instanceof Error
          ? error.message
          : 'Nie udało się przygotować audio.',
      );
    } finally {
      setPreparingAudio(false);
    }
  }

  const captions = useMemo(() => {
    if (timeline.length !== activeSentences.length) return '';
    return [
      'WEBVTT',
      ...timeline.map(
        (item, index) =>
          `${vttTime(item.start)} --> ${vttTime(item.speech_end)}\n${activeSentences[index]?.german ?? ''}`,
      ),
    ].join('\n\n');
  }, [activeSentences, timeline]);
  const captionSource = `data:text/vtt;charset=utf-8,${encodeURIComponent(captions || 'WEBVTT')}`;
  const current = timeline.find(
    (item) => position >= item.start && position < item.end,
  );
  const index = current ? timeline.indexOf(current) : 0;
  const speaking = current ? position < current.speech_end : true;
  const shownSentence =
    activeSentences[index]?.german ?? 'Ten zestaw jest pusty.';

  return (
    <main>
      <header>
        <Link href="/" className="brand">
          gawor<span>.</span>
        </Link>
        <nav aria-label="Główna nawigacja">
          <button
            className={view === 'practice' ? 'nav-active' : ''}
            onClick={() => setView('practice')}
          >
            <Headphones />
            Ćwicz
          </button>
          <button
            className={view === 'library' ? 'nav-active' : ''}
            onClick={() => setView('library')}
          >
            <Library />
            Biblioteka
          </button>
          <button
            className={view === 'import' ? 'nav-active' : ''}
            onClick={() => setView('import')}
          >
            <Upload />
            Import
          </button>
        </nav>
      </header>

      {view === 'practice' && (
        <section className="practice" aria-labelledby="practice-title">
          <div className="eyebrow">
            <Headphones aria-hidden="true" /> POWTARZANIE
          </div>
          <div className="title-row">
            <div>
              <h1 id="practice-title">
                Twoje zdania.
                <br />
                Twój rytm.
              </h1>
              <p className="intro">{activeTitle}</p>
            </div>
            {sessions.length > 0 && (
              <Button variant="outline" onClick={() => setView('library')}>
                <BookOpen />
                Zmień zestaw
              </Button>
            )}
          </div>
          <div className="player">
            <div className="player-top">
              <span>
                {String(Math.min(index + 1, activeSentences.length)).padStart(
                  2,
                  '0',
                )}{' '}
                / {String(activeSentences.length).padStart(2, '0')}
              </span>
              <span>
                <Repeat2 aria-hidden="true" /> W pętli
              </span>
            </div>
            <p className="sentence" lang="de">
              {shownSentence}
            </p>
            <p className="translation">{activeSentences[index]?.polish}</p>
            <p className="cue" aria-live="polite">
              {playing
                ? waiting
                  ? 'Wczytuję dźwięk…'
                  : speaking
                    ? 'Posłuchaj…'
                    : 'Teraz Ty. Powtórz na głos.'
                : 'Słuchaj → powtarzaj → i jeszcze raz'}
            </p>
            <Button
              className="play-button"
              onClick={toggle}
              disabled={!audioReady || audioLoading && playback === 'loop'}
            >
              {audioLoading && playback === 'loop' ? (
                <LoaderCircle className="spin" />
              ) : playback === 'loop' && playing ? (
                <Pause />
              ) : (
                <Play />
              )}
              {audioLoading && playback === 'loop'
                ? 'Wczytuję audio…'
                : playback === 'loop' && playing
                ? 'Pauza'
                : playback === 'loop' && position > 0
                  ? 'Wznów ćwiczenie'
                  : 'Zacznij powtarzać'}
            </Button>
            <output className="status">{message}</output>
          </div>
          <section
            className="sentence-list"
            aria-labelledby="practice-list-title"
          >
            <div className="section-heading">
              <h2 id="practice-list-title">W tym zestawie</h2>
              <span>{activeSentences.length} zdań</span>
            </div>
            {activeSentences.length ? (
              <ol>
                {activeSentences.map((item, number) => (
                  <li
                    key={item.id}
                    className={
                      previewSentence === number && playing ||
                      playback === 'loop' && playing && number === index
                        ? 'active'
                        : ''
                    }
                  >
                    <span className="number">
                      {String(number + 1).padStart(2, '0')}
                    </span>
                    <span className="practice-sentence-copy" lang="de">
                      {item.german}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Odtwórz zdanie ${number + 1}`}
                      title="Odtwórz tylko to zdanie"
                      disabled={!audioReady || audioLoading}
                      onClick={() => void playSentence(number)}
                    >
                      {audioLoading ? (
                        <LoaderCircle className="spin" />
                      ) : previewSentence === number && playing ? (
                        <Volume2 />
                      ) : (
                        <Play />
                      )}
                    </Button>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty">Dodaj pierwsze zdanie w bibliotece.</div>
            )}
          </section>
        </section>
      )}

      {view === 'library' && (
        <section className="workspace" aria-labelledby="library-title">
          <div className="eyebrow">
            <Library aria-hidden="true" /> BIBLIOTEKA
          </div>
          <h1 id="library-title">Twoje sesje</h1>
          <p className="intro">
            Wybierz zapisany zestaw, popraw zdania i wróć do ćwiczeń.
          </p>
          {!sessions.length && (
            <div className="empty">
              <BookOpen />
              <strong>Biblioteka jest pusta</strong>
              <span>Zaimportuj JSON z zakończonej rozmowy.</span>
              <Button onClick={() => setView('import')}>
                Dodaj pierwszą sesję
              </Button>
            </div>
          )}
          {sessions.length > 0 && (
            <div className="library-layout">
              <aside className="session-list" aria-label="Zapisane sesje">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    className={session.id === selectedId ? 'selected' : ''}
                    onClick={() => setSelectedId(session.id)}
                  >
                    <span>{session.practice_set.title}</span>
                    <small>
                      {new Date(session.created_at).toLocaleDateString('pl-PL')}{' '}
                      · {session.sentences.length} zdań
                    </small>
                  </button>
                ))}
              </aside>
              <div className="session-detail">
                {selected ? (
                  <>
                    <div className="section-heading">
                      <div>
                        <h2>{selected.practice_set.title}</h2>
                        <p>{selected.summary || 'Sesja bez opisu'}</p>
                      </div>
                      <Button
                        onClick={() => {
                          setView('practice');
                          setPosition(0);
                        }}
                        disabled={!selected.practice_set.audio?.is_current}
                      >
                        <Play />
                        Ćwicz
                      </Button>
                    </div>
                    <div
                      className={`audio-state ${selected.practice_set.audio?.is_current ? 'ready' : ''}`}
                    >
                      {selected.practice_set.audio?.is_current ? (
                        <>
                          <Check />
                          Audio zgodne z zestawem
                        </>
                      ) : selected.practice_set.audio?.status === 'pending' ||
                        preparingAudio ? (
                        <>Przygotowuję aktualne audio…</>
                      ) : selected.practice_set.audio?.status === 'failed' ? (
                        <>
                          Poprzednie przygotowanie nie powiodło się{' '}
                          <Button
                            variant="outline"
                            onClick={() => void prepareAudio()}
                            disabled={
                              preparingAudio || !selected.sentences.length
                            }
                          >
                            Spróbuj ponownie
                          </Button>
                        </>
                      ) : (
                        <>
                          Audio nieaktualne lub jeszcze nieprzygotowane{' '}
                          <Button
                            variant="outline"
                            onClick={() => void prepareAudio()}
                            disabled={
                              preparingAudio || !selected.sentences.length
                            }
                          >
                            Przygotuj audio
                          </Button>
                        </>
                      )}
                    </div>
                    <ol className="editable-list">
                      {selected.sentences.map((item, number) => (
                        <li
                          key={item.id}
                          className={
                            previewSentence === number && playing ? 'active' : ''
                          }
                        >
                          <span className="number">
                            {String(number + 1).padStart(2, '0')}
                          </span>
                          <span className="sentence-copy">
                            <strong lang="de">{item.german}</strong>
                            {item.polish && <small>{item.polish}</small>}
                          </span>
                          <span className="row-actions">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Odtwórz zdanie ${number + 1}`}
                              title="Odtwórz tylko to zdanie"
                              disabled={!audioReady || audioLoading}
                              onClick={() => void playSentence(number)}
                            >
                              {audioLoading ? (
                                <LoaderCircle className="spin" />
                              ) : previewSentence === number && playing ? (
                                <Volume2 />
                              ) : (
                                <Play />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Edytuj zdanie"
                              onClick={() => {
                                setEditing(item);
                                setEditDraft({
                                  german: item.german,
                                  polish: item.polish,
                                  note: item.note,
                                });
                              }}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Usuń zdanie"
                              onClick={() => setDeleting(item)}
                            >
                              <Trash2 />
                            </Button>
                          </span>
                        </li>
                      ))}
                    </ol>
                    <div className="add-sentence">
                      <h3>Dodaj zdanie</h3>
                      <Input
                        lang="de"
                        placeholder="Zdanie po niemiecku"
                        value={newSentence.german}
                        onChange={(event) =>
                          setNewSentence({
                            ...newSentence,
                            german: event.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Znaczenie po polsku (opcjonalnie)"
                        value={newSentence.polish}
                        onChange={(event) =>
                          setNewSentence({
                            ...newSentence,
                            polish: event.target.value,
                          })
                        }
                      />
                      <Button
                        onClick={() => void addSentence()}
                        disabled={!newSentence.german.trim()}
                      >
                        <Plus />
                        Dodaj do zestawu
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="empty">Wybierz sesję z listy.</div>
                )}
              </div>
            </div>
          )}
          <output className="page-status">{libraryMessage}</output>
        </section>
      )}

      {view === 'import' && (
        <section
          className="workspace import-view"
          aria-labelledby="import-title"
        >
          <div className="eyebrow">
            <Upload aria-hidden="true" /> NOWA SESJA
          </div>
          <h1 id="import-title">Dodaj rozmowę</h1>
          <p className="intro">
            Wklej JSON wygenerowany przez Gawora po komendzie „koniec sesji”.
            Puste i powtórzone zdania zostaną pominięte.
          </p>
          <div className="import-card">
            <label htmlFor="session-json">JSON sesji</label>
            <Textarea
              id="session-json"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              rows={12}
              placeholder={
                '{\n  "session_summary": "Rozmowa o pracy",\n  "sentences": [\n    { "german": "...", "polish": "..." }\n  ]\n}'
              }
            />
            <Button
              size="lg"
              onClick={() => void importSession()}
              disabled={!importText.trim()}
            >
              <Upload />
              Zapisz w bibliotece
            </Button>
            <output className="page-status">{importMessage}</output>
          </div>
        </section>
      )}

      <audio
        ref={audio}
        className="audio-engine"
        preload="none"
        loop={playback === 'loop'}
        onTimeUpdate={(event) =>
          updatePosition(event.currentTarget.currentTime)
        }
        onPlay={() => {
          setPlaying(true);
          if (playbackMode.current === 'loop')
            setMessage('Przerwy na powtórzenie są częścią nagrania.');
          if ('mediaSession' in navigator)
            navigator.mediaSession.playbackState = 'playing';
        }}
        onPause={() => {
          setPlaying(false);
          if ('mediaSession' in navigator)
            navigator.mediaSession.playbackState = 'paused';
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onError={() => {
          setPlaying(false);
          setWaiting(false);
          setLoadingAudio(false);
          if (audioCache.current?.objectUrl)
            URL.revokeObjectURL(audioCache.current.objectUrl);
          audioCache.current = null;
          loadedObjectUrl.current = null;
          setMode(null);
          setPreviewSentence(null);
          sentenceEnd.current = null;
          loopResume.current = null;
          loopShouldResume.current = false;
          setMessage('Nie udało się wczytać audio.');
        }}
        onEnded={() => {
          if (playbackMode.current === 'sentence') finishSentence();
        }}
      >
        <track
          kind="captions"
          src={captionSource}
          srcLang="de"
          label="Niemiecki"
        />
      </audio>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="edit-dialog">
          <DialogHeader>
            <DialogTitle>Edytuj zdanie</DialogTitle>
            <DialogDescription>
              Zmiana tekstu unieważni wcześniejsze audio tego zestawu.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="edit-german">Po niemiecku</label>
          <Input
            id="edit-german"
            lang="de"
            value={editDraft.german}
            onChange={(event) =>
              setEditDraft({ ...editDraft, german: event.target.value })
            }
          />
          <label htmlFor="edit-polish">Po polsku</label>
          <Input
            id="edit-polish"
            value={editDraft.polish}
            onChange={(event) =>
              setEditDraft({ ...editDraft, polish: event.target.value })
            }
          />
          <label htmlFor="edit-note">Notatka</label>
          <Textarea
            id="edit-note"
            value={editDraft.note}
            onChange={(event) =>
              setEditDraft({ ...editDraft, note: event.target.value })
            }
          />
          <DialogFooter>
            <Button
              onClick={() => void saveEdit()}
              disabled={!editDraft.german.trim()}
            >
              Zapisz zmianę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć to zdanie?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.german} Zmiana unieważni wcześniejsze audio zestawu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void deleteSentence()}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer>
        Dane sesji są zapisywane trwale na serwerze. Głos wygenerowany przez AI.
      </footer>
    </main>
  );
}
