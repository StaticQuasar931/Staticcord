import config from '../config.ts';
import { getApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import {
  getDatabase,
  ref,
  child,
  push,
  set,
  update,
  remove,
  onValue,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js';

let database;

export function getDb() {
  if (!database) {
    database = getDatabase(getApp(), config.firebase.databaseURL || undefined);
  }
  return database;
}

export function dbRef(path) {
  return ref(getDb(), path);
}

export function childRef(path, childKey) {
  return child(dbRef(path), childKey);
}

export function addData(path, value) {
  const newRef = push(dbRef(path));
  return set(newRef, value).then(() => newRef.key);
}

export function setData(path, value) {
  return set(dbRef(path), value);
}

export function updateData(path, value) {
  return update(dbRef(path), value);
}

export function removeData(path) {
  return remove(dbRef(path));
}

export function listenValue(path, callback) {
  const listener = onValue(dbRef(path), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return () => listener();
}

export function listenList(path, callbacks) {
  const unsubscribers = [];
  if (callbacks.added) {
    unsubscribers.push(onChildAdded(dbRef(path), (snap) => callbacks.added(snap.key, snap.val())));
  }
  if (callbacks.changed) {
    unsubscribers.push(onChildChanged(dbRef(path), (snap) => callbacks.changed(snap.key, snap.val())));
  }
  if (callbacks.removed) {
    unsubscribers.push(onChildRemoved(dbRef(path), (snap) => callbacks.removed(snap.key, snap.val())));
  }
  return () => unsubscribers.forEach((unsub) => unsub());
}

export function serverTime() {
  return serverTimestamp();
}
