// Phone-number helpers. CallSwitch sends E.164 ("+447424405482"); Salesforce
// holds numbers in every format ("07424405482", "+44 (0)7979 343231",
// "01902 865777"). Salesforce phone search matches on the national digits, so
// we search with those plus the 0-prefixed form.

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

// True when the value looks like an external phone number rather than an
// extension ("8001") or a hunt-group name.
function isExternalNumber(value) {
  return digitsOnly(value).length >= 9;
}

// UK national significant number (no leading 0 / 44), or the full digits for
// anything non-UK.
function nationalNumber(value) {
  let d = digitsOnly(value);
  if (d.startsWith('0044')) d = d.slice(4);
  else if (d.startsWith('44') && d.length >= 12) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return d;
}

// SOSL search terms for a number, e.g. ["7424405482", "07424405482"].
function searchTerms(value) {
  const n = nationalNumber(value);
  if (n.length < 9) return [];
  return [n, '0' + n];
}

// "+44 7424 405482" style for display in Task descriptions.
function displayNumber(value) {
  const d = digitsOnly(value);
  if (d.startsWith('44') && d.length === 12) {
    const n = d.slice(2);
    return `+44 ${n.slice(0, 4)} ${n.slice(4)}`;
  }
  return value ? String(value) : '';
}

module.exports = { digitsOnly, isExternalNumber, nationalNumber, searchTerms, displayNumber };
