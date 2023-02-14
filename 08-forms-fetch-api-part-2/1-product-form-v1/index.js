import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  constructor(productId) {
    this.productId = productId;
    this.productsUrl = new URL("api/rest/products", BACKEND_URL);
    this.productsUrl.searchParams.set('id', this.productId);

    this.categoriesUrl = new URL("api/rest/categories", BACKEND_URL);
    this.categoriesUrl.searchParams.set('_sort', 'weight');
    this.categoriesUrl.searchParams.set('_refs', 'subcategory');

    this.defaultForm = {
      title: '',
      description: '',
      quantity: 1,
      subcategory: '',
      status: 1,
      images: [],
      price: 0,
      discount: 0
    };
  }

  async render() {
    const [categories, products] = await this.loadFormData();
    this.products = products[0];
    this.categories = categories;

    const formWrapper = document.createElement('div');
    formWrapper.innerHTML = this.getFormHtml();
    this.element = formWrapper.firstElementChild;
    this.subElements = this.getSubElements();
    this.addEventListeners();

    //добавлено для теста 'should be rendered correctly'
    return this.element;
  }

  async loadFormData() {
    const categoriesRequest = fetchJson(this.categoriesUrl);
    const productsRequest = this.productId ? fetchJson(this.productsUrl) : Promise.resolve(this.defaultForm);

    return await Promise.all([categoriesRequest, productsRequest]);
  }

  getSubElements() {
    const result = {};
    this.element.querySelectorAll('[data-element]').forEach(dataElement => {
      result[dataElement.dataset.element] = dataElement;
    });
    return result;
  }

  /**
   * Формирование формы с заполнением данных
   * @returns {string}
   */
  getFormHtml() {
    return `
    <div class="product-form">
        <form data-element="productForm" class="form-grid">
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input required="" type="text" id="title" name="title" class="form-control" placeholder="Название товара"
                  value="${escapeHtml(this.products.title)}">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea required="" class="form-control" id="description" name="description" data-element="productDescription"
              placeholder="Описание товара" >${escapeHtml(this.products.description)}</textarea>
          </div>
          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            <ul class="sortable-list" data-element="imageListContainer">
                ${this.getImagesHtml()}
            </ul>
            <button data-element="uploadImage" type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
          </div>
          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select class="form-control" name="subcategory" id="subcategory">
              ${this.getCategories()}
            </select>
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input required="" type="number" id="price" name="price" class="form-control" placeholder="100"
                value="${this.products.price}">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input required="" type="number" id="discount" name="discount" class="form-control" placeholder="0"
              value="${this.products.discount}">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input required="" type="number" class="form-control" id="quantity" name="quantity" placeholder="1"
            value="${this.products.quantity}">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select class="form-control" name="status" id="status">
              <option value="1" ${this.products.status && `selected`}>Активен</option>
              <option value="0" ${!this.products.status && `selected`}>Неактивен</option>
            </select>
          </div>
          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">
              ${this.productId ? "Сохранить" : "Добавить"} товар
            </button>
          </div>
        </form>
      </div>`;
  }

  getImagesHtml() {
    return this.products.images.map(image => this.getImageHtml(image.url, image.source)).join('');
  }

  getImageHtml(imageUrl, imageName) {
    return `
        <li class="products-edit__imagelist-item sortable-list__item" style="">
            <input type="hidden" name="url" value="${escapeHtml(imageUrl)}">
            <input type="hidden" name="source" value="${escapeHtml(imageName)}">
            <span>
                <img src="icon-grab.svg" data-grab-handle="" alt="grab">
                <img class="sortable-table__cell-img" alt="Image" src="${escapeHtml(imageUrl)}">
                <span>${escapeHtml(imageName)}</span>
            </span>
            <button type="button">
                <img src="icon-trash.svg" data-delete-handle="" alt="delete">
            </button>
        </li>`;
  }

  getCategories () {
    return this.categories.map(category => {
      return category.subcategories.map(subcategory => {
        return `<option value="${subcategory.id}" ${this.products && subcategory.id === this.products.subcategory && `selected`}>
            ${category.title} ${escapeHtml('>')} ${subcategory.title}`
      }).join('');
    }).join('');
  }

  addEventListeners() {
    const {imageListContainer, productForm, uploadImage} = this.subElements;

    imageListContainer.addEventListener('click', this.onRemoveImage);
    productForm.addEventListener('submit', this.onSubmit);
    uploadImage.addEventListener('click', this.onUploadImage);
  }

  onRemoveImage = event => {
    if (Object.keys(event.target.dataset).find(key => key === 'deleteHandle'))
    {
      event.target.closest('li').remove();
    }
  }

  onSubmit = event => {
    event.preventDefault();
    this.save();
  };

  async save() {
    try {
      const dataOnForm = this.getDataOnForm();
      const response = await fetchJson(`${BACKEND_URL}/api/rest/products`, {
        method: this.productId ? 'PATCH' : 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataOnForm)
      });
      //производим "dispatch" событие создания/редактирования товара
      this.dispatchEvent(response.id);
    } catch (error) {
      console.error('something wrong', error);
      alert("Что то пошло не так. Изменения не сохранилась.")
    }
  }

  getDataOnForm() {
    const dataOnForm = {};
    const { productForm, imageListContainer } = this.subElements;

    const castToNumber = ['price', 'quantity', 'discount', 'status'];
    for (const field of Object.keys(this.defaultForm)) {
      if (field === 'images') {continue;}
      dataOnForm[field] = castToNumber.includes(field)
        ? parseInt(productForm.querySelector(`#${field}`).value)
        : productForm.querySelector(`#${field}`).value;
    }

    dataOnForm.images = [];
    const imagesHTMLCollection = imageListContainer.querySelectorAll('.sortable-table__cell-img');
    for (const image of imagesHTMLCollection) {
      dataOnForm.images.push({
        url: image.src,
        source: image.alt
      });
    }
    dataOnForm.id = this.productId;
    return dataOnForm;
  }

  onUploadImage = () => {
    const fileInput = document.createElement('input');

    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.addEventListener('change', async () => {
      const [file] = fileInput.files;

      if (file) {
        const formData = new FormData();
        const { uploadImage, imageListContainer } = this.subElements;

        formData.append('image', file);

        uploadImage.classList.add('is-loading');
        uploadImage.disabled = true;

        const result = await fetchJson('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
          },
          body: formData,
          referrer: ''
        });

        imageListContainer.append(this.getImageItem(result.data.link, file.name));

        uploadImage.classList.remove('is-loading');
        uploadImage.disabled = false;

        // Remove input from body
        fileInput.remove();
      }
    });

    // must be in body for IE
    fileInput.hidden = true;
    document.body.append(fileInput);

    fileInput.click();
  };

  /**
   * По итогу редактирования товара, после отправки данных на сервер, компонент должен произвести "dispatch" события "product-updated".
   * По итогу создания товара, после отправки данных на сервер, компонент должен произвести "dispatch" события "product-saved"
   */
  dispatchEvent(productId) {
    const event = this.productId
      ? new CustomEvent('product-updated', { detail: productId })
      : new CustomEvent('product-saved');

    this.element.dispatchEvent(event);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.removeListeners();
    this.remove();
    this.element = null;
    this.subElements = null;
  }

  removeListeners() {
    const {imageListContainer, productForm, uploadImage} = this.subElements;
    imageListContainer.removeEventListener('click', this.onRemoveImage);
    productForm.removeEventListener('submit', this.onSubmit);
    uploadImage.removeEventListener('click', this.onUploadImage);
  }
}
