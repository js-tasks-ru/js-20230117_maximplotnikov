export default class Tooltip {
  constructor() {
    if (Tooltip.instance) {return Tooltip.instance;}
    Tooltip.instance = this;
  }

  /**
   * Инициализация слушателей для отображения всплывающих сообщений о элементах на странице
   */
  initialize () {
    document.addEventListener('pointerover', (event) => this.pointerOverElement(event));
    document.addEventListener('pointerout', (event) => this.pointerOutElement(event));
  }

  /**
   * Обработка событий наведения курсора на элемент
   * @param {Event} event событие наведения курсора на элемент
   */
  pointerOverElement(event) {
    const targetElement = event.target.closest('[data-tooltip]');
    if (!targetElement) { return;}
    this.render(targetElement.dataset.tooltip);
    document.addEventListener('pointermove', (event) => this.pointerMoveElement(event));
  }

  /**
   * Скрытие всплывающего сообщения при уведении курсора с целевого элемента
   * @param event
   */
  pointerOutElement(event) {
    this.remove() ;
    document.removeEventListener('pointermove', this.pointerMoveElement);
  }

  /**
   * Перемещение всплывающего сообщения в след за курсором
   * @param event cобытие перемещения курсора
   */
  pointerMoveElement(event) {
    const shift = 10;
    this.element.style.left = `${event.clientX + shift}px`;
    this.element.style.top = `${event.clientY + shift}px`;
  }

  /**
   * Добавление всплывающего элемента с сообщением на странице
   * @param tooltipMessage элемент для которого должно отобраазиться сообщение
   */
  render(tooltipMessage) {
    this.element = document.createElement('div');
    this.element.className = 'tooltip';
    this.element.innerHTML = tooltipMessage;

    document.body.append(this.element);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    document.removeEventListener('pointerover', this.pointerOverElement);
    document.removeEventListener('pointerout', this.pointerOutElement);
    document.removeEventListener('pointermove', this.pointerMoveElement);
  }
}
