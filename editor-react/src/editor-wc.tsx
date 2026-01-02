
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { Editor } from './Editor'

class BlogEditorElement extends HTMLElement {
  private root: Root | null = null
  private value: string = ''

  static get observedAttributes() {
    return ['value']
  }

  // =========================
  // LIFECYCLE
  // =========================
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' })
    }

    const shadow = this.shadowRoot!

    // Limpiar shadow (hot reload seguro)
    shadow.innerHTML = ''

    // Estilos aislados
    const style = document.createElement('style')
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        background: #fff;
      }

      .editor {
        min-height: 280px;
        padding: 16px;
        box-sizing: border-box;

        font-family: Inter, system-ui, sans-serif;
        font-size: 15px;
        line-height: 1.6;
        color: #111;

        outline: none;
        cursor: text;
      }

      .editor p {
        margin: 0 0 0.75rem;
      }
    `
    shadow.appendChild(style)

    const mountPoint = document.createElement('div')
    shadow.appendChild(mountPoint)

    this.root = createRoot(mountPoint)
    this.value = this.getAttribute('value') ?? ''

    this.render()

    // 🔥 avisamos que el editor ya está listo
    queueMicrotask(() => {
      this.dispatchEvent(
        new CustomEvent('ready', {
          bubbles: true,
          composed: true,
        })
      )
    })
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === 'value') {
      this.value = value ?? ''
      this.render()
    }
  }

  disconnectedCallback() {
    this.root?.unmount()
    this.root = null
  }

  // =========================
  // API PÚBLICA 🔥
  // =========================
  getHTML() {
    return this.value
  }

  setHTML(html: string) {
    this.value = html
    this.setAttribute('value', html)
  }

  clear() {
    this.setHTML('<p></p>')
  }

  focus() {
    const editable = this.shadowRoot?.querySelector('[contenteditable="true"]') as HTMLElement
    editable?.focus()
  }

  // =========================
  // RENDER
  // =========================
  private render() {
    if (!this.root) return

    this.root.render(
      <Editor
        value={this.value}
        onChange={(html) => {
          this.value = html

          this.dispatchEvent(
            new CustomEvent('change', {
              detail: html,
              bubbles: true,
              composed: true,
            })
          )
        }}
      />
    )
  }
}

if (!customElements.get('blog-editor')) {
  customElements.define('blog-editor', BlogEditorElement)
}
