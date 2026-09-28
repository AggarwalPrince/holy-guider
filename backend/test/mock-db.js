// In-memory stand-in for the Mongoose models, used only by the tests so they
// run with no MongoDB. It patches the *static* methods the routes call on the
// real exported Model objects (Node caches modules, so route code that later
// requires "../models/User" gets the patched object).
//
// It emulates the parts of MongoDB the app's correctness depends on:
//   - atomic single-document find-and-update (check+modify in one step)
//   - unique indexes (googleId)
//   - multi-document TRANSACTIONS with rollback (per-session undo log, so
//     concurrent requests don't roll each other back)
// plus a fault-injection hook (control.failOnce) to simulate a crash between
// two writes, which is how the atomicity fixes are proven.
//
// What it can NOT prove is real MongoDB transaction semantics; that needs a
// replica set (see README, "Testing against real MongoDB").

const mongoose = require("mongoose");
const User = require("../models/User");
const Journal = require("../models/Journal");

const stores = {
  users: new Map(),
  journals: new Map(),
};

// ---- fault injection ------------------------------------------------------
const faults = new Set();
const control = {
  failOnce: (name) => faults.add(name),
  clearFaults: () => faults.clear(),
};
function maybeFail(name) {
  if (faults.has(name)) {
    faults.delete(name);
    throw new Error(`simulated crash at ${name}`);
  }
}

// ---- helpers --------------------------------------------------------------
const clone = (doc) => (doc ? { ...doc } : doc);

function attach(doc, store) {
  Object.defineProperty(doc, "save", {
    enumerable: false,
    value: async function () {
      store.set(doc._id.toString(), { ...doc });
      return doc;
    },
  });
  Object.defineProperty(doc, "toString", { enumerable: false, value: () => doc._id.toString() });
  return doc;
}

// Writes go through here so a transaction can undo them.
function put(store, key, value, session) {
  if (session && session._undo) session._undo.push([store, key, store.has(key), store.get(key)]);
  store.set(key, value);
}
function del(store, key, session) {
  if (session && session._undo) session._undo.push([store, key, store.has(key), store.get(key)]);
  store.delete(key);
}
function rollback(session) {
  for (const [store, key, had, prev] of session._undo.reverse()) {
    if (had) store.set(key, prev);
    else store.delete(key);
  }
}

// A query-like thenable so `.sort().limit().select()` chains work whether or
// not the route awaits it at the end.
function query(getArray) {
  const state = { sort: null, limit: null };
  const q = {
    sort(spec) {
      state.sort = spec;
      return q;
    },
    limit(n) {
      state.limit = n;
      return q;
    },
    select() {
      return q;
    },
    lean() {
      return q;
    },
    then(resolve, reject) {
      let arr = getArray();
      if (state.sort) {
        const key = Object.keys(state.sort)[0];
        const dir = state.sort[key] === -1 ? -1 : 1;
        arr = [...arr].sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * dir);
      }
      if (state.limit != null) arr = arr.slice(0, state.limit);
      return Promise.resolve(arr).then(resolve, reject);
    },
  };
  return q;
}

function matches(doc, filter = {}) {
  return Object.entries(filter).every(([k, v]) => {
    const field = doc[k];
    if (v && typeof v === "object" && !(v instanceof mongoose.Types.ObjectId) && !(v instanceof Date)) {
      return Object.entries(v).every(([op, opVal]) => {
        switch (op) {
          case "$gte": return field >= opVal;
          case "$gt": return field > opVal;
          case "$lte": return field <= opVal;
          case "$lt": return field < opVal;
          case "$ne": return String(field) !== String(opVal);
          case "$in": return opVal.map(String).includes(String(field));
          default: throw new Error(`mock-db: unsupported operator ${op}`);
        }
      });
    }
    return String(field) === String(v);
  });
}

function applyUpdate(doc, update) {
  const out = { ...doc };
  for (const [k, v] of Object.entries(update.$inc || {})) out[k] = (out[k] || 0) + v;
  for (const [k, v] of Object.entries(update.$set || {})) out[k] = v;
  out.updatedAt = new Date();
  return out;
}

function findEntry(store, filter) {
  for (const [key, doc] of store.entries()) if (matches(doc, filter)) return [key, doc];
  return null;
}

