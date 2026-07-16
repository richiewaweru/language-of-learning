<script lang="ts">
  import { onMount } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { python } from '@codemirror/lang-python';
  import { EditorState } from '@codemirror/state';

  let {
    value = '',
    onchange,
  }: {
    value?: string;
    onchange?: (next: string) => void;
  } = $props();

  let host: HTMLDivElement | undefined = $state();
  let view: EditorView | undefined;

  onMount(() => {
    if (!host) return;
    view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          python(),
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
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  });
</script>

<div class="editor" bind:this={host} data-testid="code-editor"></div>

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
</style>
