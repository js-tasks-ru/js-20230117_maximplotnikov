/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  return size === 0 || string === "" ? "" : getFormattedRow(string, size, getCountDuplicatesByChars(string, size));
}

/**
 * Получение строки без дубликатов с учетом максимально допустимого количества последовательно дублирующихся символов.
 *
 * @param row строка с дублирующимися символами
 * @param possibleCount максимальное количество последовательно повторяющихся символов в строке
 * @param countDuplicatesByChars количество последовательно повторяющихся символов сгруппированных по символам
 * @returns {string} строка с заданным количеством последовательно повторяющихся символов
 */
function getFormattedRow(row, possibleCount, countDuplicatesByChars) {
  let result = row;
  for (let key of countDuplicatesByChars.keys()) {
    const char = key;
    const possibleDubleChars = getCharsRowByPossibleCount(char, possibleCount);
    const count = countDuplicatesByChars.get(key);
    for (let j = count; j >= possibleCount; j--) {
      let checkedCharsRow = getCharsRowByPossibleCount(char, j);
      if (row.indexOf(checkedCharsRow) > -1) {
        result = result.replaceAll(checkedCharsRow, possibleDubleChars);
      }
    }
  }
  return result;
}

/**
 * Получение строки, состоящей из дублированных символов с заданным количеством
 *
 * @param char символ, который необходимо дублировать
 * @param count количество дублируемого символа в строке
 * @returns {*} строка, состоящая из дубликатов переданного символа
 */
function getCharsRowByPossibleCount(char, count) {
  let result = char;
  for (let i = 1; i < count; i++) {
    result += char;
  }
  return result;
}

/**
 * Получение структуры данных с символами и их количеством повторов, превышающих лимит повторений
 *
 * @param row строка, по которой осуществляется поиск
 * @param maxPossibleSize лимит на количество повторов
 * @returns {Map<any, any>} структуры данных с символами и их количеством повторов
 */
function getCountDuplicatesByChars(row, maxPossibleSize) {
  const map = new Map();
  Object.entries(row.split('').reduce((newObj, n) => {
    newObj[n] = (newObj[n] || 0) + 1;
    return newObj;
  }, {}))
    .filter(arr => arr[1] >= maxPossibleSize)
    .forEach(arr => map.set(arr[0], arr[1]));
  return map;
}
