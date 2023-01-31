export default class ColumnChart {
  /** Заданная высота ColumnChart */
  chartHeight = 50;
  element;
  subElements = {};

  constructor({
    data = [],
    label = 'emptyLabel',
    link = 'emptyLink',
    value = 0,
    formatHeading
  } = {}) {
    this.data = data;
    this.label = label;
    this.link = link;
    this.value = formatHeading === undefined ? value : formatHeading(value);
    this.render();
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.createInnerHtml();
    this.element = element.firstElementChild;

    if (this.data.length) {
      this.element.classList.remove('column-chart_loading');
    }
    this.subElements = this.getSubElements(this.element);
  }

  createInnerHtml() {
    return `
        <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
          <div class="column-chart__title">
            Total ${this.label}
            ${this.getLink()}
          </div>
          <div class="column-chart__container">
            <div data-element="header" class="column-chart__header">
              ${this.value}
            </div>
            <div data-element="body" class="column-chart__chart">
              ${this.getColumnsByPercent(this.data)}
            </div>
          </div>
        </div>
      `;
  }

  getLink() {
    return this.link ? `<a class="column-chart__link" href="${this.link}">ViewAll</a>` : '';
  }

  /**
   * Получение данных в виде процентного соотношения
   * @returns {string} возвращает строку, представляющую совокупность конкатенированных элементов верстки - колонки,
   * размер которых выражен в процентах и зависит от размера элемента columnChart
   */
  getColumnsByPercent(data) {
    const maxValue = Math.max(...data);
    //вычисление размера шкалы отображения колонок с учетом высоты ColumnChart
    const scaleSize = this.chartHeight / maxValue;
    return data.map(element => {
      const percent = (element / maxValue * 100).toFixed(0);
      return `<div style="--value: ${Math.floor(element * scaleSize)}" data-tooltip="${percent}%"></div>`;
    }).join('');
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');
    return [...elements].reduce((childElements, nextFindElement) => {
      childElements[nextFindElement.dataset.element] = nextFindElement;
      return childElements;
    }, {});
  }

  update(newData) {
    this.subElements.body.innerHTML = this.getColumnsByPercent(newData);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.subElements = {};
  }
}
