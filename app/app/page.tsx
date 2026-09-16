'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat2,
  Trash2,
  Upload,
} from 'lucide-react';
import demoSentences from './sentences.json';

type TimelineItem = { start: number; speech_end: number; end: number };
type Manifest = { file: string; duration: number; timeline: TimelineItem[] };
type Sentence = {
  id: string;
  german: string;
  polish: string;
  note: string;
  position: number;
};
type AudioAsset = {
  file_url: string | null;
  status: string;
  is_current: boolean;
};
type PracticeSession = {
  id: string;
  summary: string;
  created_at: string;
  sentences: Sentence[];
  practice_set: { id: string; title: string; audio: AudioAsset | null };
};
type SentenceDraft = { german: string; polish: string; note: string };

const emptyDraft: SentenceDraft = { german: '', polish: '', note: '' };

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
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'practice' | 'library' | 'import'>(
    'practice',
  );
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [position, setPosition] = useState(0);
  const [message, setMessage] = useState('Wczytuję nagranie…');
  const [libraryMessage, setLibraryMessage] = useState('');
  const [importText, setImportText] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [newSentence, setNewSentence] = useState<SentenceDraft>(emptyDraft);
  const [editing, setEditing] = useState<Sentence | null>(null);
  const [editDraft, setEditDraft] = useState<SentenceDraft>(emptyDraft);
  const [deleting, setDeleting] = useState<Sentence | null>(null);

  const selected =
    sessions.find((session) => session.id === selectedId) ?? null;
  const activeSentences = useMemo(
    () =>
      selected
        ? selected.sentences
        : demoSentences.map((item, position) => ({
            id: item.id,
            german: item.de,
            polish: '',
            note: '',
            position,
          })),
    [selected],
  );
  const activeAudioUrl = selected
    ? selected.practice_set.audio?.is_current
      ? selected.practice_set.audio.file_url
      : null
    : manifest
      ? `/audio/${manifest.file}`
      : null;
  const activeTitle = selected?.practice_set.title ?? 'Moje pierwsze 8 zdań';

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
    const controller = new AbortController();
    fetch('/audio/practice.json', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('missing');
        const data: Manifest = await response.json();
        if (
          !/^[a-zA-Z0-9_-]+\.(wav|mp3|m4a)$/.test(data.file) ||
          !Number.isFinite(data.duration) ||
          !Array.isArray(data.timeline) ||
          data.timeline.some(
            (item) =>
              ![item.start, item.speech_end, item.end].every(Number.isFinite) ||
              item.start < 0 ||
              item.speech_end <= item.start ||
              item.end <= item.speech_end,
          )
        )
          throw new Error('invalid');
        setManifest(data);
        setMessage('Gotowe. Słuchaj i powtarzaj w przerwach.');
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setMessage('Nagranie nie jest dostępne.');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      audio.current?.pause();
      setPosition(0);
      setPlaying(false);
      if (selectedId && !activeAudioUrl)
        setMessage('Ten zestaw wymaga przygotowania aktualnego audio.');
      else if (activeAudioUrl)
        setMessage('Gotowe. Słuchaj i powtarzaj w przerwach.');
      audio.current?.load();
    });
  }, [selectedId, activeAudioUrl]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: activeTitle,
      artist: 'Gawor · niemiecki',
    });
    navigator.mediaSession.setActionHandler('play', () => {
      void audio.current
        ?.play()
        .catch(() => setMessage('Otwórz aplikację i naciśnij Start.'));
    });
    navigator.mediaSession.setActionHandler('pause', () =>
      audio.current?.pause(),
    );
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

  async function toggle() {
    if (!audio.current || !activeAudioUrl) return;
    if (!audio.current.paused) {
      audio.current.pause();
      return;
    }
    try {
      await audio.current.play();
    } catch {
      setMessage('Nie udało się odtworzyć nagrania. Spróbuj ponownie.');
    }
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
    if (!selected) return;
    setLibraryMessage('Sprawdzam możliwość przygotowania audio…');
    try {
      await api(`/api/practice-sets/${selected.practice_set.id}/audio`, {
        method: 'POST',
      });
      await loadSessions(selected.id);
      setLibraryMessage('Aktualne audio jest gotowe.');
    } catch (error) {
      setLibraryMessage(
        error instanceof Error
          ? error.message
          : 'Nie udało się przygotować audio.',
      );
    }
  }

  const timeline =
    manifest?.timeline.length === activeSentences.length
      ? manifest.timeline
      : [];
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
              disabled={!activeAudioUrl || !activeSentences.length}
            >
              {playing ? <Pause /> : <Play />}
              {playing
                ? 'Pauza'
                : position > 0
                  ? 'Wznów ćwiczenie'
                  : 'Zacznij powtarzać'}
            </Button>
            <output className="status">{message}</output>
            {activeAudioUrl && (
              <audio
                ref={audio}
                src={activeAudioUrl}
                preload="metadata"
                loop
                onTimeUpdate={(event) =>
                  setPosition(event.currentTarget.currentTime)
                }
                onPlay={() => {
                  setPlaying(true);
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
                  setMessage('Nie udało się wczytać audio.');
                }}
              >
                <track
                  kind="captions"
                  src="/audio/practice.de.vtt"
                  srcLang="de"
                  label="Niemiecki"
                />
              </audio>
            )}
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
                    className={playing && number === index ? 'active' : ''}
                  >
                    <span className="number">
                      {String(number + 1).padStart(2, '0')}
                    </span>
                    <span lang="de">{item.german}</span>
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
                      ) : (
                        <>
                          Audio nieaktualne lub jeszcze nieprzygotowane{' '}
                          <Button
                            variant="outline"
                            onClick={() => void prepareAudio()}
                          >
                            Przygotuj audio
                          </Button>
                        </>
                      )}
                    </div>
                    <ol className="editable-list">
                      {selected.sentences.map((item, number) => (
                        <li key={item.id}>
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
