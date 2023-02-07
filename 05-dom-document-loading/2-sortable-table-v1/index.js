export default class SortableTable {
  constructor(headerConfig = [], data = []) {
    this.headerConfig = headerConfig;
    this.data = data;

    this.render();
  }

  render() {
    const tableWrapper = document.createElement('div');
    tableWrapper.innerHTML = this.getTableHtml();
    this.element = tableWrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);
  }

  /**
   * @returns {string} таблица с данными в формате html
   */
  getTableHtml() {
    return `
        <div class="sortable-table">
            ${this.getTableHeader()}
            ${this.getTableBody()}
        </div>`;
  }

  /**
   * @returns {string} заголовок таблицы с названиями колонок в формате html
   */
  getTableHeader() {
    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
         ${this.getColumnHeaders()}
      </div>`;
  }

  /**
   * @returns {string} заголовки колонок таблицы в формате html
   */
  getColumnHeaders() {
    return this.headerConfig.map(headerElement => {
      return `
      <div class="sortable-table__cell" data-id="${headerElement.id}" data-sortable="${headerElement.sortable}">
        <span>${headerElement.title}</span>
        <span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>
      </div>`;
    }).join('');
  }

  /**
   * @returns {string} тело таблицы с данными в формате html
   */
  getTableBody() {
    return `
    <div data-element="body" class="sortable-table__body">
      ${this.getTableRows(this.data)}
    </div>`;
  }

  /**
   * @param data данные для заполнения таблицы
   * @returns {*} строки с данными в формате html
   */
  getTableRows(data) {
    return data.map(product => {
      return `
      <a href="/products/${product.id}" class="sortable-table__row">
        ${this.getTableRowBody(product)}
      </a>`;
    }).join('');
  }

  /**
   * @param product товар
   * @returns {string} набор строк с данными о товаре в формате html
   */
  getTableRowBody(product) {
    return this.headerConfig.map(({id, template}) => {
      return template
        ? template(product[id])
        : `<div class="sortable-table__cell">${product[id]}</div>`;
    }).join('');
  }

  /**
   * @param element таблица
   * @returns {{}} данные таблицы
   */
  getSubElements(element) {
    const result = {};
    const elements = element.querySelectorAll('[data-element]');
    for (const subElement of elements) {
      const name = subElement.dataset.element;
      result[name] = subElement;
    }
    return result;
  }

  /**
   * Сортировка строк в таблице
   * @param field колонка, по которой идет сортировка
   * @param orderBy направление сортировки
   */
  sort(field, orderBy) {
    const sortedData = this.getSortedData(field, orderBy, [...this.data])
    const currentColumn = this.element.querySelector(`.sortable-table__cell[data-id="${field}"]`);

    this.element.querySelectorAll('.sortable-table__cell[data-id]').forEach(column => {
      column.dataset.order = '';
    });
    currentColumn.dataset.order = orderBy;

    if (sortedData) {
      this.subElements.body.innerHTML = this.getTableRows(sortedData);
    }
  }

  /**
   * Сортировка строк в таблице
   * @param field колонка, по которой идет сортировка
   * @param orderBy направление сортировки
   * @param data данные для сортировки
   * @returns {*} отсортированные данные
   */
  getSortedData(field, orderBy, data) {
    const directions = {
      asc: 1,
      desc: -1
    };
    const direction = directions[orderBy];
    const { sortType } = this.headerConfig.find(column => column.id === field);
    return data.sort((a, b) => {
      if (sortType === 'number') {
        return direction * (a[field] - b[field]);
      }
      if (sortType === 'string') {
        return direction * (a[field].localeCompare(b[field], ['ru', 'en']));
      }
    });
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = null;
  }
}
