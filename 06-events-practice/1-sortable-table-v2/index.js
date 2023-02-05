export default class SortableTable {
  constructor(headersConfig, {
    data = [],
    sorted = {}
  } = {}) {
    this.headersConfig = headersConfig;
    this.data = data;
    this.sorted = sorted;
    //определяет место сортировки: клиент или сервер
    this.isSortLocally = true;

    this.render();
    this.defaultSort();
  }

  /**
   * Формируем таблицу в формате html
   */
  render() {
    const tableWrapper = document.createElement('div');
    tableWrapper.innerHTML = this.getTableHtml();
    this.element = tableWrapper.firstElementChild;

    this.subElements = this.getSubElements(this.element);
    this.addSortableEventListener();
  }

  /**
   * @returns {string} таблица с данными в формате html
   */
  getTableHtml() {
    return `
        <div data-element="productsContainer" class="products-list__container">
            <div class="sortable-table">
                ${this.getTableHeader()}
                ${this.getTableBody()}
            </div>
            <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
            <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
                <div>
                    <p>No products satisfies your filter criteria</p>
                    <button type="button" class="button-primary-outline">Reset all filters</button>
                </div>
            </div>
        </div>`;
  }

  /**
   * @returns {string} заголовок таблицы с названиями колонок в формате html
   */
  getTableHeader() {
    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
         ${this.getColumnsHeaders()}
      </div>`;
  }

  /**
   * @returns {string} заголовки колонок таблицы в формате html
   */
  getColumnsHeaders() {
    return this.headersConfig.map(columnHeaderParams => {
      return `
      <div class="sortable-table__cell" data-id="${columnHeaderParams.id}" data-sortable="${columnHeaderParams.sortable}">
        <span>${columnHeaderParams.title}</span>
        ${this.getSortableColumnHeader(columnHeaderParams)}
      </div>`;
    }).join('');
  }

  getSortableColumnHeader(columnHeaderParams) {
    return columnHeaderParams.sortable
      ? `<span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>`
      : '';
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
    return this.headersConfig.map(({id, template}) => {
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
    for (let subElement of elements) {
      const name = subElement.dataset.element;
      result[name] = subElement;
    }
    return result;
  }

  /**
   * Добавления слушателя событий нажатий на заголовок таблицы с последующей сортировкой данных в таблице
   */
  addSortableEventListener() {
    this.subElements.header.addEventListener('pointerdown', (event) => {
      const columnHeader = event.target.closest('div');
      if (!columnHeader) {return;}
      const columnHeaderId = columnHeader.dataset.id;
      const columnHeaderSortOrder = columnHeader.dataset.order;
      this.sort(columnHeaderId, columnHeaderSortOrder === 'desc' ? 'asc' : 'desc');
    });
  }

  /**
   * Дефолтная сортировка заданная при создании таблицы
   */
  defaultSort() {
    if (this.sorted.id) {
      this.sort(this.sorted.id, this.sorted.order);
    }
  }

  /**
   * Сортировка строк в таблице
   * @param field колонка, по которой идет сортировка
   * @param orderBy направление сортировки
   */
  sort(field, orderBy = 'asc') {
    const sortedData = this.isSortLocally
      ? this.getSortedOnClientData(field, orderBy, [...this.data])
      : this.getSortedOnServerData(field, orderBy, [...this.data]);

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
   * Сортировка строк в таблице на стороне клиента
   * @param field колонка, по которой идет сортировка
   * @param orderBy направление сортировки
   * @param data данные для сортировки
   * @returns {*} отсортированные данные
   */
  getSortedOnClientData(field, orderBy, data) {
    const directions = {
      asc: 1,
      desc: -1
    };
    const direction = directions[orderBy];
    const { sortType } = this.headersConfig.find(column => column.id === field);

    return data.sort((a, b) => {
      if (sortType === 'number') {
        return direction * (a[field] - b[field]);
      }
      if (sortType === 'string') {
        return direction * (a[field].localeCompare(b[field], ['ru', 'en']));
      }
    });
  }

  /**
   * Сортировка строк в таблице на стороне сервера
   * @param field колонка, по которой идет сортировка
   * @param orderBy направление сортировки
   * @param data данные для сортировки
   * @returns {*} отсортированные данные
   */
  getSortedOnServerData(field, orderBy, data) {
    return data;
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
