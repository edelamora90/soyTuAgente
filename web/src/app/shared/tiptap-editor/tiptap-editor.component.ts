// web/src/app/shared/tiptap-editor/tiptap-editor.component.ts
// ============================================================================
// TipTapEditorComponent
// ----------------------------------------------------------------------------
// Editor WYSIWYG profesional para el módulo Blog
// • HTML output
// • Placeholder correcto
// • Sin focus azul / sin selección fantasma
// • Compatible con Angular Standalone
// ============================================================================

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import ResizeImage from 'tiptap-extension-resize-image';


import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

import { Selection } from 'prosemirror-state';
import { UploadApiService } from '../../core/services/upload-api.service';

@Component({
  selector: 'app-tiptap-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tiptap-editor.component.html',
  styleUrls: ['./tiptap-editor.component.scss'],
})
export class TipTapEditorComponent implements OnInit, OnDestroy {

  // ===========================================================================
  // INPUT / OUTPUT
  // ===========================================================================
  @Input() content: string = '';
  @Output() contentChange = new EventEmitter<string>();

  // ===========================================================================
  // TEMPLATE REFS
  // ===========================================================================
  @ViewChild('editorHost', { static: true })
  editorHost!: ElementRef<HTMLElement>;

  @ViewChild('imageInput')
  imageInput!: ElementRef<HTMLInputElement>;

  // ===========================================================================
  // SERVICES
  // ===========================================================================
  private uploadApi = inject(UploadApiService);

  // ===========================================================================
  // STATE
  // ===========================================================================
  editor!: Editor;
  uploading = false;

  // ===========================================================================
  // INIT
  // ===========================================================================
  ngOnInit(): void {
    this.editor = new Editor({
      element: this.editorHost.nativeElement,

      // 🔑 CLAVE ABSOLUTA:
      // Nunca iniciar vacío, esto rompe placeholder y provoca selección azul
      content: this.content?.trim()
        ? this.content
        : '<p></p>',

      extensions: [
        StarterKit,
        TextStyle,
        Color,

        Image.configure({
          inline: false,
          allowBase64: false,
        }),

        ResizeImage.configure({
    allowBase64: false,
  }),

        Placeholder.configure({
          placeholder: 'Empieza a escribir tu contenido...',
          emptyEditorClass: 'is-editor-empty',
        }),
      ],

      editorProps: {
        attributes: {
          class: 'tiptap-editor',
          spellcheck: 'false',
        },
      },

      onUpdate: ({ editor }) => {
        const html = editor.getHTML();

        const cleaned =
          html === '<p></p>' || html === '<p><br></p>'
            ? ''
            : html;

        this.contentChange.emit(cleaned);
      },
    });

    // =========================================================================
    // 🔥 FIX DEFINITIVO: elimina selección automática al hacer focus
    // =========================================================================
    this.editor.on('focus', () => {
      requestAnimationFrame(() => {
        const { state, view } = this.editor;
        const { selection, doc } = state;

        if (selection.from !== selection.to) {
          const resolved = doc.resolve(selection.to);
          view.dispatch(
            state.tr.setSelection(
              Selection.near(resolved)
            )
          );
        }
      });
    });
  }

  // ===========================================================================
  // TOOLBAR ACTIONS
  // ===========================================================================
  toggleBold(): void {
    this.editor.chain().focus().toggleBold().run();
  }

  toggleItalic(): void {
    this.editor.chain().focus().toggleItalic().run();
  }

  toggleStrike(): void {
    this.editor.chain().focus().toggleStrike().run();
  }

  toggleBulletList(): void {
    this.editor.chain().focus().toggleBulletList().run();
  }

  setParagraph(): void {
    this.editor.chain().focus().setParagraph().run();
  }

  setHeading(level: 2 | 3): void {
    this.editor.chain().focus().toggleHeading({ level }).run();
  }

  isActive(type: string, opts?: any): boolean {
    return this.editor?.isActive(type, opts) ?? false;
  }

  // ===========================================================================
  // IMAGE UPLOAD
  // ===========================================================================
  openImageDialog(): void {
    this.imageInput.nativeElement.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;

    this.uploadApi.uploadBlogImage(file, 'body').subscribe({
      next: (res) => {
        this.editor
          .chain()
          .focus()
          .setImage({ src: res.url })
          .run();

        this.uploading = false;
        input.value = '';
      },
      error: () => {
        this.uploading = false;
      },
    });
  }

  // ===========================================================================
  // DESTROY
  // ===========================================================================
  ngOnDestroy(): void {
    this.editor?.destroy();
  }
}
