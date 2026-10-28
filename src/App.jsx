import { useEffect, useMemo, useState } from 'react'
import './App.css'

const categories = ['Personal', 'Work', 'Ideas', 'Learning']
const colors = ['lilac', 'mint', 'peach', 'blue']

function Icon({ name, size = 18 }) {
  const paths = {
    all: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    note: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="8" cy="8" r="1" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function readNotes() {
  try {
    const savedNotes = JSON.parse(localStorage.getItem('papertrail-notes') || '[]')
    return Array.isArray(savedNotes) ? savedNotes : []
  } catch (error) {
    console.error('Could not read saved notes:', error)
    return []
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date))
}

function App() {
  const [notes, setNotes] = useState(readNotes)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState(categories[0])

  useEffect(() => {
    try {
      localStorage.setItem('papertrail-notes', JSON.stringify(notes))
    } catch (error) {
      console.error('Could not save notes:', error)
    }
  }, [notes])

  useEffect(() => {
    if (!isComposerOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeComposer()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isComposerOpen])

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLowerCase()

    return notes
      .filter((note) => {
        const matchesFilter = activeFilter === 'all'
          || (activeFilter === 'favorites' && note.pinned)
          || note.category === activeFilter
        const matchesSearch = !query
          || `${note.title} ${note.body} ${note.category}`.toLowerCase().includes(query)

        return matchesFilter && matchesSearch
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [activeFilter, notes, search])

  function closeComposer() {
    setIsComposerOpen(false)
    setEditingNote(null)
    setTitle('')
    setBody('')
    setCategory(categories[0])
  }

  function openComposer(note = null) {
    setEditingNote(note)
    setTitle(note?.title || '')
    setBody(note?.body || '')
    setCategory(note?.category || categories[0])
    setIsComposerOpen(true)
  }

  function saveNote(event) {
    event.preventDefault()
    const cleanTitle = title.trim()
    const cleanBody = body.trim()
    if (!cleanTitle && !cleanBody) return

    const now = new Date().toISOString()
    if (editingNote) {
      setNotes((currentNotes) => currentNotes.map((note) => (
        note.id === editingNote.id
          ? { ...note, title: cleanTitle || 'Untitled note', body: cleanBody, category, updatedAt: now }
          : note
      )))
    } else {
      setNotes((currentNotes) => [{
        id: crypto.randomUUID(),
        title: cleanTitle || 'Untitled note',
        body: cleanBody,
        category,
        color: colors[currentNotes.length % colors.length],
        pinned: false,
        createdAt: now,
        updatedAt: now,
      }, ...currentNotes])
    }

    closeComposer()
  }

  function togglePinned(noteId) {
    setNotes((currentNotes) => currentNotes.map((note) => (
      note.id === noteId ? { ...note, pinned: !note.pinned } : note
    )))
  }

  function deleteNote(noteId) {
    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId))
  }

  const isEmpty = notes.length === 0

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Papertrail home" onClick={() => setActiveFilter('all')}>
          <span className="brand-mark"><Icon name="note" size={20} /></span>
          <span>papertrail<span className="brand-period">.</span></span>
        </a>

        <div className="sidebar-section">
          <p className="sidebar-label">Workspace</p>
          <nav className="nav-list" aria-label="Notes filters">
            <button
              className={`nav-item ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <Icon name="all" /><span>All notes</span><span className="nav-count">{notes.length}</span>
            </button>
            <button
              className={`nav-item ${activeFilter === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveFilter('favorites')}
            >
              <Icon name="star" /><span>Favorites</span>
              <span className="nav-count">{notes.filter((note) => note.pinned).length}</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-section category-section">
          <p className="sidebar-label">Your categories</p>
          <nav className="nav-list" aria-label="Categories">
            {categories.map((item, index) => (
              <button
                className={`nav-item ${activeFilter === item ? 'active' : ''}`}
                key={item}
                onClick={() => setActiveFilter(item)}
              >
                <span className={`category-dot dot-${index}`} />
                <span>{item}</span>
                <span className="nav-count">{notes.filter((note) => note.category === item).length}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon"><Icon name="star" size={16} /></span>
            <p>A little note today can become a big idea tomorrow.</p>
          </div>
          <div className="profile">
            <div className="avatar">P</div>
            <div><strong>My workspace</strong><span>Personal space</span></div>
            <button className="profile-more" aria-label="Workspace options">•••</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>Notes</strong></div>
          <label className="search-box">
            <Icon name="search" size={17} />
            <input
              type="search"
              placeholder="Search your notes..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search notes"
            />
            <kbd>⌘ K</kbd>
          </label>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR THINKING SPACE</p>
              <h1>{activeFilter === 'all' ? 'All notes' : activeFilter === 'favorites' ? 'Favorites' : activeFilter}</h1>
              <p className="page-subtitle">
                {isEmpty ? 'A calm place for everything on your mind.' : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'} in your space`}
              </p>
            </div>
            <button className="primary-button" onClick={() => openComposer()}>
              <Icon name="plus" size={18} /><span>New note</span>
            </button>
          </div>

          <div className="notes-toolbar">
            <div className="results-label">
              <span>{search ? 'Search results' : activeFilter === 'all' ? 'Recently updated' : 'Your collection'}</span>
              <span className="result-count">{visibleNotes.length}</span>
            </div>
            <span className="sort-label"><Icon name="clock" size={15} /> Last edited</span>
          </div>

          {visibleNotes.length > 0 ? (
            <div className="notes-grid">
              {visibleNotes.map((note) => (
                <article className={`note-card note-${note.color}`} key={note.id}>
                  <div className="note-card-top">
                    <span className="note-category"><span className={`category-dot dot-${categories.indexOf(note.category)}`} />{note.category}</span>
                    <button
                      className={`icon-button pin-button ${note.pinned ? 'is-pinned' : ''}`}
                      onClick={() => togglePinned(note.id)}
                      aria-label={note.pinned ? 'Remove from favorites' : 'Add to favorites'}
                      title={note.pinned ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Icon name="star" size={17} />
                    </button>
                  </div>
                  <button className="note-content" onClick={() => openComposer(note)} aria-label={`Edit ${note.title}`}>
                    <h2>{note.title}</h2>
                    <p>{note.body || 'No details added yet.'}</p>
                  </button>
                  <div className="note-card-bottom">
                    <span className="note-date"><Icon name="clock" size={14} />{formatDate(note.updatedAt)}</span>
                    <div className="note-actions">
                      <button className="icon-button" onClick={() => openComposer(note)} aria-label={`Edit ${note.title}`} title="Edit note">
                        <Icon name="edit" size={16} />
                      </button>
                      <button className="icon-button delete-button" onClick={() => deleteNote(note.id)} aria-label={`Delete ${note.title}`} title="Delete note">
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-illustration">
                <div className="empty-paper"><Icon name="note" size={31} /></div>
                <span className="sparkle sparkle-one">✦</span>
                <span className="sparkle sparkle-two">✳</span>
              </div>
              <h2>{search ? 'No notes found' : activeFilter === 'favorites' ? 'No favorites just yet' : isEmpty ? 'Make room for your ideas' : 'Nothing in this collection'}</h2>
              <p>{search ? 'Try another search or check your spelling.' : activeFilter === 'favorites' ? 'Tap the star on a note to keep it close.' : 'Capture a thought, make a plan, or save something worth remembering.'}</p>
              {!search && activeFilter !== 'favorites' && (
                <button className="secondary-button" onClick={() => openComposer()}>
                  <Icon name="plus" size={17} /> Create your first note
                </button>
              )}
            </div>
          )}
          <footer className="page-footer"><span>Made for your thoughts</span><span>Take it one note at a time <Icon name="arrow" size={13} /></span></footer>
        </section>
      </main>

      {isComposerOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeComposer()}>
          <section className="composer" role="dialog" aria-modal="true" aria-labelledby="composer-title">
            <div className="composer-heading">
              <div>
                <p className="eyebrow">{editingNote ? 'REFINE YOUR THOUGHT' : 'CAPTURE A THOUGHT'}</p>
                <h2 id="composer-title">{editingNote ? 'Edit note' : 'A new note'}</h2>
              </div>
              <button className="icon-button close-button" onClick={closeComposer} aria-label="Close note editor"><Icon name="close" /></button>
            </div>
            <form onSubmit={saveNote}>
              <label className="field-label" htmlFor="note-title">Title</label>
              <input
                id="note-title"
                className="composer-title-input"
                placeholder="Give your note a name"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                autoFocus
              />
              <label className="field-label body-label" htmlFor="note-body">Your note</label>
              <textarea
                id="note-body"
                className="composer-body-input"
                placeholder="Start writing... anything on your mind."
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows="7"
              />
              <div className="composer-footer">
                <label className="category-select-label" htmlFor="note-category">
                  <Icon name="tag" size={16} />
                  <select id="note-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                    {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <button className="primary-button save-button" type="submit" disabled={!title.trim() && !body.trim()}>
                  <Icon name="check" size={17} />{editingNote ? 'Save changes' : 'Save note'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
