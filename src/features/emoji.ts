const customPack = [
  { name: 'static', type: 'image', src: 'https://cdn.jsdelivr.net/gh/StaticQuasar931/Images@main/icon.png', label: 'Static logo' },
  { name: 'quasar', type: 'image', src: 'https://cdn.jsdelivr.net/gh/StaticQuasar931/Images@main/icon.png#glow', label: 'Quasar glow' },
  { name: '931', type: 'image', src: 'https://cdn.jsdelivr.net/gh/StaticQuasar931/Images@main/931.png', label: '931 streak' },
  { name: 'ping', type: 'emoji', char: '🔔', label: 'Ping bell' },
  { name: 'fire', type: 'emoji', char: '🔥', label: 'Fire' },
  { name: 'epic', type: 'emoji', char: '🚀', label: 'Epic rocket' },
  { name: 'quasarstorm', type: 'emoji', char: '⚡', label: 'Quasar Storm' }
];

const defaultEmoji = [
  '😀','😁','😂','🤣','😊','😍','🤔','👍','🔥','🎉','❤️','👏','🙏','😎','🤖','🐱','🍀','⚡','🥳','😴','😇','🤝','💡','📌','📎'
].map((char) => ({ name: `emoji_${char.codePointAt(0)}`, type: 'emoji', char, label: char }));

let serverEmoji = [];
let pickerPanel = null;
let activeTab = 'custom';

const shortcodeMap = new Map();

customPack.forEach((item) => {
  shortcodeMap.set(`:${item.name}:`, item);
});

defaultEmoji.forEach((item) => {
  shortcodeMap.set(`:${item.name}:`, item);
});

export function setServerEmoji(emojis = []) {
  serverEmoji = emojis.map((emoji) => {
    const normalized = typeof emoji === 'string' ? { name: emoji, type: 'emoji', char: emoji } : emoji;
    const code = `:${normalized.name || normalized.char || 'server'}:`;
    shortcodeMap.set(code, normalized);
    return normalized;
  });
}

export function initEmojiPicker() {
  const button = document.getElementById('emoji-button');
  if (!button) return;
  button.addEventListener('click', (event) => {
    event.preventDefault();
    togglePicker(button);
  });
}

function togglePicker(anchor) {
  if (pickerPanel) {
    pickerPanel.remove();
    pickerPanel = null;
    return;
  }
  pickerPanel = document.createElement('div');
  pickerPanel.className = 'emoji-picker-panel';
  pickerPanel.dataset.menu = 'open';

  const tabs = document.createElement('div');
  tabs.className = 'emoji-picker-tabs';
  const categories = getCategories();
  categories.forEach((category) => {
    const tab = document.createElement('button');
    tab.textContent = category.label;
    tab.classList.toggle('active', category.id === activeTab);
    tab.addEventListener('click', () => {
      activeTab = category.id;
      renderGrid(category);
      Array.from(tabs.children).forEach((child) => child.classList.toggle('active', child === tab));
    });
    tabs.appendChild(tab);
  });

  const grid = document.createElement('div');
  grid.className = 'emoji-picker-grid';
  pickerPanel.appendChild(tabs);
  pickerPanel.appendChild(grid);

  renderGrid(categories.find((cat) => cat.id === activeTab) || categories[0]);

  document.body.appendChild(pickerPanel);
  pickerPanel.addEventListener('click', (event) => event.stopPropagation());
  positionPanel(anchor, pickerPanel);

  setTimeout(() => {
    window.addEventListener('click', dismissPicker, { once: true });
  });

  function renderGrid(category) {
    grid.innerHTML = '';
    const list = category.get();
    list.forEach((emoji) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.code = `:${emoji.name || emoji.char}:`;
      button.dataset.emojiType = emoji.type;
      button.title = `:${emoji.name || emoji.char}:`;
      if (emoji.type === 'image') {
        const img = document.createElement('img');
        img.src = emoji.src;
        img.alt = emoji.label || emoji.name;
        button.appendChild(img);
      } else {
        button.textContent = emoji.char;
      }
      button.addEventListener('click', () => {
        insertEmoji(emoji);
        togglePicker(anchor);
      });
      grid.appendChild(button);
    });
  }
}

function getCategories() {
  return [
    { id: 'custom', label: 'Static Pack', get: () => customPack },
    { id: 'classic', label: 'Classic', get: () => defaultEmoji },
    { id: 'server', label: 'Server', get: () => (serverEmoji.length ? serverEmoji : defaultEmoji.slice(0, 12)) }
  ];
}

function positionPanel(anchor, panel) {
  const rect = anchor.getBoundingClientRect();
  const left = Math.min(rect.left, window.innerWidth - panel.offsetWidth - 16);
  const top = rect.bottom + 8 + window.scrollY;
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}

function dismissPicker() {
  pickerPanel?.remove();
  pickerPanel = null;
}

function insertEmoji(emoji) {
  const input = document.getElementById('message-input');
  if (!input) return;
  const start = input.selectionStart || 0;
  const end = input.selectionEnd || 0;
  const value = input.value;
  const insertValue = emoji.type === 'emoji' ? emoji.char : `:${emoji.name}:`;
  input.value = `${value.slice(0, start)}${insertValue}${value.slice(end)}`;
  const caret = start + insertValue.length;
  input.selectionStart = caret;
  input.selectionEnd = caret;
  input.focus();
}

export function replaceEmojiShortcodes(text) {
  if (!text) return text;
  return text.replace(/:[a-z0-9_]+:/gi, (match) => {
    const emoji = shortcodeMap.get(match);
    if (!emoji) return match;
    if (emoji.type === 'image') {
      const src = emoji.src.replace('#glow', '');
      const extraClass = emoji.src.includes('#glow') ? ' class="emoji-glow"' : '';
      return `<img src="${src}" alt="${match}"${extraClass} width="20" height="20" />`;
    }
    const char = emoji.char || match;
    return char;
  });
}
