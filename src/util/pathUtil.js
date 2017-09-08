// see: http://stackoverflow.com/a/29855282/2228771
export function pathJoin(...parts){
  parts = parts.filter(p => !!p);
  var separator = '/';
  var replace   = new RegExp(separator+'{1,}', 'g');
  return parts.join(separator).replace(replace, separator);
}