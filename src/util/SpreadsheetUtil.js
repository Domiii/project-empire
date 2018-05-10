/**
 * Provide a few utilities to easily download + work with Google Spreadsheets.
 * 
 * NOTE: For this code to work, you always must first publish your spreadsheet as CSV.
 * STEPS:
 *    1. `File` → `Publish to the Web` → `Link` → `Entire Document` + `Comma-separated values (CSV)` → `Publish`
 *    2. When finished, provide the resulting URL to make some stuff happening! :)
 *    3. If you have multiple tables in the spreadsheet, navigate to the table you want and copy the `gid` from the URL
 */

import map from 'lodash/map';

const SpresheetPubRe = 'https:\/\/docs\.google\.com\/spreadsheets\/.+\/([^/]+)\/[^/]+';


/**
 * @see https://stackoverflow.com/a/17606289
 */
String.prototype.replaceAll = function (search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};


export function getPublishIdFromURL(url, gid) {
  const match = SpresheetPubRe.exec(url);
  return match[1];
}

export function buildUrl(publishId, gid, allowCache = false) {
  let url = 'https://docs.google.com/spreadsheets/d/e/' + publishId + '/pub?output=csv';
  if (!allowCache) {
    // add some randomization to be sure to get the freshest data available.
    // NOTE: this will slow down retrieval by 1-2 seconds.
    url += '&random=' + Math.round(Math.random() * 100000);
  }
  if (gid) {
    url += '&gid=' + gid;
  }

  return url;
}

/**
 * @see https://stackoverflow.com/questions/27979002/convert-csv-data-into-json-format-using-javascript
 */
export function csvToJSON(csv, csvOptions) {
  //const lines = csv.split('\n');
  const result = [];

  const re = /((?:"(?:""|[^"])+")|(?!")[^\n,]*)([\n,])/g;
  csv += '\n'; // this is to match the suffix from above

  console.log(csv);
  
  let match;
  const lines = [];
  let line = [];
  while ((match = re.exec(csv)) !== null) {
    console.warn(match[1], match[2]);
    line.push(match[1].trim());
    if (match[2] === '\n') {
      // end of line
      lines.push(line);
      line = [];
    }
  }
  //console.log(lines);
  //throw new Error('stop');
  
  // put all columns after a certain index into an array of given name
  const columnArr = csvOptions && csvOptions.columnArr;
  const columnArrStart = columnArr && columnArr.start;
  const columnArrEnd = columnArr && columnArr.end;
  const columnArrName = columnArr && columnArr.name;

  let headers = lines[0];
  headers = map(headers, header => header.trim().replaceAll('\\s', '_'));
  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentline = lines[i];

    for (let j = 0; j < headers.length; j++) {
      // this is a pretty bad implementation...
      if (columnArrEnd && j > columnArrEnd) {
        continue;
      }

      const val = (currentline[j] || '').replaceAll('"', '').trim();
      if (columnArrStart && j >= columnArrStart) {
        if (!val) {
          continue;
        }
        const cols = obj[columnArrName] = obj[columnArrName] || [];
        cols.push(val);
      }
      else {
        obj[headers[j]] = val;
      }
    }
    result.push(obj);
  }
  return result;
}


export async function downloadSpreadsheet(publishId, gid, allowCache = false) {
  const url = buildUrl(publishId, gid, allowCache);
  console.log('downloading spreadsheet:', url);
  return await window.fetch(url, {
    mode: 'cors'
  });
}


export async function downloadSpreadsheetJSON(publishId, gid, csvOptions, allowCache = false) {
  const res = await downloadSpreadsheet(publishId, gid, allowCache);
  const resText = await res.text();
  return csvToJSON(resText, csvOptions);
}