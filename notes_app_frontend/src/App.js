import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/**
 * PUBLIC_INTERFACE
 * Root app component for the Personal Notes Organizer.
 * - Provides layout: header, sidebar (folders/tags), main list, and detail/edit pane.
 * - Manages all note CRUD, search/filter, and tag/folder sidebar logic in-memory.
 * - Styled with modern, light theme using provided primary, secondary, and accent colors.
 */
function App() {
  // THEME MANAGEMENT (keep dark/light toggle for user preference)
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Notes are managed in local state (array of note objects)
  const [notes, setNotes] = useState(() => {
    // Initial demo notes (could seed with empty if needed)
    return [
      {
        id: 1,
        title: "Welcome to Notes!",
        content: "Start jotting your thoughts or ideas.",
        tags: ["General"],
        folder: "Personal",
        created: Date.now(),
        updated: Date.now(),
      },
      {
        id: 2,
        title: "Work Ideas",
        content: "Project brainstorm and to-dos go here.",
        tags: ["Work"],
        folder: "Work",
        created: Date.now(),
        updated: Date.now(),
      },
    ];
  });
  const [selectedNoteId, setSelectedNoteId] = useState(notes[0]?.id || null);
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState("All Notes");
  const [sidebarView, setSidebarView] = useState("folders"); // 'folders' or 'tags'

  // Form state for new/editing notes
  const [editMode, setEditMode] = useState(false);
  const [noteDraft, setNoteDraft] = useState(null);

  // Tag/folder calculations
  const allFolders = React.useMemo(
    () => [
      "All Notes",
      ...Array.from(new Set(notes.map((n) => n.folder).filter(Boolean))),
    ],
    [notes]
  );
  const allTags = React.useMemo(
    () =>
      Array.from(
        new Set(
          notes
            .map((n) => n.tags)
            .flat()
            .filter((t) => t && t.trim() !== "")
        )
      ),
    [notes]
  );

  // Filter notes for list
  const visibleNotes = notes
    .filter((n) => {
      if (
        activeFolder !== "All Notes" &&
        (!n.folder || n.folder !== activeFolder)
      )
        return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !n.title.toLowerCase().includes(s) &&
          !n.content.toLowerCase().includes(s) &&
          !n.tags.some((tag) => tag.toLowerCase().includes(s))
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => b.updated - a.updated);

  // Select a note
  const handleSelectNote = (noteId) => {
    setSelectedNoteId(noteId);
    setEditMode(false);
    setNoteDraft(null);
  };

  // CRUD helpers
  // PUBLIC_INTERFACE
  function handleCreateNote() {
    const now = Date.now();
    const newNote = {
      id: now,
      title: "",
      content: "",
      tags: [],
      folder: "Personal",
      created: now,
      updated: now,
    };
    setNotes((notes) => [newNote, ...notes]);
    setSelectedNoteId(newNote.id);
    setEditMode(true);
    setNoteDraft({ ...newNote });
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    setNotes((notes) => notes.filter((n) => n.id !== id));
    setEditMode(false);
    setNoteDraft(null);
    setSelectedNoteId(
      (prev) => (notes.length > 1 ? notes.find((n) => n.id !== id)?.id : null)
    );
  }

  // PUBLIC_INTERFACE
  function handleEditNote() {
    const note = notes.find((n) => n.id === selectedNoteId);
    setEditMode(true);
    setNoteDraft({ ...note });
  }

  // PUBLIC_INTERFACE
  function handleSaveNote() {
    // Minimal validation
    if (!noteDraft.title.trim()) {
      alert("Note title is required.");
      return;
    }
    setNotes((notes) =>
      notes.map((n) =>
        n.id === noteDraft.id
          ? { ...noteDraft, updated: Date.now() }
          : n
      )
    );
    setEditMode(false);
    setNoteDraft(null);
  }

  // PUBLIC_INTERFACE
  function handleNoteDraftChange(e) {
    const { name, value } = e.target;
    setNoteDraft((draft) => ({ ...draft, [name]: value }));
  }

  function handleNoteDraftTagsChange(value) {
    const tagsArr = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "");
    setNoteDraft((draft) => ({ ...draft, tags: tagsArr }));
  }

  function handleNoteDraftFolderChange(value) {
    setNoteDraft((draft) => ({ ...draft, folder: value }));
  }

  // Keyboard shortcut: Ctrl+N for new note
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handleCreateNote();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line
  }, []);

  // Sidebar click: change folder/tag filter
  function handleSidebarSelect(name) {
    setActiveFolder(name);
  }

  function handleStartTagFilter(tag) {
    setSearch(tag);
    setActiveFolder("All Notes");
  }

  // UI: Theming colors
  const themeVars = {
    "--brand-primary": "#3498db",
    "--brand-secondary": "#2ecc71",
    "--brand-accent": "#e67e22",
    "--sidebar-bg": "#f8f9fa",
    "--sidebar-active-bg": "#e6f2fc",
    "--sidebar-text": "#34495e",
    "--sidebar-active": "#3498db",
    "--header-bg": "#3498db",
  };

  // ACTIVE NOTE
  const activeNote = notes.find((n) => n.id === selectedNoteId);

  // AUTOFOCUS title field on create/edit
  const titleRef = useRef(null);
  useEffect(() => {
    if (editMode && titleRef.current) {
      titleRef.current.focus();
    }
  }, [editMode]);

  return (
    <div className="notes-app-root" style={themeVars}>
      <header className="notes-header">
        <span className="notes-title">
          <span role="img" aria-label="notes">
            📝
          </span>
          &nbsp;Personal Notes Organizer
        </span>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>

      <div className="notes-layout">
        {/* SIDEBAR */}
        <aside className="notes-sidebar">
          <div className="sidebar-toggle-bar">
            <button
              className={`sidebar-tab${sidebarView === "folders" ? " active" : ""}`}
              onClick={() => setSidebarView("folders")}
            >
              Folders
            </button>
            <button
              className={`sidebar-tab${sidebarView === "tags" ? " active" : ""}`}
              onClick={() => setSidebarView("tags")}
            >
              Tags
            </button>
          </div>

          {sidebarView === "folders" ? (
            <ul className="folder-list">
              {allFolders.map((folder) => (
                <li
                  key={folder}
                  className={activeFolder === folder ? "active" : ""}
                  onClick={() => handleSidebarSelect(folder)}
                >
                  <span className="sidebar-dot" />
                  {folder}
                  {folder !== "All Notes" && (
                    <span className="count">
                      {notes.filter((n) => n.folder === folder).length}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="tag-list">
              {allTags.length === 0 && (
                <li className="empty">(No tags)</li>
              )}
              {allTags.map((tag) => (
                <li
                  key={tag}
                  onClick={() => handleStartTagFilter(tag)}
                  title={`Filter by tag: ${tag}`}
                >
                  <span style={{ color: "var(--brand-accent)", fontWeight: 700 }}>#</span>
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* MAIN (NOTE LIST) */}
        <main className="notes-main">
          <div className="main-toolbar">
            <button
              className="btn btn-create"
              style={{ background: "var(--brand-secondary)" }}
              onClick={handleCreateNote}
            >
              + New Note
            </button>
            <input
              className="search-input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              aria-label="Search notes"
            />
          </div>
          <ul className="note-list">
            {visibleNotes.length === 0 && (
              <li className="empty">No notes found</li>
            )}
            {visibleNotes.map((n) => (
              <li
                key={n.id}
                className={
                  n.id === selectedNoteId ? "active" : ""
                }
                onClick={() => handleSelectNote(n.id)}
              >
                <div className="note-title">{n.title || <em>(Untitled)</em>}</div>
                <div className="note-tags">
                  {n.tags.slice(0,3).map(tag => (
                    <span className="tag" key={tag} style={{ background: "var(--brand-accent, #e67e22)" }}>#{tag}</span>
                  ))}
                </div>
                <div className="note-meta">
                  <span>
                    {n.folder && (
                      <span className="folder-label">{n.folder}</span>
                    )}
                  </span>
                  <span className="updated">
                    {new Date(n.updated).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </main>

        {/* DETAIL/EDIT PANE */}
        <section className="notes-detail-pane">
          {!selectedNoteId && (
            <div className="detail-placeholder">
              Select a note to view or edit.
            </div>
          )}
          {selectedNoteId && !editMode && !!activeNote && (
            <div className="detail-view">
              <div className="detail-head">
                <h2>{activeNote.title || "(Untitled)"}</h2>
                <div>
                  <button className="btn btn-accent" onClick={handleEditNote}>
                    Edit
                  </button>
                  <button
                    className="btn btn-delete"
                    style={{ background: "var(--brand-accent)" }}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this note?"
                        )
                      ) {
                        handleDeleteNote(activeNote.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="detail-meta">
                <span>
                  <b>Folder: </b>
                  {activeNote.folder || "-"}
                </span>
                <span>
                  <b>Tags:</b>{" "}
                  {activeNote.tags.length > 0
                    ? activeNote.tags.map((tag) => (
                        <span className="tag" key={tag} style={{ background: "var(--brand-secondary)" }}>
                          #{tag}
                        </span>
                      ))
                    : "-"}
                </span>
                <span>
                  <b>Last updated: </b>
                  {new Date(activeNote.updated).toLocaleString()}
                </span>
              </div>
              <div className="detail-content">
                <pre style={{whiteSpace: "pre-wrap"}}>{activeNote.content}</pre>
              </div>
            </div>
          )}
          {selectedNoteId && editMode && (
            <form
              className="note-edit-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveNote();
              }}
            >
              <label>
                Title
                <input
                  ref={titleRef}
                  name="title"
                  type="text"
                  value={noteDraft.title}
                  onChange={handleNoteDraftChange}
                  placeholder="Note title"
                  maxLength={120}
                  required
                />
              </label>
              <label>
                Content
                <textarea
                  name="content"
                  value={noteDraft.content}
                  onChange={handleNoteDraftChange}
                  placeholder="Write your note here..."
                  rows={10}
                  spellCheck
                  required
                />
              </label>
              <label>
                Folder
                <input
                  name="folder"
                  type="text"
                  value={noteDraft.folder}
                  onChange={e => handleNoteDraftFolderChange(e.target.value)}
                  placeholder="Personal, Work, Ideas, etc."
                  maxLength={60}
                />
              </label>
              <label>
                Tags (comma-separated)
                <input
                  name="tags"
                  type="text"
                  value={noteDraft.tags.join(", ")}
                  onChange={e => handleNoteDraftTagsChange(e.target.value)}
                  placeholder="tag1,tag2,tag3"
                  maxLength={80}
                />
              </label>
              <div className="edit-actions">
                <button
                  type="submit"
                  className="btn btn-save"
                  style={{ background: "var(--brand-primary)" }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => {
                    setEditMode(false);
                    setNoteDraft(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      <footer className="notes-footer">
        <span>
          Personal Notes Organizer &copy; {new Date().getFullYear()} |{" "}
          <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
            Built with React
          </a>
        </span>
        <span className="footer-tip">
          Tip: Use <b>Ctrl+N</b> to create a new note!
        </span>
      </footer>
    </div>
  );
}

export default App;
