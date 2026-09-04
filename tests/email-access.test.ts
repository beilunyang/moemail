import assert from "node:assert/strict"
import test from "node:test"
import { canAccessAllEmails, ROLES } from "../app/lib/permissions"

test("only emperor can access all emails", () => {
  assert.equal(canAccessAllEmails(ROLES.EMPEROR), true)
  assert.equal(canAccessAllEmails(ROLES.DUKE), false)
  assert.equal(canAccessAllEmails(ROLES.KNIGHT), false)
  assert.equal(canAccessAllEmails(ROLES.CIVILIAN), false)
  assert.equal(canAccessAllEmails(null), false)
})
