import { AppEvents } from './AppEvents';
import { EmojiPicker } from './views/EmojiPicker';
import { PickerOptions, CustomEmoji, EmojiRecord } from './types';
import { ViewFactory } from './viewFactory';
export { LazyLoader } from './LazyLoader';
import { DataStore } from './data/DataStore';
import { initDatabase } from './data/emojiData';
import { Bundle } from './i18n/bundle';
import { getOptions } from './options';
import { createStyleInjector } from './injectStyles';

import css from './styles/index.css?inline';

function initData(options: PickerOptions): Promise<DataStore> {
  return initDatabase(options.locale, options.dataStore, options.messages, options.emojiData);
}

let pickerIndex = 0;

let emojiDataPromise;
let __lastLocale__;

function getPickerId() {
  return `picmo-${Date.now()}-${pickerIndex++}`;
}

const styleInject = createStyleInjector();

/**
 * Creates a new emoji picker.
 * @param options The options for the emoji picker.
 * @returns a Promise that resolves to the picker when it is ready.
 */
export function createPicker(options: Partial<PickerOptions>): EmojiPicker {
  styleInject(css);
  
  const finalOptions = getOptions(options);
  const customEmojis: EmojiRecord[] = (finalOptions?.custom || []).map((custom: CustomEmoji) => ({
    ...custom,
    custom: true,
    tags: ['custom', ...(custom.tags || [])]
  }));

  const events = new AppEvents();

  const isLocaleChange = __lastLocale__ !== finalOptions.locale
  if (!emojiDataPromise || isLocaleChange) {
    emojiDataPromise = initData(finalOptions);
    __lastLocale__ = finalOptions.locale
  }

  const i18n = new Bundle(finalOptions.i18n);

  emojiDataPromise.then(emojiData => {
    events.emit('data:ready', emojiData);
  }).catch(error => {
    events.emit('error', error);
  });

  const viewFactory = new ViewFactory({
    events,
    i18n,
    customEmojis,
    renderer: finalOptions.renderer,
    options: finalOptions,
    emojiData: emojiDataPromise,
    pickerId: getPickerId()
  });

  const picker = viewFactory.create(EmojiPicker);
  picker.renderSync();
  return picker;
}