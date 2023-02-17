export default class SortableList {
  constructor({items}) {
    this.items = items;
    this.render();
    this.addEventListeners();
  }

  /**
   * Создаем сортируемы список c возможностью Drag’n’Drop, и добавляем в него элементы
   */
  render() {
    this.element = document.createElement('ul');
    this.element.classList.add('sortable-list');
    this.items.forEach(sortListItem => {
      sortListItem.classList.add('sortable-list__item');
      this.element.append(sortListItem);
    });
  }

  addEventListeners() {
    this.element.addEventListener('pointerdown', this.onPointerDown);
  }

  onPointerDown = event => {
    // или delete-handle, или grab-handle
    const sortListItemPart = event.target;
    this.removeIfDeleteEvent(sortListItemPart);
    this.moveIfGrabEvent(event, sortListItemPart);
  }

  /**
   * Если событие связано с кликом по кнопке удаления элемента списка - удаляем элемент
   * @param sortListItemPart часть элемента списка над которым произведено событие: delete элемент или grab элемент
   */
  removeIfDeleteEvent(sortListItemPart) {
    if (sortListItemPart.closest('[data-delete-handle]')) {
      sortListItemPart.closest('.sortable-list__item').remove();
    }
  }

  /**
   * Если событие связано с захватом кнопки перемещения элемента списка - перемещаем элемент
   * @param event
   * @param sortListItemPart часть элемента списка над которым произведено событие: delete элемент или grab элемент
   */
  moveIfGrabEvent(event, sortListItemPart) {
    if (sortListItemPart.closest('[data-grab-handle]')) {
      this.addMoveEventListeners();

      //позиция элемента относительно левого края
      this.clientX = event.clientX;

      //заглушка вместо элемента
      this.plugItem = document.createElement('div');
      this.plugItem.classList.add('sortable-list__placeholder');

      this.dragListItem = sortListItemPart.closest('.sortable-list__item');

      const sortListItemCoords = this.dragListItem.getBoundingClientRect();
      //высота элемента меню
      this.plugItem.style.height = sortListItemCoords.height + 'px';

      //запоминаем расположение курсора относительно верхнего левого угла элемента,для сохранения положения во время перетаскивания
      this.shiftX = event.clientX - sortListItemCoords.left;
      this.shiftY = event.clientY - sortListItemCoords.top;

      //добавляем заглушку
      this.dragListItem.before(this.plugItem);

      //отключаем Drag’n’Drop браузера
      this.dragListItem.ondragstart = () => false;
      this.dragListItem.classList.add('sortable-list__item_dragging');
      //устанавливаем реальную ширину перетаскиваемого элемента
      this.dragListItem.style.width = sortListItemCoords.width + 'px';
    }
  }

  addMoveEventListeners() {
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp, { once: true });
  }

  onPointerMove = event => {
    if (event.clientY <= 0) {return;}

    //расположение относительно левого верхнего угла
    this.dragListItem.style.left = this.clientX + 'px';
    this.dragListItem.style.top = event.clientY + 'px';

    //элемент в координатах
    const itemOnCoords = document.elementFromPoint(this.clientX, event.clientY).closest('.sortable-list__item');

    //поддержание позиционирования при перетаскивании элемента относительно курсора
    this.dragListItem.style.left = event.clientX - this.shiftX + 'px';
    this.dragListItem.style.top = event.clientY - this.shiftY + 'px';

    if (!itemOnCoords) {return;}
    //перемещение заглушки относительно положения перетаскиваемого элемент
    const coords = itemOnCoords.getBoundingClientRect();
    if (event.clientY - coords.y > coords.height / 2) {
      itemOnCoords.after(this.plugItem);
    } else {
      itemOnCoords.before(this.plugItem);
    }
  }

  onPointerUp = () => {
    this.dragListItem.classList.remove('sortable-list__item_dragging');
    this.plugItem.before(this.dragListItem);
    this.dragListItem.style = "";
    this.dragListItem = null;
    this.plugItem.remove();
    this.plugItem = null;
    this.removeMoveEventListeners();
  }

  removeMoveEventListeners() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp, { once: true });
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.remove();
  }
}