function checkUnique(store, self, fields, name) {
  for (const f of fields) {
    if (self[f] == null) continue; // sparse
    for (const [, other] of store.entries()) {
      if (other._id !== self._id && String(other._id) !== String(self._id) && other[f] === self[f]) {
        const err = new Error(`E11000 duplicate key error (${name}.${f})`);
        err.code = 11000;
        throw err;
      }
    }
  }
}

// ---- generic model patcher ------------------------------------------------
function patchModel(Model, name, store, { unique = [], build }) {
  Model.create = async (data, opts = {}) => {
    const many = Array.isArray(data);
    const out = [];
    for (const item of many ? data : [data]) {
      maybeFail(`${name}.create`);
      const _id = new mongoose.Types.ObjectId();
      const doc = build(item, _id);
      checkUnique(store, doc, unique, name);
      put(store, _id.toString(), doc, opts.session);
      out.push(attach(clone(doc), store));
    }
    return many ? out : out[0];
  };
  Model.findOne = (filter) => {
    const q = {
      select: () => q,
      lean: () => q,
      then(resolve, reject) {
        const entry = findEntry(store, filter);
        return Promise.resolve(entry ? attach(clone(entry[1]), store) : null).then(resolve, reject);
      },
    };
    return q;
  };
  Model.findById = (id) => Model.findOne({ _id: id });
  Model.find = (filter = {}) => query(() => [...store.values()].filter((d) => matches(d, filter)).map((d) => attach(clone(d), store)));
  Model.countDocuments = async (filter = {}) => [...store.values()].filter((d) => matches(d, filter)).length;
  Model.findOneAndUpdate = async (filter, update, opts = {}) => {
    maybeFail(`${name}.findOneAndUpdate`);
    let entry = findEntry(store, filter);
    if (!entry && opts.upsert) {
      const _id = new mongoose.Types.ObjectId();
      const seed = {};
      for (const [k, v] of Object.entries(filter)) if (typeof v !== "object") seed[k] = v;
      const doc = build({ ...seed, ...(update.$setOnInsert || {}) }, _id);
      checkUnique(store, doc, unique, name);
      put(store, _id.toString(), doc, opts.session);
      return attach(clone(doc), store);
    }
    if (!entry) return null;
    const [key, doc] = entry;
    const updated = applyUpdate(doc, update);
    checkUnique(store, updated, unique, name);
    put(store, key, updated, opts.session);
    return attach(clone(opts.new ? updated : doc), store);
  };
  Model.findByIdAndUpdate = (id, update, opts = {}) => Model.findOneAndUpdate({ _id: id }, update, opts);
  Model.updateOne = async (filter, update, opts = {}) => {
    const r = await Model.findOneAndUpdate(filter, update, opts);
    return { matchedCount: r ? 1 : 0, modifiedCount: r ? 1 : 0 };
  };
  Model.updateMany = async (filter, update, opts = {}) => {
    let n = 0;
    for (const [key, doc] of [...store.entries()]) {
      if (matches(doc, filter)) {
        put(store, key, applyUpdate(doc, update), opts.session);
        n++;
      }
    }
    return { matchedCount: n, modifiedCount: n };
  };
  Model.findOneAndDelete = async (filter, opts = {}) => {
    const entry = findEntry(store, filter);
    if (!entry) return null;
    del(store, entry[0], opts.session);
    return clone(entry[1]);
  };
  Model.init = async () => {};
}

const base = (extra) => ({ createdAt: new Date(), updatedAt: new Date(), ...extra });

patchModel(User, "User", stores.users, {
  unique: ["googleId"],
  build: (d, _id) =>
    base({
      _id,
      googleId: d.googleId,
      email: (d.email || "").toLowerCase(),
      name: d.name || "Seeker",
      avatar: d.avatar || "",
      role: d.role || "user",
      isAdmin: Boolean(d.isAdmin),
      isGuest: Boolean(d.isGuest),
      tokenVersion: d.tokenVersion || 0,
    }),
});

patchModel(Journal, "Journal", stores.journals, {
  build: (d, _id) =>
    base({ _id, userId: d.userId, question: d.question, tradition: d.tradition, aiResponse: d.aiResponse, timestamp: d.timestamp || new Date() }),
});

// ---- transactions ---------------------------------------------------------
mongoose.connection.transaction = async (fn) => {
  const session = { _undo: [] };
  try {
    return await fn(session);
  } catch (err) {
    rollback(session);
    throw err;
  }
};

function reset() {
  Object.values(stores).forEach((s) => s.clear());
  faults.clear();
}

module.exports = { stores, control, reset };
