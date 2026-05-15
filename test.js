const mapRomawi = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI' };
const formatKelasDapodik = (raw) => {
  if (!raw) return '';
  let str = String(raw).toUpperCase().trim();
  if (str === 'NULL' || str === 'UNDEFINED') return '';
  if (/^[1-6]$/.test(str)) return mapRomawi[str];
  str = str.replace(/[^A-Z0-9\s]/g, ' ');
  str = str.replace(/\s+/g, ' ').trim();
  str = str.replace(/^(KLS|KELAS|ROMBEL|R)\s*/i, '');
  str = str.replace(/(?:KELAS\s+)?([1-6])/i, (match, p1) => mapRomawi[p1] || p1);
  const match = str.replace(/\s+/g, '').match(/^(V?I{0,3}|IV)([A-Z])$/);
  if (match) {
    return match[1] + ' ' + match[2];
  }
  return str;
};

console.log('6B ->', formatKelasDapodik('6B'));
console.log('6 B ->', formatKelasDapodik('6 B'));
console.log('KLS 6B ->', formatKelasDapodik('KLS 6B'));
console.log('Rombel 3B ->', formatKelasDapodik('Rombel 3B'));
