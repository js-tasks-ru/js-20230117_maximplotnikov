/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
  return [...arr].sort((a, b) => {
    const localeCompare = (str1, str2) => str1.localeCompare(str2, 'ru-en', { caseFirst: 'upper' });
    if (param === 'asc') {
      return localeCompare(a, b);
    }
    if (param === 'desc') {
      return localeCompare(b, a);
    }
  });
}
