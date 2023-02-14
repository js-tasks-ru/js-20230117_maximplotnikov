export default class RangePicker {
  /** Признак установленного диапазона дат */
  isDateRangeSet = true;
  /** Набор стилей применяемых к ячейкам календаря */
  selectedCellStyles = ['rangepicker__selected-from', 'rangepicker__selected-between', 'rangepicker__selected-to'];
  /** Заданный диапазон дат */
  selectedDateRange = {
    from: new Date(),
    to: new Date()
  };

  /**
   * Форматирование вынесено в отдельный метод для тестов
   * @param data
   * @returns {string}
   */
  static formatDate(data) {
    return data.toLocaleString('ru', {dateStyle: 'short'});
  }

  constructor({
    from = new Date(),
    to = new Date()
  } = {}) {
    this.dateFrom = new Date(from);
    this.selectedDateRange = {from, to};

    this.render();
  }

  render() {
    const rangePickerWrapper = document.createElement('div');
    rangePickerWrapper.innerHTML = this.getRangePickerHTML();
    this.element = rangePickerWrapper.firstElementChild;
    this.subElements = this.getSubElements(rangePickerWrapper);
    this.addEventListeners();
  }

  /**
   * Формирование RangePicker
   * @returns {string}
   */
  getRangePickerHTML() {
    return `
        <div class="rangepicker">
            <div class="rangepicker__input" data-element="input">
                <span data-element="from">${RangePicker.formatDate(this.selectedDateRange.from)}</span>
                -
                <span data-element="to">${RangePicker.formatDate(this.selectedDateRange.to)}</span>
            </div>
            <div class="rangepicker__selector" data-element="selector"></div>
        </div>`;
  }

  getSubElements(rangePickerWrapper) {
    const subElements = {};
    rangePickerWrapper.querySelectorAll('[data-element]').forEach(subElement => {
      subElements[subElement.dataset.element] = subElement;
    });
    return subElements;
  }

  addEventListeners() {
    const {input, selector} = this.subElements;

    document.addEventListener('click', this.onDocumentClick, true);
    input.addEventListener('click', this.onRangePickerClick);
    selector.addEventListener('click', this.onCellClick);
  }

  /**
   * Слушатель кликов по документу.
   * Если клик произведен не по RangePicker - то скрываем его
   * @param event событие клика
   */
  onDocumentClick = event => {
    const isOpen = this.element.classList.contains('rangepicker_open');
    const isRangePicker = this.element.contains(event.target);

    if (isOpen && !isRangePicker) {
      this.element.classList.remove('rangepicker_open');
    }
  };

  /**
   * Слушатель кликов по RangePicker, и инициализация его отрисовки
   */
  onRangePickerClick = () => {
    this.element.classList.toggle('rangepicker_open');
    this.renderRangePickerSelector();
  };

  /**
   * Слушатель кликов по ячейкам с датами RangePicker
   */
  onCellClick = event => {
    const target = event.target;
    if (target.classList.contains('rangepicker__cell')) {
      this.changeDateRangeAfterCellClick(target);
    }
  }

  renderRangePickerSelector() {
    const leftCalendarDate = new Date(this.dateFrom);
    const rightCalendarDate = new Date(this.dateFrom);
    rightCalendarDate.setMonth(rightCalendarDate.getMonth() + 1);

    const selector = this.subElements.selector;
    selector.innerHTML = `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left"></div>
      <div class="rangepicker__selector-control-right"></div>
      ${this.getCalendarHtml(leftCalendarDate)}
      ${this.getCalendarHtml(rightCalendarDate)}
    `;
    //добавляем слушатель левого элемента управления для перелистывания "назад"
    selector.querySelector('.rangepicker__selector-control-left').addEventListener('click', () => this.prev());
    //добавляем слушатель правого элемента управления для перелистывания "вперед"
    selector.querySelector('.rangepicker__selector-control-right').addEventListener('click', () => this.next());

    this.resetRangerPickerCellsStyle();
  }

  /**
   * Перерисовка RangePicker при переходе "назад"
   */
  prev() {
    this.dateFrom.setMonth(this.dateFrom.getMonth() - 1);
    this.renderRangePickerSelector();
  }

  /**
   * Перерисовка RangePicker при переходе "назад"
   */
  next() {
    this.dateFrom.setMonth(this.dateFrom.getMonth() + 1);
    this.renderRangePickerSelector();
  }

  /**
   * Формирование календаря месяцев, отображаемых в RangePicker слева и справа
   * @param showDate
   * @returns {string}
   */
  getCalendarHtml(showDate) {
    const daysOfWeek = dayIndex => {
      //воскресенье[0] должно быть в конце
      const index = dayIndex === 0 ? 6 : (dayIndex - 1);
      return index + 1;
    };

    const date = new Date(showDate);
    date.setDate(1);
    const monthStr = date.toLocaleString('ru', {month: 'long'});
    let calendarHtml = `
        <div class="rangepicker__calendar">
            <div class="rangepicker__month-indicator">
                <time datetime=${monthStr}>${monthStr}</time>
            </div>
            <div class="rangepicker__day-of-week">
                <div>Пн</div>
                <div>Вт</div>
                <div>Ср</div>
                <div>Чт</div>
                <div>Пт</div>
                <div>Сб</div>
                <div>Вс</div>
            </div>
            <div class="rangepicker__date-grid">
                <button type="button" class="rangepicker__cell" data-value="${date.toISOString()}" style="--start-from: ${daysOfWeek(date.getDay())}">
                    ${date.getDate()}
                </button>`;

    date.setDate(2);
    while (date.getMonth() === showDate.getMonth()) {
      calendarHtml += `
        <button type="button" class="rangepicker__cell"  data-value="${date.toISOString()}">
            ${date.getDate()}
        </button>`;
      date.setDate(date.getDate() + 1);
    }
    //закрываем html блоки "rangepicker__date-grid" и "rangepicker__calendar"
    calendarHtml += '</div></div>';

    return calendarHtml;
  }

  /**
   * Подсветка диапазона дат в календаре.
   * Применение необходимого стиля к ячейкам календаря с датами.
   */
  resetRangerPickerCellsStyle() {
    const { from, to } = this.selectedDateRange;
    this.element.querySelectorAll('.rangepicker__cell').forEach(rangePickerCell => {
      this.resetCellStyle(from, to, rangePickerCell);
    });
    this.setFirstLastRangeStyle(from, "from");
    this.setFirstLastRangeStyle(to, "to");
  }

  resetCellStyle(from, to, rangePickerCell) {
    const dataOnCell = rangePickerCell.dataset.value;
    const date = new Date(dataOnCell);
    rangePickerCell.classList.remove(...this.selectedCellStyles);

    if (from && dataOnCell === from.toISOString()) {
      rangePickerCell.classList.add('rangepicker__selected-from');
    } else if (to && dataOnCell === to.toISOString()) {
      rangePickerCell.classList.add('rangepicker__selected-to');
    } else if (from && to && date >= from && date <= to) {
      rangePickerCell.classList.add('rangepicker__selected-between');
    }
  }

  setFirstLastRangeStyle(dataCell, dataCellName) {
    if (dataCell) {
      const selectedDataCell = this.element.querySelector(`[data-value="${dataCell.toISOString()}"]`);
      if (selectedDataCell) {
        selectedDataCell.closest('.rangepicker__cell').classList.add('rangepicker__selected-' + dataCellName);
      }
    }
  }

  changeDateRangeAfterCellClick(target) {
    const value = target.dataset.value;
    if (!value) {
      return;
    }
    const selectData = new Date(value);
    if (this.isDateRangeSet) {
      this.selectedDateRange.from = selectData;
      this.selectedDateRange.to = null;
    } else {
      if (selectData > this.selectedDateRange.from) {
        this.selectedDateRange.to = selectData;
      } else {
        this.selectedDateRange.to = this.selectedDateRange.from;
        this.selectedDateRange.from = selectData;
      }
    }
    this.isDateRangeSet = !this.isDateRangeSet;
    this.resetRangerPickerCellsStyle();

    //если даты установлены, сворачиваем RangePicker c новым диапазоном дат
    if (this.selectedDateRange.from && this.selectedDateRange.to) {
      this.dispatchEvent();
      this.element.classList.remove('rangepicker_open');
      this.subElements.from.innerHTML = RangePicker.formatDate(this.selectedDateRange.from);
      this.subElements.to.innerHTML = RangePicker.formatDate(this.selectedDateRange.to);
    }
  }

  dispatchEvent() {
    this.element.dispatchEvent(new CustomEvent('date-select', {
      bubbles: true,
      detail: this.selectedDateRange
    }));
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    const {input, selector} = this.subElements;
    input.removeEventListener('click', this.onRangePickerClick);
    selector.removeEventListener('click', this.changeDateRangeAfterCellClick);
    document.removeEventListener('click', this.onDocumentClick, true);
    this.remove();
    this.element = null;
    this.subElements = null;
  }
}
