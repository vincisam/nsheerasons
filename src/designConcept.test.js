import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDesignConcept } from './designConcept.js';

test('normalizes AI design concept details into display-ready fields', () => {
  const result = normalizeDesignConcept({
    title: 'Lotus Pendant',
    description: 'A refined pendant with floral detailing.',
    suggestedMetal: '22K Gold',
    suggestedPurity: '22K (916)',
    estimatedWeightRange: '8-10 g',
    detailing: 'Fine lotus motifs, milgrain border, tiny diamond accents.',
    approximatePrice: '₹45,000 - ₹60,000',
    gemstoneSuggestions: 'Small round diamonds',
    styleNotes: 'Contemporary bridal style.'
  });

  assert.equal(result.title, 'Lotus Pendant');
  assert.equal(result.approximatePrice, '₹45,000 - ₹60,000');
  assert.equal(result.detailing, 'Fine lotus motifs, milgrain border, tiny diamond accents.');
  assert.equal(result.estimatedWeightRange, '8-10 g');
});

test('falls back to sensible defaults when the AI payload is incomplete', () => {
  const result = normalizeDesignConcept({
    title: 'Classic Ring',
    description: 'A simple ring design.'
  });

  assert.equal(result.title, 'Classic Ring');
  assert.equal(result.estimatedWeightRange, 'To be confirmed');
  assert.equal(result.detailing, 'To be confirmed');
  assert.equal(result.approximatePrice, 'To be confirmed');
});
