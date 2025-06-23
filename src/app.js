import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { openDB } from 'idb';

const DB_NAME = 'NotesDB';
const DB_VERSION = 1;
const STORE_NAME = 'notes';
const SECRET_KEY = 'bala_secret_key_123';

const App = () => {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    initDB();
    fetchNotes();
  }, []);

  const initDB = async () => {
    await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  };

  const encryptNote = (text) => {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  };

  const decryptNote = (cipher) => {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  const addNote = async () => {
    if (!note.trim()) return;
    const encrypted = encryptNote(note);
    const db = await openDB(DB_NAME, DB_VERSION);
    await db.add(STORE_NAME, { content: encrypted });
    setNote('');
    fetchNotes();
  };

  const fetchNotes = async () => {
    const db = await openDB(DB_NAME, DB_VERSION);
    const allNotes = await db.getAll(STORE_NAME);
    const decryptedNotes = allNotes.map((n) => ({
      id: n.id,
      content: decryptNote(n.content),
    }));
    setNotes(decryptedNotes);
  };

  const deleteNote = async (id) => {
    const db = await openDB(DB_NAME, DB_VERSION);
    await db.delete(STORE_NAME, id);
    fetchNotes();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h2>📝 Privacy Notes App (Encrypted)</h2>
      <textarea
        rows="4"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write your note here..."
        style={{ width: '100%', marginBottom: '10px' }}
      />
      <button onClick={addNote}>Save Note</button>
      <hr />
      <h3>Your Notes</h3>
      {notes.length === 0 ? (
        <p>No notes yet.</p>
      ) : (
        notes.map((n) => (
          <div key={n.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
            <p>{n.content}</p>
            <button onClick={() => deleteNote(n.id)}>Delete</button>
          </div>
        ))
      )}
    </div>
  );
};

export default App;
