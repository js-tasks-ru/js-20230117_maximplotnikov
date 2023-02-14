export default class DoubleSlider {
  constructor({
    min = 100,
    max = 200,
    formatValue = value => '$' + value,
    selected = {}
  } = {}) {
    this.min = min;
    this.max = max;
    this.selected = selected;
    this.formatValue = formatValue;

    this.render();
    this.element.addEventListener('pointerdown', this.onPointerDown);
  }

  render() {
    const sliderWrapper = document.createElement("div");
    sliderWrapper.innerHTML = this.getSliderHtml();
    this.element = sliderWrapper.firstElementChild;
    this.subElements = this.getSubElements();
  }

  getSubElements() {
    const result = {};
    this.element.querySelectorAll("[data-element]").forEach(subElement => {
      result[subElement.dataset.element] = subElement;
    });
    return result;
  }

  getSliderHtml() {
    return `
        <div class="range-slider">
            <span data-element = 'from'>${this.formatValue(this.selected.from ? this.selected.from : this.min)}</span>
            <div class="range-slider__inner" data-element = 'slider'>
                <span class="range-slider__progress" data-element = 'progress' style="left: ${this.getPercentValue(this.selected.from - this.min)}%; right: ${this.getPercentValue(this.selected.to - this.min)}%"></span>
                <span class="range-slider__thumb-left" data-element = 'leftThumb' style="left: ${this.getPercentValue(this.selected.from - this.min)}%"></span>
                <span class="range-slider__thumb-right" data-element = 'rightThumb' style="right: ${this.getPercentValue(100 - this.selected.from - this.min)}%"></span>
            </div>
            <span data-element = 'to'>${this.formatValue(this.selected.to ? this.selected.to : this.max)}</span>
        </div>`;
  }

  getPercentValue(value) {
    return value ? (value / (this.max - this.min)) * 100 : 0;
  }

  onPointerDown = (event) => {
    //расчет координат слайдера с учетом изменения размера окна
    const { width, left } = this.subElements.slider.getBoundingClientRect();
    this.sliderWitdth = width;
    this.sliderLeftSidePos = left;
    if (event.target.closest('.range-slider__thumb-left') || event.target.closest('.range-slider__thumb-right')) {
      this.targetThumb = event.target;
      document.addEventListener('pointermove', this.onPointerMove);
      document.addEventListener('pointerup', this.onPointerUp, { once: true });
    }
  }

  onPointerMove = (event) => {
    const currentXPos = event.clientX - this.sliderLeftSidePos ;
    const thumbValueFromLeftSide = !currentXPos || this.sliderWitdth === 0
      ? 0
      : Math.round(currentXPos * (this.max - this.min) / this.sliderWitdth);

    //обработка левого ползунка
    if (this.targetThumb.dataset.element === 'leftThumb')
    {
      if (currentXPos < 1) {
        this.setXPosition(this.min, 0);
        return;
      }
      const to = this.selected.to;
      if (thumbValueFromLeftSide + this.min >= to) {
        this.setXPosition(to, 100 - parseInt(this.subElements.rightThumb.style.right));
        return;
      }
      this.setXPosition(thumbValueFromLeftSide + this.min, this.getPercentValue(thumbValueFromLeftSide));
      return;
    }
    //обработка правого ползунка
    if (currentXPos >= this.sliderWitdth) {
      this.setXPosition(this.max, 0);
      return;
    }
    const from = this.selected.from;
    if (thumbValueFromLeftSide + this.min <= from) {
      this.setXPosition(from, 100 - parseInt(this.subElements.leftThumb.style.left));
      return;
    }
    this.setXPosition(thumbValueFromLeftSide + this.min, 100 - this.getPercentValue(thumbValueFromLeftSide));
  }

  setXPosition(thumbValueFromLeftSide, thumbValueByPercent) {
    if (this.targetThumb.dataset.element === 'leftThumb') {
      this.targetThumb.style.left = thumbValueByPercent + '%';
      this.subElements.from.innerHTML = this.formatValue(thumbValueFromLeftSide) ;
      this.subElements.progress.style.left = thumbValueByPercent + '%';
      this.selected.from = thumbValueFromLeftSide;
      return;
    }
    this.targetThumb.style.right = thumbValueByPercent + '%';
    this.subElements.to.innerHTML = this.formatValue(thumbValueFromLeftSide) ;
    this.subElements.progress.style.right = thumbValueByPercent + '%';
    this.selected.to = thumbValueFromLeftSide;
  }

  onPointerUp = () => {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointermove', this.onPointerMove);
    this.element.dispatchEvent(new CustomEvent('range-select', { detail: this.selected, bubbles: true}));
    this.targetThumb = null;
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.remove();
  }
}
