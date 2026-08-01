import test from 'node:test';
import assert from 'node:assert/strict';
import { parseIndiaSpotPrice, parseRapidApiRate } from './rateSources.js';

test('parseIndiaSpotPrice extracts valid spot amounts from varied payload keys', () => {
  assert.equal(parseIndiaSpotPrice({ amount: 7500 }), 7500);
  assert.equal(parseIndiaSpotPrice({ data: { amount: 8000 } }), 8000);
  assert.equal(parseIndiaSpotPrice({ price: '7200' }), 7200);
  assert.equal(parseIndiaSpotPrice({ invalid: 'none' }), null);
});

test('parseRapidApiRate extracts gold 24k and silver 1g rates for target city', () => {
  const goldPayload = {
    Status_code: 200,
    Delhi_22k: 8060.0,
    Delhi_24k: 8463.0,
    Currency: 'INR',
  };
  const silverPayload = {
    Status_code: 200,
    Delhi_1g: 98.0,
    Currency: 'INR',
  };

  assert.equal(parseRapidApiRate(goldPayload, '24k', 'Delhi'), 8463.0);
  assert.equal(parseRapidApiRate(goldPayload, '22k', 'Delhi'), 8060.0);
  assert.equal(parseRapidApiRate(silverPayload, '1g', 'Delhi'), 98.0);
  assert.equal(parseRapidApiRate(null), null);
});
