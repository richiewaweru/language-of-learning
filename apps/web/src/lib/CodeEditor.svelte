<script lang="ts">
  import { onMount } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { python } from '@codemirror/lang-python';
  import { Compartment, EditorState } from '@codemirror/state';

  let {
    value = '',
    onchange,
    readonly = false,
    allowPaste = true,
  }: {
    value?: string;
    onchange?: (next: string) => void;
    readonly?: boolean;
    allowPaste?: boolean;
  } = $props();

  let host: HTMLDivElement | undefined = $state();
  let view: EditorView | undefined;
  const readonlyCompartment = new Compartment();
  const pasteCompartment = new Compartment();

  onMount(() => {
    if (!host) return;
    view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          python(),
          readonlyCompartment.of([
            EditorState.readOnly.of(readonly),
            EditorView.editable.of(!readonly),
          ]),
          pasteCompartment.of(EditorView.domEventHandlers({
            paste(event) {
              if (allowPaste) return false;
              event.preventDefault();
              return true;
            },
          })),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onchange?.(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    return () => {
      view?.destroy();
    };
  });

  $effect(() => {
    if (!view) return;
    view.dispatch({
      effects: [
        readonlyCompartment.reconfigure([
          EditorState.readOnly.of(readonly),
          EditorView.editable.of(!readonly),
        ]),
        pasteCompartment.reconfigure(EditorView.domEventHandlers({
          paste(event) {
            if (allowPaste) return false;
            event.preventDefault();
            return true;
          },
        })),
      ],
    });
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  });
</script>

<div
  class="editor"
  class:readonly
  bind:this={host}
  data-testid="code-editor"
  data-readonly={readonly}
></div>

<style>
  .editor {
    border: var(--border-w) solid var(--ink);
    background: var(--paper);
    min-height: 220px;
    font-size: 13px;
  }

  .editor :global(.cm-editor) {
    min-height: 220px;
  }

  .editor :global(.cm-focused) {
    outline: none;
  }

  .editor.readonly {
    background: var(--surface-muted, #f5f5f3);
  }
</style>
