export function lookupLocalized(lang, obj, entry) {
  const val = obj[entry + '_' + lang];
  return val || obj[entry + '_en'] || obj[entry + '_zh'];
}