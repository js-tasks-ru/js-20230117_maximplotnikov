import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
  /** Заданная высота ColumnChart */
  chartHeight = 50;
  /** Элемент ColumnChart на странице */
  element;
  /** Элементы, отображаемые в ColumnChart - "Столбцы" */
  subElements = {};

  constructor({
    url = "",
    range = {
      from: new Date(),
      to: new Date()
    },
    label = "",
    link = "",
    formatHeading = data => data,
  } = {}) {
    this.url = new URL(url, BACKEND_URL);
    this.range = range;
    this.label = label;
    this.link = link;
    this.formatHeading = formatHeading;

    this.render();
    this.update(this.range.from, this.range.to);
  }

  render() {
    const wrapperElement = document.createElement('div');
    wrapperElement.innerHTML = this.createInnerHtml();
    //получаем элемент columnChart
    this.element = wrapperElement.firstElementChild;
    this.subElements = this.getSubElements();
  }

  /**
   * Формирует ColumnChart в формате html
   * @returns {string}
   */
  createInnerHtml() {
    return `
        <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
          <div class="column-chart__title">
            Total ${this.label}
            ${this.getLink()}
          </div>
          <div class="column-chart__container">
            <div data-element="header" class="column-chart__header">
            </div>
            <div data-element="body" class="column-chart__chart">
            </div>
          </div>
        </div> `;
  }

  getLink() {
    return this.link ? `<a class="column-chart__link" href="${this.link}">ViewAll</a>` : '';
  }

  /**
   * Обновление данных элементов без перезагрузки всего ColumnChart
   * @returns {*} обновленные элементы с отображаемыми данными для ColumnChart
   */
  getSubElements() {
    const elements = this.element.querySelectorAll('[data-element]');
    return [...elements].reduce((childElements, nextFindElement) => {
      childElements[nextFindElement.dataset.element] = nextFindElement;
      return childElements;
    }, {});
  }

  /**
   * Обновляет данные в ColumnChart на основании данных, загруженных с сервера
   * @param from начальное значение диапазона времени отображения данных
   * @param to конечное значение диапазона времени отображения данных
   */
  async update(from, to) {
    this.range.from = from;
    this.range.to = to;
    this.url.searchParams.set('from', from.toISOString());
    this.url.searchParams.set('to', to.toISOString());

    const responseJson = await fetchJson(this.url);
    this.data = Object.values(responseJson);
    this.subElements.header.textContent = this.formatHeading(this.data.reduce((sum, nextValue) => (sum + nextValue), 0));
    this.subElements.body.innerHTML = this.getColumns();
    this.element.classList.remove('column-chart_loading');

    return responseJson;
  }

  /**
   * Получение данных в виде процентного соотношения
   * @returns {string} возвращает строку, представляющую совокупность конкатенированных элементов верстки - колонки,
   * размер которых выражен в процентах и зависит от размера элемента columnChart
   */
  getColumns() {
    const maxValue = Math.max(...this.data);
    //вычисление размера шкалы отображения колонок с учетом высоты ColumnChart
    const scaleSize = this.chartHeight / maxValue;

    return this.data.map(element => {
      const percent = (element / maxValue * 100).toFixed(0);
      return `<div style="--value: ${Math.floor(element * scaleSize)}" data-tooltip="${percent}%"></div>`;
    }).join('');
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.subElements = {};
  }
}
