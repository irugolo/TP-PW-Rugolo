// Deliberate, temporary QA exercise: verify CI/main and Vercel reject failure.
// Not a product bug. Remove after recording the failed checks and blocked PR.
import test from 'node:test';
import assert from 'node:assert/strict';
test('QA gate probe: intentional failure, do not merge',()=>{
 assert.fail('Intentional pipeline gate verification; remove after evidence.');
});
