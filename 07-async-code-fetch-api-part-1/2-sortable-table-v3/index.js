import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  start = 0;
  step = 30;
  end = this.start + this.step;
  isNextPartLoaded = false;

  constructor(headerConfig, {
    url = "",
    isSortLocally = false,
    sorted = {
      id: headerConfig.find(item => item.sortable).id,
      order: "asc",
    }
  } = {}) {
    this.headersConfig = headerConfig;
    this.url = new URL(url, BACKEND_URL);
    //определяет место сортировки: клиент или сервер
    this.isSortLocally = isSortLocally;
    this.sorted = sorted;
    this.render();
  }

  /**
   * Формируем таблицу в формате html и загружаем данные
   */
  async render() {
    const tableWrapper = document.createElement('div');
    tableWrapper.innerHTML = this.getTableHtml();
    this.element = tableWrapper.firstElementChild;
    this.subElements = this.getSubElements();

    this.isAllLoaded = false;
    const responseJson = await this.loadData({
      "_sort": this.sorted.id,
      "_order": this.sorted.order,
      "_start": this.start,
      "_end": this.end
    });
    this.data = Object.values(responseJson);
    this.subElements.body.innerHTML = this.getTableRows(this.data);
    this.setSortedColumn(this.sorted.id, this.sorted.order);
    this.addSortableEventListener();
    this.addScrollListener();
  }

  /**
   * @returns {string} таблица с данными в формате html //${this.getTableBody()}
   */
  getTableHtml() {
    return `
        <div data-element="productsContainer" class="products-list__container">
            <div class="sortable-table">
                <div data-element="header" class="sortable-table__header sortable-table__row">
                    ${this.getColumnsHeaders()}
                </div>
            </div>
            <div data-element="body" class="sortable-table__body"></div>
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
   * @param data данные для заполнения таблицы
   * @returns {*} строки с данными в формате html
   */
  getTableRows(data = []) {
    if (data.length > 0) {
      return data.map(product => {
        return `
        <a href="/products/${product.id}" class="sortable-table__row">
          ${this.getTableRowBody(product)}
        </a>`;
      }).join('');
    }
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
   * @returns {{}} данные таблицы
   */
  getSubElements() {
    const subElements = {};
    this.element.querySelectorAll('[data-element]').forEach(dataElement => {
      subElements[dataElement.dataset.element] = dataElement;
    });
    return subElements;
  }

  /**
   * Сортировка строк в таблице
   * @param field колонка, по которой идет сортировка
   * @param orderBy направление сортировки
   */
  sort(field, orderBy = 'asc') {
    // eslint-disable-next-line no-unused-expressions
    this.isSortLocally
      ? this.sortOnClient(field, orderBy)
      : this.sortOnServer(field, orderBy);
  }

  /**
   * Сортировка строк в таблице на стороне клиента
   * @param field колонка, по которой идет сортировка
   * @param orderBy направление сортировки
   * @param data данные для сортировки
   * @returns {*} отсортированные данные
   */
  sortOnClient(field, orderBy) {
    const directions = {
      asc: 1,
      desc: -1
    };
    const direction = directions[orderBy];
    const {sortType} = this.headersConfig.find(column => column.id === field);

    const sortedData = [...this.data].sort((a, b) => {
      if (sortType === 'number') {
        return direction * (a[field] - b[field]);
      }
      if (sortType === 'string') {
        return direction * (a[field].localeCompare(b[field], ['ru', 'en']));
      }
    });
    this.setSortedColumn(field, orderBy);
    this.subElements.body.innerHTML = this.getTableRows(sortedData);
  }

  /**
   * Сортировка строк в таблице на стороне сервера
   * @returns {*} отсортированные данные
   * @param field
   * @param orderBy
   */
  async sortOnServer(field, orderBy) {
    this.start = 0;
    this.end = this.start + this.step;
    const sortedOptions = {
      "_sort": field,
      "_order": orderBy,
      "_start": this.start,
      "_end": this.end
    };

    const responseJson = await this.loadData(sortedOptions);
    Object.values(responseJson).forEach(sortedData => {
      this.setSortedColumn(field, orderBy);
      this.subElements.body.innerHTML = this.getTableRows(sortedData);
    });
  }

  async loadData(sortedOptions = {}) {
    for (const searchParam in sortedOptions) {
      this.url.searchParams.set(searchParam, sortedOptions[searchParam]);
    }
    return await fetchJson(this.url);
  }

  /**
   * Устанавливает дополнительные параметры колонки, по которой осуществляется сортировка
   * @param field
   * @param orderBy
   */
  setSortedColumn(field, orderBy)
  {
    const sortableColumn = this.element.querySelector(`.sortable-table__cell[data-id="${field}"]`);
    this.element.querySelectorAll('.sortable-table__cell[data-id]').forEach(column => {
      column.dataset.order = '';
    });
    sortableColumn.dataset.order = orderBy;
    this.sorted.id = field;
    this.sorted.order = orderBy;
  }

  /**
   * Добавления слушателя событий нажатий на заголовок таблицы с последующей сортировкой данных в таблице
   */
  addSortableEventListener() {
    this.subElements.header.addEventListener('pointerdown', (event) => {
      const columnHeader = event.target.closest('[data-sortable=true]');
      if (!columnHeader) {
        return;
      }
      const { id, order } = columnHeader.dataset;
      this.sort(id, this.changeOrder(order));
    });
  }

  changeOrder(order) {
    const orders = {
      asc: 'desc',
      desc: 'asc'
    };
    return orders[order];
  }

  addScrollListener() {
    document.addEventListener('scroll', async (event) => {
      const bottomTableElements = this.subElements.body.getBoundingClientRect().bottom;
      if (!this.isAllLoaded && !this.isNextPartLoaded && document.documentElement.clientHeight > bottomTableElements)
      {
        this.start = this.end;
        this.end = this.start + this.step;
        this.isNextPartLoaded = true;

        const data = await this.loadData({
          "_sort": this.sorted.id,
          "_order": this.sorted.order,
          "_start": this.start,
          "_end": this.end
        });
        if (data.length > 0) {
          this.subElements.body.insertAdjacentHTML('beforeend', this.getTableRows(data));
        } else {
          this.isAllLoaded = true;
          alert("Все данные загружены.\nБольше нет доступных данных для загрузки");
        }
        this.isNextPartLoaded = false;
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
