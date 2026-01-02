import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef } from 'react'

type Props = {
  value?: string
  onChange?: (html: string) => void
}

export function Editor({ value = '', onChange }: Props) {
  const lastValue = useRef<string>('')

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '<p></p>',
    autofocus: false,
    editorProps: {
      attributes: {
        class: 'editor',
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML()
      lastValue.current = html
      onChange?.(html)
    },
  })

  // Sync externo → editor (sin romper cursor)
  useEffect(() => {
    if (!editor) return
    if (!value) return

    if (value !== lastValue.current) {
      editor.commands.setContent(value, { emitUpdate: false }) // ✅ FIX
      lastValue.current = value
    }
  }, [value, editor])

  if (!editor) return null

  return <EditorContent editor={editor} />
}
