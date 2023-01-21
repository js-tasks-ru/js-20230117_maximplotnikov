/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
  return arr.slice(0).sort((a, b) => {
    let localeCompare = (str1, str2) => str1.localeCompare(str2, 'ru-en', { caseFirst: 'upper' });
    return param === 'asc' ? localeCompare(a, b) : localeCompare(b, a);
  });
}
