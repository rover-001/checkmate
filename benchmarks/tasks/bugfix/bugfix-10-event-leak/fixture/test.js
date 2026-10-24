import { Tracker } from "./tracker.js";
import assert from "node:assert/strict";

const t = new Tracker();
let calledA = 0;
let calledB = 0;
const unsubA = t.subscribe(() => { calledA++; });
const unsubB = t.subscribe(() => { calledB++; });

unsubA(); // Unsubscribing A should leave B active
t.notify(1);

assert.equal(calledA, 0, "A should not have been called");
assert.equal(calledB, 1, "B should have been called once");
console.log("PASS");
