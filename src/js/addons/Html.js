import utils from '../utils';
import Toolbar from '../Toolbar';

export default class Html {

  constructor(plugin, options) {
    this.options = {
      label: '<span class="fa fa-bars"></span>',
      captions: true,
      storeMeta: false,
      styles: {
        left: {
          label: '<span class="fa fa-align-left"></span>'
        },
        wide: {
          label: '<span class="fa fa-align-justify"></span>'
        },
      },
      actions: {
        remove: {
          label: '<span class="fa fa-times"></span>',
        }
      },
      parseOnPaste: false,
    };

    Object.assign(this.options, options);

    this._plugin = plugin;
    this._editor = this._plugin.base;

    this.activeClassName = 'medium-editor-insert-embed-html-active';
    this.elementClassName = 'medium-editor-insert-embed-html';

    this.alignLeftClassName = 'align-left';
    this.alignCenterClassName = 'align-center-wide';

    this.label = this.options.label;
    this.descriptionPlaceholder = this.options.descriptionPlaceholder;

    this.initToolbar();
    this.events();

  }

  events() {
    this._plugin.on(document, 'click', this.unselectEmbed.bind(this));
    this._plugin.on(document, 'keydown', this.handleKey.bind(this));

    this._plugin.getEditorElements().forEach((editor) => {
      this._plugin.on(editor, 'click', this.selectEmbed.bind(this));
    });
  }

  selectEmbed(e) {
    const el = e.target;
    if (this.getClosestElementByClassName(el, this.elementClassName)) {
      this.selectEmbedCore(el, event);
      e && e.stopPropagation();
      e && e.preventDefault();
    }
  }

  getClosestElementByClassName(el, className) {
    while (el) {
      if (el.classList && el.classList.contains(className)) return el;
      el = el.parentNode;
    }
  }


  selectEmbedCore(el) {
    const element = this.getClosestElementByClassName(el, this.elementClassName);
    element.classList.add(this.activeClassName);
    const currentSelection = window.getSelection();
  }

  unselectEmbed(e) {
    const el = e.target;
    this.unselectEmbedCore(el);
  }

  unselectEmbedCore(el) {
    let clickedEmbed, clickedEmbedPlaceholder, html, embedsPlaceholders;

    html = utils.getElementsByClassName(this._plugin.getEditorElements(), this.elementClassName);
    if (!html || !html.length) {
      return false;
    }

    if (html) {
      Array.prototype.forEach.call(html, (html) => {
        if (html !== clickedEmbed) {
          html.classList.remove(this.activeClassName);
        }
      });
    }
  }

  getSiblingParagraph(el) {
    if (!el) return false;

    let nextSiblingDOM = el.nextSibling;
    let nextSiblingParagraphDOM;

    while (nextSiblingDOM && !nextSiblingParagraphDOM) {
      if (nextSiblingDOM && nextSiblingDOM.tagName === 'P') {
        nextSiblingParagraphDOM = nextSiblingDOM;
      } else {
        nextSiblingDOM = nextSiblingDOM.nextSibling;
      }
    }

    return nextSiblingParagraphDOM;
  }

  handleKey(e) {
    const target = e.target;

    // Enter key
    if (e.which === 40 || e.which === 13) {
      // Detect selected html
      const selectedEmbedDOM = document.querySelector(`.${this.activeClassName}`);

      if (selectedEmbedDOM) {
        let nextSiblingParagraphDOM = this.getSiblingParagraph(selectedEmbedDOM);

        if (!nextSiblingParagraphDOM) {
          // Insert paragraph and focus
          const paragraph = document.createElement('p');
          paragraph.innerHTML = '<br>';
          selectedEmbedDOM.insertAdjacentElement('afterend', paragraph);
        }

        // Focus next paragraph
        nextSiblingParagraphDOM = this.getSiblingParagraph(selectedEmbedDOM);

        if (nextSiblingParagraphDOM) {
          if (!nextSiblingParagraphDOM.innerHTML) {
            nextSiblingParagraphDOM.innerHTML = '<br>';
          }
          window.getSelection().removeAllRanges();
          this._plugin.getCore()._editor.selectElement(nextSiblingParagraphDOM);
          selectedEmbedDOM.classList.remove(this.activeClassName);
          MediumEditor.selection.clearSelection(document, true);
          selectedEmbedDOM.classList.remove(this.activeClassName);
          e.preventDefault();
        }
      }
    }
    // Backspace, delete
    if ([MediumEditor.util.keyCode.BACKSPACE, MediumEditor.util.keyCode.DELETE].indexOf(e.which) > -1) {
      this.removeEmbed(e);
    } else if (document.querySelector(`.${this.activeClassName}`)) {
      // Block all keys
      e.preventDefault();
    }
  }

  setFocusOnElement(el) {
    // this._editor.elements[0].focus();
    setTimeout(() => {
      const currentSelection = window.getSelection();
      const range = document.createRange();
      range.setStart(el, 0);
      currentSelection.removeAllRanges();
      currentSelection.addRange(range);
    }, 300);
  }

  handleClick() {
    this.el = this._plugin.getCore().selectedElement;
    this.setFocusOnElement(this.el);
    this.embedHtml(this.el);
  }

  removeEmbed(e) {
    const selectedEmbedDOM = document.querySelector(`.${this.activeClassName}`);
    if (selectedEmbedDOM) {
      selectedEmbedDOM.remove();
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * Init Toolbar for tuning html position
   *
   * @param {string} url
   * @param {pasted} boolean
   * @return {void}
   */
  initToolbar() {
    this.toolbar = new Toolbar({
      plugin: this._plugin,
      type: 'html',
      activeClassName: this.activeClassName,
      buttons: [{
          name: 'html-align-left',
          action: 'align-left',
          className: 'btn-align-left',
          label: 'Left',
          onClick: (function(evt) {
            this.changeAlign(this.alignLeftClassName, 'html-align-left', evt);
          }).bind(this),
        },
        {
          name: 'html-align-center-wide',
          action: 'align-center-wide',
          className: 'btn-align-center-wide',
          label: 'Center',
          onClick: (function(evt) {
            this.changeAlign(this.alignCenterClassName, 'html-align-center', evt);
          }).bind(this),
        },
      ]
    });

    this._editor.extensions.push(this.toolbar);
  }

  changeAlign(className, action, evt) {
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }

    const el = document.querySelector(`.${this.activeClassName}`);
    el.classList.remove(
      this.alignLeftClassName,
      this.alignCenterClassName,
    );
    el.classList.add(className);

    this.toolbar.setToolbarPosition();

    if (this.options.onChange) {
      this.options.onChange(action);
    }

  }

  /**
   * Add html to page
   *
   * @param {string} html
   * @param {string} pastedUrl
   * @return {void}
   */

  embedHtml(el) {
    const html = document.createElement('div');
    html.classList.add(this.elementClassName);

    let contentHTML;
    if (this.options.contentHTML) {
      if (typeof this.options.contentHTML === 'function') {
        contentHTML = this.options.contentHTML();
      } else {
        contentHTML = this.options.contentHTML;
      }
    }

    if (contentHTML) {
      html.innerHTML = contentHTML;
      el.replaceWith(html);

      this.options.onInsert && this.options.onInsert();
    }

    return true;
  }


  destroy() {
    this.cancelEmbed();
  }
}