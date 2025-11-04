import { openMenu } from '../ui/menu.ts';

const defaultEmoji = ['😀','😁','😂','🤣','😊','😍','🤔','👍','🔥','🎉','❤️','👏','🙏','😎','🤖','🐱','🍀','⚡'];

export function initEmojiPicker() {
  const button = document.getElementById('emoji-button');
  if (!button) return;
  button.addEventListener('click', (event) => {
    const rect = button.getBoundingClientRect();
    const menu = openMenu(rect.left, rect.bottom + window.scrollY, defaultEmoji.map((emoji) => ({
      label: emoji,
      onSelect: () => insertEmoji(emoji)
    })));
    menu.style.display = 'grid';
    menu.style.gridTemplateColumns = 'repeat(6, 1fr)';
  });
}

function insertEmoji(emoji) {
  const input = document.getElementById('message-input');
  if (!input) return;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const value = input.value;
  input.value = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
  input.selectionStart = input.selectionEnd = start + emoji.length;
  input.focus();
}
